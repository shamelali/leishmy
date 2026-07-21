/** Check if a session has admin privileges (via role or is_admin flag). */
export function hasAdminAccess(
  session: { role: string; isAdmin?: boolean } | null,
): boolean {
  if (!session) return false;
  return session.role === "admin" || session.isAdmin === true;
}
