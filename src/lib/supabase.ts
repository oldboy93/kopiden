import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    lock: async (name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
      if (typeof navigator === 'undefined' || !navigator.locks) {
        return await fn();
      }
      try {
        // Use ifAvailable so we never block — if lock is taken, run fn anyway
        return await navigator.locks.request(name, { mode: 'exclusive', ifAvailable: true }, async (lock) => {
          // lock is null if another tab holds it — still run fn to avoid hanging
          return await fn();
        });
      } catch (e: any) {
        // Fallback: run fn directly on any lock error (AbortError, TimeoutError, etc.)
        if (e?.name === 'AbortError' || e?.name === 'TimeoutError') return await fn();
        throw e;
      }
    }
  }
})

