import React from "react";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "../assets/bmp-logo.svg";

export default function Footer({ compact = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  if (compact) {
    return (
      <footer className="border-t border-slate-200 bg-white/95">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-5 py-4 text-slate-200 shadow-xl shadow-slate-200/60 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-sm">
                <img src={logo} alt="BMP.tn logo" className="h-11 w-11" />
              </div>
              <div>
                <div className="text-base font-semibold text-white">BMP.tn</div>
                <div className="text-xs text-slate-400">Professional access for artisans, suppliers and prescribers</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Create account
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-1 px-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <div>{t("footer.copyright", { year: currentYear })}</div>
            <div>{t("footer.version", { version: "1.0.0" })}</div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-8 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-200 shadow-2xl shadow-slate-200/70">
          <div className="grid gap-6 px-6 py-7 sm:px-8 lg:grid-cols-[1.15fr,0.85fr,0.9fr] lg:px-10 lg:py-8">
            <div>
              <button type="button" onClick={() => navigate("/")} className="flex items-center gap-3 text-left">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-sm">
                  <img src={logo} alt="BMP.tn logo" className="h-11 w-11" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-white">BMP.tn</div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Professional access</div>
                </div>
              </button>

              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">{t("footer.description")}</p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Create account
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Sign in
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Quick links</h3>
              <div className="mt-4 grid gap-2 text-sm">
                <Link to="/" className="text-slate-300 transition hover:text-white">Home</Link>
                <Link to="/login" className="text-slate-300 transition hover:text-white">Sign in</Link>
                <Link to="/login-phone" className="text-slate-300 transition hover:text-white">Phone access</Link>
                <Link to="/register" className="text-slate-300 transition hover:text-white">Create account</Link>
              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Contact</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-blue-300" />
                  <span>{t("footer.contact.address")}</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <Phone className="h-4 w-4 text-blue-300" />
                  <span>{t("footer.contact.phone")}</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <Mail className="h-4 w-4 text-blue-300" />
                  <a href="mailto:contact@bmp.tn" className="transition hover:text-white">contact@bmp.tn</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 px-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div>{t("footer.copyright", { year: currentYear })}</div>
          <div>{t("footer.version", { version: "1.0.0" })}</div>
        </div>
      </div>
    </footer>
  );
}
