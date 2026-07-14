"use client";

import React, { useState, useTransition } from "react";
import { updateProject, deleteProject } from "@/actions/project";
import { updatePassword, toggleEmailAlerts } from "@/actions/auth";
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
  hasPassword: boolean;
  sendAlerts: boolean;
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
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [sendAlerts, setSendAlerts] = useState(user.sendAlerts);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

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

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    const formData = new FormData();
    formData.append("currentPassword", passwordForm.currentPassword);
    formData.append("newPassword", passwordForm.newPassword);
    formData.append("confirmPassword", passwordForm.confirmPassword);

    setPasswordLoading(true);
    const res = await updatePassword(formData);
    setPasswordLoading(false);

    if (res?.success) {
      setPasswordMessage({ type: "success", text: res.success });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      startTransition(() => {
        router.refresh();
      });
      setTimeout(() => setPasswordMessage(null), 3000);
    } else {
      setPasswordMessage({ type: "error", text: res?.error || "Failed to update password." });
    }
  };

  const handleToggleAlerts = async () => {
    setAlertMessage(null);
    setAlertsLoading(true);
    const res = await toggleEmailAlerts(!sendAlerts);
    setAlertsLoading(false);
    if (res?.success) {
      setSendAlerts(!sendAlerts);
      setAlertMessage({ type: "success", text: res.success });
      setTimeout(() => setAlertMessage(null), 3000);
    } else {
      setAlertMessage({ type: "error", text: res?.error || "Failed to update settings." });
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
            <div className="bg-white/[0.015] border border-white/[0.08] rounded-[11px] p-5 flex items-center gap-4">
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
            <h2 className="text-sm font-medium text-white/80 mb-4">Security</h2>
            <form onSubmit={handlePasswordUpdate} className="bg-white/[0.015] border border-white/[0.08] rounded-[11px] p-5 space-y-5">
              <div>
                <h3 className="text-[14px] font-medium text-white mb-1">
                  {user.hasPassword ? "Update Password" : "Create Password"}
                </h3>
                <p className="text-[13px] text-white/50">
                  {user.hasPassword
                    ? "Confirm your current password before setting a new one."
                    : "Add a password so this account can also sign in with email credentials."}
                </p>
              </div>

              {user.hasPassword && (
                <div>
                  <label className="block text-[13px] text-white/60 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-[14px] text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                    autoComplete="current-password"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] text-white/60 mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-[14px] text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-white/60 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-[14px] text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                {passwordMessage ? (
                  <div className={`text-[13px] ${passwordMessage.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
                    {passwordMessage.text}
                  </div>
                ) : (
                  <div className="text-[12px] text-white/40">Minimum 6 characters.</div>
                )}
                <button
                  type="submit"
                  disabled={
                    passwordLoading ||
                    !passwordForm.newPassword ||
                    !passwordForm.confirmPassword ||
                    (user.hasPassword && !passwordForm.currentPassword)
                  }
                  className="text-[13px] font-medium text-white bg-violet-500/20 border border-violet-500/30 hover:bg-violet-500/30 px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                >
                  {passwordLoading ? "Saving..." : user.hasPassword ? "Update Password" : "Create Password"}
                </button>
              </div>
            </form>
          </section>

          <section>
            <h2 className="text-sm font-medium text-white/80 mb-4">Workspace Configuration</h2>
            <form onSubmit={handleSave} className="bg-white/[0.015] border border-white/[0.08] rounded-[11px] p-5 space-y-5">
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
                  <div className={`text-[13px] ${message.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
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
            <h2 className="text-sm font-medium text-white/80 mb-4">Notifications</h2>
            <div className="bg-white/[0.015] border border-white/[0.08] rounded-[11px] p-5 space-y-4">
              <div>
                <h3 className="text-[14px] font-medium text-white mb-1">Email Alerts</h3>
                <p className="text-[13px] text-white/50">
                  Receive email notifications for critical alerts and system events.
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[14px] text-white">{sendAlerts ? "Enabled" : "Disabled"}</span>
                  {alertMessage && (
                    <div className={`text-[12px] ${alertMessage.type === "success" ? "text-emerald-400" : "text-red-400"} mt-1`}>
                      {alertMessage.text}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleToggleAlerts}
                  disabled={alertsLoading}
                  className={`relative inline-flex items-center gap-2 px-4 py-1.5 text-[13px] font-medium rounded-full transition-all ${
                    sendAlerts
                      ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30"
                      : "bg-white/10 border border-white/20 text-white/60 hover:bg-white/20"
                  } disabled:opacity-50`}
                >
                  <span className={`w-8 h-4 rounded-full transition-colors ${
                    sendAlerts ? "bg-emerald-500" : "bg-white/30"
                  }`}>
                    <span className={`absolute rounded-full transition-transform ${
                      sendAlerts ? "translate-x-4" : "translate-x-0.5"
                    }`}></span>
                  </span>
                  {alertsLoading ? "Updating..." : sendAlerts ? "On" : "Off"}
                </button>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-medium text-white/80 mb-4">Quick Links</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link href={`/dashboard/${project.id}/keys`} className="bg-white/[0.015] border border-white/[0.08] hover:border-white/20 rounded-[11px] p-5 transition-colors group">
                <h3 className="text-[14px] font-medium text-white mb-1 group-hover:text-violet-400 transition-colors">API Keys →</h3>
                <p className="text-[12px] text-white/50">Manage access tokens and permissions</p>
              </Link>
              <Link href={`/dashboard/${project.id}/logs`} className="bg-white/[0.015] border border-white/[0.08] hover:border-white/20 rounded-[11px] p-5 transition-colors group">
                <h3 className="text-[14px] font-medium text-white mb-1 group-hover:text-violet-400 transition-colors">Request Logs →</h3>
                <p className="text-[12px] text-white/50">View recent API requests and errors</p>
              </Link>
            </div>
          </section>

          <section className="pt-4">
            <h2 className="text-sm font-medium text-red-400 mb-4">Danger Zone</h2>
            <div className="bg-red-400/5 border border-red-400/20 rounded-[11px] p-5">
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
                    className="w-full bg-black/20 border border-red-400/30 rounded-md px-3 py-2 text-[14px] text-white focus:outline-none focus:border-red-400/60 transition-colors"
                  />
                </div>
                <button
                  onClick={handleDelete}
                  disabled={loading || deleteConfirm !== project.name}
                  className="w-full text-[13px] font-medium text-white bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 disabled:opacity-50 px-4 py-2 rounded-md transition-colors"
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
