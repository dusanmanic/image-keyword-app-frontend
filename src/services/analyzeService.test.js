import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeImage } from "./analyzeService.js";

beforeEach(() => {
  localStorage.clear();
  vi.stubEnv("VITE_API_URL", "https://api.test");
});

function mockOk(body) {
  const fn = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => body });
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("analyzeImage", () => {
  const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "image/jpeg" });

  it("POSTs multipart to /api/analyze/analyze and returns the JSON", async () => {
    const fetchFn = mockOk({ title: "T", description: "D", keywords: ["a"], gettyKeywords: [] });

    const result = await analyzeImage(blob, 20, "  focus on colour  ", { gettyMode: "max" });
    expect(result).toEqual({ title: "T", description: "D", keywords: ["a"], gettyKeywords: [] });

    const [url, opts] = fetchFn.mock.calls[0];
    expect(url).toBe("https://api.test/api/analyze/analyze");
    expect(opts.method).toBe("POST");
    expect(opts.body).toBeInstanceOf(FormData);
    expect(opts.body.get("maxKeywords")).toBe("20");
    expect(opts.body.get("prompt")).toBe("focus on colour");
    expect(opts.body.get("gettyMode")).toBe("max");
    expect(opts.body.get("image")).toBeInstanceOf(Blob);
  });

  it("omits prompt and gettyMode when not provided", async () => {
    const fetchFn = mockOk({ title: "", description: "", keywords: [] });
    await analyzeImage(blob);
    const opts = fetchFn.mock.calls[0][1];
    expect(opts.body.get("prompt")).toBe(null);
    expect(opts.body.get("gettyMode")).toBe(null);
    expect(opts.body.get("maxKeywords")).toBe("30");
  });

  it("adds the Bearer header when a token is stored", async () => {
    localStorage.setItem("auth_token", "jwt-xyz");
    const fetchFn = mockOk({});
    await analyzeImage(blob);
    expect(fetchFn.mock.calls[0][1].headers.Authorization).toBe("Bearer jwt-xyz");
  });

  it("throws with the status code on a non-OK response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({}) }));
    await expect(analyzeImage(blob)).rejects.toThrow("Analysis failed: 403");
  });
});
