"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { NotesInput } from "@/components/NotesInput";
import { OutputDisplay } from "@/components/OutputDisplay";
import { FormatSelector } from "@/components/FormatSelector";
import { ActionBar } from "@/components/ActionBar";
import { AppHeader } from "@/components/AppHeader";
import { HistorySidebar } from "@/components/HistorySidebar";
import type { MeetingReport, MeetingListItem, OutputFormat } from "@/types/meeting";

export default function Home() {
  const [report, setReport] = useState<MeetingReport | null>(null);
  const [format, setFormat] = useState<OutputFormat>("markdown");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formatCache = useRef<Partial<Record<OutputFormat, string>>>({});
  const [formattedOutput, setFormattedOutput] = useState("");
  const lastNotes = useRef("");
  const [notes, setNotes] = useState("");

  // History state
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch meeting history on mount
  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/meetings?page=1&pageSize=50");
        if (res.ok) {
          const data = await res.json();
          setMeetings(data.meetings);
        }
      } catch {
        // History fetch failure is non-blocking
        console.warn("[history] Failed to fetch meeting history");
      } finally {
        setHistoryLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const fetchFormattedOutput = useCallback(
    async (reportData: MeetingReport, fmt: OutputFormat) => {
      if (formatCache.current[fmt]) {
        setFormattedOutput(formatCache.current[fmt]!);
        return;
      }

      try {
        const res = await fetch("/api/format", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ report: reportData, format: fmt }),
        });
        if (!res.ok) throw new Error("Format request failed");
        const data = await res.json();
        formatCache.current[fmt] = data.formatted;
        setFormattedOutput(data.formatted);
      } catch {
        setFormattedOutput("Error formatting output. Please try again.");
      }
    },
    []
  );

  async function handleSubmit(inputNotes: string) {
    setIsLoading(true);
    setReport(null);
    setError(null);
    setFormattedOutput("");
    formatCache.current = {};
    lastNotes.current = inputNotes;

    try {
      const res = await fetch("/api/distill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: inputNotes }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(
          errData?.error || `Request failed (${res.status})`
        );
      }

      const data: MeetingReport = await res.json();
      setReport(data);

      // Auto-save to history
      try {
        const saveRes = await fetch("/api/meetings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawNotes: inputNotes, report: data }),
        });
        if (saveRes.ok) {
          const saved = await saveRes.json();
          setMeetings((prev) => [
            {
              id: saved.id,
              title: saved.title,
              createdAt: saved.createdAt,
              participantCount: data.participants.length,
              actionCount: data.actions.length,
            },
            ...prev,
          ]);
          setActiveMeetingId(saved.id);
        }
      } catch {
        console.warn("[history] Failed to auto-save meeting");
      }

      await fetchFormattedOutput(data, format);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setReport(null);
      setFormattedOutput("");
    } finally {
      setIsLoading(false);
    }
  }

  function handleRetry() {
    if (lastNotes.current) {
      handleSubmit(lastNotes.current);
    }
  }

  async function handleFormatChange(newFormat: OutputFormat) {
    setFormat(newFormat);
    if (report) {
      await fetchFormattedOutput(report, newFormat);
    }
  }

  async function handleSelectMeeting(id: string) {
    try {
      const res = await fetch(`/api/meetings/${id}`);
      if (!res.ok) return;
      const data = await res.json();

      setReport(data.report);
      setActiveMeetingId(data.id);
      setNotes(data.rawNotes);
      setError(null);
      formatCache.current = {};
      setFormattedOutput("");
      setSidebarOpen(false);

      await fetchFormattedOutput(data.report, format);
    } catch {
      console.warn("[history] Failed to load meeting");
    }
  }

  async function handleDeleteMeeting(id: string) {
    try {
      const res = await fetch(`/api/meetings/${id}`, { method: "DELETE" });
      if (!res.ok) return;

      setMeetings((prev) => prev.filter((m) => m.id !== id));

      // If deleting the active meeting, clear everything
      if (id === activeMeetingId) {
        setReport(null);
        setFormattedOutput("");
        setError(null);
        setNotes("");
        setActiveMeetingId(null);
        formatCache.current = {};
      }
    } catch {
      console.warn("[history] Failed to delete meeting");
    }
  }

  function handleNewMeeting() {
    setReport(null);
    setFormattedOutput("");
    setError(null);
    setNotes("");
    setActiveMeetingId(null);
    formatCache.current = {};
    setSidebarOpen(false);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-[family-name:var(--font-geist-sans)] max-w-[1920px] mx-auto">
      {/* Header */}
      <AppHeader
        showSidebarToggle
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main content with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* History Sidebar - desktop: always visible, mobile: overlay */}
        <div
          id="history-sidebar"
          className={`shrink-0 ${
            sidebarOpen
              ? "fixed inset-y-0 left-0 z-40 mt-[73px] bg-background shadow-lg lg:relative lg:mt-0 lg:shadow-none"
              : "hidden lg:block"
          }`}
        >
          <HistorySidebar
            meetings={meetings}
            activeMeetingId={activeMeetingId}
            isLoading={historyLoading}
            onSelect={handleSelectMeeting}
            onDelete={handleDeleteMeeting}
            onNewMeeting={handleNewMeeting}
          />
        </div>

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSidebarOpen(false);
            }}
            role="button"
            tabIndex={-1}
            aria-label="Close sidebar"
          />
        )}

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
          <div className="mx-auto">
            <div className="grid gap-6 lg:grid-cols-[2fr_3fr] lg:min-h-[60vh]">
              {/* Left column: Input */}
              <div className="h-full">
                <NotesInput
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                  notes={notes}
                  onNotesChange={setNotes}
                />
              </div>

              {/* Right column: Output */}
              <OutputDisplay
                report={report}
                isLoading={isLoading}
                error={error}
                onRetry={handleRetry}
              >
                {report && !isLoading && (
                  <>
                    <FormatSelector
                      format={format}
                      onFormatChange={handleFormatChange}
                      formattedOutput={formattedOutput}
                    />
                    <div className="flex justify-end">
                      <ActionBar
                        formattedOutput={formattedOutput}
                        disabled={!report}
                      />
                    </div>
                  </>
                )}
              </OutputDisplay>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="container mx-auto flex flex-col items-center gap-1 px-4 text-center text-xs text-muted-foreground md:px-6">
          <p>
            Your data stays on your server. Nothing is sent to third parties.
          </p>
        </div>
      </footer>
    </div>
  );
}
