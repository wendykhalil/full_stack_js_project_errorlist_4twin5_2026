import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from '../i18n';
import { Package, Search, Eye, MessageCircle, Calendar, MapPin, User, CheckCircle, XCircle, Phone, Mail, Loader2, AlertCircle, Edit3, Sparkles } from 'lucide-react';
import { getSupplierOrders, updateOrderStatus, addSupplierNote } from '../auth/api';
import OrderStatusBadge from '../components/OrderStatusBadge';
import OrderTabs from '../components/OrderTabs';
import SimpleFooter from '../components/Footer';
import { useSupplierOrders } from '../context/SupplierOrderContext';
import { Hint } from '../components/MouseTooltip';
import ReadCardButton from '../components/ReadCardButton';

export default function FournisseurOrders() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  // Redirection si non authentifié
  useEffect(() => {
    if (!token || !user) {
      navigate('/login', { replace: true });
      return;
    }
    if (user.role?.toLowerCase() !== 'supplier') {
      navigate('/unauthorized', { replace: true });
      return;
    }
  }, [token, user, navigate]);

  const [activeTab, setActiveTab] = useState('active');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  // État pour la modal de note
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [supplierNote, setSupplierNote] = useState('');
  const [updating, setUpdating] = useState(false);

  // Track IDs of orders that just arrived via socket (for NEW badge)
  const [newOrderIds, setNewOrderIds] = useState(new Set());

  // ── Real-time: use global context (socket is handled in FournisseurLayout) ─
  const { newOrderIds: globalNewOrderIds, setInitialCount } = useSupplierOrders();

  // Sync global newOrderIds into local display state
  useEffect(() => {
    setNewOrderIds(globalNewOrderIds);
  }, [globalNewOrderIds]);

  // ── Inject real-time orders into the list ─────────────────────────────────
  // Orders arrive via FournisseurLayout socket → context → re-render triggers fetchOrders
  // We listen for new IDs appearing and refetch to get the full populated order
  const prevNewIdsRef = React.useRef(new Set());
  useEffect(() => {
    const prev = prevNewIdsRef.current;
    const hasNew = [...globalNewOrderIds].some(id => !prev.has(id));
    if (hasNew && activeTab === 'active') {
      fetchOrders();
    }
    prevNewIdsRef.current = new Set(globalNewOrderIds);
  }, [globalNewOrderIds, activeTab]); // eslint-disable-line

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusFilter = activeTab === 'active' 
        ? ['PENDING', 'ACCEPTED', 'PREPARING', 'SHIPPED'].join(',')
        : ['DELIVERED', 'CANCELLED', 'REFUSED'].join(',');

      const data = await getSupplierOrders({
        token,
        page,
        limit: 10,
        status: statusFilter
      });

      let ordersArray = [];
      let paginationData = { page: 1, limit: 10, total: 0, pages: 1 };

      if (data?.data?.orders) {
        ordersArray = data.data.orders;
        paginationData = data.data.pagination || paginationData;
      } else if (data?.orders) {
        ordersArray = data.orders;
        paginationData = data.pagination || paginationData;
      }

      setOrders(ordersArray);
      setPagination(paginationData);

      // Sync active pending count to global context
      if (activeTab === 'active') {
        const pending = ordersArray.filter(o =>
          ['PENDING', 'ACCEPTED', 'PREPARING'].includes(o.status)
        ).length;
        setInitialCount(paginationData.total ?? ordersArray.length);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || t('orders.loadError', 'Erreur lors du chargement des commandes'));
    } finally {
      setLoading(false);
    }
  }, [token, page, activeTab, t, setInitialCount]);

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token, fetchOrders]);

  const handleStatusChange = useCallback(async (orderId, newStatus) => {
    try {
      setUpdating(true);
      await updateOrderStatus({
        token,
        orderId,
        status: newStatus,
        note: ''
      });
      fetchOrders();
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err.message || t('orders.statusUpdateError', 'Erreur lors de la mise à jour du statut'));
    } finally {
      setUpdating(false);
    }
  }, [token, fetchOrders, t]);

  const handleAddNote = useCallback(async () => {
    if (!selectedOrder || !supplierNote.trim()) return;

    try {
      setUpdating(true);
      await addSupplierNote({
        token,
        orderId: selectedOrder._id,
        note: supplierNote
      });
      fetchOrders();
      setNoteModalOpen(false);
      setSelectedOrder(null);
      setSupplierNote('');
    } catch (err) {
      console.error('Error adding note:', err);
      alert(err.message || t('orders.noteAddError', 'Erreur lors de l\'ajout de la note'));
    } finally {
      setUpdating(false);
    }
  }, [token, selectedOrder, supplierNote, fetchOrders, t]);

  const openNoteModal = useCallback((order) => {
    setSelectedOrder(order);
    setSupplierNote(order.supplierNotes || '');
    setNoteModalOpen(true);
  }, []);

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-TN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, []);

  const getArtisanName = useCallback((order) => {
    const artisan = order.artisanId;
    if (!artisan) return t('orders.artisan', 'Artisan');
    return `${artisan.firstName || ''} ${artisan.lastName || ''}`.trim() || t('orders.artisan', 'Artisan');
  }, [t]);

  const getArtisanContact = useCallback((order) => {
    const artisan = order.artisanId;
    return {
      phone: artisan?.phone || t('common.notSpecified', 'Non renseigné'),
      email: artisan?.email || t('common.notSpecified', 'Non renseigné')
    };
  }, [t]);

  if (!token || !user) return null;

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            {t('orders.receivedTitle', 'Commandes reçues')}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t('orders.receivedSubtitle', 'Gérez les demandes de commandes des artisans')}
          </p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700">
            {pagination.total} {t('orders.count', 'commande(s)')}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <OrderTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Search */}
      <div className="mt-6 mb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t('orders.searchPlaceholder', 'Rechercher une commande...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-2 text-red-700">{error}</p>
          <button onClick={fetchOrders} className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
            {t('common.retry', 'Réessayer')}
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            {activeTab === 'active' 
              ? t('orders.noActiveOrders', 'Aucune commande en cours')
              : t('orders.noHistory', 'Aucun historique')}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            {activeTab === 'active' 
              ? t('orders.noActiveOrdersDesc', 'Vous n\'avez pas de commande en cours.')
              : t('orders.noHistoryDesc', 'Vous n\'avez pas encore de commande terminée ou refusée.')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const artisan = getArtisanName(order);
            const contact = getArtisanContact(order);
            const isNew   = newOrderIds.has(String(order._id));
            
            return (
              <div
                key={order._id}
                className={`rounded-2xl border bg-white p-6 shadow-sm transition-all ${
                  isNew
                    ? 'border-indigo-400 ring-2 ring-indigo-300 animate-pulse-once'
                    : 'border-slate-200'
                }`}
              >
                {/* En-tête */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                      <Package className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-slate-500">
                          {t('orders.orderNumber', 'Commande')} #{order.orderNumber}
                        </p>
                        {isNew && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white">
                            <Sparkles className="h-3 w-3" /> NOUVEAU
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-slate-900">
                        {order.productId?.name || t('orders.productUnavailable', 'Produit non disponible')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <OrderStatusBadge status={order.status} />
                    <span className="text-sm text-slate-500">{formatDate(order.createdAt)}</span>
                    <ReadCardButton text={`Commande #${order.orderNumber} - ${order.productId?.name || 'Produit'} - Artisan: ${artisan} - Statut: ${order.status} - Quantité: ${order.quantity} - ${formatDate(order.createdAt)}`} />
                  </div>
                </div>

                {/* Détails */}
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">{artisan}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">{t('orders.quantity', 'Quantité')}: {order.quantity}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600 truncate">
                      {order.deliveryAddress?.city || t('orders.addressNotSpecified', 'Adresse non spécifiée')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">{formatDate(order.createdAt)}</span>
                  </div>
                </div>

                {/* Contact */}
                <div className="mt-3 flex gap-4 text-sm">
                  <div className="flex items-center gap-1 text-slate-500">
                    <Phone className="h-3 w-3" />
                    <span>{contact.phone}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500">
                    <Mail className="h-3 w-3" />
                    <span>{contact.email}</span>
                  </div>
                </div>

                {/* Message artisan */}
                {order.artisanMessage && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-3">
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">{t('orders.artisanMessage', 'Message de l\'artisan')} :</span>{' '}
                      {order.artisanMessage}
                    </p>
                  </div>
                )}

                {/* Note fournisseur */}
                {order.supplierNotes && (
                  <div className="mt-2 rounded-xl bg-indigo-50 p-3">
                    <p className="text-sm text-indigo-700">
                      <span className="font-medium">{t('orders.yourNote', 'Votre note')} :</span>{' '}
                      {order.supplierNotes}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  {activeTab === 'active' && order.status === 'PENDING' && (
                    <>
                      <Hint text="Accepter cette commande et confirmer la disponibilité du produit.">
                      <button onClick={() => handleStatusChange(order._id, 'ACCEPTED')} disabled={updating}
                        className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                        <CheckCircle className="h-4 w-4" /> {t('orders.accept', 'Accepter')}
                      </button>
                      </Hint>
                      <Hint text="Refuser cette commande (le client sera notifié automatiquement).">
                      <button onClick={() => handleStatusChange(order._id, 'REFUSED')} disabled={updating}
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                        <XCircle className="h-4 w-4" /> {t('orders.refuse', 'Refuser')}
                      </button>
                      </Hint>
                    </>
                  )}

                  {activeTab === 'active' && order.status === 'ACCEPTED' && (
                    <>
                      <Hint text="Passer cette commande en préparation pour l'expédition.">
                      <button onClick={() => handleStatusChange(order._id, 'PREPARING')} disabled={updating}
                        className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
                        <Package className="h-4 w-4" /> {t('orders.preparing', 'En préparation')}
                      </button>
                      </Hint>
                      <Hint text="Indiquer que vous avez contacté l'artisan pour coordonner la livraison.">
                      <button onClick={() => handleStatusChange(order._id, 'CONTACTED')} disabled={updating}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                        <Phone className="h-4 w-4" /> {t('orders.contacted', 'Contact établi')}
                      </button>
                      </Hint>
                    </>
                  )}

                  {activeTab === 'active' && order.status === 'PREPARING' && (
                    <Hint text="Marquer cette commande comme expédiée vers l'artisan.">
                    <button onClick={() => handleStatusChange(order._id, 'SHIPPED')} disabled={updating}
                      className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                      <Package className="h-4 w-4" /> {t('orders.ship', 'Expédier')}
                    </button>
                    </Hint>
                  )}

                  {activeTab === 'active' && order.status === 'SHIPPED' && (
                    <Hint text="Confirmer que la commande a bien été livrée à l'artisan.">
                    <button onClick={() => handleStatusChange(order._id, 'DELIVERED')} disabled={updating}
                      className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                      <CheckCircle className="h-4 w-4" /> {t('orders.markDelivered', 'Marquer comme livré')}
                    </button>
                    </Hint>
                  )}

                  <Hint text="Ajouter ou modifier une note interne visible uniquement par vous.">
                  <button onClick={() => openNoteModal(order)}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                    <Edit3 className="h-4 w-4" />
                    {order.supplierNotes ? t('orders.modifyNote', 'Modifier note') : t('orders.addNote', 'Ajouter note')}
                  </button>
                  </Hint>
                  <Hint text="Voir tous les détails de cette commande.">
                  <button onClick={() => navigate(`/fournisseur/orders/${order._id}`)}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50">
                    <Eye className="h-4 w-4" /> {t('orders.details', 'Détails')}
                  </button>
                  </Hint>
                  <Hint text="Envoyer un message à l'artisan concernant cette commande.">
                  <button onClick={() => navigate(`/fournisseur/orders/${order._id}?tab=messages`)}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                    <MessageCircle className="h-4 w-4" /> {t('orders.messages', 'Messages')}
                  </button>
                  </Hint>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                {t('pagination.previous', 'Précédent')}
              </button>
              <span className="px-4 py-2 text-sm text-slate-600">
                {t('pagination.page', 'Page')} {page} {t('pagination.of', 'sur')} {pagination.pages}
              </span>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                {t('pagination.next', 'Suivant')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal note */}
      {noteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900">
              {selectedOrder?.supplierNotes ? t('orders.modifyNote', 'Modifier la note') : t('orders.addNote', 'Ajouter une note')}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {t('orders.orderNumber', 'Commande')} #{selectedOrder?.orderNumber}
            </p>
            <textarea value={supplierNote} onChange={(e) => setSupplierNote(e.target.value)}
              placeholder={t('orders.notePlaceholder', 'Entrez votre note interne...')} rows="4"
              className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
              autoFocus />
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setNoteModalOpen(false); setSelectedOrder(null); setSupplierNote(''); }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                {t('common.cancel', 'Annuler')}
              </button>
              <button onClick={handleAddNote} disabled={updating || !supplierNote.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                {updating ? t('common.saving', 'Enregistrement...') : t('common.save', 'Enregistrer')}
              </button>
            </div>
          </div>
        </div>
      )}

      <SimpleFooter />
    </div>
  );
}