import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  Package,
  Search,
  Filter,
  ChevronDown,
  Eye,
  MessageCircle,
  Calendar,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
  Edit3
} from 'lucide-react';
import { getSupplierOrders, updateOrderStatus, addSupplierNote } from '../auth/api';
import OrderStatusBadge from '../components/OrderStatusBadge';
import SimpleFooter from '../components/Footer';

export default function FournisseurOrders() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  // ✅ REDIRECTION SI NON AUTHENTIFIÉ
  useEffect(() => {
    if (!token || !user) {
      console.log('No token or user, redirecting to login');
      navigate('/login', { replace: true });
      return;
    }
    
    // Vérifier que l'utilisateur est bien un fournisseur
    if (user.role?.toLowerCase() !== 'supplier') {
      console.log('User is not a supplier, redirecting to unauthorized');
      navigate('/unauthorized', { replace: true });
      return;
    }
  }, [token, user, navigate]);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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

  const statusOptions = [
    { value: '', label: t('orders.allStatuses', 'Tous les statuts') },
    { value: 'PENDING', label: t('orders.pending', 'En attente') },
    { value: 'ACCEPTED', label: t('orders.accepted', 'Accepté') },
    { value: 'REFUSED', label: t('orders.refused', 'Refusé') },
    { value: 'CONTACTED', label: t('orders.contacted', 'Contact établi') },
    { value: 'PREPARING', label: t('orders.preparing', 'En préparation') },
    { value: 'SHIPPED', label: t('orders.shipped', 'Expédié') },
    { value: 'DELIVERED', label: t('orders.delivered', 'Livré') }
  ];

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
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
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || t('orders.loadError', 'Erreur lors du chargement des commandes'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token, page, statusFilter]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdating(true);
      await updateOrderStatus({
        token,
        orderId,
        status: newStatus,
        note: ''
      });
      // Mettre à jour la liste des commandes
      setOrders(orders.map(order => 
        order._id === orderId 
          ? { ...order, status: newStatus }
          : order
      ));
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err.message || t('orders.statusUpdateError', 'Erreur lors de la mise à jour du statut'));
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedOrder || !supplierNote.trim()) return;

    try {
      setUpdating(true);
      await addSupplierNote({
        token,
        orderId: selectedOrder._id,
        note: supplierNote
      });
      
      // Mettre à jour la commande dans la liste
      setOrders(orders.map(order =>
        order._id === selectedOrder._id
          ? { ...order, supplierNotes: supplierNote }
          : order
      ));
      
      setNoteModalOpen(false);
      setSelectedOrder(null);
      setSupplierNote('');
    } catch (err) {
      console.error('Error adding note:', err);
      alert(err.message || t('orders.noteAddError', 'Erreur lors de l\'ajout de la note'));
    } finally {
      setUpdating(false);
    }
  };

  const openNoteModal = (order) => {
    setSelectedOrder(order);
    setSupplierNote(order.supplierNotes || '');
    setNoteModalOpen(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-TN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getArtisanName = (order) => {
    const artisan = order.artisanId;
    if (!artisan) return t('orders.artisan', 'Artisan');
    return `${artisan.firstName || ''} ${artisan.lastName || ''}`.trim() || t('orders.artisan', 'Artisan');
  };

  const getArtisanContact = (order) => {
    const artisan = order.artisanId;
    return {
      phone: artisan?.phone || t('common.notSpecified', 'Non renseigné'),
      email: artisan?.email || t('common.notSpecified', 'Non renseigné')
    };
  };

  // ✅ SI PAS DE TOKEN, NE RIEN RENDRE (la redirection va se faire)
  if (!token || !user) {
    return null;
  }

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

      {/* Filters */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('orders.searchPlaceholder', 'Rechercher une commande...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="relative w-full md:w-60">
            <Filter className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full appearance-none rounded-xl border border-slate-200 py-3 pl-10 pr-10 text-sm focus:border-indigo-500 focus:outline-none"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="mt-8 flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : error ? (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-2 text-red-700">{error}</p>
          <button
            onClick={fetchOrders}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            {t('common.retry', 'Réessayer')}
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            {t('orders.noOrders', 'Aucune commande')}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            {t('orders.noOrdersDesc', 'Vous n\'avez pas encore reçu de commande.')}
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => {
            const artisan = getArtisanName(order);
            const contact = getArtisanContact(order);
            
            return (
              <div
                key={order._id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* En-tête de la commande */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                      <Package className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">
                        {t('orders.orderNumber', 'Commande')} #{order.orderNumber}
                      </p>
                      <p className="font-semibold text-slate-900">
                        {order.productId?.name || t('orders.productUnavailable', 'Produit non disponible')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <OrderStatusBadge status={order.status} />
                    <span className="text-sm text-slate-500">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Détails de la commande */}
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">
                      {artisan}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">
                      {t('orders.quantity', 'Quantité')}: {order.quantity}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600 truncate">
                      {order.deliveryAddress?.city || t('orders.addressNotSpecified', 'Adresse non spécifiée')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Contact artisan */}
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

                {/* Message de l'artisan */}
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
                  {/* Boutons de changement de statut */}
                  {order.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(order._id, 'ACCEPTED')}
                        disabled={updating}
                        className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                        {t('orders.accept', 'Accepter')}
                      </button>
                      <button
                        onClick={() => handleStatusChange(order._id, 'REFUSED')}
                        disabled={updating}
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        {t('orders.refuse', 'Refuser')}
                      </button>
                    </>
                  )}

                  {order.status === 'ACCEPTED' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(order._id, 'PREPARING')}
                        disabled={updating}
                        className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                      >
                        <Package className="h-4 w-4" />
                        {t('orders.preparing', 'En préparation')}
                      </button>
                      <button
                        onClick={() => handleStatusChange(order._id, 'CONTACTED')}
                        disabled={updating}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Phone className="h-4 w-4" />
                        {t('orders.contacted', 'Contact établi')}
                      </button>
                    </>
                  )}

                  {order.status === 'PREPARING' && (
                    <button
                      onClick={() => handleStatusChange(order._id, 'SHIPPED')}
                      disabled={updating}
                      className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <Package className="h-4 w-4" />
                      {t('orders.ship', 'Expédier')}
                    </button>
                  )}

                  {order.status === 'SHIPPED' && (
                    <button
                      onClick={() => handleStatusChange(order._id, 'DELIVERED')}
                      disabled={updating}
                      className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {t('orders.markDelivered', 'Marquer comme livré')}
                    </button>
                  )}

                  {/* Boutons d'action génériques */}
                  <button
                    onClick={() => openNoteModal(order)}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <Edit3 className="h-4 w-4" />
                    {order.supplierNotes ? t('orders.modifyNote', 'Modifier note') : t('orders.addNote', 'Ajouter note')}
                  </button>

                  <button
                    onClick={() => navigate(`/fournisseur/orders/${order._id}`)}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                  >
                    <Eye className="h-4 w-4" />
                    {t('orders.details', 'Détails')}
                  </button>

                  <button
                    onClick={() => navigate(`/fournisseur/orders/${order._id}?tab=messages`)}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {t('orders.messages', 'Messages')}
                  </button>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                {t('pagination.previous', 'Précédent')}
              </button>
              <span className="px-4 py-2 text-sm text-slate-600">
                {t('pagination.page', 'Page')} {page} {t('pagination.of', 'sur')} {pagination.pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                {t('pagination.next', 'Suivant')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal pour ajouter/modifier une note */}
      {noteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900">
              {selectedOrder?.supplierNotes ? t('orders.modifyNote', 'Modifier la note') : t('orders.addNote', 'Ajouter une note')}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {t('orders.orderNumber', 'Commande')} #{selectedOrder?.orderNumber}
            </p>

            <textarea
              value={supplierNote}
              onChange={(e) => setSupplierNote(e.target.value)}
              placeholder={t('orders.notePlaceholder', 'Entrez votre note interne...')}
              rows="4"
              className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
              autoFocus
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setNoteModalOpen(false);
                  setSelectedOrder(null);
                  setSupplierNote('');
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                {t('common.cancel', 'Annuler')}
              </button>
              <button
                onClick={handleAddNote}
                disabled={updating || !supplierNote.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
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