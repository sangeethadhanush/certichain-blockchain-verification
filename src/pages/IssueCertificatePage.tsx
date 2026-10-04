import React, { useState } from 'react';
import { blockchainService } from '../blockchain/blockchainService';
import { 
  computeCertificateHash, 
  buildCanonicalCertificateString, 
  formatAddress 
} from '../utils/crypto';
import { generateQrCodeDataUrl, downloadDataUrl } from '../utils/qr';
import type { CertificateData, BlockchainRecord } from '../types/certificate';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  QrCode, 
  ArrowRight, 
  Sparkles, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  Cpu, 
  AlertCircle 
} from 'lucide-react';

interface IssueCertificatePageProps {
  onNavigate: (path: string, verificationId?: string) => void;
}

export const IssueCertificatePage: React.FC<IssueCertificatePageProps> = ({ onNavigate }) => {
  const activeAccount = blockchainService.getActiveAccount();
  const issuerProfile = blockchainService.getIssuerProfile(activeAccount);
  const isAuthorized = blockchainService.isIssuerAuthorized(activeAccount);

  const [formData, setFormData] = useState({
    certificateTitle: 'Professional Certificate in Distributed Systems & Web3 Security',
    certificateType: 'Professional Certificate' as CertificateData['certificateType'],
    recipientName: 'Samantha Ray',
    recipientId: 'ACAD-2026-904',
    course: 'Smart Contract Architecture & Formal Verification',
    institution: issuerProfile?.institution || 'MIT Open Learning',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    gradeOrDistinction: 'Pass with Distinction (96%)',
    description: 'Accreditation verifying rigorous laboratory completion in EVM bytecode analysis, cryptographic audit protocols, and decentralized registry deployment.',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Success state
  const [issuedResult, setIssuedResult] = useState<{
    verificationId: string;
    certificateHash: string;
    transactionHash: string;
    blockNumber: number;
    certificate: CertificateData;
    record: BlockchainRecord;
    qrUrl: string;
  } | null>(null);

  // Live preview canonical hash
  const previewCanonical = buildCanonicalCertificateString({
    verificationId: 'CERT-PREVIEW',
    ...formData,
  });
  const previewHash = computeCertificateHash({
    verificationId: 'CERT-PREVIEW',
    ...formData,
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.certificateTitle.trim() || !formData.recipientName.trim() || !formData.recipientId.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (!isAuthorized) {
      setErrorMessage(`Issuer wallet ${formatAddress(activeAccount)} is not authorized on-chain. Please select an authorized issuer from the top-right wallet dropdown.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await blockchainService.issueCertificate(formData);
      const verifyUrl = `${window.location.origin}/verify/${res.verificationId}`;
      const qr = await generateQrCodeDataUrl(verifyUrl);

      setIssuedResult({
        ...res,
        qrUrl: qr,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Issuance failed';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* If already issued successfully, show the success state */}
      {issuedResult ? (
        <div className="max-w-3xl mx-auto bg-slate-900 border border-emerald-500/50 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Certificate Successfully Issued</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cryptographic record minted and permanently confirmed on blockchain.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="sm:col-span-2 space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Unique Verification ID</span>
                <span className="font-mono text-cyan-400 font-bold text-lg">
                  {issuedResult.verificationId}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Recipient</span>
                <span className="font-semibold text-white text-sm">
                  {issuedResult.certificate.recipientName} ({issuedResult.certificate.recipientId})
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Credential</span>
                <span className="text-slate-300 font-medium">
                  {issuedResult.certificate.certificateTitle}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Transaction Hash (EVM)</span>
                <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 break-all">
                  <span>{issuedResult.transactionHash}</span>
                  <button
                    onClick={() => copyToClipboard(issuedResult.transactionHash, 'tx')}
                    className="hover:text-white"
                  >
                    {copiedKey === 'tx' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Certificate SHA-256 Hash</span>
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400 break-all">
                  {issuedResult.certificateHash}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1 font-mono text-[11px] text-slate-400">
                <span>Block #{issuedResult.blockNumber.toLocaleString()}</span>
                <span>·</span>
                <span>Gas: {issuedResult.record.gasUsed}</span>
              </div>
            </div>

            {/* QR Card */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-3">
              <div className="p-2 bg-white rounded-lg shadow">
                <img src={issuedResult.qrUrl} alt="QR Code" className="w-36 h-36" />
              </div>
              <span className="text-[10px] font-mono text-cyan-400">Scan to Verify</span>
              
              <button
                onClick={() => downloadDataUrl(issuedResult.qrUrl, `${issuedResult.verificationId}-QR.png`)}
                className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save QR</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={() => onNavigate(`/verify/${issuedResult.verificationId}`, issuedResult.verificationId)}
              className="w-full sm:w-auto px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <span>Open Public Verification Page</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIssuedResult(null)}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors cursor-pointer"
            >
              Issue Another Certificate
            </button>
          </div>
        </div>
      ) : (
        /* Form View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Cols: Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-6">
              <div>
                <h1 className="text-xl font-bold text-white">Issue Digital Certificate</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Enter credential details. The platform calculates a canonical SHA-256 digest and registers it via smart contract.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-medium mb-1">Certificate Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.certificateTitle}
                      onChange={(e) => handleChange('certificateTitle', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-white"
                      placeholder="e.g. Master of Science in Distributed Systems"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Credential Type *</label>
                    <select
                      value={formData.certificateType}
                      onChange={(e) => handleChange('certificateType', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-white"
                    >
                      <option value="Professional Certificate">Professional Certificate</option>
                      <option value="Degree">Degree</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Accreditation">Accreditation</option>
                      <option value="License">License</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Institution / Organization *</label>
                    <input
                      type="text"
                      required
                      value={formData.institution}
                      onChange={(e) => handleChange('institution', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Recipient Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.recipientName}
                      onChange={(e) => handleChange('recipientName', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-white"
                      placeholder="e.g. Arun Kumar"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Recipient ID / Student No. *</label>
                    <input
                      type="text"
                      required
                      value={formData.recipientId}
                      onChange={(e) => handleChange('recipientId', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-white font-mono"
                      placeholder="e.g. STU-2024-8841"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-medium mb-1">Course / Specialization *</label>
                    <input
                      type="text"
                      required
                      value={formData.course}
                      onChange={(e) => handleChange('course', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Issue Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.issueDate}
                      onChange={(e) => handleChange('issueDate', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Expiry Date (Optional)</label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => handleChange('expiryDate', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-white font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-medium mb-1">Grade / Distinction / Honors</label>
                    <input
                      type="text"
                      value={formData.gradeOrDistinction}
                      onChange={(e) => handleChange('gradeOrDistinction', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-white"
                      placeholder="e.g. First Class Honours / Magna Cum Laude"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-medium mb-1">Detailed Description / Abstract</label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400 font-mono">
                    Issuer: <span className="text-cyan-400">{formatAddress(activeAccount)}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer shadow-lg shadow-cyan-500/20"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Confirming on Blockchain...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Issue Certificate on Blockchain</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Col: Live Cryptographic Anchor Preview */}
          <div className="space-y-6">
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Live Cryptographic Digest</h3>
              </div>
              <p className="text-xs text-slate-400">
                As you type, this preview dynamically generates the canonical byte stream and SHA-256 digest that will be committed on-chain.
              </p>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 block font-medium">Computed SHA-256 Hash</span>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-emerald-400 break-all select-all">
                  {previewHash}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 block font-medium">Canonical Field Serialization</span>
                <pre className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[10px] text-cyan-300/80 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {previewCanonical}
                </pre>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Smart Contract:</span>
                  <span className="text-slate-300 font-mono">CertificateRegistry.sol</span>
                </div>
                <div className="flex justify-between">
                  <span>State Mutability:</span>
                  <span className="text-emerald-400 font-semibold font-mono">NON-REVERSIBLE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
