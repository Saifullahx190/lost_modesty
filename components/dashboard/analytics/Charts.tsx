import { T } from "@/components/T";

// ───────────────────────────────────────────────────────────────────────────
// Analytics visuals — all SERVER-rendered SVG, zero client JS, self-contained
// (the app avoids external chart libs the same way it avoids external anything).
// Color follows the dataviz method: single accent hue for magnitude, a second
// brand hue (accent-secondary) only where a real second series exists, and every
// bar carries a direct value label so the low-contrast WARN on the accent fill is
// relieved. Marks are thin, ends rounded, grid/axis recessive; text wears text
// tokens, never the series color.
// ───────────────────────────────────────────────────────────────────────────

const ACCENT = "var(--color-accent)";
const SECONDARY = "var(--color-accent-secondary)";

/** Headline number + label. A stat tile is the right form when the answer is one
 *  figure, not a plot (dataviz: sometimes it's not a chart). */
export function StatTile({
  value,
  bn,
  en,
  hint,
}: {
  value: number | string;
  bn: string;
  en: string;
  hint?: { bn: string; en: string };
}) {
  return (
    <div className="rounded-lg border border-border bg-bg-subtle px-4 py-4">
      <div className="font-display text-display leading-none text-text tabular-nums">
        {typeof value === "number" ? value.toLocaleString("en-US") : value}
      </div>
      <div className="mt-2 text-meta text-muted">
        <T bn={bn} en={en} />
      </div>
      {hint && (
        <div className="mt-0.5 text-caption text-muted">
          <T bn={hint.bn} en={hint.en} />
        </div>
      )}
    </div>
  );
}

/** Daily pageviews (accent bars) with unique visitors overlaid as a line — both
 *  are counts, so they share ONE y-axis (never a dual scale). Legend present
 *  because there are two series. */
export function TrendChart({
  data,
}: {
  data: { day: string; views: number; visitors: number }[];
}) {
  if (data.length === 0) return <EmptyChart />;

  const H = 200;
  const padTop = 14;
  const padBottom = 26;
  const padX = 10;
  const step = 26;
  const W = padX * 2 + data.length * step;
  const plotH = H - padTop - padBottom;
  const max = Math.max(1, ...data.map((d) => d.views));
  const y = (v: number) => padTop + plotH * (1 - v / max);
  const barW = Math.min(16, step * 0.62);

  const points = data.map((d, i) => {
    const cx = padX + i * step + step / 2;
    return { cx, vy: y(d.views), sy: y(d.visitors), ...d };
  });
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.cx},${p.sy}`).join(" ");

  // Sparse x labels: first, middle, last — avoids collision on long windows.
  const labelIdx = new Set([0, Math.floor(data.length / 2), data.length - 1]);

  return (
    <figure className="m-0">
      <Legend
        items={[
          { color: ACCENT, bn: "পেজভিউ", en: "Pageviews", shape: "bar" },
          { color: SECONDARY, bn: "ইউনিক পাঠক", en: "Unique readers", shape: "line" },
        ]}
      />
      <div className="mt-3 overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height="auto"
          role="img"
          aria-label="Daily pageviews and unique readers"
          style={{ maxWidth: W, minWidth: Math.min(W, 320) }}
        >
          {/* recessive baseline */}
          <line
            x1={padX}
            y1={padTop + plotH}
            x2={W - padX}
            y2={padTop + plotH}
            stroke="var(--color-border)"
            strokeWidth={1}
          />
          {points.map((p, i) => (
            <g key={p.day}>
              <rect
                x={p.cx - barW / 2}
                y={p.vy}
                width={barW}
                height={padTop + plotH - p.vy}
                rx={3}
                fill={ACCENT}
              >
                <title>{`${p.day} — ${p.views} পেজভিউ, ${p.visitors} পাঠক`}</title>
              </rect>
              {labelIdx.has(i) && (
                <text
                  x={p.cx}
                  y={H - 8}
                  textAnchor="middle"
                  style={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                >
                  {p.day.slice(5)}
                </text>
              )}
            </g>
          ))}
          {/* unique-visitors line + dots on the same axis */}
          <path d={linePath} fill="none" stroke={SECONDARY} strokeWidth={2} strokeLinejoin="round" />
          {points.map((p) => (
            <circle key={`d-${p.day}`} cx={p.cx} cy={p.sy} r={2.5} fill={SECONDARY} />
          ))}
        </svg>
      </div>
    </figure>
  );
}

/** Horizontal magnitude bars for a ranked list (top articles, referrers). Single
 *  accent hue; label + value are direct so identity/quantity never rely on color. */
export function BarList({
  rows,
  emptyBn,
  emptyEn,
}: {
  rows: { label: string; href?: string; value: number; sub?: string }[];
  emptyBn: string;
  emptyEn: string;
}) {
  if (rows.length === 0) return <EmptyRow bn={emptyBn} en={emptyEn} />;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ol className="flex flex-col gap-3">
      {rows.map((r, i) => (
        <li key={`${r.label}-${i}`} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-meta text-text">
              {r.href ? (
                <a href={r.href} className="hover:underline underline-offset-2">
                  {r.label}
                </a>
              ) : (
                r.label
              )}
              {r.sub && <span className="ml-2 text-caption text-muted">{r.sub}</span>}
            </span>
            <span className="shrink-0 text-meta tabular-nums text-muted">
              {r.value.toLocaleString("en-US")}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-bg-subtle">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max(3, (r.value / max) * 100)}%`, background: ACCENT }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

/** New vs returning as a single part-to-whole bar. Returning = regular readers
 *  (accent, the valued cohort); new = accent-secondary. Both labeled directly. */
export function NewReturning({ returning, neu }: { returning: number; neu: number }) {
  const total = returning + neu;
  if (total === 0)
    return <EmptyRow bn="এখনো কোনো পাঠক ডেটা নেই।" en="No reader data yet." />;
  const rPct = (returning / total) * 100;
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-bg-subtle">
        <div style={{ width: `${rPct}%`, background: ACCENT }} />
        <div style={{ width: `${100 - rPct}%`, background: SECONDARY }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
        <LegendValue color={ACCENT} value={returning} bn="নিয়মিত পাঠক" en="Regular readers" />
        <LegendValue color={SECONDARY} value={neu} bn="নতুন পাঠক" en="New readers" />
      </div>
    </div>
  );
}

function LegendValue({
  color,
  value,
  bn,
  en,
}: {
  color: string;
  value: number;
  bn: string;
  en: string;
}) {
  return (
    <span className="flex items-center gap-2 text-meta text-muted">
      <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      <span className="tabular-nums text-text">{value.toLocaleString("en-US")}</span>
      <T bn={bn} en={en} />
    </span>
  );
}

function Legend({
  items,
}: {
  items: { color: string; bn: string; en: string; shape: "bar" | "line" }[];
}) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1">
      {items.map((it) => (
        <span key={it.en} className="flex items-center gap-2 text-caption text-muted">
          <span
            className="inline-block"
            style={
              it.shape === "line"
                ? { width: 14, height: 2, background: it.color }
                : { width: 10, height: 10, borderRadius: 2, background: it.color }
            }
          />
          <T bn={it.bn} en={it.en} />
        </span>
      ))}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border text-meta text-muted">
      <T bn="এই সময়সীমায় এখনো কোনো ভিজিট রেকর্ড হয়নি।" en="No visits recorded in this window yet." />
    </div>
  );
}

function EmptyRow({ bn, en }: { bn: string; en: string }) {
  return (
    <p className="py-6 text-center text-meta text-muted">
      <T bn={bn} en={en} />
    </p>
  );
}
