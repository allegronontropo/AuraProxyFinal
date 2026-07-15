"use client";

import React, { useState, useTransition, useMemo, useEffect } from "react";
import { saveProviderCredential, deleteProviderCredential } from "@/actions/credentials";
import { useRouter } from "next/navigation";
import CustomSelect from "@/components/ui/CustomSelect";
import { ProviderIcon } from "@/components/ui/provider-icon";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Credential = {
  id: string;
  provider: string;
  label: string;
  isActive: boolean;
  createdAt: Date;
};

const PROVIDERS = [
  { value: "openai",    label: "OpenAI",    hint: "sk-..." },
  { value: "anthropic", label: "Anthropic", hint: "sk-ant-..." },
  { value: "google",   label: "Google",    hint: "AIza..." },
  { value: "mistral",  label: "Mistral",   hint: "..." },
  { value: "groq",     label: "Groq",      hint: "gsk_..." },
];

const PROVIDER_COLORS: Record<string, { bg: string; color: string }> = {
  openai:    { bg: "rgba(16,163,127,0.12)",  color: "#10a37f" },
  anthropic: { bg: "rgba(210,105,30,0.12)",  color: "#d2691e" },
  google:    { bg: "rgba(66,133,244,0.12)",  color: "#4285f4" },
  mistral:   { bg: "rgba(167,139,250,0.12)", color: "#a78bfa" },
  groq:      { bg: "rgba(245,80,54,0.12)",   color: "#f55036" },
};

export default function ProviderCredentialsSection({
  projectId,
  initialCredentials,
}: {
  projectId: string;
  initialCredentials: Credential[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [credentials, setCredentials] = useState<Credential[]>(initialCredentials);
  
  // Sync state when router.refresh() fetches new initialCredentials
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCredentials(initialCredentials);
  }, [initialCredentials]);

  const [showForm, setShowForm] = useState(false);
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Pagination
  const CRED_LIMIT = 7;
  const [credPage, setCredPage] = useState(1);
  const totalCredPages = Math.max(1, Math.ceil(credentials.length / CRED_LIMIT));

  const paginatedCredentials = useMemo(() => {
    const start = (credPage - 1) * CRED_LIMIT;
    return credentials.slice(start, start + CRED_LIMIT);
  }, [credentials, credPage]);

  const providerOptions = PROVIDERS.map((p) => ({
    value: p.value,
    label: (
      <div className="flex items-center gap-2">
        <ProviderIcon provider={p.value} size={14} type="color" />
        <span>{p.label}</span>
      </div>
    ),
  }));

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await saveProviderCredential(projectId, provider, apiKey, label || provider);
    setLoading(false);

    if (res?.success) {
      showMessage("success", `${provider} credentials saved successfully.`);
      setApiKey("");
      setLabel("");
      setShowForm(false);
      startTransition(() => router.refresh());
    } else {
      showMessage("error", res?.error ?? "Failed to save credential.");
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    const res = await deleteProviderCredential(id, projectId);
    setLoading(false);

    if (res?.success) {
      setCredentials((prev) => prev.filter((c) => c.id !== id));
      setDeleteConfirmId(null);
      showMessage("success", "Credential removed.");
    } else {
      showMessage("error", res?.error ?? "Failed to remove credential.");
    }
  };

  return (
    <section className="mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[13px] font-semibold text-white/80 uppercase tracking-wider">
            Provider Credentials
          </h2>
          <p className="text-[12px] text-white/40 mt-1">
            Add your own LLM provider API keys. These override server defaults for this project.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-[12px] font-medium text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md transition-colors border border-white/10"
        >
          {showForm ? "Cancel" : "+ Add Credential"}
        </button>
      </div>

      {/* Feedback message */}
      {message && (
        <div
          className={`text-[12px] px-3 py-2 rounded-md mb-4 ${
            message.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Add credential form */}
      {showForm && (
        <form
          onSubmit={handleSave}
          className="bg-white/[0.015] border border-white/[0.08] rounded-[11px] p-5 mb-5 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] text-white/50 mb-1.5">Provider</label>
              <CustomSelect
                value={provider}
                onChange={(val) => setProvider(val)}
                options={providerOptions}
                className="w-full"
                buttonClassName="!py-2 !px-3 border-white/10"
              />
            </div>
            <div>
              <label className="block text-[12px] text-white/50 mb-1.5">Label (optional)</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={`My ${provider} key`}
                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] text-white/50 mb-1.5">
              API Key{" "}
              <span className="text-white/25">
                - stored encrypted, never shown again
              </span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={PROVIDERS.find((p) => p.value === provider)?.hint ?? "sk-..."}
              required
              className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-[13px] text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={loading || apiKey.trim().length < 8}
              className="text-[13px] font-medium text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-4 py-2 rounded-md transition-colors"
            >
              {loading ? "Saving…" : "Save Credential"}
            </button>
          </div>
        </form>
      )}

      {/* Credentials table */}
      {credentials.length === 0 ? (
        <div className="bg-white/[0.01] border border-dashed border-white/[0.08] rounded-[11px] py-10 flex flex-col items-center text-center gap-2">
          <span className="text-2xl">🔑</span>
          <p className="text-[13px] text-white/40">No provider credentials configured.</p>
          <p className="text-[12px] text-white/25">
            Add credentials to route requests through your own LLM provider accounts.
          </p>
        </div>
      ) : (
        <div className="bg-white/[0.015] border border-white/[0.08] rounded-[11px] overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/[0.025]">
                {["PROVIDER", "LABEL", "ADDED", "STATUS", ""].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-[10px] font-semibold text-white/40 uppercase tracking-widest"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedCredentials.map((cred) => {
                const chip = PROVIDER_COLORS[cred.provider] ?? {
                  bg: "rgba(255,255,255,0.08)",
                  color: "#9ca3af",
                };
                return (
                  <tr key={cred.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <span
                        style={{ background: chip.bg, color: chip.color }}
                        className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded capitalize"
                      >
                        {cred.provider}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-white/70">{cred.label}</td>
                    <td className="px-5 py-3.5 text-[12px] text-white/40 font-mono" suppressHydrationWarning>
                      {new Date(cred.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded ${
                          cred.isActive
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-white/5 text-white/30"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${cred.isActive ? "bg-emerald-400" : "bg-white/20"}`}
                        />
                        {cred.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {deleteConfirmId === cred.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[11px] text-white/40">Remove?</span>
                          <button
                            onClick={() => handleDelete(cred.id)}
                            disabled={loading}
                            className="text-[11px] font-medium text-red-400 hover:text-red-300 transition-colors"
                          >
                            Yes, delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-[11px] text-white/30 hover:text-white/60 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(cred.id)}
                          className="text-[11px] text-white/25 hover:text-red-400 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {credentials.length > CRED_LIMIT && (
            <div className="px-5 py-3 border-t border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
              <span className="text-[12px] text-white/40">
                Page {credPage} of {totalCredPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCredPage((p) => Math.max(1, p - 1))}
                  disabled={credPage === 1}
                  className="px-3 py-1.5 text-[12px] font-medium text-white/80 bg-white/5 hover:bg-white/10 rounded-md disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer border-none"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>
                <button
                  onClick={() => setCredPage((p) => Math.min(totalCredPages, p + 1))}
                  disabled={credPage === totalCredPages}
                  className="px-3 py-1.5 text-[12px] font-medium text-white/80 bg-white/5 hover:bg-white/10 rounded-md disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer border-none"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
