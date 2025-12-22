# AGENTS.md - AI Agent Context for BCI Platform Frontend

## Project Overview

This is a **Next.js 16** frontend for a Brain-Computer Interface (BCI) platform that provides an EEG pipeline for preprocessing data and training ML models. The backend uses Python with the MNE library for EEG processing.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui (Radix primitives)
- **State Management:** React Context API

## File Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with fonts
│   ├── page.tsx                 # Home page with 3 options: Preprocessing, Training, Live Mode
│   ├── globals.css              # Global styles + Tailwind + shadcn CSS variables
│   ├── preprocessing/           # Preprocessing pipeline
│   │   ├── layout.tsx           # Shared layout with context provider, timeline, dataset sidebar
│   │   ├── page.tsx             # Upload EDF dataset (Stage 1)
│   │   └── metadata/
│   │       └── page.tsx         # View dataset metadata (Stage 2)
│   ├── training/
│   │   └── page.tsx             # ML training (placeholder)
│   └── live/
│       └── page.tsx             # Real-time inference (placeholder)
├── components/
│   ├── ui/                      # shadcn/ui components (DO NOT EDIT MANUALLY)
│   │   ├── alert.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   └── separator.tsx
│   ├── dataset-sidebar.tsx      # Right sidebar - lists datasets, select/delete
│   ├── pipeline-timeline.tsx    # Left sidebar - shows pipeline stages
│   └── visualizations.tsx       # Visualization buttons component
├── context/
│   └── preprocessing-context.tsx # Global state for artifact IDs and pipeline history
└── lib/
    └── utils.ts                 # Utility functions (cn for classnames)
```

## Pipeline Architecture

### Concept

The preprocessing pipeline is a **multi-stage workflow** where each stage:
1. Has its own route (`/preprocessing`, `/preprocessing/metadata`, `/preprocessing/filter`, etc.)
2. Operates on an **artifact** (a dataset or transformed dataset)
3. May produce a new artifact (mutating stages) or keep the same (non-mutating stages)

### Stages

| Stage | Route | Mutating | Description |
|-------|-------|----------|-------------|
| Upload | `/preprocessing` | Yes | Upload EDF file, receive artifact_id |
| Metadata | `/preprocessing/metadata` | No | View dataset metadata |
| Filter | `/preprocessing/filter` | Yes | Apply bandpass/notch filters (TODO) |

### Adding a New Stage

1. Create `src/app/preprocessing/{stage}/page.tsx`
2. Add stage to `STAGES` array in `src/components/pipeline-timeline.tsx`
3. Use `usePreprocessing()` hook to get `currentArtifactId`
4. Call API with artifact ID, receive new artifact ID if mutating
5. Call `setArtifactId(newId, "stage-name")` to update context

## Artifact Design

### What is an Artifact?

An **artifact** is a unique identifier (UUID) representing a dataset or a transformed version of a dataset stored on the backend. The backend uses MNE's `Raw` class internally.

### Context State (`preprocessing-context.tsx`)

```typescript
interface PreprocessingContextType {
  currentArtifactId: string | null;    // Current artifact being worked on
  previousArtifactId: string | null;   // Input artifact (before mutation)
  pipelineHistory: PipelineStep[];     // All stages completed
  setArtifactId: (id: string, stage: string) => void;
  reset: () => void;
}

interface PipelineStep {
  stage: string;      // e.g., "upload", "metadata", "filter"
  artifactId: string; // UUID of artifact at this stage
  timestamp: Date;
}
```

### Flow Example

1. User uploads EDF → Backend returns `artifact_id: "abc-123"`
2. Context: `currentArtifactId = "abc-123"`, history = `[{stage: "upload", artifactId: "abc-123"}]`
3. User views metadata → Non-mutating, same artifact
4. User applies filter → Backend returns `artifact_id: "def-456"`
5. Context: `previousArtifactId = "abc-123"`, `currentArtifactId = "def-456"`

## Backend API

**Base URL:** `http://localhost:8000` (configurable via `NEXT_PUBLIC_API_URL`)

### Endpoints Used

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/datasets/` | List all datasets |
| POST | `/api/datasets/datasets/new` | Upload EDF file (multipart/form-data) |
| GET | `/api/datasets/datasets/{id}` | Get dataset info |
| DELETE | `/api/datasets/datasets/{id}` | Delete dataset |
| GET | `/api/datasets/datasets/{id}/metadata` | Get dataset metadata |

### Response Types

```typescript
// GET /api/datasets/
interface Dataset {
  id: string;
  original_filename: string;
  size_bytes: number;
  created_at: number;
  modified_at: number;
}

// GET /api/datasets/datasets/{id}/metadata
interface DatasetMetadata {
  duration_seconds: number;
  sampling_frequency_hz: number;
  time_points: number;
  eeg_channel_count: number;
  highpass_hz: number;
  lowpass_hz: number;
}
```

### Future Endpoints (Not Yet Implemented)

- `GET /visualizations/{id}/psd` - PSD plot
- `GET /visualizations/{id}/raw` - Raw signal plot
- `POST /api/preprocessing/filter` - Apply filters

## Styling Guidelines

### General Rules

1. **Use shadcn/ui components** - Install via `npx shadcn@latest add <component>`
2. **Use default colors** - No `bg-black`, use `bg-background`, `text-foreground`, etc.
3. **Minimalistic design** - Functional, no fancy animations
4. **Use Tailwind classes** - Prefer Tailwind over custom CSS

### Color Tokens (from shadcn)

- `bg-background` / `text-foreground` - Main background/text
- `bg-muted` / `text-muted-foreground` - Secondary/disabled
- `bg-primary` / `text-primary` - Primary actions
- `bg-destructive` / `text-destructive` - Delete/error actions
- `border` - Default border color

### Component Patterns

```tsx
// Card with title
<Card>
  <CardHeader>
    <CardTitle className="text-lg">Title</CardTitle>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>

// Placeholder/coming soon card
<Card className="border-dashed">
  <CardHeader>
    <CardTitle className="text-lg text-muted-foreground">Coming Soon</CardTitle>
  </CardHeader>
</Card>

// Error alert
<Alert variant="destructive">
  <AlertDescription>{error}</AlertDescription>
</Alert>
```

### Layout Pattern

The preprocessing layout uses a 3-column flex layout:
```
[Timeline (w-48)] [Content (flex-1)] [Dataset Sidebar (w-56)]
```

## Key Components

### `PreprocessingProvider`

Wrap preprocessing pages to access artifact state:
```tsx
const { currentArtifactId, setArtifactId, reset, pipelineHistory } = usePreprocessing();
```

### `PipelineTimeline`

Left sidebar showing pipeline stages. Automatically highlights current stage based on route.

### `DatasetSidebar`

Right sidebar listing all datasets. Click to select (with confirmation dialog), hover to delete.

### `Visualizations`

Reusable component for visualization buttons. Pass `artifactId` prop:
```tsx
<Visualizations artifactId={currentArtifactId} />
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API base URL |

## Commands

```bash
npm run dev      # Start development server (port 3000)
npm run build    # Build for production
npm run lint     # Run ESLint
```

## Adding shadcn Components

```bash
npx shadcn@latest add <component-name>
# Example: npx shadcn@latest add select
```

Available components: https://ui.shadcn.com/docs/components
