import React from "react";
import { MapPin, Phone, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "../assets/bmp-logo.svg";

export default function Footer() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-8 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid gap-5 rounded-[24px] border border-slate-200 bg-slate-950 p-5 text-slate-200 shadow-xl shadow-slate-200/60 lg:grid-cols-[1.2fr,0.85fr,0.95fr] lg:p-6">
          <div>
            <button type="button" onClick={() => navigate("/")} className="flex items-center gap-3 text-left">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white">
                <img src={logo} alt="BMP.tn logo" className="h-10 w-10" />
              </div>
              <div>
                <div className="text-base font-semibold text-white">BMP.tn</div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Official platform</div>
              </div>
            </button>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">{t("footer.description")}</p>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Navigation</h3>
            <div className="mt-3 grid gap-2 text-sm">
              <Link to="/" className="text-slate-300 transition hover:text-white">Home</Link>
              <Link to="/login" className="text-slate-300 transition hover:text-white">Sign in</Link>
              <Link to="/login-phone" className="text-slate-300 transition hover:text-white">Phone access</Link>
              <Link to="/register" className="text-slate-300 transition hover:text-white">Create account</Link>
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Contact</h3>
            <div className="mt-3 space-y-2.5 text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-indigo-300" />
                <span>{t("footer.contact.address")}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-indigo-300" />
                <span>{t("footer.contact.phone")}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-indigo-300" />
                <a href="mailto:contact@bmp.tn" className="transition hover:text-white">contact@bmp.tn</a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 px-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div>{t("footer.copyright", { year: currentYear })}</div>
          <div>{t("footer.version", { version: "1.0.0" })}</div>
        </div>
      </div>
    </footer>
  );
}
