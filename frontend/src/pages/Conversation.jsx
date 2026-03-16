import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  ChevronLeft,
  Send,
  User,
  Loader2,
  AlertCircle
} from 'lucide-react';
import SimpleFooter from '../components/Footer';

export default function Conversation() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { userId } = useParams();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);

  // Fonction pour obtenir le chemin de base selon le rôle
  const getBasePath = () => {
    const path = window.location.pathname;
    if (path.includes('/artisan/')) return '/artisan';
    if (path.includes('/prescripteur/')) return '/prescripteur';
    if (path.includes('/fournisseur/')) return '/fournisseur';
    return '';
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/messages/conversation/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement');
      }
      
      const data = await response.json();
      
      if (data.data) {
        setMessages(data.data);
        // Récupérer les infos de l'autre utilisateur
        if (data.data.length > 0) {
          const lastMsg = data.data[0];
          setOtherUser(
            lastMsg.senderId._id === userId ? lastMsg.senderId : lastMsg.receiverId
          );
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    if (token && userId) {
      Promise.all([
        fetchMessages(),
      ]).finally(() => setLoading(false));
    }
  }, [token, userId]);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Rafraîchir les messages toutes les 10 secondes
  useEffect(() => {
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch('http://localhost:5000/api/messages/direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: userId,
          content: newMessage.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi');
      }

      const data = await response.json();
      
      if (data.data) {
        setMessages([...messages, data.data]);
        setNewMessage('');
        inputRef.current?.focus();
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-TN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Hier";
    } else {
      return date.toLocaleDateString('fr-TN', { 
        day: '2-digit', 
        month: 'long',
        year: 'numeric'
      });
    }
  };

  // Grouper les messages par date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatMessageDate(message.createdAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-2 text-red-600">{error}</p>
          <button
            onClick={() => {
              const basePath = getBasePath();
              navigate(`${basePath}/messages`);
            }}
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Retour aux messages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 flex items-center gap-4">
        <button
          onClick={() => {
            const basePath = getBasePath();
            navigate(`${basePath}/messages`);
          }}
          className="p-2 hover:bg-slate-100 rounded-lg"
        >
          <ChevronLeft className="h-5 w-5 text-slate-600" />
        </button>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
            {otherUser?.profileImage ? (
              <img 
                src={otherUser.profileImage} 
                alt="" 
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="h-5 w-5 text-indigo-600" />
            )}
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">
              {otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Utilisateur'}
            </h2>
            <p className="text-xs text-slate-500">
              {otherUser?.role === 'artisan' ? 'Artisan' : otherUser?.role === 'supplier' ? 'Fournisseur' : 'Prescripteur'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500 text-center">
              Aucun message<br/>
              <span className="text-sm">Commencez la conversation !</span>
            </p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div className="text-center my-4">
                <span className="bg-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full">
                  {date}
                </span>
              </div>
              {msgs.map((msg) => {
                const isOwn = msg.senderId._id === user?._id;
                
                return (
                  <div
                    key={msg._id}
                    className={`flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        isOwn
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-900 border border-slate-200'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                        isOwn ? 'text-indigo-200' : 'text-slate-400'
                      }`}>
                        <span>{formatMessageTime(msg.createdAt)}</span>
                        {isOwn && (
                          <span>{msg.read ? '✓✓' : '✓'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez votre message..."
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-indigo-600 text-white px-4 py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>
      </div>

      <SimpleFooter />
    </div>
  );
}