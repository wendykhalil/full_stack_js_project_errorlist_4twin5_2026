// AiChat.jsx
import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Paperclip, Mic, MoreHorizontal } from "lucide-react";

export default function AiChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", text: input, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch(
        "http://localhost:3000/api/v1/prediction/cd694da9-8f91-4c15-b5f4-8f08ac715cf3",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "supersecret123",
          },
          body: JSON.stringify({ question: input }),
        }
      );
      const data = await res.json();
      const botMessage = {
        role: "bot",
        text: data.text || data.answer || "Je n'ai pas compris, pouvez-vous reformuler ?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Flowise error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Erreur de connexion. Veuillez réessayer.", timestamp: new Date() },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-2xl shadow-sm">
      {/* Header moderne avec effet glass */}
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-white/60 px-6 py-4 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-md">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Assistant BMP.tn</h2>
            <p className="text-xs text-slate-500">Connecté • Réponses en temps réel</p>
          </div>
        </div>
        <button className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Zone des messages - style bulles modernes */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-blue-100 p-4">
                <Sparkles className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700">Bienvenue sur l'assistant BMP</h3>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                Posez-moi une question sur vos factures, contrats ou services. Je suis là pour vous aider 24/7.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "bot" && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white"
                      : "bg-white text-slate-700 ring-1 ring-slate-200"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  {msg.timestamp && (
                    <span className="mt-1 block text-right text-[10px] opacity-70">
                      {new Intl.DateTimeFormat("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(msg.timestamp)}
                    </span>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-200">
                    <User className="h-4 w-4 text-slate-600" />
                  </div>
                )}
              </div>
            ))
          )}
          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0.2s" }}></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0.4s" }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Footer avec champ de saisie moderne et actions */}
      <div className="border-t border-slate-200 bg-white/80 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/30">
            <button className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
              <Paperclip className="h-5 w-5" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Écrivez votre message..."
              rows={1}
              className="flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-0"
              style={{ maxHeight: "120px" }}
            />
            <button className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
              <Mic className="h-5 w-5" />
            </button>
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="rounded-full bg-gradient-to-r from-blue-600 to-blue-500 p-2 text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:hover:shadow-md"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-slate-400">
            L'assistant peut faire des erreurs. Vérifiez les informations importantes.
          </p>
        </div>
      </div>
    </div>
  );
}