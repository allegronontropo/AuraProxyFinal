/**
 * Shared admin table utilities:
 * - buildUrl: merges new params into existing URL params
 * - SortIcon: shows ↑ ↓ or neutral indicator on column headers
 */

export function buildAdminUrl(
  base: string,
  current: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>
): string {
  const merged = { ...current, ...overrides };
  const qs = Object.entries(merged)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`)
    .join("&");
  return `${base}${qs ? `?${qs}` : ""}`;
}

export function nextSort(
  field: string,
  currentSort: string,
  currentDir: string
): { sortBy: string; sortDir: string } {
  if (currentSort !== field) return { sortBy: field, sortDir: "asc" };
  return { sortBy: field, sortDir: currentDir === "asc" ? "desc" : "asc" };
}
