"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePreprocessing } from "@/context/preprocessing-context";
import { Visualizations } from "@/components/visualizations";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Standard 10-20 EEG electrode positions
const TEN_TWENTY = new Set([
  "Fp1", "Fp2", "F7", "F3", "Fz", "F4", "F8",
  "T7", "C3", "Cz", "C4", "T8",
  "P7", "P3", "Pz", "P4", "P8",
  "O1", "O2"
]);

export default function ChannelsPage() {
  const router = useRouter();
  const { currentArtifactId, setArtifactId, pipelineHistory, refreshDatasets } = usePreprocessing();
  const [availableChannels, setAvailableChannels] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Check if channels stage is already in history
  const channelsCompleted = pipelineHistory.some((h) => h.stage === "channels");

  useEffect(() => {
    if (!currentArtifactId) {
      router.push("/preprocessing");
      return;
    }

    const fetchChannels = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE}/api/preprocessing/${currentArtifactId}/channels`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch channels: ${response.statusText}`);
        }

        const data = await response.json();
        setAvailableChannels(data.channels);
        // If already completed, pre-select all channels
        if (channelsCompleted) {
          setSelectedChannels(data.channels);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch channels");
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, [currentArtifactId, router, channelsCompleted]);

  const handleSelectChannel = (channel: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  };

  const handleSelectEEGElectrodes = () => {
    const eegChannels = availableChannels.filter((ch) => TEN_TWENTY.has(ch));
    setSelectedChannels(eegChannels);
  };

  const handleSelectAll = () => {
    setSelectedChannels([...availableChannels]);
  };

  const handleClearSelection = () => {
    setSelectedChannels([]);
  };

  const handleConfirm = async () => {
    if (selectedChannels.length === 0) {
      setError("Please select at least one channel");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/api/preprocessing/${currentArtifactId}/pick_channels`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mode: "manual",
            channels: selectedChannels,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to pick channels: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update artifact ID with new ID from response
      setArtifactId(data.id, "channels");
      
      // Refresh datasets list
      refreshDatasets();

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to pick channels");
    } finally {
      setSubmitting(false);
    }
  };

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
          <CardTitle className="text-lg">Select Channels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground">Loading channels...</p>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="min-w-50 justify-start">
                      {selectedChannels.length > 0
                        ? `${selectedChannels.length} channel${selectedChannels.length > 1 ? "s" : ""} selected`
                        : "Select channels..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-75 p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search channels..." />
                      <CommandList>
                        <CommandEmpty>No channels found.</CommandEmpty>
                        <CommandGroup>
                          {availableChannels.map((channel) => (
                            <CommandItem
                              key={channel}
                              value={channel}
                              onSelect={() => handleSelectChannel(channel)}
                            >
                              <div className="flex items-center gap-2 w-full">
                                <div
                                  className={`w-4 h-4 border rounded flex items-center justify-center ${
                                    selectedChannels.includes(channel)
                                      ? "bg-primary border-primary"
                                      : "border-muted-foreground"
                                  }`}
                                >
                                  {selectedChannels.includes(channel) && (
                                    <svg
                                      className="w-3 h-3 text-primary-foreground"
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
                                <span>{channel}</span>
                                {TEN_TWENTY.has(channel) && (
                                  <Badge variant="secondary" className="ml-auto text-xs">
                                    10-20
                                  </Badge>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <Button
                  variant="secondary"
                  onClick={handleSelectEEGElectrodes}
                >
                  Select EEG Electrodes
                </Button>

                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  Select All
                </Button>

                <Button variant="outline" size="sm" onClick={handleClearSelection}>
                  Clear
                </Button>
              </div>

              {/* Selected channels display */}
              {selectedChannels.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Selected channels ({selectedChannels.length}):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedChannels.map((channel) => (
                      <Badge
                        key={channel}
                        variant="secondary"
                        className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleSelectChannel(channel)}
                      >
                        {channel} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Button
                  onClick={handleConfirm}
                  disabled={selectedChannels.length === 0 || submitting}
                >
                  {submitting ? "Processing..." : "Confirm Selection"}
                </Button>
              </div>
            </>
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
            onClick={() => router.push("/preprocessing/montage")}
          >
            Continue to Montage →
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Set electrode positions for the selected channels
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
