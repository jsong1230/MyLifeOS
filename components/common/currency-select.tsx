'use client'

import { useTranslations } from 'next-intl'
import { CURRENCY_CODES, type CurrencyCode } from '@/lib/currency'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface CurrencySelectProps {
  value: CurrencyCode
  onChange: (currency: CurrencyCode) => void
  label?: string
  id?: string
  className?: string
}

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  KRW: '₩',
  CAD: 'CA$',
  USD: '$',
}

export function CurrencySelect({ value, onChange, label, id = 'currency', className }: CurrencySelectProps) {
  const t = useTranslations('currency')

  return (
    <div className={className}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Select value={value} onValueChange={(v) => onChange(v as CurrencyCode)}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CURRENCY_CODES.map((code) => (
            <SelectItem key={code} value={code}>
              <span className="flex items-center gap-2">
                <span className="font-mono text-muted-foreground">{CURRENCY_SYMBOLS[code]}</span>
                <span>{t(code)}</span>
                <span className="text-muted-foreground text-xs">({code})</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
