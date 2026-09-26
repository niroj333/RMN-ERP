import { eq } from 'drizzle-orm';
import { db } from '@rmn-erp/core';
import { userRoles, rolePermissions, permissions } from '../database/schema.js';

export interface UserPermission {
  resourceAction: string;
  scope: string;
  branchId?: string | null;
}

export class AuthorizationService {
  async getUserPermissions(userId: string): Promise<UserPermission[]> {
    const results = await db
      .select({
        resourceAction: permissions.resourceAction,
        scope: userRoles.scope,
        branchId: userRoles.branchId
      })
      .from(userRoles)
      .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(userRoles.userId, userId));

    return results;
  }
}

export const authorizationService = new AuthorizationService();
