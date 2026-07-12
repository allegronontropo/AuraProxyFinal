"use server";

import { prisma } from "@aura/db";
import { auth } from "@/auth";
import bcrypt from "bcrypt";
import { z } from "zod";
import crypto from "crypto";
import nodemailer from "nodemailer";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      throw new Error('NEXT_PUBLIC_APP_URL is not configured.');
    }

    const resetLink = `${appUrl.replace(/\/+$/, '')}/reset-password?token=${token}`;

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
      throw new Error('SMTP configuration is incomplete. Please set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASSWORD.');
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
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

    // Get user to check current password and reset count
    const user = await prisma.user.findUnique({
      where: { email: existingToken.email },
    });

    if (!user) {
      return { error: "User not found." };
    }

    // Check if trying to set the same password
    if (user.password_hash) {
      const isSamePassword = await bcrypt.compare(password, user.password_hash);
      if (isSamePassword) {
        return { error: "New password must be different from the current password." };
      }
    }

    // Check password reset limit (3 per week)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentResets = await prisma.passwordResetToken.count({
      where: {
        email: existingToken.email,
        expires: { gte: oneWeekAgo },
      },
    });

    // Also count successful password updates in the last week
    const recentPasswordUpdates = await prisma.user.findMany({
      where: {
        email: existingToken.email,
        updated_at: { gte: oneWeekAgo },
      },
      select: { password_hash: true },
    });

    const totalRecentChanges = recentResets + recentPasswordUpdates.filter(u => u.password_hash).length;
    
    if (totalRecentChanges >= 3) {
      return { error: "Password reset limit reached. Please try again in 24 hours." };
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

export async function updatePassword(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in to update your password." };
    }

    const data = Object.fromEntries(formData.entries());
    const validatedData = updatePasswordSchema.safeParse(data);

    if (!validatedData.success) {
      return { error: validatedData.error.errors[0]?.message || "Invalid fields." };
    }

    const { currentPassword, newPassword, confirmPassword } = validatedData.data;

    if (newPassword !== confirmPassword) {
      return { error: "New passwords do not match." };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password_hash: true },
    });

    if (!user) {
      return { error: "User not found." };
    }

    if (user.password_hash) {
      if (!currentPassword) {
        return { error: "Current password is required." };
      }

      const passwordsMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!passwordsMatch) {
        return { error: "Current password is incorrect." };
      }
    }

    const password_hash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash },
    });

    return {
      success: user.password_hash
        ? "Password updated successfully."
        : "Password created successfully.",
    };
  } catch (error) {
    console.error("Update password error:", error);
    return { error: "Something went wrong." };
  }
}
