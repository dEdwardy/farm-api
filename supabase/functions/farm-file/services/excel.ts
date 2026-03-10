import * as XLSX from 'npm:xlsx@^0.18.5';
import { Farm } from './types.ts';
import { fieldToHeader } from './constants.ts';

/**
 * 生成Excel文件
 * @param farms 养殖场数据
 * @returns Excel文件的二进制数据
 */
export function generateExcel(farms: Farm[]): Uint8Array {
  // 准备表头
  const headers = Object.values(fieldToHeader);
  
  // 准备数据行
  const rows = farms.map(farm => {
    return Object.keys(fieldToHeader).map(field => {
      const value = (farm as any)[field];
      // 处理布尔值
      return typeof value === 'boolean' ? (value ? '是' : '否') : value;
    });
  });
  
  // 创建工作簿和工作表
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  
  // 将工作表添加到工作簿
  XLSX.utils.book_append_sheet(wb, ws, '养殖场数据');
  
  // 生成Excel文件
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

/**
 * 解析Excel文件
 * @param buffer Excel文件的二进制数据
 * @returns 解析后的数据
 */
export function parseExcel(buffer: ArrayBuffer): any[][] {
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { header: 1 });
}

/**
 * 生成时间戳函数
 * @returns 时间戳字符串
 */
export function generateTimestamp(): string {
  const now = new Date();
  return now.getFullYear().toString().padStart(4, '0') +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0');
}