import type { Context } from 'npm:hono@^4.12.5';
import { createClient } from "npm:@supabase/supabase-js@^2.39.0";
import { getTokenFromHeader } from '../utils.ts';

/**
 * JWT 验证中间件
 * @param c Hono 上下文
 * @param next 下一个中间件
 * @returns 响应
 */
export async function jwtAuthMiddleware (c: Context, next: () => Promise<void>) {
  try {
    const token = getTokenFromHeader(c);
    if (!token) {
      return c.json({ error: "Authorization header is required" }, 401);
    }
    
    // 创建带有 token 的 Supabase 客户端
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    // 验证 JWT
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.error('JWT 验证错误:', error);
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    await next();
  } catch (error) {
    console.error('JWT 验证过程中出错误:', error);
    return c.json({ error: "Invalid or expired token" }, 401);
  }
}