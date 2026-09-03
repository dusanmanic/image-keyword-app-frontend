import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAuthToken, getAuthHeaders, fetchCurrentUser } from "./authService.js";

beforeEach(() => {
  localStorage.clear();
  vi.stubEnv("VITE_API_URL", "https://api.test");
});

describe("auth token helpers", () => {
  it("getAuthToken returns null when nothing is stored", () => {
    expect(getAuthToken()).toBe(null);
  });

  it("getAuthToken reads auth_token from localStorage", () => {
    localStorage.setItem("auth_token", "jwt-abc");
    expect(getAuthToken()).toBe("jwt-abc");
  });

  it("getAuthHeaders omits Authorization when there is no token", () => {
    expect(getAuthHeaders()).toEqual({});
  });

  it("getAuthHeaders adds a Bearer header when a token exists", () => {
    localStorage.setItem("auth_token", "jwt-abc");
    expect(getAuthHeaders()).toEqual({ Authorization: "Bearer jwt-abc" });
  });
});

describe("fetchCurrentUser", () => {
  it("returns the parsed body on 200", async () => {
    localStorage.setItem("auth_token", "jwt-abc");
    const body = { user: { email: "a@b.c" }, tosAccepted: true };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => body,
    }));

    const result = await fetchCurrentUser();
    expect(result).toEqual(body);

    const [url, opts] = fetch.mock.calls[0];
    expect(url).toBe("https://api.test/api/auth/me");
    expect(opts.headers.Authorization).toBe("Bearer jwt-abc");
  });

  it("throws UNAUTHORIZED on 401", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) }));
    await expect(fetchCurrentUser()).rejects.toThrow("UNAUTHORIZED");
  });

  it("on 404 clears stored auth and rejects", async () => {
    localStorage.setItem("auth_token", "jwt-abc");
    localStorage.setItem("auth_email", "a@b.c");
    // window.location.href assignment is a no-op in jsdom; just let it run
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) }));

    await expect(fetchCurrentUser()).rejects.toThrow(/User not found/);
    expect(localStorage.getItem("auth_token")).toBe(null);
    expect(localStorage.getItem("auth_email")).toBe(null);
  });
});
