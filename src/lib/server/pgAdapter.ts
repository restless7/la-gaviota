import 'server-only';
import { Pool, types } from 'pg';

// Match PostgREST numeric/int8 behavior (return JS numbers instead of strings)
types.setTypeParser(1700, (val: string) => parseFloat(val));
types.setTypeParser(20, (val: string) => Number(val));

const globalForPg = globalThis as unknown as { __laGaviotaPgPool?: Pool };

function getConnectionString(): string {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL_UNPOOLED;
  if (!url) {
    throw new Error('SERVER_DATABASE_UNCONFIGURED');
  }
  return url;
}

export function getPgPool(): Pool {
  if (!globalForPg.__laGaviotaPgPool) {
    globalForPg.__laGaviotaPgPool = new Pool({
      connectionString: getConnectionString(),
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: { rejectUnauthorized: false },
    });
  }
  return globalForPg.__laGaviotaPgPool;
}

function safeIdent(name: string): string {
  const clean = name.trim();
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(clean)) {
    throw new Error(`INVALID_SQL_IDENTIFIER: ${name}`);
  }
  return `"${clean}"`;
}

type WhereClause = {
  sql: string;
  params: unknown[];
};

interface RelationSpec {
  alias: string;
  table: string;
  inner: boolean;
  cols: string;
  nested: RelationSpec[];
}

// Known parent->child and child->parent foreign key mappings
const RELATION_KEYS: Record<string, Record<string, { localKey: string; foreignKey: string; many: boolean }>> = {
  orders: {
    order_items: { localKey: 'id', foreignKey: 'order_id', many: true },
  },
  kits: {
    kit_items: { localKey: 'id', foreignKey: 'kit_id', many: true },
  },
  kit_items: {
    products: { localKey: 'product_id', foreignKey: 'id', many: false },
  },
  grocery_subscriptions: {
    grocery_subscription_items: { localKey: 'id', foreignKey: 'subscription_id', many: true },
    grocery_subscription_occurrences: { localKey: 'id', foreignKey: 'subscription_id', many: true },
    grocery_subscription_events: { localKey: 'id', foreignKey: 'subscription_id', many: true },
  },
  agricultural_shrinkage_logs: {
    products: { localKey: 'product_id', foreignKey: 'id', many: false },
  },
};

function splitTopLevelCommas(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of input) {
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) {
      if (current.trim()) parts.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function parseSelectExpression(selectStr: string): { baseCols: string[]; relations: RelationSpec[] } {
  const tokens = splitTopLevelCommas(selectStr || '*');
  const baseCols: string[] = [];
  const relations: RelationSpec[] = [];

  for (const tok of tokens) {
    const relMatch = tok.match(/^([a-zA-Z0-9_]+)(?::([a-zA-Z0-9_]+))?(!inner)?\(([\s\S]*)\)$/);
    if (relMatch) {
      const alias = relMatch[1];
      const table = relMatch[2] || relMatch[1];
      const inner = Boolean(relMatch[3]);
      const innerSelect = relMatch[4].trim() || '*';
      const parsedInner = parseSelectExpression(innerSelect);
      relations.push({
        alias,
        table,
        inner,
        cols: parsedInner.baseCols.join(', ') || '*',
        nested: parsedInner.relations,
      });
    } else {
      baseCols.push(tok);
    }
  }
  return { baseCols, relations };
}

function parseOrExpression(expr: string, nextParam: (v: unknown) => string): string {
  const parts = splitTopLevelCommas(expr);
  const clauses: string[] = [];
  for (const part of parts) {
    const m = part.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\.([a-z]+)\.(.*)$/);
    if (!m) continue;
    const [, col, op, rawVal] = m;
    const ident = safeIdent(col);
    if (op === 'eq') clauses.push(`${ident} = ${nextParam(rawVal)}`);
    else if (op === 'neq') clauses.push(`${ident} <> ${nextParam(rawVal)}`);
    else if (op === 'gt') clauses.push(`${ident} > ${nextParam(rawVal)}`);
    else if (op === 'gte') clauses.push(`${ident} >= ${nextParam(rawVal)}`);
    else if (op === 'lt') clauses.push(`${ident} < ${nextParam(rawVal)}`);
    else if (op === 'lte') clauses.push(`${ident} <= ${nextParam(rawVal)}`);
    else if (op === 'ilike') clauses.push(`${ident} ILIKE ${nextParam(rawVal)}`);
    else if (op === 'like') clauses.push(`${ident} LIKE ${nextParam(rawVal)}`);
    else if (op === 'is') {
      if (rawVal === 'null') clauses.push(`${ident} IS NULL`);
      else if (rawVal === 'true') clauses.push(`${ident} IS TRUE`);
      else if (rawVal === 'false') clauses.push(`${ident} IS FALSE`);
    }
  }
  return clauses.length > 0 ? `(${clauses.join(' OR ')})` : 'TRUE';
}

