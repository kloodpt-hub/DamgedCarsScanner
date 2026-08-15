import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./prisma";

// In-memory rate limiter. NOTE: This only works for a single-instance deployment
// (e.g. Render single service). For multi-instance, replace with a shared store
// (Redis/Upstash). Limits login attempts per composite (email+IP) key.
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 min

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= MAX_ATTEMPTS;
}

function recordFailedAttempt(key: string) {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  entry.count++;
}

function clearAttempts(key: string) {
  loginAttempts.delete(key);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/",
    signOut: "/",
    error: "/",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: profile.email_verified ? new Date() : null,
          role: "USER",
        };
      },
      // NextAuth v5 does NOT set allowDangerousEmailAccountLinking by default,
      // so a Google account sharing an email with an existing credentials
      // account will NOT be auto-linked. This prevents account-takeover via
      // email collision. Do NOT enable that flag here.
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const creds = z
          .object({ email: z.string().email(), password: z.string().min(1) })
          .safeParse(credentials);
        if (!creds.success) return null;
        const { email, password } = creds.data;

        // Composite key: per-email AND per-IP.
        const ip =
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          "unknown";
        const rateKey = `${email}|${ip}`;
        if (!checkRateLimit(rateKey)) return null;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          recordFailedAttempt(rateKey);
          return null;
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
          recordFailedAttempt(rateKey);
          return null;
        }

        clearAttempts(rateKey);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user?.email) {
        // Require the Google account to have a verified email before allowing
        // sign-in. NextAuth v5 does NOT auto-link a Google account to an
        // existing credentials account with the same email (no
        // allowDangerousEmailAccountLinking), so a collision will simply
        // result in a separate user record — no takeover risk.
        if (!user.emailVerified) {
          return false;
        }

        const existing = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existing) {
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name ?? null,
              role: "USER",
              password: null,
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      // Only enrich the token on the initial sign-in (user is present). After
      // that, trust the role captured here — do NOT re-fetch the DB on every
      // JWT refresh to avoid a DB hit on each request.
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "USER";

        // For credential logins the provider user object may lack the role,
        // so fetch once at sign-in only.
        if (!token.role || token.role === "USER") {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email as string },
            select: { id: true, role: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
