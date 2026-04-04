"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";

export default function PerAllevatoriCTA({ variant = "primary" }: { variant?: "primary" | "white" }) {
  const { user, profile } = useAuth();

  if (user && profile) {
    return (
      <Link href="/dashboard">
        <Button
          size="lg"
          className={variant === "white" ? "bg-white text-primary hover:bg-white/90 shadow-none" : ""}
        >
          Vai al tuo profilo
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    );
  }

  return (
    <Link href="/registrati">
      <Button
        size="lg"
        className={variant === "white" ? "bg-white text-primary hover:bg-white/90 shadow-none" : ""}
      >
        Registrati gratuitamente
        <ArrowRight className="h-4 w-4" />
      </Button>
    </Link>
  );
}
