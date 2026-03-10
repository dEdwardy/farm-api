import { z } from 'npm:zod@^4.3.6';
import { Farm, ValidationError } from './types.ts';

// 养殖场数据验证schema - 只有farm_name为必填项
export const farmSchema = z.object({
  farm_name: z.string().min(1, '此字段为必填项'),
  address: z.string().optional(),
  responsible_person: z.string().optional(),
  contact_phone: z.string().optional(),
  pond_count: z.string().optional(),
  water_area_acre: z.string().optional(),
  farm_area_acre: z.string().optional(),
  other_water_area_sqm: z.string().optional(),
  other_farm_area_acre: z.string().optional(),
  avg_water_depth: z.string().optional(),
  main_species: z.string().optional(),
  farm_mode: z.string().optional(),
  operation_status: z.string().optional(),
  has_treatment_facility: z.boolean().optional(),
  treatment_method: z.string().optional(),
  treatment_facility_area: z.string().optional(),
  treated_discharge_volume: z.string().optional(),
  final_destination: z.string().optional(),
  longitude_latitude: z.string().optional(),
  output: z.string().optional(),
  output_value: z.string().optional(),
  total_investment: z.string().optional()
});

/**
 * 处理布尔值字段
 * @param value 原始值
 * @returns 处理后的布尔值
 */
export function processBooleanValue(value: any): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (typeof value === 'string') {
    const trimmedValue = value.trim().toLowerCase();
    return trimmedValue === '是' || trimmedValue === 'true' || trimmedValue === '1';
  }
  
  if (typeof value === 'number') {
    return value === 1;
  }
  
  return false;
}

/**
 * 处理字符串字段
 * @param value 原始值
 * @returns 处理后的字符串
 */
export function processStringValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  return String(value).trim();
}

/**
 * 验证养殖场数据
 * @param farm 养殖场数据
 * @param row 行号
 * @returns 验证错误列表
 */
export function validateFarm(farm: Partial<Farm>, row: number): ValidationError[] {
  const errors: ValidationError[] = [];
  
  try {
    farmSchema.parse(farm);
  } catch (error) {
    if (error instanceof z.ZodError) {
      (error.issues || []).forEach((zodError: z.ZodIssue) => {
        errors.push({
          row,
          field: zodError.path.join('.'),
          error: zodError.message
        });
      });
    }
  }
  
  return errors;
}

/**
 * 批量验证养殖场数据
 * @param farms 养殖场数据列表
 * @returns 验证结果
 */
export function validateFarms(farms: Partial<Farm>[]) {
  const validFarms: Farm[] = [];
  const errors: ValidationError[] = [];
  
  farms.forEach((farm, index) => {
    const rowErrors = validateFarm(farm, index + 2); // 行号从2开始（表头为1）
    
    if (rowErrors.length === 0) {
      // 处理字段类型
      const processedFarm: Farm = {
        ...farm,
        farm_name: processStringValue(farm.farm_name),
        address: processStringValue(farm.address),
        responsible_person: processStringValue(farm.responsible_person),
        contact_phone: processStringValue(farm.contact_phone),
        pond_count: processStringValue(farm.pond_count),
        water_area_acre: processStringValue(farm.water_area_acre),
        farm_area_acre: processStringValue(farm.farm_area_acre),
        other_water_area_sqm: processStringValue(farm.other_water_area_sqm),
        other_farm_area_acre: processStringValue(farm.other_farm_area_acre),
        avg_water_depth: processStringValue(farm.avg_water_depth),
        main_species: processStringValue(farm.main_species),
        farm_mode: processStringValue(farm.farm_mode),
        operation_status: processStringValue(farm.operation_status),
        has_treatment_facility: processBooleanValue(farm.has_treatment_facility),
        treatment_method: processStringValue(farm.treatment_method),
        treatment_facility_area: processStringValue(farm.treatment_facility_area),
        treated_discharge_volume: processStringValue(farm.treated_discharge_volume),
        final_destination: processStringValue(farm.final_destination),
        longitude_latitude: farm.longitude_latitude ? processStringValue(farm.longitude_latitude) : undefined,
        output: farm.output ? processStringValue(farm.output) : undefined,
        output_value: farm.output_value ? processStringValue(farm.output_value) : undefined,
        total_investment: farm.total_investment ? processStringValue(farm.total_investment) : undefined
      } as Farm;
      
      validFarms.push(processedFarm);
    } else {
      errors.push(...rowErrors);
    }
  });
  
  return { validFarms, errors };
}