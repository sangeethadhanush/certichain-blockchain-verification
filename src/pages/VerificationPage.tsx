import React, { useState, useEffect } from 'react';
import { blockchainService } from '../blockchain/blockchainService';
import { 
  computeCertificateHash, 
  formatAddress, 
  diffHashes,
  buildCanonicalCertificateString
} from '../utils/crypto';
import { generateQrCodeDataUrl, downloadDataUrl } from '../utils/qr';
import { QRScannerModal } from '../components/QRScannerModal';
import type { 
  CertificateData, 
  VerificationResult, 
  BlockchainRecord 
} from '../types/certificate';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  QrCode, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  SlidersHorizontal, 
  RotateCcw,
  FileText,
  Lock,
  ArrowRight
} from 'lucide-react';

interface VerificationPageProps {
  initialId?: string;
  onNavigate: (path: string, verificationId?: string) => void;
}

export const VerificationPage: React.FC<VerificationPageProps> = ({ initialId, onNavigate }) => {
  const [searchInput, setSearchInput] = useState(initialId || 'CERT-7F4A92C1');
  const [activeVerificationId, setActiveVerificationId] = useState(initialId || 'CERT-7F4A92C1');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Verification states
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Tamper simulation inspector state
  const [isTamperPanelOpen, setIsTamperPanelOpen] = useState(false);
  const [tamperedData, setTamperedData] = useState<CertificateData | null>(null);
  const [activeTab, setActiveTab] = useState<'audit' | 'certificate' | 'raw-ledger'>('audit');

  useEffect(() => {
    if (initialId) {
      setSearchInput(initialId);
      setActiveVerificationId(initialId);
    }
  }, [initialId]);

  useEffect(() => {
    runVerification(activeVerificationId);
  }, [activeVerificationId]);

  const runVerification = async (id: string, overrideCert?: CertificateData) => {
    setIsLoading(true);
    try {
      const res = await blockchainService.verifyCertificate(id, overrideCert);
      setVerificationResult(res);

      if (res.candidateCertificate) {
        if (!overrideCert) {
          setTamperedData({ ...res.candidateCertificate });
        }
        const verifyUrl = `${window.location.origin}/verify/${res.verificationId}`;
        const qr = await generateQrCodeDataUrl(verifyUrl);
        setQrCodeUrl(qr);
      } else {
        setTamperedData(null);
        setQrCodeUrl(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchInput.trim().toUpperCase();
    if (!clean) return;
    setActiveVerificationId(clean);
    onNavigate(`/verify/${clean}`, clean);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Tamper manipulation handlers
  const handleTamperFieldChange = (field: keyof CertificateData, value: string) => {
    if (!tamperedData) return;
    const updated = { ...tamperedData, [field]: value };
    setTamperedData(updated);
    runVerification(activeVerificationId, updated);
  };

  const handleApplyPresetTamper = (preset: 'course' | 'recipient' | 'grade') => {
    if (!tamperedData) return;
    let updated = { ...tamperedData };
    if (preset === 'course') {
      updated.course = updated.course.includes('Cyber Security')
        ? 'Distributed Ledger Architecture & Consensus Protocols'
        : 'Cyber Security & Advanced Penetration Testing';
    } else if (preset === 'recipient') {
      updated.recipientName = updated.recipientName.includes('Sharma')
        ? 'Arun Kumar'
        : 'Arun Kumar Sharma';
    } else if (preset === 'grade') {
      updated.gradeOrDistinction = 'Forged Summa Cum Laude with 100% Score';
    }
    setTamperedData(updated);
    runVerification(activeVerificationId, updated);
  };

  const handleResetOriginalData = () => {
    const original = blockchainService.getCertificateData(activeVerificationId);
    if (original) {
      setTamperedData({ ...original });
      runVerification(activeVerificationId, original);
    }
  };

  const renderStatusBadge = () => {
    if (!verificationResult) return null;

    switch (verificationResult.status) {
      case 'VERIFIED':
        return (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-emerald-400 font-bold tracking-wide text-sm uppercase">
                  ✓ VERIFIED ON BLOCKCHAIN
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  Certificate is authentic, unchanged, and signed by an accredited institution.
                </div>
              </div>
            </div>
            <span className="hidden sm:inline-block px-3 py-1 bg-emerald-500/10 text-emerald-300 text-xs font-mono font-medium rounded-full border border-emerald-500/20">
              IMMUTABLE RECORD
            </span>
          </div>
        );

      case 'TAMPERED':
        return (
          <div className="p-4 bg-rose-950/50 border border-rose-500/60 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="text-rose-400 font-bold tracking-wide text-sm uppercase">
                  ⚠ CERTIFICATE INTEGRITY FAILED (TAMPERED)
                </div>
                <div className="text-xs text-rose-200 mt-0.5">
                  The candidate certificate payload does not match the cryptographic record stored on the blockchain.
                </div>
              </div>
            </div>
            <span className="hidden sm:inline-block px-3 py-1 bg-rose-500/10 text-rose-300 text-xs font-mono font-medium rounded-full border border-rose-500/20">
              HASH DIVERGENCE
            </span>
          </div>
        );

      case 'REVOKED':
        return (
          <div className="p-4 bg-amber-950/50 border border-amber-500/60 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-amber-400 font-bold tracking-wide text-sm uppercase">
                  ⚠ CERTIFICATE REVOKED BY ISSUER
                </div>
                <div className="text-xs text-amber-200 mt-0.5">
                  {verificationResult.blockchainRecord?.revocationReason || 'This certificate was officially invalidated by the issuing authority.'}
                </div>
              </div>
            </div>
            <span className="hidden sm:inline-block px-3 py-1 bg-amber-500/10 text-amber-300 text-xs font-mono font-medium rounded-full border border-amber-500/20">
              REVOKED ON-CHAIN
            </span>
          </div>
        );

      case 'EXPIRED':
        return (
          <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-amber-400 font-bold tracking-wide text-sm uppercase">
                  ⚠ CERTIFICATE EXPIRED
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  The validity period of this credential has concluded.
                </div>
              </div>
            </div>
          </div>
        );

      case 'NOT_FOUND':
      default:
        return (
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-slate-200 font-bold tracking-wide text-sm uppercase">
                  ✕ CERTIFICATE NOT FOUND
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  No cryptographic record exists for identifier {verificationResult.verificationId} on this blockchain registry.
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  const hashDiff = verificationResult?.computedHash && verificationResult?.onChainHash
    ? diffHashes(verificationResult.onChainHash, verificationResult.computedHash)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Search & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Verify Certificate ID (e.g. CERT-7F4A92C1)"
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 uppercase"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Verify
          </button>
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Scan QR"
          >
            <QrCode className="w-4 h-4 text-cyan-400" />
          </button>
        </form>

        {/* Live Tamper Simulator Toggle Button */}
        {verificationResult?.candidateCertificate && (
          <button
            onClick={() => setIsTamperPanelOpen(!isTamperPanelOpen)}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
              isTamperPanelOpen
                ? 'bg-rose-950/60 border-rose-700/80 text-rose-300'
                : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isTamperPanelOpen ? 'Close Tamper Simulator' : 'Test Tamper Detection'}</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          </button>
        )}
      </div>

      {/* Main Status Hero */}
      {renderStatusBadge()}

      {/* Interactive Tamper Sandbox Inspector (When opened) */}
      {isTamperPanelOpen && tamperedData && (
        <div className="p-5 bg-slate-900 border border-rose-500/40 rounded-2xl shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white">Cryptographic Tamper Simulator</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Modify any certificate parameter below. The SHA-256 hash recalculates in real-time to demonstrate instant tamper detection.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetOriginalData}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                Reset to Authentic
              </button>
            </div>
          </div>

          {/* Quick preset tamper buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">1-Click Tamper Scenarios:</span>
            <button
              onClick={() => handleApplyPresetTamper('course')}
              className="px-2.5 py-1 bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 rounded-md text-slate-300 hover:text-rose-200 transition-colors"
            >
              Modify Course to "Cyber Security"
            </button>
            <button
              onClick={() => handleApplyPresetTamper('recipient')}
              className="px-2.5 py-1 bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 rounded-md text-slate-300 hover:text-rose-200 transition-colors"
            >
              Alter Recipient Name
            </button>
            <button
              onClick={() => handleApplyPresetTamper('grade')}
              className="px-2.5 py-1 bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 rounded-md text-slate-300 hover:text-rose-200 transition-colors"
            >
              Inflate Grade to Summa Cum Laude
            </button>
          </div>

          {/* Editable fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Recipient Name</label>
              <input
                type="text"
                value={tamperedData.recipientName}
                onChange={(e) => handleTamperFieldChange('recipientName', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Course / Program</label>
              <input
                type="text"
                value={tamperedData.course}
                onChange={(e) => handleTamperFieldChange('course', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Institution</label>
              <input
                type="text"
                value={tamperedData.institution}
                onChange={(e) => handleTamperFieldChange('institution', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tabs: Cryptographic Audit vs Diploma View vs Raw Ledger */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cryptographic Integrity Audit
          </button>
          <button
            onClick={() => setActiveTab('certificate')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'certificate'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Official Certificate Presentation
          </button>
          <button
            onClick={() => setActiveTab('raw-ledger')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'raw-ledger'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Blockchain Record & Explorer
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span>Verification ID:</span>
          <span className="font-mono text-cyan-400 font-semibold">{activeVerificationId}</span>
        </div>
      </div>

      {/* TAB 1: Cryptographic Integrity Audit */}
      {activeTab === 'audit' && verificationResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Side-by-Side Hash Inspector & Check List */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Hash Comparison Card */}
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  Deterministic SHA-256 Hash Comparison
                </h3>
                <span
                  className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-full ${
                    verificationResult.hashMatches
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {verificationResult.hashMatches ? '✓ 100% MATCH' : '✗ HASH MISMATCH'}
                </span>
              </div>

              {/* On-Chain Hash */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Blockchain On-Chain Hash (Original Immutable Record)</span>
                  <button
                    onClick={() => copyToClipboard(verificationResult.onChainHash || '', 'onChain')}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    {copiedKey === 'onChain' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy</span>
                  </button>
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-emerald-400 break-all select-all">
                  {verificationResult.onChainHash || 'No record found'}
                </div>
              </div>

              {/* Candidate Hash */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Current Computed Hash (Recalculated from presented certificate)</span>
                  <button
                    onClick={() => copyToClipboard(verificationResult.computedHash || '', 'computed')}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    {copiedKey === 'computed' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy</span>
                  </button>
                </div>
                <div
                  className={`p-2.5 bg-slate-950 border rounded-lg font-mono text-xs break-all select-all ${
                    verificationResult.hashMatches
                      ? 'border-slate-800 text-emerald-400'
                      : 'border-rose-500/50 text-rose-400'
                  }`}
                >
                  {verificationResult.computedHash || 'Payload empty'}
                </div>
              </div>

              {/* Visual Diff Highlight (if tampered) */}
              {!verificationResult.hashMatches && hashDiff && (
                <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-xl space-y-1.5 text-xs">
                  <div className="font-semibold text-rose-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    Cryptographic Avalanche Effect Detected
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Because SHA-256 is an irreversible cryptographic one-way function, changing even a single comma or character in the candidate certificate produces a radically different 256-bit output ({hashDiff.mismatchIndices.length} character positions diverge).
                  </p>
                </div>
              )}
            </div>

            {/* Step-by-Step Blockchain Verification Trail */}
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white">8-Point Verification Pipeline Checklist</h3>
              <div className="space-y-3">
                {verificationResult.checks.map((chk, idx) => (
                  <div
                    key={chk.id || idx}
                    className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-start gap-3"
                  >
                    <div className="mt-0.5">
                      {chk.status === 'passed' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {chk.status === 'failed' && <XCircle className="w-4 h-4 text-rose-400" />}
                      {chk.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                      {chk.status === 'pending' && <span className="w-4 h-4 rounded-full border-2 border-slate-600 border-t-cyan-400 animate-spin" />}
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="font-semibold text-slate-200">{chk.label}</div>
                      <div className="text-slate-400 mt-0.5 leading-relaxed">{chk.details}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Canonical payload preview */}
            {verificationResult.candidateCertificate && (
              <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Canonical Field Representation (Input to SHA-256)
                </h3>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-cyan-300/90 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                  {buildCanonicalCertificateString(verificationResult.candidateCertificate)}
                </pre>
              </div>
            )}
          </div>

          {/* Right Column: Issuer Identity & QR Card */}
          <div className="space-y-6">
            
            {/* Issuer Authority Card */}
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white">Issuing Authority Provenance</h3>
              
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Accredited Institution</span>
                  <span className="font-semibold text-white text-sm">
                    {verificationResult.issuerName || verificationResult.candidateCertificate?.institution || 'Unknown Authority'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Authorized Signer Address</span>
                  <div className="flex items-center justify-between font-mono text-slate-300 bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="truncate mr-2">
                      {verificationResult.blockchainRecord?.issuer || 'Not on-chain'}
                    </span>
                    {verificationResult.blockchainRecord?.issuer && (
                      <button
                        onClick={() => copyToClipboard(verificationResult.blockchainRecord?.issuer || '', 'issuerAddr')}
                        className="text-slate-400 hover:text-white"
                      >
                        {copiedKey === 'issuerAddr' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Issuer Status:</span>
                  <span
                    className={`font-semibold font-mono ${
                      verificationResult.issuerAuthorized ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {verificationResult.issuerAuthorized ? '✓ Authorized Issuer' : '✕ Unauthorized'}
                  </span>
                </div>
              </div>
            </div>

            {/* QR Code & Direct Verification URL */}
            {qrCodeUrl && (
              <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl text-center space-y-3">
                <h3 className="text-sm font-bold text-white">Public Verification QR</h3>
                <p className="text-[11px] text-slate-400">
                  Scan with any mobile camera or CertiChain verifier to open proof directly.
                </p>

                <div className="p-3 bg-white rounded-xl inline-block shadow-md">
                  <img src={qrCodeUrl} alt="Certificate Verification QR" className="w-36 h-36" />
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => downloadDataUrl(qrCodeUrl, `${verificationResult.verificationId}-QR.png`)}
                    className="flex items-center justify-center gap-1.5 w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download QR Code (PNG)
                  </button>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/verify/${verificationResult.verificationId}`;
                      copyToClipboard(url, 'url');
                    }}
                    className="flex items-center justify-center gap-1.5 w-full py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                  >
                    {copiedKey === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy Verification URL</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Official Diploma / Certificate Presentation */}
      {activeTab === 'certificate' && verificationResult?.candidateCertificate && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2 no-print">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
          </div>

          {/* High-fidelity Parchment Certificate Card */}
          <div className="relative w-full max-w-4xl mx-auto bg-slate-950 border-8 border-double border-slate-700 rounded-xl p-8 sm:p-14 text-center shadow-2xl overflow-hidden">
            {/* Guilloche ornament watermark */}
            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Certificate Header */}
            <div className="space-y-2">
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
                {verificationResult.candidateCertificate.institution}
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-certificate tracking-wide mt-2">
                {verificationResult.candidateCertificate.certificateTitle}
              </h2>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Official Academic & Professional Credential
              </div>
            </div>

            <div className="my-8 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

            {/* Recipient presentation */}
            <div className="space-y-2">
              <p className="text-xs text-slate-400 italic">This is to certify that</p>
              <h3 className="text-3xl sm:text-4xl font-bold text-white font-certificate text-cyan-200">
                {verificationResult.candidateCertificate.recipientName}
              </h3>
              <p className="text-xs font-mono text-slate-400">
                Identifier: {verificationResult.candidateCertificate.recipientId}
              </p>
            </div>

            <div className="my-6 max-w-xl mx-auto text-xs text-slate-300 leading-relaxed">
              has successfully fulfilled all curriculum, laboratory, and examination standards for the program in{' '}
              <span className="font-semibold text-white">
                {verificationResult.candidateCertificate.course}
              </span>
              {verificationResult.candidateCertificate.gradeOrDistinction && (
                <span className="block mt-1 text-cyan-400 font-medium">
                  {verificationResult.candidateCertificate.gradeOrDistinction}
                </span>
              )}
            </div>

            {verificationResult.candidateCertificate.description && (
              <p className="text-[11px] text-slate-400 italic max-w-lg mx-auto mb-8">
                "{verificationResult.candidateCertificate.description}"
              </p>
            )}

            {/* Signatures & Blockchain Seal */}
            <div className="mt-12 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 items-center gap-6 text-left">
              <div>
                <div className="text-xs text-slate-400 font-medium">Date of Issuance</div>
                <div className="text-sm font-semibold text-white font-mono mt-0.5">
                  {verificationResult.candidateCertificate.issueDate}
                </div>
                {verificationResult.candidateCertificate.expiryDate && (
                  <div className="text-[11px] text-slate-500 font-mono">
                    Expires: {verificationResult.candidateCertificate.expiryDate}
                  </div>
                )}
              </div>

              <div className="text-center flex flex-col items-center">
                {qrCodeUrl && (
                  <img src={qrCodeUrl} alt="Certificate QR" className="w-20 h-20 bg-white p-1 rounded-lg shadow" />
                )}
                <span className="text-[10px] font-mono text-cyan-400 mt-1 font-semibold">
                  {verificationResult.verificationId}
                </span>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400 font-medium">Issuing Registrar</div>
                <div className="text-sm font-semibold text-white font-mono mt-0.5">
                  {formatAddress(verificationResult.blockchainRecord?.issuer || '')}
                </div>
                <div className="text-[11px] text-emerald-400 font-medium">
                  ✓ Verified On Blockchain
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Blockchain Record & Explorer */}
      {activeTab === 'raw-ledger' && verificationResult?.blockchainRecord && (
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">EVM State & Block Transparency</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Exact storage slot parameters confirmed on the smart contract.
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-semibold">
              {verificationResult.blockchainRecord.networkName}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[11px] text-slate-400 font-sans block">Verification ID</span>
              <span className="text-cyan-400 font-bold">{verificationResult.blockchainRecord.verificationId}</span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[11px] text-slate-400 font-sans block">Block Number</span>
              <span className="text-white font-bold">#{verificationResult.blockchainRecord.blockNumber.toLocaleString()}</span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 sm:col-span-2">
              <span className="text-[11px] text-slate-400 font-sans block">Transaction Hash</span>
              <span className="text-slate-300 break-all">{verificationResult.blockchainRecord.transactionHash}</span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 sm:col-span-2">
              <span className="text-[11px] text-slate-400 font-sans block">Certificate Hash (bytes32)</span>
              <span className="text-emerald-400 break-all">{verificationResult.blockchainRecord.certificateHash}</span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 sm:col-span-2">
              <span className="text-[11px] text-slate-400 font-sans block">Recipient ID Hash (SHA-256 for Privacy)</span>
              <span className="text-slate-400 break-all">{verificationResult.blockchainRecord.recipientHash}</span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[11px] text-slate-400 font-sans block">Gas Utilized</span>
              <span className="text-slate-300">{verificationResult.blockchainRecord.gasUsed || '118,400 gas'}</span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[11px] text-slate-400 font-sans block">Timestamp</span>
              <span className="text-slate-300">
                {new Date(verificationResult.blockchainRecord.issuedAt * 1000).toUTCString()}
              </span>
            </div>
          </div>
        </div>
      )}

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(id) => {
          setSearchInput(id);
          setActiveVerificationId(id);
          onNavigate(`/verify/${id}`, id);
        }}
      />
    </div>
  );
};
