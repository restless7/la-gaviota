-- Sprint 1 (P0): Promote Wompi orders created in 'Pago Pendiente' -> 'En Preparación' on approval.
-- Idempotent update to public.process_wompi_transaction keeping existing security invariants intact.

CREATE OR REPLACE FUNCTION public.process_wompi_transaction(
  p_event_id TEXT,
  p_transaction jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tx_id TEXT;
  v_reference TEXT;
  v_status TEXT;
  v_amount_cents BIGINT;
  v_currency TEXT;
  v_amount_numeric NUMERIC;
  v_match_user TEXT;
  v_order_id UUID;
  v_receipt_id TEXT;
  v_intent RECORD;
  v_order RECORD;
  v_updated_rows INT;
BEGIN
  IF lg_auth.caller_role() <> 'service_role' AND NOT (lg_auth.caller_role() = session_user AND session_user IN ('postgres', 'sebastiangarcia')) THEN
    RAISE EXCEPTION 'FORBIDDEN_EXECUTION_ROLE: Role % is not authorized to process payment callbacks', lg_auth.caller_role();
  END IF;

  v_tx_id := NULLIF(TRIM(p_transaction->>'id'), '');
  v_reference := NULLIF(TRIM(p_transaction->>'reference'), '');
  v_status := NULLIF(TRIM(p_transaction->>'status'), '');
  v_amount_cents := (p_transaction->>'amount_in_cents')::BIGINT;
  v_currency := COALESCE(p_transaction->>'currency', 'COP');
  v_amount_numeric := v_amount_cents / 100.0;

  IF v_tx_id IS NULL OR v_reference IS NULL OR v_status IS NULL THEN
    RAISE EXCEPTION 'INVALID_TRANSACTION_PAYLOAD: Missing transaction id, reference, or status';
  END IF;

  v_receipt_id := COALESCE(
    NULLIF(TRIM(p_event_id), ''),
    'wompi_tx_' || v_tx_id || '_status_' || v_status
  );

  BEGIN
    INSERT INTO public.wompi_event_receipts (
      event_id, provider_transaction_id, reference, status, amount_in_cents, currency
    ) VALUES (
      v_receipt_id, v_tx_id, v_reference, v_status, v_amount_cents, v_currency
    )
    ON CONFLICT (provider_transaction_id, status) DO NOTHING;
  EXCEPTION WHEN unique_violation THEN
    RETURN pg_catalog.jsonb_build_object('success', true, 'duplicate', true, 'message', 'Event receipt already processed');
  END;

  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  IF v_updated_rows = 0 THEN
    RETURN pg_catalog.jsonb_build_object('success', true, 'duplicate', true, 'message', 'Event receipt already processed');
  END IF;

  IF v_status <> 'APPROVED' THEN
    IF v_reference NOT LIKE 'BAL_%' THEN
      BEGIN
        v_order_id := v_reference::UUID;
        UPDATE public.orders
        SET payment_status = 'declined',
            updated_at = pg_catalog.now()
        WHERE id = v_order_id
          AND payment_status <> 'approved'
          AND status NOT IN ('Cancelado', 'ARCHIVED_CANCELLED');

        UPDATE public.payment_intents
        SET status = v_status,
            reconciliation_status = 'RECONCILED_CALLBACK',
            provider_transaction_id = v_tx_id,
            updated_at = pg_catalog.now(),
            last_reconciled_at = pg_catalog.now()
        WHERE order_id = v_order_id
          AND status <> 'APPROVED';
      EXCEPTION WHEN OTHERS THEN
        -- If v_reference is not a valid UUID, ignore safely
      END;
    END IF;

    RETURN pg_catalog.jsonb_build_object('success', true, 'action', 'status_recorded', 'status', v_status);
  END IF;

  IF v_reference LIKE 'BAL_%' THEN
    v_match_user := (pg_catalog.regexp_match(v_reference, '^BAL_(user_[A-Za-z0-9_]+)_[0-9]+$'))[1];
    IF v_match_user IS NULL THEN
      RAISE EXCEPTION 'INVALID_BALANCE_REFERENCE: %', v_reference;
    END IF;

    SELECT * INTO v_intent
    FROM public.payment_intents
    WHERE (intent_id = v_reference OR provider_reference = v_reference)
    FOR UPDATE;

    IF FOUND THEN
      IF v_intent.status = 'APPROVED' THEN
        RETURN pg_catalog.jsonb_build_object('success', true, 'duplicate', true, 'message', 'Payment intent already approved');
      END IF;

      UPDATE public.payment_intents
      SET status = 'APPROVED',
          reconciliation_status = 'RECONCILED_CALLBACK',
          provider_transaction_id = v_tx_id,
          updated_at = pg_catalog.now(),
          last_reconciled_at = pg_catalog.now()
      WHERE id = v_intent.id;
    ELSE
      INSERT INTO public.payment_intents (
        intent_id, clerk_user_id, purpose, amount, currency, provider, status,
        reconciliation_status, provider_transaction_id, provider_reference, last_reconciled_at
      ) VALUES (
        v_reference, v_match_user, 'B2B_BALANCE', v_amount_numeric, v_currency, 'WOMPI', 'APPROVED',
        'RECONCILED_CALLBACK', v_tx_id, v_reference, pg_catalog.now()
      );
    END IF;

    UPDATE public.b2b_credit_profiles
    SET credit_balance = GREATEST(0, credit_balance - v_amount_numeric), updated_at = pg_catalog.now()
    WHERE user_id = v_match_user;

    RETURN pg_catalog.jsonb_build_object('success', true, 'action', 'balance_credited', 'user_id', v_match_user, 'amount', v_amount_numeric);

  ELSE
    BEGIN
      v_order_id := v_reference::UUID;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'INVALID_ORDER_UUID_REFERENCE: %', v_reference;
    END;

    SELECT * INTO v_order
    FROM public.orders
    WHERE id = v_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'ORDER_NOT_FOUND: %', v_order_id;
    END IF;

    IF v_order.status = 'Cancelado' OR v_order.status = 'ARCHIVED_CANCELLED' THEN
      RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'ORDER_ALREADY_CANCELLED', 'message', 'Cannot approve a cancelled order');
    END IF;

    IF v_order.payment_status = 'approved' THEN
      RETURN pg_catalog.jsonb_build_object('success', true, 'duplicate', true, 'message', 'Order already marked approved');
    END IF;

    IF v_order.total_amount IS DISTINCT FROM v_amount_numeric THEN
      RAISE EXCEPTION 'PAYMENT_AMOUNT_MISMATCH: order requires %, transaction paid %', v_order.total_amount, v_amount_numeric;
    END IF;

    UPDATE public.orders
    SET payment_status = 'approved',
        status = CASE WHEN status IN ('Pendiente', 'Pago Pendiente') THEN 'En Preparación' ELSE status END,
        payment_reference = v_tx_id,
        updated_at = pg_catalog.now()
    WHERE id = v_order_id;

    UPDATE public.payment_intents
    SET status = 'APPROVED',
        reconciliation_status = 'RECONCILED_CALLBACK',
        provider_transaction_id = v_tx_id,
        updated_at = pg_catalog.now(),
        last_reconciled_at = pg_catalog.now()
    WHERE order_id = v_order_id;

    RETURN pg_catalog.jsonb_build_object('success', true, 'action', 'order_approved', 'order_id', v_order_id);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.process_wompi_transaction(TEXT, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_wompi_transaction(TEXT, jsonb) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_wompi_transaction(TEXT, jsonb) TO service_role;
