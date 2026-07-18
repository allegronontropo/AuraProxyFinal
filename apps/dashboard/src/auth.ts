import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { prisma } from "@aura/db";
import bcrypt from "bcrypt";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    GitHub({ allowDangerousEmailAccountLinking: true }),
    Google({ allowDangerousEmailAccountLinking: true }),
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = loginSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { email, password } = parsedCredentials.data;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password_hash) {
          return null;
        }

        if (!user.isActive) {
          throw new Error("Account has been suspended.");
        }

        const passwordsMatch = await bcrypt.compare(password, user.password_hash);

        if (passwordsMatch) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            plan: user.plan,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.plan = user.plan;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { isActive: true },
          });
          if (dbUser) {
            session.user.isActive = dbUser.isActive;
          } else {
            session.user.isActive = false;
          }
        } catch (error) {
          console.error("[NextAuth] Failed to verify user status in DB. Assuming active to prevent random 401s.", error);
          session.user.isActive = true;
        }
      }
      if (token.role && session.user) {
        session.user.role = token.role as string;
      }
      if (token.plan && session.user) {
        session.user.plan = token.plan as string;
      }
      return session;
    },
  },
});
