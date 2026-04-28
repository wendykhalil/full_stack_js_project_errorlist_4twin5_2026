import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, FileText, Receipt, Download, FileSpreadsheet } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { exportDocumentExcel, exportDocumentPdf } from "../utils/documentExport";
import SimpleFooter from "../components/Footer";
import { getMySubscription } from "../auth/api";
import SubscriptionAlert from '../components/SubscriptionAlert';
import PageShell from '../components/PageShell';
import { Hint } from "../components/MouseTooltip";
import ReadCardButton from '../components/ReadCardButton';

function getReference(item, type) {
  return item.reference || item.number || `${type === 'quote' ? 'QUOTE' : 'INVOICE'}-${new Date(item.createdAt || Date.now()).getFullYear()}`;
}

function getProjectLabel(item) {
  return item.projectTitle || item.projectName || item.project?.title || 'Aucun projet lie';
}

function DocRow({ type, item, onCreateInvoice }) {
  const icon = type === 'quote' ? <FileText className="h-5 w-5" /> : <Receipt className="h-5 w-5" />;
  const title = type === 'quote' ? 'Devis' : 'Facture';
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">{icon}</div>
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold text-slate-900">{title} • {getReference(item, type)}</div>
            <ReadCardButton text={`${title} ${getReference(item, type)} - Projet: ${getProjectLabel(item)} - Statut: ${item.status} - Total: ${Number(item.total || 0).toFixed(3)} TND`} />
          </div>
          <div className="mt-2 text-sm text-slate-600">Projet : {getProjectLabel(item)}</div>
          <div className="mt-1 text-sm text-slate-600">Statut : {item.status}</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">Total : {Number(item.total || 0).toFixed(3)} TND</div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {type === 'quote' && <Hint text="Convertir ce devis accepté en facture officielle"><button onClick={() => onCreateInvoice(item)} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Creer une facture</button></Hint>}
        <Hint text="Télécharger ce document au format PDF"><button onClick={() => exportDocumentPdf(type, item)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Download className="h-4 w-4" /> PDF</button></Hint>
        <Hint text="Exporter ce document au format Excel"><button onClick={() => exportDocumentExcel(type, item)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><FileSpreadsheet className="h-4 w-4" /> Excel</button></Hint>
      </div>
    </div>
  );
}

export default function ArtisanFactures() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [documents, setDocuments] = useState({ quotes: [], invoices: [] });
  const [activityLogs, setActivityLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState({ plan: 'FREE', status: 'INACTIVE' });
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [showSubscriptionAlert, setShowSubscriptionAlert] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const isSubscribed = subscription?.plan && subscription.plan !== 'FREE' && subscription.status === 'ACTIVE';

  const fetchDocs = async () => {
    try {
      const [docsRes, logsRes] = await Promise.all([
        fetch('http://localhost:5000/api/documents/my', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/documents/activity?limit=30', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const docsData = await docsRes.json();
      const logsData = await logsRes.json();
      if (!docsRes.ok) throw new Error(docsData?.message || 'Impossible de charger les documents');
      if (!logsRes.ok) throw new Error(logsData?.message || 'Impossible de charger l historique des documents');

      setDocuments({ quotes: docsData.quotes || [], invoices: docsData.invoices || [] });
      setActivityLogs(logsData.items || []);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { if (token) fetchDocs(); }, [token]);

  useEffect(() => {
    const loadSubscription = async () => {
      if (!token) {
        setCheckingSubscription(false);
        return;
      }
      try {
        const res = await getMySubscription({ token });
        const subs = res?.data || { plan: 'FREE', status: 'INACTIVE' };
        setSubscription(subs);
      } catch (err) {
      console.error('Erreur chargement abonnement:', err);
        setSubscription({ plan: 'FREE', status: 'INACTIVE' });
      } finally {
        setCheckingSubscription(false);
      }
    };
    loadSubscription();
  }, [token]);

  const filteredQuotes = useMemo(() => documents.quotes.filter((item) => JSON.stringify(item).toLowerCase().includes(search.toLowerCase())), [documents.quotes, search]);
  const filteredInvoices = useMemo(() => documents.invoices.filter((item) => JSON.stringify(item).toLowerCase().includes(search.toLowerCase())), [documents.invoices, search]);

  const createInvoice = async (quote) => {
    if (!isSubscribed) {
      setShowSubscriptionAlert(true);
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/documents/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ devisId: quote._id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Impossible de creer la facture');
      await fetchDocs();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <PageShell className="flex-1 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Devis et factures</h1>
          <p className="mt-2 text-sm text-slate-500">Gerez tous vos documents commerciaux en un seul endroit.</p>
        </div>
        <button onClick={() => navigate('/artisan/devis/create')} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Nouveau devis
        </button>      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par projet ou statut" className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none" />
        </div>
      </div>

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {showSubscriptionAlert && !checkingSubscription && <SubscriptionAlert onClose={() => setShowSubscriptionAlert(false)} />}

      <section className="space-y-4">
        <div className="flex items-center gap-2"><FileText className="h-5 w-5 text-indigo-600" /><h2 className="text-xl font-semibold text-slate-900">Devis</h2></div>
        {filteredQuotes.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">Aucun devis pour le moment.</div> : filteredQuotes.map((item) => <DocRow key={item._id} type="quote" item={item} onCreateInvoice={createInvoice} />)}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2"><Receipt className="h-5 w-5 text-indigo-600" /><h2 className="text-xl font-semibold text-slate-900">Factures</h2></div>
        {filteredInvoices.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">Aucune facture pour le moment.</div> : filteredInvoices.map((item) => <DocRow key={item._id} type="invoice" item={item} onCreateInvoice={() => {}} />)}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2"><Receipt className="h-5 w-5 text-indigo-600" /><h2 className="text-xl font-semibold text-slate-900">Historique devis et factures</h2></div>
          <button
            type="button"
            onClick={() => setShowLogs((prev) => !prev)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {showLogs ? "Masquer les logs" : "Voir les logs"}
          </button>
        </div>
        {showLogs ? (
          activityLogs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
              Aucun historique disponible pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {activityLogs.map((log) => {
                const isQuote = log.action === 'QUOTE_CREATE';
                const projectTitle = log.details?.projectTitle || 'Projet non specifie';
                const total = Number(log.details?.total || 0).toFixed(3);
                const date = new Date(log.createdAt).toLocaleString('fr-FR');
                return (
                  <div key={log._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {isQuote ? 'Devis cree' : 'Facture creee'} - {projectTitle}
                      </p>
                      <span className="text-xs text-slate-500">{date}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">Total: {total} TND</p>
                  </div>
                );
              })}
            </div>
          )
        ) : null}
      </section>
      <SimpleFooter />
    </PageShell>
  );
}
