import React, { useState } from 'react';
import { FileText, X, Download, Maximize2, Minimize2 } from 'lucide-react';

export default function TechnicalSheetViewer({ sheet, title }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!sheet) return null;

  const isPDF = sheet.toLowerCase().endsWith('.pdf');
  const isHTML = sheet.toLowerCase().startsWith('<') || sheet.toLowerCase().includes('</');

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800"
      >
        <FileText className="h-4 w-4" />
        <span className="text-sm">Voir fiche technique</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`bg-white rounded-2xl flex flex-col ${
            isFullscreen ? 'w-full h-full' : 'w-full max-w-4xl h-[80vh]'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-slate-900">
                Fiche technique - {title}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-5 w-5 text-slate-600" />
                  ) : (
                    <Maximize2 className="h-5 w-5 text-slate-600" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X className="h-5 w-5 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {isPDF ? (
                <iframe
                  src={`${sheet}#toolbar=0&navpanes=0`}
                  className="w-full h-full rounded-lg"
                  title={`Fiche technique - ${title}`}
                />
              ) : isHTML ? (
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: sheet }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <a
                    href={sheet}
                    download
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger la fiche technique
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}