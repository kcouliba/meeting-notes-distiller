"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HistoryItem } from "@/components/HistoryItem";
import type { MeetingListItem } from "@/types/meeting";

interface HistorySidebarProps {
  meetings: MeetingListItem[];
  activeMeetingId: string | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewMeeting: () => void;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2 p-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-1.5 rounded-md px-3 py-2.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
      <p className="text-sm text-muted-foreground">
        No meetings yet. Distill your first meeting notes to get started.
      </p>
    </div>
  );
}

export function HistorySidebar({
  meetings,
  activeMeetingId,
  isLoading,
  onSelect,
  onDelete,
  onNewMeeting,
}: HistorySidebarProps) {
  return (
    <nav
      aria-label="Meeting history"
      className="flex h-full w-64 flex-col border-r"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold">History</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onNewMeeting}
          className="h-7 gap-1 px-2 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </Button>
      </div>

      {/* Meeting list */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <LoadingSkeleton />
        ) : meetings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-1">
            {meetings.map((meeting) => (
              <HistoryItem
                key={meeting.id}
                meeting={meeting}
                isActive={meeting.id === activeMeetingId}
                onSelect={() => onSelect(meeting.id)}
                onDelete={() => onDelete(meeting.id)}
              />
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
