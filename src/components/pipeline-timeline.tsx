"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { PipelineStep } from "@/context/preprocessing-context";

interface PipelineTimelineProps {
  history: PipelineStep[];
}

const STAGES = [
  { id: "upload", label: "Upload", path: "/preprocessing" },
  { id: "metadata", label: "Metadata", path: "/preprocessing/metadata" },
  { id: "channels", label: "Channels", path: "/preprocessing/channels" },
  { id: "montage", label: "Montage", path: "/preprocessing/montage" },
  { id: "filter", label: "Filter", path: "/preprocessing/filter" },
];

export function PipelineTimeline({ history }: PipelineTimelineProps) {
  const pathname = usePathname();

  const getStageStatus = (stageId: string) => {
    const completed = history.some((h) => h.stage === stageId);
    const current = STAGES.find((s) => s.path === pathname)?.id === stageId;
    return { completed, current };
  };

  const getStepArtifact = (stageId: string) => {
    const step = history.find((h) => h.stage === stageId);
    return step?.artifactId;
  };

  return (
    <div className="w-48 border-r pr-4">
      <h3 className="text-sm font-medium mb-4">Pipeline</h3>
      <div className="space-y-1">
        {STAGES.map((stage, index) => {
          const { completed, current } = getStageStatus(stage.id);
          const artifactId = getStepArtifact(stage.id);

          return (
            <div key={stage.id} className="relative">
              {/* Connector line */}
              {index < STAGES.length - 1 && (
                <div
                  className={`absolute left-1.75 top-5 w-0.5 h-6 ${
                    completed ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}

              {/* Stage item */}
              <div className="flex items-start gap-2">
                {/* Circle indicator */}
                <div
                  className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 ${
                    current
                      ? "border-primary bg-primary"
                      : completed
                      ? "border-primary bg-background"
                      : "border-muted bg-background"
                  }`}
                >
                  {completed && !current && (
                    <svg
                      className="w-3 h-3 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>

                {/* Label and artifact */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={stage.path}
                    className={`text-sm block ${
                      current
                        ? "font-medium"
                        : completed
                        ? "text-muted-foreground hover:text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {stage.label}
                  </Link>
                  {artifactId && (
                    <span className="text-xs text-muted-foreground font-mono block truncate">
                      {artifactId.slice(0, 8)}...
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
