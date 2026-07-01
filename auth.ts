import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Nodemailer from 'next-auth/providers/nodemailer';
import { createTransport } from 'nodemailer';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { authConfig } from './auth.config';

/** @public */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'database',
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier, url, provider }) {
        const transport = createTransport(provider.server);
        await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject: 'Sign in to D4L Collect',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #7c3aed, #6d28d9); padding: 24px 32px; border-radius: 16px 16px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 20px;">Sign in to D4L Collect</h1>
              </div>
              <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                  Click the button below to sign in. This link is valid for <strong>24 hours</strong> and can only be used once.
                </p>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${url}"
                     style="display: inline-block; padding: 12px 32px; background: #7c3aed; color: white;
                            text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;">
                    Sign In
                  </a>
                </div>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="color: #7c3aed; font-size: 13px; word-break: break-all;">${url}</p>
                <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
                  If you did not request this email, you can safely ignore it.
                </p>
              </div>
            </div>
          `,
          text: `Sign in to D4L Collect\n\nClick the link below to sign in:\n${url}\n\nThis link is valid for 24 hours and can only be used once.\n\nIf you did not request this email, you can safely ignore it.`,
        });
      },
    }),
  ],
});
