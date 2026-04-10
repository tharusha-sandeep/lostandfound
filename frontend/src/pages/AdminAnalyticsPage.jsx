import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, MapPin, Tag, Clock, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import {
  fetchSummary, fetchTrends, fetchZones,
  fetchCategories, fetchTiming, fetchUserStats, fetchHealth,
} from '../services/analyticsService';

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  lost:     '#f43f5e',
  found:    '#10b981',
  claims:   '#8b5cf6',
  open:     '#f59e0b',
  resolved: '#10b981',
  matched:  '#3b82f6',
  neutral:  '#64748b',
  bg:       '#0f1117',
  surface:  '#1a1f2e',
  border:   '#2a3040',
  text:     '#e2e8f0',
  muted:    '#64748b',
  accent:   '#6366f1',
};

const RANGES = [
  { label: '7d',  value: '7'   },
  { label: '30d', value: '30'  },
  { label: '90d', value: '90'  },
  { label: 'All', value: 'all' },
];

// ─── Tiny reusable chart helpers ─────────────────────────────────────────────

function BarChart({ data, keyX, keys, colors, height = 120 }) {
  if (!data?.length) return <Empty />;
  const maxVal = Math.max(...data.flatMap(d => keys.map(k => d[k] ?? 0)), 1);
  const barW   = Math.max(8, Math.floor(600 / data.length) - 6);
  const totalW = data.length * (barW * keys.length + 8);

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={Math.max(totalW, 300)} height={height + 28} style={{ fontFamily: 'inherit' }}>
        {data.map((d, i) => {
          const groupX = i * (barW * keys.length + 8) + 4;
          return (
            <g key={i}>
              {keys.map((k, ki) => {
                const v  = d[k] ?? 0;
                const bh = Math.max(2, (v / maxVal) * height);
                return (
                  <g key={k}>
                    <rect
                      x={groupX + ki * barW}
                      y={height - bh}
                      width={barW - 2}
                      height={bh}
                      rx={3}
                      fill={colors[ki]}
                      opacity={0.85}
                    />
                    {v > 0 && bh > 18 && (
                      <text
                        x={groupX + ki * barW + barW / 2 - 1}
                        y={height - bh + 12}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={9}
                        fontWeight={700}
                      >{v}</text>
                    )}
                  </g>
                );
              })}
              <text
                x={groupX + (barW * keys.length) / 2 - 2}
                y={height + 18}
                textAnchor="middle"
                fill={C.muted}
                fontSize={10}
              >{d[keyX]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function LineChart({ series, height = 130 }) {
  if (!series?.length) return <Empty />;
  const maxVal = Math.max(...series.flatMap(d => [d.lost, d.found, d.claims]), 1);
  const W = 560;
  const stepX = W / Math.max(series.length - 1, 1);

  const line = (key, color) => {
    const pts = series.map((d, i) => `${i * stepX},${height - (((d[key] ?? 0) / maxVal) * height)}`).join(' ');
    return (
      <g key={key}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" opacity={0.9} />
        {series.map((d, i) => (
          d[key] > 0 && (
            <circle key={i} cx={i * stepX} cy={height - (((d[key] ?? 0) / maxVal) * height)} r={3} fill={color} />
          )
        ))}
      </g>
    );
  };

  // x-axis labels: show ~6 evenly spaced
  const step = Math.max(1, Math.floor(series.length / 6));

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${height + 24}`} style={{ overflow: 'visible' }}>
      {/* grid lines */}
      {[0.25, 0.5, 0.75, 1].map(t => (
        <line key={t} x1={0} y1={height - t * height} x2={W} y2={height - t * height}
          stroke={C.border} strokeWidth={1} />
      ))}
      {line('lost',   C.lost)}
      {line('found',  C.found)}
      {line('claims', C.claims)}
      {series.map((d, i) => i % step === 0 && (
        <text key={i} x={i * stepX} y={height + 18} textAnchor="middle" fill={C.muted} fontSize={9}>
          {d.date?.slice(5)}
        </text>
      ))}
    </svg>
  );
}

function DonutChart({ slices, size = 100 }) {
  if (!slices?.length) return <Empty />;
  const total = slices.reduce((s, d) => s + d.value, 0) || 1;
  const r = 38; const cx = size / 2; const cy = size / 2;
  let angle = -Math.PI / 2;
  const arcs = slices.map(s => {
    const a = (s.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(angle + a);
    const y2 = cy + r * Math.sin(angle + a);
    const lg = a > Math.PI ? 1 : 0;
    const d  = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${lg} 1 ${x2} ${y2} Z`;
    angle += a;
    return { d, color: s.color, label: s.label, value: s.value, pct: Math.round((s.value / total) * 100) };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((a, i) => (
          <path key={i} d={a.d} fill={a.color} opacity={0.88} />
        ))}
        <circle cx={cx} cy={cy} r={22} fill={C.surface} />
        <text x={cx} y={cy + 4} textAnchor="middle" fill={C.text} fontSize={12} fontWeight={700}>
          {total}
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {arcs.map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.text }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: a.color, flexShrink: 0 }} />
            {a.label}: <b>{a.value}</b> <span style={{ color: C.muted }}>({a.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HBarChart({ data, labelKey, valueKey, color, max: maxProp }) {
  if (!data?.length) return <Empty />;
  const max = maxProp ?? Math.max(...data.map(d => d[valueKey] ?? 0), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map((d, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.text, marginBottom: 3 }}>
            <span>{d[labelKey]}</span>
            <span style={{ color: C.muted }}>{d[valueKey]}</span>
          </div>
          <div style={{ height: 6, background: C.border, borderRadius: 3 }}>
            <div style={{
              height: '100%', borderRadius: 3,
              width: `${((d[valueKey] ?? 0) / max) * 100}%`,
              background: color,
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

function Empty() {
  return <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>No data for this period</p>;
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: 20,
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <Icon size={15} color={C.accent} />
      <span style={{ fontSize: 13, fontWeight: 700, color: C.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
    </div>
  );
}

function KpiCard({ label, value, sub, color = C.accent, icon: Icon }) {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 11, color: C.muted, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
          <p style={{ fontSize: 28, fontWeight: 800, color, margin: '4px 0 2px', lineHeight: 1 }}>{value ?? '–'}</p>
          {sub && <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{sub}</p>}
        </div>
        {Icon && <Icon size={22} color={color} opacity={0.6} />}
      </div>
    </Card>
  );
}

function RangePicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 3 }}>
      {RANGES.map(r => (
        <button
          key={r.value}
          onClick={() => onChange(r.value)}
          style={{
            padding: '4px 12px', borderRadius: 6, border: 'none',
            background: value === r.value ? C.accent : 'transparent',
            color: value === r.value ? '#fff' : C.muted,
            fontWeight: value === r.value ? 700 : 400,
            fontSize: 12, cursor: 'pointer',
          }}
        >{r.label}</button>
      ))}
    </div>
  );
}

function Legend({ items }) {
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8 }}>
      {items.map(({ label, color }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.muted }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
          {label}
        </div>
      ))}
    </div>
  );
}

// ─── Section components ───────────────────────────────────────────────────────

function SummarySection({ data }) {
  if (!data) return null;
  const { posts, claims, users, resolutionRate, approvalRate, avgResolutionDays } = data;
  const totalLost  = (posts?.lost?.open ?? 0) + (posts?.lost?.matched ?? 0) + (posts?.lost?.resolved ?? 0);
  const totalFound = (posts?.found?.open ?? 0) + (posts?.found?.matched ?? 0) + (posts?.found?.resolved ?? 0);

  return (
    <section>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 12 }}>
        <KpiCard label="Total Posts"         value={posts?.total}           sub={`${totalLost} lost · ${totalFound} found`} icon={TrendingUp} color={C.accent} />
        <KpiCard label="Resolution Rate"     value={`${resolutionRate}%`}   sub="Posts reaching resolved" icon={Tag}         color={C.found}  />
        <KpiCard label="Avg Days to Resolve" value={avgResolutionDays}      sub="Incident → claim approved"  icon={Clock}   color={C.open}   />
        <KpiCard label="Total Claims"        value={claims?.total}          sub={`${approvalRate}% approved`} icon={TrendingUp} color={C.claims} />
        <KpiCard label="Active Students"     value={users?.total}           sub={`${users?.banned ?? 0} banned`} icon={Users} color={C.neutral} />
      </div>
    </section>
  );
}

