import type { Context } from 'npm:hono@^4.12.5';
import { corsHeaders } from 'npm:@supabase/supabase-js@^2.39.0/cors';

/**
 * CORS 中间件
 * @param c Hono 上下文
 * @param next 下一个中间件
 * @returns 响应
 */
export async function corsMiddleware(c: Context, next: () => Promise<void>) {
  // 设置CORS头
  Object.entries(corsHeaders).forEach(([key, value]) => {
    c.header(key, value);
  });
  
  // 处理预检请求
  if (c.req.method === 'OPTIONS') {
    return c.newResponse(null, 204);
  }
  
  await next();
}