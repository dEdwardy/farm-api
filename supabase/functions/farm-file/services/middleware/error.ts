import type { Context } from 'npm:hono@^4.12.5';

/**
 * 统一错误处理函数
 * @param err 错误对象
 * @param c Hono 上下文
 * @returns 错误响应
 */
export function handleError(err: any, c: Context) {
  console.error('Error:', err);
  
  // 处理不同类型的错误
  if (err.name === 'ZodError' && err.issues) {
    // 处理Zod验证错误
    const errorMessages = err.issues.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`);
    return c.json({
      success: false,
      message: '参数验证失败',
      error: errorMessages.join(', ')
    }, 400);
  } else if (err.status) {
    // 处理HTTP错误
    return c.json({
      success: false,
      message: err.message || '请求失败',
      error: err.error || String(err)
    }, err.status);
  } else {
    // 处理内部错误
    return c.json({
      success: false,
      message: '服务器内部错误',
      error: err.message || String(err)
    }, 500);
  }
}

/**
 * 错误处理中间件
 * @param err 错误对象
 * @param c Hono 上下文
 * @returns 错误响应
 */
export function errorMiddleware(err: any, c: Context) {
  return handleError(err, c);
}

/**
 * 包装异步处理函数，统一处理错误
 * @param handler 处理函数
 * @returns 包装后的处理函数
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(handler: T) {
  return async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error: any) {
      const c = args[0] as Context;
      console.error('处理请求时出错:', error);
      return handleError(error, c);
    }
  };
}