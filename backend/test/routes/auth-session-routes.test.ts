import assert from "node:assert/strict";
import { it } from "node:test";

import type { AppConfig } from "../../config/env";
import { makeApp } from "../../src/app";
import { makeContainer } from "../../src/container";

const config: AppConfig = {
  NODE_ENV: "test",
  HOST: "127.0.0.1",
  PORT: 3333,
  DB_HOST: "127.0.0.1",
  DB_PORT: 5432,
  DB_USER: "postgres",
  DB_PASSWORD: "postgres",
  DB_NAME: "crowdtube_test",
  FRONTEND_ORIGIN: "http://localhost:3000",
  AUTH_DOMAIN: "localhost:3000",
  AUTH_URI: "http://localhost:3000",
  AUTH_CHAIN_ID: 31_337,
  AUTH_NONCE_TTL_SECONDS: 300,
  AUTH_SESSION_TTL_SECONDS: 604_800,
  AUTH_SESSION_COOKIE_NAME: "crowdtube_session",
};

it("protects private routes and clears the cookie on logout", async () => {
  const app = await makeApp(config, makeContainer(config));

  try {
    const meResponse = await app.inject({ method: "GET", url: "/auth/me" });
    const adminResponse = await app.inject({
      method: "GET",
      url: "/admin/profile",
    });
    const logoutResponse = await app.inject({
      method: "POST",
      url: "/auth/logout",
    });

    assert.equal(meResponse.statusCode, 401);
    assert.equal(meResponse.json().error, "UNAUTHENTICATED");
    assert.equal(adminResponse.statusCode, 401);
    assert.equal(adminResponse.json().error, "UNAUTHENTICATED");
    assert.equal(logoutResponse.statusCode, 204);
    const setCookie = logoutResponse.headers["set-cookie"];
    assert.match(
      Array.isArray(setCookie) ? setCookie.join("; ") : (setCookie ?? ""),
      /crowdtube_session=;.*HttpOnly.*SameSite=Lax/,
    );
  } finally {
    await app.close();
  }
});
