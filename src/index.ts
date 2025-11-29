export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // POST /event - receive telemetry (stub)
    if (request.method === "POST" && url.pathname === "/event") {
      return new Response("ok", { status: 200 });
    }

    // GET /stats - return empty stats (stub)
    if (request.method === "GET" && url.pathname === "/stats") {
      return new Response("{}", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // GET /health - health check
    if (url.pathname === "/health") {
      return new Response("ok", { status: 200 });
    }

    return new Response("Not found", { status: 404 });
  },
};
