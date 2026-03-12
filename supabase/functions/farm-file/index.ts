import { Hono, type Context } from 'npm:hono@^4.12.5';
import { exportFarms, importFarms, generateUploadUrl } from './services/handlers.ts';
import { jwtAuthMiddleware } from './services/middleware/auth.ts';
import { errorMiddleware } from './services/middleware/error.ts';
import { corsMiddleware } from './services/middleware/cors.ts';

// 创建Hono应用
const app = new Hono();

// 应用CORS中间件
app.use('*', corsMiddleware);

// 应用JWT验证中间件
app.use('*', jwtAuthMiddleware);

// 导出功能
app.post('/farm-file/export', exportFarms);

// 导入功能
app.post('/farm-file/import', importFarms);

// 预签名 URL 生成接口
app.post('/farm-file/sign-url', generateUploadUrl);

// 错误处理中间件
app.onError(errorMiddleware);

// Deno.serve 与 Supabase Edge Functions 要求的导出方式兼容
Deno.serve(app.fetch);