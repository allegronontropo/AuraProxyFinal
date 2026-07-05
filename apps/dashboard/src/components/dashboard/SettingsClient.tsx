"use client";

import React, { useState, useTransition } from "react";
import { updateProject, deleteProject } from "@/actions/project";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import CustomSelect from "@/components/ui/CustomSelect";

type Project = {
  id: string;
  name: string;
  budgetLimit: number;
  budgetPeriod: "DAILY" | "WEEKLY" | "MONTHLY";
};

type UserData = {
  name: string;
  email: string;
  image: string;
  plan: string;
};

export default function SettingsClient({
  project,
  user,
}: {
  project: Project;
  user: UserData;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [name, setName] = useState(project.name);
  const [budgetLimit, setBudgetLimit] = useState(project.budgetLimit);
  const [budgetPeriod, setBudgetPeriod] = useState<"DAILY" | "WEEKLY" | "MONTHLY">(project.budgetPeriod);
  
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setMessage(null);
    const res = await updateProject(project.id, {
      name,
      budgetLimit,
      budgetPeriod,
    });
    setLoading(false);
    if (res?.success) {
      setMessage({ type: 'success', text: "Workspace updated successfully" });
      startTransition(() => {
        router.refresh();
      });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: res?.error || "Failed to update workspace" });
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== project.name) return;
    setLoading(true);
    const res = await deleteProject(project.id);
    setLoading(false);
    if (res?.error) {
      setMessage({ type: 'error', text: res.error });
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-[52px] shrink-0 bg-[#0d0d0f]/80 backdrop-blur-md border-b border-white/5 flex items-center px-6 z-10 sticky top-0">
        <h1 className="text-[15px] font-medium text-white tracking-wide">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-[22px]">
        <div className="max-w-[680px] mx-auto space-y-8">
          
          <section>
            <h2 className="text-sm font-medium text-white/80 mb-4">Profile</h2>
            <div className="bg-white/[0.015] border border-white/[0.07] rounded-[11px] p-5 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                {user.image ? (
                  <Image src={user.image} alt="Avatar" width={64} height={64} className="object-cover" />
                ) : (
                  <span className="text-xl font-medium text-white/50">{user.name.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-[15px] font-medium text-white">{user.name}</h3>
                  <span className="text-[11px] font-medium text-violet-300 bg-violet-500/20 px-2 py-0.5 rounded border border-violet-500/20">
                    {user.plan} PLAN
                  </span>
                </div>
                <p className="text-[13px] text-white/50">{user.email}</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-medium text-white/80 mb-4">Workspace Configuration</h2>
            <form onSubmit={handleSave} className="bg-white/[0.015] border border-white/[0.07] rounded-[11px] p-5 space-y-5">
              <div>
                <label className="block text-[13px] text-white/60 mb-2">Workspace Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-[14px] text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] text-white/60 mb-2">Budget Limit (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={budgetLimit}
                    onChange={(e) => setBudgetLimit(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-[14px] text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-white/60 mb-2">Budget Period</label>
                  <CustomSelect
                    value={budgetPeriod}
                    onChange={(val) => setBudgetPeriod(val as "DAILY" | "WEEKLY" | "MONTHLY")}
                    options={[
                      { value: "DAILY", label: "Daily" },
                      { value: "WEEKLY", label: "Weekly" },
                      { value: "MONTHLY", label: "Monthly" },
                    ]}
                    className="w-full"
                    buttonClassName="!py-2 !px-3 border-white/10"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                {message ? (
                  <div className={`text-[13px] ${message.type === 'success' ? 'text-green-400' : 'text-[#ef4444]'}`}>
                    {message.text}
                  </div>
                ) : (
                  <div></div>
                )}
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="text-[13px] font-medium text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </section>

          <section>
            <h2 className="text-sm font-medium text-white/80 mb-4">Quick Links</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link href={`/dashboard/${project.id}/keys`} className="bg-white/[0.015] border border-white/[0.07] hover:border-white/20 rounded-[11px] p-5 transition-colors group">
                <h3 className="text-[14px] font-medium text-white mb-1 group-hover:text-violet-400 transition-colors">API Keys →</h3>
                <p className="text-[12px] text-white/50">Manage access tokens and permissions</p>
              </Link>
              <Link href={`/dashboard/${project.id}/logs`} className="bg-white/[0.015] border border-white/[0.07] hover:border-white/20 rounded-[11px] p-5 transition-colors group">
                <h3 className="text-[14px] font-medium text-white mb-1 group-hover:text-violet-400 transition-colors">Request Logs →</h3>
                <p className="text-[12px] text-white/50">View recent API requests and errors</p>
              </Link>
            </div>
          </section>

          <section className="pt-4">
            <h2 className="text-sm font-medium text-[#ef4444] mb-4">Danger Zone</h2>
            <div className="bg-[#ef4444]/[0.02] border border-[#ef4444]/20 rounded-[11px] p-5">
              <h3 className="text-[14px] font-medium text-white mb-2">Delete Workspace</h3>
              <p className="text-[13px] text-white/60 mb-5">
                Permanently delete this workspace and all its data (API keys, logs, cache). This action cannot be undone.
              </p>
              
              <div className="space-y-3 max-w-sm">
                <div>
                  <label className="block text-[12px] text-white/50 mb-1.5">
                    Type <strong>{project.name}</strong> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    className="w-full bg-black/20 border border-[#ef4444]/30 rounded-md px-3 py-2 text-[14px] text-white focus:outline-none focus:border-[#ef4444]/60 transition-colors"
                  />
                </div>
                <button
                  onClick={handleDelete}
                  disabled={loading || deleteConfirm !== project.name}
                  className="w-full text-[13px] font-medium text-white bg-[#ef4444]/80 hover:bg-[#ef4444] disabled:opacity-50 px-4 py-2 rounded-md transition-colors"
                >
                  {loading ? "Deleting..." : "Delete Workspace"}
                </button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
