'use client';

import React, { useState } from 'react';
import { Download, Share2, Image, FileText, Check, Copy } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { PedigreeMember } from './types';

interface ExportToolbarProps {
  familyId: string;
  familyName: string;
  shareToken?: string;
  members: PedigreeMember[];
}

export const ExportToolbar: React.FC<ExportToolbarProps> = ({
  familyId,
  familyName,
  shareToken,
  members
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const shareUrl = shareToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/pedigree/share/${shareToken}`
    : '';

  // Export as SVG
  const exportSVG = () => {
    const svgElement = document.getElementById('pedigree-svg-root');
    if (!svgElement) return;

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);

    // Add XML namespaces if not present
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pedigree-${familyId}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export as PNG
  const exportPNG = async () => {
    const svgElement = document.getElementById('pedigree-svg-root');
    if (!svgElement) return;

    try {
      setExporting(true);
      const canvas = await html2canvas(svgElement as any, {
        backgroundColor: '#ffffff',
        scale: 2
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `pedigree-${familyId}.png`;
      link.click();
    } catch (e) {
      console.error('PNG export error', e);
    } finally {
      setExporting(false);
    }
  };

  // Export as PDF
  const exportPDF = async () => {
    const svgElement = document.getElementById('pedigree-svg-root');
    if (!svgElement) return;

    try {
      setExporting(true);
      const canvas = await html2canvas(svgElement as any, {
        backgroundColor: '#ffffff',
        scale: 2
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`pedigree-${familyId}-clinical-report.pdf`);
    } catch (e) {
      console.error('PDF export error', e);
    } finally {
      setExporting(false);
    }
  };

  const copyShareLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={exportPNG}
          disabled={exporting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
          title="Export pedigree image"
        >
          <Image className="w-3.5 h-3.5 text-pine" />
          <span>Image</span>
        </button>

        <button
          type="button"
          onClick={exportPDF}
          disabled={exporting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
          title="Export PDF Clinical Report"
        >
          <FileText className="w-3.5 h-3.5 text-pine" />
          <span>PDF</span>
        </button>

        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-pine hover:bg-pine-light rounded-xl shadow-xs transition"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-800 text-sm">
                Share De-Identified Pedigree Chart
              </h4>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Anyone with this cryptographically signed link can view the read-only, HIPAA/DPDP-compliant
              de-identified chart without editing privileges or direct PII exposure.
            </p>

            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
              <input
                type="text"
                readOnly
                value={shareUrl || 'Generating secure link...'}
                className="w-full bg-transparent text-xs text-slate-700 outline-none font-mono"
              />
              <button
                type="button"
                onClick={copyShareLink}
                className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-pine hover:bg-mint/20 rounded-lg transition"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

