import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SELF, fetchMock } from "cloudflare:test";

describe("tsuku-telemetry worker", () => {
  beforeEach(() => {
    fetchMock.activate();
    fetchMock.disableNetConnect();
  });

  afterEach(() => {
    fetchMock.deactivate();
  });

  describe("CORS", () => {
    it("handles OPTIONS preflight requests", async () => {
      const response = await SELF.fetch("http://localhost/event", {
        method: "OPTIONS",
      });
      expect(response.status).toBe(200);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
        "GET, POST, OPTIONS"
      );
    });

    it("includes CORS headers on all responses", async () => {
      const response = await SELF.fetch("http://localhost/health");
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    });
  });

  describe("GET /health", () => {
    it("returns ok", async () => {
      const response = await SELF.fetch("http://localhost/health");
      expect(response.status).toBe(200);
      expect(await response.text()).toBe("ok");
    });
  });

  describe("GET /stats", () => {
    it("returns aggregated statistics", async () => {
      // Mock the Analytics Engine API responses
      fetchMock
        .get("https://api.cloudflare.com")
        .intercept({
          path: /\/client\/v4\/accounts\/.*\/analytics_engine\/sql/,
          method: "POST",
        })
        .reply(
          200,
          JSON.stringify({
            data: [
              { recipe: "nodejs", installs: 100, updates: 10 },
              { recipe: "terraform", installs: 50, updates: 5 },
            ],
            meta: [],
            rows: 2,
          })
        )
        .times(1);

      fetchMock
        .get("https://api.cloudflare.com")
        .intercept({
          path: /\/client\/v4\/accounts\/.*\/analytics_engine\/sql/,
          method: "POST",
        })
        .reply(
          200,
          JSON.stringify({
            data: [
              { os: "linux", count: 100 },
              { os: "darwin", count: 50 },
            ],
            meta: [],
            rows: 2,
          })
        )
        .times(1);

      fetchMock
        .get("https://api.cloudflare.com")
        .intercept({
          path: /\/client\/v4\/accounts\/.*\/analytics_engine\/sql/,
          method: "POST",
        })
        .reply(
          200,
          JSON.stringify({
            data: [
              { arch: "amd64", count: 120 },
              { arch: "arm64", count: 30 },
            ],
            meta: [],
            rows: 2,
          })
        )
        .times(1);

      const response = await SELF.fetch("http://localhost/stats");
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json");

      const stats = (await response.json()) as {
        generated_at: string;
        period: string;
        total_installs: number;
        recipes: { name: string; installs: number; updates: number }[];
        by_os: Record<string, number>;
        by_arch: Record<string, number>;
      };

      expect(stats.generated_at).toBeDefined();
      expect(stats.period).toBe("all_time");
      expect(stats.total_installs).toBe(150);
      expect(stats.recipes).toHaveLength(2);
      expect(stats.recipes[0]).toEqual({
        name: "nodejs",
        installs: 100,
        updates: 10,
      });
      expect(stats.by_os).toEqual({ linux: 100, darwin: 50 });
      expect(stats.by_arch).toEqual({ amd64: 120, arm64: 30 });
    });

    it("returns 500 on API error", async () => {
      fetchMock
        .get("https://api.cloudflare.com")
        .intercept({
          path: /\/client\/v4\/accounts\/.*\/analytics_engine\/sql/,
          method: "POST",
        })
        .reply(401, "Unauthorized");

      const response = await SELF.fetch("http://localhost/stats");
      expect(response.status).toBe(500);

      const error = (await response.json()) as { error: string };
      expect(error.error).toContain("Analytics Engine query failed");
    });
  });

  describe("POST /event", () => {
    it("returns ok for valid event", async () => {
      const response = await SELF.fetch("http://localhost/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe: "test", action: "install" }),
      });
      expect(response.status).toBe(200);
      expect(await response.text()).toBe("ok");
    });

    it("returns ok with all optional fields", async () => {
      const response = await SELF.fetch("http://localhost/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe: "nodejs",
          action: "install",
          version: "22.0.0",
          os: "linux",
          arch: "amd64",
          tsuku_version: "0.3.0",
        }),
      });
      expect(response.status).toBe(200);
      expect(await response.text()).toBe("ok");
    });

    it("returns 400 for missing recipe", async () => {
      const response = await SELF.fetch("http://localhost/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "install" }),
      });
      expect(response.status).toBe(400);
    });

    it("returns 400 for missing action", async () => {
      const response = await SELF.fetch("http://localhost/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe: "test" }),
      });
      expect(response.status).toBe(400);
    });

    it("returns 400 for invalid JSON", async () => {
      const response = await SELF.fetch("http://localhost/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      });
      expect(response.status).toBe(400);
    });

    it("returns 400 for non-string recipe", async () => {
      const response = await SELF.fetch("http://localhost/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe: 123, action: "install" }),
      });
      expect(response.status).toBe(400);
    });
  });

  describe("unknown routes", () => {
    it("returns 404 for unknown paths", async () => {
      const response = await SELF.fetch("http://localhost/unknown");
      expect(response.status).toBe(404);
    });
  });
});
