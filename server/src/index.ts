import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { join } from 'path';

// Load env before anything else
dotenv.config({ path: join(process.cwd(), '.env'), override: true });
console.log('✅ DATABASE_URL:', process.env.DATABASE_URL?.includes('postgres') ? 'Loaded' : 'MISSING');
console.log('🚀 API RELOADED - VERSION: 2.2');

import { tenantMiddleware } from './middleware/tenant.js';
// Trigger restart to refresh DB pools and schema
import { masterDb }         from './db/master.js';
import { provisionTenant }  from './db/provisioning.js';
import { 
  inventoryMovementItems, 
  payments,
  paymentMethods,
  tenants,
  masterUsers,
  cobrancas,
  fichas,
  users,
  products,
  routes,
  clients,
  sellerInventory,
  fichaItems,
  inventoryMovements,
  userRoutes
} from './db/schema/index.js';
import { eq, ne, and, ilike, sql, desc, inArray, gte, lte, or, isNull } from "drizzle-orm";
import { getTenantDb } from './db/tenant.js';
import { generateProductSKU } from './lib/sku.js';
import { hashPassword, comparePassword } from './lib/auth.js';


import fastifyJwt from '@fastify/jwt';

const fastify = Fastify({ logger: false });

async function bootstrap() {
  // ─── JWT ──────────────────────────────────────────────────────────────────
  await fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'vendas-pro-secret-123-super-secure'
  });

  // ─── CORS ─────────────────────────────────────────────────────────────────
  await fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-slug'],
    credentials: true,
  });

  // ─── Native Auth: Register Master User ────────────────────────────────────
  fastify.post('/auth/register', async (request, reply) => {
    const { email, password, name } = request.body as any;
    
    if (!email || !password || !name) {
      return reply.status(400).send({ error: 'Dados incompletos' });
    }

    try {
      const [existing] = await masterDb.select().from(masterUsers).where(eq(masterUsers.email, email)).limit(1);
      if (existing) {
        return reply.status(400).send({ error: 'E-mail já cadastrado' });
      }

      const passwordHash = await hashPassword(password);
      const [newUser] = (await masterDb.insert(masterUsers).values({
        email,
        name,
        passwordHash
      }).returning()) as any[];

      return { id: newUser.id, email: newUser.email, name: newUser.name };
    } catch (error) {
      console.error('Register error:', error);
      return reply.status(500).send({ error: 'Erro interno ao registrar' });
    }
  });

  // ─── Native Auth: Login ───────────────────────────────────────────────────
  fastify.post('/auth/login', async (request, reply) => {
    const { email, password } = request.body as any;

    try {
      const [user] = await masterDb.select().from(masterUsers).where(eq(masterUsers.email, email)).limit(1);
      if (!user) {
        return reply.status(401).send({ error: 'Credenciais inválidas' });
      }

      const isValid = await comparePassword(password, user.passwordHash);
      if (!isValid) {
        return reply.status(401).send({ error: 'Credenciais inválidas' });
      }

      // Check for tenant. Priority: Linked tenantId, Fallback: ownerId
      let tenant;
      if (user.tenantId) {
        [tenant] = await masterDb.select().from(tenants).where(eq(tenants.id, user.tenantId)).limit(1);
      } else {
        [tenant] = await masterDb.select().from(tenants).where(eq(tenants.ownerId, user.id)).limit(1);
      }

      const token = fastify.jwt.sign({ 
        userId: user.id, 
        email: user.email, 
        tenantId: tenant?.id,
        tenantSlug: tenant?.slug 
      });

      return { 
        token, 
        user: { id: user.id, email: user.email, name: user.name },
        tenant: tenant ? { slug: tenant.slug, name: tenant.name } : null
      };
    } catch (error) {
      console.error('Login error:', error);
      return reply.status(500).send({ error: 'Erro interno no login' });
    }
  });

  // ─── Native Auth: Me ──────────────────────────────────────────────────────
  fastify.get('/auth/me', async (request, reply) => {
    try {
      await request.jwtVerify();
      const payload = request.user as any;
      const [user] = await masterDb.select().from(masterUsers).where(eq(masterUsers.id, payload.userId)).limit(1);
      if (!user) return reply.status(401).send({ error: 'Usuário não encontrado' });

      // Identify tenant
      let tenant;
      if (user.tenantId) {
        [tenant] = await masterDb.select().from(tenants).where(eq(tenants.id, user.tenantId)).limit(1);
      } else {
        [tenant] = await masterDb.select().from(tenants).where(eq(tenants.ownerId, user.id)).limit(1);
      }

      return { 
        user: { id: user.id, email: user.email, name: user.name },
        tenant: tenant ? { slug: tenant.slug, name: tenant.name } : null
      };
    } catch (err) {
      return reply.status(401).send({ error: 'Não autorizado' });
    }
  });

  // ─── Public: Provisioning (Updated for local User ID) ─────────────────────
  fastify.post('/auth/provision', async (request, reply) => {
    const { name, userId, email, addressData, contact, ownerName, ownerCpf } = request.body as {
      name: string;
      userId: string;
      email: string;
      addressData: any;
      contact?: string;
      ownerName?: string;
      ownerCpf?: string;
    };
    console.log(`🚀 Provisioning: ${name} (User: ${userId}, Email: ${email})`);
    try {
      // Get the existing master user to retrieve their password hash
      const [masterUser] = await masterDb.select().from(masterUsers).where(eq(masterUsers.id, userId)).limit(1);
      if (!masterUser) {
        throw new Error('Usuário mestre não encontrado para o provisionamento.');
      }

      const result = await provisionTenant(
        name, 
        userId, 
        email, 
        masterUser.passwordHash, // Sync password to tenant
        addressData, 
        contact, 
        ownerName, 
        ownerCpf
      );
      return result;
    } catch (error: any) {
      console.error('Provisioning error:', error);
      return reply.status(400).send({ error: error.message || 'Failed to provision' });
    }
  });

  // ─── Public: Auth Status (Updated for local User ID) ──────────────────────
  fastify.get('/auth/status/:userId', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    
    try {
      // 1. Get user from master specifically to find their tenant_id
      const [user] = await masterDb
        .select()
        .from(masterUsers)
        .where(eq(masterUsers.id, userId))
        .limit(1);

      if (!user) {
        return { onboardingStep: 'personal', hasTenant: false };
      }

      // 2. Resolve tenant (either by direct link or ownership fallback)
      let tenant;
      if (user.tenantId) {
        [tenant] = await masterDb
          .select()
          .from(tenants)
          .where(eq(tenants.id, user.tenantId))
          .limit(1);
      } else {
        // Fallback for owners whose tenantId might not be synced yet or legacy
        [tenant] = await masterDb
          .select()
          .from(tenants)
          .where(eq(tenants.ownerId, userId))
          .limit(1);
      }

      if (!tenant) {
        return { 
          onboardingStep: 'personal',
          hasTenant: false 
        };
      }

      return {
        onboardingStep: 'completed',
        hasTenant: true,
        tenant: { slug: tenant.slug, name: tenant.name }
      };
    } catch (error) {
      console.error('🔥 Auth Status Error:', error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // ─── Public: Tenant Info ──────────────────────────────────────────────────
  fastify.get('/tenant/info', { preHandler: tenantMiddleware }, async (request) => {
    return (request as any).tenant;
  });

  // ─── Protected Routes (require x-tenant-slug header OR ?tenant slug query) ──
  fastify.register(async (instance) => {
    instance.addHook('preHandler', tenantMiddleware);

    // ── Clients Management ───────────────────────────────────────────────────
    instance.get('/clients', async (request) => {
      const db = (request as any).tenantDb;
      const q = request.query as Record<string, string>;

      const page  = Number(q.page) || 1;
      const limit = Number(q.limit) || 10;
      const offset = (page - 1) * limit;

      const conditions: any[] = [];
      if (q.name)    conditions.push(ilike(clients.name,    `%${q.name}%`));
      if (q.state)   conditions.push(ilike(clients.state,   `%${q.state}%`));
      if (q.city)    conditions.push(ilike(clients.city,    `%${q.city}%`));
      if (q.street)  conditions.push(ilike(clients.street,  `%${q.street}%`));
      if (q.routeId) conditions.push(eq(clients.routeId,   q.routeId));
      
      if (q.sellerId) {
        // Filter clients belonging to routes assigned to this seller
        const subquery = db
          .select({ id: userRoutes.routeId })
          .from(userRoutes)
          .where(eq(userRoutes.userId, q.sellerId));
        
        conditions.push(inArray(clients.routeId, subquery));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [{ count }] = await db
        .select({ count: sql`count(*)` })
        .from(clients)
        .where(whereClause);

      const items = await db
        .select({
          id:           clients.id,
          code:         clients.code,
          name:         clients.name,
          cpf:          clients.cpf,
          phone:        clients.phone,
          street:       clients.street,
          number:       clients.number,
          neighborhood: clients.neighborhood,
          city:         clients.city,
          state:        clients.state,
          zipCode:      clients.zipCode,
          nickname:     clients.nickname,
          referencePoint: clients.referencePoint,
          phone2:       clients.phone2,
          comment:      clients.comment,
          routeId:      clients.routeId,
          routeName:    routes.name,
          active:       clients.active,
          createdAt:    clients.createdAt,
        })
        .from(clients)
        .leftJoin(routes, eq(clients.routeId, routes.id))
        .where(whereClause)
        .orderBy(clients.name)
        .limit(limit)
        .offset(offset);

      return {
        items,
        pagination: {
          total: Number(count),
          page,
          limit,
          pages: Math.ceil(Number(count) / limit)
        }
      };
    });

    instance.post('/clients', async (request, reply) => {
      const db = (request as any).tenantDb;
      const body = request.body as any;
      try {
        const [newClient] = (await db.insert(clients).values({
          id:           body.id || require('crypto').randomUUID(),
          name:         body.name,
          cpf:          body.cpf || null,
          phone:        body.phone || null,
          street:       body.street || null,
          number:       body.number || null,
          neighborhood: body.neighborhood || null,
          city:         body.city || null,
          state:        body.state || null,
          zipCode:      body.zipCode || null,
          nickname:     body.nickname || null,
          referencePoint: body.referencePoint || body.reference_point || null,
          phone2:       body.phone2 || null,
          comment:      body.comment || null,
          routeId:      body.routeId || body.route_id || null,
        }).returning()) as any[];
        return newClient;
      } catch (error) {
        console.error("Create client error:", error);
        return reply.status(400).send({ error: "Erro ao criar cliente" });
      }
    });

    instance.post('/clients/:id', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };
      const body = request.body as any;
      try {
        const [updatedClient] = (await db
          .update(clients)
          .set({
            name:         body.name,
            cpf:          body.cpf,
            phone:        body.phone,
            street:       body.street,
            number:       body.number,
            neighborhood: body.neighborhood,
            city:         body.city,
            state:        body.state,
            zipCode:      body.zipCode,
            nickname:     body.nickname,
            referencePoint: body.referencePoint || body.reference_point,
            phone2:       body.phone2,
            comment:      body.comment,
            routeId:      body.routeId || body.route_id,
          })
          .where(eq(clients.id, id))
          .returning()) as any[];
        return updatedClient;
      } catch (error) {
        return reply.status(400).send({ error: "Erro ao atualizar cliente" });
      }
    });

    instance.post('/clients/:id/toggle-status', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };
      try {
        const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
        if (!client) return reply.status(404).send({ error: "Cliente não encontrado" });
        const [updated] = (await db.update(clients).set({ active: !client.active }).where(eq(clients.id, id)).returning()) as any[];
        return updated;
      } catch (error) {
        return reply.status(400).send({ error: "Erro ao alterar status" });
      }
    });

    // ── Auth: Seller Login ──────────────────────────────────────────────────
    instance.post('/auth/seller/login', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { appCode, password } = request.body as any;

      if (!appCode || !password) {
        return reply.status(400).send({ error: "Código e senha são obrigatórios" });
      }

      try {
        const [user] = await db
          .select()
          .from(users)
          .where(and(eq(users.appCode, appCode), eq(users.active, true)))
          .limit(1);

        const isValid = user.passwordHash ? await comparePassword(password, user.passwordHash) : (user.password === password);
        
        if (!user || !isValid) {
          return reply.status(401).send({ error: "Credenciais inválidas" });
        }

        // Generate JWT
        const token = fastify.jwt.sign({ 
          id: user.id, 
          role: user.role, 
          tenant: (request as any).tenant.slug 
        });

        return {
          token,
          user: {
            id: user.id,
            name: user.name,
            role: user.role,
            appCode: user.appCode,
            code: user.code
          }
        };
      } catch (err) {
        console.error("Login error:", err);
        return reply.status(500).send({ error: "Erro interno no servidor" });
      }
    });

    // ── Employees (Vendedores) ──────────────────────────────────────────────
    instance.get('/employees', async (request) => {
      const db = (request as any).tenantDb;
      const q  = request.query as Record<string, string>;
      const page  = Number(q.page) || 1;
      const limit = Number(q.limit) || 10;
      const offset = (page - 1) * limit;

      const conditions = [inArray(users.role, ['seller', 'admin'])];
      if (q.name) conditions.push(ilike(users.name, `%${q.name}%`));

      const [{ count }] = await db.select({ count: sql`count(*)` }).from(users).where(and(...conditions));
      const sellers = await db.select().from(users).where(and(...conditions)).orderBy(users.name).limit(limit).offset(offset);

      const items = await Promise.all(sellers.map(async (s: any) => {
        const ur = await db.select({ routeId: userRoutes.routeId }).from(userRoutes).where(eq(userRoutes.userId, s.id));
        return { ...s, routeIds: ur.map((r: any) => r.routeId) };
      }));

      return { items, pagination: { total: Number(count), page, limit, pages: Math.ceil(Number(count) / limit) } };
    });

    instance.post('/employees', async (request, reply) => {
      const db = (request as any).tenantDb;
      const body = request.body as any;
      try {
        if (body.email) {
          const [exists] = await masterDb.select().from(masterUsers).where(eq(masterUsers.email, body.email)).limit(1);
          if (exists) {
            return reply.status(400).send({ error: "E-mail já cadastrado no sistema" });
          }
        }

        const result = await db.transaction(async (tx: any) => {
          const passHash = await hashPassword(body.password);
          const [newUser] = (await tx.insert(users).values({
            name:     body.name,
            appCode:  body.appCode,
            passwordHash: passHash,
            webAccess: !!body.webAccess,
            phone:    body.phone,
            role:     body.role || 'seller', // Allow specifying role
            email:    body.email,
          }).returning()) as any[];

          if (body.webAccess && body.email) {
            const tenantId = (request as any).tenant?.id;
            
            // Check if user already exists in master (global unique email)
            const [existingMaster] = await masterDb.select().from(masterUsers).where(eq(masterUsers.email, body.email)).limit(1);
            
            if (existingMaster) {
              await masterDb.update(masterUsers)
                .set({ passwordHash: passHash, tenantId: tenantId, name: body.name })
                .where(eq(masterUsers.email, body.email));
            } else {
              await masterDb.insert(masterUsers).values({
                name: body.name,
                email: body.email,
                passwordHash: passHash,
                tenantId: tenantId
              });
            }
          }

          if (body.routeIds && Array.isArray(body.routeIds)) {
            for (const rId of body.routeIds) {
              await tx.insert(userRoutes).values({ userId: newUser.id, routeId: rId });
            }
          }
          return newUser;
        });
        return result;
      } catch (error) {
        console.error('Create employee error:', error);
        return reply.status(400).send({ error: "Erro ao criar funcionário" });
      }
    });

    instance.post('/employees/:id', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };
      const body = request.body as any;

      try {
        const result = await db.transaction(async (tx: any) => {
          const [oldUser] = await tx.select().from(users).where(eq(users.id, id)).limit(1);
          if (!oldUser) throw new Error("Funcionário não encontrado");

          if (body.email && body.email !== oldUser.email) {
            const [exists] = await masterDb.select().from(masterUsers).where(eq(masterUsers.email, body.email)).limit(1);
            if (exists) throw new Error("E-mail já cadastrado no sistema");
          }

          const updateData: any = {
            name:     body.name,
            appCode:  body.appCode,
            phone:    body.phone,
            email:    body.email,
            webAccess: !!body.webAccess,
            updatedAt: new Date(),
          };

          if (body.password) {
            updateData.passwordHash = await hashPassword(body.password);
          }

          const [updatedUser] = (await tx
            .update(users)
            .set(updateData)
            .where(eq(users.id, id))
            .returning()) as any[];
          
          // Sync with Master
          const [masterUser] = await masterDb.select().from(masterUsers).where(eq(masterUsers.email, oldUser.email)).limit(1);
          
          if (body.webAccess) {
            const tenantId = (request as any).tenant?.id;
            if (masterUser) {
              await masterDb.update(masterUsers)
                .set({
                  name: body.name,
                  email: body.email,
                  passwordHash: updateData.passwordHash || masterUser.passwordHash,
                  tenantId: tenantId // Ensure tenantId is set/updated
                })
                .where(eq(masterUsers.id, masterUser.id));
            } else {
              await masterDb.insert(masterUsers).values({
                name: body.name,
                email: body.email,
                passwordHash: updateData.passwordHash || oldUser.passwordHash,
                tenantId: tenantId
              });
            }
          } else if (masterUser) {
             // If webAccess REMOVED, delete from master unless it's the owner?
             // Actually, the owner is in tenants table as ownerId.
             const [isOwner] = await masterDb.select().from(tenants).where(eq(tenants.ownerId, masterUser.id)).limit(1);
             if (!isOwner) {
               await masterDb.delete(masterUsers).where(eq(masterUsers.id, masterUser.id));
             }
          }

          if (!updatedUser) {
            throw new Error("Funcionário não encontrado");
          }

          // Update Routes
          if (body.routeIds && Array.isArray(body.routeIds)) {
            // Remove old
            await tx.delete(userRoutes).where(eq(userRoutes.userId, id));
            // Add new
            for (const rId of body.routeIds) {
              await tx.insert(userRoutes).values({ userId: id, routeId: rId });
            }
          }

          return updatedUser;
        });
        return result;
      } catch (error: any) {
        console.error("Update employee error:", error);
        return reply.status(400).send({ error: error.message || "Erro ao atualizar funcionário" });
      }
    });

    instance.get('/fichas/:id/items', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };
      try {
        const items = await db.select({
          id: fichaItems.id,
          productId: fichaItems.productId,
          name: products.name,
          quantity: fichaItems.quantity,
          unitPrice: fichaItems.unitPrice,
          subtotal: fichaItems.subtotal,
          commissionType: fichaItems.commissionType
        })
        .from(fichaItems)
        .leftJoin(products, eq(fichaItems.productId, products.id))
        .where(eq(fichaItems.fichaId, id));
        return items;
      } catch (err) {
        return reply.status(400).send({ error: "Erro ao buscar itens" });
      }
    });

    instance.patch('/ficha-items/:id', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };
      const { quantity, unitPrice, subtotal, commissionType } = request.body as any;

      try {
        const result = await db.transaction(async (tx: any) => {
          // 1. Get old item data
          const [oldItem] = await tx.select().from(fichaItems).where(eq(fichaItems.id, id)).limit(1);
          if (!oldItem) throw new Error("Item não encontrado");

          // 2. Update item
          const [updated] = await tx.update(fichaItems)
            .set({
              quantity: quantity ?? oldItem.quantity,
              unitPrice: unitPrice ?? oldItem.unitPrice,
              subtotal: subtotal ?? oldItem.subtotal,
              commissionType: commissionType ?? oldItem.commissionType,
            })
            .where(eq(fichaItems.id, id))
            .returning();

          // 3. Update Seller Stock
          const [ficha] = await tx.select().from(fichas).where(eq(fichas.id, oldItem.fichaId)).limit(1);
          if (ficha) {
            const qtyDiff = oldItem.quantity - (quantity ?? oldItem.quantity);
            if (qtyDiff !== 0) {
              await tx.execute(sql`
                UPDATE seller_inventory 
                SET stock = stock + ${qtyDiff}, updated_at = now()
                WHERE seller_id = ${ficha.sellerId} AND product_id = ${oldItem.productId}
              `);
            }
          }

          // 4. Update Ficha Total
          const allItems = await tx.select().from(fichaItems).where(eq(fichaItems.fichaId, oldItem.fichaId));
          const newTotal = allItems.reduce((acc: number, curr: any) => acc + (Number(curr.subtotal) || 0), 0);
          await tx.update(fichas).set({ total: newTotal, updatedAt: new Date() }).where(eq(fichas.id, oldItem.fichaId));

          return updated;
        });
        return result;
      } catch (err: any) {
        console.error('Update item failed:', err);
        return reply.status(400).send({ error: err.message || "Erro ao atualizar item" });
      }
    });

    instance.post('/fichas/:id/items', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id: fichaId } = request.params as { id: string };
      const { productId, quantity, unitPrice, subtotal, commissionType, id: itemId } = request.body as any;

      try {
        const result = await db.transaction(async (tx: any) => {
          // 1. Get ficha
          const [ficha] = await tx.select().from(fichas).where(eq(fichas.id, fichaId)).limit(1);
          if (!ficha) throw new Error("Ficha não encontrada");

          // 2. Insert item
          const [newItem] = await tx.insert(fichaItems).values({
            id: itemId || undefined, // Use provided ID from mobile for sync consistency
            fichaId,
            productId,
            quantity,
            unitPrice,
            subtotal,
            commissionType
          }).returning();

          // 3. Update Seller Stock
          await tx.execute(sql`
            UPDATE seller_inventory 
            SET stock = stock - ${quantity}, updated_at = now()
            WHERE seller_id = ${ficha.sellerId} AND product_id = ${productId}
          `);

          // 4. Update Ficha Total
          const allItems = await tx.select().from(fichaItems).where(eq(fichaItems.fichaId, fichaId));
          const newTotal = allItems.reduce((acc: number, curr: any) => acc + (Number(curr.subtotal) || 0), 0);
          await tx.update(fichas).set({ total: newTotal, updatedAt: new Date() }).where(eq(fichas.id, fichaId));

          return newItem;
        });
        return result;
      } catch (err: any) {
        console.error('Add item failed:', err);
        return reply.status(400).send({ error: err.message || "Erro ao adicionar item" });
      }
    });

    instance.patch('/fichas/:id/convert-order', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };
      const { cobrancaId } = request.body as { cobrancaId: string };
      
      try {
        const result = await db.transaction(async (tx: any) => {
          const [ficha] = await tx.select().from(fichas).where(eq(fichas.id, id));
          if (!ficha) throw new Error("Ficha não encontrada");
          
          const seller = await tx.select().from(users).where(eq(users.id, ficha.sellerId)).limit(1).then((r:any)=>r[0]||null);
          const route = await tx.select().from(routes).where(eq(routes.id, ficha.routeId)).limit(1).then((r:any)=>r[0]||null);
          const now = new Date();
          const datestr = `${String(now.getDate()).padStart(2,'0')}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
          // Generate a code following existing pattern (Seller(4) + DDMMHHmm + Route(4))
          const finalCode = `${String(seller?.code||0).padStart(4,'0')}${datestr}${String(route?.code||0).padStart(4,'0')}`;

          const [updated] = (await tx.update(fichas)
            .set({ 
              status: 'nova', 
              code: finalCode,
              saleDate: now,
              cobrancaId: cobrancaId || null,
              updatedAt: new Date()
            })
            .where(eq(fichas.id, id))
            .returning()) as any[];
            
          return updated;
        });
        return result;
      } catch (err: any) {
        console.error('Convert order failed:', err);
        return reply.status(400).send({ error: err.message || "Erro ao gerar ficha" });
      }
    });

    // ─── Finish setup ──────────────────────────────────────────────────────────
    // ── Products ─────────────────────────────────────────────────────────────
    instance.get('/products', async (request) => {
      const db = (request as any).tenantDb;
      const q  = request.query as Record<string, string>;
      const page  = Number(q.page) || 1;
      const limit = Number(q.limit) || 1000;
      const offset = (page - 1) * limit;

      const conditions: any[] = [];
      if (q.sku)       conditions.push(ilike(products.sku, `%${q.sku}%`));
      if (q.descricao) conditions.push(ilike(products.name, `%${q.descricao}%`));
      if (q.categoria) conditions.push(ilike(products.category, `%${q.categoria}%`));
      if (q.marca)     conditions.push(ilike(products.brand, `%${q.marca}%`));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const [{ count }] = await db.select({ count: sql`count(*)` }).from(products).where(whereClause);
      
      let query = db.select({
        id: products.id,
        sku: products.sku,
        name: products.name,
        description: products.description,
        category: products.category,
        brand: products.brand,
        stockDeposit: products.stockDeposit,
        costPrice: products.costPrice,
        priceCC: products.priceCC,
        priceSC: products.priceSC,
        active: products.active,
        createdAt: products.createdAt,
        stock: q.sellerId ? sellerInventory.stock : products.stockDeposit
      }).from(products);

      if (q.sellerId) {
        query = query.leftJoin(sellerInventory, and(eq(sellerInventory.productId, products.id), eq(sellerInventory.sellerId, q.sellerId)));
      }

      const allProducts = await query.where(whereClause).limit(limit).offset(offset);

      const items = allProducts.map((p: any) => ({
        ...p,
        stock: Number(p.stock) || 0,
        subtotalCusto: Number(p.costPrice) * (Number(p.stock) || 0),
        subtotalCC:    Number(p.priceCC) * (Number(p.stock) || 0),
        subtotalSC:    Number(p.priceSC) * (Number(p.stock) || 0),
      }));

      return { items, pagination: { total: Number(count), page, limit, pages: Math.ceil(Number(count) / limit) } };
    });

    instance.post('/products', async (request, reply) => {
      const db = (request as any).tenantDb;
      const body = request.body as any;
      try {
        const sku = body.sku || generateProductSKU();
        const [newProduct] = (await db.insert(products).values({
          name:         body.name,
          sku:          sku,
          category:     body.category || null,
          brand:        body.brand || null,
          stockDeposit: Number(body.stockDeposit) || 0,
          costPrice:    Number(body.costPrice) || 0,
          priceCC:      Number(body.priceCC) || 0,
          priceSC:      Number(body.priceSC) || 0,
          active:       true,
        }).returning()) as any[];
        return newProduct;
      } catch (error) {
        console.error("Create product error:", error);
        return reply.status(400).send({ error: "Erro ao criar produto" });
      }
    });

    instance.put('/products/:id', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };
      const body = request.body as any;
      try {
        const [updatedProduct] = (await db
          .update(products)
          .set({
            name:         body.name,
            category:     body.category,
            brand:        body.brand,
            costPrice:    Number(body.costPrice),
            priceCC:      Number(body.priceCC),
            priceSC:      Number(body.priceSC),
            updatedAt:    new Date(),
          })
          .where(eq(products.id, id))
          .returning()) as any[];
        return updatedProduct;
      } catch (error) {
        return reply.status(400).send({ error: "Erro ao atualizar produto" });
      }
    });

    instance.delete('/products/:id', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };
      try {
        // Soft delete as requested
        const [updated] = (await db.update(products).set({ active: false }).where(eq(products.id, id)).returning()) as any[];
        return updated;
      } catch (error) {
        return reply.status(400).send({ error: "Erro ao desativar produto" });
      }
    });


    // ── Fichas Overview & Creation ───────────────────────────────────────────
    instance.get('/fichas', async (request) => {
      const db = (request as any).tenantDb;
      const q  = request.query as Record<string, string>;
      const page = Number(q.page) || 1;
      const limit = Number(q.limit) || 10;
      const offset = (page - 1) * limit;

      const conditions: any[] = [];
      if (q.status) conditions.push(eq(fichas.status, q.status as any));
      if (q.routeId) conditions.push(eq(fichas.routeId, q.routeId));
      if (q.cliente) conditions.push(ilike(clients.name, `%${q.cliente}%`));
      if (q.clientId) conditions.push(eq(fichas.clientId, q.clientId));
      if (q.sellerId) conditions.push(eq(fichas.sellerId, q.sellerId));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Count total matching filters
      const [{ count }] = await db
        .select({ count: sql`count(*)` })
        .from(fichas)
        .leftJoin(clients, eq(fichas.clientId, clients.id))
        .where(whereClause);

      // Count specifically 'pedido' status
      const [{ ordersCount }] = await db
        .select({ ordersCount: sql`count(*)` })
        .from(fichas)
        .where(eq(fichas.status, 'pedido'));

      const items = await db
        .select({
          id: fichas.id,
          code: fichas.code,
          status: fichas.status,
          total: fichas.total,
          saleDate: fichas.saleDate,
          clientId: fichas.clientId,
          sellerId: fichas.sellerId,
          routeId: fichas.routeId,
          cobrancaId: fichas.cobrancaId,
          clientName: clients.name,
          sellerName: users.name,
          routeName: routes.name,
          linkToken: fichas.linkToken
        })
        .from(fichas)
        .leftJoin(clients, eq(fichas.clientId, clients.id))
        .leftJoin(users, eq(fichas.sellerId, users.id))
        .leftJoin(routes, eq(fichas.routeId, routes.id))
        .where(whereClause)
        .orderBy(desc(fichas.createdAt))
        .limit(limit)
        .offset(offset);

      return { 
        items,
        pagination: {
          total: Number(count),
          page,
          limit,
          pages: Math.ceil(Number(count) / limit)
        },
        stats: {
          ordersCount: Number(ordersCount)
        }
      };
    });

    instance.get('/fichas/:id', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };
      console.log(`🔍 Fetching ficha details for ID: ${id}`);

      try {
        const ficha = await db.query.fichas.findFirst({
          where: eq(fichas.id, id),
          with: {
            client: true,
            seller: {
              columns: { name: true }
            },
            items: {
              with: {
                product: {
                  columns: { name: true, sku: true }
                }
              }
            },
            payments: {
              with: {
                method: {
                  columns: { name: true }
                }
              }
            }
          }
        });

        if (!ficha) {
          console.error("❌ Ficha not found");
          return reply.status(404).send({ error: "Ficha não encontrada" });
        }

        console.log(`✅ Ficha ${id} loaded with ${ficha.items?.length || 0} items. Calculating stats...`);

        // Transform items to match expected format (flatten productName)
        const items = (ficha.items || []).map((i: any) => ({
          ...i,
          productName: i.product?.name,
          sku: i.product?.sku
        }));

        // Transform payments to match expected format (flatten methodName)
        const fichaPayments = (ficha.payments || []).map((p: any) => ({
          ...p,
          methodName: p.method?.name
        }));

        const qField = ficha.status === 'nova' ? 'quantity' : 'quantitySold';

        const totalValueCC = items
          .filter((i: any) => i.commissionType === 'CC' || i.commissionType === 'com_comissao')
          .reduce((acc: number, curr: any) => acc + (Number(curr[qField]) * Number(curr.unitPrice)), 0);
        
        const totalValueSC = items
          .filter((i: any) => i.commissionType === 'SC' || i.commissionType === 'sem_comissao')
          .reduce((acc: number, curr: any) => acc + (Number(curr[qField]) * Number(curr.unitPrice)), 0);

        const totalPaid = fichaPayments.filter((p: any) => !p.cancelled).reduce((acc: number, p: any) => acc + Number(p.amount), 0);
        const commissionVal = totalValueCC * (Number(ficha.commissionPercent || 30) / 100);
        const netCC = totalValueCC - commissionVal;
        const totalToPay = netCC + totalValueSC;
        const balance = totalToPay - totalPaid - Number(ficha.discount || 0);

        return {
          ...ficha,
          items,
          payments: fichaPayments,
          stats: {
            totalCC: totalValueCC,
            totalSC: totalValueSC,
            totalToPay,
            totalPaid,
            balance,
            itemCount: items.length
          }
        };
      } catch (err: any) {
        console.error("🔥 Error in GET /fichas/:id:", err);
        return reply.status(500).send({ error: "Internal Server Error", message: err.message });
      }
    });

    instance.delete('/fichas/:id', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as any;
      
      const [ficha] = await db.select().from(fichas).where(eq(fichas.id, id)).limit(1);
      if (!ficha) return reply.status(404).send({ error: "Não encontrado" });
      
      // Only allow cancelling if it's still a generated link or a new order (optional policy)
      // For now, let's just allow deleting any ficha if the admin wants.
      await db.delete(fichas).where(eq(fichas.id, id));
      return { success: true };
    });

    instance.post('/fichas', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id, clientId, sellerId, routeId, items, total, notes, cobrancaId, saleDate } = request.body as any;

      try {
        const result = await db.transaction(async (tx: any) => {
          // Generate Code
          const [seller] = await tx.select({ code: users.code }).from(users).where(eq(users.id, sellerId)).limit(1);
          const [route]  = await tx.select({ code: routes.code }).from(routes).where(eq(routes.id, routeId)).limit(1);
          const now = new Date();
          const datestr = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
          const finalCode = `${String(seller?.code||0).padStart(4,'0')}${datestr}${String(route?.code||0).padStart(4,'0')}`;
          const [newFicha] = await tx.insert(fichas).values({
            id: id || undefined,
            clientId,
            sellerId,
            routeId,
            cobrancaId: cobrancaId || null,
            total: total || 0,
            status: 'nova',
            code: finalCode,
            saleDate: saleDate ? new Date(saleDate) : now,
            notes
          }).returning();

          for (const item of items) {
            // Validate Stock
            const [current] = await tx.select({ stock: sellerInventory.stock }).from(sellerInventory)
              .where(and(eq(sellerInventory.sellerId, sellerId), eq(sellerInventory.productId, item.productId)))
              .limit(1);
            
            const currentStock = current ? current.stock : 0;
            if (currentStock < item.quantity) {
              throw new Error(`Estoque insuficiente para o produto ${item.productId}`);
            }

            await tx.insert(fichaItems).values({ 
              fichaId: newFicha.id, 
              productId: item.productId, 
              quantity: item.quantity, 
              unitPrice: item.unitPrice, 
              subtotal: item.quantity * item.unitPrice,
              commissionType: item.commissionType || 'CC'
            });
            await tx.execute(sql`UPDATE seller_inventory SET stock = stock - ${item.quantity} WHERE seller_id = ${sellerId} AND product_id = ${item.productId}`);
          }
          return newFicha;
        });
        return result;
      } catch (err: any) {
        console.error('[SERVER ERROR] /api/fichas POST:', err);
        return reply.status(400).send({ 
          error: "Failed to create ficha", 
          detail: err.message,
          stack: err.stack 
        });
      }
    });

    // ── Ficha Link Generation ───────────────────────────────────────────────
    instance.post('/fichas/generate-link', async (request, reply) => {
      const db = (request as any).tenantDb;
      const slug = (request as any).tenant.slug;
      const { clientId, sellerId, routeId, notes } = request.body as any;

      try {
        const linkToken = Math.random().toString(36).substring(2, 10);
        const [newFicha] = (await db.insert(fichas).values({
          clientId, sellerId, routeId, notes: notes || "Link gerado para o cliente", status: 'link_gerado', linkToken, total: 0
        }).returning()) as any[];

        return { linkToken, url: `/public/ficha/${linkToken}?tenant=${slug}` };
      } catch (err) {
        return reply.status(400).send({ error: "Erro ao criar ficha" });
      }
    });

    instance.patch('/fichas/:id/settle', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };
      const { items, discount, commissionPercent } = request.body as any;

      try {
        await db.transaction(async (tx: any) => {
          const [ficha] = await tx.select().from(fichas).where(eq(fichas.id, id));
          if (!ficha) throw new Error("Ficha não encontrada");
          if (ficha.status === 'paga') throw new Error("Ficha já está paga e não pode ser alterada");

          // Update Ficha header
          await tx.update(fichas)
            .set({ 
              discount: discount ?? ficha.discount, 
              commissionPercent: commissionPercent ?? ficha.commissionPercent,
              updatedAt: new Date() 
            })
            .where(eq(fichas.id, id));

          for (const item of items) {
            const [existingItem] = await tx.select().from(fichaItems).where(eq(fichaItems.id, item.id));
            if (!existingItem) continue;

            const returnDiff = item.quantityReturned - existingItem.quantityReturned;

            await tx.update(fichaItems)
              .set({
                quantitySold: item.quantitySold,
                quantityReturned: item.quantityReturned,
              })
              .where(eq(fichaItems.id, item.id));

            if (returnDiff !== 0) {
              await tx.execute(sql`
                UPDATE seller_inventory 
                SET stock = stock + ${returnDiff} 
                WHERE seller_id = ${ficha.sellerId} AND product_id = ${existingItem.productId}
              `);
            }
          }

          // Check if balance is zero after settlement
          await updateFichaStatusIfPaid(tx, id);
        });
        return { success: true };
      } catch (err: any) {
        console.error('Settle ficha failed:', err);
        return reply.status(400).send({ error: err.message || "Erro ao salvar acerto" });
      }
    });

    // Delete item from ficha
    instance.delete('/fichas/:id/items/:itemId', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id, itemId } = request.params as { id: string, itemId: string };

      try {
        await db.transaction(async (tx: any) => {
           const [ficha] = await tx.select().from(fichas).where(eq(fichas.id, id)).limit(1);
           if (!ficha) throw new Error("Ficha não encontrada");
           if (ficha.status !== 'nova') throw new Error("Apenas fichas com status NOVA podem ter itens removidos");

           await tx.delete(fichaItems).where(eq(fichaItems.id, itemId));

           // Recalculate
           const allItems = await tx.select().from(fichaItems).where(eq(fichaItems.fichaId, id));
           const newTotal = allItems.reduce((acc: number, curr: any) => acc + Number(curr.subtotal), 0);
           await tx.update(fichas).set({ total: newTotal, updatedAt: new Date() }).where(eq(fichas.id, id));
           await updateFichaStatusIfPaid(tx, id);
        });
        return { message: "Item removido" };
      } catch (err: any) {
        return reply.status(400).send({ error: err.message });
      }
    });

    // Update item in ficha
    instance.patch('/fichas/:id/items/:itemId', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id, itemId } = request.params as { id: string, itemId: string };
      const { quantity, unitPrice, commissionType } = request.body as any;

      try {
        await db.transaction(async (tx: any) => {
           const [ficha] = await tx.select().from(fichas).where(eq(fichas.id, id)).limit(1);
           if (!ficha) throw new Error("Ficha não encontrada");
           if (ficha.status !== 'nova') throw new Error("Apenas fichas com status NOVA podem ter itens alterados");

           await tx.update(fichaItems)
             .set({ 
                quantity: Number(quantity), 
                unitPrice: Number(unitPrice), 
                subtotal: Number(quantity) * Number(unitPrice), 
                commissionType,
                updatedAt: new Date() 
             })
             .where(eq(fichaItems.id, itemId));

           // Recalculate
           const allItems = await tx.select().from(fichaItems).where(eq(fichaItems.fichaId, id));
           const newTotal = allItems.reduce((acc: number, curr: any) => acc + Number(curr.subtotal), 0);
           await tx.update(fichas).set({ total: newTotal, updatedAt: new Date() }).where(eq(fichas.id, id));
           await updateFichaStatusIfPaid(tx, id);
        });
        return { message: "Item atualizado" };
      } catch (err: any) {
        return reply.status(400).send({ error: err.message });
      }
    });

    // Helper to auto-update status to 'paga'
    async function updateFichaStatusIfPaid(tx: any, fichaId: string) {
      console.log(`[DEBUG] updateFichaStatusIfPaid triggered for ${fichaId}`);
      const [ficha] = await tx.select().from(fichas).where(eq(fichas.id, fichaId)).limit(1);
      if (!ficha) return;

      const itemsList = await tx.select().from(fichaItems).where(eq(fichaItems.fichaId, fichaId));
      const paymentsList = await tx.select().from(payments).where(eq(payments.fichaId, fichaId));

      console.log(`[DEBUG] items: ${itemsList.length}, payments: ${paymentsList.length}`);

      const qField = ficha.status === 'nova' ? 'quantity' : 'quantitySold';

      const totalValueCC = itemsList.filter((i: any) => i.commissionType === 'CC' || i.commissionType === 'com_comissao').reduce((acc: number, i: any) => acc + (Number(i[qField]) * Number(i.unitPrice)), 0);
      const totalValueSC = itemsList.filter((i: any) => i.commissionType === 'SC' || i.commissionType === 'sem_comissao').reduce((acc: number, i: any) => acc + (Number(i[qField]) * Number(i.unitPrice)), 0);
      
      const commissionVal = totalValueCC * (Number(ficha.commissionPercent || 30) / 100);
      const netCC = totalValueCC - commissionVal;
      const totalToPay = netCC + totalValueSC;
      
      const totalPaid = paymentsList
        .filter((p: any) => !p.cancelled)
        .reduce((acc: number, p: any) => acc + Number(p.amount), 0);
      const balance = totalToPay - totalPaid - Number(ficha.discount || 0);

      console.log(`[DEBUG] qField: ${qField}, totalValueSC: ${totalValueSC}, totalToPay: ${totalToPay}, totalPaid: ${totalPaid}, balance: ${balance}`);

      // Status should be 'paga' if balance <= 0, otherwise 'pendente' (if it were nova or pendente)
      const newStatus = balance <= 0 ? 'paga' : (ficha.status === 'nova' ? 'nova' : 'pendente');
      
      console.log(`[DEBUG] Current status: ${ficha.status}, New status target: ${newStatus}`);
      
      if (ficha.status !== newStatus) {
        await tx.update(fichas).set({ status: newStatus, updatedAt: new Date() }).where(eq(fichas.id, fichaId));
      }
    }

    instance.post('/fichas/:id/payments', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };
      const { id: bodyId, amount, methodId } = request.body as any;

      try {
        const newPayment = await db.transaction(async (tx: any) => {
          const [ficha] = await tx.select().from(fichas).where(eq(fichas.id, id));
          if (!ficha) throw new Error("Ficha não encontrada");
          if (ficha.status === 'paga') throw new Error("Ficha já está paga e não aceita novos pagamentos");

          // For 'nova' status, limit payment to total of SC items (initial quantity)
          if (ficha.status === 'nova') {
             const itemsList = await tx.select().from(fichaItems).where(eq(fichaItems.fichaId, id));
             const paymentsList = await tx.select().from(payments).where(eq(payments.fichaId, id));
             
             const totalValueSC = itemsList
               .filter((i: any) => i.commissionType !== 'CC')
               .reduce((acc: number, i: any) => acc + (Number(i.quantity) * Number(i.unitPrice)), 0);
             
             const currentTotalPaid = paymentsList
               .filter((p: any) => !p.cancelled)
               .reduce((acc: number, p: any) => acc + Number(p.amount), 0);
             
             if (currentTotalPaid + Number(amount) > totalValueSC) {
                throw new Error(`Fichas novas só aceitam pagamento até o total dos itens sem comissão (Limite: ${totalValueSC/100})`);
             }
          }

          const [inserted] = (await tx.insert(payments).values({
            id: bodyId || require('crypto').randomUUID(),
            fichaId: id,
            amount,
            methodId,
          }).returning()) as any[];

          await updateFichaStatusIfPaid(tx, id);
          return inserted;
        });

        return newPayment;
      } catch (err: any) {
        console.error('Add payment failed:', err);
        return reply.status(400).send({ error: "Erro ao lançar pagamento" });
      }
    });

    instance.patch('/payments/:id/cancel', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };

      try {
        await db.transaction(async (tx: any) => {
          const [pmt] = await tx.select().from(payments).where(eq(payments.id, id)).limit(1);
          if (!pmt) throw new Error("Pagamento não encontrado");

          const [ficha] = await tx.select().from(fichas).where(eq(fichas.id, pmt.fichaId));
          if (ficha?.status === 'paga') throw new Error("Ficha já está paga e os pagamentos não podem ser cancelados");

          await tx.update(payments)
            .set({ cancelled: true, cancelledAt: new Date() })
            .where(eq(payments.id, id));

          await updateFichaStatusIfPaid(tx, pmt.fichaId);
        });
        return { success: true };
      } catch (err: any) {
        console.error('Cancel payment failed:', err);
        return reply.status(400).send({ error: "Erro ao cancelar pagamento" });
      }
    });

    // ─── Settings: Company & Payments ─────────────────────────────────────────

    instance.get('/settings/payments', async (request) => {
      const db = (request as any).tenantDb;
      return await db.select().from(paymentMethods).orderBy(paymentMethods.name);
    });

    instance.post('/settings/payments', async (request, reply) => {
      const db = (request as any).tenantDb;
      const body = request.body as any;
      const { id, name, active } = body;

      try {
        if (id) {
          // Update
          const [updated] = (await db.update(paymentMethods)
            .set({ name, active, updatedAt: new Date() })
            .where(eq(paymentMethods.id, id))
            .returning()) as any[];
          return updated;
        } else {
          // Create
          const [created] = (await db.insert(paymentMethods)
            .values({ name, active: active ?? true })
            .returning()) as any[];
          return created;
        }
      } catch (err) {
        return reply.status(400).send({ error: "Erro ao salvar forma de pagamento" });
      }
    });

    instance.patch('/settings/company', async (request, reply) => {
      const slug = request.headers['x-tenant-slug'] as string;
      const body = request.body as any;
      
      try {
        const [updated] = (await masterDb.update(tenants)
          .set({
            name: body.name,
            street: body.street,
            number: body.number,
            neighborhood: body.neighborhood,
            city: body.city,
            state: body.state,
            zipCode: body.zipCode,
            contact: body.contact,
            updatedAt: new Date()
          })
          .where(eq(tenants.slug, slug))
          .returning()) as any[];
        
        return updated;
      } catch (err) {
        return reply.status(400).send({ error: "Erro ao atualizar dados da empresa" });
      }
    });

    // ─── Cobranças (Viagens) ──────────────────────────────────────────────────

    instance.get('/routes/:id/cobrancas', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };
      try {
        const result = await db.execute(sql`
          SELECT id, code, route_id as "routeId", seller_id as "sellerId", status, 
                 start_date as "startDate", end_date as "endDate", 
                 created_at as "createdAt", updated_at as "updatedAt"
          FROM cobrancas
          WHERE route_id = ${id}
          ORDER BY start_date DESC
        `);
        return result.rows;
      } catch (err: any) {
        return reply.status(500).send({ error: "Internal Server Error" });
      }
    });

    instance.get('/cobrancas', async (request, reply) => {
      const db = (request as any).tenantDb;
      try {
        const result = await db.execute(sql`
          SELECT id, code, route_id as "routeId", seller_id as "sellerId", status, 
                 start_date as "startDate", end_date as "endDate", 
                 created_at as "createdAt", updated_at as "updatedAt"
          FROM cobrancas
          ORDER BY start_date DESC
        `);
        return { items: result.rows };
      } catch (err: any) {
        return reply.status(500).send({ error: "Internal Server Error" });
      }
    });

    instance.post('/routes/:id/cobrancas', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id: routeId } = request.params as { id: string };
      const { sellerId } = request.body as { sellerId: string };

      try {
        // Validation: Block if there's already an open trip for this route
        const openTrips = await db.execute(sql`
          SELECT id FROM cobrancas 
          WHERE route_id = ${routeId} AND status = 'aberta'
        `);

        if (openTrips.rows.length > 0) {
          return reply.status(400).send({ 
            error: "Viagem em andamento",
            message: "Não é permitido criar um cobrança nova enquanto existir um cobrança em andamento na rota" 
          });
        }

        const result = await db.execute(sql`
          INSERT INTO cobrancas (route_id, seller_id, status)
          VALUES (${routeId}, ${sellerId}, 'aberta')
          RETURNING id, code, route_id as "routeId", seller_id as "sellerId", status, 
                    start_date as "startDate", end_date as "endDate", 
                    created_at as "createdAt", updated_at as "updatedAt"
        `);
        
        return result.rows[0];
      } catch (err: any) {
        return reply.status(400).send({ error: "Erro ao iniciar viagem" });
      }
    });

    instance.patch('/cobrancas/:id/close', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };

      try {
        // 1. Mark trip as closed
        const [closedCobranca] = (await db.update(cobrancas)
          .set({ 
            status: 'encerrada', 
            endDate: new Date(),
            updatedAt: new Date()
          })
          .where(eq(cobrancas.id, id))
          .returning()) as any[];

        // 2. Transition linked fiches from 'nova' to 'pendente'
        // Include those linked to this trip AND those on the same route with no trip linked (web records)
        await db.update(fichas)
          .set({ status: 'pendente', updatedAt: new Date() })
          .where(and(
            eq(fichas.status, 'nova'),
            or(
              eq(fichas.cobrancaId, id),
              and(isNull(fichas.cobrancaId), eq(fichas.routeId, closedCobranca.routeId))
            )
          ));

        return closedCobranca;
      } catch (err) {
        return reply.status(400).send({ error: "Erro ao encerrar viagem" });
      }
    });

    instance.get('/payments', async (request, reply) => {
      const db = (request as any).tenantDb;
      const q = request.query as Record<string, string>;
      const limit = Number(q.limit) || 1000;

      try {
        const conditions: any[] = [];
        if (q.sellerId) {
            const subquery = db
                .select({ id: fichas.id })
                .from(fichas)
                .where(eq(fichas.sellerId, q.sellerId));
            conditions.push(inArray(payments.fichaId, subquery));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const results = await db
          .select({
            id: payments.id,
            fichaId: payments.fichaId,
            methodId: payments.methodId,
            amount: payments.amount,
            paymentDate: payments.paymentDate,
            cancelled: payments.cancelled,
            createdAt: payments.createdAt
          })
          .from(payments)
          .where(whereClause)
          .limit(limit)
          .orderBy(desc(payments.paymentDate));

        return results;
      } catch (err: any) {
        console.error('Fetch payments failed:', err);
        return reply.status(500).send({ error: "Erro ao buscar pagamentos" });
      }
    });

    instance.get('/ficha-items', async (request, reply) => {
      const db = (request as any).tenantDb;
      const q = request.query as Record<string, string>;
      const limit = Number(q.limit) || 2000;

      try {
        const conditions: any[] = [];
        if (q.sellerId) {
            const subquery = db
                .select({ id: fichas.id })
                .from(fichas)
                .where(eq(fichas.sellerId, q.sellerId));
            conditions.push(inArray(fichaItems.fichaId, subquery));
        }

        const items = await db
          .select()
          .from(fichaItems)
          .where(and(...conditions))
          .limit(limit);

        return items;
      } catch (err: any) {
        console.error('Fetch ficha items failed:', err);
        return reply.status(500).send({ error: "Erro ao buscar itens das fichas" });
      }
    });

    // ─── Clients: Detailed View ──────────────────────────────────────────────

    instance.get('/clients/:id/details', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };

      try {
        // 1. Fetch Client Info
        const [client] = await db.select().from(clients).where(eq(clients.id, id));
        if (!client) return reply.status(404).send({ error: "Cliente não encontrado" });

        // 2. Fetch all Fichas for this client
        const clientFichas = await db
          .select({
            id: fichas.id,
            code: fichas.code,
            status: fichas.status,
            total: fichas.total,
            saleDate: fichas.saleDate,
            sellerName: users.name
          })
          .from(fichas)
          .leftJoin(users, eq(fichas.sellerId, users.id))
          .where(eq(fichas.clientId, id))
          .orderBy(desc(fichas.saleDate));

        // 3. Calculate Financial Summary
        // totalSold includes everything except 'pedido'
        const totalSold = clientFichas
          .filter((f: any) => f.status !== 'pedido')
          .reduce((acc: number, curr: any) => acc + (curr.total || 0), 0);

        // totalPending includes 'nova' and 'pendente'
        const totalPending = clientFichas
          .filter((f: any) => f.status === 'nova' || f.status === 'pendente' || f.status === 'link_gerado')
          .reduce((acc: number, curr: any) => acc + (curr.total || 0), 0);

        // Fetch all payments for this client's fichas
        const allClientPayments = await db
          .select({ amount: payments.amount })
          .from(payments)
          .innerJoin(fichas, eq(payments.fichaId, fichas.id))
          .where(eq(fichas.clientId, id));

        const totalPaid = allClientPayments.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
        const totalRemaining = totalSold - totalPaid;

        // Counts per status
        const counts = {
          novas:     clientFichas.filter((f: any) => f.status === 'nova').length,
          pendentes: clientFichas.filter((f: any) => f.status === 'pendente').length,
          pagas:     clientFichas.filter((f: any) => f.status === 'paga').length,
          pedidos:   clientFichas.filter((f: any) => f.status === 'pedido').length,
          link_gerado: clientFichas.filter((f: any) => f.status === 'link_gerado').length,
        };

        return {
          client,
          stats: {
            totalSold,
            totalPaid,
            totalPending,
            totalRemaining
          },
          fichas: clientFichas,
          counts
        };

      } catch (err) {
        console.error("Error fetching client details:", err);
        return reply.status(500).send({ error: "Erro interno ao carregar detalhes do cliente" });
      }
    });

    instance.post('/fichas/:id/confirm-order', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };

      const errors: string[] = [];
      const missingProducts: { id: string, name: string, available: number, required: number }[] = [];

      try {
        const [ficha] = await db.select().from(fichas).where(eq(fichas.id, id)).limit(1);
        if (!ficha || (ficha.status !== 'pedido' && ficha.status !== 'link_gerado')) {
          return reply.status(400).send({ error: "Ficha não está em estado de pedido" });
        }

        const items = await db.select({
          productId: fichaItems.productId,
          quantity: fichaItems.quantity,
          productName: products.name
        })
        .from(fichaItems)
        .leftJoin(products, eq(fichaItems.productId, products.id))
        .where(eq(fichaItems.fichaId, id));

        await db.transaction(async (tx: any) => {
          for (const item of items) {
            const [inventory] = await tx.select({ stock: sellerInventory.stock }).from(sellerInventory)
              .where(and(eq(sellerInventory.sellerId, ficha.sellerId), eq(sellerInventory.productId, item.productId)))
              .limit(1);

            const stock = inventory ? inventory.stock : 0;
            if (stock < item.quantity) {
              missingProducts.push({ 
                id: item.productId, 
                name: item.productName || "Desconhecido", 
                available: stock, 
                required: item.quantity 
              });
            }
          }

          if (missingProducts.length > 0) {
            throw new Error("M"); // Marker for missing stock
          }

          // If ok, decrease stock
          for (const item of items) {
            await tx.execute(sql`UPDATE seller_inventory SET stock = stock - ${item.quantity} WHERE seller_id = ${ficha.sellerId} AND product_id = ${item.productId}`);
          }

          // Generate Code if missing
          let finalCode = ficha.code;
          if (!finalCode) {
            const [seller] = await tx.select({ code: users.code }).from(users).where(eq(users.id, ficha.sellerId)).limit(1);
            const [route]  = await tx.select({ code: routes.code }).from(routes).where(eq(routes.id, ficha.routeId)).limit(1);
            const now = new Date();
            const datestr = `${String(now.getDate()).padStart(2,'0')}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
            finalCode = `${String(seller?.code||0).padStart(4,'0')}${datestr}${String(route?.code||0).padStart(4,'0')}`;
          }

          await tx.update(fichas).set({ status: 'nova', code: finalCode, updatedAt: new Date() }).where(eq(fichas.id, id));
        });

        return { success: true };
      } catch (error: any) {
        if (error.message === "M") {
          return reply.status(400).send({ 
            error: "Estoque insuficiente", 
            missingProducts 
          });
        }
        console.error("Confirm order error:", error);
        return reply.status(400).send({ error: "Erro ao confirmar pedido" });
      }
    });

    // ── Public Ficha API (Used by the public ordering page) ──────────────────
    instance.get('/public-ficha/:token', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { token } = request.params as any;
      console.log(`[PUBLIC_API] Searching token: ${token}`);
      
      try {
        // Simple query first to isolate
        const rawFichas = await db.select().from(fichas).where(eq(fichas.linkToken, token)).limit(1);
        const rawFicha = rawFichas[0];

        if (!rawFicha) {
          console.log(`❌ Ficha not found for token: ${token}`);
          return reply.status(404).send({ error: "Link inválido" });
        }

        if (rawFicha.status !== 'link_gerado') {
          console.log(`❌ Ficha status is ${rawFicha.status}, not 'link_gerado'`);
          return reply.status(404).send({ error: "Link já finalizado ou inválido" });
        }

        // Now get the details with joins if possible, or just raw
        const [ficha] = await db.select({ 
          id: fichas.id, 
          status: fichas.status, 
          clientName: clients.name, 
          routeName: routes.name 
        })
          .from(fichas)
          .leftJoin(clients, eq(fichas.clientId, clients.id))
          .leftJoin(routes, eq(fichas.routeId, routes.id))
          .where(eq(fichas.linkToken, token)).limit(1);

        const productsList = await db.select().from(products).where(eq(products.active, true));
        return { ficha: ficha || rawFicha, products: productsList };
      } catch (err: any) {
        console.error("❌ Error fetching public ficha:", err);
        return reply.status(500).send({ error: "Erro interno no servidor", details: err.message, stack: err.stack });
      }
    });

    instance.post('/public-ficha/:token/finalize', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { token } = request.params as any;
      const { items } = request.body as any;
      
      const [ficha] = await db.select().from(fichas).where(eq(fichas.linkToken, token)).limit(1);
      if (!ficha || ficha.status !== 'link_gerado') return reply.status(400).send({ error: "Inválido" });

      let grandTotal = 0;
      await db.transaction(async (tx: any) => {
        for (const item of items) {
          const [p] = await tx.select().from(products).where(eq(products.id, item.productId)).limit(1);
          if (!p) continue;
          const price = item.type === 'CC' ? Number(p.priceCC) : Number(p.priceSC);
          const subtotal = item.quantity * price;
          grandTotal += subtotal;
          await tx.insert(fichaItems).values({ fichaId: ficha.id, productId: item.productId, quantity: item.quantity, unitPrice: price, subtotal });
        }
        await tx.update(fichas).set({ status: 'pedido', total: grandTotal }).where(eq(fichas.id, ficha.id));
      });
      return { success: true };
    });

    // ── Routes Management ────────────────────────────────────────────────────
    instance.get('/routes', async (request) => {
      const db = (request as any).tenantDb;
      const q  = request.query as Record<string, string>;
      const page  = Number(q.page) || 1;
      const limit = Number(q.limit) || 10;
      const offset = (page - 1) * limit;

      const conditions: any[] = [];
      if (q.active !== undefined) {
        conditions.push(eq(routes.active, q.active === 'true' || q.active === '1'));
      }

      if (q.sellerId) {
        // Subquery ou InnerJoin para pegar rotas desse seller
        const subquery = db
          .select({ routeId: userRoutes.routeId })
          .from(userRoutes)
          .where(eq(userRoutes.userId, q.sellerId));
        conditions.push(inArray(routes.id, subquery));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [{ count }] = await db.select({ count: sql`count(*)` })
        .from(routes)
        .where(whereClause);

      const items = await db.select({ 
        id: routes.id, 
        code: routes.code, 
        name: routes.name, 
        description: routes.description, 
        periodicity: routes.periodicity,
        active: routes.active, 
        clientCount: sql`count(${clients.id})::int` 
      })
        .from(routes)
        .leftJoin(clients, eq(routes.id, clients.routeId))
        .where(whereClause)
        .groupBy(routes.id)
        .orderBy(routes.code)
        .limit(limit)
        .offset(offset);

      return { 
        items,
        pagination: {
          total: Number(count),
          page,
          limit,
          pages: Math.ceil(Number(count) / limit)
        }
      };
    });

    instance.post('/routes', async (request, reply) => {
      const db = (request as any).tenantDb;
      const body = request.body as any;
      if (body.periodicity) body.periodicity = Number(body.periodicity);
      const [newRoute] = (await db.insert(routes).values(body).returning()) as any[];
      return newRoute;
    });

    instance.put('/routes/:id', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };
      const body = request.body as any;
      if (body.periodicity) body.periodicity = Number(body.periodicity);
      
      try {
        const [updatedRoute] = (await db
          .update(routes)
          .set(body)
          .where(eq(routes.id, id))
          .returning()) as any[];
        return updatedRoute;
      } catch (error) {
        return reply.status(400).send({ error: "Erro ao atualizar rota" });
      }
    });

    instance.delete('/routes/:id', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };
      try {
        await db.delete(routes).where(eq(routes.id, id));
        return { success: true };
      } catch (error) {
        return reply.status(400).send({ error: "Erro ao excluir rota" });
      }
    });

    instance.post('/routes/:id/toggle-status', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };
      try {
        const [route] = await db.select().from(routes).where(eq(routes.id, id)).limit(1);
        if (!route) return reply.status(404).send({ error: "Rota não encontrada" });
        const [updated] = (await db.update(routes).set({ active: !route.active }).where(eq(routes.id, id)).returning()) as any[];
        return updated;
      } catch (error) {
        return reply.status(400).send({ error: "Erro ao alterar status" });
      }
    });

    // ── Inventory Management ────────────────────────────────────────────────
    instance.get('/inventory/seller/:id', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id: sellerId } = request.params as { id: string };
      const q = request.query as Record<string, string>;
      const page = Number(q.page) || 1;
      const limit = Number(q.limit) || 10;
      const offset = (page - 1) * limit;

      const conditions = [eq(sellerInventory.sellerId, sellerId)];
      if (q.search) {
        conditions.push(or(ilike(products.name, `%${q.search}%`), ilike(products.sku, `%${q.search}%`)) as any);
      }

      const whereClause = and(...conditions);

      const [{ count }] = await db
        .select({ count: sql`count(*)` })
        .from(sellerInventory)
        .leftJoin(products, eq(sellerInventory.productId, products.id))
        .where(whereClause);

      const items = await db
        .select({
          productId: sellerInventory.productId,
          productName: products.name,
          stock: sellerInventory.stock,
          sku: products.sku,
          category: products.category
        })
        .from(sellerInventory)
        .leftJoin(products, eq(sellerInventory.productId, products.id))
        .where(whereClause)
        .orderBy(products.name)
        .limit(limit)
        .offset(offset);

      return {
        items,
        pagination: {
          total: Number(count),
          page,
          limit,
          pages: Math.ceil(Number(count) / limit)
        }
      };
    });

    instance.post('/stock-entries', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { type, supplier, destination, sellerId, items } = request.body as {
        type: "propria" | "fornecedor",
        supplier: string | null,
        destination: "deposito" | "vendedor",
        sellerId?: string,
        items: { productId: string, quantity: number | string, costPrice: number }[]
      };

      try {
        await db.transaction(async (tx: any) => {
          const [movement] = (await tx.insert(inventoryMovements).values({
            type: 'entrada_estoque',
            description: type === 'propria' ? 'Entrada Própria' : `Fornecedor: ${supplier}`,
            sellerId: destination === 'vendedor' ? sellerId : null
          }).returning()) as any[];

          for (const item of items) {
            const qty = Number(item.quantity);
            if (qty <= 0) continue;

            let qBefore = 0;
            if (destination === 'deposito') {
              const [p] = await tx.select({ stock: products.stockDeposit }).from(products).where(eq(products.id, item.productId)).limit(1);
              qBefore = p ? p.stock : 0;
              await tx.update(products).set({ stockDeposit: qBefore + qty }).where(eq(products.id, item.productId));
            } else if (destination === 'vendedor' && sellerId) {
              const [inv] = await tx.select({ stock: sellerInventory.stock }).from(sellerInventory)
                .where(and(eq(sellerInventory.sellerId, sellerId), eq(sellerInventory.productId, item.productId)))
                .limit(1);
              qBefore = inv ? inv.stock : 0;
              
              if (inv) {
                await tx.update(sellerInventory).set({ stock: qBefore + qty, updatedAt: sql`now()` }).where(eq(sellerInventory.id, inv.id));
              } else {
                await tx.insert(sellerInventory).values({ sellerId, productId: item.productId, stock: qty });
              }
            }

            await tx.insert(inventoryMovementItems).values({
              movementId: movement.id,
              productId: item.productId,
              quantityBefore: qBefore,
              quantityAfter: qBefore + qty,
              quantityChange: qty
            });
          }
        });

        return { success: true };
      } catch (error: any) {
        console.error("Stock entry error:", error);
        return reply.status(400).send({ error: "Erro ao processar entrada de estoque" });
      }
    });

    instance.post('/inventory/adjustment', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { sellerId, description, items } = request.body as { 
        sellerId: string, 
        description: string, 
        items: { productId: string, quantity: number }[] 
      };

      try {
        await db.transaction(async (tx: any) => {
          const [movement] = (await tx.insert(inventoryMovements).values({
            type: 'ajuste_manual',
            description,
            sellerId
          }).returning()) as any[];

          for (const item of items) {
            if (item.quantity < 0) {
              throw new Error("Estoque não pode ser negativo");
            }
            // Get current stock
            const [current] = await tx.select().from(sellerInventory)
              .where(and(eq(sellerInventory.sellerId, sellerId), eq(sellerInventory.productId, item.productId)))
              .limit(1);

            const qBefore = current ? current.stock : 0;
            const qAfter = item.quantity;
            const qChange = qAfter - qBefore;

            if (current) {
              await tx.update(sellerInventory)
                .set({ stock: qAfter, updatedAt: new Date() })
                .where(eq(sellerInventory.id, current.id));
            } else {
              await tx.insert(sellerInventory).values({
                sellerId,
                productId: item.productId,
                stock: qAfter
              });
            }

            await tx.insert(inventoryMovementItems).values({
              movementId: movement.id,
              productId: item.productId,
              quantityBefore: qBefore,
              quantityAfter: qAfter,
              quantityChange: qChange
            });
          }
        });

        return { success: true };
      } catch (error) {
        console.error("Adjustment error:", error);
        return reply.status(400).send({ error: "Erro ao salvar ajuste" });
      }
    });

    instance.get('/movements', async (request) => {
      const db = (request as any).tenantDb;
      const q = request.query as Record<string, string>;
      const page = Number(q.page) || 1;
      const limit = Number(q.limit) || 10;
      const offset = (page - 1) * limit;

      const [{ count }] = await db.select({ count: sql`count(*)` }).from(inventoryMovements);

      const items = await db
        .select({
          id: inventoryMovements.id,
          type: inventoryMovements.type,
          description: inventoryMovements.description,
          sellerId: inventoryMovements.sellerId,
          sellerName: users.name,
          createdAt: inventoryMovements.createdAt
        })
        .from(inventoryMovements)
        .leftJoin(users, eq(inventoryMovements.sellerId, users.id))
        .orderBy(desc(inventoryMovements.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        items,
        pagination: {
          total: Number(count),
          page,
          limit,
          pages: Math.ceil(Number(count) / limit)
        }
      };
    });

    instance.get('/movements/:id', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };
      const q = request.query as Record<string, string>;
      const page = Number(q.page) || 1;
      const limit = Number(q.limit) || 10;
      const offset = (page - 1) * limit;

      const [movement] = await db
        .select({
          id: inventoryMovements.id,
          type: inventoryMovements.type,
          description: inventoryMovements.description,
          sellerName: users.name,
          createdAt: inventoryMovements.createdAt
        })
        .from(inventoryMovements)
        .leftJoin(users, eq(inventoryMovements.sellerId, users.id))
        .where(eq(inventoryMovements.id, id))
        .limit(1);

      if (!movement) return reply.status(404).send({ error: "Movimentação não encontrada" });

      const [{ count }] = await db
        .select({ count: sql`count(*)` })
        .from(inventoryMovementItems)
        .where(eq(inventoryMovementItems.movementId, id));

      const items = await db
        .select({
          id: inventoryMovementItems.id,
          productId: inventoryMovementItems.productId,
          productName: products.name,
          sku: products.sku,
          quantityBefore: inventoryMovementItems.quantityBefore,
          quantityAfter: inventoryMovementItems.quantityAfter,
          quantityChange: inventoryMovementItems.quantityChange
        })
        .from(inventoryMovementItems)
        .leftJoin(products, eq(inventoryMovementItems.productId, products.id))
        .where(eq(inventoryMovementItems.movementId, id))
        .limit(limit)
        .offset(offset);

      return { 
        ...movement, 
        items,
        pagination: {
          total: Number(count),
          page,
          limit,
          pages: Math.ceil(Number(count) / limit)
        }
      };
    });

    instance.get('/stats/insights', async (request) => {
      const db = (request as any).tenantDb;
      
      const sales = await db.select({
        total: fichas.total,
        status: fichas.status
      })
      .from(fichas)
      .where(ne(fichas.status, 'link_gerado'));

      const totalRevenue = sales.reduce((acc: number, curr: any) => acc + (Number(curr.total) || 0), 0);
      const salesCount = sales.length;

      return {
        totalRevenue,
        salesCount,
        aiInsight: "Suas vendas estão estáveis. Considere focar na rota com mais clientes pendentes para aumentar o faturamento."
      };
    });

  }, { prefix: '/api' });

  // ─── Start ────────────────────────────────────────────────────────────────
  try {
    const port = Number(process.env.PORT) || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Server ready at http://localhost:${port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

bootstrap();
