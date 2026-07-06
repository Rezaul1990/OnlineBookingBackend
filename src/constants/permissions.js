export const permissionModules = [
  {
    module: "dashboard",
    label: "Dashboard",
    permissions: [
      { action: "view", label: "View dashboard", description: "View admin dashboard overview." }
    ]
  },
  {
    module: "bookings",
    label: "Bookings",
    permissions: [
      { action: "view", label: "View bookings", description: "View booking requests and schedules." },
      { action: "create", label: "Create bookings", description: "Create bookings from the admin dashboard." },
      { action: "update", label: "Update bookings", description: "Edit bookings and customer details." },
      { action: "delete", label: "Delete bookings", description: "Remove bookings when allowed." },
      { action: "manage", label: "Manage booking status", description: "Approve, cancel, complete, and manage booking lifecycle." }
    ]
  },
  {
    module: "staff",
    label: "Staff",
    permissions: [
      { action: "view", label: "View staff", description: "View admin and staff users." },
      { action: "create", label: "Create staff", description: "Invite or create staff users." },
      { action: "update", label: "Update staff", description: "Edit staff profiles and access." },
      { action: "delete", label: "Delete staff", description: "Deactivate or remove staff users." },
      { action: "manage", label: "Manage staff", description: "Full staff management access." }
    ]
  },
  {
    module: "roles",
    label: "Roles and Permissions",
    permissions: [
      { action: "view", label: "View roles", description: "View role and permission settings." },
      { action: "create", label: "Create roles", description: "Create custom roles." },
      { action: "update", label: "Update roles", description: "Edit role permissions." },
      { action: "delete", label: "Delete roles", description: "Delete non-system roles." },
      { action: "manage", label: "Manage roles", description: "Full role and permission management." }
    ]
  },
  {
    module: "settings",
    label: "Settings",
    permissions: [
      { action: "view", label: "View settings", description: "View business settings." },
      { action: "update", label: "Update settings", description: "Update business settings." }
    ]
  },
  {
    module: "reports",
    label: "Reports",
    permissions: [
      { action: "view", label: "View reports", description: "View booking and business reports." },
      { action: "export", label: "Export reports", description: "Export report data." }
    ]
  },
  {
    module: "auditLogs",
    label: "Audit Logs",
    permissions: [
      { action: "view", label: "View audit logs", description: "View sensitive admin action history." }
    ]
  }
];

export const permissions = permissionModules.flatMap((group) =>
  group.permissions.map((permission) => ({
    key: `${group.module}.${permission.action}`,
    module: group.module,
    group: group.label,
    action: permission.action,
    label: permission.label,
    description: permission.description
  }))
);

export const allPermissionKeys = permissions.map((permission) => permission.key);
