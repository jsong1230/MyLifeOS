export type MedicationFrequency = 'daily' | 'weekly' | 'as_needed'

export interface Medication {
  id: string
  user_id: string
  name: string
  dosage: string | null
  frequency: MedicationFrequency
  times: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MedicationLog {
  id: string
  user_id: string
  medication_id: string
  date: string
  taken_at: string
  created_at: string
}

export interface CreateMedicationInput {
  name: string
  dosage?: string
  frequency?: MedicationFrequency
  times?: string[]
}

export interface MedicationWithLog extends Medication {
  taken_today: boolean
}
