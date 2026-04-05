import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { 
  ChevronLeft, 
  Send, 
  User, 
  Loader2, 
  AlertCircle, 
  Paperclip, 
  Mic, 
  FileText, 
  Image as ImageIcon,
  Phone,
  Video,
  MoreVertical,
  CheckCheck,
  Check,
  MessageCircle
} from 'lucide-react';
import SimpleFooter from '../components/Footer';

function AttachmentPreview({ attachment, own }) {
  const isImage = attachment?.type?.startsWith('image/');
  const isAudio = attachment?.type?.startsWith('audio/');
  return (
    <div className={`mt-2 rounded-xl border px-3 py-2 text-sm ${own ? 'border-indigo-400/40 bg-indigo-500/20 text-white' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
      {isImage ? (
        <a href={`http://localhost:5000${attachment.url}`} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg">
          <img src={`http://localhost:5000${attachment.url}`} alt={attachment.filename} className="max-h-56 w-full object-cover" />
        </a>
      ) : isAudio ? (
        <audio controls className="max-w-full">
          <source src={`http://localhost:5000${attachment.url}`} type={attachment.type} />
        </audio>
      ) : (
        <a href={`http://localhost:5000${attachment.url}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 underline">
          <FileText className="h-4 w-4" /> {attachment.filename}
        </a>
      )}
    </div>
  );
}

export default function Conversation() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const { userId } = useParams();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [otherUser, setOtherUser] = useState(null);

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
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Erreur lors du chargement');
      const data = await response.json();
      const items = data.data || [];
      setMessages(items);
      const candidate = items.find((msg) => msg.senderId?._id === userId || msg.receiverId?._id === userId);
      if (candidate) setOtherUser(candidate.senderId?._id === userId ? candidate.senderId : candidate.receiverId);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (token && userId) Promise.resolve(fetchMessages()).finally(() => setLoading(false));
  }, [token, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => { if (token && userId) fetchMessages(); }, 10000);
    return () => clearInterval(interval);
  }, [token, userId]);

  const groupedMessages = useMemo(() => messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toLocaleDateString('fr-TN', { day: '2-digit', month: 'long', year: 'numeric' });
    groups[date] = groups[date] || [];
    groups[date].push(message);
    return groups;
  }, {}), [messages]);

  const submitMessage = async (e) => {
    e?.preventDefault();
    if ((!newMessage.trim() && selectedFiles.length === 0) || sending) return;
    setSending(true);
    try {
      const formData = new FormData();
      formData.append('receiverId', userId);
      formData.append('content', newMessage.trim());
      selectedFiles.forEach((file) => formData.append('files', file));
      const response = await fetch('http://localhost:5000/api/messages/direct', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Erreur lors de l\'envoi');
      setMessages((prev) => [...prev, data.data]);
      setNewMessage('');
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      inputRef.current?.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const toggleRecording = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const chunks = [];
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    recorder.onstop = () => {
      const file = new File([new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })], `voice-${Date.now()}.webm`, { type: recorder.mimeType || 'audio/webm' });
      setSelectedFiles((prev) => [...prev, file]);
      stream.getTracks().forEach((track) => track.stop());
    };
    recorder.start();
    setRecording(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500">Chargement de la conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-2 text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {t('common.retry', 'Retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Main Conversation Container */}
      <div className="flex-1 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex h-[calc(100vh-200px)] max-w-7xl flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-white to-slate-50/50 px-5 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`${getBasePath()}/messages`)}
                className="group flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
              >
                <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50">
                    {otherUser?.profileImage ? (
                      <img src={otherUser.profileImage} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-indigo-600" />
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white"></div>
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">
                    <span data-no-auto-translate translate="no">{otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : t('messages.userFallback', 'User')}</span>
                  </h2>
                  <p className="text-xs text-slate-400">{t('messages.online', 'Online')}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                <Phone className="h-4 w-4" />
              </button>
              <button className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                <Video className="h-4 w-4" />
              </button>
              <button className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-white p-6">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <MessageCircle className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{t('messages.emptyConversationTitle', 'No messages yet')}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {t('messages.emptyConversationSubtitle', 'Send a message to start the conversation')}
                </p>
              </div>
            ) : (
              Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date}>
                  <div className="relative my-6 flex justify-center">
                    <div className="absolute inset-x-0 top-1/2 h-px bg-slate-200"></div>
                    <span className="relative bg-white px-3 text-xs font-medium text-slate-400">
                      {date}
                    </span>
                  </div>
                  {msgs.map((msg) => {
                    const isOwn = msg.senderId?._id === user?._id;
                    return (
                      <div key={msg._id} className={`mb-5 flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
                          isOwn 
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white' 
                            : 'bg-white text-slate-900 border border-slate-200'
                        }`}>
                          {msg.content && (
                            <p className="whitespace-pre-wrap text-sm leading-relaxed" data-no-auto-translate translate="no">{msg.content}</p>
                          )}
                          {(msg.attachments || []).map((attachment, index) => (
                            <AttachmentPreview key={`${msg._id}-${index}`} attachment={attachment} own={isOwn} />
                          ))}
                          <div className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] ${
                            isOwn ? 'text-indigo-200' : 'text-slate-400'
                          }`}>
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isOwn && (
                              <span>
                                {msg.read ? (
                                  <CheckCheck className="h-3 w-3" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                              </span>
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

          {/* Input Area */}
          <div className="border-t border-slate-200 bg-white p-4">
            {selectedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <span key={`${file.name}-${index}`} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
                    {file.type.startsWith('image/') ? <ImageIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                    {file.name.length > 30 ? file.name.substring(0, 27) + '...' : file.name}
                  </span>
                ))}
              </div>
            )}
            
            <form onSubmit={submitMessage} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t('messages.writePlaceholder', 'Write your message...')}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
                disabled={sending}
              />
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              
              <button
                type="button"
                onClick={toggleRecording}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
                  recording 
                    ? 'border-red-300 bg-red-50 text-red-600' 
                    : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                <Mic className="h-4 w-4" />
              </button>
              
              <button
                type="submit"
                disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-sm transition-all hover:from-indigo-700 hover:to-indigo-600 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <SimpleFooter />
    </div>
  );
}