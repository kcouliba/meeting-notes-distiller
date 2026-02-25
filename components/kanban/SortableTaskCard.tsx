"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskCard } from "./TaskCard";
import type { TaskRecord } from "@/types/meeting";

interface SortableTaskCardProps {
  task: TaskRecord;
  onUpdate?: (id: string, fields: { assignee?: string | null; deadline?: string | null }) => void;
  onDelete?: (id: string) => void;
}

export function SortableTaskCard({ task, onUpdate, onDelete }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TaskCard
      ref={setNodeRef}
      style={style}
      task={task}
      onUpdate={onUpdate}
      onDelete={onDelete}
      {...attributes}
      {...listeners}
    />
  );
}
