"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { AppHeader } from "@/components/AppHeader";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { TaskCard } from "@/components/kanban/TaskCard";
import type { TaskRecord, TaskStatus } from "@/types/meeting";

const COLUMNS: { status: TaskStatus; title: string; color: string }[] = [
  { status: "todo", title: "To Do", color: "blue" },
  { status: "in_progress", title: "In Progress", color: "amber" },
  { status: "in_review", title: "In Review", color: "purple" },
  { status: "done", title: "Done", color: "emerald" },
];

// pointerWithin reliably detects which column the cursor is inside;
// closestCenter is the fallback when the pointer isn't within any droppable.
const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;
  return closestCenter(args);
};

export default function KanbanPage() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<TaskRecord | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
      }
    } catch {
      console.warn("[kanban] Failed to fetch tasks");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const totalTasks = tasks.length;
  const boardIsEmpty = !isLoading && totalTasks === 0;

  async function handleUpdateTask(id: string, fields: { assignee?: string | null; deadline?: string | null }) {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...fields } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) fetchTasks();
    } catch {
      fetchTasks();
    }
  }

  async function handleDeleteTask(id: string) {
    // Optimistic removal
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) fetchTasks();
    } catch {
      fetchTasks();
    }
  }

  function getTasksByStatus(status: TaskStatus): TaskRecord[] {
    return tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.position - b.position);
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTaskItem = tasks.find((t) => t.id === activeId);
    if (!activeTaskItem) return;

    // Determine target column: either the column itself (droppable ID) or the column of the task being hovered
    const isOverColumn = COLUMNS.some((c) => c.status === overId);
    const targetStatus: TaskStatus = isOverColumn
      ? (overId as TaskStatus)
      : (tasks.find((t) => t.id === overId)?.status ?? activeTaskItem.status);

    if (activeTaskItem.status !== targetStatus) {
      setTasks((prev) => {
        const updated = prev.map((t) =>
          t.id === activeId ? { ...t, status: targetStatus } : t
        );
        return updated;
      });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTaskItem = tasks.find((t) => t.id === activeId);
    if (!activeTaskItem) return;

    // Determine target column
    const isOverColumn = COLUMNS.some((c) => c.status === overId);
    const targetStatus = isOverColumn
      ? (overId as TaskStatus)
      : (tasks.find((t) => t.id === overId)?.status ?? activeTaskItem.status);

    setTasks((prev) => {
      // Ensure active task is in target column
      let updated = prev.map((t) =>
        t.id === activeId ? { ...t, status: targetStatus } : t
      );

      // Get tasks in target column sorted by position
      const columnTasks = updated
        .filter((t) => t.status === targetStatus)
        .sort((a, b) => a.position - b.position);

      // Reorder within column if dropping on another task
      if (!isOverColumn && overId !== activeId) {
        const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
        const newIndex = columnTasks.findIndex((t) => t.id === overId);
        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(columnTasks, oldIndex, newIndex);
          // Assign new positions
          const positionMap = new Map<string, number>();
          reordered.forEach((t, i) => positionMap.set(t.id, i));
          updated = updated.map((t) =>
            positionMap.has(t.id) ? { ...t, position: positionMap.get(t.id)! } : t
          );
        }
      }

      // Recalculate positions for the target column
      const finalColumnTasks = updated
        .filter((t) => t.status === targetStatus)
        .sort((a, b) => a.position - b.position);
      const positionUpdates: { id: string; status: TaskStatus; position: number }[] = [];
      finalColumnTasks.forEach((t, i) => {
        positionUpdates.push({ id: t.id, status: targetStatus, position: i });
      });

      // Also recalculate the source column if different
      if (activeTaskItem.status !== targetStatus) {
        const sourceColumnTasks = updated
          .filter((t) => t.status === activeTaskItem.status)
          .sort((a, b) => a.position - b.position);
        sourceColumnTasks.forEach((t, i) => {
          positionUpdates.push({ id: t.id, status: activeTaskItem.status, position: i });
        });
      }

      // Persist reorder
      if (positionUpdates.length > 0) {
        fetch("/api/tasks/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates: positionUpdates }),
        }).catch(() => {
          // Refetch on error
          fetchTasks();
        });
      }

      // Apply position updates to local state
      const posMap = new Map(positionUpdates.map((u) => [u.id, u]));
      return updated.map((t) => {
        const upd = posMap.get(t.id);
        return upd ? { ...t, status: upd.status, position: upd.position } : t;
      });
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-[family-name:var(--font-geist-sans)] max-w-[1920px] mx-auto">
      <AppHeader />

      <main className="flex-1 overflow-x-auto px-4 py-6 md:px-6">
        {boardIsEmpty ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-lg font-medium text-muted-foreground">No tasks yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Distill a meeting to generate action items.{" "}
              <Link href="/" className="underline hover:text-foreground">
                Go to Distiller
              </Link>
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex flex-col gap-4 md:flex-row md:min-w-max md:pb-4 md:justify-center">
              {COLUMNS.map((col) => (
                <KanbanColumn
                  key={col.status}
                  status={col.status}
                  title={col.title}
                  color={col.color}
                  tasks={getTasksByStatus(col.status)}
                  isLoading={isLoading}
                  onUpdate={handleUpdateTask}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>

            <DragOverlay>
              {activeTask ? <TaskCard task={activeTask} isDragOverlay /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </main>

      <footer className="border-t py-4">
        <div className="container mx-auto flex flex-col items-center gap-1 px-4 text-center text-xs text-muted-foreground md:px-6">
          <p>Your data stays on your server. Nothing is sent to third parties.</p>
        </div>
      </footer>
    </div>
  );
}
