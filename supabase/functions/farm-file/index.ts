import { Hono } from 'npm:hono@^4.12.5';
import { corsHeaders } from 'npm:@supabase/supabase-js@^2.39.0/cors';
import { exportFarms, importFarms, generateUploadUrl } from './services/handlers.ts';
import { jwtAuthMiddleware } from './services/middleware/auth.ts';

// 创建Hono应用
const app = new Hono();
// 不支持basePath 会导致404 所以这里不使用basePath
// app.basePath('/farm-file');
// 应用CORS中间件
app.use('*', async (c, next) => {
  // 设置CORS头
  Object.entries(corsHeaders).forEach(([key, value]) => {
    c.header(key, value);
  });
  
  // 处理预检请求
  if (c.req.method === 'OPTIONS') {
    return c.newResponse('', 204);
  }
  
  await next();
});
// TODO:前段对接 以及重构 参数校验等
// 应用JWT验证中间件
app.use('*', jwtAuthMiddleware);

// 导出功能
app.post('/farm-file/export', exportFarms);

// 导入功能
app.post('/farm-file/import', importFarms);

// 预签名 URL 生成接口
app.post('/farm-file/sign-url', generateUploadUrl);

// 错误处理中间件
app.onError((err: Error, c: any) => {
  console.error(`${err}`);
  return c.json({
    success: false,
    message: '服务器内部错误',
    error: err.message
  }, 500);
});

// Deno.serve 与 Supabase Edge Functions 要求的导出方式兼容
Deno.serve(app.fetch);
