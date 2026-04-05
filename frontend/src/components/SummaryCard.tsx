type SummaryCardProps = {
  label: string
  value: number
  tone: 'default' | 'accent' | 'success'
}

export function SummaryCard({ label, value, tone }: SummaryCardProps) {
  return (
    <article className={`panel summary-card tone-${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  )
}
