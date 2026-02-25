"use client";

import { useState, useEffect, useId } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { isIsoDate } from "@/lib/date-utils";
import type { TaskRecord } from "@/types/meeting";

interface TaskEditDialogProps {
  task: TaskRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assigneeSuggestions?: string[];
  onUpdate: (
    id: string,
    fields: { title?: string; assignee?: string | null; deadline?: string | null; task?: string }
  ) => void;
}

export function TaskEditDialog({
  task,
  open,
  onOpenChange,
  assigneeSuggestions = [],
  onUpdate,
}: TaskEditDialogProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.task);
  const [assignee, setAssignee] = useState(task.assignee ?? "");
  const [deadline, setDeadline] = useState(
    task.deadline && isIsoDate(task.deadline) ? task.deadline : ""
  );
  const listId = useId();

  // Re-sync draft state from task prop when the dialog opens
  useEffect(() => {
    if (open) {
      setTitle(task.title);
      setDescription(task.task);
      setAssignee(task.assignee ?? "");
      setDeadline(
        task.deadline && isIsoDate(task.deadline) ? task.deadline : ""
      );
    }
    // Only sync when open changes, not when task changes (avoids clobbering in-progress edits)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleSave() {
    const changes: { title?: string; assignee?: string | null; deadline?: string | null; task?: string } = {};

    const trimmedTitle = title.trim();
    if (trimmedTitle !== task.title) {
      changes.title = trimmedTitle;
    }

    const trimmedDesc = description.trim();
    if (trimmedDesc && trimmedDesc !== task.task) {
      changes.task = trimmedDesc;
    }

    const trimmedAssignee = assignee.trim();
    const origAssignee = task.assignee ?? "";
    if (trimmedAssignee !== origAssignee) {
      changes.assignee = trimmedAssignee || null;
    }

    const origDeadline = task.deadline && isIsoDate(task.deadline) ? task.deadline : "";
    if (deadline !== origDeadline) {
      changes.deadline = deadline || null;
    }

    if (Object.keys(changes).length > 0) {
      onUpdate(task.id, changes);
    }

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>{task.meetingTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="task-title">
              Title
            </label>
            <input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short task title"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="task-description">
              Description
            </label>
            <Textarea
              id="task-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="task-assignee">
              Assignee
            </label>
            <input
              id="task-assignee"
              list={listId}
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="Unassigned"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <datalist id={listId}>
              {assigneeSuggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="task-deadline">
              Deadline
            </label>
            <input
              id="task-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
