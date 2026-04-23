# Admin Panel Migration: Apex to La Gaviota

## Executive Summary
This document outlines the architectural and visual migration of the Admin Panel from the `apex-website` ecosystem directly into the `la-gaviota` Next.js application. The goal was to pivot a generic B2B CRM/CMS panel into a highly specialized, fast, and vibrant dashboard intended for a Colombian Surtifruver operation matching the **La Gaviota** brand identity.

## Structural Changes

### 1. Rebranding & UI Adaptation
- The legacy `bg-gray-900` dark mode has been structurally purged in favor of a clean, fresh `bg-slate-50` and `bg-white` light mode.
- Core Accent Colors heavily injected:
  - **Cherry Red (`#E30613`)**: Primary actions, error states.
  - **Leaf Green (`#4CAF50`)**: Success states, "Kit Chévere" focus.
  - **Warm Yellow (`#FFCC00`)**: B2B Wholesale interactions (Micromercados).
- The Sidebar now correctly references La Gaviota modules (Gestión de Clientes, Catálogo & Precios, Gestión de Pedidos, etc.) instead of general CRM modules.

### 2. Contexts and Dependencies
- Successfully moved `AuthContext.tsx` and `useRBAC.ts` from `apex-website` into `la-gaviota/src/contexts/` and `la-gaviota/src/hooks/`.
- Modified `app/admin/layout.tsx` to read dependencies from the `src/` alias properly.

## New Modules Developed

### Gestión de Precios por Tier (`/admin/pricing`)
The most significant addition is the **Tiered Pricing Multiplier Grid**. 
- It replaces complex individual product updates with a spreadsheet-like interface.
- Includes a "Tarifador Rápido" (Fast Pricing Engine) that allows an administrator to apply bulk percentage multipliers. For example, setting Micromercados to `-15%` of the retail price across all items, drastically reducing catalog maintenance time.
- Operates inline without triggering massive re-renders, relying on a unified "Guardar Cambios" network call.

### Surtifruver Dashboard Overview (`/admin`)
- Replaces generic data with:
  - **Ventas del Día**
  - **Pedidos Pendientes B2B**
  - **Estado del Kit Chévere Activo**
  - **Alertas de Inventario** (Low stock notifications for fresh produce).

## Legacy Modules Available
The following modules were implicitly bridged by copying the `/admin` structure and refactoring the Sidebar. Further inner structural changes to these modules (if they existed in Apex) can be performed iteratively:
- CRM (Cloned to Personas Naturales, Micro, Restaurantes).
- Analytics (Cloned to Reportes y Ventas).

## Next Steps
- Connect the simulated Pricing grid save handler (`handleSave()`) directly to the PostgreSQL/Prisma datastore mutations.
- Monitor active wholesale users using the new "Pedidos Pendientes B2B" grid logic.
