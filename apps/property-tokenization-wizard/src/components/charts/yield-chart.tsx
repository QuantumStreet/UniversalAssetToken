"use client";

import { useMemo } from "react";
import { TrendingUp, DollarSign, Percent, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";

export type YieldData = {
  annualRentalIncome: number;
  annualExpenses: number;
  tokenSupply: number;
  distributionRate: number; // e.g., 90
  reserveFundRate: number; // e.g., 10
  trusteeFeeRate: number; // e.g., 1
};

export type YieldMetrics = {
  grossIncome: number;
  netIncome: number;
  distributionPool: number;
  reserveFund: number;
  trusteeFees: number;
  yieldPerToken: number;
  monthlyYieldPerToken: number;
  annualYieldPercent: number;
  tokenPrice: number;
};

export function YieldChart({ data, tokenPrice }: { data: YieldData; tokenPrice: number }) {
  const metrics = useMemo((): YieldMetrics => {
    const grossIncome = data.annualRentalIncome;
    const netIncome = grossIncome - data.annualExpenses;
    
    // Calculate distributions based on rates
    const distributionPool = (netIncome * data.distributionRate) / 100;
    const reserveFund = (netIncome * data.reserveFundRate) / 100;
    const trusteeFees = (netIncome * data.trusteeFeeRate) / 100;
    
    // Per-token calculations
    const yieldPerToken = distributionPool / data.tokenSupply;
    const monthlyYieldPerToken = yieldPerToken / 12;
    const annualYieldPercent = (yieldPerToken / tokenPrice) * 100;
    
    return {
      grossIncome,
      netIncome,
      distributionPool,
      reserveFund,
      trusteeFees,
      yieldPerToken,
      monthlyYieldPerToken,
      annualYieldPercent,
      tokenPrice
    };
  }, [data, tokenPrice]);

  const maxValue = metrics.grossIncome;

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Yield per Token"
          value={`$${metrics.yieldPerToken.toFixed(2)}`}
          subtext="annually"
          color="text-green-400"
          bgColor="bg-green-500/10"
        />
        <MetricCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Annual Return"
          value={`${metrics.annualYieldPercent.toFixed(2)}%`}
          subtext="of token price"
          color="text-cyan-400"
          bgColor="bg-cyan-500/10"
        />
        <MetricCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Monthly Income"
          value={`$${metrics.monthlyYieldPerToken.toFixed(2)}`}
          subtext="per token"
          color="text-purple-400"
          bgColor="bg-purple-500/10"
        />
        <MetricCard
          icon={<PiggyBank className="h-5 w-5" />}
          label="Total Distribution"
          value={`$${metrics.distributionPool.toLocaleString()}`}
          subtext="to all holders"
          color="text-blue-400"
          bgColor="bg-blue-500/10"
        />
      </div>

      {/* Income Breakdown Chart */}
      <div className="rounded-2xl border border-[var(--accent)]/30 bg-[rgba(34,211,238,0.05)] p-6">
        <h4 className="text-lg font-semibold text-[var(--color-foreground)] mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[var(--accent)]" />
          Annual Income Distribution
        </h4>

        <div className="space-y-4">
          {/* Gross Income */}
          <BarRow
            label="Gross Rental Income"
            value={metrics.grossIncome}
            maxValue={maxValue}
            color="bg-blue-500"
            textColor="text-blue-400"
            percentage={100}
          />

          {/* Expenses */}
          <BarRow
            label="Operating Expenses"
            value={data.annualExpenses}
            maxValue={maxValue}
            color="bg-red-500"
            textColor="text-red-400"
            percentage={(data.annualExpenses / maxValue) * 100}
            isNegative
          />

          <div className="border-t border-[var(--accent)]/20 pt-3 mt-2" />

          {/* Net Income */}
          <BarRow
            label="Net Operating Income"
            value={metrics.netIncome}
            maxValue={maxValue}
            color="bg-green-500"
            textColor="text-green-400"
            percentage={(metrics.netIncome / maxValue) * 100}
            highlight
          />

          <div className="border-t border-[var(--accent)]/20 pt-3 mt-2" />

          {/* Distribution Pool */}
          <BarRow
            label={`Distribution to Token Holders (${data.distributionRate}%)`}
            value={metrics.distributionPool}
            maxValue={maxValue}
            color="bg-[var(--accent)]"
            textColor="text-[var(--accent)]"
            percentage={(metrics.distributionPool / maxValue) * 100}
          />

          {/* Reserve Fund */}
          <BarRow
            label={`Reserve Fund (${data.reserveFundRate}%)`}
            value={metrics.reserveFund}
            maxValue={maxValue}
            color="bg-yellow-500"
            textColor="text-yellow-400"
            percentage={(metrics.reserveFund / maxValue) * 100}
          />

          {/* Trustee Fees */}
          {data.trusteeFeeRate > 0 && (
            <BarRow
              label={`Trustee Fees (${data.trusteeFeeRate}%)`}
              value={metrics.trusteeFees}
              maxValue={maxValue}
              color="bg-purple-500"
              textColor="text-purple-400"
              percentage={(metrics.trusteeFees / maxValue) * 100}
            />
          )}
        </div>
      </div>

      {/* Per-Token Breakdown */}
      <div className="rounded-xl border border-[var(--color-card-border)]/50 bg-[rgba(6,11,26,0.8)] p-6">
        <h4 className="text-sm font-semibold text-[var(--color-foreground)] mb-4">
          Return on Investment (Per Token)
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-xs text-[var(--muted)]">Token Price</p>
            <p className="text-2xl font-bold text-[var(--accent)]">
              ${tokenPrice.toLocaleString()}
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="text-xs text-[var(--muted)]">Annual Yield</p>
            <p className="text-2xl font-bold text-green-400">
              ${metrics.yieldPerToken.toFixed(2)}
            </p>
            <p className="text-xs text-green-400">
              {metrics.annualYieldPercent.toFixed(2)}% return
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="text-xs text-[var(--muted)]">Monthly Distribution</p>
            <p className="text-2xl font-bold text-cyan-400">
              ${metrics.monthlyYieldPerToken.toFixed(2)}
            </p>
            <p className="text-xs text-cyan-400">
              Per token, per month
            </p>
          </div>
        </div>

        {/* Example Investment */}
        <div className="mt-6 pt-6 border-t border-[var(--accent)]/20">
          <p className="text-xs text-[var(--muted)] mb-3">Example: 100 Token Investment</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-[var(--muted)]">Investment</p>
              <p className="text-lg font-semibold text-[var(--color-foreground)]">
                ${(tokenPrice * 100).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Annual Return</p>
              <p className="text-lg font-semibold text-green-400">
                ${(metrics.yieldPerToken * 100).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">ROI</p>
              <p className="text-lg font-semibold text-cyan-400">
                {metrics.annualYieldPercent.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg border border-yellow-500/30 bg-yellow-900/10 p-4">
        <p className="text-xs text-yellow-200">
          ⚠️ <strong>Disclaimer:</strong> Projected yields are estimates based on current rental income and expenses. 
          Actual returns may vary due to market conditions, vacancy rates, maintenance costs, and other factors. 
          This is not financial advice.
        </p>
      </div>
    </div>
  );
}

function MetricCard({ 
  icon, 
  label, 
  value, 
  subtext, 
  color, 
  bgColor 
}: { 
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className={cn("rounded-xl border border-[var(--accent)]/20 p-4", bgColor)}>
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("rounded-lg p-1.5", bgColor)}>
          <div className={color}>{icon}</div>
        </div>
        <p className="text-xs text-[var(--muted)]">{label}</p>
      </div>
      <p className={cn("text-2xl font-bold", color)}>{value}</p>
      <p className="text-xs text-[var(--muted)] mt-1">{subtext}</p>
    </div>
  );
}

function BarRow({
  label,
  value,
  maxValue,
  color,
  textColor,
  percentage,
  isNegative = false,
  highlight = false
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  textColor: string;
  percentage: number;
  isNegative?: boolean;
  highlight?: boolean;
}) {
  const barWidth = Math.max(percentage, 2); // Minimum 2% for visibility

  return (
    <div className={cn(
      "space-y-2",
      highlight && "p-3 rounded-xl border border-green-500/30 bg-green-900/10"
    )}>
      <div className="flex items-center justify-between text-sm">
        <span className={cn(
          "font-medium",
          highlight ? "text-[var(--color-foreground)]" : "text-[var(--muted)]"
        )}>
          {isNegative && "- "}
          {label}
        </span>
        <span className={cn("font-bold", textColor)}>
          ${value.toLocaleString()}
        </span>
      </div>
      
      {/* Bar */}
      <div className="relative h-8 rounded-lg bg-[rgba(6,11,26,0.6)] overflow-hidden">
        <div
          className={cn(
            "absolute left-0 top-0 h-full transition-all duration-500",
            color,
            isNegative ? "opacity-50" : "opacity-100"
          )}
          style={{ width: `${barWidth}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-white/90">
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}


