import { HeaderMap, ColumnInfo } from './types.ts';
import { requiredFields } from './constants.ts';

/**
 * 智能匹配表头
 * @param excelHeaders Excel中的表头
 * @param columns 数据库表列信息
 * @returns 表头映射
 */
export function matchHeaders(excelHeaders: string[], columns: ColumnInfo[]): HeaderMap {
  // 创建列description到列名的映射
  const descriptionToFieldMap: Record<string, string> = {};
  columns.forEach(column => {
    if (column.description) {
      descriptionToFieldMap[column.description] = column.name;
    }
  });
  
  const mappedHeaders: HeaderMap = {};
  const availableDescriptions = new Set(Object.keys(descriptionToFieldMap));
  
  // 首先尝试精确匹配
  excelHeaders.forEach((header, index) => {
    const trimmedHeader = header.trim();
    if (descriptionToFieldMap[trimmedHeader]) {
      mappedHeaders[trimmedHeader] = descriptionToFieldMap[trimmedHeader];
      availableDescriptions.delete(trimmedHeader);
    }
  });
  
  // 然后尝试模糊匹配
  excelHeaders.forEach((header, index) => {
    const trimmedHeader = header.trim();
    if (!mappedHeaders[trimmedHeader]) {
      let bestMatch = '';
      let bestScore = 0;
      
      Array.from(availableDescriptions).forEach(description => {
        const score = calculateSimilarity(trimmedHeader, description);
        if (score > bestScore && score > 0.6) { // 相似度阈值
          bestScore = score;
          bestMatch = description;
        }
      });
      
      if (bestMatch) {
        mappedHeaders[trimmedHeader] = descriptionToFieldMap[bestMatch];
        availableDescriptions.delete(bestMatch);
      }
    }
  });
  
  return mappedHeaders;
}

/**
 * 检查是否缺少必要字段
 * @param mappedHeaders 已映射的表头
 * @returns 缺少的字段列表
 */
export function checkRequiredFields(mappedHeaders: HeaderMap): string[] {
  const mappedFields = Object.values(mappedHeaders);
  return requiredFields.filter(field => !mappedFields.includes(field));
}

/**
 * 识别多余字段
 * @param excelHeaders Excel中的表头
 * @param mappedHeaders 已映射的表头
 * @returns 多余字段列表
 */
export function identifyExtraFields(excelHeaders: string[], mappedHeaders: HeaderMap): string[] {
  return excelHeaders.filter(header => !mappedHeaders[header.trim()]);
}

// 简单的字符串相似度算法
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  const longerLength = longer.length;
  
  if (longerLength === 0) return 1.0;
  
  return (longerLength - editDistance(longer, shorter)) / longerLength;
}

// 编辑距离算法
function editDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j - 1][i] + 1,
        matrix[j][i - 1] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}