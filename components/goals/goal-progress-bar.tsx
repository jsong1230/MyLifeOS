'use client'

interface GoalProgressBarProps {
  progress: number
}

export function GoalProgressBar({ progress }: GoalProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress))

  let colorClass = 'bg-destructive'
  if (clampedProgress === 100) {
    colorClass = 'bg-green-500'
  } else if (clampedProgress >= 67) {
    colorClass = 'bg-blue-500'
  } else if (clampedProgress >= 34) {
    colorClass = 'bg-yellow-500'
  }

  return (
    <div className="w-full">
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  )
}
