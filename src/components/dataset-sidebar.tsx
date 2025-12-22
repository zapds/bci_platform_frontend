"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePreprocessing } from "@/context/preprocessing-context";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Dataset {
  id: string;
  original_filename: string;
  size_bytes: number;
  created_at: number;
  modified_at: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function DatasetSidebar() {
  const { setArtifactId, currentArtifactId, reset } = usePreprocessing();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchDatasets = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/datasets/`);
      if (response.ok) {
        const data = await response.json();
        setDatasets(data);
      }
    } catch (err) {
      console.error("Failed to fetch datasets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`${API_BASE}/api/datasets/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setDatasets((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete dataset:", err);
    }
  };

  const handleDatasetClick = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setDialogOpen(true);
  };

  const handleConfirmSelect = () => {
    if (selectedDataset) {
      reset();
      setArtifactId(selectedDataset.id, "upload");
      setDialogOpen(false);
      setSelectedDataset(null);
    }
  };

  if (collapsed) {
    return (
      <div className="w-8 border-l flex flex-col items-center pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setCollapsed(false)}
        >
          ◀
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="w-56 border-l pl-4 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Datasets</h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={fetchDatasets}
              title="Refresh"
            >
              ↻
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setCollapsed(true)}
            >
              ▶
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : datasets.length === 0 ? (
            <p className="text-xs text-muted-foreground">No datasets</p>
          ) : (
            <div className="space-y-0.5">
              {datasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className={`group flex items-center justify-between py-1 px-1.5 rounded text-sm hover:bg-muted cursor-pointer ${
                    currentArtifactId === dataset.id ? "bg-muted" : ""
                  }`}
                  onMouseEnter={() => setHoveredId(dataset.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => handleDatasetClick(dataset)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs" title={dataset.original_filename}>
                      {dataset.original_filename}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(dataset.size_bytes)}
                    </p>
                  </div>
                  {hoveredId === dataset.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                      onClick={(e) => handleDelete(dataset.id, e)}
                      title="Delete"
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Dataset</DialogTitle>
            <DialogDescription>
              Do you want to select this dataset as the current working dataset?
              This will reset the current pipeline.
            </DialogDescription>
          </DialogHeader>
          {selectedDataset && (
            <div className="py-2">
              <p className="text-sm font-medium">{selectedDataset.original_filename}</p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(selectedDataset.size_bytes)} • ID: {selectedDataset.id.slice(0, 8)}...
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSelect}>Select</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
