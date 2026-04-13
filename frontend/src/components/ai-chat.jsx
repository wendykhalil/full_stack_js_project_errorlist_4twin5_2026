import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, X, Trash2 } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getStorageKey(userId) {
  return `bmp_chat_${userId || 'guest'}`;
}

function loadHistory(userId) {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    return JSON.parse(raw).map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch { return []; }
}

function saveHistory(userId, messages) {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(messages.slice(-50)));
  } catch {}
}

const SUGGESTIONS = [
  "Montre-moi mes commandes en cours",
  "Quel est mon plan d'abonnement ?",
  "Trouve-moi un plombier disponible à Tunis",
  "Combien j'ai de factures impayées ?",
  "Quels produits de ciment sont disponibles ?",
];

function TypingDots() {
  return (
    <div className="flex gap-1 px-1 py-1">
      {[0, 1, 2].map(i => (
        <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
          style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-blue-500 shadow-sm mt-1">
          <Bot className="h-3.5 w-3.5 text-white" />
        </div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
        isUser
          ? "bg-gradient-to-br from-indigo-600 to-indigo-500 text-white"
          : "bg-white text-slate-700 ring-1 ring-slate-200"
      }`}>
        {/* Render newlines and basic markdown-like lists */}
        {msg.text.split('\n').map((line, i) => (
          <span key={i}>
            {line.startsWith('- ') ? (
              <span className="flex gap-1.5"><span className="text-indigo-400 shrink-0">•</span><span>{line.slice(2)}</span></span>
            ) : line}
            {i < msg.text.split('\n').length - 1 && <br />}
          </span>
        ))}
        <span className="mt-1 block text-right text-[10px] opacity-60">
          {new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(msg.timestamp)}
        </span>
      </div>
      {isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 mt-1">
          <User className="h-3.5 w-3.5 text-slate-600" />
        </div>
      )}
    </div>
  );
}

export default function AiChat() {
  const { token, user } = useAuth();
  const userId = user?._id || user?.id || user?.sub || 'guest';
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => loadHistory(userId));
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const abortRef = useRef(null);

  // Persist messages per user
  useEffect(() => {
    if (messages.length > 0) saveHistory(userId, messages);
  }, [messages, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text) {
    const msg = (text || input).trim();
    if (!msg || isStreaming) return;

    setInput("");
    const userMsg = { role: "user", text: msg, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    // Add empty bot message that we'll fill via streaming
    const botMsg = { role: "bot", text: "", timestamp: new Date() };
    setMessages(prev => [...prev, botMsg]);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch(`${API_URL}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: msg,
          history: messages.slice(-8).map(m => ({ role: m.role, text: m.text })),
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Erreur ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let done = false;

      while (!done) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(l => l.startsWith("data:"));

        for (const line of lines) {
          const data = line.slice(5).trim();
          if (data === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              accumulated += parsed.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...botMsg, text: accumulated };
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...botMsg,
            text: "❌ Impossible de contacter l'assistant. Vérifiez qu'Ollama est démarré (`ollama serve`).",
          };
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function stopStreaming() {
    abortRef.current?.abort();
    setIsStreaming(false);
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white/80 px-5 py-3.5 backdrop-blur-sm sticky top-0 z-10 rounded-t-2xl">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-500 shadow-md">
          <Bot className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-800">Assistant BMP.tn</h2>
          <p className="text-xs text-slate-400">
            {isStreaming ? (
              <span className="flex items-center gap-1 text-indigo-500">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                En train de répondre…
              </span>
            ) : "Propulsé par Mistral · Données en temps réel"}
          </p>
        </div>
        {messages.length > 0 && (
          <button onClick={() => { setMessages([]); localStorage.removeItem(getStorageKey(userId)); }}
            title="Effacer la conversation"
            className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-4 rounded-2xl bg-indigo-50 p-4">
              <Sparkles className="h-8 w-8 text-indigo-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">Bonjour ! Comment puis-je vous aider ?</h3>
            <p className="mt-1 text-sm text-slate-400 max-w-sm">
              Je connais vos commandes, projets, factures, artisans disponibles et bien plus.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)}
                  className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === "bot" && msg.text === "" && isStreaming ? (
                  <div className="flex gap-2.5 justify-start">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-blue-500 mt-1">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200 shadow-sm">
                      <TypingDots />
                    </div>
                  </div>
                ) : (
                  <Message msg={msg} />
                )}
              </div>
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-sm rounded-b-2xl">
        <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/30">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez votre question… (Entrée pour envoyer)"
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none border-0 bg-transparent px-1 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:opacity-50"
            style={{ maxHeight: "100px" }}
          />
          {isStreaming ? (
            <button onClick={stopStreaming}
              className="rounded-xl bg-red-100 p-2 text-red-500 hover:bg-red-200 transition-colors">
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={() => sendMessage()} disabled={!input.trim()}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 p-2 text-white shadow-sm transition-all hover:shadow-md disabled:opacity-40">
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-1.5 text-center text-[10px] text-slate-400">
          Les réponses sont basées sur vos données réelles. Mistral peut faire des erreurs.
        </p>
      </div>
    </div>
  );
}
