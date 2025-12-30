"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { usePreprocessing } from "@/context/preprocessing-context";
import { Visualizations } from "@/components/visualizations";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type FilterType = "none" | "highpass" | "lowpass" | "bandpass";

function getFilterType(lFreq: string, hFreq: string): FilterType {
  const hasLow = lFreq.trim() !== "" && !isNaN(parseFloat(lFreq));
  const hasHigh = hFreq.trim() !== "" && !isNaN(parseFloat(hFreq));

  if (hasLow && hasHigh) return "bandpass";
  if (hasLow) return "highpass";
  if (hasHigh) return "lowpass";
  return "none";
}

function getFilterLabel(type: FilterType): string {
  switch (type) {
    case "highpass":
      return "High-pass Filter";
    case "lowpass":
      return "Low-pass Filter";
    case "bandpass":
      return "Band-pass Filter";
    default:
      return "No Filter";
  }
}

function getFilterDescription(type: FilterType, lFreq: string, hFreq: string): string {
  switch (type) {
    case "highpass":
      return `Passes frequencies above ${lFreq} Hz (removes slow drifts)`;
    case "lowpass":
      return `Passes frequencies below ${hFreq} Hz (removes high-frequency noise)`;
    case "bandpass":
      return `Passes frequencies between ${lFreq} Hz and ${hFreq} Hz`;
    default:
      return "Specify at least one frequency to apply a filter";
  }
}

export default function FilterPage() {
  const router = useRouter();
  const { currentArtifactId, setArtifactId, refreshDatasets } = usePreprocessing();
  const [lFreq, setLFreq] = useState("");
  const [hFreq, setHFreq] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!currentArtifactId) {
    router.push("/preprocessing");
    return null;
  }

  const filterType = getFilterType(lFreq, hFreq);
  const filterLabel = getFilterLabel(filterType);
  const filterDescription = getFilterDescription(filterType, lFreq, hFreq);

  const handlePreset = (low: string, high: string) => {
    setLFreq(low);
    setHFreq(high);
  };

  const handleConfirm = async () => {
    if (filterType === "none") {
      setError("Please specify at least one frequency (low or high)");
      return;
    }

    const lFreqNum = parseFloat(lFreq);
    const hFreqNum = parseFloat(hFreq);

    // Validate frequencies
    if (lFreq && (isNaN(lFreqNum) || lFreqNum < 0)) {
      setError("Low frequency must be a positive number");
      return;
    }
    if (hFreq && (isNaN(hFreqNum) || hFreqNum < 0)) {
      setError("High frequency must be a positive number");
      return;
    }
    if (filterType === "bandpass" && lFreqNum >= hFreqNum) {
      setError("Low frequency must be less than high frequency for band-pass filter");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const body: { l_freq?: number; h_freq?: number } = {};
      if (lFreq.trim()) body.l_freq = lFreqNum;
      if (hFreq.trim()) body.h_freq = hFreqNum;

      const response = await fetch(
        `${API_BASE}/api/preprocessing/${currentArtifactId}/filter`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || `Failed to apply filter: ${response.statusText}`);
      }

      const data = await response.json();

      // Update artifact ID with new ID from response
      setArtifactId(data.id, "filter");

      // Refresh datasets list
      refreshDatasets();

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply filter");
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
          <CardTitle className="text-lg">Apply Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Type Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filter Type:</span>
            <Badge variant={filterType === "none" ? "outline" : "default"}>
              {filterLabel}
            </Badge>
          </div>

          {/* Frequency Inputs */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="l-freq">Low Frequency (Hz)</Label>
              <Input
                id="l-freq"
                type="number"
                min="0"
                step="0.1"
                placeholder="e.g., 1.0"
                value={lFreq}
                onChange={(e) => setLFreq(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Frequencies below this will be filtered out
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="h-freq">High Frequency (Hz)</Label>
              <Input
                id="h-freq"
                type="number"
                min="0"
                step="0.1"
                placeholder="e.g., 40.0"
                value={hFreq}
                onChange={(e) => setHFreq(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Frequencies above this will be filtered out
              </p>
            </div>
          </div>

          {/* Presets */}
          <div className="space-y-2">
            <Label>Common Presets</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset("1", "40")}
              >
                1-40 Hz (EEG standard)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset("0.1", "100")}
              >
                0.1-100 Hz (Wide)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset("1", "")}
              >
                1 Hz High-pass
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset("", "40")}
              >
                40 Hz Low-pass
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset("8", "13")}
              >
                8-13 Hz (Alpha)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset("13", "30")}
              >
                13-30 Hz (Beta)
              </Button>
            </div>
          </div>

          {/* Filter Description */}
          {filterType !== "none" && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              <p>{filterDescription}</p>
            </div>
          )}

          <div className="pt-4">
            <Button
              onClick={handleConfirm}
              disabled={filterType === "none" || submitting}
            >
              {submitting ? "Processing..." : "Apply Filter"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Visualizations artifactId={currentArtifactId} />

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg text-muted-foreground">Pipeline Complete</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You have completed all preprocessing steps. You can navigate back to any stage to make adjustments.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
