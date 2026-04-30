import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import { cookies } from "next/headers";
import { findUserByCredentials, verifyPassword } from "./user-store";

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

        const user = await findUserByCredentials(credentials.email);
        if (!user || !user.password) return null;

        if (!verifyPassword(credentials.password, user.password)) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role,
          isApproved: user.isApproved,
          ownerId: user.ownerId,
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
    async signIn({ user, account, profile }) {
      // Always allow sign-in. If it's a Google sign-in, we handle the linking in the jwt callback.
      return true;
    },
    async jwt({ token, account, user }) {
      // Check for manual linking cookie
      let linkUserId: string | undefined;
      try {
        linkUserId = cookies().get("linkUserId")?.value;
      } catch (e) {}

      // 1. Initial sign-in (Credentials or Google)
      if (user) {
        // If it's a credentials login, user is our DB user object
        if (account?.provider === "credentials") {
          token.role = (user as any).role || "TEAM_MEMBER";
          token.userId = user.id;
          token.username = (user as any).username;
          token.ownerId = (user as any).ownerId;
          token.isApproved = (user as any).isApproved;

          // Fetch linked google account tokens if they exist
          try {
            const googleAccount = await prisma.account.findFirst({
              where: { userId: user.id, provider: "google" }
            });
            if (googleAccount) {
              token.accessToken = googleAccount.access_token;
              token.refreshToken = googleAccount.refresh_token;
              token.accessTokenExpires = googleAccount.expires_at 
                ? googleAccount.expires_at * 1000 
                : undefined;
            }
          } catch (e) {
            console.error("Failed to fetch linked Google account for credential login:", e);
          }
        } 
        // If it's a Google login (either first time or linking)
        else if (account?.provider === "google") {
          // If we have a linking cookie, restore the user's original session details
          if (linkUserId) {
            try {
              const dbUser = await prisma.user.findUnique({ where: { id: linkUserId } });
              if (dbUser) {
                token.userId = dbUser.id;
                token.role = dbUser.role;
                token.username = dbUser.username;
                token.ownerId = dbUser.ownerId;
                token.isApproved = dbUser.isApproved;
                token.email = dbUser.email; // Preserve their DB email, not the generic Google email
              }
            } catch (e) {}
          }
          // If we don't have a userId yet, this is a Google-first login
          else if (!token.userId) {
            try {
              const dbUser = await prisma.user.findUnique({ where: { email: user.email?.toLowerCase() || "" } });
              if (dbUser) {
                token.userId = dbUser.id;
                token.role = dbUser.role;
                token.username = dbUser.username;
                token.ownerId = dbUser.ownerId;
                token.isApproved = dbUser.isApproved;
              }
            } catch (e) {}
          }
        }
      }

      // 1.5 FORCE APPROVAL FOR KEY ROLES & SPECIFIC ADMINS
      const isEliteEmail = token.email?.toLowerCase() === "rankved.business@gmail.com" || 
                           token.email?.toLowerCase() === "praveen261119@gmail.com";

      if (token.role === "AGENCY_OWNER" || token.role === "SUPER_ADMIN" || isEliteEmail) {
        token.isApproved = true;
        if (isEliteEmail) token.role = "SUPER_ADMIN";
      }


      // 2. Google OAuth linking (Triggered from Settings)
      if (account?.provider === "google") {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 3600 * 1000;

        if (token.userId) {
          // Persist token to DB for background jobs
          try {
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
                userId: token.userId as string,
              },
              create: {
                userId: token.userId as string,
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
          } catch (e) {
            console.error("Failed to link Google account in DB:", e);
          }
        }
      } 
      
      /* 
      // 3. Refresh user data from DB periodically (if not a fresh login/linking)
      // DISABLED: This causes 5+ second navigation lag on every click in serverless/cross-region setups.
      if (token.userId && !account) {
        try {
          const dbUser = await prisma.user.findUnique({ where: { id: token.userId as string } });
          if (dbUser) {
            token.isApproved = dbUser.isApproved;
            token.role = dbUser.role;
            token.username = dbUser.username;
            token.ownerId = dbUser.ownerId;
            // Forced Super Admin check for the specific email
            if (dbUser.email?.toLowerCase() === "rankved.business@gmail.com") {
              token.role = "SUPER_ADMIN";
              token.isApproved = true;
            }
          }
        } catch (e) {}
      }
      */

      // 4. Token expiration check and refresh
      if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

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
        (session as any).user.username = token.username;
        (session as any).user.isApproved = token.isApproved;
        (session as any).user.ownerId = token.ownerId;
        (session as any).tokenError = token.error;
      }
      return session;
    },
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
};
