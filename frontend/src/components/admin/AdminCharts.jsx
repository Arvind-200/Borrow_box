import { formatAdminNumber } from './adminFormat'

const CHART_COLORS = ['#10B981', '#38BDF8', '#F59E0B', '#F43F5E', '#8B5CF6']

function formatChartDate(value) {
  return new Date(`${value}T00:00:00.000Z`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function AdminRequestsChart({ data = [] }) {
  const width = 640
  const height = 240
  const padding = { top: 16, right: 16, bottom: 34, left: 38 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const safeData = data.length > 0 ? data : []
  const maxValue = Math.max(
    1,
    ...safeData.map((day) => Math.max(day.pending || 0, day.accepted || 0))
  )

  const xFor = (index) =>
    padding.left +
    (index * plotWidth) / Math.max(safeData.length - 1, 1)
  const yFor = (value) =>
    padding.top + plotHeight - (value / maxValue) * plotHeight

  const buildPoints = (key) =>
    safeData
      .map((day, index) => `${xFor(index)},${yFor(day[key] || 0)}`)
      .join(' ')

  const acceptedPoints = buildPoints('accepted')
  const pendingPoints = buildPoints('pending')
  const baseline = padding.top + plotHeight
  const areaPoints = safeData.length
    ? `${padding.left},${baseline} ${acceptedPoints} ${xFor(safeData.length - 1)},${baseline}`
    : ''

  const ticks = [0, 0.25, 0.5, 0.75, 1]

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs font-medium text-[#64748B]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#F59E0B]" aria-hidden="true" />
          Pending
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#10B981]" aria-hidden="true" />
          Accepted
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label="Borrow requests over the last seven days"
      >
        <defs>
          <linearGradient id="adminRequestsArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((tick) => {
          const y = padding.top + plotHeight - tick * plotHeight
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="#E2E8F0"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-[#94A3B8] text-[10px]"
              >
                {Math.round(maxValue * tick)}
              </text>
            </g>
          )
        })}

        {areaPoints && (
          <polygon points={areaPoints} fill="url(#adminRequestsArea)" />
        )}

        <polyline
          points={pendingPoints}
          fill="none"
          stroke="#F59E0B"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <polyline
          points={acceptedPoints}
          fill="none"
          stroke="#10B981"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {safeData.map((day, index) => (
          <g key={day.date}>
            <text
              x={xFor(index)}
              y={height - 12}
              textAnchor="middle"
              className="fill-[#94A3B8] text-[10px]"
            >
              {formatChartDate(day.date)}
            </text>
            <circle
              cx={xFor(index)}
              cy={yFor(day.pending || 0)}
              r="3"
              fill="#fff"
              stroke="#F59E0B"
              strokeWidth="2"
            />
            <circle
              cx={xFor(index)}
              cy={yFor(day.accepted || 0)}
              r="3"
              fill="#fff"
              stroke="#10B981"
              strokeWidth="2"
            />
          </g>
        ))}
      </svg>
    </div>
  )
}

export function AdminDonut({ data = [], centerLabel = 'Total' }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const safeTotal = total || 1
  let offset = 0

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
      <div className="relative h-40 w-40 flex-shrink-0">
        <svg viewBox="0 0 42 42" className="h-40 w-40 -rotate-90">
          <circle
            cx="21"
            cy="21"
            r="15.9155"
            fill="none"
            stroke="#F1F5F9"
            strokeWidth="6"
          />
          {data.map((item) => {
            const percent = (item.value / safeTotal) * 100
            const gap = percent > 0 ? Math.min(percent, Math.max(percent - 2, 0)) : 0
            const element = (
              <circle
                key={item.label}
                cx="21"
                cy="21"
                r="15.9155"
                fill="none"
                stroke={item.color}
                strokeWidth="6"
                strokeDasharray={`${gap} ${100 - gap}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            )
            offset += percent
            return element
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold text-[#0F1626]">
            {formatAdminNumber(total)}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
            {centerLabel}
          </span>
        </div>
      </div>
      <ul className="w-full max-w-xs space-y-2.5">
        {data.map((item) => (
          <li
            key={item.label}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="inline-flex min-w-0 items-center gap-2 text-[#475569]">
              <span
                className="h-2.5 w-2.5 flex-shrink-0 rounded-sm"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="font-semibold text-[#0F1626]">
              {formatAdminNumber(item.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function AdminCategoryBars({ data = [] }) {
  const maxValue = Math.max(1, ...data.map((item) => item.count))

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={item.name}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-[#475569]">{item.name}</span>
            <span className="font-semibold text-[#0F1626]">
              {formatAdminNumber(item.count)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#F1F5F9]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max((item.count / maxValue) * 100, 3)}%`,
                backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
