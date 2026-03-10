// 类型定义
export interface Farm {
  id?: string;
  farm_name: string;
  address: string;
  responsible_person: string;
  contact_phone: string;
  pond_count: string;
  water_area_acre: string;
  farm_area_acre: string;
  other_water_area_sqm: string;
  other_farm_area_acre: string;
  avg_water_depth: string;
  main_species: string;
  farm_mode: string;
  operation_status: string;
  has_treatment_facility: boolean;
  treatment_method: string;
  treatment_facility_area: string;
  treated_discharge_volume: string;
  final_destination: string;
  longitude_latitude?: string;
  output?: string;
  output_value?: string;
  total_investment?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface ImportResult {
  success: boolean;
  message: string;
  data: {
    total: number;
    successCount: number;
    failCount: number;
    errors: Array<{
      row: number;
      field: string;
      error: string;
    }>;
    warnings: string[];
  };
}

export interface HeaderMap {
  [key: string]: string;
}

export interface ValidationError {
  row: number;
  field: string;
  error: string;
}

export interface ColumnInfo {
  name: string;
  description: string;
}