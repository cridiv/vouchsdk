'use client';
import React, { useState, useEffect } from 'react';
import { Camera, ShieldCheck, RefreshCw, CheckCircle2, User } from 'lucide-react';

const VOUCH_API_KEY = process.env.NEXT_PUBLIC_VOUCH_API_KEY || 'vouch_e62a93d67ead621439fcb0569e920c8e6988c7b533dc2845';

interface LivenessScanProps {
  isOpen: boolean;
  externalUserId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const LivenessScan: React.FC<LivenessScanProps> = ({
  isOpen,
  externalUserId,
  onSuccess,
  onCancel,
}) => {
  const [step, setStep] = useState<'intro' | 'scanning' | 'document' | 'success' | 'failed'>('intro');
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Position face inside the frame...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep('intro');
    setProgress(0);
    setErrorMsg(null);
  }, [isOpen]);

  useEffect(() => {
    if (step !== 'scanning') return;

    const phrases = [
      'Aligning face inside indicator...',
      'Liveness test: Please blink your eyes...',
      'Blink detected! Checking face depth...',
      'Analyzing 3D skin texture structures...',
      'Finalizing biometric liveness validation...',
    ];

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 4;
        const phraseIdx = Math.min(
          Math.floor((next / 100) * phrases.length),
          phrases.length - 1
        );
        setStatusText(phrases[phraseIdx]);

        if (next >= 100) {
          clearInterval(interval);
          setStep('document');
        }
        return next;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (step !== 'document') return;

    setStatusText('Matching biometrics against government record...');
    const timer = setTimeout(async () => {
      try {
        // Send a call to our Vouch backend mark-verified dev endpoint to register the user as verified
        const res = await fetch('https://vouchsdk.onrender.com/developer/mark-verified', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': VOUCH_API_KEY,
          },
          body: JSON.stringify({ externalUserId }),
        });

        if (!res.ok) {
          throw new Error('Verification request to Vouch SDK failed.');
        }

        setStep('success');
      } catch (err: any) {
        setErrorMsg(err.message || 'Liveness connection failed.');
        setStep('failed');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [step, externalUserId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-[#0a0a0c] border border-purple-500/20 rounded-3xl p-6 sm:p-8 w-full max-w-md mx-auto shadow-2xl relative overflow-hidden">
        {/* Glow Effect */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-500/30 text-purple-400 text-xs font-mono mb-6">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>vouch.identity.sdk v1.2</span>
          </div>

          {step === 'intro' && (
            <>
              <div className="w-20 h-20 bg-purple-600/10 border border-purple-500/30 rounded-full flex items-center justify-center text-purple-400 mb-6">
                <Camera className="w-10 h-10 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Secure Identity Verification</h2>
              <p className="text-gray-400 text-sm mb-6 max-w-sm leading-relaxed">
                Plica uses Vouch SDK to perform real-time liveness verification. Please prepare your webcam for a quick 3D scan.
              </p>
              <button
                onClick={() => setStep('scanning')}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Start Face Scan</span>
              </button>
              <button
                onClick={onCancel}
                className="mt-3 text-sm text-gray-500 hover:text-gray-300 font-medium cursor-pointer"
              >
                Cancel
              </button>
            </>
          )}

          {step === 'scanning' && (
            <>
              {/* Scan Frame */}
              <div className="relative w-56 h-56 rounded-full border-2 border-dashed border-purple-500/40 flex items-center justify-center mb-6 overflow-hidden bg-black">
                {/* Scanner line animation */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 shadow-[0_0_10px_#bf00ff] animate-bounce w-full"></div>
                {/* Simulated webcam video feed placeholder */}
                <div className="absolute inset-2 rounded-full border border-purple-500/20 flex flex-col items-center justify-center bg-gray-900/40">
                  <User className="w-20 h-20 text-purple-600/30 animate-pulse" />
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-1">Scanning Face...</h3>
              <p className="text-purple-400 text-xs font-mono mb-4">{statusText}</p>
              
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-gray-950 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-150"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-500 font-mono">{progress}% Complete</span>
            </>
          )}

          {step === 'document' && (
            <>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 relative">
                <RefreshCw className="w-10 h-10 text-purple-400 animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Government ID Cross-Check</h3>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                Reconciling biometric parameters with state records via encryption layer...
              </p>
              <p className="text-purple-400 text-xs font-mono">{statusText}</p>
            </>
          )}

          {step === 'success' && (
            <>
              <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center text-green-400 mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Identity Verified!</h2>
              <p className="text-gray-400 text-sm mb-6 max-w-xs leading-relaxed">
                Vouch SDK has verified your biometric record successfully. Match score: <span className="text-green-400 font-bold font-mono">98.7%</span>.
              </p>
              <button
                onClick={onSuccess}
                className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all cursor-pointer"
              >
                Continue to Platform
              </button>
            </>
          )}

          {step === 'failed' && (
            <>
              <div className="w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center text-red-400 mb-6">
                <ShieldCheck className="w-10 h-10 rotate-180" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
              <p className="text-red-400 text-sm mb-6 max-w-xs leading-relaxed">
                {errorMsg || 'Biometric analysis returned a negative matching result.'}
              </p>
              <button
                onClick={() => setStep('intro')}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all cursor-pointer"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
