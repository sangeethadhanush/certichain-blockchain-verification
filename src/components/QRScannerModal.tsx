import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import { Camera, Upload, X, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (verificationId: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera'>('upload');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScanningFile, setIsScanningFile] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setErrorMsg(null);
    }
  }, [isOpen]);

  const stopCamera = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        scanCameraFrame();
      }
    } catch {
      setErrorMsg('Camera access unavailable. Please try uploading a QR image or select from sample credentials.');
    }
  };

  const scanCameraFrame = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      requestRef.current = requestAnimationFrame(scanCameraFrame);
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code) {
      handleDecodedContent(code.data);
      stopCamera();
      return;
    }

    requestRef.current = requestAnimationFrame(scanCameraFrame);
  };

  const handleDecodedContent = (rawText: string) => {
    // Check if URL with ?id=CERT-XXXX or /verify/CERT-XXXX or plain CERT-XXXX
    let match = rawText.match(/CERT-[A-F0-9]{8}/i);
    if (!match) {
      const urlMatch = rawText.match(/[?&]id=([^&#]+)/i);
      if (urlMatch) {
        match = [decodeURIComponent(urlMatch[1])];
      }
    }

    if (match && match[0]) {
      const id = match[0].toUpperCase();
      onScanSuccess(id);
      onClose();
    } else {
      setErrorMsg(`Decoded payload: "${rawText.slice(0, 60)}..." could not be mapped to a valid CertiChain Verification ID (format: CERT-XXXXXXXX).`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningFile(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsScanningFile(false);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        setIsScanningFile(false);
        if (code) {
          handleDecodedContent(code.data);
        } else {
          setErrorMsg('No QR code detected in this image. Ensure the image is crisp and well-lit.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-white">Scan Certificate QR</h3>
            <p className="text-xs text-slate-400 mt-0.5">Upload a credential QR code or point camera</p>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg my-4 border border-slate-800/80">
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('upload');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'upload'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload QR Image
          </button>
          <button
            onClick={() => {
              setActiveTab('camera');
              startCamera();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'camera'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            Live Camera
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800/50 rounded-lg text-xs text-rose-300 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {activeTab === 'upload' ? (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 bg-slate-950/60 rounded-xl p-8 text-center cursor-pointer transition-colors group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Upload className="w-8 h-8 text-slate-400 group-hover:text-cyan-400 mx-auto mb-3 transition-colors" />
              <p className="text-sm font-medium text-slate-200">
                {isScanningFile ? 'Scanning image...' : 'Click or drop QR code image here'}
              </p>
              <p className="text-xs text-slate-500 mt-1">PNG, JPG, WebP supported</p>
            </div>

            <div className="pt-2 border-t border-slate-800/60">
              <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Or quick-test with seeded blockchain credentials:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    onScanSuccess('CERT-7F4A92C1');
                    onClose();
                  }}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition-colors"
                >
                  <div className="font-mono text-cyan-400 text-xs font-semibold">CERT-7F4A92C1</div>
                  <div className="text-[11px] text-slate-400 truncate">Arun Kumar · Authentic</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onScanSuccess('CERT-B32D8190');
                    onClose();
                  }}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition-colors"
                >
                  <div className="font-mono text-amber-400 text-xs font-semibold">CERT-B32D8190</div>
                  <div className="text-[11px] text-slate-400 truncate">Elena Rostova · Revoked</div>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
              />
              <div className="absolute inset-8 border-2 border-cyan-400/80 rounded-lg pointer-events-none animate-pulse"></div>
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-900/90 text-center">
                  <Camera className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-300">Starting camera sensor...</p>
                </div>
              )}
            </div>
            <p className="text-xs text-center text-slate-400">
              Align the QR code inside the box to verify automatically
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
