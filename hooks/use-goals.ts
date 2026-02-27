'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Goal, GoalMilestone, CreateGoalInput, UpdateGoalInput } from '@/types/goal'

// 목표 목록 조회
export function useGoals(status?: string) {
  const query = status ? `?status=${status}` : ''

  return useQuery<Goal[]>({
    queryKey: ['goals', status],
    queryFn: async () => {
      const res = await fetch(`/api/goals${query}`)
      const json = await res.json() as { success: boolean; data: Goal[]; error?: string }
      if (!json.success) throw new Error(json.error ?? 'Failed to fetch goals')
      return json.data
    },
  })
}

// 목표 단건 조회
export function useGoal(id: string) {
  return useQuery<Goal>({
    queryKey: ['goals', id],
    queryFn: async () => {
      const res = await fetch(`/api/goals/${id}`)
      const json = await res.json() as { success: boolean; data: Goal; error?: string }
      if (!json.success) throw new Error(json.error ?? 'Failed to fetch goal')
      return json.data
    },
    enabled: !!id,
  })
}

// 목표 생성
export function useCreateGoal() {
  const queryClient = useQueryClient()

  return useMutation<Goal, Error, CreateGoalInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as { success: boolean; data: Goal; error?: string }
      if (!json.success) throw new Error(json.error ?? 'Failed to create goal')
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })
}

// 목표 수정
export function useUpdateGoal() {
  const queryClient = useQueryClient()

  return useMutation<Goal, Error, { id: string; input: UpdateGoalInput }>({
    mutationFn: async ({ id, input }) => {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as { success: boolean; data: Goal; error?: string }
      if (!json.success) throw new Error(json.error ?? 'Failed to update goal')
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })
}

// 목표 삭제
export function useDeleteGoal() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' })
      const json = await res.json() as { success: boolean; error?: string }
      if (!json.success) throw new Error(json.error ?? 'Failed to delete goal')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })
}

// 마일스톤 추가
export function useCreateMilestone(goalId: string) {
  const queryClient = useQueryClient()

  return useMutation<GoalMilestone, Error, { title: string; due_date?: string | null }>({
    mutationFn: async (input) => {
      const res = await fetch(`/api/goals/${goalId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as { success: boolean; data: GoalMilestone; error?: string }
      if (!json.success) throw new Error(json.error ?? 'Failed to create milestone')
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })
}

// 마일스톤 토글/수정
export function useToggleMilestone(goalId: string) {
  const queryClient = useQueryClient()

  return useMutation<GoalMilestone, Error, { milestoneId: string; completed: boolean }>({
    mutationFn: async ({ milestoneId, completed }) => {
      const res = await fetch(`/api/goals/${goalId}/milestones/${milestoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      })
      const json = await res.json() as { success: boolean; data: GoalMilestone; error?: string }
      if (!json.success) throw new Error(json.error ?? 'Failed to toggle milestone')
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })
}

// 마일스톤 삭제
export function useDeleteMilestone(goalId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (milestoneId) => {
      const res = await fetch(`/api/goals/${goalId}/milestones/${milestoneId}`, {
        method: 'DELETE',
      })
      const json = await res.json() as { success: boolean; error?: string }
      if (!json.success) throw new Error(json.error ?? 'Failed to delete milestone')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })
}
