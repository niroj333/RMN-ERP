# RMN ERP Core Platform

## Project Overview
Core Platform Foundation for RMN ERP.

## Prerequisites
- Node.js >= 20 LTS
- pnpm >= 9.15.0
- Docker & Docker Compose

## Setup steps
1. **Clone the repository**
2. **Install dependencies:**
   ```sh
   pnpm install
   ```
3. **Start infrastructure (PostgreSQL & Redis):**
   ```sh
   pnpm run docker:up
   ```
4. **Copy `.env.example` to `.env`:**
   ```sh
   cp .env.example .env
   ```
5. **Run database migrations:**
   ```sh
   pnpm run db:generate
   pnpm run db:migrate
   ```
6. **Start development server:**
   ```sh
   pnpm run dev
   ```

## Architecture Overview
- Node.js + Fastify + TypeScript API
- PostgreSQL 16 + Drizzle ORM
- Redis 7
- pnpm workspaces

## Links
- [Governance Docs](#)
