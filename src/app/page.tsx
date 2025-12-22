import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">BCI Platform</h1>
        <p className="text-muted-foreground mb-8">EEG Pipeline for preprocessing and ML training</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/preprocessing">
            <Card className="hover:border-primary cursor-pointer h-full">
              <CardHeader>
                <CardTitle>Preprocessing</CardTitle>
                <CardDescription>
                  Upload EDF files, apply filters, and prepare data for training
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/training">
            <Card className="hover:border-primary cursor-pointer h-full">
              <CardHeader>
                <CardTitle>Training</CardTitle>
                <CardDescription>
                  Train ML models on preprocessed EEG data
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/live">
            <Card className="hover:border-primary cursor-pointer h-full">
              <CardHeader>
                <CardTitle>Live Mode</CardTitle>
                <CardDescription>
                  Real-time EEG processing and inference
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </main>
  );
}
