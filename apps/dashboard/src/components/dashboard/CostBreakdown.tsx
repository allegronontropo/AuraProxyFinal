"use client";

import React from "react";
import { AlertCircle, TrendingUp, DollarSign } from "lucide-react";

interface BudgetStatus {
  used: number;
  limit: number;
  remaining: number;
  period: string;
  percentage: number;
  exceeded: boolean;
}

interface ModelCost {
  model: string;
  provider: string;
  _count: { id: number };
  _sum: { costUsd: number | null };
}

interface CostBreakdownProps {
  budgetStatus: BudgetStatus;
  modelBreakdown: ModelCost[];
}

export function CostBreakdown({ budgetStatus, modelBreakdown }: CostBreakdownProps) {
  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 60) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const topModels = [...modelBreakdown]
    .sort((a, b) => (b._sum.costUsd || 0) - (a._sum.costUsd || 0))
    .slice(0, 5);

  return (
    <div className="flex flex-col h-full bg-white/[0.015] border border-white/[0.08] rounded-[11px] px-5 py-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[15px] font-medium text-gray-100 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-gray-400" />
          Cost & Budget
        </h3>
      </div>

      {budgetStatus.exceeded && (
        <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold block mb-0.5">Budget Exceeded</span>
            You have exceeded your budget limit for this {budgetStatus.period}.
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="flex justify-between items-end mb-2">
          <div>
            <span className="text-2xl font-semibold text-gray-100">
              ${budgetStatus.used.toFixed(2)}
            </span>
            <span className="text-sm text-gray-500 ml-2">
              / ${budgetStatus.limit.toFixed(2)} limit
            </span>
          </div>
          <span className="text-sm font-medium text-gray-400">
            {budgetStatus.percentage.toFixed(1)}%
          </span>
        </div>

        <div className="h-2 w-full bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
              budgetStatus.percentage
            )}`}
            style={{ width: `${Math.min(budgetStatus.percentage, 100)}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-gray-500 text-right">
          Reset period: {budgetStatus.period}
        </div>
      </div>

      <div className="flex-1">
        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5" />
          Top Models by Cost
        </h4>

        {topModels.length > 0 ? (
          <div className="space-y-3">
            {topModels.map((item, idx) => {
              const cost = item._sum.costUsd || 0;
              return (
                <div
                  key={`${item.provider}-${item.model}-${idx}`}
                  className="flex items-center justify-between group"
                >
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-200 font-medium truncate max-w-[150px]">
                      {item.model}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {item.provider} • {item._count.id} reqs
                    </span>
                  </div>
                  <div className="text-sm text-gray-300 font-mono">
                    ${cost.toFixed(4)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-24 text-gray-500 text-sm border border-dashed border-[rgba(255,255,255,0.05)] rounded-lg">
            No cost data available
          </div>
        )}
      </div>
    </div>
  );
}
