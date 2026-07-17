"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Settings, Sparkles, AlertCircle, Bot, User, Trash2, ChevronDown, Repeat } from "lucide-react";

interface ApiKeyOption {
  id: string;
  name: string;
  keyPrefix: string;
}

const PROVIDER_MODELS: Record<string, string[]> = {
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  anthropic: ["claude-3-5-sonnet-20241022", "claude-3-opus-20240229", "claude-3-haiku-20240307"],
  mistral: ["mistral-large-latest", "mistral-medium-latest", "mistral-small-latest", "open-mistral-7b", "open-mixtral-8x7b"],
  google: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-pro-latest"],
  groq: ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "mixtral-8x7b-32768", "gemma2-9b-it"],
};

interface PlaygroundClientProps {
  projectId: string;
  projectName: string;
  availableKeys: ApiKeyOption[];
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  provider?: string;
  fallbackProvider?: string;
  model?: string;
}

function CustomSelect({ 
  value, 
  onChange, 
  options 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  options: { value: string; label: string }[] 
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-[#151518] border border-white/10 rounded-lg pl-3 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50 cursor-pointer hover:border-white/20 transition-colors text-left flex items-center justify-between"
      >
        <span className="truncate">{selected?.label || value}</span>
      </button>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-2 bg-[#1c1c1f] border border-white/10 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-60 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                  value === opt.value ? 'bg-purple-500/20 text-purple-200' : 'text-white/80 hover:bg-white/5 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlaygroundClient({ projectId, projectName, availableKeys }: PlaygroundClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Configuration
  const [selectedKeyId, setSelectedKeyId] = useState(availableKeys[0]?.id || "");
  const [provider, setProvider] = useState("groq");
  const [model, setModel] = useState("llama-3.3-70b-versatile");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful AI assistant.");
  const [enableHistory, setEnableHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-switch model when provider changes
  useEffect(() => {
    if (PROVIDER_MODELS[provider] && !PROVIDER_MODELS[provider].includes(model)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setModel(PROVIDER_MODELS[provider][0]);
    }
  }, [provider, model]);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(`aura_playground_${projectId}`);
    if (saved) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, [projectId]);

  // Save to local storage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`aura_playground_${projectId}`, JSON.stringify(messages));
    }
  }, [messages, projectId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(`aura_playground_${projectId}`);
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedKeyId) {
      if (!selectedKeyId) setError("Please select an API key to test.");
      return;
    }

    const newUserMessage: Message = { role: "user", content: input };
    const conversation = [...messages, newUserMessage];
    setMessages(conversation);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      // Build messages array including system prompt if it exists and is first message
      const apiMessages = [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        ...(enableHistory ? conversation : [newUserMessage])
      ];

      const res = await fetch("/api/playground/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keyId: selectedKeyId,
          provider,
          model,
          messages: apiMessages,
          temperature,
          maxTokens,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Proxy Error: ${res.status}`);
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.choices[0]?.message?.content || "No response content.",
        provider: data.provider,
        fallbackProvider: data.metadata?.fallback_provider,
        model: data.model,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-white">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-white/5">
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h1 className="font-semibold tracking-tight text-lg">Playground</h1>
            <span className="text-xs font-mono text-white/30 ml-2 px-2 py-0.5 rounded-full bg-white/5">
              {projectName}
            </span>
          </div>
          <button 
            onClick={clearChat}
            className="text-white/40 hover:text-white/80 transition-colors flex items-center gap-2 text-xs"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/30">
              <Bot className="w-12 h-12 mb-4 opacity-50" />
              <p>Send a message to start testing your proxy configuration.</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex gap-4 max-w-3xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded bg-purple-500/20 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-purple-400" />
                  </div>
                )}
                <div className={`px-5 py-3.5 rounded-2xl max-w-[85%] text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-purple-600/20 text-purple-100 rounded-tr-sm border border-purple-500/20' 
                    : 'bg-white/5 text-gray-300 rounded-tl-sm border border-white/5'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  {msg.fallbackProvider && (
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/5 text-[11px] text-amber-500/70 font-medium">
                      <Repeat className="w-3 h-3" />
                      <span>Fallback: Served by {msg.fallbackProvider} ({msg.model})</span>
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-gray-300" />
                  </div>
                )}
              </div>
            ))
          )}
          
          {loading && (
            <div className="flex gap-4 max-w-3xl mx-auto justify-start">
               <div className="w-8 h-8 rounded bg-purple-500/20 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-purple-400" />
                </div>
                <div className="px-5 py-4 rounded-2xl bg-white/5 border border-white/5 flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce delay-100" />
                  <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce delay-200" />
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 pt-0">
          <div className="max-w-3xl mx-auto relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 pr-14 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all resize-none shadow-2xl"
              rows={3}
            />
            <button
              suppressHydrationWarning
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="absolute right-3 bottom-3 p-2 bg-purple-600 hover:bg-purple-500 disabled:bg-white/10 disabled:text-white/30 text-white rounded-xl transition-colors shadow-lg"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Configuration Sidebar */}
      <div className="w-80 bg-[#0d0d0f] border-l border-white/5 flex flex-col shrink-0 overflow-y-auto">
        <div className="h-16 flex items-center px-5 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2 text-white/80">
            <Settings className="w-4 h-4" />
            <h2 className="text-sm font-medium">Configuration</h2>
          </div>
        </div>

        <div className="p-5 pb-48 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-3 text-red-400 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="break-all whitespace-pre-wrap">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-white/50 mb-1.5 block">
                Select Identity
              </label>
              <CustomSelect
                value={selectedKeyId}
                onChange={setSelectedKeyId}
                options={availableKeys.map(k => ({
                  value: k.id,
                  label: `${k.name} (${k.keyPrefix}...)`
                }))}
              />
            </div>
          </div>

          <div className="h-px bg-white/5" />

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-white/50 mb-1.5 block">Provider</label>
              <CustomSelect
                value={provider}
                onChange={setProvider}
                options={[
                  { value: "openai", label: "OpenAI" },
                  { value: "anthropic", label: "Anthropic" },
                  { value: "mistral", label: "Mistral" },
                  { value: "google", label: "Google Gemini" },
                  { value: "groq", label: "Groq" }
                ]}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-white/50 mb-1.5 block">Model</label>
              <CustomSelect
                value={model}
                onChange={setModel}
                options={[
                  ...(PROVIDER_MODELS[provider] || []).map(m => ({ value: m, label: m })),
                  ...(!PROVIDER_MODELS[provider]?.includes(model) ? [{ value: model, label: `${model} (Custom)` }] : [])
                ]}
              />
            </div>
          </div>

          <div className="h-px bg-white/5" />

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-white/50 block">Temperature</label>
                <span className="text-xs text-white/70">{temperature}</span>
              </div>
              <input 
                type="range"
                min="0" max="2" step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-purple-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
               <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-white/50 block">Max Tokens</label>
                <span className="text-xs text-white/70">{maxTokens}</span>
              </div>
              <input 
                type="range"
                min="1" max="4096" step="1"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full accent-purple-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="h-px bg-white/5" />

          <div>
            <label className="text-xs font-medium text-white/50 mb-1.5 block">System Prompt</label>
            <textarea 
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full bg-[#151518] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 resize-y"
              rows={4}
            />
          </div>

          <div className="h-px bg-white/5" />

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <label className="text-xs font-medium text-white/80">Conversation History</label>
              <span className="text-[10px] text-white/40 mt-0.5">Send full chat context to proxy</span>
            </div>
            <button
              onClick={() => setEnableHistory(!enableHistory)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                enableHistory ? 'bg-purple-500' : 'bg-white/10'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  enableHistory ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
