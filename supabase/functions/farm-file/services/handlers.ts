import { Hono } from 'npm:hono@^4.12.5';
import { Farm, ImportResult } from './types.ts';
import { generateExcel, generateTimestamp, parseExcel } from './excel.ts';
import { matchHeaders, checkRequiredFields, identifyExtraFields } from './header-matching.ts';
import { validateFarms, processBooleanValue, processStringValue } from './validation.ts';
import { getAllFarms, batchInsertFarms, getColumnInfo } from './database.ts';
import { MAX_FILE_SIZE, MAX_IMPORT_RECORDS } from './constants.ts';
import { generatePresignedUrl, ALLOWED_MIME_TYPES } from './oss.ts';

/**
 * 导出养殖场数据为Excel文件
 * @param c Hono 上下文
 * @returns 响应
 */
export async function exportFarms(c: any) {
  try {
    // 从请求头获取JWT token
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    
    if (!token) {
      return c.json({
        success: false,
        message: '缺少认证token'
      }, 401);
    }
    
    // 获取所有养殖场数据
    const farms = await getAllFarms(token);
    
    // 生成Excel文件
    const excelData = generateExcel(farms);
    console.log('excelData', excelData);
    // 生成文件名
    const timestamp = generateTimestamp();
    const fileName = `Farm_Export_${timestamp}.xlsx`;
    
    // 设置响应头
    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    c.header('Content-Disposition', `attachment; filename="${fileName}"`);
    c.header('Content-Length', excelData.length);
    
    // 返回Excel文件
    return c.body(excelData);
  } catch (error) {
    console.error('导出失败:', error);
    return c.json({
      success: false,
      message: '导出失败',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
}

/**
 * 导入养殖场数据
 * @param c Hono 上下文
 * @returns 响应
 */
export async function importFarms(c: any) {
  try {
    // 获取上传的文件
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({
        success: false,
        message: '请上传Excel文件'
      }, 400);
    }
    
    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      return c.json({
        success: false,
        message: '文件大小不能超过10MB'
      }, 413);
    }
    
    // 检查文件类型
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return c.json({
        success: false,
        message: '只支持.xlsx和.xls格式的Excel文件'
      }, 415);
    }
    
    // 读取文件内容
    const buffer = await file.arrayBuffer();
    
    // 解析Excel文件
    const excelData = parseExcel(buffer);
    
    if (excelData.length < 2) {
      return c.json({
        success: false,
        message: 'Excel文件中没有数据'
      }, 400);
    }
    
    // 获取表头
    const headers = excelData[0] as string[];
    
    // 从请求头获取JWT token
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    
    if (!token) {
      return c.json({
        success: false,
        message: '缺少认证token'
      }, 401);
    }
    
    // 获取列信息
    const columns = await getColumnInfo(token);
    
    // 智能匹配表头
    const mappedHeaders = matchHeaders(headers, columns);
     
    // 检查是否缺少必要字段
    const missingFields = checkRequiredFields(mappedHeaders);
    if (missingFields.length > 0) {
    return c.json({
        success: false,
      message: `缺少必要字段：${missingFields.join(', ')}`
      }, 400);
    }
    
    // 识别多余字段
    const extraFields  = identifyExtraFields(headers, mappedHeaders);
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
    
    // 检查记录数限制
    if (farms.length > MAX_IMPORT_RECORDS) {
      return c.json({
        success: false,
      message: '单次导入最多支持1000条记录'
      }, 400);
    }
  
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
  } catch (error) { 
    console.error('导入失败:', error);
    return c.json({
      success: false,
      message: '导入失败',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
}

/**
 * 生成 OSS 上传预签名 URL
 * @param c Hono 上下文
 * @returns 响应
 */
export async function generateUploadUrl(c: any) {
  try {
    // 解析请求参数
    const { fileName, fileType } = await c.req.json();

    // 验证必填参数
    if (!fileName || !fileType) {
      return c.json({
        error: "fileName and fileType are required"
      }, 400);
    }

    // 验证文件类型
    if (!ALLOWED_MIME_TYPES.includes(fileType)) {
      return c.json({ 
        error: "File type not allowed",
        allowedTypes: ALLOWED_MIME_TYPES 
      }, 400);
    }

    // 生成预签名 URL
    const result = await generatePresignedUrl(fileName, fileType);

    // 返回响应
    return c.json({
      ...result,
      expires: 3600
    }, 200);
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return c.json({ 
      error: error instanceof Error ? error.message : "Internal server error"
    }, 500);
  }
}