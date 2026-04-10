import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { join } from 'path';

// Load env before anything else
dotenv.config({ path: join(process.cwd(), '.env'), override: true });
console.log('✅ DATABASE_URL:', process.env.DATABASE_URL?.includes('postgres') ? 'Loaded' : 'MISSING');

import { tenantMiddleware } from './middleware/tenant.js';
import { masterDb }         from './db/master.js';
import { provisionTenant }  from './db/provisioning.js';
import { 
  fichas, 
  clients, 
  users, 
  products, 
  routes, 
  fichaItems, 
  userRoutes, 
  sellerInventory,
  inventoryMovements,
  inventoryMovementItems
} from './db/schema/index.js';
import { and, eq, gte, ilike, lte, sql, or } from 'drizzle-orm';

const fastify = Fastify({ logger: false });

async function bootstrap() {
  // ─── CORS ─────────────────────────────────────────────────────────────────
  await fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-slug'],
    credentials: true,
  });

  // ─── Public: Provisioning ─────────────────────────────────────────────────
  fastify.post('/auth/provision', async (request, reply) => {
    const { name, clerkId, addressData, contact } = request.body as {
      name: string;
      clerkId: string;
      addressData: any;
      contact?: string;
    };
    console.log(`🚀 Provisioning: ${name} (${clerkId})`);
    try {
      const result = await provisionTenant(name, clerkId, addressData, contact);
      return result;
    } catch (error: any) {
      console.error('Provisioning error:', error);
      return reply.status(400).send({ error: error.message || 'Failed to provision' });
    }
  });

  // ─── Public: Tenant Info ──────────────────────────────────────────────────
  fastify.get('/tenant/info', { preHandler: tenantMiddleware }, async (request) => {
    return (request as any).tenant;
  });

  // ─── Protected Routes (require x-tenant-slug header) ──────────────────────
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

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Count total
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
          routeId:      clients.routeId,
          routeName:    routes.name,
          active:       clients.active,
          createdAt:    clients.createdAt,
        })
        .from(clients)
        .leftJoin(routes, eq(clients.routeId, routes.id))
        .where(whereClause)
        .orderBy(clients.code)
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
        const [newClient] = await db.insert(clients).values({
          name:         body.name,
          cpf:          body.cpf || null,
          phone:        body.phone || null,
          street:       body.street || null,
          number:       body.number || null,
          neighborhood: body.neighborhood || null,
          city:         body.city || null,
          state:        body.state || null,
          zipCode:      body.zipCode || null,
          routeId:      body.routeId || null,
        }).returning();

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
        const [updatedClient] = await db
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
            routeId:      body.routeId,
          })
          .where(and(eq(clients.id, id)))
          .returning();

        return updatedClient;
      } catch (error) {
        console.error("Update client error:", error);
        return reply.status(400).send({ error: "Erro ao atualizar cliente" });
      }
    });

    instance.post('/clients/:id/toggle-status', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };

      try {
        const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
        if (!client) return reply.status(404).send({ error: "Cliente não encontrado" });

        const [updated] = await db
          .update(clients)
          .set({ active: !client.active })
          .where(eq(clients.id, id))
          .returning();

        return updated;
      } catch (error) {
        return reply.status(400).send({ error: "Erro ao alterar status do cliente" });
      }
    });

    // ── Employees (Vendedores) Management ────────────────────────────────────
    instance.get('/employees', async (request) => {
      const db = (request as any).tenantDb;
      const q  = request.query as Record<string, string>;

      const page  = Number(q.page) || 1;
      const limit = Number(q.limit) || 10;
      const offset = (page - 1) * limit;

      const conditions: any[] = [eq(users.role, 'seller')];
      if (q.name) conditions.push(ilike(users.name, `%${q.name}%`));

      const whereClause = and(...conditions);

      // Count total sellers
      const [{ count }] = await db
        .select({ count: sql`count(*)` })
        .from(users)
        .where(whereClause);

      const sellers = await db
        .select({
          id:        users.id,
          name:      users.name,
          email:     users.email,
          role:      users.role,
          appCode:   users.appCode,
          phone:     users.phone,
          active:    users.active,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(whereClause)
        .orderBy(users.name)
        .limit(limit)
        .offset(offset);

      // Fetch routes for each seller
      const items = await Promise.all(sellers.map(async (s: any) => {
        const ur = await db
          .select({ routeId: userRoutes.routeId })
          .from(userRoutes)
          .where(eq(userRoutes.userId, s.id));
        return {
          ...s,
          routeIds: ur.map((r: any) => r.routeId)
        };
      }));

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

    instance.post('/employees', async (request, reply) => {
      const db = (request as any).tenantDb;
      const body = request.body as any;

      try {
        const result = await db.transaction(async (tx: any) => {
          const [newUser] = await tx.insert(users).values({
            name:     body.name,
            appCode:  body.appCode,
            password: body.password,
            phone:    body.phone,
            role:     'seller',
            email:    body.email || `app-${body.appCode}@custom.com`,
          }).returning();

          if (body.routeIds && Array.isArray(body.routeIds)) {
            for (const rId of body.routeIds) {
              await tx.insert(userRoutes).values({
                userId:  newUser.id,
                routeId: rId
              });
            }
          }
          return newUser;
        });

        return result;
      } catch (error) {
        console.error("Create employee error:", error);
        return reply.status(400).send({ error: "Erro ao criar funcionário. O código app pode já estar em uso." });
      }
    });

    instance.post('/employees/:id', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };
      const body = request.body as any;

      try {
        await db.transaction(async (tx: any) => {
          await tx.update(users).set({
            name:     body.name,
            appCode:  body.appCode,
            password: body.password,
            phone:    body.phone,
          }).where(eq(users.id, id));

          if (body.routeIds && Array.isArray(body.routeIds)) {
            // Sincronizar rotas
            await tx.delete(userRoutes).where(eq(userRoutes.userId, id));
            for (const rId of body.routeIds) {
              await tx.insert(userRoutes).values({
                userId:  id,
                routeId: rId
              });
            }
          }
        });

        return { success: true };
      } catch (error) {
        console.error("Update employee error:", error);
        return reply.status(400).send({ error: "Erro ao atualizar funcionário" });
      }
    });

    instance.post('/employees/:id/toggle-status', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };

      try {
        const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
        if (!user) return reply.status(404).send({ error: "Usuário não encontrado" });

        const [updated] = await db
          .update(users)
          .set({ active: !user.active })
          .where(eq(users.id, id))
          .returning();

        return updated;
      } catch (error) {
        return reply.status(400).send({ error: "Erro ao alterar status do funcionário" });
      }
    });

    // ── Products ─────────────────────────────────────────────────────────────
    instance.get('/products', async (request) => {
      const db = (request as any).tenantDb;
      const q  = request.query as Record<string, string>;

      const page  = Number(q.page) || 1;
      const limit = Number(q.limit) || 1000; // Default to old behavior if not specified
      const offset = (page - 1) * limit;

      const conditions: any[] = [];
      if (q.sku)       conditions.push(ilike(products.sku, `%${q.sku}%`));
      if (q.descricao) conditions.push(ilike(products.name, `%${q.descricao}%`));
      if (q.categoria) conditions.push(ilike(products.category, `%${q.categoria}%`));
      if (q.marca)     conditions.push(ilike(products.brand, `%${q.marca}%`));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Count total for pagination
      const [{ count }] = await db
        .select({ count: sql`count(*)` })
        .from(products)
        .where(whereClause);

      const allProducts = await db
        .select()
        .from(products)
        .where(whereClause)
        .limit(limit)
        .offset(offset);

      // Simple calculation for subtotals (using ALL for stats, but PAGINATED for list)
      // Actually, stats should be based on filtered set, not just paginated page
      const statsQuery = await db
        .select()
        .from(products)
        .where(whereClause);

      const processed = allProducts.map((p: any) => {
        const stock = Number(p.stockDeposit) || 0;
        return {
          ...p,
          subtotalCusto: Number(p.costPrice) * stock,
          subtotalCC:    Number(p.priceCC) * stock,
          subtotalSC:    Number(p.priceSC) * stock,
        };
      });

      // Global stats based on ALL matches (filtered)
      const stats = {
        totalCost: statsQuery.reduce((acc: number, p: any) => acc + (Number(p.costPrice) * (Number(p.stockDeposit) || 0)), 0),
        totalCC:   statsQuery.reduce((acc: number, p: any) => acc + (Number(p.priceCC) * (Number(p.stockDeposit) || 0)), 0),
        totalSC:   statsQuery.reduce((acc: number, p: any) => acc + (Number(p.priceSC) * (Number(p.stockDeposit) || 0)), 0),
      };

      return { 
        items: processed, 
        stats,
        pagination: {
          total: Number(count),
          page,
          limit,
          pages: Math.ceil(Number(count) / limit)
        }
      };
    });

    instance.post('/products', async (request, reply) => {
      const db = (request as any).tenantDb;
      const body = request.body as any;

      // Auto-generate SKU if empty
      const sku = body.sku || `SKU-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      try {
        const [newProduct] = await db.insert(products).values({
          name:         body.name,
          sku:          sku,
          category:     body.category,
          brand:        body.brand,
          stockDeposit: Number(body.stockDeposit) || 0,
          costPrice:    Number(body.costPrice) || 0,
          priceCC:      Number(body.priceCC)   || 0,
          priceSC:      Number(body.priceSC)   || 0,
        }).returning();

        return newProduct;
      } catch (error) {
        console.error("Create product error:", error);
        return reply.status(400).send({ error: "Erro ao criar produto" });
      }
    });

    instance.post('/stock-entries', async (request, reply) => {
      const db = (request as any).tenantDb;
      const body = request.body as any;
      const { type, supplier, destination, sellerId, items } = body;

      try {
        await db.transaction(async (tx: any) => {
          // 1. Create Movement Header
          const [movement] = await tx.insert(inventoryMovements).values({
            type: 'entrada_estoque',
            description: `Entrada: ${type === 'compra' ? 'Compra' : 'Devolução'} via ${supplier} para ${destination === 'deposito' ? 'Depósito' : 'Vendedor'}`,
            sellerId: destination === 'vendedor' ? sellerId : null,
          }).returning();

          for (const item of items) {
            const productId = item.productId;
            const quantity = Number(item.quantity);
            if (quantity <= 0) continue;

            let quantityBefore = 0;

            if (destination === 'deposito') {
              // Get current stock
              const [prod] = await tx.select({ stock: products.stockDeposit })
                .from(products)
                .where(eq(products.id, productId));
              quantityBefore = prod?.stock || 0;

              // Update central deposit stock
              await tx.execute(sql`
                UPDATE products 
                SET stock_deposit = stock_deposit + ${quantity}
                WHERE id = ${productId}
              `);
            } else if (destination === 'vendedor' && sellerId) {
              // Get current seller inventory
              const [inv] = await tx.select({ stock: sellerInventory.stock })
                .from(sellerInventory)
                .where(and(eq(sellerInventory.sellerId, sellerId), eq(sellerInventory.productId, productId)));
              quantityBefore = inv?.stock || 0;

              // Update seller-specific stock
              await tx.execute(sql`
                INSERT INTO seller_inventory (seller_id, product_id, stock, updated_at)
                VALUES (${sellerId}, ${productId}, ${quantity}, NOW())
                ON CONFLICT (seller_id, product_id) DO UPDATE 
                SET stock = seller_inventory.stock + ${quantity}, updated_at = NOW()
              `);
            }

            // 2. Create Movement Item
            await tx.insert(inventoryMovementItems).values({
              movementId: movement.id,
              productId: productId,
              quantityBefore: quantityBefore,
              quantityAfter: quantityBefore + quantity,
              quantityChange: quantity,
            });
          }
        });

        return { success: true };
      } catch (error) {
        console.error("Stock entry error:", error);
        return reply.status(500).send({ error: "Erro ao processar entrada de estoque" });
      }
    });

    // ── Inventory per Seller ─────────────────────────────────────────────────
    instance.get('/inventory/seller/:id', async (request) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };
      const q  = request.query as Record<string, string>;

      const page  = Number(q.page) || 1;
      const limit = Number(q.limit) || 10;
      const offset = (page - 1) * limit;

      const conditions: any[] = [eq(sellerInventory.sellerId, id)];
      if (q.search) {
        conditions.push(or(
          ilike(products.name, `%${q.search}%`),
          ilike(products.sku,  `%${q.search}%`)
        ));
      }

      const whereClause = and(...conditions);

      // Count total results
      const [{ count }] = await db
        .select({ count: sql`count(*)` })
        .from(sellerInventory)
        .leftJoin(products, eq(sellerInventory.productId, products.id))
        .where(whereClause);

      const items = await db
        .select({
          productId:   sellerInventory.productId,
          stock:       sellerInventory.stock,
          productName: products.name,
          sku:         products.sku,
          brand:       products.brand,
          category:    products.category
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

    instance.post('/inventory/adjustment', async (request, reply) => {
      const db = (request as any).tenantDb;
      const body = request.body as any;
      const { sellerId, items, description } = body;

      if (!sellerId || !items || !Array.isArray(items)) {
        return reply.status(400).send({ error: "Dados inválidos" });
      }

      try {
        await db.transaction(async (tx: any) => {
          // 1. Create Movement Header
          const [movement] = await tx.insert(inventoryMovements).values({
            type: 'ajuste_manual',
            description: description || 'Ajuste Manual de Estoque',
            sellerId: sellerId,
          }).returning();

          for (const item of items) {
            const productId = item.productId;
            const quantityAfter = Number(item.quantity); // New quantity specified by admin

            // Get current quantity
            const [inv] = await tx.select({ stock: sellerInventory.stock })
              .from(sellerInventory)
              .where(and(eq(sellerInventory.sellerId, sellerId), eq(sellerInventory.productId, productId)));
            
            const quantityBefore = inv?.stock || 0;
            const quantityChange = quantityAfter - quantityBefore;

            if (quantityChange === 0) continue;

            // Update seller-specific stock
            await tx.execute(sql`
              INSERT INTO seller_inventory (seller_id, product_id, stock, updated_at)
              VALUES (${sellerId}, ${productId}, ${quantityAfter}, NOW())
              ON CONFLICT (seller_id, product_id) DO UPDATE 
              SET stock = ${quantityAfter}, updated_at = NOW()
            `);

            // Log item movement
            await tx.insert(inventoryMovementItems).values({
              movementId: movement.id,
              productId: productId,
              quantityBefore: quantityBefore,
              quantityAfter: quantityAfter,
              quantityChange: quantityChange,
            });
          }
        });

        return { success: true };
      } catch (error) {
        console.error("Manual adjustment error:", error);
        return reply.status(500).send({ error: "Erro ao processar ajuste de estoque" });
      }
    });

    // ── Inventory Movements ──────────────────────────────────────────────────
    instance.get('/movements', async (request) => {
      const db = (request as any).tenantDb;
      const q  = request.query as Record<string, string>;
      const page = Number(q.page) || 1;
      const limit = Number(q.limit) || 10;
      const offset = (page - 1) * limit;

      const [{ count }] = await db.select({ count: sql`count(*)` }).from(inventoryMovements);

      const items = await db
        .select({
          id: inventoryMovements.id,
          type: inventoryMovements.type,
          description: inventoryMovements.description,
          createdAt: inventoryMovements.createdAt,
          sellerName: users.name,
        })
        .from(inventoryMovements)
        .leftJoin(users, eq(inventoryMovements.sellerId, users.id))
        .orderBy(sql`${inventoryMovements.createdAt} DESC`)
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
      const q  = request.query as Record<string, string>;
      
      const page = Number(q.page) || 1;
      const limit = Number(q.limit) || 10;
      const offset = (page - 1) * limit;

      const [movement] = await db
        .select({
          id: inventoryMovements.id,
          type: inventoryMovements.type,
          description: inventoryMovements.description,
          createdAt: inventoryMovements.createdAt,
          sellerName: users.name,
        })
        .from(inventoryMovements)
        .leftJoin(users, eq(inventoryMovements.sellerId, users.id))
        .where(eq(inventoryMovements.id, id));

      if (!movement) {
        return reply.status(404).send({ error: "Movimentação não encontrada" });
      }

      // Count items
      const [{ count }] = await db
        .select({ count: sql`count(*)` })
        .from(inventoryMovementItems)
        .where(eq(inventoryMovementItems.movementId, id));

      const items = await db
        .select({
          productName: products.name,
          sku: products.sku,
          quantityBefore: inventoryMovementItems.quantityBefore,
          quantityAfter: inventoryMovementItems.quantityAfter,
          quantityChange: inventoryMovementItems.quantityChange,
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

    // ── Fichas de Venda (with filters) ───────────────────────────────────────
    instance.get('/fichas', async (request) => {
      const db = (request as any).tenantDb;
      const q  = request.query as Record<string, string>;

      const page  = Number(q.page) || 1;
      const limit = Number(q.limit) || 10;
      const offset = (page - 1) * limit;

      const conditions: any[] = [];

      // Filter by status
      if (q.status && ['nova', 'pendente', 'paga'].includes(q.status)) {
        conditions.push(eq(fichas.status, q.status as any));
      }

      // Filter by date range
      if (q.dataInicio) {
        conditions.push(gte(fichas.saleDate, new Date(q.dataInicio)));
      }
      if (q.dataFim) {
        const endDate = new Date(q.dataFim);
        endDate.setHours(23, 59, 59, 999);
        conditions.push(lte(fichas.saleDate, endDate));
      }

      // Filter by route ID
      if (q.rotaId) {
        conditions.push(eq(fichas.routeId, q.rotaId));
      }

      // Text searches (SQL level)
      if (q.cliente)  conditions.push(ilike(clients.name,  `%${q.cliente}%`));
      if (q.vendedor) conditions.push(or(ilike(users.name, `%${q.vendedor}%`), ilike(users.email, `%${q.vendedor}%`)));
      if (q.estado)   conditions.push(ilike(clients.state, `%${q.estado}%`));
      if (q.cidade)   conditions.push(ilike(clients.city,  `%${q.cidade}%`));
      if (q.rua)      conditions.push(ilike(clients.street,`%${q.rua}%`));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Count total matches (using joins to ensure filters apply to count)
      const [{ count }] = await db
        .select({ count: sql`count(*)` })
        .from(fichas)
        .leftJoin(clients, eq(fichas.clientId, clients.id))
        .leftJoin(users,   eq(fichas.sellerId,  users.id))
        .where(whereClause);

      // Fetch items
      const items = await db
        .select({
          id:         fichas.id,
          status:     fichas.status,
          total:      fichas.total,
          saleDate:   fichas.saleDate,
          notes:      fichas.notes,
          createdAt:  fichas.createdAt,
          clientId:   clients.id,
          clientName: clients.name,
          clientPhone:clients.phone,
          street:     clients.street,
          city:       clients.city,
          state:      clients.state,
          sellerId:   users.id,
          sellerName: users.name,
          sellerEmail:users.email,
          routeId:    routes.id,
          routeName:  routes.name,
        })
        .from(fichas)
        .leftJoin(clients, eq(fichas.clientId, clients.id))
        .leftJoin(users,   eq(fichas.sellerId,  users.id))
        .leftJoin(routes,  eq(fichas.routeId,   routes.id))
        .where(whereClause)
        .orderBy(sql`${fichas.createdAt} DESC`)
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

    // ── Single Ficha (with items) ─────────────────────────────────────────────
    instance.get('/fichas/:id', async (request, reply) => {
      const db  = (request as any).tenantDb;
      const { id } = request.params as { id: string };

      const [ficha] = await db
        .select()
        .from(fichas)
        .where(eq(fichas.id, id))
        .limit(1);

      if (!ficha) return reply.status(404).send({ error: 'Ficha não encontrada' });

      const items = await db
        .select({
          id:        fichaItems.id,
          quantity:  fichaItems.quantity,
          unitPrice: fichaItems.unitPrice,
          subtotal:  fichaItems.subtotal,
          productId: products.id,
          productName: products.name,
        })
        .from(fichaItems)
        .leftJoin(products, eq(fichaItems.productId, products.id))
        .where(eq(fichaItems.fichaId, id));

      return { ...ficha, items };
    });

    instance.post('/fichas', async (request, reply) => {
      const db = (request as any).tenantDb;
      const body = request.body as any;
      const { clientId, sellerId, routeId, items, total, notes } = body;

      try {
        const result = await db.transaction(async (tx: any) => {
          // 1. Create Ficha
          const [newFicha] = await tx.insert(fichas).values({
            clientId,
            sellerId,
            routeId,
            total,
            notes,
            status: 'nova'
          }).returning();

          // 2. Add Items and Update Stock
          for (const item of items) {
            await tx.insert(fichaItems).values({
              fichaId: newFicha.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal
            });

            // 3. Decrement Seller Stock
            await tx.execute(sql`
              UPDATE seller_inventory 
              SET stock = stock - ${item.quantity}, updated_at = NOW()
              WHERE seller_id = ${sellerId} AND product_id = ${item.productId}
            `);
          }
          return newFicha;
        });

        return result;
      } catch (error) {
        console.error("Create ficha error:", error);
        return reply.status(400).send({ error: "Erro ao criar ficha e abater estoque" });
      }
    });

    // ── Dashboard Stats ───────────────────────────────────────────────────────
    instance.get('/stats/insights', async (request) => {
      const db       = (request as any).tenantDb;
      const allFichas = await db.select().from(fichas);

      const totalRevenue = allFichas
        .filter((f: any) => f.status === 'paga')
        .reduce((acc: number, f: any) => acc + Number(f.total), 0);

      const counts = {
        nova:     allFichas.filter((f: any) => f.status === 'nova').length,
        pendente: allFichas.filter((f: any) => f.status === 'pendente').length,
        paga:     allFichas.filter((f: any) => f.status === 'paga').length,
      };

      return {
        totalRevenue,
        salesCount: allFichas.length,
        counts,
        aiInsight: 'Acompanhe suas fichas de venda em tempo real.',
      };
    });

    // ── Routes Management ────────────────────────────────────────────────────
    instance.get('/routes', async (request) => {
      const db = (request as any).tenantDb;
      const q  = request.query as Record<string, string>;

      const page  = Number(q.page) || 1;
      const limit = Number(q.limit) || 10;
      const offset = (page - 1) * limit;

      const conditions: any[] = [];
      if (q.name) conditions.push(ilike(routes.name, `%${q.name}%`));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Count total
      const [{ count }] = await db
        .select({ count: sql`count(*)` })
        .from(routes)
        .where(whereClause);

      const items = await db
        .select({
          id:          routes.id,
          code:        routes.code,
          name:        routes.name,
          description: routes.description,
          periodicity: routes.periodicity,
          active:      routes.active,
          createdAt:   routes.createdAt,
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

      try {
        const [newRoute] = await db.insert(routes).values({
          name:        body.name,
          description: body.description,
          periodicity: Number(body.periodicity) || 30,
        }).returning();

        return newRoute;
      } catch (error) {
        console.error("Create route error:", error);
        return reply.status(400).send({ error: "Erro ao criar rota" });
      }
    });

    instance.put('/routes/:id', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };
      const body = request.body as any;

      try {
        const [updatedRoute] = await db
          .update(routes)
          .set({
            name:        body.name,
            description: body.description,
            periodicity: Number(body.periodicity),
          })
          .where(eq(routes.id, id))
          .returning();

        return updatedRoute;
      } catch (error) {
        return reply.status(400).send({ error: "Erro ao atualizar rota" });
      }
    });

    instance.post('/routes/:id/toggle-status', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };

      try {
        // Get current status first
        const [route] = await db.select().from(routes).where(eq(routes.id, id)).limit(1);
        if (!route) return reply.status(404).send({ error: "Rota não encontrada" });

        const [updated] = await db
          .update(routes)
          .set({ active: !route.active })
          .where(eq(routes.id, id))
          .returning();

        return updated;
      } catch (error) {
        return reply.status(400).send({ error: "Erro ao alterar status da rota" });
      }
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
