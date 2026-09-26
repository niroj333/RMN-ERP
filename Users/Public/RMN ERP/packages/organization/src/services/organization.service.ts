import { db } from '@rmn-erp/core'; 
import { AppError } from '@rmn-erp/core';
import { organizations } from '../database/schema.js';
import { eq, like } from 'drizzle-orm';
import { hierarchyService } from './hierarchy.service.js';
import { randomUUID } from 'crypto';

export class OrganizationService {
  async createOrganization(data: { name: string; type: string; parentId?: string | null }) {
    await hierarchyService.validateHierarchy(data.parentId || null, data.type);
    
    const newId = randomUUID();
    const path = await hierarchyService.calculatePath(newId, data.parentId);
    
    const [org] = await db.insert(organizations).values({
      id: newId,
      name: data.name,
      type: data.type,
      parentId: data.parentId || null,
      path,
      status: 'ACTIVE'
    }).returning();
    
    return org;
  }

  async getOrganization(id: string) {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, id)
    });
    
    if (!org) {
      throw new AppError('NOT_FOUND', 'Organization not found');
    }
    
    return org;
  }

  async updateOrganization(id: string, data: { name?: string; status?: string }) {
    const org = await this.getOrganization(id);
    
    const [updated] = await db.update(organizations)
      .set({
        name: data.name ?? org.name,
        status: data.status ?? org.status,
        updatedAt: new Date()
      })
      .where(eq(organizations.id, id))
      .returning();
      
    return updated;
  }

  async reparentOrganization(id: string, newParentId: string | null) {
    const org = await this.getOrganization(id);
    
    await hierarchyService.validateHierarchy(newParentId, org.type);
    const newPath = await hierarchyService.calculatePath(org.id, newParentId);
    
    const [updated] = await db.update(organizations)
      .set({
        parentId: newParentId,
        path: newPath,
        updatedAt: new Date()
      })
      .where(eq(organizations.id, id))
      .returning();
      
    await hierarchyService.recalculateDescendantPaths(org.id, newPath);
    
    return updated;
  }

  async getDescendants(id: string) {
    const org = await this.getOrganization(id);
    
    const descendants = await db.query.organizations.findMany({
      where: like(organizations.path, `${org.path}.%`)
    });
    
    return descendants;
  }
}

export const organizationService = new OrganizationService();
