import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { Lock, Shield, LogOut, Check, AlertCircle, Fingerprint, ScanFace, X, RefreshCw } from 'lucide-react';

interface AppLockScreenProps {
  currentUser: UserProfile;
  onUnlock: () => void;
  onLogout: () => void;
}

type BiometricMethod = 'fingerprint' | 'face';

export default function AppLockScreen({ currentUser, onUnlock, onLogout }: AppLockScreenProps) {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [shake, setShake] = useState<boolean>(false);

  // Biometric state
  const [showBiometrics, setShowBiometrics] = useState<boolean>(false);
  const [bioMethod, setBioMethod] = useState<BiometricMethod>('fingerprint');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanSuccess, setScanSuccess] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string>('');
  const [faceStep, setFaceStep] = useState<'idle' | 'detecting' | 'analyzing' | 'success'>('idle');

  const userPin = currentUser.pinCode || '1234';
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleNumberClick = (num: string) => {
    setError('');
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      
      // Auto-validate once 4 digits are entered
      if (nextPin.length === 4) {
        if (nextPin === userPin) {
          onUnlock();
        } else {
          setTimeout(() => {
            setError('Code PIN incorrect. Veuillez réessayer.');
            setShake(true);
            setPin('');
            setTimeout(() => setShake(false), 500);
          }, 150);
        }
      }
    }
  };

  const handleDelete = () => {
    setError('');
    setPin(prev => prev.slice(0, -1));
  };

  // --- Biometric Authentication Handlers ---

  const handleOpenBiometrics = (method: BiometricMethod) => {
    setBioMethod(method);
    setShowBiometrics(true);
    setScanProgress(0);
    setScanSuccess(false);
    setScanError('');
    setIsScanning(false);
    setFaceStep('idle');

    if (method === 'face') {
      // Auto-trigger face ID scan
      triggerFaceScan();
    }
  };

  // 1. Fingerprint Scanning (Press & Hold simulation)
  const startFingerprintScan = () => {
    if (scanSuccess) return;
    setIsScanning(true);
    setScanError('');
    setScanProgress(0);

    holdIntervalRef.current = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
          handleBiometricSuccess();
          return 100;
        }
        return prev + 5; // Takes about 1.0s to fill (20 ticks of 50ms)
      });
    }, 50);
  };

  const stopFingerprintScan = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
    }
    if (!scanSuccess) {
      setIsScanning(false);
      setScanProgress(0);
      setScanError('Doigt retiré trop tôt. Maintenez le doigt sur le capteur.');
    }
  };

  // 2. Face ID Scanning simulation
  const triggerFaceScan = () => {
    setIsScanning(true);
    setFaceStep('detecting');
    setScanError('');
    setScanProgress(20);

    // Timeline of Face ID simulation
    setTimeout(() => {
      setFaceStep('analyzing');
      setScanProgress(60);
    }, 850);

    setTimeout(() => {
      setFaceStep('success');
      setScanProgress(100);
      handleBiometricSuccess();
    }, 1800);
  };

  const handleBiometricSuccess = () => {
    setScanSuccess(true);
    setIsScanning(false);
    
    // Simulate real biometric success callback with unlock
    setTimeout(() => {
      onUnlock();
    }, 800);
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col justify-between bg-gradient-to-b from-slate-900 to-slate-950 text-white p-6 rounded-3xl min-h-[520px] select-none relative overflow-hidden">
      
      {/* ----------------- Standard PIN Lock View ----------------- */}
      {!showBiometrics ? (
        <>
          {/* Header Info */}
          <div className="text-center mt-4 space-y-3">
            <div className="inline-flex items-center justify-center p-3 bg-[#0175C2]/20 rounded-full mb-1 text-[#0175C2] border border-[#0175C2]/30 ring-4 ring-[#0175C2]/5">
              <Shield className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#0175C2]">Accès Sécurisé</h2>
              <p className="text-[11px] text-slate-400 font-medium">Heureux de vous revoir,</p>
              <div className="flex items-center justify-center gap-1.5 bg-slate-800/50 py-1 px-2.5 rounded-full max-w-[180px] mx-auto border border-slate-700/40">
                <img 
                  src={currentUser.avatar} 
                  alt="" 
                  className="w-4 h-4 rounded-full object-cover ring-1 ring-[#0175C2]" 
                />
                <span className="text-[10px] font-bold text-slate-200 truncate">{currentUser.name}</span>
              </div>
            </div>
          </div>

          {/* PIN Dots Area */}
          <div className="my-4 text-center space-y-3">
            <p className="text-[10px] text-slate-400 font-medium">
              Saisissez votre code PIN (4 chiffres) ou utilisez la biométrie :
            </p>
            
            <div 
              className={`flex justify-center gap-4 my-3 transition-transform duration-200 ${shake ? 'animate-bounce' : ''}`}
              style={shake ? { animation: 'shake 0.4s ease-in-out' } : undefined}
            >
              {[0, 1, 2, 3].map((index) => {
                const hasValue = pin.length > index;
                return (
                  <div 
                    key={index} 
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                      hasValue 
                        ? 'bg-[#0175C2] border-[#0175C2] scale-110 shadow-lg shadow-[#0175C2]/40' 
                        : 'border-slate-600 bg-transparent'
                    }`}
                  />
                );
              })}
            </div>

            {error ? (
              <div className="text-[9px] text-rose-400 font-bold flex items-center justify-center gap-1 bg-rose-950/30 py-1 px-2.5 rounded-lg border border-rose-900/30 max-w-[220px] mx-auto">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{error}</span>
              </div>
            ) : (
              <div className="text-[9px] text-slate-500 font-semibold flex items-center justify-center gap-1">
                <Lock className="w-3 h-3 text-slate-600" />
                <span>Double authentification et chiffrement actif</span>
              </div>
            )}
          </div>

          {/* Quick Biometrics Shortcut Bar */}
          <div className="flex justify-center gap-3 mb-2">
            <button
              type="button"
              onClick={() => handleOpenBiometrics('fingerprint')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 hover:bg-slate-800 rounded-xl text-[10px] font-bold text-[#0175C2] border border-slate-700/40 transition-colors"
            >
              <Fingerprint className="w-3.5 h-3.5 text-[#0175C2]" />
              <span>Empreinte</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenBiometrics('face')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 hover:bg-slate-800 rounded-xl text-[10px] font-bold text-[#0175C2] border border-slate-700/40 transition-colors"
            >
              <ScanFace className="w-3.5 h-3.5 text-[#0175C2]" />
              <span>Face ID</span>
            </button>
          </div>

          {/* Circular Numeric Keypad */}
          <div className="max-w-[260px] mx-auto w-full space-y-2">
            <div className="grid grid-cols-3 gap-2.5 justify-items-center">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  id={`lock-key-${num}`}
                  onClick={() => handleNumberClick(num)}
                  className="w-12.5 h-12.5 rounded-full bg-slate-800 hover:bg-slate-700 active:bg-[#0175C2] text-base font-black transition-all flex items-center justify-center border border-slate-700/50 active:border-[#0175C2] hover:scale-105 active:scale-95"
                >
                  {num}
                </button>
              ))}
              
              {/* Back Button / Delete */}
              <button
                type="button"
                id="lock-key-back"
                onClick={handleDelete}
                className="w-12.5 h-12.5 rounded-full bg-slate-900/40 hover:bg-slate-800 text-[10px] font-bold transition-all flex items-center justify-center text-slate-400 active:text-white"
              >
                Effacer
              </button>

              {/* Zero key */}
              <button
                type="button"
                id="lock-key-0"
                onClick={() => handleNumberClick('0')}
                className="w-12.5 h-12.5 rounded-full bg-slate-800 hover:bg-slate-700 active:bg-[#0175C2] text-base font-black transition-all flex items-center justify-center border border-slate-700/50 active:border-[#0175C2] hover:scale-105 active:scale-95"
              >
                0
              </button>

              {/* Unlock Indicator or Biometrics toggle trigger */}
              <button
                type="button"
                id="lock-key-bio"
                onClick={() => handleOpenBiometrics('fingerprint')}
                className="w-12.5 h-12.5 rounded-full bg-[#0175C2]/10 hover:bg-[#0175C2]/25 border border-[#0175C2]/30 active:scale-95 text-[#0175C2] flex items-center justify-center transition-all"
                title="Connexion Biométrique"
              >
                <Fingerprint className="w-5 h-5 animate-pulse" />
              </button>
            </div>
          </div>
        </>
      ) : (
        /* ----------------- Active Biometric Verification Overlay/View ----------------- */
        <div className="flex-1 flex flex-col justify-between py-4 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#0175C2]" />
              <span className="text-[10px] font-black tracking-wider uppercase text-slate-400">Authentification Biométrique</span>
            </div>
            <button
              onClick={() => setShowBiometrics(false)}
              className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Toggle between methods */}
          <div className="flex bg-slate-850 p-1 rounded-xl gap-1.5 border border-slate-800/80 my-3">
            <button
              type="button"
              onClick={() => handleOpenBiometrics('fingerprint')}
              className={`flex-1 py-1.5 rounded-lg text-center text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                bioMethod === 'fingerprint' 
                  ? 'bg-[#0175C2] text-white shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>Empreinte digitale</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenBiometrics('face')}
              className={`flex-1 py-1.5 rounded-lg text-center text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                bioMethod === 'face' 
                  ? 'bg-[#0175C2] text-white shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ScanFace className="w-3.5 h-3.5" />
              <span>Reconnaissance faciale</span>
            </button>
          </div>

          {/* Core Scanner Simulation Screen */}
          <div className="flex-1 flex flex-col items-center justify-center my-6 space-y-4">
            {bioMethod === 'fingerprint' ? (
              /* FINGERPRINT INTERACTION ZONE */
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  {/* Circular outer progress bar */}
                  <svg className="w-28 h-28 transform -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      className="stroke-slate-800"
                      strokeWidth="4"
                      fill="transparent"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      className="stroke-[#0175C2] transition-all duration-75"
                      strokeWidth="5"
                      strokeDasharray={2 * Math.PI * 48}
                      strokeDashoffset={2 * Math.PI * 48 * (1 - scanProgress / 100)}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  
                  {/* Fingerprint Active Button */}
                  <button
                    type="button"
                    onMouseDown={startFingerprintScan}
                    onMouseUp={stopFingerprintScan}
                    onMouseLeave={stopFingerprintScan}
                    onTouchStart={startFingerprintScan}
                    onTouchEnd={stopFingerprintScan}
                    className={`absolute top-4 left-4 w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all ${
                      scanSuccess 
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 scale-105 shadow-lg shadow-emerald-500/20' 
                        : isScanning 
                          ? 'bg-[#0175C2]/30 border-[#0175C2] text-white scale-95 shadow-inner' 
                          : 'bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-[#0175C2]'
                    }`}
                  >
                    {scanSuccess ? (
                      <Check className="w-10 h-10 animate-bounce" />
                    ) : (
                      <Fingerprint className={`w-10 h-10 ${isScanning ? 'animate-pulse' : ''}`} />
                    )}
                  </button>
                </div>

                <div className="text-center max-w-[240px] mx-auto">
                  <p className="text-xs font-black tracking-wide">
                    {scanSuccess ? (
                      <span className="text-emerald-400">Empreinte validée !</span>
                    ) : isScanning ? (
                      <span className="text-blue-400 animate-pulse">Analyse en cours... {scanProgress}%</span>
                    ) : (
                      <span className="text-slate-200">Maintenez le doigt appuyé</span>
                    )}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                    {scanSuccess 
                      ? 'Déverrouillage de la tontine solidaire...' 
                      : isScanning 
                        ? 'Ne relâchez pas le capteur d\'empreinte.' 
                        : 'Touchez et laissez le doigt posé sur le capteur pour simuler la reconnaissance.'}
                  </p>
                </div>
              </div>
            ) : (
              /* FACE ID SCANNING ZONE */
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  {/* Scanning box frame corners */}
                  <div className={`absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 rounded-tl-lg transition-colors duration-300 ${
                    faceStep === 'success' ? 'border-emerald-500' : faceStep === 'analyzing' ? 'border-[#0175C2]' : 'border-yellow-500'
                  }`} />
                  <div className={`absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 rounded-tr-lg transition-colors duration-300 ${
                    faceStep === 'success' ? 'border-emerald-500' : faceStep === 'analyzing' ? 'border-[#0175C2]' : 'border-yellow-500'
                  }`} />
                  <div className={`absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 rounded-bl-lg transition-colors duration-300 ${
                    faceStep === 'success' ? 'border-emerald-500' : faceStep === 'analyzing' ? 'border-[#0175C2]' : 'border-yellow-500'
                  }`} />
                  <div className={`absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 rounded-br-lg transition-colors duration-300 ${
                    faceStep === 'success' ? 'border-emerald-500' : faceStep === 'analyzing' ? 'border-[#0175C2]' : 'border-yellow-500'
                  }`} />

                  {/* Horizontal animated scanning laser line */}
                  {isScanning && faceStep !== 'success' && (
                    <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-[#0175C2] to-transparent animate-laser-scanner shadow-md shadow-[#0175C2]/40 z-10" />
                  )}

                  {/* Center face visual */}
                  <div className={`w-24 h-24 rounded-2xl flex items-center justify-center transition-all ${
                    faceStep === 'success' 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : faceStep === 'analyzing' 
                        ? 'bg-[#0175C2]/10 text-blue-400' 
                        : 'bg-slate-800 text-slate-400'
                  }`}>
                    {faceStep === 'success' ? (
                      <Check className="w-12 h-12 scale-110" />
                    ) : (
                      <ScanFace className={`w-12 h-12 ${faceStep !== 'idle' && faceStep !== 'success' ? 'animate-pulse' : ''}`} />
                    )}
                  </div>
                </div>

                <div className="text-center max-w-[240px] mx-auto">
                  <p className="text-xs font-black tracking-wide">
                    {faceStep === 'detecting' && <span className="text-yellow-400 animate-pulse">Recherche du visage...</span>}
                    {faceStep === 'analyzing' && <span className="text-blue-400 animate-pulse">Analyse de la biométrie faciale...</span>}
                    {faceStep === 'success' && <span className="text-emerald-400">Visage reconnu avec succès !</span>}
                    {faceStep === 'idle' && <span className="text-slate-400">Prêt pour l'analyse</span>}
                  </p>
                  
                  {faceStep !== 'success' && (
                    <button
                      type="button"
                      onClick={triggerFaceScan}
                      disabled={isScanning}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700/80 text-[10px] font-bold text-slate-300 rounded-lg border border-slate-700/60 active:scale-95 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
                      <span>Scanner à nouveau</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {scanError && (
              <div className="mx-auto max-w-[250px] p-2 bg-rose-950/20 border border-rose-900/30 text-rose-300 rounded-xl text-[9px] font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                <span>{scanError}</span>
              </div>
            )}
          </div>

          {/* Back button to PIN code */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setShowBiometrics(false)}
              className="text-[10px] font-black uppercase tracking-wider text-[#0175C2] hover:underline"
            >
              ⌨️ Saisir le Code PIN à la place
            </button>
          </div>
        </div>
      )}

      {/* Logout / Switch User */}
      <div className="mt-4 text-center border-t border-slate-800/40 pt-3">
        <button
          type="button"
          id="lock-btn-logout"
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-bold py-1 px-3 rounded-xl hover:bg-rose-950/20 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Quitter la session / Changer de compte</span>
        </button>
      </div>

      {/* Embedded CSS for animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        @keyframes laser {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 100%; opacity: 0.8; }
          100% { top: 0%; opacity: 0.8; }
        }
        .animate-laser-scanner {
          animation: laser 1.8s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
