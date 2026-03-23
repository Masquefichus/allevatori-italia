import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isConfigured =
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl !== "your-supabase-url" &&
  supabaseUrl.startsWith("http");

export function createClient() {
  if (!isConfigured) {
    return null;
  }
  return createBrowserClient<Database>(supabaseUrl!, supabaseKey!);
}
