# /data — migration data artifacts (REBUILD §3A/§3B)

| File | Status | Produced by |
|---|---|---|
| `url-inventory.sample.csv` | ✅ present (demo) | committed sample for harness validation |
| `url-inventory.csv` | ⛔ **NOT YET** | **You / infra**: live crawl + GSC export + 90-day server logs (§3A). The crawl misses orphan-but-ranking pages; GSC + logs catch them. |
| `redirect-map.json` | generated | `npm run redirect:build` from the inventory |

**Schema** (`url-inventory.csv`): `old_url,new_url,expected_status,source`
- `old_url` — path as currently indexed/linked (preserve trailing-slash/case exactly, §3A).
- `new_url` — target. Default = identical to `old_url` (zero redirects is best, §3B).
- `expected_status` — `200` for identity, `301` for a permanent path change (never `302`).
- `source` — `crawl` | `gsc` | `logs` (provenance, so orphan-but-ranking URLs are traceable).

Until `url-inventory.csv` exists, **CP0's "redirect map covers 100% of inventoried URLs" cannot be asserted against reality** — only the harness correctness is proven (via the sample + `tests/redirect-audit.test.mjs`).
