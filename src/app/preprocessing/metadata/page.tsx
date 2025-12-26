"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePreprocessing } from "@/context/preprocessing-context";
import { Visualizations } from "@/components/visualizations";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface DatasetMetadata {
  duration_seconds: number;
  sampling_frequency_hz: number;
  time_points: number;
  eeg_channel_count: number;
  highpass_hz: number;
  lowpass_hz: number;
}

export default function MetadataPage() {
  const router = useRouter();
  const { currentArtifactId, setArtifactId, pipelineHistory } = usePreprocessing();
  const [metadata, setMetadata] = useState<DatasetMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if metadata stage is already in history
  const metadataCompleted = pipelineHistory.some((h) => h.stage === "metadata");

  useEffect(() => {
    if (!currentArtifactId) {
      router.push("/preprocessing");
      return;
    }

    const fetchMetadata = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE}/api/datasets/${currentArtifactId}/metadata`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch metadata: ${response.statusText}`);
        }

        const data: DatasetMetadata = await response.json();
        setMetadata(data);

        // Mark metadata stage as completed (non-mutating, same artifact ID)
        if (!metadataCompleted) {
          setArtifactId(currentArtifactId, "metadata");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch metadata");
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [currentArtifactId, router, setArtifactId, metadataCompleted]);

  if (!currentArtifactId) {
    return null;
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dataset Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading metadata...</p>
          ) : metadata ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">{metadata.duration_seconds.toFixed(2)} s</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sampling Rate</p>
                <p className="font-medium">{metadata.sampling_frequency_hz} Hz</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time Points</p>
                <p className="font-medium">{metadata.time_points.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">EEG Channels</p>
                <p className="font-medium">{metadata.eeg_channel_count}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Highpass</p>
                <p className="font-medium">{metadata.highpass_hz} Hz</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lowpass</p>
                <p className="font-medium">{metadata.lowpass_hz} Hz</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No metadata available</p>
          )}
        </CardContent>
      </Card>

      <Visualizations artifactId={currentArtifactId} />

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg text-muted-foreground">Next Step</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            onClick={() => router.push("/preprocessing/channels")}
          >
            Continue to Channels →
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Select which channels to include in the analysis
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
