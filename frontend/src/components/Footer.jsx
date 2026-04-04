import React from "react";

export default function Footer({ compact = false }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="px-4 py-6 text-center">
        <p className="text-sm text-slate-500">
          © {currentYear} BMP.tn. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}