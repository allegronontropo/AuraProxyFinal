import React from 'react';
import Image from 'next/image';

interface ProviderIconProps {
  provider: string;
  size?: number;
  type?: string;
  className?: string;
}

export function ProviderIcon({ provider, size = 16, className }: ProviderIconProps) {
  const p = (provider || "unknown").toLowerCase();
  
  let src = "";
  if (p.includes("openai")) src = "/providers_icons/openai-color.svg";
  else if (p.includes("anthropic") || p.includes("claude")) src = "/providers_icons/claude-icon.svg";
  else if (p.includes("google") || p.includes("gemini")) src = "/providers_icons/gemini.svg";
  else if (p.includes("mistral")) src = "/providers_icons/mistral-ai-icon.svg";
  else if (p.includes("grok") || p.includes("groq") || p.includes("xai")) src = "/providers_icons/groq-icon.svg";

  if (src) {
    return (
      <Image 
        src={src} 
        alt={provider} 
        width={size} 
        height={size} 
        className={className}
        style={{ minWidth: size, minHeight: size }}
      />
    );
  }

  // Fallback for unknown providers
  let bg = "bg-zinc-700 text-zinc-200";
  let letter = p.charAt(0).toUpperCase();

  if (p.includes("meta") || p.includes("llama")) { bg = "bg-blue-600 text-white"; letter = "L"; }
  else if (p.includes("cohere")) { bg = "bg-[#39594D] text-white"; letter = "C"; }

  return (
    <div 
      className={`flex items-center justify-center rounded-[4px] text-[10px] font-bold leading-none select-none ${bg} ${className || ''}`} 
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      {letter}
    </div>
  );
}
