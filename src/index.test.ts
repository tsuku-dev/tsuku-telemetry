import { describe, it, expect } from "vitest";
import { SELF } from "cloudflare:test";

describe("tsuku-telemetry worker", () => {
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
    it("returns ok", async () => {
      const response = await SELF.fetch("http://localhost/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe: "test", action: "install" }),
      });
      expect(response.status).toBe(200);
      expect(await response.text()).toBe("ok");
    });
  });

  describe("unknown routes", () => {
    it("returns 404 for unknown paths", async () => {
      const response = await SELF.fetch("http://localhost/unknown");
      expect(response.status).toBe(404);
    });
  });
});
