"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PreprocessingProvider, usePreprocessing } from "@/context/preprocessing-context";
import { PipelineTimeline } from "@/components/pipeline-timeline";
import { DatasetSidebar } from "@/components/dataset-sidebar";

function PreprocessingLayoutContent({ children }: { children: React.ReactNode }) {
  const { pipelineHistory, reset } = usePreprocessing();

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm">
                ← Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Preprocessing Pipeline</h1>
          </div>
          {pipelineHistory.length > 0 && (
            <Button variant="outline" size="sm" onClick={reset}>
              Reset Pipeline
            </Button>
          )}
        </div>

        <div className="flex gap-6">
          <PipelineTimeline history={pipelineHistory} />
          <div className="flex-1">{children}</div>
          <DatasetSidebar />
        </div>
      </div>
    </main>
  );
}

export default function PreprocessingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PreprocessingProvider>
      <PreprocessingLayoutContent>{children}</PreprocessingLayoutContent>
    </PreprocessingProvider>
  );
}
