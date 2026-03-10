// 数据库字段与中文表头的映射
export const fieldToHeader = {
  farm_name: '养殖场(业主)名称',
  address: '详细地址',
  responsible_person: '负责人',
  contact_phone: '联系电话',
  pond_count: '池塘口数',
  water_area_acre: '养殖水面面积(亩)',
  farm_area_acre: '养殖场占地面积(亩)',
  other_water_area_sqm: '其它养殖水面面积(平方米)',
  other_farm_area_acre: '其它养殖占地面积(亩)',
  avg_water_depth: '平均水深(米)',
  main_species: '主养品种',
  farm_mode: '养殖模式',
  operation_status: '生产运行情况',
  has_treatment_facility: '有无尾水处理设施',
  treatment_method: '尾水处理方式',
  treatment_facility_area: '尾水处理设施面积(亩)',
  treated_discharge_volume: '已完成尾水治理排放量(吨)',
  final_destination: '养殖尾水最终去向',
  longitude_latitude: '经纬度',
  output: '总产量（吨）',
  output_value: '年总产值（万元）',
  total_investment: '年总投入（万元）'
};

// 中文表头与数据库字段的映射
export const headerToField: Record<string, string> = Object.fromEntries(
  Object.entries(fieldToHeader).map(([key, value]) => [value, key])
);

// 列注释映射
export const columnComments: Record<string, string> = {
  farm_name: '养殖场( 业主)名称',
  address: '详细地址',
  responsible_person: '负责人',
  contact_phone: '联系电话',
  pond_count: '池塘口数',
  water_area_acre: '养殖水面面积(亩)',
  farm_area_acre: '养殖场占地面积(亩)',
  other_water_area_sqm: '其它养殖水面面积(平方米)',
  other_farm_area_acre: '其它养殖占地面积(亩)',
  avg_water_depth: '平均水深(米)',
  main_species: '主养品种',
  farm_mode: '养殖模式',
  operation_status: '生产运行情况',
  has_treatment_facility: '有无尾水处理设施',
  treatment_method: '尾水处理方式',
  treatment_facility_area: '尾水处理设施面积(亩)',
  treated_discharge_volume: '已完成尾水治理排放量(吨)',
  final_destination: '养殖尾水最终去向',
  longitude_latitude: '经纬度',
  output: '总产量（吨）',
  output_value: '年总产值（万元）',
  total_investment: '年总投入（万元）'
};

// 必要字段列表
export const requiredFields = [
  'farm_name',
  'address',
  'responsible_person',
  'contact_phone',
  'pond_count',
  'water_area_acre',
  'farm_area_acre',
  'other_water_area_sqm',
  'other_farm_area_acre',
  'avg_water_depth',
  'main_species',
  'farm_mode',
  'operation_status',
  'has_treatment_facility',
  'treatment_method',
  'treatment_facility_area',
  'treated_discharge_volume',
  'final_destination'
];

// 文件大小限制（10MB）
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// 单次导入最大记录数
export const MAX_IMPORT_RECORDS = 1000;