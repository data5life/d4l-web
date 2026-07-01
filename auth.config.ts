import type { NextAuthConfig } from 'next-auth';

// Edge-compatible auth configuration for middleware
// This file cannot import providers that require Node.js runtime (like Nodemailer)
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'database' as const,
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname === '/login';
      const isAuthRoute = nextUrl.pathname.startsWith('/api/auth');

      // Allow auth API routes
      if (isAuthRoute) {
        return true;
      }

      // Allow login page access
      if (isOnLogin) {
        return true;
      }

      // Redirect unauthenticated users to login
      if (!isLoggedIn) {
        return false; // Will redirect to signIn page
      }

      return true;
    },
  },
  providers: [], // Providers are added in auth.ts
} satisfies NextAuthConfig;
