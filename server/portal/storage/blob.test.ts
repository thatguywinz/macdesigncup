// @vitest-environment node
// The Vercel Blob driver can't reach a real store in tests, so the one network
// call (issueSignedToken) is stubbed with a delegation token of the real
// format; everything else (presignUrl's HMAC signing) is the real SDK. This
// checks the payload we hand the browser rebuilds the SDK's own presigned URL.
import { describe, expect, it, vi } from "vitest";

const delegation = {
  delegationToken: `${Buffer.from(
    JSON.stringify({ storeId: "store_test123", pathname: "*", operations: ["get", "put"], validUntil: Date.now() + 3600_000 }),
  ).toString("base64url")}.sig`,
  clientSigningToken: "client-signing-secret",
  validUntil: Date.now() + 3600_000,
};

vi.mock("@vercel/blob", async (orig) => {
  const real = await orig<typeof import("@vercel/blob")>();
  return { ...real, issueSignedToken: vi.fn(async () => delegation) };
});

const { presignUrl } = await import("@vercel/blob");
const { BlobStorage } = await import("./blob");

describe("BlobStorage presigning", () => {
  it("hands the browser exactly the SDK's presigned PUT", async () => {
    const s = new BlobStorage();
    const payload = await s.presignPutPayload("portal/files/abc/x-model.glb", 80 * 1024 * 1024, 600, "model/gltf-binary");
    expect(payload.delegationToken).toBe(delegation.delegationToken);
    expect(payload.signature).toMatch(/^[A-Za-z0-9_-]{20,}$/);
    expect(Object.keys(payload.params).every((k) => k.startsWith("vercel-blob-"))).toBe(true);
    expect(Object.values(payload.params)).toContain(String(80 * 1024 * 1024));

    // Rebuild the URL the way the SDK's client does and compare with presignUrl's own.
    const { presignedUrl } = await presignUrl(delegation, {
      operation: "put",
      pathname: "portal/files/abc/x-model.glb",
      access: "private",
      maximumSizeInBytes: 80 * 1024 * 1024,
      allowedContentTypes: ["model/gltf-binary"],
      allowOverwrite: false,
      addRandomSuffix: false,
      validUntil: Number(payload.params["vercel-blob-valid-until"]),
    });
    const expected = new URL(presignedUrl);
    expect(expected.searchParams.get("vercel-blob-signature")).toBe(payload.signature);
    for (const [k, v] of Object.entries(payload.params)) expect(expected.searchParams.get(k)).toBe(v);
  });

  it("signs short-lived private GET URLs on the store host", async () => {
    const url = new URL(await new BlobStorage().signedGetUrl("portal/files/abc/x-model.glb", 300));
    // The SDK drops the store_ prefix from the host.
    expect(url.host).toBe("test123.private.blob.vercel-storage.com");
    expect(url.pathname).toBe("/portal/files/abc/x-model.glb");
    expect(url.searchParams.get("vercel-blob-signature")).toBeTruthy();
  });
});

describe("Blob quirks", () => {
  it("turns the CDN's weak ETag into the strong one ifMatch needs", async () => {
    const { strongEtag } = await import("./blob");
    expect(strongEtag('W/"d354e9d16b78b702a9b94544f98b6311"')).toBe('"d354e9d16b78b702a9b94544f98b6311"');
    expect(strongEtag('"abc"')).toBe('"abc"');
  });

  it("keeps preview and development data out of production's paths", async () => {
    const { namespace, filePath } = await import("../db");
    const saved = { ...process.env };
    try {
      delete process.env.PORTAL_NAMESPACE;
      process.env.VERCEL_ENV = "production";
      expect(namespace()).toBe("");
      expect(filePath("e1", "f1", "glb")).toBe("portal/files/e1/f1.glb");
      process.env.VERCEL_ENV = "preview";
      expect(filePath("e1", "f1", "glb")).toBe("preview/portal/files/e1/f1.glb");
      process.env.PORTAL_NAMESPACE = "test-run";
      expect(namespace()).toBe("test-run/");
    } finally {
      process.env = saved;
    }
  });
});
