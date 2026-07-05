// Formatting helpers. Bengali-first (FRONTEND §1.1 primary locale bn).

const bnDate = new Intl.DateTimeFormat("bn-BD", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

/** Human Bengali date for bylines/meta rows. Returns "" for invalid input so a
 *  bad date never throws during SSG. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : bnDate.format(d);
}

/** machine-readable date for <time dateTime>. */
export function isoDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}
