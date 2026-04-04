"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import Button from "@/components/ui/Button";

export default function HomeAuthCTA() {
  const { user, loading } = useAuth();

  if (loading || user) return null;

  return (
    <div className="flex items-center justify-center gap-3 mt-4">
      <Link href="/registrati">
        <Button size="sm">Registrati</Button>
      </Link>
      <Link href="/accedi">
        <Button variant="outline" size="sm">Accedi</Button>
      </Link>
    </div>
  );
}
