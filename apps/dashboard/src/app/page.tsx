'use client';

import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={mounted ? 'animate-in' : ''}>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>AI project health, quality metrics, and system overview</p>
      </div>

      {/* Metric Cards */}
      <div className="metrics-grid stagger">
        <MetricCard
          label="Health Score"
          value="87%"
          change="+3.2%"
          positive
          color="#10b981"
        />
        <MetricCard
          label="Completion"
          value="92%"
          change="+5.1%"
          positive
          color="#6366f1"
        />
        <MetricCard
          label="Token Reduction"
          value="84%"
          change="+1.8%"
          positive
          color="#06b6d4"
        />
        <MetricCard
          label="Hallucination Safety"
          value="96%"
          change="+2.0%"
          positive
          color="#f59e0b"
        />
        <MetricCard
          label="Architecture"
          value="100%"
          change="Stable"
          positive
          color="#8b5cf6"
        />
        <MetricCard
          label="Active Snapshots"
          value="14"
          change="3 today"
          positive
          color="#ec4899"
        />
      </div>

      {/* Main Grid */}
      <div className="grid-2" style={{ marginBottom: 'var(--space-xl)' }}>
        {/* Health Overview */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Project Health</span>
            <span className="badge badge-success">● Healthy</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-xl)' }}>
            <ScoreRing score={87} label="Overall" color="#10b981" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-md)', textAlign: 'center' }}>
            <MiniMetric label="Tests" value="78%" color="var(--color-warning)" />
            <MiniMetric label="Security" value="95%" color="var(--color-success)" />
            <MiniMetric label="Quality" value="88%" color="var(--color-info)" />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Activity</span>
            <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <ActivityItem
              icon="📸"
              title="Snapshot created"
              description="Stable snapshot before AI refactoring"
              time="2 min ago"
              status="success"
            />
            <ActivityItem
              icon="✅"
              title="Validation passed"
              description="All completion checks passed (92%)"
              time="5 min ago"
              status="success"
            />
            <ActivityItem
              icon="⚠️"
              title="Architecture drift detected"
              description="New dependency bypasses service layer"
              time="12 min ago"
              status="warning"
            />
            <ActivityItem
              icon="🔄"
              title="Recovery executed"
              description="Rolled back auth module to stable snapshot"
              time="1 hour ago"
              status="info"
            />
            <ActivityItem
              icon="🧠"
              title="Context recompiled"
              description="84% token reduction achieved (320K → 51K)"
              time="2 hours ago"
              status="success"
            />
          </div>
        </div>
      </div>

      {/* AI Sessions */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card-header">
          <span className="card-title">AI Model Sessions</span>
          <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '0.8rem' }}>
            + New Session
          </button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Model</th>
                <th>Status</th>
                <th>Tokens In</th>
                <th>Tokens Out</th>
                <th>Saved</th>
                <th>Cost</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Claude 3.5 Sonnet</td>
                <td><span className="badge badge-success">Active</span></td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>12,450</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>8,320</td>
                <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>84%</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>$0.087</td>
                <td style={{ color: 'var(--text-tertiary)' }}>Active</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>GPT-4o</td>
                <td><span className="badge badge-info">Completed</span></td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>24,100</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>15,680</td>
                <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>79%</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>$0.210</td>
                <td style={{ color: 'var(--text-tertiary)' }}>45 min</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Ollama (CodeLlama)</td>
                <td><span className="badge badge-info">Completed</span></td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>8,900</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>6,200</td>
                <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>91%</td>
                <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>$0.00</td>
                <td style={{ color: 'var(--text-tertiary)' }}>22 min</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid-3">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Validation Summary</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <ValidationRow label="Completion" score={92} status="pass" />
            <ValidationRow label="Architecture" score={100} status="pass" />
            <ValidationRow label="Hallucination" score={96} status="pass" />
            <ValidationRow label="Security" score={88} status="warning" />
            <ValidationRow label="Tests" score={78} status="warning" />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Token Efficiency</span>
          </div>
          <div style={{ padding: 'var(--space-md) 0' }}>
            <TokenBar label="Context L0" original={45000} optimized={4200} />
            <TokenBar label="Context L1" original={120000} optimized={9800} />
            <TokenBar label="Context L2" original={85000} optimized={12400} />
            <TokenBar label="History" original={65000} optimized={3100} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Quick Actions</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
              📸 Create Snapshot
            </button>
            <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
              🧠 Recompile Context
            </button>
            <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
              ✅ Run Validation
            </button>
            <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
              🔄 Rollback to Stable
            </button>
            <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
              🤖 Start AI Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Subcomponents ─── */

