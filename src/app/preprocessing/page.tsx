"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePreprocessing } from "@/context/preprocessing-context";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function PreprocessingUploadPage() {
  const router = useRouter();
  const { setArtifactId, currentArtifactId } = usePreprocessing();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE}/api/datasets/new`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      const artifactId = data.id || data.dataset_id || data.uuid;

      setArtifactId(artifactId, "upload");
      router.push("/preprocessing/metadata");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // If already uploaded, show option to continue or upload new
  if (currentArtifactId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dataset Uploaded</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            <span className="text-muted-foreground">Current Artifact ID:</span>{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-sm">
              {currentArtifactId}
            </code>
          </p>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/preprocessing/metadata")}>
              Continue to Metadata
            </Button>
          </div>
        </CardContent>
      </Card>
    );
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
          <CardTitle className="text-lg">Upload EDF Dataset</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edf-file">EDF File</Label>
              <Input
                id="edf-file"
                type="file"
                accept=".edf"
                onChange={handleFileChange}
                className="mt-1"
              />
            </div>
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
            <Button onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
