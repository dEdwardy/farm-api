import type { Context } from 'npm:hono@^4.12.5';
import { z } from 'npm:zod@^4.3.6';
import { Farm, ImportResult } from './types.ts';
import { generateExcel, generateTimestamp, parseExcel } from './excel.ts';
import { matchHeaders, checkRequiredFields, identifyExtraFields } from './header-matching.ts';
import { validateFarms, processBooleanValue, processStringValue } from './validation.ts';
import { getAllFarms, batchInsertFarms, getColumnInfo } from './database.ts';
import { MAX_FILE_SIZE, MAX_IMPORT_RECORDS } from './constants.ts';
import { generatePresignedUrl, ALLOWED_MIME_TYPES } from './oss.ts';
import { withErrorHandling } from './middleware/error.ts';
import { getTokenFromHeader } from './utils.ts';

/**
 * 创建统一的错误响应
 * @param c Hono 上下文
 * @param status 状态码
 * @param message 错误信息
 * @param error 详细错误信息
 * @returns 错误响应
 */
function createErrorResponse(c: Context, status: 400 | 401 | 413 | 415 | 500, message: string, error?: string) {
  return c.json({
    success: false,
    message,
    error
  }, status);
}



/**
 * 导出养殖场数据为Excel文件
 * @param c Hono 上下文
 * @returns 响应
 */



// 导出请求参数验证schema
const exportSchema = z.object({
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(0).optional().default(0)
});

export const exportFarms = withErrorHandling(async function exportFarms(c: Context) {
  // 获取JWT token（由中间件验证，这里只获取用于数据库操作）
  const token = getTokenFromHeader(c);
  
  // 验证请求体格式，支持空请求体（默认全量导出）
  const body = await c.req.json().catch(() => ({}));
  
  // 使用zod验证请求参数，获取默认值
  const { page, limit } = exportSchema.parse(body);
  
  // 为导出功能设置默认限制，防止内存溢出
  // 当limit=0时，保持无限制导出
  const exportLimit = limit > 0 ? Math.min(limit, 1000) : 0;
  
  // 获取养殖场数据
  const farms = await getAllFarms(token, page, exportLimit);
  
  // 生成Excel文件
  const excelData = generateExcel(farms);
  
  // 生成文件名
  const timestamp = generateTimestamp();
  const fileName = `Farm_Export_${timestamp}.xlsx`;
  
  // 设置响应头
  c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  c.header('Content-Disposition', `attachment; filename="${fileName}"`);
  c.header('Content-Length', String(excelData.byteLength));
  c.header('Cache-Control', 'no-store');
  // 返回Excel文件
  return c.body(excelData as any);
});

/**
 * 导入养殖场数据
 * @param c Hono 上下文
 * @returns 响应
 */
export const importFarms = withErrorHandling(async function importFarms(c: Context) {
  // 获取JWT token（由中间件验证，这里只获取用于数据库操作）
  const token = getTokenFromHeader(c);
  
  // 获取上传的文件
  const formData = await c.req.formData();
  const file = formData.get('file') as File;
  
  if (!file) {
    return createErrorResponse(c, 400, '请上传Excel文件');
  }
  
  // 检查文件大小
  if (file.size > MAX_FILE_SIZE) {
    return createErrorResponse(c, 413, '文件大小不能超过10MB');
  }
  
  // 检查文件类型
  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
    return createErrorResponse(c, 415, '只支持.xlsx和.xls格式的Excel文件');
  }
  
  // 读取文件内容
  const buffer = await file.arrayBuffer();
  
  // 解析Excel文件
  const excelData = parseExcel(buffer);
  
  if (excelData.length < 2) {
    return createErrorResponse(c, 400, 'Excel文件中没有数据');
  }
  
  // 检查记录数限制（提前检查，避免不必要的处理）
  if (excelData.length - 1 > MAX_IMPORT_RECORDS) {
    return createErrorResponse(c, 400, '单次导入最多支持1000条记录');
  }
  
  // 获取表头
  const headers = excelData[0] as string[];
  
  // 获取列信息
  const columns = getColumnInfo();
  
  // 智能匹配表头
  const mappedHeaders = matchHeaders(headers, columns);
   
  // 检查是否缺少必要字段
  const missingFields = checkRequiredFields(mappedHeaders);
  if (missingFields.length > 0) {
    return createErrorResponse(c, 400, `缺少必要字段：${missingFields.join(', ')}`);
  }
  
  // 识别多余字段
  const extraFields = identifyExtraFields(headers, mappedHeaders);
  const warnings = extraFields.map(field => `忽略多余字段：${field}`);

  // 解析数据
  const dataRows = excelData.slice(1);
  const farms: Partial<Farm>[] = [];

  dataRows.forEach((row, index) => {
    const farm: Partial<Farm> = {};
    
    headers.forEach((header, colIndex) => {
      const field = mappedHeaders[header.trim()];
      if (field) {
        const value = row[colIndex];
        
        // 处理字段类型
        if (field === 'has_treatment_facility') {
          (farm as any)[field] = processBooleanValue(value);
        } else {
          (farm as any)[field] = processStringValue(value);
        }
      }
    });
    
    farms.push(farm);
  });
   
  // 验证数据
  const { validFarms, errors } = validateFarms(farms);

  // 批量插入数据
  let successCount = 0;
  if (validFarms.length > 0) {
    successCount = await batchInsertFarms(validFarms, token);
  }
  
  // 构建导入结果
  const result: ImportResult = {
    success: errors.length === 0,
    message: errors.length === 0 ? '导入成功' : '部分数据导入失败',
    data: {
      total: farms.length,
      successCount,
      failCount: errors.length,
      errors,
      warnings
    }
  };
  
  return c.json(result, 200);
});

/**
 * 生成 OSS 上传预签名 URL
 * @param c Hono 上下文
 * @returns 响应
 */
// 生成预签名URL请求参数验证schema
const generateUploadUrlSchema = z.object({
  fileName: z.string().min(1, 'fileName必须是非空字符串').max(255, 'fileName长度不能超过255个字符'),
  fileType: z.string().min(1, 'fileType必须是非空字符串')
});

export const generateUploadUrl = withErrorHandling(async function generateUploadUrl(c: Context) {
  // 解析请求参数
  const body = await c.req.json();
  
  // 使用zod验证请求参数
  const { fileName, fileType } = generateUploadUrlSchema.parse(body);

  // 验证文件类型
  if (!ALLOWED_MIME_TYPES.includes(fileType)) {
    return createErrorResponse(c, 400, `文件类型不允许，支持的类型：${ALLOWED_MIME_TYPES.join(', ')}`);
  }

  // 生成预签名 URL
  const result = await generatePresignedUrl(fileName, fileType);

  // 返回响应
  return c.json({
    ...result,
    expires: 3600
  }, 200);
});