import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader, Plus, Check, Upload } from 'lucide-react';

const MATERIAL_SUGGESTIONS = [
  "Ciment", "Sable", "Gravier", "Brique", "Parpaing", "Fer", "Béton", "Plâtre", "Peinture", "Carrelage",
  "Bois", "Aluminium", "PVC", "Verre", "Isolation (laine de roche)", "Isolation (polystyrène)",
  "Câble électrique", "Tuyaux PVC", "Tuyaux cuivre", "Robinetterie", "Sanitaires"
];

export default function AIAssistantChat({ 
  messages, 
  currentField, 
  materialsInput,
  setMaterialsInput,
  onSendMessage, 
  onAddMaterial,
  onFinishMaterials,
  onAddImages,
  onSkipImages,
  isSubmitting,
  isComplete 
}) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isComplete && currentField && currentField.type !== 'materials' && currentField.type !== 'images') {
      inputRef.current?.focus();
    }
  }, [currentField, isComplete]);

  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviewUrls]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isSubmitting || isComplete) return;
    
    if (currentField?.type === 'materials') {
      onAddMaterial(inputValue);
    } else {
      onSendMessage(inputValue);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleMaterialSuggestion = (suggestion) => {
    onAddMaterial(suggestion);
    setInputValue('');
  };

  const handleFinishMaterials = () => {
    onFinishMaterials();
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 6) {
      alert("Maximum 6 images");
      return;
    }
    if (files.length > 0) {
      const previews = files.map(file => URL.createObjectURL(file));
      setImagePreviewUrls(previews);
      onAddImages(files); // ✅ send files to hook
    }
  };

  const handleSkipImages = () => {
    onSkipImages();
  };

  return (
    <div className="flex flex-col h-[500px]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50 to-white rounded-xl">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
              msg.type === 'user'
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 shadow-sm'
            }`}>
              <div className="whitespace-pre-wrap text-sm">{msg.text}</div>
            </div>
          </div>
        ))}
        {isSubmitting && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5">
              <Loader className="h-5 w-5 animate-spin text-indigo-600" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Materials Section */}
      {currentField?.type === 'materials' && !isComplete && (
        <div className="border-t border-slate-200 p-4 bg-white">
          <div className="mb-3">
            <div className="text-sm font-medium text-slate-700 mb-2">
              Matériaux ajoutés: {(currentField?.answers?.materials || []).length}/12
            </div>
            <div className="flex flex-wrap gap-2">
              {(currentField?.answers?.materials || []).map((material, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs text-indigo-700">
                  {material}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2 mb-3">
            <input ref={inputRef} value={materialsInput} onChange={(e) => setMaterialsInput(e.target.value)} onKeyPress={handleKeyPress}
              placeholder="Ajouter un matériau..." className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
              disabled={isSubmitting} />
            <button onClick={() => onAddMaterial(materialsInput)} className="rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
              disabled={!materialsInput.trim() || isSubmitting}>
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="mb-3">
            <button onClick={() => setShowSuggestions(!showSuggestions)} className="text-xs text-indigo-600 hover:text-indigo-700">
              {showSuggestions ? 'Masquer suggestions' : 'Voir suggestions'}
            </button>
            {showSuggestions && (
              <div className="mt-2 flex flex-wrap gap-2">
                {MATERIAL_SUGGESTIONS.slice(0, 8).map((suggestion) => (
                  <button key={suggestion} onClick={() => handleMaterialSuggestion(suggestion)}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-slate-200">
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleFinishMaterials} className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            disabled={isSubmitting}>
            <Check className="inline h-4 w-4 mr-2" /> Terminer les matériaux
          </button>
        </div>
      )}

      {/* ✅ Images Section */}
      {currentField?.type === 'images' && !isComplete && (
        <div className="border-t border-slate-200 p-4 bg-white">
          <div className="mb-3">
            <div className="text-sm font-medium text-slate-700 mb-2">Images du projet (max 6)</div>
            {imagePreviewUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {imagePreviewUrls.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200">
                    <img src={url} alt={`Preview ${idx+1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2 mb-3">
            <button onClick={() => fileInputRef.current?.click()} className="flex-1 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-100 transition-colors">
              <Upload className="inline h-4 w-4 mr-2" /> Sélectionner des images
            </button>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={handleImageUpload} className="hidden" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSkipImages} className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50" disabled={isSubmitting}>
              Passer (sans images)
            </button>
            {imagePreviewUrls.length > 0 && (
              <button onClick={handleSkipImages} className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700" disabled={isSubmitting}>
                <Check className="inline h-4 w-4 mr-2" /> Valider ({imagePreviewUrls.length} image(s))
              </button>
            )}
          </div>
        </div>
      )}

      {/* Input Area for non-materials and non-images */}
      {currentField?.type !== 'materials' && currentField?.type !== 'images' && !isComplete && (
        <form onSubmit={handleSubmit} className="border-t border-slate-200 p-4 bg-white rounded-b-xl">
          <div className="flex gap-2">
            <input ref={inputRef} type={currentField?.type === 'number' ? 'number' : currentField?.type === 'tel' ? 'tel' : 'text'}
              value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={handleKeyPress}
              placeholder="Écrivez votre réponse..." className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-indigo-500 focus:ring-2"
              disabled={isSubmitting} step={currentField?.type === 'number' ? 'any' : undefined} />
            <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-white hover:bg-indigo-700 disabled:opacity-50"
              disabled={!inputValue.trim() || isSubmitting}>
              <Send className="h-4 w-4" />
            </button>
          </div>
          {currentField?.options && (
            <div className="mt-3 flex flex-wrap gap-2">
              {currentField.options.slice(0, 6).map((option) => (
                <button key={option} type="button" onClick={() => { setInputValue(option); setTimeout(() => handleSubmit({ preventDefault: () => {} }), 100); }}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-slate-200">
                  {option}
                </button>
              ))}
            </div>
          )}
        </form>
      )}
    </div>
  );
}