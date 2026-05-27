import { PrimaryIconBadge } from '@/components/primary-icon-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SummaryCardProps {
  title: string
  value: number
  icon: React.ReactNode
  description: string
}

export function SummaryCard({ title, value, icon, description }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
          {title}
          <PrimaryIconBadge size="sm">{icon}</PrimaryIconBadge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}
