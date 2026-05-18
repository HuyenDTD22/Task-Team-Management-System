import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { UserStatsResponse } from '@/types/common.types'
import { Spinner } from '@/components/ui/Spinner'

interface Props {
  readonly stats: UserStatsResponse | undefined
  readonly isLoading: boolean
}

const SLICES = [
  { key: 'todoCount',       label: 'To Do',       color: '#94a3b8' },
  { key: 'inProgressCount', label: 'In Progress',  color: '#3b82f6' },
  { key: 'inReviewCount',   label: 'In Review',    color: '#f59e0b' },
  { key: 'doneTaskCount',   label: 'Done',         color: '#10b981' },
] as const

type SliceKey = typeof SLICES[number]['key']

interface TooltipPayload {
  name: string
  value: number
  payload: { color: string }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const { name, value, payload: { color } } = payload[0]
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md text-xs">
      <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="font-medium text-slate-700">{name}</span>
      <span className="ml-2 text-slate-500">{value} task{value !== 1 ? 's' : ''}</span>
    </div>
  )
}

export function TaskStatusChart({ stats, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner size="md" />
      </div>
    )
  }

  if (!stats) return null

  const data = SLICES.map(s => ({ name: s.label, value: stats[s.key as SliceKey] as number, color: s.color }))
  const total = data.reduce((sum, d) => sum + d.value, 0)

  if (total === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2">
        <p className="text-sm text-slate-400">No tasks yet</p>
        <p className="text-xs text-slate-300">Tasks will appear here once assigned to you</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8">
      <div className="h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="flex flex-col gap-2">
        {data.map(d => (
          <li key={d.name} className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: d.color }} />
            <span className="text-slate-600">{d.name}</span>
            <span className="ml-auto pl-4 font-semibold text-slate-800">{d.value}</span>
            <span className="w-10 text-right text-xs text-slate-400">
              {total > 0 ? `${Math.round((d.value / total) * 100)}%` : '—'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
