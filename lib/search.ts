/**
 * Normalize a search query for storage and aggregation:
 * trim, lowercase, and collapse internal whitespace. Shared by the client
 * (SearchView) and the server (/api/search/log) so the analytics dashboard
 * groups "  Tteok  bokki " and "tteok bokki" as the same term.
 *
 * Pure & isomorphic — safe to import in both client and server code.
 */
export function normalizeQuery(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}
