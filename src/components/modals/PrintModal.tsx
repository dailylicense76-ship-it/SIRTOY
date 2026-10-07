import React, { useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Printer, ExternalLink, Download, Copy, Check } from 'lucide-react';

export const PrintModal: React.FC = () => {
  const { activeModal, modalParams, closeModal, showToast } = useApp();
  const [copied, setCopied] = React.useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (activeModal !== 'printModal') return null;

  const title = (modalParams.title as string) || 'Print Document';
  const htmlContent = (modalParams.html as string) || '';

  // Sanitized content for inline preview container (remove auto-print scripts)
  const cleanInlineHtml = useMemo(() => {
    return htmlContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }, [htmlContent]);

  // Full HTML for standalone tab/file with instant auto-print script
  const fullPrintHtml = useMemo(() => {
    if (!htmlContent) return '';
    if (htmlContent.includes('window.print()')) return htmlContent;
    return htmlContent.replace('</body>', '<script>window.onload=function(){setTimeout(function(){window.print();},300);};</script></body>');
  }, [htmlContent]);

  // Create an offline Blob URL so the user can open it in a clean tab if their browser blocks iframe prints
  const blobUrl = useMemo(() => {
    if (!fullPrintHtml) return '';
    try {
      const blob = new Blob(['\uFEFF' + fullPrintHtml], { type: 'text/html;charset=utf-8' });
      return URL.createObjectURL(blob);
    } catch {
      return '';
    }
  }, [fullPrintHtml]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const handlePrint = () => {
    // 1. Try native window.print() targeting the printable container via CSS
    try {
      window.print();
      return;
    } catch (e) {
      console.warn('Direct window.print() restricted or failed:', e);
    }

    // 2. Fallback: If blobUrl is available, open in a new window
    if (blobUrl) {
      const w = window.open(blobUrl, '_blank');
      if (!w) {
        showToast('Direct printing restricted by preview. Please click "Open in New Tab" button!', 'warn');
      }
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob(['\uFEFF' + fullPrintHtml], { type: 'text/html;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const safeName = title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      a.download = `${safeName}.html`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      showToast('Document downloaded! Open in browser and press Ctrl+P to print.');
    } catch {
      showToast('Download failed.', 'warn');
    }
  };

  const handleCopy = () => {
    if (containerRef.current) {
      navigator.clipboard.writeText(containerRef.current.innerText || containerRef.current.textContent || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast('Text copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border-2 border-slate-300 overflow-hidden my-auto max-h-[95vh] flex flex-col animate-3d-modal">
        {/* Header Toolbar */}
        <div
          style={{
            backgroundColor: '#0f172a',
            backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
            color: '#ffffff',
            borderColor: '#64748b'
          }}
          className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3.5 border-b shadow-md gap-2 flex-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 text-white flex items-center justify-center font-black shadow-inner">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-sm sm:text-base leading-tight">
                {title}
              </h3>
              <p className="text-[11px] text-slate-200 font-semibold">Print Preview, Document Dispatch & Thermal Receipt</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Print Button */}
            <button
              onClick={handlePrint}
              className="btn-3d-blue flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs shadow-md transition-all cursor-pointer"
              title="Send to physical or thermal printer"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Print Now (Ctrl+P)</span>
            </button>

            {/* Open Standalone Window link - 100% bypasses popup blocker & iframe sandbox */}
            {blobUrl && (
              <a
                href={blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs border border-white/30 transition-all cursor-pointer"
                title="Open in a fresh standalone browser window with native print capability"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Tab</span>
              </a>
            )}

            {/* Download as HTML */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs border border-white/30 transition-all cursor-pointer"
              title="Download offline document"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save</span>
            </button>

            {/* Copy Text */}
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-all cursor-pointer"
              title="Copy text content"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={closeModal}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-all cursor-pointer"
              title="Close window"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Paper Preview Sheet */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
          <div
            id="sirtoy-printable-container"
            ref={containerRef}
            className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-300 max-w-4xl w-full text-slate-900 overflow-x-auto min-h-[500px]"
          >
            <div dangerouslySetInnerHTML={{ __html: cleanInlineHtml }} />
          </div>
        </div>

        {/* Bottom Helper Bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 text-slate-500 text-[11px] flex flex-wrap justify-between items-center gap-2 flex-none">
          <span>Tip: Supports standard A4 desktop printers and 58mm / 80mm thermal receipt printers.</span>
          <span className="font-semibold text-slate-600">SIRTOY Lending Plus Document Engine</span>
        </div>
      </div>
    </div>
  );
};
