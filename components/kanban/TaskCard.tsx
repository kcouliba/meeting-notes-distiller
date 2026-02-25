"use client";

import { forwardRef, useState, useRef, useEffect } from "react";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TaskRecord } from "@/types/meeting";

interface TaskCardProps {
  task: TaskRecord;
  isDragOverlay?: boolean;
  onUpdate?: (id: string, fields: { assignee?: string | null; deadline?: string | null }) => void;
  onDelete?: (id: string) => void;
}

function InlineEdit({
  value,
  placeholder,
  onSave,
}: {
  value: string;
  placeholder: string;
  onSave: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function handleSave() {
    onSave(draft.trim());
    setEditing(false);
  }

  if (editing) {
    return (
      <span
        className="inline-flex items-center gap-0.5"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") { setDraft(value); setEditing(false); }
          }}
          className="h-5 w-24 rounded border bg-background px-1 text-xs outline-none focus:ring-1 focus:ring-ring"
          placeholder={placeholder}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={handleSave}
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={() => { setDraft(value); setEditing(false); }}
        >
          <X className="h-3 w-3" />
        </Button>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-0.5 group/edit cursor-pointer"
      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <span className="text-xs">{value || placeholder}</span>
      <Pencil className="h-3 w-3 opacity-0 group-hover/edit:opacity-60 transition-opacity" />
    </span>
  );
}

export const TaskCard = forwardRef<HTMLDivElement, TaskCardProps & React.HTMLAttributes<HTMLDivElement>>(
  ({ task, isDragOverlay, onUpdate, onDelete, style, ...props }, ref) => {
    const truncatedTitle =
      task.meetingTitle.length > 25
        ? task.meetingTitle.slice(0, 25) + "..."
        : task.meetingTitle;

    return (
      <Card
        ref={ref}
        style={style}
        className={`group cursor-grab active:cursor-grabbing ${
          isDragOverlay ? "shadow-lg ring-2 ring-indigo-500/50 rotate-2" : ""
        }`}
        {...props}
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-1">
            <p className="text-sm font-medium leading-snug flex-1">{task.task}</p>
            {onDelete && !isDragOverlay && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            {onUpdate && !isDragOverlay ? (
              <>
                <Badge variant="secondary" className="text-xs px-1.5">
                  <InlineEdit
                    value={task.assignee || ""}
                    placeholder="assignee"
                    onSave={(val) => onUpdate(task.id, { assignee: val || null })}
                  />
                </Badge>
                <Badge variant="outline" className="text-xs px-1.5">
                  <InlineEdit
                    value={task.deadline || ""}
                    placeholder="deadline"
                    onSave={(val) => onUpdate(task.id, { deadline: val || null })}
                  />
                </Badge>
              </>
            ) : (
              <>
                {task.assignee && (
                  <Badge variant="secondary" className="text-xs">
                    {task.assignee}
                  </Badge>
                )}
                {task.deadline && (
                  <Badge variant="outline" className="text-xs">
                    {task.deadline}
                  </Badge>
                )}
              </>
            )}
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {truncatedTitle}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }
);

TaskCard.displayName = "TaskCard";
