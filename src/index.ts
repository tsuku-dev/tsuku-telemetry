export interface Env {
  ANALYTICS: AnalyticsEngineDataset;
  CF_ACCOUNT_ID: string;
  CF_API_TOKEN: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

interface AnalyticsRow {
  [key: string]: string | number;
}

interface AnalyticsResponse {
  data: AnalyticsRow[];
  meta: { name: string; type: string }[];
  rows: number;
}

async function queryAnalyticsEngine(
  env: Env,
  sql: string
): Promise<AnalyticsRow[]> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/analytics_engine/sql`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CF_API_TOKEN}`,
        "Content-Type": "text/plain",
      },
      body: sql,
    }
  );

  if (!response.ok) {
    throw new Error(`Analytics Engine query failed: ${response.status}`);
  }

  const result = (await response.json()) as AnalyticsResponse;
  return result.data || [];
}

interface StatsResponse {
  generated_at: string;
  period: string;
  total_installs: number;
  recipes: { name: string; installs: number; updates: number }[];
  by_os: Record<string, number>;
  by_arch: Record<string, number>;
}

async function getStats(env: Env): Promise<StatsResponse> {
  // Query for total installs and recipe breakdown
  const recipeQuery = `
    SELECT blob1 as recipe,
           sum(if(blob6 = 'install', 1, 0)) as installs,
           sum(if(blob6 = 'update', 1, 0)) as updates
    FROM tsuku_telemetry
    GROUP BY blob1
    ORDER BY installs DESC
    LIMIT 20
  `;

  // Query for OS breakdown
  const osQuery = `
    SELECT blob3 as os, count() as count
    FROM tsuku_telemetry
    WHERE blob6 = 'install'
    GROUP BY blob3
  `;

  // Query for architecture breakdown
  const archQuery = `
    SELECT blob4 as arch, count() as count
    FROM tsuku_telemetry
    WHERE blob6 = 'install'
    GROUP BY blob4
  `;

  const [recipeData, osData, archData] = await Promise.all([
    queryAnalyticsEngine(env, recipeQuery),
    queryAnalyticsEngine(env, osQuery),
    queryAnalyticsEngine(env, archQuery),
  ]);

  // Calculate total installs from recipe data
  const totalInstalls = recipeData.reduce(
    (sum, row) => sum + (Number(row.installs) || 0),
    0
  );

  // Transform recipe data
  const recipes = recipeData.map((row) => ({
    name: String(row.recipe),
    installs: Number(row.installs) || 0,
    updates: Number(row.updates) || 0,
  }));

  // Transform OS data
  const byOs: Record<string, number> = {};
  for (const row of osData) {
    const os = String(row.os);
    if (os && os !== "unknown") {
      byOs[os] = Number(row.count) || 0;
    }
  }

  // Transform arch data
  const byArch: Record<string, number> = {};
  for (const row of archData) {
    const arch = String(row.arch);
    if (arch && arch !== "unknown") {
      byArch[arch] = Number(row.count) || 0;
    }
  }

  return {
    generated_at: new Date().toISOString(),
    period: "all_time",
    total_installs: totalInstalls,
    recipes,
    by_os: byOs,
    by_arch: byArch,
  };
}

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

    // GET /stats - return aggregated statistics
    if (request.method === "GET" && url.pathname === "/stats") {
      try {
        const stats = await getStats(env);
        return new Response(JSON.stringify(stats), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // GET /health - health check
    if (url.pathname === "/health") {
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
  },
};
