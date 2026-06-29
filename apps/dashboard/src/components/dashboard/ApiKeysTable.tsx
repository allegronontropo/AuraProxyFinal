"use client";

import React, { useState, useTransition } from "react";
import { generateApiKey, revokeApiKey, rotateApiKey } from "@/actions/apikeys";
import { useRouter } from "next/navigation";

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
  const [keys, setKeys] = useState(initialKeys);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [permissions, setPermissions] = useState<string[]>(["chat:write", "models:read"]);
  const [rateLimit, setRateLimit] = useState(60);
  
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [generatedKeyPrefix, setGeneratedKeyPrefix] = useState<string | null>(null);
  const [revokeConfirmId, setRevokeConfirmId] = useState<string | null>(null);
  const [rotatedKey, setRotatedKey] = useState<{ id: string; key: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

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
      <div className="h-[52px] shrink-0 bg-[#0d0d0f]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-medium text-white tracking-wide">API Keys</h1>
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
        <div className="bg-white/[0.015] border border-white/[0.07] rounded-[11px] overflow-hidden">
          {initialKeys.length === 0 ? (
            <div className="p-12 text-center text-white/40 text-sm">
              No API keys found. Generate one to get started.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.05] text-[13px] text-white/40">
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Key Prefix</th>
                  <th className="px-6 py-4 font-medium">Permissions</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Created</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-white/80">
                {initialKeys.map((key) => (
                  <tr key={key.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{key.name}</td>
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
                        <span className="flex items-center gap-1.5 text-[#34d399]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]"></span>
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
                      {key.isActive && (
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleRotate(key.id)}
                            disabled={loading}
                            className="text-white/40 hover:text-white transition-colors"
                          >
                            Rotate
                          </button>
                          {revokeConfirmId === key.id ? (
                            <button
                              onClick={() => handleRevoke(key.id)}
                              disabled={loading}
                              className="text-[#ef4444] hover:text-[#ef4444]/80 font-medium transition-colors"
                            >
                              Confirm
                            </button>
                          ) : (
                            <button
                              onClick={() => setRevokeConfirmId(key.id)}
                              disabled={loading}
                              className="text-white/40 hover:text-[#ef4444] transition-colors"
                            >
                              Revoke
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
        </div>
      </div>

      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d0d0f] border border-white/[0.07] rounded-[11px] p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-medium text-white mb-4">Generate New Key</h2>
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
                  className="text-[13px] text-white/60 hover:text-white px-3 py-1.5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !newKeyName.trim() || permissions.length === 0}
                  className="text-[13px] font-medium text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-4 py-1.5 rounded-md transition-colors"
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
          <div className="bg-[#0d0d0f] border border-[#34d399]/20 rounded-[11px] p-6 w-full max-w-lg shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#34d399] to-emerald-400"></div>
            <h2 className="text-xl font-medium text-white mb-2">
              {rotatedKey ? "Key Rotated Successfully" : "Key Generated Successfully"}
            </h2>
            <p className="text-[14px] text-white/60 mb-6 leading-relaxed">
              Please copy this key and save it somewhere secure. For your protection, <strong className="text-white">you will not be able to see it again.</strong>
            </p>
            <div className="bg-white/5 border border-white/10 rounded-md p-3 flex items-center justify-between mb-6">
              <code className="text-[15px] font-mono text-[#34d399] break-all select-all">
                {rotatedKey ? rotatedKey.key : generatedKey}
              </code>
              <button
                onClick={() => {
                  copyToClipboard((rotatedKey ? rotatedKey.key : generatedKey) as string);
                  alert("Copied to clipboard");
                }}
                className="ml-4 text-xs font-medium bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition-colors shrink-0"
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
              className="w-full text-[14px] font-medium text-white bg-white/10 hover:bg-white/20 py-2.5 rounded-md transition-colors"
            >
              I have saved my key
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
