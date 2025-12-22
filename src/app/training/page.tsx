import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TrainingPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              ← Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Training</h1>
        </div>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg text-muted-foreground">
              Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              ML model training interface will be available here.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
