import React, { useState, useEffect } from 'react';
import { blockchainService } from '../blockchain/blockchainService';
import { formatAddress } from '../utils/crypto';
import type { CertificateData, BlockchainRecord } from '../types/certificate';
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  Ban, 
  Eye, 
  X,
  FileCheck2,
  RefreshCw,
  PlusCircle
} from 'lucide-react';

interface CertificateManagementPageProps {
  onNavigate: (path: string, verificationId?: string) => void;
}

export const CertificateManagementPage: React.FC<CertificateManagementPageProps> = ({ onNavigate }) => {
  const [certificates, setCertificates] = useState<Array<{ cert: CertificateData; record?: BlockchainRecord }>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'revoked'>('all');
  
  // Revocation modal state
  const [revokingCert, setRevokingCert] = useState<{ cert: CertificateData; record?: BlockchainRecord } | null>(null);
  const [revocationReason, setRevocationReason] = useState('Administrative credit withdrawal following curriculum re-audit.');
  const [isRevoking, setIsRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  useEffect(() => {
    loadCertificates();
    const unsub = blockchainService.subscribe(loadCertificates);
    return unsub;
  }, []);

  const loadCertificates = () => {
    setCertificates(blockchainService.getAllCertificates());
  };

  const handleOpenRevokeModal = (item: { cert: CertificateData; record?: BlockchainRecord }) => {
    setRevokingCert(item);
    setRevokeError(null);
  };

  const handleConfirmRevocation = async () => {
    if (!revokingCert) return;
    setIsRevoking(true);
    setRevokeError(null);

    try {
      await blockchainService.revokeCertificate(revokingCert.cert.verificationId, revocationReason);
      setRevokingCert(null);
      loadCertificates();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Revocation transaction failed';
      setRevokeError(msg);
    } finally {
      setIsRevoking(false);
    }
  };

  const filtered = certificates.filter(({ cert, record }) => {
    const isRevoked = record?.revoked;
    if (statusFilter === 'active' && isRevoked) return false;
    if (statusFilter === 'revoked' && !isRevoked) return false;

    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      cert.verificationId.toLowerCase().includes(q) ||
      cert.recipientName.toLowerCase().includes(q) ||
      cert.recipientId.toLowerCase().includes(q) ||
      cert.course.toLowerCase().includes(q) ||
      cert.certificateTitle.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Registry Credential Ledger</h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse, inspect, and execute on-chain status changes for all issued credentials.
          </p>
        </div>
        <button
          onClick={() => onNavigate('/issuer/issue')}
          className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Issue Credential</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, Name, or Course..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Interactive Segmented Filter Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({certificates.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter('revoked')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
              statusFilter === 'revoked'
                ? 'bg-amber-950/40 text-amber-300 border border-amber-800/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Revoked
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400">
                <th className="py-3 px-4 font-semibold">Verification ID</th>
                <th className="py-3 px-4 font-semibold">Recipient</th>
                <th className="py-3 px-4 font-semibold">Credential Title</th>
                <th className="py-3 px-4 font-semibold">Issue Date</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No certificates match your query.
                  </td>
                </tr>
              ) : (
                filtered.map(({ cert, record }) => {
                  const isRevoked = record?.revoked;
                  return (
                    <tr key={cert.verificationId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                        {cert.verificationId}
                      </td>
                      <td className="py-3.5 px-4 text-white font-medium">
                        {cert.recipientName}
                        <span className="block text-[11px] text-slate-500 font-mono">{cert.recipientId}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="truncate max-w-sm">{cert.certificateTitle}</div>
                        <span className="text-[11px] text-slate-500">{cert.institution}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {cert.issueDate}
                      </td>
                      <td className="py-3.5 px-4">
                        {isRevoked ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              REVOKED
                            </span>
                            {record?.revokedAt && (
                              <span className="block text-[10px] text-slate-500 mt-0.5">
                                {new Date(record.revokedAt * 1000).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => onNavigate(`/verify/${cert.verificationId}`, cert.verificationId)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-medium transition-colors cursor-pointer"
                        >
                          Verify & Audit
                        </button>

                        {!isRevoked ? (
                          <button
                            onClick={() => handleOpenRevokeModal({ cert, record })}
                            className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 rounded font-medium transition-colors cursor-pointer"
                          >
                            Revoke
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Revoked</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revocation Confirmation Modal */}
      {revokingCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Confirm On-Chain Revocation</span>
              </div>
              <button
                onClick={() => setRevokingCert(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to revoke <span className="font-mono text-cyan-400 font-semibold">{revokingCert.cert.verificationId}</span> ({revokingCert.cert.recipientName})? This action sends a revocation transaction to the smart contract and permanently invalidates the credential.
            </p>

            {revokeError && (
              <div className="p-2.5 bg-rose-950/50 border border-rose-800/50 rounded-lg text-xs text-rose-300">
                {revokeError}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Official Revocation Reason *
              </label>
              <textarea
                rows={3}
                value={revocationReason}
                onChange={(e) => setRevocationReason(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRevokingCert(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRevoking}
                onClick={handleConfirmRevocation}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
              >
                {isRevoking ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Executing Revoke...</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-4 h-4" />
                    <span>Execute Revocation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
