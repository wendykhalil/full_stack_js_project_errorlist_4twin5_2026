import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ChevronLeft, Send, User, Loader2, AlertCircle, Paperclip, Mic, FileText, Image as ImageIcon } from 'lucide-react';
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

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  if (error) return <div className="flex-1 flex items-center justify-center"><div className="text-center"><AlertCircle className="mx-auto h-12 w-12 text-red-500" /><p className="mt-2 text-red-600">{error}</p></div></div>;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-2rem)]">
      <div className="bg-white border-b border-slate-200 p-4 flex items-center gap-4">
        <button onClick={() => navigate(`${getBasePath()}/messages`)} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft className="h-5 w-5 text-slate-600" /></button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">{otherUser?.profileImage ? <img src={otherUser.profileImage} alt="" className="w-full h-full object-cover" /> : <User className="h-5 w-5 text-indigo-600" />}</div>
          <div>
            <h2 className="font-semibold text-slate-900">{otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Utilisateur'}</h2>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        {messages.length === 0 ? <div className="flex items-center justify-center h-full text-slate-500 text-center">Aucun message</div> : Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            <div className="text-center my-4"><span className="bg-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full">{date}</span></div>
            {msgs.map((msg) => {
              const isOwn = msg.senderId?._id === user?._id;
              return (
                <div key={msg._id} className={`flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] rounded-2xl px-4 py-2 ${isOwn ? 'bg-indigo-600 text-white' : 'bg-white text-slate-900 border border-slate-200'}`}>
                    {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                    {(msg.attachments || []).map((attachment, index) => <AttachmentPreview key={`${msg._id}-${index}`} attachment={attachment} own={isOwn} />)}
                    <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${isOwn ? 'text-indigo-200' : 'text-slate-400'}`}><span>{new Date(msg.createdAt).toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' })}</span>{isOwn && <span>{msg.read ? '✓✓' : '✓'}</span>}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t border-slate-200 p-4 space-y-3">
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            {selectedFiles.map((file, index) => <span key={`${file.name}-${index}`} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">{file.type.startsWith('image/') ? <ImageIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}{file.name}</span>)}
          </div>
        )}
        <form onSubmit={submitMessage} className="flex gap-2">
          <input ref={inputRef} type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Écrivez votre message..." className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none" disabled={sending} />
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))} />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-xl border border-slate-200 px-3 py-3 text-slate-700 hover:bg-slate-50"><Paperclip className="h-5 w-5" /></button>
          <button type="button" onClick={toggleRecording} className={`rounded-xl border px-3 py-3 ${recording ? 'border-red-300 bg-red-50 text-red-600' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}><Mic className="h-5 w-5" /></button>
          <button type="submit" disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending} className="bg-indigo-600 text-white px-4 py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">{sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}</button>
        </form>
      </div>

      <SimpleFooter />
    </div>
  );
}
