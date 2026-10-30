import 'server-only';
import { timingSafeEqual } from 'node:crypto';
export function requireScheduler(req: Request): void {
 const secret = process.env.CRON_SECRET;
 const supplied = req.headers.get('authorization');
 if (!secret || secret.length < 32 || !supplied) throw new Error('SCHEDULER_UNAUTHORIZED');
 const expected = Buffer.from('Bearer ' + secret), actual = Buffer.from(supplied);
 if (actual.length !== expected.length || !timingSafeEqual(actual,expected)) throw new Error('SCHEDULER_UNAUTHORIZED');
}
