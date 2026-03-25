import Link from "next/link";
import { Dog } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Dog className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-white">{SITE_NAME}</span>
            </Link>
            <p className="text-sm text-gray-400 max-w-md">
              La directory italiana degli allevatori professionali di cani.
              Trova allevatori certificati ENCI nella tua regione e il cucciolo
              perfetto per la tua famiglia.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">
              Esplora
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/allevatori" className="hover:text-white transition-colors">
                  Allevatori
                </Link>
              </li>
              <li>
                <Link href="/razze" className="hover:text-white transition-colors">
                  Razze
                </Link>
              </li>
              <li>
                <Link href="/regioni" className="hover:text-white transition-colors">
                  Regioni
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">
              Informazioni
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/chi-siamo" className="hover:text-white transition-colors">
                  Chi Siamo
                </Link>
              </li>
              <li>
                <Link href="/contatti" className="hover:text-white transition-colors">
                  Contatti
                </Link>
              </li>
              <li>
                <Link href="/termini" className="hover:text-white transition-colors">
                  Termini e Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-gray-500 text-center">
          <p suppressHydrationWarning>&copy; {new Date().getFullYear()} {SITE_NAME}. Tutti i diritti riservati.</p>
        </div>
      </div>
    </footer>
  );
}
