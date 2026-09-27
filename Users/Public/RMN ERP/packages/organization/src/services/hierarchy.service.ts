import { eq, like } from 'drizzle-orm';
import { organizations } from '../database/schema.js';
import { db } from '@rmn-erp/core';

export class HierarchyService {
  async calculatePath(currentId: string, parentId?: string | null): Promise<string> {
    if (!parentId) {
      return currentId;
    }
    const results = await db.select().from(organizations).where(eq(organizations.id, parentId)).limit(1);
    const parent = results[0];
    if (!parent) {
      throw new Error('Parent organization not found');
    }
    return `${parent.path}.${currentId}`;
  }

  async validateHierarchy(parentId: string | null, type: string): Promise<void> {
    if (!parentId) {
      return;
    }
    const results = await db.select().from(organizations).where(eq(organizations.id, parentId)).limit(1);
    const parent = results[0];
    if (!parent) {
      throw new Error('Parent organization not found');
    }
    const depth = parent.path.split('.').length;
    if (depth >= 10) {
      throw new Error('Maximum hierarchy depth of 10 exceeded');
    }
    if (parent.type === 'EXTERNAL_INSTITUTION' && ['BRANCH', 'DEPARTMENT', 'UNIT'].includes(type)) {
      throw new Error('EXTERNAL_INSTITUTION cannot have internal children');
    }
  }

  async recalculateDescendantPaths(nodeId: string, newPath: string): Promise<void> {
    const descendants = await db.select().from(organizations).where(like(organizations.path, `${nodeId}.%`));
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
