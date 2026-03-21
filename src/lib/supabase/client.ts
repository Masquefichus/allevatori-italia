import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isConfigured =
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl !== "your-supabase-url" &&
  supabaseUrl.startsWith("http");

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (!isConfigured) {
    return null;
  }
  if (!client) {
    client = createBrowserClient<Database>(supabaseUrl!, supabaseKey!, {
      auth: {
        lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
          // Bypass the navigator.locks API to prevent "lock stolen" errors
          return await fn();
        },
      },
    });
  }
  return client;
}
