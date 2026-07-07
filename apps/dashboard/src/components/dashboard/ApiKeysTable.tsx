"use client";

import React, { useState, useTransition, useMemo } from "react";
import { generateApiKey, revokeApiKey, rotateApiKey, deleteApiKey } from "@/actions/apikeys";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ApiKey = {
  id: string;
  projectId: string;
  keyPrefix: string;
  name: string;
  permissions: string[];
  rateLimit: number;
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
};

export default function ApiKeysTable({
  projectId,
  initialKeys,
}: {
  projectId: string;
  initialKeys: ApiKey[];
}) {
  const router = useRouter();
  const [, setKeys] = useState(initialKeys);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [permissions, setPermissions] = useState<string[]>(["chat:write", "models:read"]);
  const [rateLimit, setRateLimit] = useState(60);
  
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [, setGeneratedKeyPrefix] = useState<string | null>(null);
  const [revokeConfirmId, setRevokeConfirmId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [rotatedKey, setRotatedKey] = useState<{ id: string; key: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  // Pagination
  const LIMIT = 7;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(initialKeys.length / LIMIT));

  const paginatedKeys = useMemo(() => {
    const start = (page - 1) * LIMIT;
    return initialKeys.slice(start, start + LIMIT);
  }, [initialKeys, page]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || permissions.length === 0) return;
    setLoading(true);
    const res = await generateApiKey(projectId, newKeyName, permissions, rateLimit);
    setLoading(false);
    if (res.success && res.apiKey && res.keyPrefix) {
      setGeneratedKey(res.apiKey);
      setGeneratedKeyPrefix(res.keyPrefix);
      setShowGenerateModal(false);
      setNewKeyName("");
      setPermissions(["chat:write", "models:read"]);
      setRateLimit(60);
      startTransition(() => {
        router.refresh();
      });
    } else {
      alert(res.error || "Failed to generate key");
    }
  };

  const handleRevoke = async (keyId: string) => {
    setLoading(true);
    const res = await revokeApiKey(keyId, projectId);
    setLoading(false);
    if (res.success) {
      setRevokeConfirmId(null);
      setKeys((prev) => prev.map((k) => (k.id === keyId ? { ...k, isActive: false } : k)));
      startTransition(() => {
        router.refresh();
      });
    } else {
      alert(res.error || "Failed to revoke key");
    }
  };

  const handleDelete = async (keyId: string) => {
    setLoading(true);
    const res = await deleteApiKey(keyId, projectId);
    setLoading(false);
    if (res.success) {
      setDeleteConfirmId(null);
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
      startTransition(() => {
        router.refresh();
      });
    } else {
      alert(res.error || "Failed to delete key");
    }
  };

  const handleRotate = async (keyId: string) => {
    setLoading(true);
    const res = await rotateApiKey(keyId, projectId);
    setLoading(false);
    if (res.success && res.apiKey) {
      setRotatedKey({ id: keyId, key: res.apiKey });
      setKeys((prev) => prev.map((k) => (k.id === keyId ? { ...k, isActive: false } : k)));
      startTransition(() => {
        router.refresh();
      });
    } else {
      alert(res.error || "Failed to rotate key");
    }
  };

  const togglePermission = (perm: string) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-[52px] shrink-0 bg-[#0D0D0F]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-medium text-white/90 tracking-wide">API Keys</h1>
          <span className="text-xs font-medium text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
            {initialKeys.length}
          </span>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="text-[13px] font-medium text-white bg-violet-600 hover:bg-violet-500 px-3 py-1.5 rounded-md transition-colors"
        >
          + Generate Key
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-[22px]">
        <div className="bg-white/[0.015] border border-white/[0.08] rounded-[11px] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12]">
          {initialKeys.length === 0 ? (
            <div className="p-12 text-center text-white/40 text-[13px]">
              No API keys found. Generate one to get started.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.05] text-[13px] text-white/40">
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[12px]">Name</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[12px]">Key Prefix</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[12px]">Permissions</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[12px]">Status</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[12px]">Created</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[12px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-white/80">
                {paginatedKeys.map((key) => (
                  <tr key={key.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-medium text-white/90">{key.name}</td>
                    <td className="px-6 py-4 font-mono text-white/60">{key.keyPrefix}...</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1.5 flex-wrap">
                        {key.permissions.map((p) => (
                          <span key={p} className="text-[11px] px-1.5 py-0.5 rounded border border-white/10 text-white/50 bg-white/5">
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {key.isActive ? (
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_currentColor]"></span>
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-white/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                          Revoked
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-white/40">
                      {new Date(key.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {key.isActive ? (
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleRotate(key.id)}
                            disabled={loading}
                            className="text-white/40 hover:text-white transition-colors cursor-pointer"
                          >
                            Rotate
                          </button>
                          {revokeConfirmId === key.id ? (
                            <button
                              onClick={() => handleRevoke(key.id)}
                              disabled={loading}
                              className="text-red-400 hover:text-red-400/80 font-medium transition-colors cursor-pointer"
                            >
                              Confirm
                            </button>
                          ) : (
                            <button
                              onClick={() => setRevokeConfirmId(key.id)}
                              disabled={loading}
                              className="text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-3">
                          {deleteConfirmId === key.id ? (
                            <button
                              onClick={() => handleDelete(key.id)}
                              disabled={loading}
                              className="text-red-400 hover:text-red-400/80 font-medium transition-colors cursor-pointer"
                            >
                              Confirm Delete
                            </button>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(key.id)}
                              disabled={loading}
                              className="text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {initialKeys.length > LIMIT && (
            <div className="px-5 py-3 border-t border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
              <span className="text-[12px] text-white/40">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-[12px] font-medium text-white/80 bg-white/5 hover:bg-white/10 rounded-md disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer border-none"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-[12px] font-medium text-white/80 bg-white/5 hover:bg-white/10 rounded-md disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer border-none"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D0D0F] border border-white/[0.08] rounded-[11px] p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-medium text-white/90 mb-4">Generate New Key</h2>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-[13px] text-white/60 mb-1.5">Key Name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-[14px] text-white focus:outline-none focus:border-violet-500/50"
                  placeholder="e.g. Production Env"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[13px] text-white/60 mb-1.5">Rate Limit (req/min)</label>
                <input
                  type="number"
                  value={rateLimit}
                  onChange={(e) => setRateLimit(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-[14px] text-white focus:outline-none focus:border-violet-500/50"
                  min={1}
                />
              </div>
              <div>
                <label className="block text-[13px] text-white/60 mb-2">Permissions</label>
                <div className="space-y-2">
                  {[
                    { id: "chat:write", label: "Chat Generation (Write)" },
                    { id: "models:read", label: "Read Models" },
                    { id: "cache:read", label: "Read Cache" },
                    { id: "logs:read", label: "Read Logs" },
                  ].map((perm) => (
                    <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        className="accent-violet-500 rounded border-white/20 bg-white/5"
                      />
                      <span className="text-[13px] text-white/80">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="text-[13px] text-white/60 hover:text-white px-3 py-1.5 transition-colors cursor-pointer bg-transparent border-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !newKeyName.trim() || permissions.length === 0}
                  className="text-[13px] font-medium text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-4 py-1.5 rounded-md transition-colors cursor-pointer border-none"
                >
                  {loading ? "Generating..." : "Generate Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {(generatedKey || rotatedKey) && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D0D0F] border border-emerald-400/20 rounded-[11px] p-6 w-full max-w-lg shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-400"></div>
            <h2 className="text-xl font-medium text-white/90 mb-2">
              {rotatedKey ? "Key Rotated Successfully" : "Key Generated Successfully"}
            </h2>
            <p className="text-[14px] text-white/60 mb-6 leading-relaxed">
              Please copy this key and save it somewhere secure. For your protection, <strong className="text-white/90">you will not be able to see it again.</strong>
            </p>
            <div className="bg-white/5 border border-white/10 rounded-md p-3 flex items-center justify-between mb-6">
              <code className="text-[15px] font-mono text-emerald-400 break-all select-all">
                {rotatedKey ? rotatedKey.key : generatedKey}
              </code>
              <button
                onClick={() => {
                  copyToClipboard((rotatedKey ? rotatedKey.key : generatedKey) as string);
                  alert("Copied to clipboard");
                }}
                className="ml-4 text-xs font-medium bg-white/10 hover:bg-white/20 text-white/90 px-3 py-1.5 rounded transition-colors shrink-0 cursor-pointer border-none"
              >
                Copy
              </button>
            </div>
            <button
              onClick={() => {
                setGeneratedKey(null);
                setGeneratedKeyPrefix(null);
                setRotatedKey(null);
              }}
              className="w-full text-[14px] font-medium text-white/90 bg-white/10 hover:bg-white/20 py-2.5 rounded-md transition-colors cursor-pointer border-none"
            >
              I have saved my key
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
