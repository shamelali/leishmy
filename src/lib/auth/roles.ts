// Role-based access control for studio dashboard
export type StudioRole = 
  | "owner"
  | "manager"
  | "senior_artist"
  | "junior_artist"
  | "receptionist"
  | "accountant";

// Role hierarchy (higher number = higher authority)
export const ROLE_HIERARCHY: Record<StudioRole, number> = {
  owner: 5,
  manager: 4,
  senior_artist: 3,
  junior_artist: 2,
  receptionist: 1,
  accountant: 1, // Same level as receptionist but different permissions
};

// Permissions matrix
export type Permission =
  | "bookings:read"
  | "bookings:create"
  | "bookings:update"
  | "bookings:delete"
  | "bookings:assign"
  | "bookings:export"
  | "calendar:read"
  | "calendar:write"
  | "staff:read"
  | "staff:create"
  | "staff:update"
  | "staff:delete"
  | "services:read"
  | "services:create"
  | "services:update"
  | "services:delete"
  | "finance:read"
  | "finance:create"
  | "finance:update"
  | "finance:delete"
  | "finance:payouts"
  | "inventory:read"
  | "inventory:create"
  | "inventory:update"
  | "inventory:delete"
  | "quotes:read"
  | "quotes:create"
  | "quotes:update"
  | "analytics:read"
  | "settings:read"
  | "settings:update";

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<StudioRole, Permission[]> = {
  owner: [
    // Full access to everything
    "bookings:read", "bookings:create", "bookings:update", "bookings:delete", "bookings:assign", "bookings:export",
    "calendar:read", "calendar:write",
    "staff:read", "staff:create", "staff:update", "staff:delete",
    "services:read", "services:create", "services:update", "services:delete",
    "finance:read", "finance:create", "finance:update", "finance:delete", "finance:payouts",
    "inventory:read", "inventory:create", "inventory:update", "inventory:delete",
    "quotes:read", "quotes:create", "quotes:update",
    "analytics:read",
    "settings:read", "settings:update",
  ],
  manager: [
    // Almost full access, but limited financial delete and settings
    "bookings:read", "bookings:create", "bookings:update", "bookings:delete", "bookings:assign", "bookings:export",
    "calendar:read", "calendar:write",
    "staff:read", "staff:create", "staff:update", "staff:delete",
    "services:read", "services:create", "services:update", "services:delete",
    "finance:read", "finance:create", "finance:update", "finance:payouts", // No finance:delete
    "inventory:read", "inventory:create", "inventory:update", "inventory:delete",
    "quotes:read", "quotes:create", "quotes:update",
    "analytics:read",
    "settings:read", // No settings:update
  ],
  senior_artist: [
    // Artist-focused permissions
    "bookings:read", "bookings:create", "bookings:update", "bookings:assign",
    "calendar:read", "calendar:write",
    "staff:read", // Can view staff but not modify
    "services:read", "services:create", "services:update", // Can create/update own services
    "finance:read", // Can view finance but not modify
    "inventory:read", // Can view inventory
    "quotes:read", "quotes:create", "quotes:update",
    "analytics:read",
    "settings:read",
  ],
  junior_artist: [
    // Limited artist permissions
    "bookings:read", "bookings:create", // Can create but not update/delete others' bookings
    "calendar:read", // Can view calendar but not modify
    "staff:read",
    "services:read", // Can view services but not create/update
    "finance:read", // Can view finance
    "inventory:read",
    "quotes:read", "quotes:create",
    "analytics:read",
    "settings:read",
  ],
  receptionist: [
    // Front desk focused
    "bookings:read", "bookings:create", "bookings:update",
    "calendar:read", "calendar:write",
    "staff:read",
    "services:read",
    "finance:read",
    "inventory:read",
    "quotes:read", "quotes:create",
    "analytics:read",
    "settings:read",
  ],
  accountant: [
    // Finance focused
    "bookings:read",
    "calendar:read",
    "staff:read",
    "services:read",
    "finance:read", "finance:create", "finance:update", "finance:delete", "finance:payouts",
    "inventory:read",
    "quotes:read",
    "analytics:read",
    "settings:read",
  ],
};

// Check if a role has a specific permission
export function hasPermission(role: StudioRole | string, permission: Permission): boolean {
  const studioRole = role as StudioRole;
  if (!ROLE_PERMISSIONS[studioRole]) {
    return false;
  }
  return ROLE_PERMISSIONS[studioRole].includes(permission);
}

// Check if role1 has equal or higher authority than role2
export function roleAuthority(role1: StudioRole | string, role2: StudioRole | string): boolean {
  const r1 = role1 as StudioRole;
  const r2 = role2 as StudioRole;
  if (!ROLE_HIERARCHY[r1] || !ROLE_HIERARCHY[r2]) {
    return false;
  }
  return ROLE_HIERARCHY[r1] >= ROLE_HIERARCHY[r2];
}

// Get all permissions for a role
export function getPermissionsForRole(role: StudioRole | string): Permission[] {
  const studioRole = role as StudioRole;
  return ROLE_PERMISSIONS[studioRole] || [];
}