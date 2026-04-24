import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // Placeholder — wire up to a real endpoint when ready
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Link to="/login" className="text-lg font-bold text-slate-900">BMP.tn</Link>
        <Link to="/login" className="text-sm text-blue-600 hover:underline">← Retour</Link>
      </header>

      <main className="max-w-xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Contactez-nous</h1>
        <p className="text-slate-600 mb-8">
          Une question, un problème ou une suggestion ? Écrivez-nous, nous répondons sous 24h.
        </p>

        {sent ? (
          <div className="rounded-xl bg-green-50 border border-green-200 p-6 text-green-800 text-sm">
            ✓ Votre message a bien été envoyé. Nous vous répondrons rapidement.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Votre nom"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="votre@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
              <textarea
                name="message"
                required
                rows={5}
                value={form.message}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                placeholder="Décrivez votre demande..."
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Envoyer le message
            </button>
          </form>
        )}

        <div className="mt-10 text-sm text-slate-500">
          <p>Vous pouvez aussi nous joindre par email :</p>
          <a href="mailto:contact@bmp.tn" className="text-blue-600 hover:underline">
            contact@bmp.tn
          </a>
        </div>
      </main>
    </div>
  );
}
