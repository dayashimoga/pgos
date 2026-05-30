// ============================================================
// @pgos/doc-engine — HTML Report Generator
// Generates beautiful HTML dashboard reports for project health
// ============================================================

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { SavingsMetrics } from './savings-calculator.js';
import { componentLogger } from '@pgos/core';

const log = componentLogger('report-generator');

export interface ProjectHealthData {
  projectName: string;
  snapshotId: string;
  generatedAt: string;
  scores: {
    overall: number;
    completion: number;
    docCoverage: number;
    testCoverage: number;
    architecture: number;
  };
  metrics: {
    totalFiles: number;
    totalLoc: number;
    antiPatterns: number;
    hallucinations: number;
  };
  savings: SavingsMetrics;
  issues: {
    file: string;
    description: string;
    severity: 'critical' | 'error' | 'warning';
  }[];
}

export class ReportGenerator {
  /**
   * Generate a comprehensive HTML dashboard report
   */
  static async generateHtmlReport(outputPath: string, data: ProjectHealthData): Promise<string> {
    log.info({ outputPath }, 'Generating HTML health report');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PGOS Health Report - ${data.projectName}</title>
    <style>
        :root {
            --bg: #0f172a;
            --surface: #1e293b;
            --surface-hover: #334155;
            --text: #f8fafc;
            --text-muted: #94a3b8;
            --primary: #3b82f6;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --border: #334155;
            --radius: 12px;
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg);
            color: var(--text);
            line-height: 1.6;
            padding: 2rem;
            max-width: 1400px;
            margin: 0 auto;
        }