function TrendsSection({ range }) {
  const [data, setData] = useState(null);
  useEffect(() => { fetchTrends(range).then(setData).catch(() => {}); }, [range]);

  return (
    <Card>
      <SectionTitle icon={TrendingUp} label="Activity Trends" />
      <LineChart series={data?.series} />
      <Legend items={[
        { label: 'Lost posts', color: C.lost },
        { label: 'Found posts', color: C.found },
        { label: 'Claims', color: C.claims },
      ]} />
    </Card>
  );
}

function ZonesSection({ range }) {
  const [data, setData] = useState(null);
  useEffect(() => { fetchZones(range).then(setData).catch(() => {}); }, [range]);
  const zones = data?.zones ?? [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <Card>
        <SectionTitle icon={MapPin} label="Items by Zone" />
        <BarChart data={zones} keyX="zone" keys={['lost','found']} colors={[C.lost, C.found]} />
        <Legend items={[{ label: 'Lost', color: C.lost }, { label: 'Found', color: C.found }]} />
      </Card>
      <Card>
        <SectionTitle icon={MapPin} label="Zone Resolution Rates" />
        <HBarChart
          data={zones}
          labelKey="zone"
          valueKey="resolutionRate"
          color={C.found}
          max={100}
        />
        <p style={{ fontSize: 11, color: C.muted, marginTop: 10 }}>% of posts in that zone reaching resolved</p>
      </Card>
    </div>
  );
}

