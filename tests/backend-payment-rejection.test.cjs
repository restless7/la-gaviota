const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

function loadModule(relative, stubs = {}, env = {}) {
  const filename = path.join(root, relative);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
  }).outputText;
  const module = { exports: {} };

  const customRequire = (id) => {
    if (Object.hasOwn(stubs, id)) return stubs[id];
    if (id === 'server-only') return {};
    if (id === 'next/cache') return { revalidatePath: () => {} };
    if (id === 'crypto' || id === 'node:crypto') return require('crypto');
    if (id === '@/src/lib/checkoutValidation' || id.endsWith('checkoutValidation')) {
      return loadModule('src/lib/checkoutValidation.ts', stubs, env);
    }
    if (id === '@/src/lib/idempotency' || id.endsWith('idempotency')) {
      return loadModule('src/lib/idempotency.ts', stubs, env);
    }
    if (id === '@/src/lib/wompi' || id.endsWith('wompi')) {
      return loadModule('src/lib/wompi.ts', stubs, env);
    }
    if (id === './safetyGuard' || id.endsWith('safetyGuard')) {
      return loadModule('src/lib/safetyGuard.ts', stubs, env);
    }
    if (id === './authorization' || id.endsWith('authorization')) {
      return {
        requireOwnedSubject: async (uid) => ({ userId: uid, role: 'USER', tier: 'Personas Naturales' }),
        getActor: async () => ({ userId: 'user_owner', role: 'USER', tier: 'Personas Naturales' }),
        assertIssuedActor: () => {}
      };
    }
    if (id === './database' || id.endsWith('database')) {
      return {
        getServerDatabase: () => ({ rpc: async () => ({ data: { success: true, order_id: 'ord_123' } }) }),
        readPublicInventoryFlag: async () => ({ track_inventory: false })
      };
    }
    if (id === './checkout' || id.endsWith('checkout')) {
      return {
        prepareCheckout: async () => ({
          userId: 'user_owner',
          totalAmount: 60000,
          details: { firstName: 'Ana', lastName: 'Prueba', email: 'ana@example.com', phone: '3000000', city: 'Bucaramanga', fullAddress: 'Calle 10', notes: '' },
          orderItems: [{ product_id: 'prd_0001', quantity: 2, price_at_purchase: 30000 }]
        })
      };
    }
    if (id === '@/src/lib/server/orderWriter' || id.endsWith('orderWriter')) {
      return loadModule('src/lib/server/orderWriter.ts', stubs, env);
    }
    if (id === '@clerk/nextjs/server') {
      return {
        clerkClient: async () => ({
          users: {
            getUser: async (uid) => ({ id: uid, emailAddresses: [{ emailAddress: 'test@example.com' }], firstName: 'Test', lastName: 'User' })
          }
        })
      };
    }
    throw new Error(`Unmocked dependency in test: ${id}`);
  };

  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: customRequire,
    Map, Set, Buffer, FormData, Date, console, process: { env }
  }, { filename });

  return module.exports;
}

test('BACKEND-PAYMENT: createOrder rejects payment_method=wompi when online payments are disabled', async () => {
  const env = { APP_ENV: 'production' };
  delete env.ENABLE_ONLINE_PAYMENTS;
  const { createOrder } = loadModule('src/lib/server/orderWriter.ts', {}, env);

  await assert.rejects(
    async () => {
      await createOrder({
        clerk_user_id: 'user_owner',
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        customer_phone: '3001234567',
        delivery_address: 'Calle 10 # 20-30',
        delivery_municipality: 'Bucaramanga',
        total_amount: 60000,
        status: 'Pendiente',
        payment_method: 'wompi' // CRAFTED ATTACK
      }, [
        { product_id: 'prd_0001', quantity: 2, price_at_purchase: 30000 }
      ]);
    },
    /PAYMENT_METHOD_DISABLED.*desactivados en el backend/
  );
});

test('BACKEND-PAYMENT: createOrder rejects arbitrary electronic payment methods (e.g. credit_card, pse)', async () => {
  const env = { APP_ENV: 'production' };
  delete env.ENABLE_ONLINE_PAYMENTS;
  const { createOrder } = loadModule('src/lib/server/orderWriter.ts', {}, env);

  await assert.rejects(
    async () => {
      await createOrder({
        clerk_user_id: 'user_owner',
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        customer_phone: '3001234567',
        delivery_address: 'Calle 10 # 20-30',
        delivery_municipality: 'Bucaramanga',
        total_amount: 60000,
        status: 'Pendiente',
        payment_method: 'credit_card' // FORBIDDEN METHOD
      }, [
        { product_id: 'prd_0001', quantity: 2, price_at_purchase: 30000 }
      ]);
    },
    /PAYMENT_METHOD_DISABLED/
  );
});

test('BACKEND-PAYMENT: initializeWompiTransaction fails closed when online payments are disabled', async () => {
  const env = { APP_ENV: 'production' };
  delete env.ENABLE_ONLINE_PAYMENTS;
  const { initializeWompiTransaction } = loadModule('src/actions/wompi.ts', {}, env);

  await assert.rejects(
    async () => {
      const formData = new Map();
      await initializeWompiTransaction(formData, [], 50000);
    },
    /ELECTRONIC_PAYMENTS_DISABLED.*desactivados en el backend/
  );
});

test('BACKEND-PAYMENT: initializeWompiBalancePayment fails closed when online payments are disabled', async () => {
  const env = { APP_ENV: 'production' };
  delete env.ENABLE_ONLINE_PAYMENTS;
  const { initializeWompiBalancePayment } = loadModule('src/actions/wompi.ts', {}, env);

  await assert.rejects(
    async () => {
      await initializeWompiBalancePayment(100000);
    },
    /ELECTRONIC_PAYMENTS_DISABLED/
  );
});
