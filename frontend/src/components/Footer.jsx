import React from "react";
import { 
  HardHat, 
  Facebook, 
  Linkedin, 
  Twitter, 
  Mail, 
  Phone, 
  MapPin,
  ArrowRight
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  return (
    <footer className="bg-white border-t border-slate-200 mt-9">
      {/* Main Footer */}
      <div className="mx-auto p-5 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div className="space-y-4">
            <div 
              onClick={() => navigate('/')} 
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm group-hover:bg-indigo-700 transition-colors">
                <HardHat className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-slate-900">BMP.tn</span>
            </div>
            
            <p className="text-sm text-slate-600 leading-relaxed">
              La première plateforme digitale en Tunisie connectant artisans, 
              prescripteurs et fournisseurs du secteur du bâtiment.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white transition-all duration-200"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white transition-all duration-200"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white transition-all duration-200"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Liens Rapides
            </h3>
            <ul className="space-y-3">
              {[
                { path: "/about", label: "À propos" },
                { path: "/contact", label: "Contact" },
                { path: "/blog", label: "Blog" },
                { path: "/faq", label: "FAQ" },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="group flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors"
                  >
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Informations Légales
            </h3>
            <ul className="space-y-3">
              {[
                { path: "/terms", label: "Conditions d'utilisation" },
                { path: "/privacy", label: "Politique de confidentialité" },
                { path: "/cookies", label: "Gestion des cookies" },
                { path: "/legal", label: "Mentions légales" },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="group flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors"
                  >
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Contact
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-slate-600">
                <MapPin className="h-5 w-5 flex-shrink-0 text-indigo-600" />
                <span>Immeuble BMP, Rue de la Construction, 1000 Tunis, Tunisie</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600">
                <Phone className="h-5 w-5 flex-shrink-0 text-indigo-600" />
                <span>+216 71 123 456</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600">
                <Mail className="h-5 w-5 flex-shrink-0 text-indigo-600" />
                <a href="mailto:contact@bmp.tn" className="hover:text-indigo-600 transition-colors">
                  contact@bmp.tn
                </a>
              </li>
            </ul>

            {/* Newsletter (optional) */}
            <div className="pt-4">
              <p className="mb-2 text-sm font-medium text-slate-700">Newsletter</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Votre email"
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
                <button className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-xs text-slate-500">
              © {currentYear} BMP.tn - Tous droits réservés. 
              <span className="hidden sm:inline"> Plateforme digitale pour le secteur du bâtiment en Tunisie.</span>
            </p>
            <div className="flex gap-4 text-xs text-slate-500">
              <span>Version 1.0.0</span>
              <span>•</span>
              <span>Made with ♥ in Tunisia</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}