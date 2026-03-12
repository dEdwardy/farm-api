import type { Context } from 'npm:hono@^4.12.5';

/**
 * 从请求头获取JWT token
 * @param c Hono 上下文
 * @returns token字符串
 */
export function getTokenFromHeader(c: Context): string {
  const authHeader = c.req.header('Authorization');
  return authHeader?.replace('Bearer ', '') || '';
}
