import type { FastifyRequest, FastifyReply } from 'fastify';
import { masterDb } from '../db/master.js';
import { getTenantDb } from '../db/tenant.js';
import { tenants } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';

/**
 * Middleware for Multi-database (DB-per-tenant) architecture.
 * It identifies the tenant by the 'x-tenant-slug' header (or subdomain),
 * retrieves the database name from the Master database,
 * and attaches the correct Drizzle instance to the request.
 */
export const tenantMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  const slug = request.headers['x-tenant-slug'] as string; 

  if (!slug) {
    return reply.status(403).send({ 
      error: 'Tenant context required',
      message: 'Header x-tenant-slug must be provided to select the correct database.'
    });
  }

  try {
    // 1. Find tenant in Master DB
    const [tenant] = await masterDb
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);

    if (!tenant) {
      return reply.status(404).send({ error: 'Tenant not found' });
    }

    // 2. Get the specific database connection for this tenant
    const tenantDb = getTenantDb(tenant.dbName);
    
    // 3. Attach to request for use in handlers
    (request as any).tenantDb = tenantDb;
    (request as any).tenant = tenant;

  } catch (error) {
    console.error('Error dynamic switching tenant database:', error);
    return reply.status(500).send({ error: 'Failed to establish tenant database connection' });
  }
};
