"use client";

import {
  FileText,
  CheckCircle,
  ListTodo,
  HelpCircle,
  Users,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type { MeetingReport } from "@/types/meeting";

interface OutputDisplayProps {
  report: MeetingReport | null;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  children?: React.ReactNode;
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <Icon className="h-4 w-4 text-indigo-500" />
      {title}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Separator />
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <Separator />
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <Separator />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Separator />
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="h-full border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">
          No report yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Paste your meeting notes on the left and click &quot;Distill&quot; to
          generate a structured report.
        </p>
      </CardContent>
    </Card>
  );
}

export function OutputDisplay({ report, isLoading, error, onRetry, children }: OutputDisplayProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-destructive/10 p-4 mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">
            Processing failed
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-4">
            {error}
          </p>
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              Try again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return <EmptyState />;
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Meeting Report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Summary */}
        <div className="space-y-2">
          <SectionHeader icon={FileText} title="Summary" />
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            {report.summary.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </div>

        {/* Decisions */}
        {report.decisions.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <SectionHeader icon={CheckCircle} title="Decisions" />
              <ul className="text-sm text-muted-foreground space-y-1">
                {report.decisions.map((decision, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5 shrink-0">•</span>
                    {decision}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Action Items */}
        {report.actions.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <SectionHeader icon={ListTodo} title="Action Items" />
              <div className="space-y-2">
                {report.actions.map((action, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-center gap-2 rounded-md border p-3 text-sm"
                  >
                    <span className="flex-1 min-w-0">{action.task}</span>
                    {action.assignee && (
                      <Badge variant="secondary" className="shrink-0">
                        @{action.assignee}
                      </Badge>
                    )}
                    {action.deadline && (
                      <Badge variant="outline" className="shrink-0">
                        {action.deadline}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Pending Items */}
        {report.pending.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <SectionHeader icon={HelpCircle} title="Pending Items" />
              <ul className="text-sm text-muted-foreground space-y-1">
                {report.pending.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5 shrink-0">?</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Participants */}
        {report.participants.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <SectionHeader icon={Users} title="Participants" />
              <div className="flex flex-wrap gap-2">
                {report.participants.map((name, i) => (
                  <Badge key={i} variant="secondary">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {children && (
          <>
            <Separator />
            {children}
          </>
        )}
      </CardContent>
    </Card>
  );
}
