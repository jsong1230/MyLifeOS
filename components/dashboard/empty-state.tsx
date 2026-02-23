// 카드 내 빈 상태 공통 UI
interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
      <div className="text-muted-foreground/40 [&>svg]:w-10 [&>svg]:h-10" aria-hidden="true">
        {icon}
      </div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground/70">{description}</p>
    </div>
  )
}
