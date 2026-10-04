import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { VerificationPage } from './pages/VerificationPage';
import { IssuerDashboard } from './pages/IssuerDashboard';
import { IssueCertificatePage } from './pages/IssueCertificatePage';
import { CertificateManagementPage } from './pages/CertificateManagementPage';
import { SettingsPage } from './pages/SettingsPage';
import { ShieldCheck, Heart } from 'lucide-react';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');
  const [verificationId, setVerificationId] = useState<string | undefined>(() => {
    // Check URL pathname /verify/CERT-XXXX or query param ?id=CERT-XXXX
    const pathMatch = window.location.pathname.match(/\/verify\/([^/?#]+)/i);
    if (pathMatch) return pathMatch[1].toUpperCase();

    const searchParams = new URLSearchParams(window.location.search);
    const idParam = searchParams.get('id');
    if (idParam) return idParam.toUpperCase();

    return undefined;
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname || '/';
      setCurrentPath(path);

      const pathMatch = path.match(/\/verify\/([^/?#]+)/i);
      if (pathMatch) {
        setVerificationId(pathMatch[1].toUpperCase());
      } else {
        const searchParams = new URLSearchParams(window.location.search);
        const idParam = searchParams.get('id');
        setVerificationId(idParam ? idParam.toUpperCase() : undefined);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (path: string, newVerificationId?: string) => {
    let targetId = newVerificationId;
    if (!targetId) {
      const pathMatch = path.match(/\/verify\/([^/?#]+)/i);
      if (pathMatch) targetId = pathMatch[1].toUpperCase();
    }

    if (targetId) {
      setVerificationId(targetId);
    }

    setCurrentPath(path);
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCurrentPage = () => {
    if (currentPath === '/' || currentPath === '') {
      return <LandingPage onNavigate={handleNavigate} />;
    }

    if (currentPath.startsWith('/verify')) {
      return (
        <VerificationPage
          initialId={verificationId}
          onNavigate={handleNavigate}
        />
      );
    }

    if (currentPath === '/issuer') {
      return <IssuerDashboard onNavigate={handleNavigate} />;
    }

    if (currentPath === '/issuer/issue') {
      return <IssueCertificatePage onNavigate={handleNavigate} />;
    }

    if (currentPath === '/issuer/certificates') {
      return <CertificateManagementPage onNavigate={handleNavigate} />;
    }

    if (currentPath === '/issuer/settings') {
      return <SettingsPage />;
    }

    // Default fallback to LandingPage
    return <LandingPage onNavigate={handleNavigate} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar currentPath={currentPath} onNavigate={handleNavigate} />
      
      <main className="flex-1">
        {renderCurrentPage()}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-300">CertiChain</span>
            <span>—</span>
            <span>Trust certificates through blockchain-backed verification.</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => handleNavigate('/verify')}
              className="hover:text-slate-300 transition-colors"
            >
              Verify Certificate
            </button>
            <button
              onClick={() => handleNavigate('/issuer')}
              className="hover:text-slate-300 transition-colors"
            >
              Issuer Portal
            </button>
            <button
              onClick={() => handleNavigate('/issuer/settings')}
              className="hover:text-slate-300 transition-colors"
            >
              Smart Contract (Solidity)
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
