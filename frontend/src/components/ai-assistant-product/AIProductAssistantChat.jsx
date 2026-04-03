import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader, Upload, FileText } from 'lucide-react';

export default function AIProductAssistantChat({
  messages,
  onSendMessage,
  onAddImages,
  onSkipImages,
  onAddPdf,
  onSkipPdf,
  isSubmitting,
  isComplete,
  showDescriptionButtons,
  showImageButtons,
  showPdfButtons,
  onButtonClick
}) {
  const [inputValue, setInputValue] = useState('');
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [pdfName, setPdfName] = useState('');
  const [hasUploadedImages, setHasUploadedImages] = useState(false);
  const [hasUploadedPdf, setHasUploadedPdf] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  // Derive upload UI visibility directly from the last AI message (no state needed)
  const lastAiMessage = [...messages].reverse().find(msg => msg.type === 'ai');
  const showImageUpload = !hasUploadedImages && lastAiMessage?.text?.includes('sélectionner les images') || false;
  const showPdfUpload = !hasUploadedPdf && lastAiMessage?.text?.includes('sélectionner le fichier PDF') || false;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isComplete && !showImageUpload && !showPdfUpload && !showDescriptionButtons && !showImageButtons && !showPdfButtons) {
      inputRef.current?.focus();
    }
  }, [messages, isComplete, showImageUpload, showPdfUpload, showDescriptionButtons, showImageButtons, showPdfButtons]);

  useEffect(() => {
    return () => imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
  }, [imagePreviewUrls]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isSubmitting || isComplete) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) { alert("Maximum 5 images"); return; }
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(previews);
    onAddImages(files);
    setHasUploadedImages(true);
  };

  const handlePdfUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfName(file.name);
      onAddPdf(file);
      setHasUploadedPdf(true);
    } else {
      alert("Veuillez sélectionner un fichier PDF.");
    }
  };

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50 to-white rounded-xl">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${msg.type === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-700 shadow-sm'}`}>
              <div className="whitespace-pre-wrap text-sm">{msg.text}</div>
            </div>
          </div>
        ))}
        {isSubmitting && <div className="flex justify-start"><div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5"><Loader className="h-5 w-5 animate-spin text-indigo-600" /></div></div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Description choice buttons */}
      {showDescriptionButtons && !isComplete && (
        <div className="border-t border-slate-200 p-4 bg-white">
          <div className="flex gap-2">
            <button 
              onClick={() => onButtonClick('manual')} 
              className="flex-1 rounded-xl bg-indigo-600 text-white py-3 font-semibold hover:bg-indigo-700 transition-colors"
            >
              ✏️ Manuel
            </button>
            <button 
              onClick={() => onButtonClick('generate')} 
              className="flex-1 rounded-xl bg-green-600 text-white py-3 font-semibold hover:bg-green-700 transition-colors"
            >
              🤖 Générer
            </button>
          </div>
        </div>
      )}

      {/* Image choice buttons */}
      {showImageButtons && !isComplete && (
        <div className="border-t border-slate-200 p-4 bg-white">
          <div className="flex gap-2">
            <button 
              onClick={() => onButtonClick('yes')} 
              className="flex-1 rounded-xl bg-green-600 text-white py-3 font-semibold hover:bg-green-700 transition-colors"
            >
              ✅ Oui
            </button>
            <button 
              onClick={() => onButtonClick('no')} 
              className="flex-1 rounded-xl bg-red-600 text-white py-3 font-semibold hover:bg-red-700 transition-colors"
            >
              ❌ Non
            </button>
          </div>
        </div>
      )}

      {/* PDF choice buttons */}
      {showPdfButtons && !isComplete && (
        <div className="border-t border-slate-200 p-4 bg-white">
          <div className="flex gap-2">
            <button 
              onClick={() => onButtonClick('yes')} 
              className="flex-1 rounded-xl bg-green-600 text-white py-3 font-semibold hover:bg-green-700 transition-colors"
            >
              ✅ Oui
            </button>
            <button 
              onClick={() => onButtonClick('no')} 
              className="flex-1 rounded-xl bg-red-600 text-white py-3 font-semibold hover:bg-red-700 transition-colors"
            >
              ❌ Non
            </button>
          </div>
        </div>
      )}

      {/* Image upload UI */}
      {showImageUpload && !isComplete && (
        <div className="border-t border-slate-200 p-4 bg-white">
          {imagePreviewUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {imagePreviewUrls.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border"><img src={url} alt="preview" className="w-full h-full object-cover" /></div>
              ))}
            </div>
          )}
          <button onClick={() => fileInputRef.current?.click()} className="w-full rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50 py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-100">
            <Upload className="inline h-4 w-4 mr-2" /> Sélectionner des images
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
          <div className="flex gap-2 mt-3">
            <button onClick={() => { setHasUploadedImages(true); onSkipImages(); }} className="flex-1 rounded-xl border border-slate-300 py-2 text-sm">Passer</button>
            {imagePreviewUrls.length > 0 && <button onClick={() => onAddImages(Array.from(fileInputRef.current?.files || []))} className="flex-1 rounded-xl bg-indigo-600 text-white py-2">Valider</button>}
          </div>
        </div>
      )}

      {/* PDF upload UI */}
      {showPdfUpload && !isComplete && (
        <div className="border-t border-slate-200 p-4 bg-white">
          {pdfName && <div className="mb-2 text-sm text-green-600">✅ {pdfName}</div>}
          <button onClick={() => pdfInputRef.current?.click()} className="w-full rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50 py-3 text-sm font-medium text-indigo-600">
            <FileText className="inline h-4 w-4 mr-2" /> Télécharger la fiche technique (PDF)
          </button>
          <input ref={pdfInputRef} type="file" accept="application/pdf" onChange={handlePdfUpload} className="hidden" />
          <div className="flex gap-2 mt-3">
            <button onClick={() => { setHasUploadedPdf(true); onSkipPdf(); }} className="flex-1 rounded-xl border border-slate-300 py-2 text-sm">Passer</button>
          </div>
        </div>
      )}

      {/* Text input */}
      {!showImageUpload && !showPdfUpload && !showDescriptionButtons && !showImageButtons && !showPdfButtons && !isComplete && (
        <form onSubmit={handleSubmit} className="border-t border-slate-200 p-4 bg-white rounded-b-xl">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Écrivez votre réponse..."
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-indigo-500 focus:ring-2"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-white hover:bg-indigo-700 disabled:opacity-50"
              disabled={!inputValue.trim() || isSubmitting}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}