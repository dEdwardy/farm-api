import { createClient } from "npm:@supabase/supabase-js@^2.39.0";

// 从环境变量中读取配置信息
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY are required environment variables");
}

// 创建 Supabase 客户端
export const createSupabaseClient = (token?: string) => {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }
  });
};