type QueryResult<T = unknown> = {
  data: T | null;
  error: { message: string; code?: string } | null;
  count?: number | null;
};

class PgQueryBuilder implements PromiseLike<QueryResult> {
  private pool: Pool;
  private table: string;
  private op: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  private selectStr = '*';
  private countMode: 'exact' | 'planned' | 'estimated' | null = null;
  private headOnly = false;
  private returnAfterWrite = false;
  private writePayload: unknown = null;
  private upsertConflictCols: string[] | null = null;
  private filters: Array<(nextParam: (v: unknown) => string) => string> = [];
  private orders: Array<{ col: string; ascending: boolean }> = [];
  private limitVal: number | null = null;
  private expectSingle: 'none' | 'single' | 'maybeSingle' = 'none';

  constructor(pool: Pool, table: string) {
    this.pool = pool;
    this.table = table;
  }

  select(columns = '*', options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) {
    if (this.op === 'insert' || this.op === 'update' || this.op === 'upsert') {
      this.returnAfterWrite = true;
      this.selectStr = columns;
    } else {
      this.op = 'select';
      this.selectStr = columns;
    }
    if (options?.count) this.countMode = options.count;
    if (options?.head) this.headOnly = true;
    return this;
  }

  insert(values: Record<string, unknown> | Record<string, unknown>[]) {
    this.op = 'insert';
    this.writePayload = values;
    return this;
  }

  update(values: Record<string, unknown>) {
    this.op = 'update';
    this.writePayload = values;
    return this;
  }

