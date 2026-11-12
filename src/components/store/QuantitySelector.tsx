'use client';

import { useRef, useSyncExternalStore } from 'react';

const subscribeHydration = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

interface QuantitySelectorProps {
  quantity: number;
  productName: string;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
  maxReached?: boolean;
}

/** Controlled by the shared cart. Deltas are applied against the latest cart state. */
export function QuantitySelector({ quantity, productName, onIncrement, onDecrement, disabled = false, maxReached = false }: QuantitySelectorProps) {
  const addRef = useRef<HTMLButtonElement>(null);
  // Match SSR disabled markup first, then apply client readiness
  const hydrated = useSyncExternalStore(subscribeHydration, clientSnapshot, serverSnapshot);
  const controlsDisabled = disabled || !hydrated;

  return (
    <div
      role="group"
      aria-label={`Cantidad de ${productName}`}
      className="inline-flex min-h-11 max-w-full items-center rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-150 motion-reduce:transition-none"
      onClick={event => event.stopPropagation()}
      onPointerDown={event => event.stopPropagation()}
    >
      {quantity > 0 ? (
        <>
          <button
            key="btn-dec"
            type="button"
            disabled={controlsDisabled}
            aria-label={`Disminuir cantidad de ${productName}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-l-xl text-xl font-bold text-slate-700 transition-colors duration-150 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-40 motion-reduce:transition-none active:scale-95"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              onDecrement();
              if (quantity <= 1) {
                queueMicrotask(() => addRef.current?.focus());
              }
            }}
          >
            −
          </button>
          <output
            key="output-qty"
            aria-live="polite"
            aria-atomic="true"
            className="min-w-8 px-2 text-center text-sm font-bold tabular-nums text-slate-900"
          >
            {quantity}
          </output>
          <button
            key="btn-inc"
            type="button"
            disabled={controlsDisabled || maxReached}
            aria-label={`Aumentar cantidad de ${productName}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-r-xl text-xl font-bold text-red-700 transition-colors duration-150 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-40 motion-reduce:transition-none active:scale-95"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              onIncrement();
            }}
          >
            +
          </button>
        </>
      ) : (
        <button
          ref={addRef}
          key="btn-add"
          type="button"
          disabled={controlsDisabled}
          aria-label={`Agregar ${productName}`}
          className="flex min-h-11 shrink-0 items-center justify-center rounded-xl px-5 text-sm font-bold text-red-700 transition-colors duration-150 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-40 motion-reduce:transition-none active:scale-95"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            onIncrement();
          }}
        >
          Agregar
        </button>
      )}
    </div>
  );
}
