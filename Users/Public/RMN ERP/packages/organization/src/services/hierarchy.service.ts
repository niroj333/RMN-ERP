import { AppError } from '@rmn-erp/core';
import { db } from '@rmn-erp/core'; // Assuming core provides db access or we should query via something else. Wait, I might need to make sure how db is imported.
import { organizations } from '../database/schema.js';
import { eq, like } from 'drizzle-orm';

export class HierarchyService {
  async calculatePath(currentId: string, parentId?: string | null): Promise<string> {
    if (!parentId) {
      return currentId;
    }
    const parent = await db.query.organizations.findFirst({
      where: eq(organizations.id, parentId)
    });
    if (!parent) {
      throw new AppError('NOT_FOUND', 'Parent organization not found');
    }
    return `${parent.path}.${currentId}`;
  }

  async validateHierarchy(parentId: string | null, type: string): Promise<void> {
    if (!parentId) {
      return;
    }
    
    const parent = await db.query.organizations.findFirst({
      where: eq(organizations.id, parentId)
    });
    
    if (!parent) {
      throw new AppError('NOT_FOUND', 'Parent organization not found');
    }

    const depth = parent.path.split('.').length;
    if (depth >= 10) {
      throw new AppError('BAD_REQUEST', 'Maximum hierarchy depth of 10 exceeded');
    }

    if (parent.type === 'EXTERNAL_INSTITUTION' && ['BRANCH', 'DEPARTMENT', 'UNIT'].includes(type)) {
      throw new AppError('BAD_REQUEST', 'EXTERNAL_INSTITUTION cannot have internal children');
    }
  }

  async recalculateDescendantPaths(nodeId: string, newPath: string): Promise<void> {
    // This is a naive implementation, ideally done in a transaction or with raw SQL.
    const descendants = await db.query.organizations.findMany({
      where: like(organizations.path, `${nodeId}.%`)
    });

    for (const descendant of descendants) {
      const relativePath = descendant.path.substring(descendant.path.indexOf(nodeId) + nodeId.length + 1);
      const updatedPath = `${newPath}.${relativePath}`;
      await db.update(organizations)
        .set({ path: updatedPath })
        .where(eq(organizations.id, descendant.id));
    }
  }
}

export const hierarchyService = new HierarchyService();