  upsert(
    values: Record<string, unknown> | Record<string, unknown>[],
    options?: { onConflict?: string }
  ) {
    this.op = 'upsert';
    this.writePayload = values;
    if (options?.onConflict) {
      this.upsertConflictCols = options.onConflict.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return this;
  }

  delete() {
    this.op = 'delete';
    return this;
  }

  eq(col: string, val: unknown) {
    this.filters.push((p) => `${safeIdent(col)} = ${p(val)}`);
    return this;
  }

  neq(col: string, val: unknown) {
    this.filters.push((p) => `${safeIdent(col)} <> ${p(val)}`);
    return this;
  }

  gt(col: string, val: unknown) {
    this.filters.push((p) => `${safeIdent(col)} > ${p(val)}`);
    return this;
  }

  gte(col: string, val: unknown) {
    this.filters.push((p) => `${safeIdent(col)} >= ${p(val)}`);
    return this;
  }

  lt(col: string, val: unknown) {
    this.filters.push((p) => `${safeIdent(col)} < ${p(val)}`);
    return this;
  }

  lte(col: string, val: unknown) {
    this.filters.push((p) => `${safeIdent(col)} <= ${p(val)}`);
    return this;
  }

  like(col: string, val: string) {
    this.filters.push((p) => `${safeIdent(col)} LIKE ${p(val)}`);
    return this;
  }

  ilike(col: string, val: string) {
    this.filters.push((p) => `${safeIdent(col)} ILIKE ${p(val)}`);
    return this;
  }

  is(col: string, val: null | boolean) {
    this.filters.push(() => {
      if (val === null) return `${safeIdent(col)} IS NULL`;
      return val ? `${safeIdent(col)} IS TRUE` : `${safeIdent(col)} IS FALSE`;
    });
    return this;
  }

  in(col: string, vals: unknown[]) {
    this.filters.push((p) => {
      if (!Array.isArray(vals) || vals.length === 0) return 'FALSE';
      const placeholders = vals.map((v) => p(v)).join(', ');
      return `${safeIdent(col)} IN (${placeholders})`;
    });
    return this;
  }

  contains(col: string, val: unknown) {
    this.filters.push((p) => `${safeIdent(col)} @> ${p(typeof val === 'string' ? val : JSON.stringify(val))}::jsonb`);
    return this;
  }

  not(col: string, op: string, val: unknown) {
    this.filters.push((p) => {
      const ident = safeIdent(col);
      if (op === 'is' && val === null) return `${ident} IS NOT NULL`;
      if (op === 'is' && val === true) return `${ident} IS NOT TRUE`;
      if (op === 'is' && val === false) return `${ident} IS NOT FALSE`;
      if (op === 'eq') return `${ident} <> ${p(val)}`;
      if (op === 'in' && Array.isArray(val)) {
        if (val.length === 0) return 'TRUE';
        return `${ident} NOT IN (${val.map((v) => p(v)).join(', ')})`;
      }
      return `NOT (${ident} = ${p(val)})`;
    });
    return this;
  }

  or(expr: string) {
    this.filters.push((p) => parseOrExpression(expr, p));
    return this;
  }

  filter(col: string, op: string, val: unknown) {
    if (op === 'eq') return this.eq(col, val);
    if (op === 'neq') return this.neq(col, val);
    if (op === 'gt') return this.gt(col, val);
    if (op === 'gte') return this.gte(col, val);
    if (op === 'lt') return this.lt(col, val);
    if (op === 'lte') return this.lte(col, val);
    if (op === 'ilike') return this.ilike(col, String(val));
    if (op === 'is') return this.is(col, val as null | boolean);
    if (op === 'in' && Array.isArray(val)) return this.in(col, val);
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orders.push({ col, ascending: opts?.ascending !== false });
    return this;
  }

  limit(n: number) {
    this.limitVal = n;
    return this;
  }

  single() {
    this.expectSingle = 'single';
    return this;
  }

  maybeSingle() {
    this.expectSingle = 'maybeSingle';
    return this;
  }

  private buildWhere(startIdx = 1): WhereClause {
    const params: unknown[] = [];
    const nextParam = (v: unknown) => {
      params.push(v);
      return `$${startIdx + params.length - 1}`;
    };
    if (this.filters.length === 0) return { sql: '', params: [] };
    const clauses = this.filters.map((fn) => fn(nextParam));
    return { sql: ` WHERE ${clauses.join(' AND ')}`, params };
  }

  private async hydrateRelations(
    parentTable: string,
    rows: Record<string, unknown>[],
    relations: RelationSpec[]
  ): Promise<Record<string, unknown>[]> {
    if (rows.length === 0 || relations.length === 0) return rows;
    const tableRels = RELATION_KEYS[parentTable] || {};

    for (const rel of relations) {
      const mapping = tableRels[rel.table] || {
        localKey: 'id',
        foreignKey: `${parentTable.replace(/s$/, '')}_id`,
        many: true,
      };
      const parentKeys = [...new Set(rows.map((r) => r[mapping.localKey]).filter((v) => v != null))];
      if (parentKeys.length === 0) {
        for (const r of rows) r[rel.alias] = mapping.many ? [] : null;
        continue;
      }

      let childCols = '*';
      if (rel.cols !== '*') {
        const childColSet = new Set(rel.cols.split(',').map((c) => c.trim()).filter(Boolean));
        childColSet.add(mapping.foreignKey);
        const childRels = RELATION_KEYS[rel.table] || {};
        for (const subRel of rel.nested) {
          const subMap = childRels[subRel.table];
          if (subMap) childColSet.add(subMap.localKey);
        }
        childCols = [...childColSet].map((c) => safeIdent(c)).join(', ');
      }
      const placeholders = parentKeys.map((_, i) => `$${i + 1}`).join(', ');
      const sql = `SELECT ${childCols} FROM public.${safeIdent(rel.table)} WHERE ${safeIdent(mapping.foreignKey)} IN (${placeholders})`;
      const { rows: childRows } = await this.pool.query(sql, parentKeys);

      const hydratedChildren =
        rel.nested.length > 0 ? await this.hydrateRelations(rel.table, childRows, rel.nested) : childRows;

      const byKey = new Map<unknown, Record<string, unknown>[]>();
      for (const child of hydratedChildren) {
        const k = child[mapping.foreignKey];
        const arr = byKey.get(k) || [];
        arr.push(child);
        byKey.set(k, arr);
      }

      for (const r of rows) {
        const matches = byKey.get(r[mapping.localKey]) || [];
        r[rel.alias] = mapping.many ? matches : matches[0] || null;
      }

      if (rel.inner) {
        rows = rows.filter((r) => {
          const val = r[rel.alias];
          return Array.isArray(val) ? val.length > 0 : Boolean(val);
        });
      }
    }

    return rows;
  }

  private async execute(): Promise<QueryResult> {
    try {
      const tbl = `public.${safeIdent(this.table)}`;

      if (this.op === 'select') {
        const { baseCols, relations } = parseSelectExpression(this.selectStr);
        const { sql: whereSql, params } = this.buildWhere(1);

        if (this.headOnly && this.countMode) {
          const countSql = `SELECT COUNT(*)::int AS cnt FROM ${tbl}${whereSql}`;
          const { rows } = await this.pool.query(countSql, params);
          return { data: null, error: null, count: rows[0]?.cnt ?? 0 };
        }

        const selectCols =
          baseCols.length === 0 || baseCols.includes('*')
            ? '*'
            : baseCols.map((c) => safeIdent(c.trim())).join(', ');

        // Ensure relation join keys are included in parent select
        let finalSelectCols = selectCols;
        if (finalSelectCols !== '*' && relations.length > 0) {
          const tableRels = RELATION_KEYS[this.table] || {};
          const neededKeys = new Set(baseCols.map((c) => c.trim()));
          for (const rel of relations) {
            const m = tableRels[rel.table];
            if (m) neededKeys.add(m.localKey);
            else neededKeys.add('id');
          }
          finalSelectCols = [...neededKeys].map((c) => safeIdent(c)).join(', ');
        }

        let sql = `SELECT ${finalSelectCols} FROM ${tbl}${whereSql}`;
        if (this.orders.length > 0) {
          const ord = this.orders.map((o) => `${safeIdent(o.col)} ${o.ascending ? 'ASC' : 'DESC'}`).join(', ');
          sql += ` ORDER BY ${ord}`;
        }
        if (this.limitVal !== null) {
          sql += ` LIMIT ${Math.max(0, Math.floor(this.limitVal))}`;
        }

        const { rows } = await this.pool.query(sql, params);
        const hydrated = await this.hydrateRelations(this.table, rows, relations);

        let totalCount: number | null = null;
        if (this.countMode) {
          const { rows: cRows } = await this.pool.query(`SELECT COUNT(*)::int AS cnt FROM ${tbl}${whereSql}`, params);
          totalCount = cRows[0]?.cnt ?? hydrated.length;
        }

        if (this.expectSingle === 'single') {
          if (hydrated.length !== 1) {
            return { data: null, error: { message: 'Row not found or multiple rows returned', code: 'PGRST116' }, count: totalCount };
          }
          return { data: hydrated[0], error: null, count: totalCount };
        }
        if (this.expectSingle === 'maybeSingle') {
          if (hydrated.length > 1) {
            return { data: null, error: { message: 'Multiple rows returned', code: 'PGRST116' }, count: totalCount };
          }
          return { data: hydrated[0] ?? null, error: null, count: totalCount };
        }
        return { data: hydrated, error: null, count: totalCount };
      }

      if (this.op === 'insert' || this.op === 'upsert') {
        const items = Array.isArray(this.writePayload) ? this.writePayload : [this.writePayload];
        if (items.length === 0) return { data: [], error: null };
        const cols = [...new Set(items.flatMap((it) => Object.keys(it as Record<string, unknown>)))];
        const params: unknown[] = [];
        const valueTuples = items.map((item) => {
          const rec = item as Record<string, unknown>;
          const placeholders = cols.map((c) => {
            const val = rec[c];
            params.push(val === undefined ? null : val);
            return `$${params.length}`;
          });
          return `(${placeholders.join(', ')})`;
        });
        const colList = cols.map((c) => safeIdent(c)).join(', ');

        let conflictClause = '';
        if (this.op === 'upsert') {
          const conflictCols =
            this.upsertConflictCols ||
            (cols.includes('clerk_user_id') && this.table === 'customers'
              ? ['clerk_user_id']
              : ['id']);
          const conflictIdent = conflictCols.map((c) => safeIdent(c)).join(', ');
          const updateCols = cols.filter((c) => !conflictCols.includes(c));
          const updates =
            updateCols.length > 0
              ? updateCols.map((c) => `${safeIdent(c)} = EXCLUDED.${safeIdent(c)}`).join(', ')
              : `${safeIdent(conflictCols[0])} = EXCLUDED.${safeIdent(conflictCols[0])}`;
          conflictClause = ` ON CONFLICT (${conflictIdent}) DO UPDATE SET ${updates}`;
        }

        const returning = this.returnAfterWrite ? ' RETURNING *' : '';
        const sql = `INSERT INTO ${tbl} (${colList}) VALUES ${valueTuples.join(', ')}${conflictClause}${returning}`;
        const { rows } = await this.pool.query(sql, params);

        if (!this.returnAfterWrite) return { data: null, error: null };
        if (this.expectSingle === 'single' || this.expectSingle === 'maybeSingle') {
          return { data: rows[0] ?? null, error: null };
        }
        return { data: rows, error: null };
      }

      if (this.op === 'update') {
        const rec = (this.writePayload || {}) as Record<string, unknown>;
        const entries = Object.entries(rec).filter(([, v]) => v !== undefined);
        if (entries.length === 0) return { data: [], error: null };
        const setParams: unknown[] = [];
        const setClause = entries
          .map(([k, v]) => {
            setParams.push(v);
            return `${safeIdent(k)} = $${setParams.length}`;
          })
          .join(', ');

        const { sql: whereSql, params: whereParams } = this.buildWhere(setParams.length + 1);
        const returning = this.returnAfterWrite ? ' RETURNING *' : '';
        const sql = `UPDATE ${tbl} SET ${setClause}${whereSql}${returning}`;
        const { rows } = await this.pool.query(sql, [...setParams, ...whereParams]);

        if (!this.returnAfterWrite) return { data: null, error: null };
        if (this.expectSingle === 'single' || this.expectSingle === 'maybeSingle') {
          return { data: rows[0] ?? null, error: null };
        }
        return { data: rows, error: null };
      }

      if (this.op === 'delete') {
        const { sql: whereSql, params } = this.buildWhere(1);
        const sql = `DELETE FROM ${tbl}${whereSql}`;
        await this.pool.query(sql, params);
        return { data: null, error: null };
      }

      return { data: null, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const code = (err as { code?: string })?.code;
      return { data: null, error: { message: msg, code } };
    }
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export function createPgDatabase() {
  const pool = getPgPool();
  return {
    from(table: string) {
      return new PgQueryBuilder(pool, table);
    },
    async rpc<T = unknown>(fnName: string, args: Record<string, unknown> = {}): Promise<QueryResult<T>> {
      try {
        const entries = Object.entries(args);
        const params: unknown[] = [];
        const namedArgs = entries
          .map(([k, v]) => {
            const cleanKey = k.trim();
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cleanKey)) {
              throw new Error(`INVALID_RPC_ARG: ${k}`);
            }
            const serialized = v !== null && typeof v === 'object' ? JSON.stringify(v) : v;
            params.push(serialized);
            if (v !== null && typeof v === 'object') {
              return `${cleanKey} => $${params.length}::jsonb`;
            }
            return `${cleanKey} => $${params.length}`;
          })
          .join(', ');

        const sql = `SELECT public.${safeIdent(fnName)}(${namedArgs}) AS result`;
        const { rows } = await pool.query(sql, params);
        return { data: (rows[0]?.result ?? null) as T, error: null };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const code = (err as { code?: string })?.code;
        return { data: null, error: { message: msg, code } };
      }
    },
    storage: {
      from() {
        return {
          upload: async () => ({ data: null, error: { message: 'Supabase storage disabled; using Vercel Blob' } }),
          remove: async () => ({ data: null, error: null }),
          list: async () => ({ data: [], error: null }),
          getPublicUrl: (key: string) => ({ data: { publicUrl: key } }),
        };
      },
    },
  };
}

