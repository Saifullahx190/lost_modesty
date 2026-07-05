// Redirect-map analysis core (REBUILD §3B, CP0). Pure functions shared by the
// build script and the audit test. Zero dependencies.
//
// Contract enforced:
//   - 100% coverage: every inventoried old URL appears in the map.
//   - single hop: an old URL's target is never itself the source of another
//     redirect (no chains).
//   - no loops: following redirects never cycles.
//   - 301 (not 302) for any path change; 200 for identical paths.

/** Minimal, dependency-free CSV parse (no embedded newlines/quotes expected in URLs). */
export function parseInventoryCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  if (lines.length === 0) return [];
  const header = lines[0].split(",").map((h) => h.trim());
  const idx = (name) => header.indexOf(name);
  const iOld = idx("old_url");
  const iNew = idx("new_url");
  const iStatus = idx("expected_status");
  const iSource = idx("source");
  if (iOld === -1 || iNew === -1 || iStatus === -1) {
    throw new Error(
      "inventory CSV must have headers: old_url,new_url,expected_status[,source]",
    );
  }
  return lines.slice(1).map((line, n) => {
    const cells = line.split(",").map((c) => c.trim());
    const old_url = cells[iOld];
    const new_url = cells[iNew] || old_url;
    const expected_status = Number(cells[iStatus] || "200");
    const source = iSource !== -1 ? cells[iSource] || "" : "";
    if (!old_url) throw new Error(`row ${n + 2}: empty old_url`);
    return { old_url, new_url, expected_status, source };
  });
}

/** Build the map: old_url -> { to, status }. */
export function buildMap(rows) {
  const map = {};
  for (const r of rows) {
    map[r.old_url] = { to: r.new_url, status: r.expected_status };
  }
  return map;
}

/**
 * Audit the map. Returns { ok, errors[], stats }. errors are human-readable so
 * the failing checkpoint surfaces WHY, not just red/green.
 */
export function auditMap(rows) {
  const errors = [];
  const sources = new Set(rows.map((r) => r.old_url));
  const map = buildMap(rows);

  for (const r of rows) {
    // status sanity: identical path must be 200; changed path must be 301 (never 302).
    if (r.old_url === r.new_url && r.expected_status !== 200) {
      errors.push(`${r.old_url}: identical path must be 200, got ${r.expected_status}`);
    }
    if (r.old_url !== r.new_url) {
      if (r.expected_status === 302) {
        errors.push(`${r.old_url}: path changed with 302 — must be 301 (§3B)`);
      } else if (r.expected_status !== 301) {
        errors.push(`${r.old_url}: path changed with ${r.expected_status} — must be 301`);
      }
      // single-hop / chain check: target must NOT itself be a redirecting source.
      const target = map[r.new_url];
      if (target && target.to !== r.new_url) {
        errors.push(
          `CHAIN: ${r.old_url} -> ${r.new_url} -> ${target.to} (must reach final target in one hop)`,
        );
      }
    }
  }

  // loop detection via path-walk per source.
  for (const start of sources) {
    const seen = new Set();
    let cur = start;
    let hops = 0;
    while (map[cur] && map[cur].to !== cur) {
      if (seen.has(cur)) {
        errors.push(`LOOP: redirect cycle starting at ${start}`);
        break;
      }
      seen.add(cur);
      cur = map[cur].to;
      if (++hops > 50) {
        errors.push(`LOOP?: >50 hops starting at ${start}`);
        break;
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    stats: {
      total: rows.length,
      identity: rows.filter((r) => r.old_url === r.new_url).length,
      redirects: rows.filter((r) => r.old_url !== r.new_url).length,
    },
  };
}
