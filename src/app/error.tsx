"use client";

import Button from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
        <h1 className="text-2xl font-bold">Qualcosa è andato storto</h1>
        <p className="text-muted-foreground max-w-md">
          Si è verificato un errore imprevisto. Riprova o torna alla homepage.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => reset()}>Riprova</Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Torna alla Home
          </Button>
        </div>
      </div>
    </div>
  );
}
