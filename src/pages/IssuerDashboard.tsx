import React, { useState, useEffect } from 'react';
import { blockchainService } from '../blockchain/blockchainService';
import { formatAddress } from '../utils/crypto';
import type { CertificateData, BlockchainRecord } from '../types/certificate';
import { 
  FileCheck, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  PlusCircle, 
  ExternalLink, 
  Search,
  ArrowUpRight,
  Shield,
  Layers,
  ChevronRight
} from 'lucide-react';

interface IssuerDashboardProps {
  onNavigate: (path: string, verificationId?: string) => void;
}

export const IssuerDashboard: React.FC<IssuerDashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState(blockchainService.getDashboardStats());
  const [activeAccount, setActiveAccount] = useState(blockchainService.getActiveAccount());
  const [config, setConfig] = useState(blockchainService.getConfig());
  const [certificates, setCertificates] = useState<Array<{ cert: CertificateData; record?: BlockchainRecord }>>([]);

  useEffect(() => {
    loadData();
    const unsub = blockchainService.subscribe(loadData);
    return unsub;
  }, []);

  const loadData = () => {
    setStats(blockchainService.getDashboardStats());
    setActiveAccount(blockchainService.getActiveAccount());
    setConfig(blockchainService.getConfig());
    setCertificates(blockchainService.getAllCertificates());
  };

  const isAuthorized = blockchainService.isIssuerAuthorized(activeAccount);
  const issuerProfile = blockchainService.getIssuerProfile(activeAccount);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Profile Bar */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Institutional Credential Console
            </span>
            <span
              className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                isAuthorized
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {isAuthorized ? '✓ AUTHORIZED ISSUER' : 'UNAUTHORIZED'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            {issuerProfile?.institution || 'Credential Authority'}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
            <span>Signing Key:</span>
            <span className="text-cyan-400">{formatAddress(activeAccount, 6)}</span>
            <span>·</span>
            <span>Network:</span>
            <span className="text-slate-300">{config.networkName}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/issuer/issue')}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Issue New Certificate</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Credentials</span>
            <FileCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums">
            {stats.totalCertificates}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Immutable on-chain entries</div>
        </div>

        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Active & Valid</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono tabular-nums">
            {stats.activeCertificates}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Passing all audits</div>
        </div>

        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Revoked Credentials</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-400 font-mono tabular-nums">
            {stats.revokedCertificates}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Invalidated records</div>
        </div>

        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Public Verifications</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-cyan-400 font-mono tabular-nums">
            {stats.totalVerifications}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Zero-knowledge lookups</div>
        </div>
      </div>

      {/* Recent Certificates Table */}
      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Recently Issued Credentials</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live ledger entries registered with cryptographic proofs.
            </p>
          </div>
          <button
            onClick={() => onNavigate('/issuer/certificates')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View All ({certificates.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">Verification ID</th>
                <th className="pb-3 font-semibold">Recipient</th>
                <th className="pb-3 font-semibold">Credential Title</th>
                <th className="pb-3 font-semibold">Issue Date</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {certificates.slice(0, 5).map(({ cert, record }) => {
                const isRevoked = record?.revoked;
                return (
                  <tr key={cert.verificationId} className="hover:bg-slate-850/40 transition-colors">
                    <td className="py-3.5 font-mono font-semibold text-cyan-400">
                      {cert.verificationId}
                    </td>
                    <td className="py-3.5 text-white font-medium">
                      {cert.recipientName}
                      <span className="block text-[11px] text-slate-500 font-mono">{cert.recipientId}</span>
                    </td>
                    <td className="py-3.5 text-slate-300">
                      <div className="truncate max-w-xs">{cert.certificateTitle}</div>
                      <span className="text-[11px] text-slate-500">{cert.institution}</span>
                    </td>
                    <td className="py-3.5 font-mono text-slate-400">
                      {cert.issueDate}
                    </td>
                    <td className="py-3.5">
                      {isRevoked ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          REVOKED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-right space-x-2">
                      <button
                        onClick={() => onNavigate(`/verify/${cert.verificationId}`, cert.verificationId)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded font-medium transition-colors cursor-pointer"
                      >
                        Verify
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
