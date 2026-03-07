'use client'

import { useTranslations, useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { useDeleteMeasurement } from '@/hooks/use-measurements'
import type { HealthMeasurement, MeasurementType } from '@/types/health_measurement'

interface MeasurementListProps {
  measurements: HealthMeasurement[]
  type: MeasurementType
}

function formatValue(m: HealthMeasurement): string {
  if (m.type === 'blood_pressure' && m.value2 !== null) {
    return `${m.value}/${m.value2}`
  }
  return String(m.value)
}

function formatDateTime(isoString: string, locale: string): string {
  const date = new Date(isoString)
  if (locale === 'ko') {
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date)
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export function MeasurementList({ measurements, type }: MeasurementListProps) {
  const t = useTranslations('health.measurements')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const deleteMutation = useDeleteMeasurement()

  if (measurements.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">{t('no_records')}</p>
    )
  }

  return (
    <ul className="divide-y divide-border">
      {measurements.map((m) => (
        <li key={m.id} className="flex items-center justify-between py-3 gap-2">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm font-medium">
              {formatValue(m)}{' '}
              <span className="text-muted-foreground font-normal">{m.unit}</span>
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDateTime(m.measured_at, locale)}
            </span>
            {m.note && (
              <span className="text-xs text-muted-foreground truncate">{m.note}</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive shrink-0"
            onClick={() => deleteMutation.mutate({ id: m.id, type })}
            disabled={deleteMutation.isPending}
            aria-label={tCommon('delete')}
          >
            {tCommon('delete')}
          </Button>
        </li>
      ))}
    </ul>
  )
}
