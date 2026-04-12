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
  inventoryMovementItems,
  payments,
  paymentMethods,
  tenants,
  cobrancas
} from './db/schema/index.js';
import { eq, and, ilike, sql, desc, inArray, gte, lte, or } from "drizzle-orm";
import { getTenantDb } from './db/tenant.js';
import { generateProductSKU } from './lib/sku.js';


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
          .where(eq(clients.id, id))
          .returning();
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
        const [updated] = await db.update(clients).set({ active: !client.active }).where(eq(clients.id, id)).returning();
        return updated;
      } catch (error) {
        return reply.status(400).send({ error: "Erro ao alterar status" });
      }
    });

    // ── Employees (Vendedores) ──────────────────────────────────────────────
    instance.get('/employees', async (request) => {
      const db = (request as any).tenantDb;
      const q  = request.query as Record<string, string>;
      const page  = Number(q.page) || 1;
      const limit = Number(q.limit) || 10;
      const offset = (page - 1) * limit;

      const conditions = [eq(users.role, 'seller')];
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
              await tx.insert(userRoutes).values({ userId: newUser.id, routeId: rId });
            }
          }
          return newUser;
        });
        return result;
      } catch (error) {
        return reply.status(400).send({ error: "Erro ao criar funcionário" });
      }
    });

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
      const allProducts = await db.select().from(products).where(whereClause).limit(limit).offset(offset);

      const items = allProducts.map((p: any) => ({
        ...p,
        subtotalCusto: Number(p.costPrice) * (Number(p.stockDeposit) || 0),
        subtotalCC:    Number(p.priceCC) * (Number(p.stockDeposit) || 0),
        subtotalSC:    Number(p.priceSC) * (Number(p.stockDeposit) || 0),
      }));

      return { items, pagination: { total: Number(count), page, limit, pages: Math.ceil(Number(count) / limit) } };
    });

    instance.post('/products', async (request, reply) => {
      const db = (request as any).tenantDb;
      const body = request.body as any;
      try {
        const sku = body.sku || generateProductSKU();
        const [newProduct] = await db.insert(products).values({
          name:         body.name,
          sku:          sku,
          category:     body.category || null,
          brand:        body.brand || null,
          stockDeposit: Number(body.stockDeposit) || 0,
          costPrice:    Number(body.costPrice) || 0,
          priceCC:      Number(body.priceCC) || 0,
          priceSC:      Number(body.priceSC) || 0,
          active:       true,
        }).returning();
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
        const [updatedProduct] = await db
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
          .returning();
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
        const [updated] = await db.update(products).set({ active: false }).where(eq(products.id, id)).returning();
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
        const [ficha] = await db
          .select({
            id: fichas.id,
            code: fichas.code,
            status: fichas.status,
            total: fichas.total,
            notes: fichas.notes,
            saleDate: fichas.saleDate,
            createdAt: fichas.createdAt,
            client: {
              name: clients.name,
              phone: clients.phone,
              street: clients.street,
              number: clients.number,
              neighborhood: clients.neighborhood,
              city: clients.city,
              state: clients.state
            },
            seller: {
              name: users.name
            }
          })
          .from(fichas)
          .leftJoin(clients, eq(fichas.clientId, clients.id))
          .leftJoin(users, eq(fichas.sellerId, users.id))
          .where(eq(fichas.id, id))
          .limit(1);

        if (!ficha) {
          console.error("❌ Ficha not found");
          return reply.status(404).send({ error: "Ficha não encontrada" });
        }

        console.log("✅ Ficha head loaded. fetching items...");

        const items = await db
          .select({
            id: fichaItems.id,
            productId: fichaItems.productId,
            productName: products.name,
            sku: products.sku,
            quantity: fichaItems.quantity,
            unitPrice: fichaItems.unitPrice,
            subtotal: fichaItems.subtotal,
            commissionType: fichaItems.commissionType
          })
          .from(fichaItems)
          .leftJoin(products, eq(fichaItems.productId, products.id))
          .where(eq(fichaItems.fichaId, id));

        console.log(`✅ Items loaded: ${items.length}. fetching payments...`);

        const fichaPayments = await db
          .select({
            id: payments.id,
            amount: payments.amount,
            methodName: paymentMethods.name,
            paymentDate: payments.paymentDate
          })
          .from(payments)
          .leftJoin(paymentMethods, eq(payments.methodId, paymentMethods.id))
          .where(eq(payments.fichaId, id));

        console.log(`✅ Payments loaded: ${fichaPayments.length}. Calculating stats...`);

        const totalCC = items
          .filter((i: any) => i.commissionType === 'CC')
          .reduce((acc: number, curr: any) => acc + (Number(curr.subtotal) || 0), 0);
        
        const totalSC = items
          .filter((i: any) => i.commissionType === 'SC')
          .reduce((acc: number, curr: any) => acc + (Number(curr.subtotal) || 0), 0);

        return {
          ...ficha,
          items,
          payments: fichaPayments,
          stats: {
            totalCC,
            totalSC,
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
      const body = request.body as any;
      const { clientId, sellerId, routeId, items, total, notes } = body;

      try {
        const result = await db.transaction(async (tx: any) => {
          // Generate Code
          const [seller] = await tx.select({ code: users.code }).from(users).where(eq(users.id, sellerId)).limit(1);
          const [route]  = await tx.select({ code: routes.code }).from(routes).where(eq(routes.id, routeId)).limit(1);
          const now = new Date();
          const datestr = `${String(now.getDate()).padStart(2,'0')}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
          const finalCode = `${String(seller?.code||0).padStart(4,'0')}${datestr}${String(route?.code||0).padStart(4,'0')}`;

          const [newFicha] = await tx.insert(fichas).values({
            code: finalCode, clientId, sellerId, routeId, total, notes, status: 'nova'
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

            await tx.insert(fichaItems).values({ fichaId: newFicha.id, productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice, subtotal: item.quantity * item.unitPrice });
            await tx.execute(sql`UPDATE seller_inventory SET stock = stock - ${item.quantity} WHERE seller_id = ${sellerId} AND product_id = ${item.productId}`);
          }
          return newFicha;
        });
        return result;
      } catch (error: any) {
        console.error("Create ficha error:", error);
        return reply.status(400).send({ error: error.message || "Erro ao criar ficha" });
      }
    });

    // ── Ficha Link Generation ───────────────────────────────────────────────
    instance.post('/fichas/generate-link', async (request, reply) => {
      const db = (request as any).tenantDb;
      const slug = (request as any).tenant.slug;
      const { clientId, sellerId, routeId, notes } = request.body as any;

      try {
        const linkToken = Math.random().toString(36).substring(2, 10);
        const [newFicha] = await db.insert(fichas).values({
          clientId, sellerId, routeId, notes: notes || "Link gerado para o cliente", status: 'link_gerado', linkToken, total: 0
        }).returning();

        return { linkToken, url: `/public/ficha/${linkToken}?tenant=${slug}` };
      } catch (err) {
        return reply.status(400).send({ error: "Erro ao criar ficha" });
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
          const [updated] = await db.update(paymentMethods)
            .set({ name, active, updatedAt: new Date() })
            .where(eq(paymentMethods.id, id))
            .returning();
          return updated;
        } else {
          // Create
          const [created] = await db.insert(paymentMethods)
            .values({ name, active: active ?? true })
            .returning();
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
        const [updated] = await masterDb.update(tenants)
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
          .returning();
        
        return updated;
      } catch (err) {
        return reply.status(400).send({ error: "Erro ao atualizar dados da empresa" });
      }
    });

    // ─── Cobranças (Viagens) ──────────────────────────────────────────────────

    instance.get('/routes/:id/cobrancas', async (request) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };
      return await db.select()
        .from(cobrancas)
        .where(eq(cobrancas.routeId, id))
        .orderBy(desc(cobrancas.startDate));
    });

    instance.post('/routes/:id/cobrancas', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id: routeId } = request.params as { id: string };
      const { sellerId } = request.body as { sellerId: string };

      try {
        const [newCobranca] = await db.insert(cobrancas)
          .values({
            routeId,
            sellerId,
            status: 'aberta',
            startDate: new Date(),
          })
          .returning();
        
        return newCobranca;
      } catch (err) {
        return reply.status(400).send({ error: "Erro ao iniciar viagem" });
      }
    });

    instance.patch('/cobrancas/:id/close', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };

      try {
        // 1. Mark trip as closed
        const [closedCobranca] = await db.update(cobrancas)
          .set({ 
            status: 'encerrada', 
            endDate: new Date(),
            updatedAt: new Date()
          })
          .where(eq(cobrancas.id, id))
          .returning();

        // 2. Transition linked fiches from 'nova' to 'pendente'
        await db.update(fichas)
          .set({ status: 'pendente', updatedAt: new Date() })
          .where(and(
            eq(fichas.cobrancaId, id),
            eq(fichas.status, 'nova')
          ));

        return closedCobranca;
      } catch (err) {
        return reply.status(400).send({ error: "Erro ao encerrar viagem" });
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

      const [{ count }] = await db.select({ count: sql`count(*)` }).from(routes);

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
      const [newRoute] = await db.insert(routes).values(body).returning();
      return newRoute;
    });

    instance.put('/routes/:id', async (request, reply) => {
      const db = (request as any).tenantDb;
      const { id } = request.params as { id: string };
      const body = request.body as any;
      if (body.periodicity) body.periodicity = Number(body.periodicity);
      
      try {
        const [updatedRoute] = await db
          .update(routes)
          .set(body)
          .where(eq(routes.id, id))
          .returning();
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
        const [updated] = await db.update(routes).set({ active: !route.active }).where(eq(routes.id, id)).returning();
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
          const [movement] = await tx.insert(inventoryMovements).values({
            type: 'entrada_estoque',
            description: type === 'propria' ? 'Entrada Própria' : `Fornecedor: ${supplier}`,
            sellerId: destination === 'vendedor' ? sellerId : null
          }).returning();

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
          const [movement] = await tx.insert(inventoryMovements).values({
            type: 'ajuste_manual',
            description,
            sellerId
          }).returning();

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
      .where(sql`${fichas.status} != 'link_gerado'`);

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
