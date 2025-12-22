"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VisualizationsProps {
  artifactId: string;
}

export function Visualizations({ artifactId }: VisualizationsProps) {
  // These will call /visualizations/{artifactId}/psd etc. when implemented
  const visualizationTypes = [
    { id: "psd", label: "PSD Plot" },
    { id: "raw", label: "Raw Signal" },
    { id: "topomap", label: "Topomap" },
    { id: "spectrogram", label: "Spectrogram" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Visualizations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {visualizationTypes.map((viz) => (
            <Button key={viz.id} variant="outline" size="sm" disabled>
              {viz.label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Artifact: <code className="bg-muted px-1 rounded">{artifactId.slice(0, 8)}...</code>
          {" "}— Visualization endpoints coming soon
        </p>
      </CardContent>
    </Card>
  );
}
