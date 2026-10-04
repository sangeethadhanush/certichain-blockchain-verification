import React, { useState } from 'react';
import { blockchainService } from '../blockchain/blockchainService';
import { QRScannerModal } from '../components/QRScannerModal';
import { 
  ShieldCheck, 
  Search, 
  QrCode, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Lock, 
  FileCheck2,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (path: string, verificationId?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [searchId, setSearchId] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const stats = blockchainService.getDashboardStats();

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchId.trim().toUpperCase();
    if (!clean) {
      setInputError('Please enter a verification ID (e.g. CERT-7F4A92C1)');
      return;
    }
    onNavigate(`/verify/${clean}`, clean);
  };

  const handleQuickVerify = (id: string) => {
    onNavigate(`/verify/${id}`, id);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background ambient mesh */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[550px] bg-gradient-to-b from-cyan-950/20 via-slate-900/10 to-transparent pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-14 text-center">
        <div className="inline-flex items-center gap-2 text-xs text-cyan-400 font-mono mb-4 px-3 py-1 bg-cyan-950/40 border border-cyan-800/40 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>EVM Smart Contract Credential Layer</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.12]">
          Blockchain Digital Certificate Verification
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Verify credentials instantly through deterministic SHA-256 canonical hashing and immutable on-chain proofs. Protect institutions against diploma fraud and unauthorized alteration.
        </p>

        {/* Verification Search Box */}
        <div className="mt-10 max-w-2xl mx-auto">
          <form
            onSubmit={handleVerifySubmit}
            className="p-2 sm:p-2.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1 flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchId}
                onChange={(e) => {
                  setSearchId(e.target.value);
                  setInputError(null);
                }}
                placeholder="Enter Verification ID (e.g. CERT-7F4A92C1)"
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-white font-mono text-sm placeholder:text-slate-500 focus:outline-none transition-colors uppercase tracking-wider"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center justify-center gap-2 px-3.5 py-3 text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                title="Scan QR Code"
              >
                <QrCode className="w-5 h-5 text-cyan-400" />
                <span className="hidden sm:inline text-xs">Scan QR</span>
              </button>

              <button
                type="submit"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-cyan-500/20 cursor-pointer whitespace-nowrap"
              >
                <span>Verify Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {inputError && (
            <p className="mt-2 text-xs text-rose-400 text-left pl-3">{inputError}</p>
          )}

          {/* Seeded Instant Test Shortcuts */}
          <div className="mt-5 text-left bg-slate-900/40 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                One-Click Interactive Verification Samples:
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Live On-Chain Ledger</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickVerify('CERT-7F4A92C1')}
                className="p-2.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-lg text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-emerald-400 font-semibold">CERT-7F4A92C1</span>
                  <span className="text-[10px] text-emerald-400">Authentic</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">Arun Kumar · MIT</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickVerify('CERT-B32D8190')}
                className="p-2.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-lg text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-amber-400 font-semibold">CERT-B32D8190</span>
                  <span className="text-[10px] text-amber-400">Revoked</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">Elena Rostova · Stanford</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickVerify('CERT-C90E44FA')}
                className="p-2.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-lg text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-cyan-400 font-semibold">CERT-C90E44FA</span>
                  <span className="text-[10px] text-cyan-400">Perpetual</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">Marcus Vance · Oxford</div>
              </button>
            </div>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="mt-14 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-center">
            <div className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums">
              {stats.totalCertificates}
            </div>
            <div className="text-xs text-slate-400 mt-1">Total Registered</div>
          </div>
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-center">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono tabular-nums">
              {stats.activeCertificates}
            </div>
            <div className="text-xs text-slate-400 mt-1">Active Credentials</div>
          </div>
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-center">
            <div className="text-2xl sm:text-3xl font-bold text-amber-400 font-mono tabular-nums">
              {stats.revokedCertificates}
            </div>
            <div className="text-xs text-slate-400 mt-1">Revoked Records</div>
          </div>
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-center">
            <div className="text-2xl sm:text-3xl font-bold text-cyan-400 font-mono tabular-nums">
              {stats.authorizedIssuers}
            </div>
            <div className="text-xs text-slate-400 mt-1">Authorized Issuers</div>
          </div>
        </div>
      </section>

      {/* 3-Step Blockchain Trust Model */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How Blockchain-Backed Integrity Works
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            A trustless verification architecture eliminating forgeable PDF diplomas through mathematical proofs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl relative">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-5">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">01. Canonical SHA-256 Hashing</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              When an accredited institution issues a credential, the data fields are normalized into a strict canonical representation and hashed using cryptographic SHA-256.
            </p>
          </div>

          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl relative">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-5">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">02. Immutable On-Chain Anchor</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Only authorized issuer wallet addresses can execute the smart contract. The hash, verification ID, and issuance timestamp are minted immutably into EVM storage.
            </p>
          </div>

          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl relative">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-5">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">03. Zero-Knowledge Public Audit</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Anyone with the QR code or ID can verify the credential in milliseconds without login. If a single character is tampered with, the mathematical digest fails immediately.
            </p>
          </div>
        </div>
      </section>

      {/* Issuer CTA banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="p-8 sm:p-10 bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">Are you an Accredited Institution?</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Access the issuer console to batch issue verifiable digital certificates, manage authorized signing keys, and execute instant cryptographic revocations.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={() => onNavigate('/issuer/issue')}
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Issue Credential
            </button>
            <button
              onClick={() => onNavigate('/issuer')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              Issuer Dashboard
            </button>
          </div>
        </div>
      </section>

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(id) => handleQuickVerify(id)}
      />
    </div>
  );
};
