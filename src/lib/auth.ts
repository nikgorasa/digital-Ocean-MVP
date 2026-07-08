import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",

  emailAndPassword: {
    enabled: true,
    sendVerificationEmail: true,
    sendResetPassword: async (data) => {
      const resetUrl = `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/reset-password?token=${data.token}`;
      await sendEmail({
        to: data.user.email,
        subject: "Reset your GoRASA password",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Password Reset Request</h2>
            <p>You requested a password reset for your GoRASA account.</p>
            <p><a href="${resetUrl}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a></p>
            <p style="color: #6b7280; font-size: 12px;">If you didn't request this, you can safely ignore this email. The link expires in 1 hour.</p>
          </div>
        `,
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async (data) => {
      const verifyUrl = `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/auth/verify-email?token=${data.token}&callbackURL=${encodeURIComponent("/")}`;
      await sendEmail({
        to: data.user.email,
        subject: "Verify your GoRASA account",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Welcome to GoRASA!</h2>
            <p>Please verify your email address to complete your registration.</p>
            <p><a href="${verifyUrl}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Verify Email</a></p>
            <p style="color: #6b7280; font-size: 12px;">If you didn't create an account, you can safely ignore this email.</p>
          </div>
        `,
      });
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "CUSTOMER",
      },
      companyId: {
        type: "string",
        required: false,
      },
      walletBalance: {
        type: "number",
        defaultValue: 0,
      },
      loyaltyPoints: {
        type: "number",
        defaultValue: 0,
      },
      loyaltyTier: {
        type: "string",
        defaultValue: "Silver",
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
