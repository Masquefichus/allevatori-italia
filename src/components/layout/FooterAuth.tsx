"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

export default function FooterAuth() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return (
      <>
        <li>
          <Link href="/dashboard" className="hover:text-white transition-colors">
            Dashboard
          </Link>
        </li>
        <li>
          <Link href="/dashboard/profilo" className="hover:text-white transition-colors">
            Profilo
          </Link>
        </li>
        <li>
          <Link href="/dashboard/impostazioni" className="hover:text-white transition-colors">
            Impostazioni
          </Link>
        </li>
      </>
    );
  }

  return (
    <>
      <li>
        <Link href="/registrati" className="hover:text-white transition-colors">
          Registrati
        </Link>
      </li>
      <li>
        <Link href="/accedi" className="hover:text-white transition-colors">
          Accedi
        </Link>
      </li>
    </>
  );
}
