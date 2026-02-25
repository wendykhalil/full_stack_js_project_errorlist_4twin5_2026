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
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  return (
    <footer className="bg-white border-t border-slate-200 mt-9 dark:bg-slate-900 dark:border-slate-800">
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
              <span className="text-xl font-bold text-slate-900 dark:text-white">BMP.tn</span>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {t('footer.description')}
            </p>
            
            <div className="flex items-center gap-3 pt-2">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white transition-all duration-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-indigo-600 dark:hover:text-white"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white transition-all duration-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-indigo-600 dark:hover:text-white"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white transition-all duration-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-indigo-600 dark:hover:text-white"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              {t('footer.quickLinks.title')}
            </h3>
            <ul className="space-y-3">
              {[
                { path: "/about", key: "about" },
                { path: "/contact", key: "contact" },
                { path: "/blog", key: "blog" },
                { path: "/faq", key: "faq" },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="group flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors dark:text-slate-400 dark:hover:text-indigo-400"
                  >
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all" />
                    {t(`footer.quickLinks.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              {t('footer.legal.title')}
            </h3>
            <ul className="space-y-3">
              {[
                { path: "/terms", key: "terms" },
                { path: "/privacy", key: "privacy" },
                { path: "/cookies", key: "cookies" },
                { path: "/legal", key: "legal" },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="group flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors dark:text-slate-400 dark:hover:text-indigo-400"
                  >
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all" />
                    {t(`footer.legal.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              {t('footer.contact.title')}
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                <MapPin className="h-5 w-5 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
                <span>{t('footer.contact.address')}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <Phone className="h-5 w-5 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
                <span>{t('footer.contact.phone')}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <Mail className="h-5 w-5 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
                <a href="mailto:contact@bmp.tn" className="hover:text-indigo-600 transition-colors dark:hover:text-indigo-400">
                  contact@bmp.tn
                </a>
              </li>
            </ul>

            <div className="pt-4">
              <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">{t('footer.newsletter.title')}</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder={t('footer.newsletter.placeholder')}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                />
                <button className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors dark:bg-indigo-600 dark:hover:bg-indigo-700">
                  {t('footer.newsletter.button')}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('footer.copyright', { year: currentYear })}
              <span className="hidden sm:inline"> {t('footer.copyrightExtra')}</span>
            </p>
            <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span>{t('footer.version', { version: '1.0.0' })}</span>
              <span>•</span>
              <span>{t('footer.madeWith')}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}