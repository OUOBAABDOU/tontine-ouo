import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Key, 
  ShieldAlert, 
  CheckCircle, 
  Copy, 
  Check, 
  Sparkles, 
  Lock, 
  Unlock,
  AlertTriangle
} from 'lucide-react';
import { License, UserProfile } from '../types';
import { checkAndActivateLicense } from '../lib/firebase';

interface LicenseActivationScreenProps {
  userId: string;
  userName: string;
  onActivated: (license: License) => void;
  onBypassDemo: () => void;
}

export default function LicenseActivationScreen({
  userId,
  userName,
  onActivated,
  onBypassDemo
}: LicenseActivationScreenProps) {
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<License | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const demoKeys = [
    { key: 'LICENCE-FREE-2026', label: 'Gratuit ⭐', desc: 'Accès standard' },
    { key: 'LICENCE-PREMIUM-2026', label: 'Premium 🔥', desc: 'Tontines & Boutique illimitées' },
    { key: 'LICENCE-VIP-2026', label: 'VIP 👑', desc: 'Réseau social et avantages' }
  ];

  const handleCopyId = () => {
    navigator.clipboard.writeText(userId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyDemoKey = (key: string) => {
    setLicenseKey(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const activatedLic = await checkAndActivateLicense(licenseKey, userId, userName);
      setSuccess(activatedLic);
      
      // Delay transition for visual feedback
      setTimeout(() => {
        onActivated(activatedLic);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Erreur inattendue d'activation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-950 text-white flex flex-col justify-center items-center p-6 font-sans relative overflow-hidden">
      {/* Abstract Background Blobs */}
      <div className="absolute top-[-50px] left-[-50px] w-48 h-48 bg-[#0468D7]/15 rounded-full blur-3xl" />
      <div className="absolute bottom-[-50px] right-[-50px] w-48 h-48 bg-teal-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-sm space-y-6 z-10">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-tr from-[#0468D7] to-[#02569B] shadow-lg shadow-blue-500/20 mb-2">
            {success ? (
              <Unlock className="w-6 h-6 text-emerald-300 animate-bounce" />
            ) : (
              <Lock className="w-6 h-6 text-amber-300 animate-pulse" />
            )}
          </div>
          <h2 className="text-lg font-black tracking-tight text-white uppercase flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Assi Tontine & Market</span>
          </h2>
          <p className="text-[10px] text-slate-400 max-w-[280px] mx-auto leading-normal">
            Licence de sécurité requise. Veuillez activer l'application pour déverrouiller vos coffres et tontines.
          </p>
        </div>

        {/* Success Feedback overlay */}
        {success ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-5 bg-emerald-950/40 border border-emerald-500/30 rounded-3xl text-center space-y-3"
          >
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-xs font-black uppercase text-emerald-300">Licence Validée !</h3>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              La clé <strong className="font-mono text-white">{success.id}</strong> est active.<br />
              Niveau d'abonnement : <strong className="text-amber-400">{success.tier}</strong>
            </p>
            <p className="text-[9px] text-slate-400 animate-pulse">Initialisation du tableau de bord...</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            
            {/* Main form */}
            <form onSubmit={handleSubmit} className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-xl space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">
                  Clé de Licence
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="LICENCE-XXXX-XXXX"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-2.5 pl-10 pr-3 text-xs font-mono tracking-wider focus:outline-none focus:border-blue-500 text-white placeholder-slate-600"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-950/50 border border-rose-500/30 text-rose-300 rounded-xl text-[9px] leading-relaxed flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !licenseKey.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-[#02569B] hover:from-blue-500 hover:to-blue-700 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 font-extrabold text-[11px] py-3 rounded-2xl uppercase transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-98"
              >
                {loading ? 'Vérification en cours...' : 'Activer maintenant'}
              </button>
            </form>

            {/* Device Installation Identifier */}
            <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-2xl flex items-center justify-between text-[10px]">
              <div className="min-w-0 pr-2">
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wide">ID d'installation unique</p>
                <p className="font-mono text-slate-300 truncate text-[9px]">{userId}</p>
              </div>
              <button 
                type="button"
                onClick={handleCopyId}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 active:scale-90 transition-all shrink-0 flex items-center justify-center"
                title="Copier l'identifiant"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* DEMO LICENSES DRAWER */}
            <div className="p-4 bg-slate-900/60 border border-amber-500/10 rounded-3xl space-y-2">
              <div className="flex items-center gap-1 text-amber-400 text-[9px] font-black uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Clés de test pré-générées</span>
              </div>
              <p className="text-[8px] text-slate-400 leading-normal">
                Cliquez sur l'une des clés ci-dessous pour la charger automatiquement et tester l'activation en ligne :
              </p>

              <div className="space-y-1.5 pt-1">
                {demoKeys.map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleCopyDemoKey(item.key)}
                    className="w-full text-left p-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800/80 rounded-xl flex items-center justify-between transition-colors text-[9px]"
                  >
                    <div>
                      <div className="font-mono font-bold text-white tracking-wide">{item.key}</div>
                      <div className="text-[8px] text-slate-500 mt-0.5">{item.desc}</div>
                    </div>
                    <span className="text-[8px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-black">
                      {copiedKey === item.key ? 'Copié ! ✓' : item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Footer branding */}
        <div className="text-center text-[8px] text-slate-600">
          Coopérative de Solidarité Assi Tontine • Version 2.1.0 • Sécurisé par Firebase Cryptography
        </div>

      </div>
    </div>
  );
}
