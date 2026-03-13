import React from "react";
import { ShieldCheck, Building2, BadgeCheck } from "lucide-react";
import logo from "../assets/bmp-logo.svg";

const DEFAULT_ITEMS = [
  {
    icon: ShieldCheck,
    title: "Trusted access",
    text: "Secure authentication for artisans, prescribers, suppliers and administrators.",
  },
  {
    icon: Building2,
    title: "Professional workspace",
    text: "A clear and modern entry point designed for daily business use.",
  },
  {
    icon: BadgeCheck,
    title: "Structured experience",
    text: "Consistent sign in and onboarding flows across the BMP.tn platform.",
  },
];

export default function AuthShowcasePanel({
  eyebrow = "BMP.tn",
  title = "Access the BMP.tn workspace",
  description = "Official digital platform for the construction sector.",
  items = DEFAULT_ITEMS,
}) {
  return (
    <section className="relative hidden overflow-hidden bg-indigo-700 p-10 text-white lg:flex lg:min-h-full lg:flex-col lg:justify-between">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.16),transparent_28%)]" />
      <div className="relative">
        <div className="inline-flex items-center gap-4">
          <div className="rounded-[28px] bg-white/12 p-3 ring-1 ring-white/15 backdrop-blur">
            <img src={logo} alt="BMP.tn logo" className="h-16 w-16" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-100/85">{eyebrow}</div>
            <div className="mt-2 text-3xl font-semibold leading-tight">{title}</div>
          </div>
        </div>

        <p className="mt-8 max-w-lg text-base leading-7 text-indigo-50/90">{description}</p>

        <div className="mt-10 grid gap-4">
          {items.map(({ icon: Icon, title: itemTitle, text }) => (
            <div key={itemTitle} className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/15">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{itemTitle}</div>
                  <div className="mt-1 text-sm leading-6 text-indigo-50/85">{text}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative pt-10 text-sm text-indigo-100/85">
        BMP.tn supports secure access for construction professionals across the platform.
      </div>
    </section>
  );
}
