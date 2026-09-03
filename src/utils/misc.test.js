import { describe, it, expect } from "vitest";
import { getPostLoginPath } from "./postLoginRedirect.js";
import { uint8ToBase64, base64ToUint8 } from "./metadataEmbedding.js";
import { computeBlobSha256Hex } from "./hash.js";

describe("getPostLoginPath", () => {
  it("defaults to /folders with no location state", () => {
    expect(getPostLoginPath(undefined)).toBe("/folders");
    expect(getPostLoginPath({})).toBe("/folders");
  });

  it("returns the originally requested protected route", () => {
    expect(getPostLoginPath({ state: { from: { pathname: "/statistics" } } })).toBe("/statistics");
  });

  it("never bounces back to /login or /", () => {
    expect(getPostLoginPath({ state: { from: { pathname: "/login" } } })).toBe("/folders");
    expect(getPostLoginPath({ state: { from: { pathname: "/" } } })).toBe("/folders");
  });
});

describe("base64 <-> Uint8Array round-trip", () => {
  it("survives a round trip", () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 255, 65, 66]);
    expect(base64ToUint8(uint8ToBase64(bytes))).toEqual(bytes);
  });

  it("handles an empty array", () => {
    expect(base64ToUint8(uint8ToBase64(new Uint8Array([])))).toEqual(new Uint8Array([]));
  });
});

describe("computeBlobSha256Hex", () => {
  it("returns the known SHA-256 of an empty blob", async () => {
    const hex = await computeBlobSha256Hex(new Blob([]));
    expect(hex).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });

  it("is stable for the same content", async () => {
    const a = await computeBlobSha256Hex(new Blob(["hello"]));
    const b = await computeBlobSha256Hex(new Blob(["hello"]));
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });
});
