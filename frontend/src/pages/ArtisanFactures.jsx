import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, FileText, Receipt, Download, FileSpreadsheet } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { exportDocumentExcel, exportDocumentPdf } from "../utils/documentExport";
import SimpleFooter from "../components/Footer";

function DocRow({ type, item, onCreateInvoice }) {
  const icon = type === 'quote' ? <FileText className="h-5 w-5" /> : <Receipt className="h-5 w-5" />;
  const title = type === 'quote' ? 'Devis' : 'Facture';
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">{icon}</div>
        <div>
          <div className="text-sm font-semibold text-slate-900">{title} • {item._id}</div>
          <div className="mt-2 text-sm text-slate-600">Projet: {item.projectId}</div>
          <div className="mt-1 text-sm text-slate-600">Statut: {item.status}</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">Total: {Number(item.total || 0).toFixed(3)} TND</div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {type === 'quote' && <button onClick={() => onCreateInvoice(item)} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Créer facture</button>}
        <button onClick={() => exportDocumentPdf(type, item)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Download className="h-4 w-4" /> PDF</button>
        <button onClick={() => exportDocumentExcel(type, item)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><FileSpreadsheet className="h-4 w-4" /> Excel</button>
      </div>
    </div>
  );
}

export default function ArtisanFactures() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [documents, setDocuments] = useState({ quotes: [], invoices: [] });
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchDocs = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/documents/my', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Chargement impossible');
      setDocuments({ quotes: data.quotes || [], invoices: data.invoices || [] });
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { if (token) fetchDocs(); }, [token]);

  const filteredQuotes = useMemo(() => documents.quotes.filter((item) => JSON.stringify(item).toLowerCase().includes(search.toLowerCase())), [documents.quotes, search]);
  const filteredInvoices = useMemo(() => documents.invoices.filter((item) => JSON.stringify(item).toLowerCase().includes(search.toLowerCase())), [documents.invoices, search]);

  const createInvoice = async (quote) => {
    try {
      const response = await fetch('http://localhost:5000/api/documents/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ devisId: quote._id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Création facture impossible');
      await fetchDocs();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex-1">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Factures & devis</h1>
          <p className="mt-2 text-sm text-slate-500">Retrouvez tous vos devis et factures au même endroit.</p>
        </div>
        <button onClick={() => navigate('/artisan/devis/create')} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Nouveau devis
        </button>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par projet, statut ou identifiant" className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none" />
        </div>
      </div>

      {error && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <section className="mt-8 space-y-4">
        <div className="flex items-center gap-2"><FileText className="h-5 w-5 text-indigo-600" /><h2 className="text-xl font-semibold text-slate-900">Devis</h2></div>
        {filteredQuotes.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">Aucun devis pour le moment.</div> : filteredQuotes.map((item) => <DocRow key={item._id} type="quote" item={item} onCreateInvoice={createInvoice} />)}
      </section>

      <section className="mt-10 space-y-4">
        <div className="flex items-center gap-2"><Receipt className="h-5 w-5 text-indigo-600" /><h2 className="text-xl font-semibold text-slate-900">Factures</h2></div>
        {filteredInvoices.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">Aucune facture pour le moment.</div> : filteredInvoices.map((item) => <DocRow key={item._id} type="invoice" item={item} onCreateInvoice={() => {}} />)}
      </section>
      <SimpleFooter />
    </div>
  );
}
