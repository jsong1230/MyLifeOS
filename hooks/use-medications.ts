'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getToday } from '@/lib/date-utils'
import type { CreateMedicationInput, Medication, MedicationLog, MedicationWithLog } from '@/types/medication'

interface MedicationsResponse {
  success: boolean
  data: MedicationWithLog[]
  error?: string
}

// 활성 약 목록 + 오늘 복용 여부 조회
export function useMedications() {
  return useQuery<MedicationWithLog[]>({
    queryKey: ['medications'],
    queryFn: async () => {
      const res = await fetch('/api/health/medications')
      const json = await res.json() as MedicationsResponse
      if (!json.success) throw new Error(json.error ?? '복약 목록 조회 실패')
      return json.data
    },
  })
}

// 새 약 등록
export function useCreateMedication() {
  const queryClient = useQueryClient()

  return useMutation<Medication, Error, CreateMedicationInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/health/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as { success: boolean; data: Medication; error?: string }
      if (!json.success) throw new Error(json.error ?? '약 등록 실패')
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['medications'] })
    },
  })
}

// 약 정보 수정
export function useUpdateMedication() {
  const queryClient = useQueryClient()

  return useMutation<Medication, Error, { id: string } & Partial<CreateMedicationInput> & { is_active?: boolean }>({
    mutationFn: async ({ id, ...input }) => {
      const res = await fetch(`/api/health/medications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as { success: boolean; data: Medication; error?: string }
      if (!json.success) throw new Error(json.error ?? '약 수정 실패')
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['medications'] })
    },
  })
}

// 약 삭제
export function useDeleteMedication() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/health/medications/${id}`, { method: 'DELETE' })
      const json = await res.json() as { success: boolean; error?: string }
      if (!json.success) throw new Error(json.error ?? '약 삭제 실패')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['medications'] })
    },
  })
}

// 복용 체크/해제 토글
export function useToggleMedicationLog(medicationId: string, date?: string) {
  const queryClient = useQueryClient()
  const targetDate = date ?? getToday()

  const checkIn = useMutation<MedicationLog, Error, void>({
    mutationFn: async () => {
      const res = await fetch(`/api/health/medications/${medicationId}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: targetDate }),
      })
      const json = await res.json() as { success: boolean; data: MedicationLog; error?: string }
      if (!json.success) throw new Error(json.error ?? '복용 체크인 실패')
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['medications'] })
    },
  })

  const checkOut = useMutation<void, Error, void>({
    mutationFn: async () => {
      const res = await fetch(
        `/api/health/medications/${medicationId}/log?date=${targetDate}`,
        { method: 'DELETE' }
      )
      const json = await res.json() as { success: boolean; error?: string }
      if (!json.success) throw new Error(json.error ?? '복용 체크인 취소 실패')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['medications'] })
    },
  })

  return { checkIn, checkOut }
}
