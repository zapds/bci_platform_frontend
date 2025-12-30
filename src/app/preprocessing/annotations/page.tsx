"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface ColumnMapping {
  onset: string | null;
  duration: string | null;
  description: string | null;
}

export default function AnnotationsPage() {
  const router = useRouter();
  const { currentArtifactId, setArtifactId, refreshDatasets } = usePreprocessing();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    onset: null,
    duration: null,
    description: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Popover open states
  const [onsetOpen, setOnsetOpen] = useState(false);
  const [durationOpen, setDurationOpen] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);

  if (!currentArtifactId) {
    router.push("/preprocessing");
    return null;
  }

  const parseCSVHeader = (text: string): string[] => {
    const firstLine = text.split(/\r?\n/)[0];
    if (!firstLine) return [];
    
    // Simple CSV parsing - handle quoted values
    const columns: string[] = [];
    let current = "";
    let inQuotes = false;
    
    for (let i = 0; i < firstLine.length; i++) {
      const char = firstLine[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        columns.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    columns.push(current.trim());
    
    return columns.filter(col => col.length > 0);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setFile(selectedFile);
    setColumnMapping({ onset: null, duration: null, description: null });

    try {
      // Read first part of file to get headers
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const parsedColumns = parseCSVHeader(text);
        
        if (parsedColumns.length === 0) {
          setError("Could not parse CSV headers. Please check the file format.");
          setFile(null);
          setColumns([]);
          return;
        }
        
        setColumns(parsedColumns);
        
        // Auto-detect common column names
        const lowerColumns = parsedColumns.map(c => c.toLowerCase());
        const autoMapping: ColumnMapping = { onset: null, duration: null, description: null };
        
        parsedColumns.forEach((col) => {
          const lower = col.toLowerCase();
          if (lower.includes("onset") || lower === "start" || lower === "time") {
            if (!autoMapping.onset) autoMapping.onset = col;
          }
          if (lower.includes("duration") || lower === "length") {
            if (!autoMapping.duration) autoMapping.duration = col;
          }
          if (lower.includes("description") || lower.includes("desc") || lower === "event" || lower === "label" || lower === "type") {
            if (!autoMapping.description) autoMapping.description = col;
          }
        });
        
        setColumnMapping(autoMapping);
      };
      
      // Read first 4KB to get headers
      const blob = selectedFile.slice(0, 4096);
      reader.readAsText(blob);
    } catch (err) {
      setError("Failed to read CSV file");
      setFile(null);
      setColumns([]);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setColumns([]);
    setColumnMapping({ onset: null, duration: null, description: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirm = async () => {
    if (!file) {
      setError("Please select a CSV file");
      return;
    }
    if (!columnMapping.onset || !columnMapping.duration || !columnMapping.description) {
      setError("Please map all three columns: onset, duration, and description");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("onset_column", columnMapping.onset);
      formData.append("duration_column", columnMapping.duration);
      formData.append("description_column", columnMapping.description);

      const response = await fetch(
        `${API_BASE}/api/preprocessing/${currentArtifactId}/set_annotations`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || `Failed to set annotations: ${response.statusText}`);
      }

      const data = await response.json();

      // Update artifact ID with new ID from response
      setArtifactId(data.id, "annotations");

      // Refresh datasets list
      refreshDatasets();

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set annotations");
    } finally {
      setSubmitting(false);
    }
  };

  const renderColumnSelect = (
    label: string,
    field: keyof ColumnMapping,
    open: boolean,
    setOpen: (open: boolean) => void
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            {columnMapping[field] || `Select ${label.toLowerCase()} column...`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search columns..." />
            <CommandList>
              <CommandEmpty>No columns found.</CommandEmpty>
              <CommandGroup>
                {columns.map((column) => (
                  <CommandItem
                    key={column}
                    value={column}
                    onSelect={() => {
                      setColumnMapping(prev => ({ ...prev, [field]: column }));
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div
                        className={`w-4 h-4 border rounded flex items-center justify-center ${
                          columnMapping[field] === column
                            ? "bg-primary border-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {columnMapping[field] === column && (
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
                      <span>{column}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );

  const allColumnsMapped = columnMapping.onset && columnMapping.duration && columnMapping.description;

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Set Annotations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">Annotations CSV File</Label>
            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="flex-1"
              />
              {file && (
                <Button variant="outline" size="sm" onClick={handleClearFile}>
                  Clear
                </Button>
              )}
            </div>
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Column Mapping */}
          {columns.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <h4 className="text-sm font-medium mb-2">Map Columns</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Found {columns.length} columns: {columns.join(", ")}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {renderColumnSelect("Onset", "onset", onsetOpen, setOnsetOpen)}
                {renderColumnSelect("Duration", "duration", durationOpen, setDurationOpen)}
                {renderColumnSelect("Description", "description", descriptionOpen, setDescriptionOpen)}
              </div>

              {allColumnsMapped && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  <p className="font-medium mb-1">Column Mapping Summary:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Onset times: <code className="bg-background px-1 rounded">{columnMapping.onset}</code></li>
                    <li>• Durations: <code className="bg-background px-1 rounded">{columnMapping.duration}</code></li>
                    <li>• Descriptions: <code className="bg-background px-1 rounded">{columnMapping.description}</code></li>
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="pt-4">
            <Button
              onClick={handleConfirm}
              disabled={!file || !allColumnsMapped || submitting}
            >
              {submitting ? "Processing..." : "Apply Annotations"}
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
