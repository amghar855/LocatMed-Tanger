import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

function resolveAuthSecret() {
  const envSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (envSecret) return envSecret;

  if (process.env.NODE_ENV !== "production") {
    return "locatomed-dev-auth-secret";
  }

  throw new Error("Missing auth secret. Define AUTH_SECRET (or NEXTAUTH_SECRET) in your environment.");
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  secret: resolveAuthSecret(),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role;
        token.uid = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.uid as string;
        session.user.role = token.role as "patient" | "doctor" | "pharmacist";
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  session: { strategy: "jwt" },
});
