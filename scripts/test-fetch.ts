import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../.env.local') });
import { fetchProducts } from '../src/actions/products';

fetchProducts().then(products => {
  console.log('Total products:', products.length);
  console.log('First product ID:', products[0].id);
}).catch(console.error);
