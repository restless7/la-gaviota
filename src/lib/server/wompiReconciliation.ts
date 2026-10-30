import 'server-only';
import { SupabaseClient } from '@supabase/supabase-js';

export interface WompiTransactionResponse {
  id: string;
  reference: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR';
  amount_in_cents: number;
  currency: string;
  environment?: string;
  created_at?: string;
}

export interface WompiClientAdapter {
  getTransactionById(txId: string): Promise<WompiTransactionResponse | null>;
  getTransactionByReference(reference: string): Promise<WompiTransactionResponse | null>;
}

export class DefaultWompiApiAdapter implements WompiClientAdapter {
  private privateKey: string;
  private baseUrl: string;

  constructor(privateKey?: string, isProduction: boolean = false) {
    this.privateKey = privateKey || process.env.WOMPI_PRIVATE_KEY || '';
    this.baseUrl = isProduction 
      ? 'https://production.wompi.co/v1' 
      : 'https://sandbox.wompi.co/v1';
  }

  async getTransactionById(txId: string): Promise<WompiTransactionResponse | null> {
    if (!this.privateKey) {
      throw new Error('WOMPI_CREDENTIALS_UNCONFIGURED: WOMPI_PRIVATE_KEY is missing');
    }
    const res = await fetch(`${this.baseUrl}/transactions/${encodeURIComponent(txId)}`, {
      headers: {
        Authorization: `Bearer ${this.privateKey}`,
        'Content-Type': 'application/json',
      },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`WOMPI_API_ERROR: HTTP ${res.status}`);
    const data = await res.json();
    return data?.data || null;
  }

  async getTransactionByReference(reference: string): Promise<WompiTransactionResponse | null> {
    if (!this.privateKey) {
      throw new Error('WOMPI_CREDENTIALS_UNCONFIGURED: WOMPI_PRIVATE_KEY is missing');
    }
    const res = await fetch(`${this.baseUrl}/transactions?reference=${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${this.privateKey}`,
        'Content-Type': 'application/json',
      },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`WOMPI_API_ERROR: HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data?.data) && data.data.length > 0) {
      const list: WompiTransactionResponse[] = data.data;
      // 1. Prioritize any APPROVED transaction to settle commercial intent
      const approved = list.find((t) => t.status === 'APPROVED');
      if (approved) return approved;
      // 2. Next, check for any in-flight PENDING transaction
      const pending = list.find((t) => t.status === 'PENDING');
      if (pending) return pending;
      // 3. Otherwise return the latest transaction attempt
      return list[list.length - 1];
    }
    return null;
  }
}

export interface ReconcileOptions {
  minAgeMinutes?: number;
  maxAgeHours?: number;
  batchSize?: number;
  providerAdapter?: WompiClientAdapter;
  expectedEnvironment?: 'sandbox' | 'production' | 'test' | 'prod';
}

export interface ReconcileResult {
  totalScanned: number;
  reconciledApproved: number;
  reconciledFailed: number;
  escalatedUnresolved: number;
  pendingUnchanged: number;
  errors: Array<{ intentId: string; error: string }>;
}

export async function reconcilePendingPaymentIntents(
  supabase: SupabaseClient,
  options: ReconcileOptions = {}
): Promise<ReconcileResult> {
  const minAgeMinutes = options.minAgeMinutes ?? 15;
  const maxAgeHours = options.maxAgeHours ?? 24;
  const batchSize = options.batchSize ?? 50;
  const adapter = options.providerAdapter || new DefaultWompiApiAdapter();
  const expectedEnv = options.expectedEnvironment || (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox');

  const result: ReconcileResult = {
    totalScanned: 0,
    reconciledApproved: 0,
    reconciledFailed: 0,
    escalatedUnresolved: 0,
    pendingUnchanged: 0,
    errors: [],
  };

  // Explicit operational kill switch
  if (process.env.RECONCILIATION_DISABLED === 'true' || process.env.ENABLE_WOMPI_RECONCILIATION === 'false') {
    return result;
  }

  const cutoffDate = new Date(Date.now() - minAgeMinutes * 60 * 1000).toISOString();
  const maxAgeCutoffDate = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();

  // Query unconfirmed pending intents older than minAge
  const { data: intents, error: fetchError } = await supabase
    .from('payment_intents')
    .select('*')
    .eq('status', 'PENDING')
    .lte('created_at', cutoffDate)
    .order('created_at', { ascending: true })
    .limit(batchSize);

  if (fetchError) {
    throw new Error(`RECONCILIATION_FETCH_FAILED: ${fetchError.message}`);
  }

  if (!intents || intents.length === 0) {
    return result;
  }

  result.totalScanned = intents.length;

  for (const intent of intents) {
    try {
      const intentCreatedAtMs = new Date(intent.created_at).getTime();
      const maxAgeCutoffMs = Date.now() - maxAgeHours * 60 * 60 * 1000;
      const isExhausted = intentCreatedAtMs <= maxAgeCutoffMs;

      // Attempt to find provider transaction
      let tx: WompiTransactionResponse | null = null;
      try {
        if (intent.provider_transaction_id) {
          tx = await adapter.getTransactionById(intent.provider_transaction_id);
        } else if (intent.provider_reference || intent.intent_id) {
          tx = await adapter.getTransactionByReference(intent.provider_reference || intent.intent_id);
        }
      } catch (adapterErr) {
        const errMsg = adapterErr instanceof Error ? adapterErr.message : String(adapterErr);
        result.errors.push({ intentId: intent.intent_id, error: `Provider query failed: ${errMsg}` });
        
        if (isExhausted) {
          // If query failed and time exhausted, escalate to operators
          await supabase
            .from('payment_intents')
            .update({
              reconciliation_status: 'ESCALATED_UNRESOLVED',
              reconciliation_notes: `Exhausted 24h retry window. Provider query error: ${errMsg}`,
              last_reconciled_at: new Date().toISOString(),
            })
            .eq('id', intent.id);
          result.escalatedUnresolved++;
        }
        continue;
      }

      // If provider transaction found:
      if (tx) {
        // Environment mismatch check
        if (tx.environment && expectedEnv) {
          const normTxEnv = tx.environment.toLowerCase();
          const normExpEnv = expectedEnv.toLowerCase();
          const isProd = normExpEnv === 'production' || normExpEnv === 'prod';
          const isTxProd = normTxEnv === 'production' || normTxEnv === 'prod';
          if (isProd !== isTxProd) {
            await supabase
              .from('payment_intents')
              .update({
                reconciliation_status: 'ESCALATED_UNRESOLVED',
                reconciliation_notes: `ENVIRONMENT_MISMATCH: Expected ${expectedEnv} but received ${tx.environment}`,
                last_reconciled_at: new Date().toISOString(),
              })
              .eq('id', intent.id);
            result.escalatedUnresolved++;
            continue;
          }
        }

        // Amount verification
        const expectedCents = Math.round(Number(intent.amount) * 100);
        if (tx.amount_in_cents !== expectedCents) {
          await supabase
            .from('payment_intents')
            .update({
              reconciliation_status: 'ESCALATED_UNRESOLVED',
              reconciliation_notes: `AMOUNT_MISMATCH: Intent requires ${expectedCents} cents, provider reported ${tx.amount_in_cents}`,
              last_reconciled_at: new Date().toISOString(),
            })
            .eq('id', intent.id);
          result.escalatedUnresolved++;
          continue;
        }

        if (tx.status === 'APPROVED') {
          // Invoke atomic processing RPC with deterministic receipt identity
          const receiptId = `wompi_tx_${tx.id}_status_APPROVED`;
          const { data: rpcRes, error: rpcErr } = await supabase.rpc('process_wompi_transaction', {
            p_event_id: receiptId,
            p_transaction: tx,
          });

          if (rpcErr) {
            throw new Error(`RPC_PROCESS_FAILED: ${rpcErr.message}`);
          }

          await supabase
            .from('payment_intents')
            .update({
              status: 'APPROVED',
              reconciliation_status: 'RECONCILED_POLL',
              provider_transaction_id: tx.id,
              reconciliation_notes: `Reconciled via active provider polling. RPC: ${JSON.stringify(rpcRes)}`,
              last_reconciled_at: new Date().toISOString(),
            })
            .eq('id', intent.id);

          result.reconciledApproved++;
          continue;

        } else if (['DECLINED', 'VOIDED', 'ERROR'].includes(tx.status)) {
          await supabase
            .from('payment_intents')
            .update({
              status: tx.status,
              reconciliation_status: 'RECONCILED_POLL',
              provider_transaction_id: tx.id,
              reconciliation_notes: `Terminal non-approval status recorded from provider: ${tx.status}`,
              last_reconciled_at: new Date().toISOString(),
            })
            .eq('id', intent.id);

          if (intent.order_id) {
            await supabase
              .from('orders')
              .update({
                payment_status: 'declined',
              })
              .eq('id', intent.order_id);
          }

          result.reconciledFailed++;
          continue;

        } else {
          // Still PENDING at provider
          if (isExhausted) {
            await supabase
              .from('payment_intents')
              .update({
                reconciliation_status: 'ESCALATED_UNRESOLVED',
                reconciliation_notes: 'Exhausted 24h provider retry window with transaction still PENDING at provider. Preserved for operator manual verification.',
                last_reconciled_at: new Date().toISOString(),
              })
              .eq('id', intent.id);

            if (intent.order_id) {
              await supabase
                .from('orders')
                .update({
                  payment_status: 'pending_review',
                })
                .eq('id', intent.order_id);
            }
            result.escalatedUnresolved++;
          } else {
            result.pendingUnchanged++;
          }
          continue;
        }

      } else {
        // No transaction found at provider
        if (isExhausted) {
          await supabase
            .from('payment_intents')
            .update({
              reconciliation_status: 'ESCALATED_UNRESOLVED',
              reconciliation_notes: `Exhausted 24h provider retry window. No transaction found on provider API for reference ${intent.provider_reference || intent.intent_id}. Preserved for operator review.`,
              last_reconciled_at: new Date().toISOString(),
            })
            .eq('id', intent.id);

          if (intent.order_id) {
            await supabase
              .from('orders')
              .update({
                payment_status: 'pending_review',
              })
              .eq('id', intent.order_id);
          }
          result.escalatedUnresolved++;
        } else {
          result.pendingUnchanged++;
        }
      }

    } catch (itemErr) {
      const msg = itemErr instanceof Error ? itemErr.message : String(itemErr);
      result.errors.push({ intentId: intent.intent_id, error: msg });
    }
  }

  try {
    await supabase.from('audit_logs').insert({
      action: 'WOMPI_RECONCILIATION_JOB',
      details: {
        totalScanned: result.totalScanned,
        reconciledApproved: result.reconciledApproved,
        reconciledFailed: result.reconciledFailed,
        escalatedUnresolved: result.escalatedUnresolved,
        pendingUnchanged: result.pendingUnchanged,
        errorCount: result.errors.length,
        timestamp: new Date().toISOString(),
      }
    });
  } catch {
    // Non-blocking telemetry
  }

  return result;
}
