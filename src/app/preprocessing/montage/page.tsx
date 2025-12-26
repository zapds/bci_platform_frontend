"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePreprocessing } from "@/context/preprocessing-context";
import { Visualizations } from "@/components/visualizations";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Common montage presets
const MONTAGE_PRESETS = [
  { label: "10-20", value: "standard_1020" },
  { label: "10-10", value: "standard_1005" },
  { label: "BioSemi 64", value: "biosemi64" },
  { label: "BioSemi 128", value: "biosemi128" },
  { label: "EasyCap M1", value: "easycap-M1" },
];

export default function MontagePage() {
  const router = useRouter();
  const { currentArtifactId, setArtifactId, refreshDatasets } = usePreprocessing();
  const [montageName, setMontageName] = useState("standard_1020");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!currentArtifactId) {
    router.push("/preprocessing");
    return null;
  }

  const handlePresetClick = (value: string) => {
    setMontageName(value);
  };

  const handleConfirm = async () => {
    if (!montageName.trim()) {
      setError("Please enter a montage name");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/api/preprocessing/${currentArtifactId}/set_montage?montage_name=${encodeURIComponent(montageName)}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || `Failed to set montage: ${response.statusText}`);
      }

      const data = await response.json();

      // Update artifact ID with new ID from response
      setArtifactId(data.id, "montage");

      // Refresh datasets list
      refreshDatasets();

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set montage");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Set Montage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="montage-input">Montage Name</Label>
            <Input
              id="montage-input"
              value={montageName}
              onChange={(e) => setMontageName(e.target.value)}
              placeholder="Enter montage name..."
            />
          </div>

          <div className="space-y-2">
            <Label>Presets</Label>
            <div className="flex flex-wrap gap-2">
              {MONTAGE_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  variant={montageName === preset.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePresetClick(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleConfirm}
              disabled={!montageName.trim() || submitting}
            >
              {submitting ? "Processing..." : "Apply Montage"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Visualizations artifactId={currentArtifactId} />

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg text-muted-foreground">Next Step</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>
            Continue to Filter →
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Filter operations coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
