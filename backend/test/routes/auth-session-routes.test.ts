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
  AWS_REGION: "us-east-1",
  AWS_S3_BUCKET_NAME: "crowdtube-test",
  AWS_S3_UPLOAD_URL_TTL_SECONDS: 300,
  AWS_S3_READ_URL_TTL_SECONDS: 300,
  CAMPAIGN_CONFIRMATIONS: 1,
  CAMPAIGN_LOG_BATCH_SIZE: 500,
  CAMPAIGN_INDEXER_POLL_MS: 10_000,
  DONATION_NOTIFICATION_POLL_MS: 10_000,
};

it("protects private routes and clears the cookie on logout", async () => {
  const app = await makeApp(config, makeContainer(config));

  try {
    const meResponse = await app.inject({ method: "GET", url: "/auth/me" });
    const adminResponse = await app.inject({
      method: "GET",
      url: "/admin/profile",
    });
    const updateAdminResponse = await app.inject({
      method: "PATCH",
      url: "/admin/profile",
      payload: { displayName: "Creator" },
    });
    const createMediaResponse = await app.inject({
      method: "POST",
      url: "/uploads/media",
      payload: {
        fileName: "avatar.png",
        contentType: "image/png",
        purpose: "profile-avatar",
      },
    });
    const invalidPublicMediaResponse = await app.inject({
      method: "GET",
      url: "/uploads/media",
    });
    const createCampaignResponse = await app.inject({
      method: "POST",
      url: "/admin/campaigns",
      payload: {
        title: "Open programming laboratory",
        category: "education",
        description: "Equipment for a new series of practical classes.",
        youtubeUrl: "https://youtube.com/@creator",
      },
    });
    const recordCreationTransactionResponse = await app.inject({
      method: "POST",
      url: "/admin/campaigns/c5b54171-8094-4235-a52b-7500633642d7/creation-transaction",
      payload: {
        chainId: 31_337,
        contractAddress: `0x${"a".repeat(40)}`,
        transactionHash: `0x${"b".repeat(64)}`,
      },
    });
    const listCampaignsResponse = await app.inject({
      method: "GET",
      url: "/admin/campaigns",
    });
    const listNotificationsResponse = await app.inject({
      method: "GET",
      url: "/admin/notifications",
    });
    const readNotificationsResponse = await app.inject({
      method: "PATCH",
      url: "/admin/notifications/read-all",
    });
    const readNotificationsPreflightResponse = await app.inject({
      method: "OPTIONS",
      url: "/admin/notifications/read-all",
      headers: {
        origin: config.FRONTEND_ORIGIN,
        "access-control-request-method": "PATCH",
      },
    });
    const analyticsResponse = await app.inject({
      method: "GET",
      url: "/admin/analytics",
    });
    const invalidPublicCampaignSearchResponse = await app.inject({
      method: "GET",
      url: "/campaigns?page=0",
    });
    const invalidPublicCampaignDetailsResponse = await app.inject({
      method: "GET",
      url: "/campaigns/not-a-uuid",
    });
    const logoutResponse = await app.inject({
      method: "POST",
      url: "/auth/logout",
    });

    assert.equal(meResponse.statusCode, 401);
    assert.equal(meResponse.json().error, "UNAUTHENTICATED");
    assert.equal(adminResponse.statusCode, 401);
    assert.equal(adminResponse.json().error, "UNAUTHENTICATED");
    assert.equal(updateAdminResponse.statusCode, 401);
    assert.equal(updateAdminResponse.json().error, "UNAUTHENTICATED");
    assert.equal(createMediaResponse.statusCode, 401);
    assert.equal(createMediaResponse.json().error, "UNAUTHENTICATED");
    assert.equal(invalidPublicMediaResponse.statusCode, 400);
    assert.equal(createCampaignResponse.statusCode, 401);
    assert.equal(recordCreationTransactionResponse.statusCode, 401);
    assert.equal(listCampaignsResponse.statusCode, 401);
    assert.equal(listNotificationsResponse.statusCode, 401);
    assert.equal(readNotificationsResponse.statusCode, 401);
    assert.equal(analyticsResponse.statusCode, 401);
    assert.equal(readNotificationsPreflightResponse.statusCode, 204);
    assert.equal(
      readNotificationsPreflightResponse.headers["access-control-allow-origin"],
      config.FRONTEND_ORIGIN,
    );
    assert.equal(
      readNotificationsPreflightResponse.headers[
        "access-control-allow-credentials"
      ],
      "true",
    );
    assert.match(
      readNotificationsPreflightResponse.headers[
        "access-control-allow-methods"
      ] ?? "",
      /PATCH/,
    );
    assert.equal(invalidPublicCampaignSearchResponse.statusCode, 400);
    assert.equal(invalidPublicCampaignDetailsResponse.statusCode, 400);
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
