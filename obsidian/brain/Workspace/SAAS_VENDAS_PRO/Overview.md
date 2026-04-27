# 🚀 SAAS_VENDAS_PRO: Project Overview

Sistema de gestão de vendas e acerto de fichas para vendedores externos (venda rápida/porta-a-porta).

## 🏗️ Architecture

- **Backend**: Fastify + Drizzle ORM + PostgreSQL (Multi-tenant DB-per-tenant).
- **Web**: Next.js + Tailwind CSS + Lucide Icons.
- **Mobile**: React Native (Expo) + SQLite (Local-First) + NativeWind v4.

## 🔑 Key Features

- **Offline-First**: Total operabilidade sem internet, sincronismo via fila (`sync_queue`).
- **Gestão de Viagens**: Vendedores retiram estoque (Cargo) e realizam acertos ao retornar.
- **Isolamento de Dados**: Cada empresa (tenant) possui seu banco físico independente.
- **Lock de Conferência (Segurança)**: Fichas com status `pendente` são bloqueadas para edição após o "Fechamento de Ficha" (`items_locked = true`). O desbloqueio só pode ser feito via Dashboard Web pelo Administrador.
