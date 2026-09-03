import { describe, it, expect, vi, afterEach } from "vitest";
import { getApiBaseUrl } from "./api.js";

afterEach(() => vi.unstubAllEnvs());

describe("getApiBaseUrl", () => {
  it("returns VITE_API_URL when it is set", () => {
    vi.stubEnv("VITE_API_URL", "https://api.example.com");
    expect(getApiBaseUrl()).toBe("https://api.example.com");
  });

  it("returns an empty string (proxy mode) when VITE_API_URL is empty", () => {
    vi.stubEnv("VITE_API_URL", "");
    expect(getApiBaseUrl()).toBe("");
  });
});
