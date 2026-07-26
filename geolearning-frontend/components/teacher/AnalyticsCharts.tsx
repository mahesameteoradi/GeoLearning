'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from 'recharts'

interface LevelDistData {
  range: string
  count: number
}

interface ClassStatData {
  name: string
  modules: number
  avgXp: number
}

interface XpTrendData {
  label: string
  xp: number
}

interface AnalyticsChartsProps {
  levelDist: LevelDistData[]
  classStats: ClassStatData[]
  xpTrend: XpTrendData[]
  quizStats: { label: string; value: number }[]
}

const VIOLET = '#7c3aed'
const CYAN   = '#22d3ee'
const AMBER  = '#f59e0b'
const FUCHSIA = '#d946ef'

const PIE_COLORS = [VIOLET, CYAN, AMBER, FUCHSIA, '#10b981', '#f97316']

const tooltipStyle = {
  backgroundColor: '#13131f',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  color: '#e2e8f0',
  fontSize: '12px',
}

const axisStyle = { fontSize: 11, fill: '#64748b' }

export function AnalyticsCharts({ levelDist, classStats, xpTrend, quizStats }: AnalyticsChartsProps) {
  return (
    <div className="space-y-6">
      {/* Row 1 — Level Distribution + Quiz Stats */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Level Distribution Bar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="mb-1 text-sm font-bold text-slate-800">Distribusi Level Siswa</p>
          <p className="mb-4 text-[11px] text-slate-600">Jumlah siswa per rentang level</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={levelDist} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="range" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(124,58,237,0.06)' }} />
              <Bar dataKey="count" name="Siswa" fill={VIOLET} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quiz Stats Pie */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="mb-1 text-sm font-bold text-slate-800">Distribusi Quiz per Kategori</p>
          <p className="mb-4 text-[11px] text-slate-600">Proporsi jenis soal kuis</p>
          {quizStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={quizStats}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {quizStats.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-slate-600">
              Belum ada data kuis
            </div>
          )}
        </div>
      </div>

      {/* Row 2 — XP Trend Area Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="mb-1 text-sm font-bold text-slate-800">Tren Akumulasi XP</p>
        <p className="mb-4 text-[11px] text-slate-600">Distribusi total XP siswa (dari terendah ke tertinggi)</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={xpTrend}>
            <defs>
              <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={VIOLET} stopOpacity={0.3} />
                <stop offset="95%" stopColor={VIOLET} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: VIOLET, strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey="xp"
              name="XP"
              stroke={VIOLET}
              strokeWidth={2}
              fill="url(#xpGradient)"
              dot={false}
              activeDot={{ r: 5, fill: VIOLET }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Row 3 — Class Stats */}
      {classStats.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="mb-1 text-sm font-bold text-slate-800">Statistik per Kelas</p>
          <p className="mb-4 text-[11px] text-slate-600">Jumlah modul dan rata-rata XP per kelas</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={classStats} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} iconType="circle" iconSize={8} />
              <Bar yAxisId="left" dataKey="modules" name="Modul" fill={VIOLET} radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="avgXp" name="Avg XP" fill={AMBER} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
