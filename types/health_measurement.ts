export type MeasurementType = 'blood_pressure' | 'blood_sugar' | 'body_temp'

export interface HealthMeasurement {
  id: string
  user_id: string
  type: MeasurementType
  value: number
  value2: number | null
  unit: string
  measured_at: string
  note: string | null
  created_at: string
}

export interface CreateMeasurementInput {
  type: MeasurementType
  value: number
  value2?: number
  unit: string
  measured_at?: string
  note?: string
}
