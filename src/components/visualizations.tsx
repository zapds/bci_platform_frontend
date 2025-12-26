"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ImageViewer from "@/components/commerce-ui/image-viewer-basic";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface VisualizationsProps {
  artifactId: string;
}

interface VisualizationType {
  id: string;
  label: string;
  endpoint: string;
}

const VISUALIZATION_TYPES: VisualizationType[] = [
  { id: "plot", label: "Raw EEG Plot", endpoint: "plot" },
  { id: "psd", label: "PSD Plot", endpoint: "psd" },
  { id: "psd_topomap", label: "PSD Topomap", endpoint: "psd_topomap" },
];

export function Visualizations({ artifactId }: VisualizationsProps) {
  const [loadedImages, setLoadedImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLoadVisualization = async (viz: VisualizationType) => {
    // If already loaded, don't reload
    if (loadedImages[viz.id]) {
      return;
    }

    setLoading(viz.id);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/api/datasets/${artifactId}/visualizations/${viz.endpoint}`
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || `Failed to load ${viz.label}`);
      }

      // The endpoint returns an image
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      setLoadedImages((prev) => ({ ...prev, [viz.id]: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to load ${viz.label}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Visualizations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {VISUALIZATION_TYPES.map((viz) => {
            const isLoading = loading === viz.id;
            const isLoaded = !!loadedImages[viz.id];
            
            return (
              <Button
                key={viz.id}
                variant={isLoaded ? "default" : "outline"}
                size="sm"
                disabled={isLoading}
                onClick={() => handleLoadVisualization(viz)}
              >
                {isLoading ? "Loading..." : isLoaded ? `✓ ${viz.label}` : viz.label}
              </Button>
            );
          })}
        </div>

        {error && (
          <p className="text-xs text-destructive mb-4">{error}</p>
        )}

        {/* Display loaded visualizations */}
        {Object.keys(loadedImages).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {VISUALIZATION_TYPES.map((viz) => {
              const imageUrl = loadedImages[viz.id];
              if (!imageUrl) return null;
              
              return (
                <div key={viz.id} className="flex flex-col items-center gap-2">
                  <p className="text-sm text-muted-foreground">{viz.label}</p>
                  <ImageViewer
                    imageUrl={imageUrl}
                    thumbnailUrl={imageUrl}
                    imageTitle={viz.label}
                    className="w-full"
                  />
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4">
          Artifact: <code className="bg-muted px-1 rounded">{artifactId.slice(0, 8)}...</code>
        </p>
      </CardContent>
    </Card>
  );
}
