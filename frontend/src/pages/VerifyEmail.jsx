import React, { useEffect, useMemo, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { HardHat, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { apiFetch } from "../auth/api";
import { useTranslation } from '../i18n';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function VerifyEmail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const q = useQuery();
  const token = q.get("token") || "";

  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [message, setMessage] = useState("");
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage(t('verifyEmail.missingToken'));
      return;
    }

    // Already called (React Strict Mode double-invoke guard)
    if (hasVerified.current) return;
    hasVerified.current = true;

    apiFetch(`/auth/verify-email?token=${encodeURIComponent(token)}`, { method: "GET" })
      .then((data) => {
        setStatus("ok");
        setMessage(data.message || t('verifyEmail.successDefaultMessage'));
      })
      .catch((e) => {
        setStatus("error");
        setMessage(e.message || t('verifyEmail.errorDefaultMessage'));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/60 to-slate-100 px-4">
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(circle_at_1px_1px,rgba(99,102,241,0.18)_1px,transparent_0)] [background-size:22px_22px]" />
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-300/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-sky-300/50 blur-3xl" />

      <div className="relative w-full max-w-xl rounded-3xl border border-slate-200/80 bg-white/90 p-10 shadow-lg shadow-slate-200/60 backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-700 text-white">
            <HardHat className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{t('verifyEmail.title')}</h1>
            <p className="text-slate-600">{t('verifyEmail.subtitle')}</p>
          </div>
        </div>

        <div className="mt-8">
          {status === "loading" && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-700">
              {t('verifyEmail.loadingMessage')}
            </div>
          )}

          {status === "ok" && (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-5 w-5" />
              <div>
                <div className="font-medium">{t('verifyEmail.successTitle')}</div>
                <div className="text-sm">{message}</div>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800">
              <XCircle className="mt-0.5 h-5 w-5" />
              <div>
                <div className="font-medium">{t('verifyEmail.errorTitle')}</div>
                <div className="text-sm">{message}</div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate("/login", { replace: true })}
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-700 px-5 py-4 text-lg font-semibold text-white hover:bg-indigo-800"
        >
          {t('verifyEmail.goToLoginButton')} <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}