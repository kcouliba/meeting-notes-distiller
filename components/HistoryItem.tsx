"use client";

import { Trash2, Users, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MeetingListItem } from "@/types/meeting";

interface HistoryItemProps {
  meeting: MeetingListItem;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const meetingDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  if (meetingDay.getTime() === today.getTime()) {
    return "Today";
  }
  if (meetingDay.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function HistoryItem({
  meeting,
  isActive,
  onSelect,
  onDelete,
}: HistoryItemProps) {
  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (window.confirm("Delete this meeting report?")) {
      onDelete();
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-current={isActive ? "true" : undefined}
      className={`group relative w-full rounded-md px-3 py-2.5 text-left transition-colors cursor-pointer ${
        isActive
          ? "bg-accent"
          : "hover:bg-accent/50"
      }`}
    >
      <p className="text-sm font-medium truncate pr-7">{meeting.title}</p>
      <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
        <span>{formatRelativeDate(meeting.createdAt)}</span>
        <span className="inline-flex items-center gap-0.5">
          <Users className="h-3 w-3" />
          {meeting.participantCount}
        </span>
        <span className="inline-flex items-center gap-0.5">
          <ListTodo className="h-3 w-3" />
          {meeting.actionCount}
        </span>
      </p>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        aria-label={`Delete meeting: ${meeting.title}`}
        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  );
}
