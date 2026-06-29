"use server";

import { prisma } from "@aura/db";
import bcrypt from "bcrypt";
import { z } from "zod";
import crypto from "crypto";
import nodemailer from "nodemailer";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function register(formData: FormData) {
  try {
    const data = Object.fromEntries(formData.entries());
    const validatedData = registerSchema.safeParse(data);

    if (!validatedData.success) {
      return { error: "Invalid fields." };
    }

    const { name, email, password } = validatedData.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "User already exists with this email." };
    }

    const password_hash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        name,
        email,
        password_hash,
        updated_at: new Date(),
      },
    });

    return { success: "Account created! You can now log in." };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "Something went wrong." };
  }
}

export async function forgotPassword(formData: FormData) {
  try {
    const email = formData.get("email") as string;
    
    if (!email || !z.string().email().safeParse(email).success) {
      return { error: "Invalid email." };
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success even if user doesn't exist for security
      return { success: "If an account exists, a reset link was sent." };
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expires,
      },
    });

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Aura Proxy" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Aura Proxy - Reset your password",
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
    });

    return { success: "If an account exists, a reset link was sent." };
  } catch (error) {
    console.error("Forgot password error:", error);
    return { error: "Failed to send reset email." };
  }
}

export async function resetPassword(formData: FormData, token: string) {
  try {
    const password = formData.get("password") as string;
    
    if (!password || password.length < 6) {
      return { error: "Password must be at least 6 characters." };
    }

    const existingToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!existingToken) {
      return { error: "Invalid token." };
    }

    if (new Date(existingToken.expires) < new Date()) {
      return { error: "Token has expired." };
    }

    const password_hash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email: existingToken.email },
      data: { password_hash },
    });

    await prisma.passwordResetToken.delete({
      where: { id: existingToken.id },
    });

    return { success: "Password successfully reset! You can now log in." };
  } catch (error) {
    console.error("Reset password error:", error);
    return { error: "Something went wrong." };
  }
}
