import { Authenticator } from "remix-auth";
import { Auth0Strategy } from "remix-auth-auth0";
import { GoogleStrategy } from "remix-auth-google";
import { KeycloakStrategy } from "remix-auth-keycloak";
import { FormStrategy } from "remix-auth-form";

import { sessionStorage } from "~/services/session.server";

const requiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

// Create an instance of the authenticator, pass a generic with what your
// strategies will return and will be stored in the session
export const authenticator = new Authenticator<{}>(sessionStorage);

const auth0Strategy = new Auth0Strategy(
  {
    callbackURL: requiredEnv("AUTH0_CALLBACK_URL"),
    clientID: requiredEnv("AUTH0_CLIENT_ID"),
    clientSecret: requiredEnv("AUTH0_CLIENT_SECRET"),
    domain: requiredEnv("AUTH0_DOMAIN"),
  },
  async ({ accessToken, extraParams, profile, refreshToken }) => {
    const { id, displayName, photos } = profile;
    return Promise.resolve({
      id,
      name: displayName,
      avatar: photos?.[0]?.value,
    });
  },
);

const googleStrategy = new GoogleStrategy(
  {
    callbackURL: requiredEnv("GOOGLE_CALLBACK_URL"),
    clientID: requiredEnv("GOOGLE_CLIENT_ID"),
    clientSecret: requiredEnv("GOOGLE_CLIENT_SECRET"),
  },
  async ({ accessToken, extraParams, profile, refreshToken, context }) => {
    const { id, displayName, photos } = profile;
    return Promise.resolve({
      id,
      name: displayName,
      avatar: photos?.[0]?.value,
    });
  },
);

const keycloakStrategy = new KeycloakStrategy(
  {
    useSSL: true,
    domain: requiredEnv("KEYCLOAK_DOMAIN"),
    realm: requiredEnv("KEYCLOAK_REALM"),
    clientID: requiredEnv("KEYCLOAK_CLIENT_ID"),
    clientSecret: requiredEnv("KEYCLOAK_CLIENT_SECRET"),
    callbackURL: requiredEnv("KEYCLOAK_CALLBACK_URL"),
  },
  async ({ accessToken, extraParams, profile, refreshToken, context }) => {
    const { id, displayName, photos } = profile;
    return Promise.resolve({
      id,
      name: displayName,
      avatar: "https://faces-img.xcdn.link/thumb-lorem-face-6312_thumb.jpg",
    });
  },
);

const formStrategy = new FormStrategy(async ({ form }) => {
  console.log("--| FormData", form.get("email"), form.get("password"));
  // TODO: Check credentials on your api
  return Promise.resolve({
    id: 1,
    name: "John Doe",
    avatar: "https://faces-img.xcdn.link/thumb-lorem-face-6312_thumb.jpg",
  });
});

authenticator.use(auth0Strategy);
authenticator.use(googleStrategy);
authenticator.use(keycloakStrategy);
authenticator.use(formStrategy, "user-pass");
