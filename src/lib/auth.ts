import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import { findUserByEmail, verifyPassword } from "./user-store";

async function refreshAccessToken(token: any) {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshed = await response.json();

    if (!response.ok) throw refreshed;

    return {
      ...token,
      accessToken: refreshed.access_token,
      accessTokenExpires: Date.now() + refreshed.expires_in * 1000,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions: NextAuthOptions = {
  // No PrismaAdapter — we manually upsert users in the JWT callback
  // to avoid @auth/prisma-adapter v2 incompatibility with next-auth v4
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await findUserByEmail(credentials.email);
        if (!user) return null;

        if (!verifyPassword(credentials.password, user.password)) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isApproved: user.isApproved,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope:
            "openid email profile https://www.googleapis.com/auth/business.manage",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (user) {
        token.role = (user as any).role || "TEAM";
        token.userId = user.id;
      }

      // First-time Google sign-in or routine refresh — ensure we have up-to-date DB state
      if (account?.provider === "google" && user?.email) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 3600 * 1000;

        const isSuperAdmin = user.email.toLowerCase() === "rankved.business@gmail.com";
        const assignedRole = isSuperAdmin ? "SUPER_ADMIN" : "USER";
        const initialApprovedState = isSuperAdmin ? true : false;
        token.role = assignedRole;

        // Upsert the Google user into our DB so FK constraints work
        try {
          const dbUser = await prisma.user.upsert({
            where: { email: user.email },
            update: { name: user.name ?? undefined, role: assignedRole },
            create: {
              name: user.name,
              email: user.email,
              image: user.image,
              role: assignedRole,
              isApproved: initialApprovedState,
            },
          });
          token.userId = dbUser.id;
          token.isApproved = dbUser.isApproved;

          // ✅ Persist Google OAuth tokens to Account table so cron job can use them
          if (account.access_token && account.providerAccountId) {
            await prisma.account.upsert({
              where: {
                provider_providerAccountId: {
                  provider: "google",
                  providerAccountId: account.providerAccountId,
                },
              },
              update: {
                access_token: account.access_token,
                refresh_token: account.refresh_token ?? undefined,
                expires_at: account.expires_at ?? undefined,
                token_type: account.token_type ?? undefined,
                scope: account.scope ?? undefined,
                id_token: account.id_token ?? undefined,
              },
              create: {
                userId: dbUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token ?? undefined,
                expires_at: account.expires_at ?? undefined,
                token_type: account.token_type ?? undefined,
                scope: account.scope ?? undefined,
                id_token: account.id_token ?? undefined,
              },
            });
            console.log("[Auth] Persisted Google tokens for user:", dbUser.email);
          }
        } catch (e) {
          console.error("Failed to upsert Google user/account in DB:", e);
        }
      } else if (token.userId) {
        // Just keep the token.isApproved synced if not a fresh Google login
        try {
          const dbUser = await prisma.user.findUnique({ where: { id: token.userId as string } });
          if (dbUser) {
             const isSuperAdmin = dbUser.email?.toLowerCase() === "rankved.business@gmail.com";
             token.isApproved = isSuperAdmin ? true : dbUser.isApproved;
             token.role = isSuperAdmin ? "SUPER_ADMIN" : dbUser.role;
          }
        } catch (e) {}
      }

      // If token hasn't expired, return as-is
      if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Token expired — refresh it
      if (token.refreshToken) {
        return await refreshAccessToken(token);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session as any).accessToken = token.accessToken;
        (session as any).user.role = token.role;
        (session as any).user.id = token.userId;
        (session as any).user.isApproved = token.isApproved;
        (session as any).tokenError = token.error;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
