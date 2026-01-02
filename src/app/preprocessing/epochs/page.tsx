"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type BaselineOption = "none" | "start_to_zero" | "custom";

interface EpochsRequest {
  tmin: number;
  tmax: number;
  baseline?: [number | null, number | null] | null;
  reject_criteria?: { eeg?: number; eog?: number } | null;
  events_filter?: string[] | null;
  set_reference?: boolean;
}

export default function EpochsPage() {
  const router = useRouter();
  const { currentArtifactId, setArtifactId, refreshDatasets } = usePreprocessing();

  // Event names state
  const [eventNames, setEventNames] = useState<string[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);

  // Form state
  const [tmin, setTmin] = useState("-0.2");
  const [tmax, setTmax] = useState("0.8");
  const [baselineOption, setBaselineOption] = useState<BaselineOption>("start_to_zero");
  const [baselineStart, setBaselineStart] = useState("");
  const [baselineEnd, setBaselineEnd] = useState("0");
  const [rejectEeg, setRejectEeg] = useState("");
  const [setReference, setSetReference] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch event names on mount
  useEffect(() => {
    if (!currentArtifactId) {
      router.push("/preprocessing");
      return;
    }

    const fetchEventNames = async () => {
      setLoadingEvents(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE}/api/preprocessing/${currentArtifactId}/event_names`
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Dataset not found");
          }
          throw new Error(`Failed to fetch event names: ${response.statusText}`);
        }

        const data: string[] = await response.json();
        setEventNames(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch event names");
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEventNames();
  }, [currentArtifactId, router]);

  const handleSelectEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  };

  const handleSelectAllEvents = () => {
    setSelectedEvents([...eventNames]);
  };

  const handleClearEvents = () => {
    setSelectedEvents([]);
  };

  const handlePreset = (preset: string) => {
    switch (preset) {
      case "erp":
        setTmin("-0.2");
        setTmax("0.8");
        setBaselineOption("start_to_zero");
        break;
      case "motor":
        setTmin("-0.5");
        setTmax("1.0");
        setBaselineOption("start_to_zero");
        break;
      case "p300":
        setTmin("-0.1");
        setTmax("0.6");
        setBaselineOption("start_to_zero");
        break;
      case "ssvep":
        setTmin("0");
        setTmax("2.0");
        setBaselineOption("none");
        break;
    }
  };

  const handleCreateEpochs = async () => {
    // Validate inputs
    const tminNum = parseFloat(tmin);
    const tmaxNum = parseFloat(tmax);

    if (isNaN(tminNum) || isNaN(tmaxNum)) {
      setError("Please enter valid time values for tmin and tmax");
      return;
    }

    if (tminNum >= tmaxNum) {
      setError("tmin must be less than tmax");
      return;
    }

    // Build request body
    const body: EpochsRequest = {
      tmin: tminNum,
      tmax: tmaxNum,
    };

    // Handle baseline
    if (baselineOption === "none") {
      body.baseline = null;
    } else if (baselineOption === "start_to_zero") {
      body.baseline = [null, 0];
    } else if (baselineOption === "custom") {
      const bStart = baselineStart.trim() === "" ? null : parseFloat(baselineStart);
      const bEnd = baselineEnd.trim() === "" ? null : parseFloat(baselineEnd);

      if (baselineStart.trim() !== "" && isNaN(bStart as number)) {
        setError("Invalid baseline start value");
        return;
      }
      if (baselineEnd.trim() !== "" && isNaN(bEnd as number)) {
        setError("Invalid baseline end value");
        return;
      }

      body.baseline = [bStart, bEnd];
    }

    // Handle reject criteria
    if (rejectEeg.trim() !== "") {
      const rejectValue = parseFloat(rejectEeg);
      if (isNaN(rejectValue) || rejectValue <= 0) {
        setError("Reject threshold must be a positive number");
        return;
      }
      body.reject_criteria = { eeg: rejectValue };
    }

    // Handle events filter
    if (selectedEvents.length > 0) {
      body.events_filter = selectedEvents;
    }

    // Handle reference
    if (setReference) {
      body.set_reference = true;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/api/preprocessing/${currentArtifactId}/create_epochs`,
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
        throw new Error(data.detail || `Failed to create epochs: ${response.statusText}`);
      }

      const data = await response.json();

      // Update artifact ID with new ID from response
      setArtifactId(data.id, "epochs");

      // Refresh datasets list
      refreshDatasets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create epochs");
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

      {/* Event Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Event Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingEvents ? (
            <p className="text-muted-foreground">Loading events...</p>
          ) : eventNames.length === 0 ? (
            <Alert>
              <AlertDescription>
                No events found in this dataset. Epochs will be created using all available annotations.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Select which events to use for epoching. Leave empty to use all events.
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                <Popover open={eventsOpen} onOpenChange={setEventsOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="min-w-50 justify-start">
                      {selectedEvents.length > 0
                        ? `${selectedEvents.length} event${selectedEvents.length > 1 ? "s" : ""} selected`
                        : "Select events..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search events..." />
                      <CommandList>
                        <CommandEmpty>No events found.</CommandEmpty>
                        <CommandGroup>
                          {eventNames.map((event) => (
                            <CommandItem
                              key={event}
                              value={event}
                              onSelect={() => handleSelectEvent(event)}
                            >
                              <div className="flex items-center gap-2 w-full">
                                <div
                                  className={`w-4 h-4 border rounded flex items-center justify-center ${
                                    selectedEvents.includes(event)
                                      ? "bg-primary border-primary"
                                      : "border-muted-foreground"
                                  }`}
                                >
                                  {selectedEvents.includes(event) && (
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
                                <span className="truncate">{event}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <Button variant="outline" size="sm" onClick={handleSelectAllEvents}>
                  Select All
                </Button>

                <Button variant="outline" size="sm" onClick={handleClearEvents}>
                  Clear
                </Button>
              </div>

              {/* Selected events display */}
              {selectedEvents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Selected events ({selectedEvents.length}):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedEvents.map((event) => (
                      <Badge
                        key={event}
                        variant="secondary"
                        className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleSelectEvent(event)}
                      >
                        {event} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Epoch Parameters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Epoch Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Time Window */}
          <div className="space-y-2">
            <Label>Time Window (seconds relative to event)</Label>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="tmin" className="text-xs text-muted-foreground">
                  Start (tmin)
                </Label>
                <Input
                  id="tmin"
                  type="number"
                  step="0.1"
                  placeholder="-0.2"
                  value={tmin}
                  onChange={(e) => setTmin(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tmax" className="text-xs text-muted-foreground">
                  End (tmax)
                </Label>
                <Input
                  id="tmax"
                  type="number"
                  step="0.1"
                  placeholder="0.8"
                  value={tmax}
                  onChange={(e) => setTmax(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Presets */}
          <div className="space-y-2">
            <Label>Common Presets</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset("erp")}
              >
                ERP (-0.2 to 0.8s)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset("motor")}
              >
                Motor Imagery (-0.5 to 1.0s)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset("p300")}
              >
                P300 (-0.1 to 0.6s)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset("ssvep")}
              >
                SSVEP (0 to 2.0s)
              </Button>
            </div>
          </div>

          {/* Baseline Correction */}
          <div className="space-y-2">
            <Label>Baseline Correction</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={baselineOption === "none" ? "default" : "outline"}
                size="sm"
                onClick={() => setBaselineOption("none")}
              >
                None
              </Button>
              <Button
                variant={baselineOption === "start_to_zero" ? "default" : "outline"}
                size="sm"
                onClick={() => setBaselineOption("start_to_zero")}
              >
                Start → 0
              </Button>
              <Button
                variant={baselineOption === "custom" ? "default" : "outline"}
                size="sm"
                onClick={() => setBaselineOption("custom")}
              >
                Custom
              </Button>
            </div>

            {baselineOption === "custom" && (
              <div className="grid gap-4 sm:grid-cols-2 mt-2">
                <div className="space-y-1">
                  <Label htmlFor="baseline-start" className="text-xs text-muted-foreground">
                    Baseline Start (leave empty for epoch start)
                  </Label>
                  <Input
                    id="baseline-start"
                    type="number"
                    step="0.1"
                    placeholder="e.g., -0.2"
                    value={baselineStart}
                    onChange={(e) => setBaselineStart(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="baseline-end" className="text-xs text-muted-foreground">
                    Baseline End (leave empty for epoch end)
                  </Label>
                  <Input
                    id="baseline-end"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 0"
                    value={baselineEnd}
                    onChange={(e) => setBaselineEnd(e.target.value)}
                  />
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {baselineOption === "none" && "No baseline correction will be applied"}
              {baselineOption === "start_to_zero" && "Baseline correction from epoch start to time 0 (event onset)"}
              {baselineOption === "custom" && "Specify custom baseline window in seconds"}
            </p>
          </div>

          {/* Artifact Rejection */}
          <div className="space-y-2">
            <Label htmlFor="reject-eeg">Artifact Rejection (EEG peak-to-peak threshold in Volts)</Label>
            <Input
              id="reject-eeg"
              type="number"
              step="0.00001"
              placeholder="e.g., 0.00015 (150 µV)"
              value={rejectEeg}
              onChange={(e) => setRejectEeg(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Epochs exceeding this threshold will be dropped. Leave empty for no rejection.
              Common values: 100 µV = 0.0001, 150 µV = 0.00015
            </p>
          </div>

          {/* Reference */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="set-reference"
              checked={setReference}
              onChange={(e) => setSetReference(e.target.checked)}
              className="h-4 w-4 rounded border-muted-foreground"
            />
            <Label htmlFor="set-reference" className="cursor-pointer">
              Apply average EEG reference
            </Label>
          </div>

          {/* Summary */}
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md space-y-1">
            <p><strong>Summary:</strong></p>
            <p>• Time window: {tmin}s to {tmax}s relative to event</p>
            <p>• Baseline: {
              baselineOption === "none" ? "None" :
              baselineOption === "start_to_zero" ? "Start → 0" :
              `${baselineStart || "start"} → ${baselineEnd || "end"}`
            }</p>
            <p>• Events: {selectedEvents.length > 0 ? selectedEvents.join(", ") : "All"}</p>
            <p>• Rejection: {rejectEeg ? `${rejectEeg} V` : "None"}</p>
            <p>• Reference: {setReference ? "Average" : "Keep original"}</p>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleCreateEpochs}
              disabled={submitting}
            >
              {submitting ? "Creating Epochs..." : "Create Epochs"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Visualizations artifactId={currentArtifactId} />
    </div>
  );
}
