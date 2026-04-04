import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isConfigured =
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl !== "your-supabase-url" &&
  supabaseUrl.startsWith("http");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: ReturnType<typeof createBrowserClient<any>> | null = null;

export function createClient() {
  if (!isConfigured) {
    return null;
  }
  if (!client) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client = createBrowserClient<any>(supabaseUrl!, supabaseKey!, {
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
