// ============================================================
// @pgos/doc-engine — Savings Calculator
// Calculates real ROI metrics and savings from PGOS operations
// ============================================================

import { type CompiledContext } from '@pgos/core';

export interface SavingsMetrics {
  tokenSavings: {
    rawTokens: number;
    optimizedTokens: number;
    savedTokens: number;
    reductionPercentage: number;
  };
  costSavings: {
    estimatedInputCost: number;
    optimizedInputCost: number;
    savedCost: number;
    currency: string;
  };
  timeSavings: {
    estimatedManualReviewHours: number;
    automatedReviewSeconds: number;
    savedHours: number;
  };
  qualityMetrics: {
    issuesDetected: number;
    estimatedCostPerIssue: number;
    preventedDefectCost: number;
  };
  totalEstimatedROI: number;
}

export class SavingsCalculator {
  /**
   * Average input cost per 1M tokens (blended across GPT-4o and Claude-3.5)
   */
  private static readonly AVG_COST_PER_1M_TOKENS = 3.00; // USD

  /**
   * Average developer hourly rate
   */
  private static readonly AVG_DEV_HOURLY_RATE = 75.00; // USD

  /**
   * Calculate comprehensive savings metrics based on real context compilation data
   */
  static calculateSavings(
    contextResult: CompiledContext,
    antiPatternsDetected: number,
    durationMs: number
  ): SavingsMetrics {
    // 1. Token & API Cost Savings
    const rawTokens = contextResult.totalTokens || 0;
    const optimizedTokens = contextResult.optimizedTokens || 0;
    const savedTokens = Math.max(0, rawTokens - optimizedTokens);
    
    // Percentage reduction (cap at 99%)
    const reductionPercentage = rawTokens > 0 
      ? Math.min(99, Math.round((savedTokens / rawTokens) * 100)) 
      : 0;

    const estimatedInputCost = (rawTokens / 1_000_000) * this.AVG_COST_PER_1M_TOKENS;
    const optimizedInputCost = (optimizedTokens / 1_000_000) * this.AVG_COST_PER_1M_TOKENS;
    const savedCost = estimatedInputCost - optimizedInputCost;

    // 2. Time Savings
    // Estimate: a human takes ~1 minute to review 100 lines of code (roughly 1000 tokens)
    const estimatedManualReviewMinutes = rawTokens / 1000;
    const estimatedManualReviewHours = estimatedManualReviewMinutes / 60;
    const automatedReviewSeconds = durationMs / 1000;
    const automatedReviewHours = automatedReviewSeconds / 3600;
    const savedHours = Math.max(0, estimatedManualReviewHours - automatedReviewHours);

    // 3. Quality Savings (Defect Prevention)
    // Estimate: fixing an anti-pattern/defect in production costs 10x more than in dev (~$150/defect)
    const estimatedCostPerIssue = 150.00;
    const preventedDefectCost = antiPatternsDetected * estimatedCostPerIssue;

    // 4. Total ROI
    const totalEstimatedROI = savedCost + (savedHours * this.AVG_DEV_HOURLY_RATE) + preventedDefectCost;

    return {
      tokenSavings: {
        rawTokens,
        optimizedTokens,
        savedTokens,
        reductionPercentage,
      },
      costSavings: {
        estimatedInputCost,
        optimizedInputCost,
        savedCost,
        currency: 'USD',
      },
      timeSavings: {
        estimatedManualReviewHours,
        automatedReviewSeconds,
        savedHours,
      },
      qualityMetrics: {
        issuesDetected: antiPatternsDetected,
        estimatedCostPerIssue,
        preventedDefectCost,
      },
      totalEstimatedROI,
    };
  }

  /**
   * Generate a markdown summary of savings
   */
  static generateMarkdownSummary(metrics: SavingsMetrics): string {
    return `
### 💰 ROI & Savings Report

PGOS context compression and automated analysis delivered the following estimated savings on this run:

- **Token Reduction**: ${metrics.tokenSavings.reductionPercentage}% (${metrics.tokenSavings.savedTokens.toLocaleString()} tokens saved)
- **API Cost Saved**: $${metrics.costSavings.savedCost.toFixed(4)} USD per prompt
- **Manual Review Time Saved**: ${metrics.timeSavings.savedHours.toFixed(1)} hours
- **Defects Prevented**: ${metrics.qualityMetrics.issuesDetected} issues caught early (Est. savings: $${metrics.qualityMetrics.preventedDefectCost.toFixed(2)})

**Total Estimated ROI for this snapshot: $${metrics.totalEstimatedROI.toFixed(2)} USD**
`;
  }
}
