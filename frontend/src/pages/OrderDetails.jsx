import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from '../i18n';
import {
  Package,
  Building,
  MapPin,
  Calendar,
  User,
  Phone,
  Mail,
  MessageCircle,
  Send,
  ChevronLeft,
  Clock,
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { getOrderById, sendMessage, getOrderMessages, markMessageAsRead } from '../auth/api';
import OrderStatusBadge from '../components/OrderStatusBadge';
import OrderReviewForm from '../components/OrderReviewForm';
import SimpleFooter from '../components/Footer';
import ReadCardButton from '../components/ReadCardButton';

export default function OrderDetails() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const { id } = useParams();
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  const [order, setOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  const isArtisan = user?.role?.toLowerCase() === 'artisan';
  const isSupplier = user?.role?.toLowerCase() === 'supplier';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'messages') {
      setActiveTab('messages');
    }
  }, [location]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const data = await getOrderById({ token, orderId: id });
      
      let orderData = null;
      if (data?.data) {
        orderData = data.data;
      } else if (data?.order) {
        orderData = data.order;
      } else {
        orderData = data;
      }
      
      setOrder(orderData);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err.message || t('orders.loadError', 'Erreur lors du chargement de la commande'));
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const data = await getOrderMessages({ token, orderId: id });
      
      let messagesArray = [];
      if (data?.data) {
        messagesArray = data.data;
      } else if (Array.isArray(data)) {
        messagesArray = data;
      }
      
      setMessages(messagesArray);
      
      messagesArray.forEach(async (msg) => {
        if (!msg.read && msg.receiverId?._id === user?._id) {
          try {
            await markMessageAsRead({ token, messageId: msg._id });
          } catch (err) {
            console.error('Error marking message as read:', err);
          }
        }
      });
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  useEffect(() => {
    if (token && id) {
      fetchOrderDetails();
      fetchMessages();
      
      const interval = setInterval(fetchMessages, 10000);
      return () => clearInterval(interval);
    }
  }, [token, id]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !order) return;

    setSendingMessage(true);
    try {
      const receiverId = isArtisan ? order.supplierId?._id : order.artisanId?._id;
      
      await sendMessage({
        token,
        messageData: {
          orderId: order._id,
          receiverId,
          content: newMessage.trim()
        }
      });
      
      setNewMessage('');
      await fetchMessages();
      
      messageInputRef.current?.focus();
    } catch (err) {
      console.error('Error sending message:', err);
      alert(err.message || t('orders.messageError', 'Erreur lors de l\'envoi du message'));
    } finally {
      setSendingMessage(false);
    }
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

  const getArtisanName = () => {
    if (!order?.artisanId) return t('orders.artisan', 'Artisan');
    const artisan = order.artisanId;
    return `${artisan.firstName || ''} ${artisan.lastName || ''}`.trim() || t('orders.artisan', 'Artisan');
  };

  const getSupplierName = () => {
    if (!order?.supplierId) return t('orders.supplier', 'Fournisseur');
    const supplier = order.supplierId;
    return supplier.supplierProfile?.companyName || 
           `${supplier.firstName || ''} ${supplier.lastName || ''}`.trim() || 
           t('orders.supplier', 'Fournisseur');
  };

  const getDeliveryAddressString = () => {
    if (!order?.deliveryAddress) return t('orders.notSpecified', 'Non spécifiée');
    const addr = order.deliveryAddress;
    return `${addr.street || ''}, ${addr.city || ''} ${addr.postalCode || ''}`.trim() || t('orders.addressNotSpecified', 'Adresse complète non spécifiée');
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-2 text-red-600">{error || t('orders.notFound', 'Commande non trouvée')}</p>
          <button
            onClick={() => navigate(isArtisan ? '/artisan/orders' : '/fournisseur/orders')}
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {t('orders.backToOrders', 'Retour aux commandes')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      {/* Navigation */}
      <button
        onClick={() => navigate(isArtisan ? '/artisan/orders' : '/fournisseur/orders')}
        className="mb-6 inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600"
      >
        <ChevronLeft className="h-5 w-5" />
        {t('orders.backToOrders', 'Retour aux commandes')}
      </button>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            {t('orders.orderNumber', 'Commande')} #{order.orderNumber}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} size="lg" />
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b border-slate-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t('orders.details', 'Détails de la commande')}
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'messages'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            {t('orders.messages', 'Messages')}
            {messages.filter(m => !m.read && m.receiverId?._id === user?._id).length > 0 && (
              <span className="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                {messages.filter(m => !m.read && m.receiverId?._id === user?._id).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Contenu des onglets */}
      <div className="mt-6">
        {activeTab === 'details' ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Colonne de gauche - Infos commande */}
            <div className="lg:col-span-2 space-y-6">
              {/* Produit */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {t('orders.product', 'Produit commandé')}
                  </h2>
                  <ReadCardButton text={`Produit: ${order.productId?.name || 'Non disponible'} - Quantité: ${order.quantity} - Prix: ${order.productId?.price?.toFixed(2)} TND`} />
                </div>
                <div className="mt-4 flex gap-4">
                  {order.productId?.imageUrls?.[0] && (
                    <img
                      src={order.productId.imageUrls[0]}
                      alt={order.productId.name}
                      className="h-24 w-24 rounded-xl object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {order.productId?.name || t('orders.productUnavailable', 'Produit non disponible')}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {order.productId?.description || t('orders.noDescription', 'Aucune description')}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-indigo-700">
                      {order.productId?.price?.toFixed(2)} TND × {order.quantity}
                    </p>
                  </div>
                </div>
              </div>

              {/* Verified-purchase review — artisan only, delivered orders */}
              {isArtisan && order.status === 'DELIVERED' && (
                <OrderReviewForm
                  order={order}
                  token={token}
                  onReviewed={fetchOrderDetails}
                />
              )}

              {/* Adresse de livraison */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {t('orders.deliveryAddress', 'Adresse de livraison')}
                  </h2>
                  <ReadCardButton text={`Adresse de livraison: ${getDeliveryAddressString()}`} />
                </div>
                <div className="mt-4">
                  <p className="text-slate-900">{getDeliveryAddressString()}</p>
                  {order.deliveryAddress?.additionalInfo && (
                    <p className="mt-2 text-sm text-slate-500">
                      {t('orders.additionalInfo', 'Info complémentaire')} : {order.deliveryAddress.additionalInfo}
                    </p>
                  )}
                </div>
              </div>

              {/* Message de l'artisan */}
              {order.artisanMessage && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    {t('orders.artisanMessage', 'Message de l\'artisan')}
                  </h2>
                  <p className="mt-4 text-slate-700">{order.artisanMessage}</p>
                </div>
              )}

              {/* Note fournisseur */}
              {order.supplierNotes && isSupplier && (
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
                  <h2 className="text-lg font-semibold text-indigo-900 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {t('orders.yourNote', 'Votre note interne')}
                  </h2>
                  <p className="mt-4 text-indigo-700">{order.supplierNotes}</p>
                </div>
              )}
            </div>

            {/* Colonne de droite - Infos contact */}
            <div className="space-y-6">
              {/* Informations fournisseur */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {isArtisan ? t('orders.supplier', 'Fournisseur') : t('orders.yourInfo', 'Vos informations')}
                </h2>
                <div className="mt-4 space-y-3">
                  <p className="font-medium text-slate-900">
                    {getSupplierName()}
                  </p>
                  {order.supplierId?.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="h-4 w-4" />
                      <span>{order.supplierId.phone}</span>
                    </div>
                  )}
                  {order.supplierId?.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="h-4 w-4" />
                      <span>{order.supplierId.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Informations artisan */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {isSupplier ? t('orders.artisan', 'Artisan') : t('orders.yourInfo', 'Vos informations')}
                </h2>
                <div className="mt-4 space-y-3">
                  <p className="font-medium text-slate-900">
                    {getArtisanName()}
                  </p>
                  {order.artisanId?.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="h-4 w-4" />
                      <span>{order.artisanId.phone}</span>
                    </div>
                  )}
                  {order.artisanId?.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="h-4 w-4" />
                      <span>{order.artisanId.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Historique des statuts */}
              {order.statusHistory && order.statusHistory.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {t('orders.history', 'Historique')}
                  </h2>
                  <div className="mt-4 space-y-3">
                    {order.statusHistory.map((history, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <div className="h-2 w-2 rounded-full bg-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            <OrderStatusBadge status={history.status} size="sm" />
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDate(history.changedAt)}
                          </p>
                          {history.note && (
                            <p className="mt-1 text-xs text-slate-600">
                              {t('orders.note', 'Note')} : {history.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Onglet Messages */
          <div className="flex h-[600px] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* En-tête des messages */}
            <div className="border-b border-slate-200 p-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {t('orders.conversationWith', 'Conversation avec')} {isArtisan ? getSupplierName() : getArtisanName()}
              </h2>
            </div>

            {/* Liste des messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-center text-slate-500">
                    {t('orders.noMessages', 'Aucun message pour le moment.')}<br />
                    {t('orders.startConversation', 'Commencez la conversation !')}
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwnMessage = msg.senderId?._id === user?._id;
                  
                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          isOwnMessage
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p
                          className={`mt-1 text-xs ${
                            isOwnMessage ? 'text-indigo-200' : 'text-slate-500'
                          }`}
                        >
                          {formatDate(msg.createdAt)}
                          {!msg.read && !isOwnMessage && (
                            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-green-500" title={t('orders.unread', 'Non lu')} />
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Formulaire d'envoi */}
            <div className="border-t border-slate-200 p-4">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  ref={messageInputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('orders.messagePlaceholder', 'Écrivez votre message...')}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                  disabled={sendingMessage}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendingMessage}
                  className="rounded-xl bg-indigo-600 px-4 py-3 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {sendingMessage ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      <SimpleFooter />
    </div>
  );
}   