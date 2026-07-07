"use client";

import React, { useState, useTransition } from "react";
import { saveProjectRouting } from "@/actions/routing";
import { useRouter } from "next/navigation";
import FallbackLogsTable from "./FallbackLogsTable";

const CAPABILITY_GROUPS = [
  {
    name: "Tier 1: High Capability",
    models: [
      { id: "gpt-4o", label: "GPT-4o", provider: "OpenAI" },
      { id: "gpt-4-turbo", label: "GPT-4 Turbo", provider: "OpenAI" },
      { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet", provider: "Anthropic" },
      { id: "claude-3-opus-20240229", label: "Claude 3 Opus", provider: "Anthropic" },
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "Google" },
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", provider: "Groq" },
    ]
  },
  {
    name: "Tier 2: Fast & Efficient",
    models: [
      { id: "gpt-4o-mini", label: "GPT-4o-mini", provider: "OpenAI" },
      { id: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", provider: "OpenAI" },
      { id: "claude-3-haiku-20240307", label: "Claude 3 Haiku", provider: "Anthropic" },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "Google" },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B", provider: "Groq" },
      { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B", provider: "Groq" },
      { id: "gemma2-9b-it", label: "Gemma 2 9B", provider: "Groq" },
    ]
  }
];

import CustomSelect from "@/components/ui/CustomSelect";

export default function RoutingSection({
  projectId,
  initialFallbackModels,
  apiKeys,
}: {
  projectId: string;
  initialFallbackModels: string[];
  apiKeys: { id: string; name: string; keyPrefix: string }[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [fallbackModels, setFallbackModels] = useState<string[]>(initialFallbackModels || []);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedModel, setSelectedModel] = useState("");

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSave = async () => {
    setLoading(true);
    const res = await saveProjectRouting(projectId, fallbackModels);
    setLoading(false);

    if (res?.success) {
      showMessage("success", "Fallback routing configuration saved successfully.");
      startTransition(() => router.refresh());
    } else {
      showMessage("error", res?.error ?? "Failed to save configuration.");
    }
  };

  const addModel = () => {
    if (selectedModel && !fallbackModels.includes(selectedModel)) {
      setFallbackModels([...fallbackModels, selectedModel]);
      setSelectedModel("");
    }
  };

  const removeModel = (index: number) => {
    const newModels = [...fallbackModels];
    newModels.splice(index, 1);
    setFallbackModels(newModels);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newModels = [...fallbackModels];
    [newModels[index - 1], newModels[index]] = [newModels[index], newModels[index - 1]];
    setFallbackModels(newModels);
  };

  const moveDown = (index: number) => {
    if (index === fallbackModels.length - 1) return;
    const newModels = [...fallbackModels];
    [newModels[index + 1], newModels[index]] = [newModels[index], newModels[index + 1]];
    setFallbackModels(newModels);
  };

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[13px] font-semibold text-white/80 uppercase tracking-wider">
            Fallback Routing
          </h2>
          <p className="text-[12px] text-white/40 mt-1">
            Configure an ordered chain of models to try if the primary model fails or times out.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="text-[12px] font-medium text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-4 py-2 rounded-md transition-colors"
        >
          {loading ? "Saving..." : "Save Configuration"}
        </button>
      </div>

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

      <div className="bg-white/[0.015] border border-white/[0.08] rounded-[11px] p-5 space-y-4">
        {/* Add Model Dropdown */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-[12px] text-white/50 mb-1.5">Add a Fallback Model</label>
            <CustomSelect 
              value={selectedModel}
              onChange={setSelectedModel}
              groups={CAPABILITY_GROUPS.map(g => ({
                name: g.name,
                options: g.models.map(m => ({
                  value: m.id,
                  label: (
                    <span>
                      {m.label} <span className="opacity-50">({m.provider})</span>
                    </span>
                  )
                }))
              }))}
            />
          </div>
          <button
            onClick={addModel}
            disabled={!selectedModel}
            className="h-[38px] px-4 bg-white/10 hover:bg-white/20 text-white rounded-md text-[13px] font-medium transition-colors disabled:opacity-50"
          >
            Add
          </button>
        </div>

        {/* Selected Models List */}
        <div className="mt-6">
          <label className="block text-[12px] text-white/50 mb-3">Fallback Chain (in order of priority)</label>
          
          {fallbackModels.length === 0 ? (
            <div className="py-8 text-center bg-white/[0.01] border border-dashed border-white/[0.1] rounded-md text-[13px] text-white/40">
              No custom fallbacks configured. The gateway will use default logic.
            </div>
          ) : (
            <div className="space-y-2">
              {fallbackModels.map((modelId, index) => (
                <div key={`${modelId}-${index}`} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.05] rounded-md p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <button onClick={() => moveUp(index)} disabled={index === 0} className="text-white/30 hover:text-white disabled:opacity-20">
                        ▲
                      </button>
                      <button onClick={() => moveDown(index)} disabled={index === fallbackModels.length - 1} className="text-white/30 hover:text-white disabled:opacity-20">
                        ▼
                      </button>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-violet-400 bg-violet-400/10 px-1.5 py-0.5 rounded">
                          #{index + 1}
                        </span>
                        <span className="text-[14px] font-medium text-white/90 font-mono">{modelId}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => removeModel(index)} className="text-red-400/50 hover:text-red-400 text-[12px] font-medium transition-colors">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <FallbackLogsTable projectId={projectId} apiKeys={apiKeys} />
      </div>
    </section>
  );
}
