import React from "react";
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "../assets/bmp-logo.svg";

const socials = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Youtube, href: "#", label: "YouTube" },
];

export default function Footer({ compact = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  if (compact) {
    return (
      <footer className="px-0 pb-0 pt-8">
        <div className="w-full rounded-[28px] border-[6px] border-white bg-[#171b24] px-6 py-6 text-slate-300 shadow-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <img src={logo} alt="BMP.tn" className="h-10 w-10 rounded-full bg-white p-2" />
              <div>
                <div className="text-lg font-semibold text-white">BMP.tn</div>
                <div className="text-sm text-slate-400">Construction digital platform</div>
              </div>
            </div>
            <div className="text-sm text-slate-400">{t("footer.copyright", { year: currentYear })}</div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="px-0 py-8">
      <div className="w-full rounded-[30px] border-[6px] border-white bg-[#171b24] px-8 py-10 text-slate-300 shadow-[0_24px_60px_rgba(15,23,42,0.25)]">
        <div className="grid gap-10 lg:grid-cols-[1.4fr,1fr,1fr,1fr]">
          <div>
            <button type="button" onClick={() => navigate("/")} className="flex items-center gap-3 text-left">
              <img src={logo} alt="BMP.tn logo" className="h-11 w-11 rounded-full bg-white p-2" />
              <div>
                <div className="text-2xl font-semibold leading-none text-white">BMP.tn</div>
              </div>
            </button>

            <p className="mt-5 max-w-sm text-base leading-7 text-slate-300">
              {t("footer.description")}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-slate-700/70 text-slate-200 transition hover:bg-blue-600 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">Use Cases</h3>
            <div className="mt-5 grid gap-3 text-sm text-slate-400">
              <Link to="/register" className="transition hover:text-white">Create account</Link>
              <Link to="/login" className="transition hover:text-white">Login access</Link>
              <Link to="/register" className="transition hover:text-white">Join marketplace</Link>
              <Link to="/register" className="transition hover:text-white">Professional onboarding</Link>
              <Link to="/login-phone" className="transition hover:text-white">Phone access</Link>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">Company</h3>
            <div className="mt-5 grid gap-3 text-sm text-slate-400">
              <Link to="/register" className="transition hover:text-white">Our platform</Link>
              <Link to="/login" className="transition hover:text-white">Business areas</Link>
              <Link to="/register-role" className="transition hover:text-white">Career access</Link>
              <Link to="/register" className="transition hover:text-white">Marketplace growth</Link>
              <Link to="/login" className="transition hover:text-white">History</Link>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">Contact</h3>
            <div className="mt-5 space-y-4 text-sm text-slate-400">
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>Phone: +216 00 000 000</span>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>Email: contact@bmptn.com</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>Address: Tunisia</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-700 pt-6 text-center text-sm text-slate-500">
          © Copyright {currentYear} BMP.tn
        </div>
      </div>
    </footer>
  );
}
