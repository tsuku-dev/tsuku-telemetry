export interface Env {
  ANALYTICS: AnalyticsEngineDataset;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // POST /event - receive telemetry
    if (request.method === "POST" && url.pathname === "/event") {
      try {
        const event = (await request.json()) as Record<string, unknown>;

        if (
          typeof event.recipe !== "string" ||
          typeof event.action !== "string"
        ) {
          return new Response("Bad request", {
            status: 400,
            headers: corsHeaders,
          });
        }

        env.ANALYTICS.writeDataPoint({
          blobs: [
            event.recipe,
            typeof event.version === "string" ? event.version : "unknown",
            typeof event.os === "string" ? event.os : "unknown",
            typeof event.arch === "string" ? event.arch : "unknown",
            typeof event.tsuku_version === "string"
              ? event.tsuku_version
              : "unknown",
            event.action,
          ],
          indexes: [event.recipe],
        });

        return new Response("ok", { status: 200, headers: corsHeaders });
      } catch {
        return new Response("Bad request", {
          status: 400,
          headers: corsHeaders,
        });
      }
    }

    // GET /stats - return empty stats (stub)
    if (request.method === "GET" && url.pathname === "/stats") {
      return new Response("{}", {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /health - health check
    if (url.pathname === "/health") {
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
  },
};