function MetricCard({ label, value, change, positive, color }: {
  label: string; value: string; change: string; positive: boolean; color: string;
}) {
  return (
    <div className="metric-card" style={{ '--metric-color': color } as React.CSSProperties}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className={`metric-change ${positive ? 'positive' : 'negative'}`}>
        {positive ? '↑' : '↓'} {change}
      </div>
    </div>
  );
}

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="score-ring">
      <svg width="120" height="120">
        <circle className="score-ring-bg" cx="60" cy="60" r={radius} />
        <circle
          className="score-ring-fill"
          cx="60" cy="60" r={radius}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-ring-value">
        <span className="value" style={{ color }}>{score}%</span>
        <span className="label">{label}</span>
      </div>
    </div>
  );
}

function MiniMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: '1.25rem', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  );
}

function ActivityItem({ icon, title, description, time, status }: {
  icon: string; title: string; description: string; time: string; status: string;
}) {
  const borderColor = status === 'success' ? 'var(--color-success)' :
    status === 'warning' ? 'var(--color-warning)' : 'var(--color-info)';

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)',
      padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)',
      borderLeft: `3px solid ${borderColor}`,
      background: 'var(--surface-2)',
      transition: 'all var(--transition-fast)',
    }}>
      <span style={{ fontSize: '1rem', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{title}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{description}</div>
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', flexShrink: 0 }}>{time}</div>
    </div>
  );
}

function ValidationRow({ label, score, status }: { label: string; score: number; status: string }) {
  const color = status === 'pass' ? 'var(--color-success)' :
    status === 'warning' ? 'var(--color-warning)' : 'var(--color-error)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
      <span style={{ fontSize: '0.85rem', flex: 1, color: 'var(--text-secondary)' }}>{label}</span>
      <div style={{
        width: 80, height: 6, background: 'var(--surface-3)', borderRadius: 'var(--radius-full)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${score}%`, height: '100%', background: color,
          borderRadius: 'var(--radius-full)', transition: 'width 1s ease',
        }} />
      </div>
      <span style={{ fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color, width: 40, textAlign: 'right' }}>{score}%</span>
    </div>
  );
}

function TokenBar({ label, original, optimized }: { label: string; original: number; optimized: number }) {
  const reduction = Math.round(((original - optimized) / original) * 100);
  const ratio = (optimized / original) * 100;

  return (
    <div style={{ marginBottom: 'var(--space-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600 }}>-{reduction}%</span>
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <div style={{
          flex: 1, height: 8, background: 'var(--surface-3)', borderRadius: 'var(--radius-full)',
          overflow: 'hidden', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: '100%', background: 'rgba(239, 68, 68, 0.15)',
            borderRadius: 'var(--radius-full)',
          }} />
          <div style={{
            position: 'relative', width: `${ratio}%`, height: '100%',
            background: 'linear-gradient(90deg, var(--brand-primary), var(--brand-accent))',
            borderRadius: 'var(--radius-full)', transition: 'width 1s ease',
          }} />
        </div>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', width: 90, textAlign: 'right' }}>
          {(optimized / 1000).toFixed(1)}K / {(original / 1000).toFixed(1)}K
        </span>
      </div>
    </div>
  );
}
