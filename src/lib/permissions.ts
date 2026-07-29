export const PERMISSIONS = {
  BOOKINGS_VIEW: "bookings:view",
  BOOKINGS_CREATE: "bookings:create",
  BOOKINGS_EDIT: "bookings:edit",
  BOOKINGS_DELETE: "bookings:delete",
  BOOKINGS_ASSIGN_PANDIT: "bookings:assign_pandit",
  BOOKINGS_REFUND: "bookings:refund",
  POOJAS_VIEW: "poojas:view",
  POOJAS_MANAGE: "poojas:manage",
  FESTIVALS_MANAGE: "festivals:manage",
  PANDITS_VIEW: "pandits:view",
  PANDITS_MANAGE: "pandits:manage",
  PANDIT_APPLICATIONS_MANAGE: "pandit_applications:manage",
  CUSTOMERS_VIEW: "customers:view",
  CONSULTATIONS_MANAGE: "consultations:manage",
  ECOMMERCE_MANAGE: "ecommerce:manage",
  CONTENT_MANAGE: "content:manage",
  REVIEWS_MANAGE: "reviews:manage",
  COUPONS_MANAGE: "coupons:manage",
  CMS_MANAGE: "cms:manage",
  MEDIA_MANAGE: "media:manage",
  SEO_MANAGE: "seo:manage",
  REPORTS_VIEW: "reports:view",
  FINANCE_VIEW: "finance:view",
  USERS_MANAGE: "users:manage",
  SETTINGS_MANAGE: "settings:manage",
  AUDIT_VIEW: "audit:view",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

export const WILDCARD_PERMISSION = "*";

export const DEFAULT_ROLES: { name: string; permissions: string[]; isSystem: boolean }[] = [
  { name: "Super Admin", permissions: [WILDCARD_PERMISSION], isSystem: true },
  {
    name: "Booking Manager",
    permissions: [
      PERMISSIONS.BOOKINGS_VIEW,
      PERMISSIONS.BOOKINGS_CREATE,
      PERMISSIONS.BOOKINGS_EDIT,
      PERMISSIONS.BOOKINGS_ASSIGN_PANDIT,
      PERMISSIONS.PANDITS_VIEW,
      PERMISSIONS.CUSTOMERS_VIEW,
    ],
    isSystem: false,
  },
  {
    name: "Pandit Manager",
    permissions: [PERMISSIONS.PANDITS_VIEW, PERMISSIONS.PANDITS_MANAGE, PERMISSIONS.PANDIT_APPLICATIONS_MANAGE],
    isSystem: false,
  },
  {
    name: "Content Manager",
    permissions: [PERMISSIONS.CONTENT_MANAGE, PERMISSIONS.CMS_MANAGE, PERMISSIONS.MEDIA_MANAGE, PERMISSIONS.SEO_MANAGE],
    isSystem: false,
  },
  { name: "Ecommerce Manager", permissions: [PERMISSIONS.ECOMMERCE_MANAGE, PERMISSIONS.COUPONS_MANAGE], isSystem: false },
  { name: "Finance Manager", permissions: [PERMISSIONS.FINANCE_VIEW, PERMISSIONS.BOOKINGS_REFUND, PERMISSIONS.REPORTS_VIEW], isSystem: false },
  { name: "Support Manager", permissions: [PERMISSIONS.BOOKINGS_VIEW, PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.REVIEWS_MANAGE], isSystem: false },
  { name: "SEO Manager", permissions: [PERMISSIONS.SEO_MANAGE], isSystem: false },
];

export function roleHasPermission(rolePermissions: string[], permission: string): boolean {
  return rolePermissions.includes(WILDCARD_PERMISSION) || rolePermissions.includes(permission);
}
