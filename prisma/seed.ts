/**
 * Database seed script.
 *
 * Idempotent: safe to run repeatedly (uses upserts). It establishes the RBAC
 * baseline every environment needs:
 *   1. The full permission catalog (from the typed constants).
 *   2. The five system roles with their default permission sets.
 *   3. A bootstrap Super Admin user (credentials from env, with sane defaults).
 *
 * Run with:  npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import {
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  type Permission,
  PERMISSION_GROUPS,
} from "../src/lib/constants/permissions";
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  type RoleKey,
  ROLES,
} from "../src/lib/constants/roles";

const prisma = new PrismaClient();

/** Reverse-lookup a permission's display group for the picker UI. */
function groupForPermission(permission: Permission): string | undefined {
  for (const [group, perms] of Object.entries(PERMISSION_GROUPS)) {
    if (perms.includes(permission)) return group;
  }
  return undefined;
}

async function seedPermissions() {
  console.log("→ Seeding permissions…");
  for (const key of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key },
      update: { group: groupForPermission(key) },
      create: { key, group: groupForPermission(key) },
    });
  }
  console.log(`  ✓ ${ALL_PERMISSIONS.length} permissions ensured.`);
}

async function seedRoles() {
  console.log("→ Seeding system roles…");
  const roleKeys = Object.values(ROLES) as RoleKey[];

  for (const key of roleKeys) {
    const role = await prisma.role.upsert({
      where: { key },
      update: {
        name: ROLE_LABELS[key],
        description: ROLE_DESCRIPTIONS[key],
        isSystem: true,
      },
      create: {
        key,
        name: ROLE_LABELS[key],
        description: ROLE_DESCRIPTIONS[key],
        isSystem: true,
      },
    });

    // Resolve the permission set for this role.
    // Super Admin is a wildcard at check-time, so we grant it ALL permissions
    // here too for completeness/visibility in the admin UI.
    const permissionKeys: Permission[] =
      key === ROLES.SUPER_ADMIN
        ? ALL_PERMISSIONS
        : (DEFAULT_ROLE_PERMISSIONS[
            key as keyof typeof DEFAULT_ROLE_PERMISSIONS
          ] ?? []);

    const permissions = await prisma.permission.findMany({
      where: { key: { in: permissionKeys } },
      select: { id: true },
    });

    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
    console.log(`  ✓ ${ROLE_LABELS[key]} (${permissions.length} permissions).`);
  }
}

async function seedSuperAdmin() {
  console.log("→ Seeding bootstrap Super Admin…");
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@ticketing.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Super Admin",
      passwordHash,
      isActive: true,
    },
  });

  const superAdminRole = await prisma.role.findUnique({
    where: { key: ROLES.SUPER_ADMIN },
  });

  if (superAdminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: { userId: user.id, roleId: superAdminRole.id },
      },
      update: {},
      create: { userId: user.id, roleId: superAdminRole.id },
    });
  }

  console.log(`  ✓ Super Admin ready: ${email}`);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log(
      "  ⚠ Default password is 'ChangeMe123!' — change it immediately.",
    );
  }
}

async function main() {
  console.log("🌱 Seeding database…\n");
  await seedPermissions();
  await seedRoles();
  await seedSuperAdmin();
  console.log("\n✅ Seed complete.");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
