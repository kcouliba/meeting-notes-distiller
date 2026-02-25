"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { OutputFormat } from "@/types/meeting";

interface FormatSelectorProps {
  format: OutputFormat;
  onFormatChange: (format: OutputFormat) => void;
  formattedOutput: string;
}

const FORMAT_LABELS: Record<OutputFormat, string> = {
  markdown: "Markdown",
  slack: "Slack",
  email: "Email",
  notion: "Notion",
};

export function FormatSelector({
  format,
  onFormatChange,
  formattedOutput,
}: FormatSelectorProps) {
  return (
    <Tabs
      value={format}
      onValueChange={(v) => onFormatChange(v as OutputFormat)}
    >
      <TabsList className="w-full grid grid-cols-4">
        {(Object.keys(FORMAT_LABELS) as OutputFormat[]).map((key) => (
          <TabsTrigger key={key} value={key}>
            {FORMAT_LABELS[key]}
          </TabsTrigger>
        ))}
      </TabsList>
      {(Object.keys(FORMAT_LABELS) as OutputFormat[]).map((key) => (
        <TabsContent key={key} value={key}>
          <pre className="rounded-md border bg-muted/50 p-4 text-sm overflow-x-auto whitespace-pre-wrap break-words max-h-[300px] overflow-y-auto">
            {formattedOutput || "No formatted output yet."}
          </pre>
        </TabsContent>
      ))}
    </Tabs>
  );
}
