import React, { useEffect, useRef } from 'react';
import { X, Package } from 'lucide-react';
import AIProductAssistantChat from './AIProductAssistantChat';
import { useAIProductAssistant } from './useAIProductAssistant';

export default function AIProductAssistantModal({ isOpen, onClose, onSubmit, token }) {
  const {
    messages, currentStep, isComplete, isSubmitting,
    startConversation, processAnswer, addImages, skipImages, addPdf, skipPdf,
    reset, showDescriptionButtons, showImageButtons, showPdfButtons, handleButtonClick
  } = useAIProductAssistant(onSubmit, onClose, token);

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (isOpen && !hasInitialized.current) {
      reset();
      startConversation();
      hasInitialized.current = true;
    }
    if (!isOpen) {
      hasInitialized.current = false;
    }
  }, [isOpen, reset, startConversation]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <div className="flex items-center gap-2"><Package className="h-5 w-5" /><h3 className="font-semibold">Assistant IA - Ajout de produit</h3></div>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="p-4 border-b">
          <div className="h-2 bg-slate-200 rounded-full">
            <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${(currentStep / 7) * 100}%` }} />
          </div>
        </div>
        <AIProductAssistantChat 
          messages={messages}
          onSendMessage={processAnswer}
          onAddImages={addImages}
          onSkipImages={skipImages}
          onAddPdf={addPdf}
          onSkipPdf={skipPdf}
          isSubmitting={isSubmitting}
          isComplete={isComplete}
          showDescriptionButtons={showDescriptionButtons}
          showImageButtons={showImageButtons}
          showPdfButtons={showPdfButtons}
          onButtonClick={handleButtonClick}
        />
        <div className="p-3 text-center text-xs text-slate-500 border-t">💡 L'assistant peut détecter la catégorie et générer la description.</div>
      </div>
    </div>
  );
}