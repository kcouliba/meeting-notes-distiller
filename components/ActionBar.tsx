"use client";

import { useState } from "react";
import { Copy, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionBarProps {
  formattedOutput: string;
  disabled: boolean;
}

export function ActionBar({ formattedOutput, disabled }: ActionBarProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!formattedOutput) return;
    await navigator.clipboard.writeText(formattedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!formattedOutput) return;
    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([formattedOutput], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meeting-notes-${date}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        disabled={disabled}
        className="gap-2"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-green-500" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copy
          </>
        )}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={disabled}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Download .md
      </Button>
    </div>
  );
}
