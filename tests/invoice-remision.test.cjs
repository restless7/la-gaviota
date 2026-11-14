const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const invoicePagePath = path.resolve(__dirname, '../app/admin/orders/invoice/[id]/page.tsx');
const invoiceClientPath = path.resolve(__dirname, '../app/admin/orders/invoice/[id]/InvoiceClientView.tsx');

test('Invoice & Remission: Server Page awaits async params Promise', () => {
  assert(fs.existsSync(invoicePagePath), 'invoice/page.tsx must exist');
  const content = fs.readFileSync(invoicePagePath, 'utf8');

  // Must accept Promise<{ id: string }>
  assert(
    content.includes('Promise<{ id: string }>'),
    'InvoicePage must accept params as a Promise for Next.js 15/16'
  );
  assert(
    content.includes('await props.params'),
    'InvoicePage must await props.params before using id'
  );
  assert(
    !content.startsWith('"use client"') && !content.startsWith("'use client'"),
    'InvoicePage should be a Server Component to avoid client-side buffering stalls'
  );
  assert(
    content.includes('try') && content.includes('catch'),
    'InvoicePage must wrap order fetch in try/catch to prevent unhandled rejection'
  );
});

test('Invoice & Remission: InvoiceClientView handles loading, errors and print safely', () => {
  assert(fs.existsSync(invoiceClientPath), 'InvoiceClientView.tsx must exist');
  const content = fs.readFileSync(invoiceClientPath, 'utf8');

  assert(content.includes("'use client'"), 'InvoiceClientView must be a client component');
  assert(
    content.includes('window.print()'),
    'InvoiceClientView must have window.print() trigger for physical receipt'
  );
  assert(
    content.includes('finally'),
    'InvoiceClientView must set loading to false in finally to prevent buffering stall'
  );
  assert(
    content.includes('discount_amount'),
    'InvoiceClientView must support promotional discount breakdown'
  );
  assert(
    content.includes('Reintentar Cargar'),
    'InvoiceClientView must provide user-facing retry button'
  );
  assert(
    content.includes('Remisión Física'),
    'InvoiceClientView must include physical delivery sign-off boxes'
  );
});
