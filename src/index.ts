export interface Env {
  ANALYTICS: AnalyticsEngineDataset;
  CF_ACCOUNT_ID: string;
  CF_API_TOKEN: string;
}

const SCHEMA_VERSION = "1";

type ActionType = "install" | "update" | "remove" | "create" | "command";

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
  // New schema: blob0=action, blob1=recipe, blob5=os, blob6=arch
  const recipeQuery = `
    SELECT blob1 as recipe,
           sum(if(blob0 = 'install', 1, 0)) as installs,
           sum(if(blob0 = 'update', 1, 0)) as updates
    FROM tsuku_telemetry
    WHERE blob1 != ''
    GROUP BY blob1
    ORDER BY installs DESC
    LIMIT 20
  `;

  // Query for OS breakdown
  const osQuery = `
    SELECT blob5 as os, count() as count
    FROM tsuku_telemetry
    WHERE blob0 = 'install'
    GROUP BY blob5
  `;

  // Query for architecture breakdown
  const archQuery = `
    SELECT blob6 as arch, count() as count
    FROM tsuku_telemetry
    WHERE blob0 = 'install'
    GROUP BY blob6
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

        // Validate required action field
        const validActions: ActionType[] = [
          "install",
          "update",
          "remove",
          "create",
          "command",
        ];
        if (
          typeof event.action !== "string" ||
          !validActions.includes(event.action as ActionType)
        ) {
          return new Response("Bad request", {
            status: 400,
            headers: corsHeaders,
          });
        }

        const action = event.action as ActionType;

        // Validate required fields based on action type
        switch (action) {
          case "install":
          case "update":
          case "remove":
            if (typeof event.recipe !== "string" || !event.recipe) {
              return new Response("Bad request", {
                status: 400,
                headers: corsHeaders,
              });
            }
            break;
          case "create":
            if (typeof event.template !== "string" || !event.template) {
              return new Response("Bad request", {
                status: 400,
                headers: corsHeaders,
              });
            }
            break;
          case "command":
            if (typeof event.command !== "string" || !event.command) {
              return new Response("Bad request", {
                status: 400,
                headers: corsHeaders,
              });
            }
            break;
        }

        // Build 13-element blob array per schema
        const recipe = typeof event.recipe === "string" ? event.recipe : "";
        const index =
          action === "install" || action === "update" || action === "remove"
            ? recipe
            : action;

        env.ANALYTICS.writeDataPoint({
          blobs: [
            action, // blob0: action
            recipe, // blob1: recipe
            typeof event.version_constraint === "string"
              ? event.version_constraint
              : "", // blob2
            typeof event.version_resolved === "string"
              ? event.version_resolved
              : "", // blob3
            typeof event.version_previous === "string"
              ? event.version_previous
              : "", // blob4
            typeof event.os === "string" ? event.os : "", // blob5
            typeof event.arch === "string" ? event.arch : "", // blob6
            typeof event.tsuku_version === "string" ? event.tsuku_version : "", // blob7
            typeof event.is_dependency === "boolean"
              ? String(event.is_dependency)
              : "", // blob8
            typeof event.command === "string" ? event.command : "", // blob9
            typeof event.flags === "string" ? event.flags : "", // blob10
            typeof event.template === "string" ? event.template : "", // blob11
            SCHEMA_VERSION, // blob12
          ],
          indexes: [index],
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