        header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--border);
        }

        h1 { font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; }
        .meta { color: var(--text-muted); font-size: 0.9rem; }
        
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .card {
            background-color: var(--surface);
            border-radius: var(--radius);
            padding: 1.5rem;
            border: 1px solid var(--border);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .card h3 {
            color: var(--text-muted);
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 1rem;
        }

        .score-display {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .score-circle {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            font-weight: bold;
            border: 4px solid var(--primary);
        }

        .score-excellent { border-color: var(--success); color: var(--success); }
        .score-good { border-color: var(--primary); color: var(--primary); }
        .score-fair { border-color: var(--warning); color: var(--warning); }
        .score-poor { border-color: var(--danger); color: var(--danger); }

        .metric-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid var(--border);
        }
        .metric-row:last-child { border-bottom: none; }

        .stat-value { font-weight: bold; font-size: 1.1rem; }
        .stat-value.money { color: var(--success); }

        .issues-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
        }
        
        .issues-table th, .issues-table td {
            padding: 1rem;
            text-align: left;
            border-bottom: 1px solid var(--border);
        }
        
        .issues-table th { color: var(--text-muted); font-weight: 600; }
        .issues-table tr:hover { background-color: var(--surface-hover); }

        .badge {
            padding: 0.25rem 0.5rem;
            border-radius: 9999px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        .badge.critical { background-color: rgba(239, 68, 68, 0.2); color: var(--danger); border: 1px solid var(--danger); }
        .badge.error { background-color: rgba(245, 158, 11, 0.2); color: var(--warning); border: 1px solid var(--warning); }
        .badge.warning { background-color: rgba(59, 130, 246, 0.2); color: var(--primary); border: 1px solid var(--primary); }
    </style>
</head>
<body>

    <header>
        <div>
            <h1>PGOS Health Report: ${data.projectName}</h1>
            <div class="meta">Snapshot ID: ${data.snapshotId} | Generated: ${new Date(data.generatedAt).toLocaleString()}</div>
        </div>
        <div class="score-display">
            <div style="text-align: right; margin-right: 1rem;">
                <div style="font-size: 1.2rem; font-weight: bold;">Overall Health</div>
                <div style="color: var(--text-muted);">Weighted aggregate score</div>
            </div>
            <div class="score-circle ${this.getScoreClass(data.scores.overall)}">
                ${data.scores.overall}%
            </div>
        </div>
    </header>

    <div class="dashboard-grid">
        <!-- Sub Scores -->
        <div class="card">
            <h3>Component Scores</h3>
            <div class="metric-row">
                <div>
                    <div>Code Completion</div>
                    <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 2px;">Absence of stubs, TODOs, or empty functions</div>
                </div>
                <span class="stat-value ${this.getTextClass(data.scores.completion)}">${data.scores.completion}%</span>
            </div>
            <div class="metric-row">
                <div>
                    <div>Test Coverage</div>
                    <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 2px;">Automated test suites density</div>
                </div>
                <span class="stat-value ${this.getTextClass(data.scores.testCoverage)}">${data.scores.testCoverage}%</span>
            </div>
            <div class="metric-row">
                <div>
                    <div>Doc Coverage</div>
                    <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 2px;">In-line documentation and exported specs</div>
                </div>
                <span class="stat-value ${this.getTextClass(data.scores.docCoverage)}">${data.scores.docCoverage}%</span>
            </div>
            <div class="metric-row">
                <div>
                    <div>Architecture</div>
                    <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 2px;">Adherence to clean layer boundaries</div>
                </div>
                <span class="stat-value ${this.getTextClass(data.scores.architecture)}">${data.scores.architecture}%</span>
            </div>
        </div>

        <!-- Codebase Size -->
        <div class="card">
            <h3>Codebase Volume</h3>
            <div class="metric-row">
                <div>
                    <div>Source Files</div>
                    <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 2px;">Parsed text files in workspace</div>
                </div>
                <span class="stat-value">${data.metrics.totalFiles.toLocaleString()}</span>
            </div>
            <div class="metric-row">
                <div>
                    <div>Context Size</div>
                    <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 2px;">Estimated total LLM tokens parsed</div>
                </div>
                <span class="stat-value">${data.metrics.totalLoc.toLocaleString()}</span>
            </div>
            <div class="metric-row">
                <div>
                    <div>Anti-Patterns Detected</div>
                    <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 2px;">Code smells, secrets, or mocks in prod</div>
                </div>
                <span class="stat-value ${data.metrics.antiPatterns > 0 ? 'text-danger' : 'text-success'}" style="color: ${data.metrics.antiPatterns > 0 ? 'var(--warning)' : 'var(--success)'}">${data.metrics.antiPatterns}</span>
            </div>
            <div class="metric-row">
                <div>
                    <div>Hallucination Risks</div>
                    <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 2px;">Undeclared external dependencies</div>
                </div>
                <span class="stat-value" style="color: ${data.metrics.hallucinations > 0 ? 'var(--danger)' : 'var(--success)'}">${data.metrics.hallucinations}</span>
            </div>
        </div>

        <!-- ROI & Savings -->
        <div class="card" style="border-color: var(--success); box-shadow: 0 0 15px rgba(16, 185, 129, 0.1);">
            <h3 style="color: var(--success);">ROI & Savings (This Run)</h3>
            <div class="metric-row">
                <div>
                    <div>Token Reduction</div>
                    <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 2px;">From ${data.savings.tokenSavings.rawTokens.toLocaleString()} to ${data.savings.tokenSavings.optimizedTokens.toLocaleString()} tokens</div>
                </div>
                <span class="stat-value money">${data.savings.tokenSavings.reductionPercentage}%</span>
            </div>
            <div class="metric-row">
                <div>
                    <div>API Cost Saved</div>
                    <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 2px;">Based on $3.00 / 1M tokens avg rate</div>
                </div>
                <span class="stat-value money">$${data.savings.costSavings.savedCost.toFixed(4)}</span>
            </div>
            <div class="metric-row">
                <div>
                    <div>Review Hours Saved</div>
                    <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 2px;">At 1 min review per 1,000 tokens</div>
                </div>
                <span class="stat-value money">${data.savings.timeSavings.savedHours.toFixed(1)}h</span>
            </div>
            <div class="metric-row">
                <div>
                    <div>Defect Prevention</div>
                    <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 2px;">${data.savings.qualityMetrics.issuesDetected} issues caught × $150 remediation</div>
                </div>
                <span class="stat-value money">$${data.savings.qualityMetrics.preventedDefectCost.toFixed(2)}</span>
            </div>
            <div class="metric-row" style="border-bottom: none; margin-top: 1rem; padding-top: 1rem; border-top: 2px dashed var(--success);">
                <div>
                    <div>Total Estimated Value</div>
                    <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 2px;">Sum of API savings, developer hours ($75/hr), and defect prevention</div>
                </div>
                <span class="stat-value money" style="font-size: 1.4rem;">$${data.savings.totalEstimatedROI.toFixed(2)}</span>
            </div>
        </div>
    </div>

    <!-- Actionable Issues -->
    <div class="card">
        <h3>Actionable Insights & Issues (${data.issues.length})</h3>
        ${data.issues.length === 0 ? '<p style="color: var(--success); text-align: center; padding: 2rem;">🎉 No issues found! Your codebase is pristine.</p>' : `
        <table class="issues-table">
            <thead>
                <tr>
                    <th>Severity</th>
                    <th>File</th>
                    <th>Issue Description</th>
                </tr>
            </thead>
            <tbody>
                ${data.issues.map(i => `
                <tr>
                    <td><span class="badge ${i.severity}">${i.severity}</span></td>
                    <td style="font-family: monospace; color: var(--primary);">${i.file}</td>
                    <td>${i.description}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        `}
    </div>

</body>
</html>`;

    await mkdir(join(outputPath, '..'), { recursive: true });
    await writeFile(outputPath, html, 'utf-8');
    return html;
  }

  private static getScoreClass(score: number): string {
    if (score >= 90) return 'score-excellent';
    if (score >= 75) return 'score-good';
    if (score >= 60) return 'score-fair';
    return 'score-poor';
  }

  private static getTextClass(score: number): string {
    if (score >= 90) return 'text-success';
    if (score >= 75) return 'text-primary';
    if (score >= 60) return 'text-warning';
    return 'text-danger';
  }
}
