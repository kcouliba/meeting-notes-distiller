"use client";

import { forwardRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDeadline } from "@/lib/date-utils";
import { TaskEditDialog } from "./TaskEditDialog";
import type { TaskRecord } from "@/types/meeting";

export interface TaskCardProps {
  task: TaskRecord;
  isDragOverlay?: boolean;
  assigneeSuggestions?: string[];
  onUpdate?: (id: string, fields: { title?: string; assignee?: string | null; deadline?: string | null; task?: string }) => void;
  onDelete?: (id: string) => void;
}

export const TaskCard = forwardRef<HTMLDivElement, TaskCardProps & React.HTMLAttributes<HTMLDivElement>>(
  ({ task, isDragOverlay, assigneeSuggestions = [], onUpdate, onDelete, style, ...props }, ref) => {
    const [dialogOpen, setDialogOpen] = useState(false);

    const truncatedTitle =
      task.meetingTitle.length > 25
        ? task.meetingTitle.slice(0, 25) + "..."
        : task.meetingTitle;

    const canEdit = !!onUpdate && !isDragOverlay;

    return (
      <>
        <Card
          ref={ref}
          style={style}
          className={`group cursor-grab active:cursor-grabbing ${
            isDragOverlay ? "shadow-lg ring-2 ring-indigo-500/50 rotate-2" : ""
          } ${canEdit ? "cursor-pointer" : ""}`}
          onClick={canEdit ? () => setDialogOpen(true) : undefined}
          {...props}
        >
          <CardContent className="p-3 space-y-2">
            <div className="flex items-start justify-between gap-1">
              <div className="flex-1 min-w-0">
                {task.title && (
                  <p className="text-sm font-semibold leading-snug truncate">{task.title}</p>
                )}
                <p className={`text-sm leading-snug ${task.title ? "text-muted-foreground line-clamp-2" : "font-medium"}`}>{task.task}</p>
              </div>
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
              {task.assignee && (
                <Badge variant="secondary" className="text-xs">
                  {task.assignee}
                </Badge>
              )}
              {task.deadline && (
                <Badge variant="outline" className="text-xs">
                  {formatDeadline(task.deadline)}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {truncatedTitle}
              </Badge>
            </div>
          </CardContent>
        </Card>
        {canEdit && (
          <TaskEditDialog
            task={task}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            assigneeSuggestions={assigneeSuggestions}
            onUpdate={onUpdate}
          />
        )}
      </>
    );
  }
);

TaskCard.displayName = "TaskCard";
