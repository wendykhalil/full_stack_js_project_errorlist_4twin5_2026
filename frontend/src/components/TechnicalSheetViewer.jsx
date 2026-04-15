import React, { useState, useEffect } from 'react';
import { FileText, Maximize2, Minimize2, X, RefreshCw } from 'lucide-react';

/**
 * TechnicalSheetViewer
 *
 * PDFs from Cloudinary are served with Content-Disposition: attachment, so a
 * plain <iframe src="...pdf"> triggers a download instead of rendering.
 * We route them through Google Docs Viewer which fetches the file server-side
 * and renders it inside the browser — no download, no plugin required.
 *
 * HTML content is rendered directly via dangerouslySetInnerHTML.
 */

function buildViewerUrl(url) {
  return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
}

function PDFEmbed({ url, height = '520px' }) {
  const [key, setKey] = useState(0); // remount iframe to retry
  const viewerUrl = buildViewerUrl(url);

  return (
    <div className="relative w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-50"
         style={{ height }}>
      <iframe
        key={key}
        src={viewerUrl}
        className="w-full h-full"
        title="Fiche technique"
        allow="autoplay"
      />
      {/* Retry button in case Google Docs Viewer shows "loading" forever */}
      <button
        onClick={() => setKey(k => k + 1)}
        title="Recharger"
        className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg bg-white/90 border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 shadow hover:bg-white"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Recharger
      </button>
    </div>
  );
}

export default function TechnicalSheetViewer({ sheet, title }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Close fullscreen on Escape
  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e) => { if (e.key === 'Escape') setIsFullscreen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFullscreen]);

  if (!sheet) return null;

  const isHTML =
    typeof sheet === 'string' &&
    (sheet.trim().startsWith('<') || sheet.toLowerCase().includes('</'));

  const renderContent = (fullscreen = false) => {
    const height = fullscreen ? '100%' : '520px';

    if (isHTML) {
      return (
        <div
          className="prose prose-sm max-w-none overflow-auto rounded-lg border border-slate-200 bg-white p-4"
          style={{ maxHeight: fullscreen ? '100%' : height }}
          dangerouslySetInnerHTML={{ __html: sheet }}
        />
      );
    }

    // PDF or any URL → Google Docs Viewer
    return <PDFEmbed url={sheet} height={height} />;
  };

  return (
    <>
      {/* ── Inline preview ── */}
      <div className="mt-2">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <FileText className="h-4 w-4 text-indigo-500" />
            Fiche technique
          </h4>
          <button
            onClick={() => setIsFullscreen(true)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Plein écran
          </button>
        </div>
        {renderContent(false)}
      </div>

      {/* ── Fullscreen modal ── */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/75 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Fiche technique – {title}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullscreen(false)}
                className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
              >
                <Minimize2 className="h-4 w-4" />
                Réduire
              </button>
              <button
                onClick={() => setIsFullscreen(false)}
                className="rounded-lg bg-white/10 p-1.5 text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden rounded-xl bg-white">
            {renderContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
