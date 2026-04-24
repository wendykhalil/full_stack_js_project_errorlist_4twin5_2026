import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from '../i18n';
import {
  Package, Search, Eye, MessageCircle, Calendar,
  MapPin, Building, Loader2, AlertCircle, CheckCircle
} from 'lucide-react';
import { getMyOrders } from '../auth/api';
import OrderStatusBadge from '../components/OrderStatusBadge';
import OrderTabs from '../components/OrderTabs';
import SimpleFooter from '../components/Footer';
import { Hint } from '../components/MouseTooltip';

export default function ArtisanOrders() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useAuth();

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

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Pour l'historique, inclure DELIVERED, CANCELLED ET REFUSED
      const statusFilter = activeTab === 'active' 
        ? ['PENDING', 'ACCEPTED', 'PREPARING', 'SHIPPED'].join(',')
        : ['DELIVERED', 'CANCELLED', 'REFUSED'].join(',');

      const data = await getMyOrders({
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
  }, [token, page, activeTab, t]);

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token, fetchOrders]);

  const handleArtisanConfirmDelivery = useCallback(async (orderId) => {
    console.log('Confirm delivery for order:', orderId);
    // await updateOrderStatus({ token, orderId, status: 'DELIVERED' });
    fetchOrders();
  }, [fetchOrders]);

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-TN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, []);

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            {t('orders.title', 'Mes commandes')}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t('orders.subtitle', "Suivez l'état de vos commandes")}
          </p>
        </div>

        <button
          onClick={() => navigate('/artisan/marketplace')}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <Package className="h-4 w-4" />
          {t('orders.newOrder', 'Nouvelle commande')}
        </button>
      </div>

      {/* Tabs */}
      <OrderTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Search */}
      {activeTab === 'active' && (
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
      )}

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
            {activeTab === 'active' 
              ? t('orders.noActiveOrders', 'Aucune commande en cours')
              : t('orders.noHistory', 'Aucun historique de commande')}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            {activeTab === 'active' 
              ? t('orders.noActiveOrdersDesc', 'Vous n\'avez pas de commande en cours.')
              : t('orders.noHistoryDesc', 'Vous n\'avez pas encore de commande terminée ou refusée.')}
          </p>
          {activeTab === 'active' && (
            <button
              onClick={() => navigate('/artisan/marketplace')}
              className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              {t('orders.discoverCatalog', 'Découvrir le catalogue')}
            </button>
          )}
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* En-tête de la commande */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">
                    {order.supplierId?.supplierProfile?.companyName || 
                     order.supplierId?.firstName + ' ' + order.supplierId?.lastName ||
                     t('orders.supplier', 'Fournisseur')}
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

              {/* Message de l'artisan (si présent) */}
              {order.artisanMessage && (
                <div className="mt-4 rounded-xl bg-slate-50 p-3">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">{t('orders.yourMessage', 'Votre message')} :</span>{' '}
                    {order.artisanMessage}
                  </p>
                </div>
              )}

              {/* Actions spécifiques à l'artisan */}
              {activeTab === 'active' && order.status === 'SHIPPED' && (
                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                  <button
                    onClick={() => handleArtisanConfirmDelivery(order._id)}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {t('orders.confirmDelivery', 'Confirmer la réception')}
                  </button>
                </div>
              )}

              {/* Boutons communs */}
              <div className="mt-4 flex gap-3 border-t border-slate-100 pt-4">
                <Hint text="Voir tous les détails de cette commande : produit, fournisseur, adresse et historique.">
                <button
                  onClick={() => navigate(`/artisan/orders/${order._id}`)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                >
                  <Eye className="h-4 w-4" />
                  {t('orders.viewDetails', 'Voir détails')}
                </button>
                </Hint>
                <Hint text="Envoyer un message au fournisseur concernant cette commande.">
                <button
                  onClick={() => navigate(`/artisan/orders/${order._id}?tab=messages`)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  <MessageCircle className="h-4 w-4" />
                  {t('orders.messages', 'Messages')}
                </button>
                </Hint>
              </div>
            </div>
          ))}

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

      <SimpleFooter />
    </div>
  );
}