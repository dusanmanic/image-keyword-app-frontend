import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseTsvFile, getSalesData } from "./tsvService.js";

beforeEach(() => {
  localStorage.clear();
  vi.stubEnv("VITE_API_URL", "https://api.test");
});

describe("parseTsvFile", () => {
  it("POSTs the file to /tsv/parse and returns the body", async () => {
    const body = { success: true, data: { sales: [{ id: "1" }] } };
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, json: async () => body });
    vi.stubGlobal("fetch", fetchFn);

    const file = new File(["a\tb\n1\t2"], "report.tsv", { type: "text/tab-separated-values" });
    const result = await parseTsvFile(file);
    expect(result).toEqual(body);

    const [url, opts] = fetchFn.mock.calls[0];
    expect(url).toBe("https://api.test/tsv/parse");
    expect(opts.method).toBe("POST");
    expect(opts.body.get("tsv")).toBeInstanceOf(File);
  });

  it("throws the server error message on failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "bad header" }) }));
    const file = new File(["x"], "r.tsv");
    await expect(parseTsvFile(file)).rejects.toThrow("bad header");
  });
});

describe("getSalesData", () => {
  it("builds the query string and returns the result", async () => {
    const body = { success: true, data: { sales: [], stats: {}, pagination: {} } };
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, json: async () => body });
    vi.stubGlobal("fetch", fetchFn);

    await getSalesData({ limit: 50, page: 2 });
    const url = new URL(fetchFn.mock.calls[0][0]);
    expect(url.pathname).toBe("/tsv/sales");
    expect(url.searchParams.get("limit")).toBe("50");
    expect(url.searchParams.get("page")).toBe("2");
  });

  it("rejects a malformed response shape", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) }));
    await expect(getSalesData()).rejects.toThrow(/Invalid response format/);
  });

  it("rejects an HTTP error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }));
    await expect(getSalesData()).rejects.toThrow(/status: 500/);
  });
});
