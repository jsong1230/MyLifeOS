'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateMeasurementInput, HealthMeasurement, MeasurementType } from '@/types/health_measurement'

interface MeasurementsResponse {
  success: boolean
  data: HealthMeasurement[]
  error?: string
}

// 측정 기록 목록 조회 훅
export function useMeasurements(type: MeasurementType, days: number = 30) {
  return useQuery<MeasurementsResponse>({
    queryKey: ['measurements', type, days],
    queryFn: async () => {
      const res = await fetch(`/api/health/measurements?type=${type}&days=${days}`)
      const json = await res.json() as MeasurementsResponse
      if (!json.success) throw new Error(json.error ?? '측정 기록 조회 실패')
      return json
    },
  })
}

// 측정 기록 추가 훅
export function useAddMeasurement() {
  const queryClient = useQueryClient()

  return useMutation<HealthMeasurement, Error, CreateMeasurementInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/health/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as { success: boolean; data: HealthMeasurement; error?: string }
      if (!json.success) throw new Error(json.error ?? '측정 기록 추가 실패')
      return json.data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['measurements', data.type] })
    },
  })
}

// 측정 기록 삭제 훅
export function useDeleteMeasurement() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { id: string; type: MeasurementType }>({
    mutationFn: async ({ id }) => {
      const res = await fetch(`/api/health/measurements/${id}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) {
        const json = await res.json() as { error?: string }
        throw new Error(json.error ?? '측정 기록 삭제 실패')
      }
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['measurements', variables.type] })
    },
  })
}