function CategoriesSection({ range }) {
  const [data, setData] = useState(null);
  useEffect(() => { fetchCategories(range).then(setData).catch(() => {}); }, [range]);
  const cats = data?.categories ?? [];

  const COLORS = ['#6366f1','#f43f5e','#10b981','#f59e0b','#8b5cf6'];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <Card>
        <SectionTitle icon={Tag} label="Category Volume" />
        <BarChart data={cats} keyX="category" keys={['lost','found']} colors={[C.lost, C.found]} />
        <Legend items={[{ label: 'Lost', color: C.lost }, { label: 'Found', color: C.found }]} />
      </Card>
      <Card>
        <SectionTitle icon={Tag} label="Recovery Rates by Category" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cats.map((c, i) => (
            <div key={c.category}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.text, marginBottom: 3 }}>
                <span>{c.category}</span>
                <span style={{ fontWeight: 700, color: c.recoveryRate > 50 ? C.found : C.lost }}>
                  {c.recoveryRate}%
                </span>
              </div>
              <div style={{ height: 6, background: C.border, borderRadius: 3 }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${c.recoveryRate}%`,
                  background: COLORS[i % COLORS.length],
                }} />
              </div>
              <span style={{ fontSize: 10, color: C.muted }}>{c.avgMatchCount} avg matches</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function TimingSection({ range }) {
  const [data, setData] = useState(null);
  useEffect(() => { fetchTiming(range).then(setData).catch(() => {}); }, [range]);

  const lagBuckets = data?.lagBuckets
    ? Object.entries(data.lagBuckets).map(([k, v]) => ({ bucket: k, count: v }))
    : [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <Card>
        <SectionTitle icon={Clock} label="Incidents by Day of Week" />
        <BarChart data={data?.dowSeries ?? []} keyX="day" keys={['lost','found']} colors={[C.lost, C.found]} height={100} />
        <Legend items={[{ label: 'Lost', color: C.lost }, { label: 'Found', color: C.found }]} />
      </Card>
      <Card>
        <SectionTitle icon={Clock} label="Reporting Lag Distribution" />
        <p style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>
          Lost: avg <b style={{ color: C.text }}>{data?.avgLags?.lost ?? '–'}d</b> ·
          Found: avg <b style={{ color: C.text }}>{data?.avgLags?.found ?? '–'}d</b> before posting
        </p>
        <BarChart
          data={lagBuckets}
          keyX="bucket"
          keys={['count']}
          colors={[C.accent]}
          height={90}
        />
        <p style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>Time between item incident date and post creation</p>
      </Card>
    </div>
  );
}

function UsersSection({ range }) {
  const [data, setData] = useState(null);
  useEffect(() => { fetchUserStats(range).then(setData).catch(() => {}); }, [range]);

  const faculties = (data?.facultyBreakdown ?? []).slice(0, 8);
  const COLORS = ['#6366f1','#f43f5e','#10b981','#f59e0b','#8b5cf6','#06b6d4','#ec4899','#84cc16'];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <Card>
        <SectionTitle icon={Users} label="Posts by Faculty" />
        <DonutChart
          slices={faculties.map((f, i) => ({
            label: f.faculty, value: f.total, color: COLORS[i % COLORS.length],
          }))}
          size={110}
        />
      </Card>
      <Card>
        <SectionTitle icon={Users} label="Top Reporters" />
        {data?.topReporters?.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.topReporters.slice(0, 8).map((u, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: C.accent, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, flexShrink: 0,
                }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.name}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>{u.faculty}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{u.postCount}</span>
                  <span style={{ fontSize: 10, color: C.muted, display: 'block' }}>
                    {u.lostCount}L · {u.foundCount}F
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : <Empty />}
      </Card>
    </div>
  );
}

function HealthSection() {
  const [data, setData] = useState(null);
  useEffect(() => { fetchHealth().then(setData).catch(() => {}); }, []);

  const alerts = data ? [
    {
      label: 'Posts with no images',
      value: data.missingImg,
      tip: 'Images increase match accuracy. Encourage users to add photos.',
      sev: data.missingImg > 10 ? 'high' : 'low',
    },
    {
      label: 'Stale open posts (30d+)',
      value: data.staleOpen,
      tip: 'Consider reaching out to authors or auto-archiving old posts.',
      sev: data.staleOpen > 5 ? 'high' : 'low',
    },
    {
      label: 'High-interest unresolved posts',
      value: data.highMatchLowResolution,
      tip: 'These posts have 2+ matches but remain open — review for manual resolution.',
      sev: data.highMatchLowResolution > 0 ? 'medium' : 'low',
    },
  ] : [];

  const sevColor = { high: '#f43f5e', medium: '#f59e0b', low: '#10b981' };

  return (
    <Card>
      <SectionTitle icon={AlertTriangle} label="Data Quality & Action Items" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
        {alerts.map((a, i) => (
          <div key={i} style={{
            background: C.bg,
            border: `1px solid ${sevColor[a.sev]}33`,
            borderLeft: `3px solid ${sevColor[a.sev]}`,
            borderRadius: 10,
            padding: 14,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: C.muted }}>{a.label}</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: sevColor[a.sev] }}>{a.value ?? '–'}</span>
            </div>
            <p style={{ fontSize: 11, color: C.muted, margin: 0, lineHeight: 1.4 }}>{a.tip}</p>
          </div>
        ))}

        {/* Missing-field suggestions */}
        <div style={{
          background: C.bg,
          border: `1px solid ${C.accent}33`,
          borderLeft: `3px solid ${C.accent}`,
          borderRadius: 10,
          padding: 14,
        }}>
          <span style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>📋 Missing field suggestions</span>
          <ul style={{ fontSize: 11, color: C.muted, margin: 0, paddingLeft: 16, lineHeight: 1.8 }}>
            <li><b style={{ color: C.text }}>Floor/Room</b> — precise location beyond zone</li>
            <li><b style={{ color: C.text }}>Item colour</b> — boosts visual matching</li>
            <li><b style={{ color: C.text }}>Time of incident</b> — enables hourly heatmaps</li>
            <li><b style={{ color: C.text }}>Student year</b> — enriches faculty analytics</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const [range,   setRange]   = useState('30');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchSummary(range)
      .then(setSummary)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [range]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      color: C.text,
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      padding: '0 0 60px',
    }}>
      {/* Header */}
      <div style={{
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
        padding: '16px 28px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}>
        <Link to="/admin" style={{ color: C.muted, display: 'flex' }}>
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: C.text }}>
            Analytics
          </h1>
          <p style={{ margin: 0, fontSize: 11, color: C.muted }}>CampusLostFound · admin view</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <RangePicker value={range} onChange={setRange} />
          <button
            onClick={load}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {loading && !summary ? (
          <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Loading analytics…</div>
        ) : (
          <>
            {/* KPIs */}
            <SummarySection data={summary} />

            {/* Trends */}
            <TrendsSection range={range} />

            {/* Zones */}
            <ZonesSection range={range} />

            {/* Categories */}
            <CategoriesSection range={range} />

            {/* Timing */}
            <TimingSection range={range} />

            {/* Users */}
            <UsersSection range={range} />

            {/* Health */}
            <HealthSection />
          </>
        )}
      </div>
    </div>
  );
}
