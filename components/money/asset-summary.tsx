'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatCurrencyCompact } from '@/lib/currency'
import { ASSET_TYPE_LABEL, type Asset, type AssetType } from '@/types/asset'

interface AssetSummaryProps {
  assets: Asset[]
}

const ASSET_COLORS: Record<AssetType, string> = {
  cash: '#22c55e',
  deposit: '#3b82f6',
  investment: '#f59e0b',
  other: '#8b5cf6',
}

export function AssetSummary({ assets }: AssetSummaryProps) {
  // 유형별 합계
  const byType = assets.reduce<Record<AssetType, number>>(
    (acc, a) => {
      acc[a.asset_type] = (acc[a.asset_type] ?? 0) + a.amount
      return acc
    },
    { cash: 0, deposit: 0, investment: 0, other: 0 }
  )

  const total = Object.values(byType).reduce((s, v) => s + v, 0)

  const pieData = (Object.entries(byType) as [AssetType, number][])
    .filter(([, v]) => v > 0)
    .map(([type, value]) => ({
      name: ASSET_TYPE_LABEL[type],
      value,
      color: ASSET_COLORS[type],
    }))

  if (assets.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          이번 달 자산 기록이 없습니다
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {/* 총 자산 카드 */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <p className="text-xs text-muted-foreground mb-1">총 자산</p>
          <p className="text-2xl font-bold">{formatCurrency(total, 'KRW')}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{formatCurrencyCompact(total, 'KRW')}</p>
        </CardContent>
      </Card>

      {/* 파이 차트 */}
      {pieData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">유형별 비율</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | undefined) => [
                    value != null ? formatCurrency(value, 'KRW') : '-',
                    '',
                  ]}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-xs">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* 유형별 금액 목록 */}
      <Card>
        <CardContent className="pt-4 pb-2 space-y-2">
          {(Object.entries(byType) as [AssetType, number][])
            .filter(([, v]) => v > 0)
            .map(([type, value]) => (
              <div key={type} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: ASSET_COLORS[type] }}
                  />
                  <span className="text-sm">{ASSET_TYPE_LABEL[type]}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium">{formatCurrency(value, 'KRW')}</span>
                  {total > 0 && (
                    <span className="text-xs text-muted-foreground ml-1.5">
                      {Math.round((value / total) * 100)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  )
}
