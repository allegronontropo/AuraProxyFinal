"use client";

import React from "react";
import { AlertCircle, TrendingUp } from "lucide-react";
import { ProviderIcon } from "@lobehub/icons";

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
    <div className="flex flex-col h-full bg-white/[0.015] border border-white/[0.08] rounded-[11px] px-5 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12]">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[13px] font-semibold text-gray-100 flex items-center gap-2">
          Cost & Budget
        </h3>
      </div>

      {budgetStatus.exceeded && (
        <div className="mb-4 px-3 py-2.5 rounded-[8px] bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold block mb-0.5">Budget Exceeded</span>
            You have exceeded your budget limit for this {budgetStatus.period}.
          </div>
        </div>
      )}

      <div className="mb-7">
        <div className="flex justify-between items-end mb-2">
          <div>
            <span className="text-[22px] font-bold tracking-tight text-white">
              ${budgetStatus.used.toFixed(2)}
            </span>
            <span className="text-xs text-gray-500 ml-1.5 font-medium">
              / ${budgetStatus.limit.toFixed(2)} limit
            </span>
          </div>
          <span className="text-[11px] font-semibold text-gray-400">
            {budgetStatus.percentage.toFixed(1)}%
          </span>
        </div>

        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
              budgetStatus.percentage
            )}`}
            style={{ width: `${Math.min(budgetStatus.percentage, 100)}%` }}
          />
        </div>
        <div className="mt-2 text-[10px] text-gray-500 text-right uppercase tracking-wider font-semibold">
          Reset period: {budgetStatus.period}
        </div>
      </div>

      <div className="flex-1">
        <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
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
                    <span className="text-xs text-gray-200 font-medium truncate max-w-[150px]">
                      {item.model}
                    </span>
                    <span className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                      <ProviderIcon provider={item.provider} size={12} type="color" />
                      {item.provider.charAt(0).toUpperCase() + item.provider.slice(1)} • {item._count.id} reqs
                    </span>
                  </div>
                  <div className="text-xs text-emerald-400 font-mono font-medium">
                    ${cost.toFixed(4)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-24 text-gray-500 text-xs font-medium border border-dashed border-white/[0.05] rounded-lg">
            No cost data available
          </div>
        )}
      </div>
    </div>
  );
}
