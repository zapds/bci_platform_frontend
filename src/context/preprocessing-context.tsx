"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface PipelineStep {
  stage: string;
  artifactId: string;
  timestamp: Date;
}

interface PreprocessingContextType {
  currentArtifactId: string | null;
  previousArtifactId: string | null;
  pipelineHistory: PipelineStep[];
  setArtifactId: (id: string, stage: string) => void;
  reset: () => void;
}

const PreprocessingContext = createContext<PreprocessingContextType | null>(null);

export function PreprocessingProvider({ children }: { children: ReactNode }) {
  const [currentArtifactId, setCurrentArtifactId] = useState<string | null>(null);
  const [previousArtifactId, setPreviousArtifactId] = useState<string | null>(null);
  const [pipelineHistory, setPipelineHistory] = useState<PipelineStep[]>([]);

  const setArtifactId = (id: string, stage: string) => {
    setPreviousArtifactId(currentArtifactId);
    setCurrentArtifactId(id);
    setPipelineHistory((prev) => [
      ...prev,
      { stage, artifactId: id, timestamp: new Date() },
    ]);
  };

  const reset = () => {
    setCurrentArtifactId(null);
    setPreviousArtifactId(null);
    setPipelineHistory([]);
  };

  return (
    <PreprocessingContext.Provider
      value={{
        currentArtifactId,
        previousArtifactId,
        pipelineHistory,
        setArtifactId,
        reset,
      }}
    >
      {children}
    </PreprocessingContext.Provider>
  );
}

export function usePreprocessing() {
  const context = useContext(PreprocessingContext);
  if (!context) {
    throw new Error("usePreprocessing must be used within a PreprocessingProvider");
  }
  return context;
}
