import 'server-only';
import { auth, clerkClient, type ClerkMiddlewareAuth } from '@clerk/nextjs/server';
export type Role = 'GUEST' | 'USER' | 'ADMIN' | 'SUPER_ADMIN' | 'OPERARIO' | 'COMMERCIAL' | 'INVALID';
export type Tier = 'Personas Naturales' | 'Micromercados' | 'Restaurantes';
export type Capability = 'identity.read' | 'identity.manage' | 'catalog.manage' | 'pricing.manage' | 'inventory.manage' | 'customers.manage' | 'tiers.manage' | 'orders.manage' | 'payments.manage' | 'reports.read' | 'audit.read' | 'settings.read' | 'settings.manage' | 'suppliers.manage' | 'storage.manage' | 'audit.write';
export interface Actor { readonly userId: string | null; readonly role: Role; readonly tier: Tier }
const issued = new WeakSet<object>();
const staff: Capability[] = ['catalog.manage','pricing.manage','inventory.manage','customers.manage','tiers.manage','orders.manage','payments.manage','reports.read','settings.read','settings.manage','suppliers.manage','storage.manage','audit.write'];
const knownCapabilities: Capability[] = [...staff, 'identity.read', 'identity.manage', 'audit.read'];
const tiers: Tier[] = ['Personas Naturales','Micromercados','Restaurantes'];
export function assertTargetId(value: unknown): asserts value is string { if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(value)) throw new Error('INVALID_TARGET'); }
export function validateTier(value: unknown): Tier { if (!tiers.includes(value as Tier)) throw new Error('INVALID_TIER'); return value as Tier; }
export function validateRole(value: unknown): Exclude<Role,'GUEST'|'INVALID'> { if (!['USER','ADMIN','SUPER_ADMIN','OPERARIO','COMMERCIAL'].includes(value as string)) throw new Error('INVALID_ROLE'); return value as Exclude<Role,'GUEST'|'INVALID'>; }
export async function getActor(): Promise<Actor> {
 const { userId } = await auth();
 return actorFromVerifiedSubject(userId);
}
/** Internal server-only adapter: supply Clerk's verified middleware callback, never raw headers or caller IDs. */
export async function getMiddlewareActor(verifiedAuth: ClerkMiddlewareAuth): Promise<Actor> {
 const { userId } = await verifiedAuth();
 return actorFromVerifiedSubject(userId);
}
async function actorFromVerifiedSubject(userId: string | null): Promise<Actor> {
 if (!userId) { const guest: Actor = Object.freeze({userId:null,role:'GUEST',tier:'Personas Naturales'}); issued.add(guest); return guest; }
 assertTargetId(userId);
 const user = await (await clerkClient()).users.getUser(userId);
 if (!user || user.id !== userId || user.banned || user.locked) throw new Error('INVALID_ACTOR');
 const meta = user.publicMetadata || {};
 const raw = typeof meta.role === 'string' ? meta.role.toUpperCase() : meta.role;
 const role: Role = raw == null || raw === 'USER' || raw === 'CLIENT' ? 'USER' : ['ADMIN','SUPER_ADMIN','OPERARIO','COMMERCIAL'].includes(raw as string) ? raw as Role : 'INVALID';
 // Tier is never a source of privileged role elevation. Unknown pricing tier is retail.
 const tier: Tier = role !== 'INVALID' && tiers.includes(meta.tier as Tier) ? meta.tier as Tier : 'Personas Naturales';
 const actor: Actor = Object.freeze({ userId, role, tier }); issued.add(actor); return actor;
}
export function assertIssuedActor(actor: Actor): void { if (!issued.has(actor) || !actor.userId || actor.role === 'INVALID') throw new Error('INVALID_ACTOR'); }
export function hasCapability(actor: Actor, capability: Capability): boolean {
 if (!issued.has(actor) || !knownCapabilities.includes(capability)) return false;
 return actor.role === 'SUPER_ADMIN' || actor.role === 'ADMIN' && staff.includes(capability);
}
export async function requireCapability(capability: Capability): Promise<Actor> { const actor = await getActor(); if (!hasCapability(actor, capability)) throw new Error('FORBIDDEN'); return actor; }
export async function requireOwnedSubject(subject: unknown): Promise<Actor> { const actor = await getActor(); assertIssuedActor(actor); assertTargetId(subject); if (subject !== actor.userId && !hasCapability(actor,'customers.manage')) throw new Error('FORBIDDEN_OWNER'); return actor; }
