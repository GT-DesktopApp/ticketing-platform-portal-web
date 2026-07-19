import { prisma } from "@/lib/prisma";
import { modulesToPermissions } from "@/modules/users/modules";
import type { RoleInput } from "@/modules/users/schemas";
import { roleInclude } from "@/modules/users/server/mapper";

/** Slugify a role name into a stable machine key, e.g. "CCTV Operator" → "cctv_operator". */
export function slugifyRoleKey(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "role"
  );
}

/** Ensure a unique role key by appending a counter if needed. */
async function uniqueRoleKey(base: string, excludeId?: string): Promise<string> {
  let key = base;
  let n = 1;
  while (true) {
    const clash = await prisma.role.findFirst({
      where: { key, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (!clash) return key;
    n += 1;
    key = `${base}_${n}`;
  }
}

/**
 * Resolve module keys → permission IDs to link on a role. Run OUTSIDE the write
 * transaction (a plain read) so the transaction's critical path stays short and
 * clears the interactive-transaction timeout on a remote (Neon) database.
 */
async function permissionIdsForModules(input: RoleInput): Promise<string[]> {
  const permKeys = modulesToPermissions(input.modules);
  if (permKeys.length === 0) return [];
  const perms = await prisma.permission.findMany({
    where: { key: { in: permKeys } },
    select: { id: true },
  });
  return perms.map((p) => p.id);
}

/** Interactive-transaction options tuned for the pooled Neon connection. */
const TX_OPTS = { maxWait: 10_000, timeout: 20_000 } as const;

/** Create a custom role with its module-derived permissions. */
export async function createRole(input: RoleInput, actorId: string) {
  // Resolve key + permission IDs first (reads), so the tx only does writes.
  const key = await uniqueRoleKey(slugifyRoleKey(input.name));
  const permIds = await permissionIdsForModules(input);

  return prisma.$transaction(
    async (tx) =>
      tx.role.create({
        data: {
          key,
          name: input.name.trim(),
          description: input.description ?? null,
          isActive: input.isActive,
          isSystem: false,
          rolePermissions: {
            create: permIds.map((permissionId) => ({
              permissionId,
              assignedById: actorId,
            })),
          },
        },
        include: roleInclude,
      }),
    TX_OPTS,
  );
}

/**
 * Update a role and reconcile its permission set from the selected modules.
 * System roles keep their name/key but their permissions/description/status can
 * still be edited (guarded upstream where appropriate).
 */
export async function updateRole(
  id: string,
  input: RoleInput,
  actorId: string,
  isSystem: boolean,
) {
  // All reads (key uniqueness, permission IDs) happen BEFORE the transaction.
  const key = isSystem
    ? undefined
    : await uniqueRoleKey(slugifyRoleKey(input.name), id);
  const permIds = await permissionIdsForModules(input);

  return prisma.$transaction(async (tx) => {
    await tx.role.update({
      where: { id },
      data: {
        // Renaming a system role would break code that looks it up by key, so
        // only custom roles get their name (and derived key) changed.
        ...(isSystem ? {} : { name: input.name.trim(), key }),
        description: input.description ?? null,
        isActive: input.isActive,
      },
    });

    // Replace the permission set with the module-derived one.
    await tx.rolePermission.deleteMany({ where: { roleId: id } });
    if (permIds.length > 0) {
      await tx.rolePermission.createMany({
        data: permIds.map((permissionId) => ({
          roleId: id,
          permissionId,
          assignedById: actorId,
        })),
      });
    }

    return tx.role.findUniqueOrThrow({ where: { id }, include: roleInclude });
  }, TX_OPTS);
}
