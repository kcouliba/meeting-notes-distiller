"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableTaskCard } from "./SortableTaskCard";
import { TaskCard } from "./TaskCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { TaskRecord, TaskStatus } from "@/types/meeting";

const COLOR_STYLES: Record<string, { border: string; badge: string }> = {
  blue:    { border: "border-t-blue-500",    badge: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  amber:   { border: "border-t-amber-500",   badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  purple:  { border: "border-t-purple-500",  badge: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
  emerald: { border: "border-t-emerald-500", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
};

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  color?: string;
  tasks: TaskRecord[];
  isLoading?: boolean;
  assigneeSuggestions?: string[];
  onUpdate?: (id: string, fields: { title?: string; assignee?: string | null; deadline?: string | null; task?: string }) => void;
  onDelete?: (id: string) => void;
  onArchiveAll?: () => void;
  archivedTasks?: TaskRecord[];
}

export function KanbanColumn({ status, title, color = "blue", tasks, isLoading, assigneeSuggestions, onUpdate, onDelete, onArchiveAll, archivedTasks }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  const taskIds = tasks.map((t) => t.id);
  const styles = COLOR_STYLES[color] ?? COLOR_STYLES.blue;

  return (
    <div
      className={`w-full md:w-72 shrink-0 rounded-lg border-t-2 bg-muted/50 p-3 flex flex-col ${styles.border} ${
        isOver ? "ring-2 ring-indigo-500/50" : ""
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          {onArchiveAll && tasks.length > 0 && (
            <button
              onClick={onArchiveAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Archive all
            </button>
          )}
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles.badge}`}>
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Card list */}
      <div ref={setNodeRef} className="flex-1 overflow-y-auto min-h-[120px] md:min-h-[200px] space-y-2">
        {isLoading ? (
          <>
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </>
        ) : (
          <>
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {tasks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                No tasks
              </p>
            ) : (
              tasks.map((task) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  assigneeSuggestions={assigneeSuggestions}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              ))
            )}
          </SortableContext>

          {archivedTasks && archivedTasks.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 px-1">
                <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
                <span className="text-xs text-muted-foreground">Archived ({archivedTasks.length})</span>
                <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
              </div>
              <div className="space-y-2 opacity-50">
                {archivedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}
