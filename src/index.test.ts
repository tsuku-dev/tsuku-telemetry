import { describe, it, expect } from "vitest";
import { SELF } from "cloudflare:test";

describe("tsuku-telemetry worker", () => {
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
    it("returns empty JSON", async () => {
      const response = await SELF.fetch("http://localhost/stats");
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(await response.json()).toEqual({});
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
