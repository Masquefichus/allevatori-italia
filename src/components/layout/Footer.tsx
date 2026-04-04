import Link from "next/link";
import { Dog } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="bg-primary text-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">

          {/* Brand + mission */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Dog className="h-7 w-7 text-white/80" />
              <span className="text-lg font-semibold text-white">{SITE_NAME}</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-sm">
              {SITE_NAME} eleva gli standard per come le persone portano un cane
              nella propria vita. Connettiamo famiglie italiane con una rete
              nazionale di allevatori certificati che mettono la salute e la cura
              al primo posto.
            </p>
          </div>

          {/* Chi siamo */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Chi siamo</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/chi-siamo" className="hover:text-white transition-colors">La nostra storia</Link></li>
              <li><Link href="/chi-siamo" className="hover:text-white transition-colors">La nostra missione</Link></li>
              <li><Link href="/contatti" className="hover:text-white transition-colors">Contatti</Link></li>
            </ul>
          </div>

          {/* Trova un cane */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Trova un cane</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/allevatori" className="hover:text-white transition-colors">Allevatori</Link></li>
              <li><Link href="/razze" className="hover:text-white transition-colors">Razze</Link></li>
              <li><Link href="/regioni" className="hover:text-white transition-colors">Regioni</Link></li>
            </ul>
          </div>

          {/* Per allevatori */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Per allevatori</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/per-allevatori" className="hover:text-white transition-colors">Perché unirsi</Link></li>
              <li><Link href="/registrati" className="hover:text-white transition-colors">Registrati</Link></li>
              <li><Link href="/accedi" className="hover:text-white transition-colors">Accedi</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/30">
          <p>&copy; {new Date().getFullYear()} {SITE_NAME}. Tutti i diritti riservati.</p>
          <div className="flex items-center gap-6">
            <Link href="/termini" className="hover:text-white/60 transition-colors">Termini</Link>
            <Link href="/termini" className="hover:text-white/60 transition-colors">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
