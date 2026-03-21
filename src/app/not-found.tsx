import Link from "next/link";
import Button from "@/components/ui/Button";
import { Dog } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <Dog className="h-16 w-16 text-muted-foreground mx-auto" />
        <h1 className="text-4xl font-bold">404</h1>
        <h2 className="text-xl font-semibold">Pagina non trovata</h2>
        <p className="text-muted-foreground max-w-md">
          La pagina che stai cercando non esiste o è stata spostata.
        </p>
        <Link href="/">
          <Button>Torna alla Home</Button>
        </Link>
      </div>
    </div>
  );
}
