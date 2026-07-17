import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    plan?: string;
    isActive?: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      plan: string;
      isActive: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    plan?: string;
  }
}
