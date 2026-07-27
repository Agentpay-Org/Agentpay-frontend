import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(DIR, "..");
const BUDGET_FILE = join(ROOT, "bundle-budgets.json");
const REPORT_FILE = join(ROOT, "bundle-report.json");

export function parseBuildOutput(stdout) {
  const routes = [];
  const lines = stdout.split("\n");

  let inRouteTable = false;
  for (const line of lines) {
    const trimmed = line.trimEnd();

    if (trimmed.startsWith("Route (app)")) {
      inRouteTable = true;
      continue;
    }

    if (!inRouteTable) continue;
    if (trimmed === "" || trimmed.startsWith("✓") || trimmed.startsWith("✗")) break;

    const match = trimmed.match(
      /^[┌├└╞╟╠╡╢╣╤╥╦╧╨╩╪╫╬\s│]*\s*[○λ▲◆▶]?\s*(.+?)\s{2,}(\d+\.?\d*)\s*kB\s{2,}(\d+\.?\d*)\s*kB\s*$/
    );

    if (match) {
      const route = match[1].trim();
      const size = parseFloat(match[2]);
      const firstLoadJS = parseFloat(match[3]);
      if (route && !isNaN(size) && !isNaN(firstLoadJS)) {
        routes.push({ route, size, firstLoadJS });
      }
    }
  }

  return routes;
}

export function loadBudgets(filePath) {
  if (!existsSync(filePath)) {
    console.error(`Budget file not found: ${filePath}`);
    process.exit(1);
  }
  const raw = JSON.parse(readFileSync(filePath, "utf8"));
  return {
    meta: raw._meta || {},
    routes: raw.routes || {},
  };
}

export function checkBudgets(routes, budgets, warnAtPct) {
  return routes.map((r) => {
    const budget = budgets[r.route];
    if (budget === undefined) {
      return { ...r, budget: null, status: "unbudgeted", pct: null };
    }
    const pct = (r.firstLoadJS / budget) * 100;
    let status;
    if (pct > 100) {
      status = "fail";
    } else if (pct >= warnAtPct) {
      status = "warn";
    } else {
      status = "ok";
    }
    return { ...r, budget, status, pct: Math.round(pct * 10) / 10 };
  });
}

function formatTable(results, unit) {
  const header = `${"Route".padEnd(30)} ${"Budget".padEnd(8)} ${"Actual".padEnd(8)} ${"Δ".padEnd(8)} Status`;
  const sep = "─".repeat(header.length);
  const rows = [header, sep];

  for (const r of results) {
    const route = r.route.length > 28 ? r.route.slice(0, 25) + "..." : r.route.padEnd(30);
    const budget = r.budget !== null ? `${r.budget} ${unit}`.padEnd(8) : "—".padEnd(8);
    const actual = `${r.firstLoadJS} ${unit}`.padEnd(8);
    const delta =
      r.budget !== null
        ? `${(r.firstLoadJS - r.budget) >= 0 ? "+" : ""}${(r.firstLoadJS - r.budget).toFixed(1)} ${unit}`.padEnd(8)
        : "—".padEnd(8);
    let statusSymbol;
    if (r.status === "fail") statusSymbol = "❌ FAIL";
    else if (r.status === "warn") statusSymbol = "⚠️ WARN";
    else if (r.status === "unbudgeted") statusSymbol = "❓ NEW";
    else statusSymbol = "✅ OK";

    rows.push(`${route} ${budget} ${actual} ${delta} ${statusSymbol}`);
  }

  return rows.join("\n");
}

function buildReportJson(results, pass, warn) {
  return {
    timestamp: new Date().toISOString(),
    unit: "kB",
    routes: results,
    summary: {
      total: results.length,
      ok: results.filter((r) => r.status === "ok").length,
      warn: results.filter((r) => r.status === "warn").length,
      fail: results.filter((r) => r.status === "fail").length,
      unbudgeted: results.filter((r) => r.status === "unbudgeted").length,
    },
    pass,
    warn,
  };
}

export async function runBuild() {
  return new Promise((resolve, reject) => {
    const proc = spawn("npx", ["next", "build"], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "inherit"],
      shell: true,
    });

    let stdout = "";
    proc.stdout.on("data", (chunk) => {
      process.stdout.write(chunk);
      stdout += chunk.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`next build exited with code ${code}`));
      } else {
        resolve(stdout);
      }
    });
    proc.on("error", reject);
  });
}

export function formatPRComment(results, summary, pass, warn) {
  let verdict;
  if (!pass) verdict = "❌ **Some routes exceed their budget**";
  else if (warn) verdict = "⚠️ **All routes within budget, but some are near the limit**";
  else verdict = "✅ **All routes within budget**";

  const rows = [];
  for (const r of results) {
    const budgetStr = r.budget !== null ? `${r.budget} kB` : "—";
    const actualStr = `${r.firstLoadJS} kB`;
    const deltaStr =
      r.budget !== null
        ? `${(r.firstLoadJS - r.budget) >= 0 ? "+" : ""}${(r.firstLoadJS - r.budget).toFixed(1)} kB`
        : "—";
    let icon;
    if (r.status === "fail") icon = "❌";
    else if (r.status === "warn") icon = "⚠️";
    else if (r.status === "unbudgeted") icon = "❓";
    else icon = "✅";
    rows.push(`| ${icon} | \`${r.route}\` | ${budgetStr} | ${actualStr} | ${deltaStr} |`);
  }

  return [
    `## 📦 Bundle Budget Report`,
    ``,
    `${verdict}`,
    ``,
    `| Status | Route | Budget | Actual | Δ |`,
    `|--------|-------|--------|--------|---|`,
    ...rows,
    ``,
    `**Summary:** ${summary.ok} ✅ / ${summary.warn} ⚠️ / ${summary.fail} ❌ / ${summary.unbudgeted} ❓ unbudgeted`,
    ``,
    `> Budget file: \`bundle-budgets.json\`. Raise a budget by editing it in a dedicated PR.`,
  ].join("\n");
}

async function main() {
  const { meta, routes: budgetRoutes } = loadBudgets(BUDGET_FILE);
  const warnAtPct = meta.warn_at_pct ?? 90;
  const unit = meta.unit ?? "kB";

  let stdout;
  try {
    stdout = await runBuild();
  } catch (err) {
    console.error("Build failed — cannot check bundle budgets.");
    process.exit(1);
  }

  const parsedRoutes = parseBuildOutput(stdout);
  if (parsedRoutes.length === 0) {
    console.error("Could not parse any routes from build output.");
    process.exit(1);
  }

  const results = checkBudgets(parsedRoutes, budgetRoutes, warnAtPct);

  const hasFail = results.some((r) => r.status === "fail");
  const hasWarn = results.some((r) => r.status === "warn");
  const pass = !hasFail;
  const warn = hasWarn;

  console.log("\n");
  console.log("=".repeat(70));
  console.log("  Bundle Budget Check");
  console.log("=".repeat(70));
  console.log(formatTable(results, unit));
  console.log("=".repeat(70));
  console.log(
    `  Summary: ${results.filter((r) => r.status === "ok").length} ok | ${
      results.filter((r) => r.status === "warn").length
    } warn | ${results.filter((r) => r.status === "fail").length} fail | ${
      results.filter((r) => r.status === "unbudgeted").length
    } unbudgeted`
  );
  console.log("=".repeat(70));

  const report = buildReportJson(results, pass, warn);
  writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

  if (!pass) {
    console.error("\n❌ Bundle budget check failed.");
    process.exit(1);
  }

  if (warn) {
    console.warn("\n⚠️  Some routes are nearing their budget limit.");
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
