"use client";

import { X, TrendingUp, DollarSign, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BusinessData } from "@/types/business";
import { calculateBusinessYields, formatCurrency, calculateCumulativeROI } from "@/services/businessYieldCalculator";

interface YieldCalculatorModalProps {
  businessData: BusinessData;
  onClose: () => void;
}

export function YieldCalculatorModal({ businessData, onClose }: YieldCalculatorModalProps) {
  const yields = calculateBusinessYields(businessData);
  const cumulativeROI = calculateCumulativeROI(yields.assumedTokenPrice, yields.projectedReturns);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border-2 border-[var(--accent)]/50 bg-[rgba(6,11,26,0.98)] shadow-2xl shadow-[var(--accent)]/20">
        {/* Header */}
        <div className="sticky top-0 bg-[rgba(6,11,26,0.98)] border-b border-[var(--accent)]/30 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[var(--accent)]/20">
              <Calculator className="text-[var(--accent)]" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[var(--color-foreground)]">
                Token Returns Projection
              </h2>
              <p className="text-sm text-[var(--muted)]">
                Projected yields based on profit distribution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--accent)]/10 text-[var(--muted)] hover:text-[var(--accent)] transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Company Summary */}
          <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4">
            <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-3">
              {businessData.companyName}
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-xs text-[var(--muted)]">Annual Revenue</div>
                <div className="font-semibold text-[var(--accent)]">
                  {formatCurrency(businessData.annualRevenue || 0)}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--muted)]">EBITDA</div>
                <div className="font-semibold text-[var(--accent)]">
                  {formatCurrency(yields.ebitda)}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--muted)]">Growth Rate</div>
                <div className="font-semibold text-[var(--accent)]">
                  {yields.assumptions.growthRate.toFixed(0)}% YoY
                </div>
              </div>
            </div>
          </div>

          {/* Cash Flow Waterfall */}
          <div className="rounded-xl border border-[var(--accent)]/20 bg-[rgba(8,12,26,0.7)] p-6 space-y-4">
            <h3 className="text-lg font-semibold text-[var(--color-foreground)] flex items-center gap-2">
              <DollarSign size={20} className="text-[var(--accent)]" />
              Cash Flow Waterfall
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-[var(--accent)]/10">
                <span className="text-sm text-[var(--muted)]">EBITDA</span>
                <span className="font-semibold text-[var(--color-foreground)]">
                  {formatCurrency(yields.ebitda)}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--muted)]">- CAPEX ({yields.assumptions.capexRate}%)</span>
                <span className="text-red-400">
                  -{formatCurrency(yields.estimatedCapex)}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--muted)]">- Taxes ({yields.assumptions.taxRate}%)</span>
                <span className="text-red-400">
                  -{formatCurrency(yields.estimatedTaxes)}
                </span>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-[var(--accent)]/30">
                <span className="font-semibold text-[var(--color-foreground)]">Free Cash Flow</span>
                <span className="text-xl font-bold text-[var(--accent)]">
                  {formatCurrency(yields.freeCashFlow)}
                </span>
              </div>
            </div>
          </div>

          {/* Distribution Policy */}
          <div className="rounded-xl border border-[var(--accent)]/20 bg-[rgba(8,12,26,0.7)] p-6 space-y-4">
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
              Distribution Policy
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--muted)]">
                  Token Holder Distribution ({yields.assumptions.distributionRate}%)
                </span>
                <span className="font-semibold text-green-400">
                  {formatCurrency(yields.totalDistributable)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--muted)]">
                  Reserve Fund ({yields.assumptions.reserveRate}%)
                </span>
                <span className="font-semibold text-[var(--accent)]">
                  {formatCurrency(yields.reserveFund)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--muted)]">
                  Trustee Fees ({yields.assumptions.feeRate}%)
                </span>
                <span className="font-semibold text-[var(--muted)]">
                  {formatCurrency(yields.trusteeFees)}
                </span>
              </div>
            </div>
          </div>

          {/* Token Economics */}
          <div className="rounded-xl border border-[var(--accent)]/20 bg-[rgba(8,12,26,0.7)] p-6 space-y-4">
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
              Token Economics
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-[var(--muted)] mb-1">Total Token Supply</div>
                <div className="text-xl font-bold text-[var(--accent)]">
                  {yields.assumedTokenSupply.toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-xs text-[var(--muted)] mb-1">Price per Token</div>
                <div className="text-xl font-bold text-[var(--accent)]">
                  ${yields.assumedTokenPrice}
                </div>
              </div>

              <div>
                <div className="text-xs text-[var(--muted)] mb-1">Annual Yield</div>
                <div className="text-xl font-bold text-green-400">
                  {yields.annualYieldPercentage.toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-[var(--accent)]/5 border border-[var(--accent)]/20 p-4">
              <div className="text-xs text-[var(--muted)] mb-2">Annual Distribution per Token</div>
              <div className="text-3xl font-bold text-[var(--accent)]">
                ${yields.distributionPerToken.toFixed(2)}
              </div>
              <div className="text-xs text-[var(--muted)] mt-1">
                = {yields.annualYieldPercentage.toFixed(2)}% return on ${yields.assumedTokenPrice} investment
              </div>
            </div>
          </div>

          {/* 5-Year Projections */}
          <div className="rounded-xl border border-[var(--accent)]/20 bg-[rgba(8,12,26,0.7)] p-6 space-y-4">
            <h3 className="text-lg font-semibold text-[var(--color-foreground)] flex items-center gap-2">
              <TrendingUp size={20} className="text-[var(--accent)]" />
              5-Year Return Projections
            </h3>

            <p className="text-xs text-[var(--muted)]">
              Assuming {yields.assumptions.growthRate.toFixed(0)}% annual growth in cash flow
            </p>

            <div className="space-y-3">
              <div className="rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-foreground)]">Year 1</div>
                    <div className="text-xs text-[var(--muted)]">
                      {yields.annualYieldPercentage.toFixed(1)}% yield
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[var(--accent)]">
                      ${yields.projectedReturns.year1.toFixed(2)}
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      per token
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-foreground)]">Year 2</div>
                    <div className="text-xs text-green-400">
                      +{yields.assumptions.growthRate.toFixed(0)}% growth
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[var(--accent)]">
                      ${yields.projectedReturns.year2.toFixed(2)}
                    </div>
                    <div className="text-xs text-green-400">
                      +{((yields.projectedReturns.year2 / yields.projectedReturns.year1 - 1) * 100).toFixed(0)}% from Year 1
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-foreground)]">Year 3</div>
                    <div className="text-xs text-[var(--muted)]">
                      Cumulative ROI: {cumulativeROI.year3.toFixed(0)}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[var(--accent)]">
                      ${yields.projectedReturns.year3.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/10 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-foreground)]">Year 5</div>
                    <div className="text-xs text-green-400">
                      Cumulative ROI: {cumulativeROI.year5.toFixed(0)}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-[var(--accent)]">
                      ${yields.projectedReturns.year5.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Investment Example */}
          <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
              💎 Investment Example
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted)]">Investment (100 tokens @ ${yields.assumedTokenPrice})</span>
                <span className="font-semibold text-[var(--color-foreground)]">
                  ${(yields.assumedTokenPrice * 100).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted)]">Year 1 Distribution</span>
                <span className="font-semibold text-green-400">
                  ${(yields.projectedReturns.year1 * 100).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted)]">5-Year Total Returns</span>
                <span className="font-semibold text-green-400">
                  ${((yields.projectedReturns.year1 + yields.projectedReturns.year2 + yields.projectedReturns.year3 + yields.projectedReturns.year3 * 1.28 + yields.projectedReturns.year5) * 100).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-purple-500/20">
                <span className="font-semibold text-[var(--color-foreground)]">5-Year ROI</span>
                <span className="text-2xl font-bold text-purple-400">
                  {cumulativeROI.year5.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Assumptions */}
          <details className="rounded-xl border border-[var(--accent)]/20 bg-[rgba(8,12,26,0.7)] p-4">
            <summary className="text-sm font-semibold text-[var(--accent)] cursor-pointer hover:underline">
              📊 View Assumptions & Methodology
            </summary>
            <div className="mt-4 space-y-2 text-xs text-[var(--muted)]">
              <div className="grid grid-cols-2 gap-2">
                <div>• Distribution Rate: {yields.assumptions.distributionRate}%</div>
                <div>• Reserve Fund: {yields.assumptions.reserveRate}%</div>
                <div>• Trustee Fees: {yields.assumptions.feeRate}%</div>
                <div>• Tax Rate: {yields.assumptions.taxRate}%</div>
                <div>• CAPEX Rate: {yields.assumptions.capexRate}%</div>
                <div>• Growth Rate: {yields.assumptions.growthRate}%</div>
              </div>
              
              <div className="pt-3 mt-3 border-t border-[var(--accent)]/10 text-[10px]">
                <p className="text-[var(--muted)]">
                  <strong>Methodology:</strong> Free Cash Flow = EBITDA - CAPEX - Taxes. 
                  Distributions calculated as {yields.assumptions.distributionRate}% of FCF divided by total token supply.
                  Projections assume {yields.assumptions.growthRate}% annual growth in cash flow.
                </p>
                <p className="text-yellow-400 mt-2">
                  ⚠️ Disclaimer: These are projections based on current financials and assumptions. 
                  Actual returns may vary. Not investment advice.
                </p>
              </div>
            </div>
          </details>

          {/* Close Button */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg",
                "bg-[var(--accent)] text-[#041321] font-semibold",
                "hover:bg-[var(--accent)]/90 active:scale-95 transition-all"
              )}
            >
              Got It - Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

