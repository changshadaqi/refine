import GoogleProvider from "next-auth/providers/google";
import Auth0Provider from "next-auth/providers/auth0";
import KeycloakProvider from "next-auth/providers/keycloak";
import CredentialsProvider from "next-auth/providers/credentials";
import type { Awaitable, User } from "next-auth";

const requiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const authOptions = {
  // Configure one or more authentication providers
  providers: [
    GoogleProvider({
      clientId: requiredEnv("GOOGLE_CLIENT_ID"),
      clientSecret: requiredEnv("GOOGLE_CLIENT_SECRET"),
    }),
    Auth0Provider({
      clientId: requiredEnv("AUTH0_CLIENT_ID"),
      clientSecret: requiredEnv("AUTH0_CLIENT_SECRET"),
      issuer: requiredEnv("AUTH0_ISSUER"),
    }),
    KeycloakProvider({
      clientId: requiredEnv("KEYCLOAK_CLIENT_ID"),
      clientSecret: requiredEnv("KEYCLOAK_CLIENT_SECRET"),
      issuer: requiredEnv("KEYCLOAK_ISSUER"),
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name ?? profile.preferred_username,
          email: profile.email,
          image: "https://faces-img.xcdn.link/thumb-lorem-face-6312_thumb.jpg",
        };
      },
    }),
    CredentialsProvider({
      id: "CredentialsSignIn",
      credentials: {},
      async authorize(credentials: any) {
        // TODO: Request your API to check credentials
        console.log("CredentialsSignIn", JSON.stringify(credentials, null, 2));

        // check credentials
        // if not valid return null
        if (credentials?.["email"] !== "demo@refine.dev") {
          return null;
        }

        const user: Awaitable<User> = {
          id: "1",
          name: "John Doe",
          email: "demo@refine.dev",
          image: "https://i.pravatar.cc/300",
        };
        return user;
      },
    }),
    CredentialsProvider({
      id: "CredentialsSignUp",
      credentials: {},
      async authorize(credentials: any) {
        // TODO: Request your API to create new user
        console.log("CredentialsSignUp", JSON.stringify(credentials, null, 2));

        // return mocked user
        const user: Awaitable<User> = {
          id: "1",
          name: "John Doe",
          email: "demo@refine.dev",
          image: "https://i.pravatar.cc/300",
        };
        return user;
      },
    }),
  ],
  secret: requiredEnv("NEXTAUTH_SECRET"),
};

export default authOptions;
