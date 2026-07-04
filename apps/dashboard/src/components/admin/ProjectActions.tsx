"use client";

import React, { useState, useTransition } from "react";
import { toggleProjectSuspension, overrideProjectBudget } from "@/actions/admin";

export default function ProjectActions({ 
  projectId, 
  isActive, 
  currentBudget 
}: { 
  projectId: string; 
  isActive: boolean; 
  currentBudget: number 
}) {
  const [isPending, startTransition] = useTransition();
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [newBudget, setNewBudget] = useState(currentBudget);

  const handleToggleSuspension = () => {
    startTransition(async () => {
      await toggleProjectSuspension(projectId, !isActive);
    });
  };

  const handleOverrideBudget = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await overrideProjectBudget(projectId, newBudget);
      setShowBudgetModal(false);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggleSuspension}
        disabled={isPending}
        className={`px-3 py-1 rounded text-[11px] font-medium transition-colors ${
          isActive
            ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
            : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
        } disabled:opacity-50`}
      >
        {isPending ? "..." : isActive ? "Suspend" : "Activate"}
      </button>

      <button
        onClick={() => setShowBudgetModal(true)}
        disabled={isPending}
        className="px-3 py-1 rounded text-[11px] font-medium bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors disabled:opacity-50"
      >
        Set Budget
      </button>

      {showBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#151518] border border-white/10 rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-[15px] font-semibold text-white mb-2">Override Budget</h3>
            <p className="text-[13px] text-white/50 mb-6">
              Set a new budget limit for this project.
            </p>
            <form onSubmit={handleOverrideBudget}>
              <div className="mb-6">
                <label className="block text-[12px] text-white/50 mb-1.5">New Budget Limit ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newBudget}
                  onChange={(e) => setNewBudget(parseFloat(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-[14px] text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="px-4 py-2 text-[13px] font-medium text-white/60 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-[13px] font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-md transition-colors disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Budget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
