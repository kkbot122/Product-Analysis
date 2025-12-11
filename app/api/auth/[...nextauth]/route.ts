// app/api/auth/[...nextauth]/route.ts
import NextAuth, { AuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";

const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Email/Password provider
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          },
          include: {
            orgUsers: {
              include: {
                organization: true
              }
            }
          }
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          // Include organization info in the session
          organization: user.orgUsers[0]?.organization
        };
      }
    }),
    
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    
    // GitHub OAuth
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/signin",
    signUp: "/signup",
    error: "/signin",
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        // Add organization to session if available
        if (token.organization) {
          (session as any).organization = token.organization;
        }
      }
      return session;
    },
    async jwt({ token, user, account, profile, isNewUser }) {
      if (user) {
        token.id = user.id;
        
        // If it's a new user from OAuth, create organization and link
        if (isNewUser && user.email) {
          try {
            const org = await prisma.organization.create({
              data: {
                name: `${user.name || user.email.split('@')[0]}'s Organization`,
                users: {
                  create: {
                    email: user.email,
                    role: "ADMIN",
                  },
                },
              },
            });

            // Create default project
            await prisma.project.create({
              data: {
                name: "Default Project",
                apiKey: `proj_${Math.random().toString(36).substring(2, 15)}`,
                organizationId: org.id,
              },
            });

            token.organization = org;
          } catch (error) {
            console.error("Error creating organization for new user:", error);
          }
        }
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after successful sign in
      if (url.startsWith(baseUrl)) {
        return `${baseUrl}/dashboard`;
      }
      return baseUrl;
    }
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };