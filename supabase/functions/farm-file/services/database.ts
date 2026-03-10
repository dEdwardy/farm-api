import { createClient } from "npm:@supabase/supabase-js@^2.39.0";
import { Farm } from './types.ts';
import { columnComments } from './constants.ts';
import { ColumnInfo } from './types.ts';

/**
 * 创建 Supabase 客户端
 * @param token JWT token
 * @returns Supabase 客户端
 */
export function createSupabaseClient(token: string) {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  );
}

/**
 * 将空字符串转为null，用于数据库插入
 * @param value 原始值
 * @returns 处理后的值
 */
function emptyToNull(value: string | undefined | null): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  return value;
}

/**
 * 转换农场数据用于数据库插入 - 空字符串转为null
 * @param farm 原始农场数据
 * @returns 转换后的数据
 */
function transformFarmForInsert(farm: Farm): Record<string, unknown> {
  return {
    farm_name: farm.farm_name,
    address: emptyToNull(farm.address),
    responsible_person: emptyToNull(farm.responsible_person),
    contact_phone: emptyToNull(farm.contact_phone),
    pond_count: emptyToNull(farm.pond_count),
    water_area_acre: emptyToNull(farm.water_area_acre),
    farm_area_acre: emptyToNull(farm.farm_area_acre),
    other_water_area_sqm: emptyToNull(farm.other_water_area_sqm),
    other_farm_area_acre: emptyToNull(farm.other_farm_area_acre),
    avg_water_depth: emptyToNull(farm.avg_water_depth),
    main_species: emptyToNull(farm.main_species),
    farm_mode: emptyToNull(farm.farm_mode),
    operation_status: emptyToNull(farm.operation_status),
    has_treatment_facility: farm.has_treatment_facility,
    treatment_method: emptyToNull(farm.treatment_method),
    treatment_facility_area: emptyToNull(farm.treatment_facility_area),
    treated_discharge_volume: emptyToNull(farm.treated_discharge_volume),
    final_destination: emptyToNull(farm.final_destination),
    longitude_latitude: emptyToNull(farm.longitude_latitude),
    output: emptyToNull(farm.output),
    output_value: emptyToNull(farm.output_value),
    total_investment: emptyToNull(farm.total_investment)
  };
}

/**
 * 获取所有养殖场数据
 * @param token JWT token
 * @returns 养殖场数据列表
 */
export async function getAllFarms(token: string) {
  const supabase = createSupabaseClient(token);
  
  const { data, error } = await supabase
    .from('aquaculture_farms')
    .select('*')
    .is('deleted_at', null);
  
  if (error) {
    throw new Error(`查询数据失败: ${error.message}`);
  }
  
  return data as Farm[];
}

/**
 * 批量插入养殖场数据
 * @param farms 养殖场数据列表
 * @param token JWT token
 * @returns 插入成功的记录数
 */
export async function batchInsertFarms(farms: Farm[], token: string) {
  const supabase = createSupabaseClient(token);
  
  // 转换数据：空字符串转为null
  const transformedFarms = farms.map(transformFarmForInsert);
  
  const { data, error } = await supabase
    .from('aquaculture_farms')
    .insert(transformedFarms)
    .select();
  
  if (error) {
    throw new Error(`插入数据失败: ${error.message}`);
  }
  
  return data.length;
}

/**
 * 获取列信息
 * @param token JWT token
 * @returns 列信息列表
 */
export async function getColumnInfo(token: string): Promise<ColumnInfo[]> {
  // 由于无法直接从数据库获取列注释，我们使用硬编码的列注释映射
  // 在实际项目中，可以考虑从数据库元数据中获取
  return Object.keys(columnComments).map(columnName => ({
    name: columnName,
    description: columnComments[columnName]
  }));
}