import React, { useEffect } from 'react';
import { X, Bot } from 'lucide-react';
import AIAssistantChat from './AIAssistantChat';
import { useAIAssistant } from './useAIAssistant';

export default function AIAssistantModal({ isOpen, onClose, onSubmit }) {
  const {
    messages,
    currentStep,
    answers,
    userLanguage,
    isComplete,
    isSubmitting,
    currentField,
    materialsInput,
    setMaterialsInput,
    selectedImages,
    startConversation,
    processAnswer,
    addMaterial,
    finishMaterials,
    addImages,
    skipImages,
    reset
  } = useAIAssistant(onSubmit, onClose);

  useEffect(() => {
    if (isOpen) {
      reset();
      startConversation();
    }
  }, [isOpen, reset, startConversation]);

  if (!isOpen) return null;

  const totalFields = 13; // including images field

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white/20 p-2">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Assistant IA - Création de projet
              </h3>
              <p className="text-xs text-indigo-100">
                {userLanguage === 'ar' ? 'تحدث بالدارجة، الفرنسية أو الإنجليزية' : 
                 userLanguage === 'fr' ? 'Parlez en tunisien, français ou anglais' : 
                 'Speak in Tunisian, French, or English'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex justify-between text-xs text-slate-600 mb-1">
            <span>Progression</span>
            <span>{Math.round((currentStep / totalFields) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${(currentStep / totalFields) * 100}%` }}
            />
          </div>
        </div>

        {/* Chat Area */}
        <AIAssistantChat
          messages={messages}
          currentField={{ ...currentField, answers }}
          materialsInput={materialsInput}
          setMaterialsInput={setMaterialsInput}
          selectedImages={selectedImages}
          onSendMessage={processAnswer}
          onAddMaterial={addMaterial}
          onFinishMaterials={finishMaterials}
          onAddImages={addImages}
          onSkipImages={skipImages}
          isSubmitting={isSubmitting}
          isComplete={isComplete}
        />

        {/* Footer Info */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3">
          <p className="text-center text-xs text-slate-500">
            💡 L'assistant peut comprendre le dialecte tunisien, le français et l'anglais
          </p>
        </div>
      </div>
    </div>
  );
}