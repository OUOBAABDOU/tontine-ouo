import React, { useState } from 'react';
import { 
  Award, 
  ShoppingCart, 
  Users, 
  MessageCircle, 
  ShieldAlert, 
  ArrowRight, 
  Gift, 
  CheckCircle,
  Sparkles,
  TrendingUp,
  Coins,
  UserCheck,
  UserX,
  FileText,
  PlusCircle,
  Search,
  Share2,
  Check,
  X,
  Activity,
  ArrowUpRight,
  Shield,
  HelpCircle,
  Clock,
  Briefcase,
  Copy,
  Trash2
} from 'lucide-react';
import { UserProfile, Tontine, Member, SubscriptionTier, UserRole, License } from '../types';
import { syncLicenses, createNewLicense, deleteLicense, revokeLicense } from '../lib/firebase';

interface SystemLog {
  id: string;
  type: string;
  userId: string;
  userName: string;
  userAvatar: string;
  description: string;
  timestamp: string;
}

interface DashboardScreenProps {
  currentUser: UserProfile;
  tontines: Tontine[];
  setTontines?: (value: Tontine[] | ((prev: Tontine[]) => Tontine[])) => void;
  members?: Member[];
  setMembers?: (value: Member[] | ((prev: Member[]) => Member[])) => void;
  systemLogs?: SystemLog[];
  addSystemLog?: (
    type: 'creation_compte' | 'validation_compte' | 'creation_tontine' | 'cotisation' | 'retrait_wallet' | 'changement_role' | 'rejet_compte' | 'divers',
    userId: string,
    userName: string,
    userAvatar: string,
    description: string
  ) => void;
  triggerNotification?: (
    type: 'tontine' | 'chat' | 'transaction' | 'alert',
    title: string,
    message: string,
    linkToTab?: string
  ) => void;
  addTransaction?: (
    type: 'Recharge' | 'Paiement Tontine' | 'Achat Boutique' | 'Réception Tontine' | 'Bonus Parrainage',
    amount: number,
    description: string
  ) => void;
  setActiveTab: (tab: string) => void;
  setBoutiqueCategory?: (cat: 'Kits Alimentaires' | 'Produits Individuels') => void;
}

export default function DashboardScreen({ 
  currentUser, 
  tontines, 
  setTontines,
  members = [],
  setMembers,
  systemLogs = [],
  addSystemLog,
  triggerNotification,
  addTransaction,
  setActiveTab,
  setBoutiqueCategory
}: DashboardScreenProps) {
  
  // Tab within Dashboard for Admin view
  const [adminSection, setAdminSection] = useState<'pending' | 'logs' | 'members' | 'licenses'>('pending');
  const [logFilter, setLogFilter] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  
  // Licenses state & generation form
  const [licenses, setLicenses] = useState<License[]>([]);
  const [newLicenseKey, setNewLicenseKey] = useState('');
  const [newLicenseTier, setNewLicenseTier] = useState<SubscriptionTier>('Premium');
  const [licenseGenSuccess, setLicenseGenSuccess] = useState(false);
  const [licenseGenError, setLicenseGenError] = useState<string | null>(null);

  // Role upgrade state
  const [requestedUpgrade, setRequestedUpgrade] = useState<UserRole>('Admin');
  const [upgradeMotivation, setUpgradeMotivation] = useState('');
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  const isAdmin = currentUser.role === 'Admin' || currentUser.role === 'Super Admin';

  // Subscribe to licenses updates
  React.useEffect(() => {
    if (isAdmin) {
      const unsub = syncLicenses((list) => {
        setLicenses(list);
      });
      return () => unsub();
    }
  }, [isAdmin]);

  // Generate random license helper
  const handleRandomizeKey = () => {
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randomHex2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    setNewLicenseKey(`LICENCE-${randomHex}-${randomHex2}`);
    setLicenseGenError(null);
  };

  const handleGenerateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLicenseKey.trim()) return;

    setLicenseGenError(null);
    setLicenseGenSuccess(false);

    try {
      const formattedKey = newLicenseKey.trim().toUpperCase();
      await createNewLicense({
        id: formattedKey,
        status: 'unused',
        tier: newLicenseTier
      });
      setLicenseGenSuccess(true);
      setNewLicenseKey('');
      if (addSystemLog) {
        addSystemLog(
          'divers',
          currentUser.id,
          currentUser.name,
          currentUser.avatar,
          `Nouvelle clé de licence créée : ${formattedKey} (Abonnement : ${newLicenseTier})`
        );
      }
      setTimeout(() => setLicenseGenSuccess(false), 3000);
    } catch (err: any) {
      setLicenseGenError(err instanceof Error ? err.message : "Erreur de génération.");
    }
  };

  // Stats
  const pendingMembers = members.filter(m => m.status === 'En attente');
  const activeTontinesUser = tontines.filter(t => 
    t.participants.some(p => p.memberId === currentUser.id || p.memberId === 'user_current')
  );

  const unpaidTontinesCount = tontines.filter(t => {
    const p = t.participants.find(p => p.memberId === currentUser.id || p.memberId === 'user_current');
    return t.status === 'En Cours' && p && !p.hasPaidThisRound;
  }).length;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentUser.referralCode || 'ASSI-MAMAN');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Administration actions
  const handleApproveMember = (memberId: string) => {
    if (!setMembers) return;
    
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        return { ...m, status: 'Validé', role: m.requestedRole || m.role || 'Membre' };
      }
      return m;
    }));

    const target = members.find(m => m.id === memberId);
    if (target) {
      if (addSystemLog) {
        addSystemLog(
          'validation_compte',
          memberId,
          target.name,
          target.avatar,
          `Inscription validée en tant que ${target.requestedRole || 'Membre'} par l'admin ${currentUser.name}`
        );
      }
      if (triggerNotification) {
        triggerNotification(
          'alert',
          '✅ Inscription Validée',
          `Le compte de ${target.name} a été officiellement approuvé par l'administration.`,
          'community'
        );
      }
    }
  };

  const handleRejectMember = (memberId: string) => {
    if (!setMembers) return;
    
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        return { ...m, status: 'Rejeté' };
      }
      return m;
    }));

    const target = members.find(m => m.id === memberId);
    if (target) {
      if (addSystemLog) {
        addSystemLog(
          'rejet_compte',
          memberId,
          target.name,
          target.avatar,
          `Demande d'inscription rejetée par l'admin ${currentUser.name}`
        );
      }
    }
  };

  const handleRoleUpgradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upgradeMotivation.trim()) return;

    if (setMembers) {
      setMembers(prev => prev.map(m => {
        if (m.id === currentUser.id || m.id === 'user_current') {
          return { ...m, requestedRole: requestedUpgrade };
        }
        return m;
      }));
    }

    if (addSystemLog) {
      addSystemLog(
        'changement_role',
        currentUser.id,
        currentUser.name,
        currentUser.avatar,
        `Demande d'évolution vers le rôle de ${requestedUpgrade} soumise.`
      );
    }

    setUpgradeSuccess(true);
    setUpgradeMotivation('');
    setTimeout(() => setUpgradeSuccess(false), 4000);
  };

  // Find users who used this user's referral code
  const referredMoms = members.filter(m => m.id !== currentUser.id && m.id !== 'user_current');

  return (
    <div className="space-y-4 animate-fade-in text-slate-800">
      
      {/* WELCOME BANNER (Vibrant Blue Flutter Theme) */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#0468D7] to-[#02569B] text-white relative overflow-hidden shadow-md shadow-blue-900/10">
        <div className="absolute right-[-10px] top-[-10px] w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-4 bottom-2 opacity-10 w-16 h-16 pointer-events-none">
          <svg viewBox="0 0 100 100" fill="white">
            <path d="M50 0 L100 50 L50 100 L0 50 Z" />
          </svg>
        </div>
        
        <div className="flex items-center gap-1.5 text-[#40D1FF] text-[10px] font-bold tracking-wider uppercase mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Espace Coopérative Solidaire</span>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black tracking-tight">
            Bonjour, {currentUser.name} !
          </h2>
          <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
            currentUser.role === 'Super Admin' 
              ? 'bg-amber-400 text-slate-950 border border-amber-300' 
              : currentUser.role === 'Admin'
              ? 'bg-purple-500 text-white border border-purple-400'
              : 'bg-white/20 text-white'
          }`}>
            👑 {currentUser.role}
          </span>
        </div>
        <p className="text-xs text-blue-100 mt-1 leading-relaxed">
          Bienvenue sur votre tableau de bord interactif. {isAdmin ? 'Vous contrôlez l\'ensemble des caisses.' : 'Vos comptes sont synchronisés en temps réel.'}
        </p>

        {/* Dynamic warning if any tontine payment is due */}
        {unpaidTontinesCount > 0 ? (
          <div className="mt-3.5 flex items-center gap-2 p-2.5 bg-white/15 border border-white/10 backdrop-blur-sm rounded-xl text-white text-[11px]">
            <ShieldAlert className="w-4 h-4 shrink-0 text-[#40D1FF]" />
            <div className="flex-1">
              Vous avez <span className="font-bold">{unpaidTontinesCount} cotisation(s)</span> en attente de paiement.
            </div>
            <button 
              onClick={() => setActiveTab('tontines')} 
              className="text-[10px] font-bold underline text-[#40D1FF] hover:text-[#40D1FF]/80 flex items-center"
            >
              Régler <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        ) : (
          <div className="mt-3.5 flex items-center gap-2 p-2.5 bg-white/15 border border-white/10 backdrop-blur-sm rounded-xl text-white text-[11px]">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-300" />
            <div className="flex-1">
              Toutes vos cotisations pour ce round sont à jour. Félicitations !
            </div>
          </div>
        )}
      </div>

      {/* CORE STATS CARD ROW */}
      <div className="grid grid-cols-2 gap-3">
        {/* Wallet Balance Widget */}
        <div 
          onClick={() => setActiveTab('wallet')}
          className="p-4 bg-white border border-slate-100 rounded-3xl cursor-pointer hover:shadow-md hover:border-slate-200/60 transition-all flex flex-col justify-between shadow-sm"
        >
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            <span>Solde Disponible</span>
            <span className="text-[9px] text-slate-400">FCFA</span>
          </div>
          <div className="mt-2 text-lg font-extrabold text-[#02569B] tracking-tight truncate">
            {currentUser.walletBalance.toLocaleString('fr-FR')} F
          </div>
          <div className="text-[9px] text-[#0175C2] font-semibold mt-2 flex items-center">
            Recharger & Retirer
            <ArrowRight className="w-2.5 h-2.5 ml-1" />
          </div>
        </div>

        {/* Reliability Score Widget */}
        <div 
          onClick={() => setActiveTab('community')}
          className="p-4 bg-white border border-slate-100 rounded-3xl cursor-pointer hover:shadow-md hover:border-slate-200/60 transition-all flex flex-col justify-between shadow-sm"
        >
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            <span>Indice de Fiabilité</span>
            <span className="text-[9px] text-[#0175C2] font-bold">RÉEL</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-lg font-extrabold text-emerald-600 tracking-tight">
              {currentUser.reliabilityScore}%
            </span>
            <span className="text-[9px] text-emerald-500 font-semibold">Excellent</span>
          </div>
          <div className="text-[9px] text-[#0175C2] font-semibold mt-2 flex items-center">
            Voir le réseau social
          </div>
        </div>
      </div>

      {/* ADMIN CONSOLE SPOTLIGHT (For Administrators and Super Admins) */}
      {isAdmin && (
        <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              <span>Console d'Administration Globale</span>
            </h3>
            <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-bold">
              {members.length} utilisateurs
            </span>
          </div>

          {/* Admin Navigation tabs */}
          <div className="flex gap-1 p-0.5 bg-slate-800 rounded-xl text-[9px] font-bold">
            <button
              onClick={() => setAdminSection('pending')}
              className={`flex-1 py-1.5 rounded-lg text-center whitespace-nowrap px-1 ${
                adminSection === 'pending' ? 'bg-[#0175C2] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚠️ Attentes ({pendingMembers.length})
            </button>
            <button
              onClick={() => setAdminSection('logs')}
              className={`flex-1 py-1.5 rounded-lg text-center whitespace-nowrap px-1 ${
                adminSection === 'logs' ? 'bg-[#0175C2] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              📑 Audit
            </button>
            <button
              onClick={() => setAdminSection('members')}
              className={`flex-1 py-1.5 rounded-lg text-center whitespace-nowrap px-1 ${
                adminSection === 'members' ? 'bg-[#0175C2] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              👥 Membres
            </button>
            <button
              onClick={() => setAdminSection('licenses')}
              className={`flex-1 py-1.5 rounded-lg text-center whitespace-nowrap px-1 ${
                adminSection === 'licenses' ? 'bg-[#0175C2] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              🔑 Licences ({licenses.length})
            </button>
          </div>

          {/* Admin sub-section: PENDING REGISTRATIONS */}
          {adminSection === 'pending' && (
            <div className="space-y-2">
              {pendingMembers.length === 0 ? (
                <div className="p-4 text-center bg-slate-800/50 rounded-2xl text-slate-400 text-[10px]">
                  Aucun compte en attente de validation pour le moment. ✨
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {pendingMembers.map(m => (
                    <div key={m.id} className="p-2.5 bg-slate-800 rounded-2xl border border-slate-700/60 flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2">
                        <img src={m.avatar || undefined} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-700" />
                        <div>
                          <p className="font-extrabold text-[11px] text-white">{m.name}</p>
                          <p className="text-[8px] text-slate-400 leading-none">Tel : {m.phone || 'N/A'}</p>
                          <p className="text-[7px] text-[#0175C2] font-black uppercase mt-0.5">Demande : {m.requestedRole || 'Membre'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleApproveMember(m.id)}
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white transition-colors active:scale-90 flex items-center justify-center"
                          title="Valider l'adhésion"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRejectMember(m.id)}
                          className="p-1.5 bg-rose-600 hover:bg-rose-500 rounded-xl text-white transition-colors active:scale-90 flex items-center justify-center"
                          title="Refuser"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Admin sub-section: SEARCHABLE TRACEABILITY LOGS */}
          {adminSection === 'logs' && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrer les actions (ex: Marie, validation...)"
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-1.5 pl-7 pr-3 text-[10px] focus:outline-none focus:border-[#0175C2] text-white"
                />
              </div>

              <div className="space-y-1.5 max-h-[180px] overflow-y-auto text-[10px] pr-1">
                {systemLogs
                  .filter(log => {
                    const searchStr = `${log.userName} ${log.description} ${log.type}`.toLowerCase();
                    return searchStr.includes(logFilter.toLowerCase());
                  })
                  .slice(0, 30)
                  .map(log => {
                    const isSystem = log.type === 'validation_compte' || log.type === 'creation_tontine';
                    return (
                      <div key={log.id} className="p-2 bg-slate-800/80 rounded-xl border border-slate-700/40 flex items-start gap-2">
                        <img src={log.userAvatar || undefined} alt="" className="w-6 h-6 rounded-full object-cover border border-slate-700 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] text-slate-300 font-semibold leading-normal">
                            <strong className="text-white">{log.userName}</strong> • {log.description}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 text-[7px] text-slate-400">
                            <span className={`px-1 rounded font-bold uppercase ${
                              isSystem ? 'bg-amber-400/20 text-amber-300' : 'bg-blue-400/20 text-blue-300'
                            }`}>
                              {log.type}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-2 h-2" />
                              {log.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Admin sub-section: ALL REGISTERED ACCOUNTS */}
          {adminSection === 'members' && (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {members.map(m => {
                const isApproved = m.status === 'Validé';
                const isRejected = m.status === 'Rejeté';
                return (
                  <div key={m.id} className="p-2 bg-slate-800 rounded-xl border border-slate-700/40 flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2">
                      <img src={m.avatar || undefined} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-extrabold text-[11px] text-white truncate max-w-[120px]">{m.name}</p>
                        <p className="text-[8px] text-slate-400 leading-none">PIN: {m.pinCode || '1234'} • {m.phone || 'Pas de numéro'}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`px-1.5 py-0.2 rounded text-[7px] font-black uppercase inline-block ${
                        isApproved ? 'bg-emerald-500/20 text-emerald-300' : isRejected ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {m.status || 'En attente'}
                      </span>
                      <p className="text-[7px] text-slate-400 font-bold mt-0.5">{m.role || 'Membre'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Admin sub-section: LICENSES MANAGEMENT */}
          {adminSection === 'licenses' && (
            <div className="space-y-3">
              {/* Generation Form */}
              <form onSubmit={handleGenerateLicense} className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/40 space-y-2">
                <p className="text-[9px] font-black uppercase text-amber-400 tracking-wider">Créer une Clé de Licence</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[7px] font-bold text-slate-400 uppercase mb-0.5">Clé / Code</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        required
                        placeholder="LICENCE-ABCD"
                        value={newLicenseKey}
                        onChange={(e) => setNewLicenseKey(e.target.value.toUpperCase())}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-[10px] text-white font-mono focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleRandomizeKey}
                        className="px-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-[9px] font-bold text-slate-200 transition-colors"
                        title="Générer aléatoirement"
                      >
                        Auto
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[7px] font-bold text-slate-400 uppercase mb-0.5">Niveau</label>
                    <select
                      value={newLicenseTier}
                      onChange={(e) => setNewLicenseTier(e.target.value as SubscriptionTier)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-[10px] text-white focus:outline-none font-bold"
                    >
                      <option value="Gratuit">Gratuit ⭐</option>
                      <option value="Premium">Premium 🔥</option>
                      <option value="VIP">VIP 👑</option>
                    </select>
                  </div>
                </div>

                {licenseGenError && (
                  <p className="text-[8px] text-rose-400 font-bold leading-tight">{licenseGenError}</p>
                )}
                {licenseGenSuccess && (
                  <p className="text-[8px] text-emerald-400 font-bold leading-tight">Clé générée et enregistrée avec succès ! ✓</p>
                )}

                <button
                  type="submit"
                  disabled={!newLicenseKey.trim()}
                  className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-black text-[9px] py-1.5 rounded-lg uppercase transition-colors"
                >
                  Enregistrer dans Firestore
                </button>
              </form>

              {/* List of Licences */}
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {licenses.length === 0 ? (
                  <div className="p-3 text-center bg-slate-800/40 rounded-xl text-slate-400 text-[9px]">
                    Aucune clé de licence configurée dans Firestore.
                  </div>
                ) : (
                  licenses.map(lic => {
                    const isActive = lic.status === 'active';
                    return (
                      <div key={lic.id} className="p-2 bg-slate-800/80 rounded-xl border border-slate-700/40 flex items-center justify-between gap-2 text-[10px]">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-white tracking-wide">{lic.id}</span>
                            <span className={`px-1 py-0.2 rounded text-[7px] font-bold ${
                              lic.tier === 'VIP' ? 'bg-amber-400/20 text-amber-300' : lic.tier === 'Premium' ? 'bg-purple-400/20 text-purple-300' : 'bg-slate-700 text-slate-300'
                            }`}>
                              {lic.tier}
                            </span>
                          </div>
                          {isActive ? (
                            <p className="text-[7.5px] text-slate-400 mt-0.5 leading-tight truncate">
                              Activé par : <strong className="text-slate-300">{lic.activatedByName || 'Inconnu'}</strong> ({lic.activatedAt?.split('T')[0]})
                            </p>
                          ) : (
                            <p className="text-[7.5px] text-emerald-400 mt-0.5 leading-tight font-semibold">
                              ✓ Prêt pour activation
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(lic.id);
                            }}
                            className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
                            title="Copier la clé"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          {isActive && (
                            <button
                              onClick={async () => {
                                if (confirm(`Êtes-vous sûr de vouloir révoquer la licence ${lic.id} ? L'accès de l'utilisateur concerné sera immédiatement désactivé.`)) {
                                  try {
                                    await revokeLicense(lic.id);
                                  } catch (err: any) {
                                    alert("Erreur lors de la révocation : " + err.message);
                                  }
                                }
                              }}
                              className="p-1 bg-amber-500/20 hover:bg-amber-500/40 rounded text-amber-300 transition-colors"
                              title="Révoquer la licence pour cet appareil"
                            >
                              <UserX className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement la licence ${lic.id} de la base de données ?`)) {
                                try {
                                  await deleteLicense(lic.id);
                                } catch (err: any) {
                                  alert("Erreur lors de la suppression : " + err.message);
                                }
                              }
                            }}
                            className="p-1 bg-rose-500/10 hover:bg-rose-500/20 rounded text-rose-400 transition-colors"
                            title="Supprimer la licence"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <span className={`px-1 py-0.5 rounded text-[7px] font-black uppercase ${
                            isActive ? 'bg-slate-700 text-slate-400' : 'bg-emerald-500/20 text-emerald-400 animate-pulse'
                          }`}>
                            {isActive ? 'Utilisé' : 'Libre'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* QUICK LAUNCH SERVICES GRID */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Services principaux</h3>
        <div className="grid grid-cols-2 gap-3">
          
          {/* Card Tontines */}
          <button 
            onClick={() => setActiveTab('tontines')}
            className="p-4 bg-white hover:bg-slate-50/50 rounded-3xl border border-slate-100 text-left transition-all hover:shadow-md active:scale-97 group shadow-sm"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#02569B]/10 flex items-center justify-center text-[#02569B] mb-3 group-hover:scale-105 transition-transform">
              <Award className="w-5.5 h-5.5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 leading-tight">Tontines</h4>
            <p className="text-[10px] text-slate-500 mt-1 leading-snug">Gérer les caisses d'argent & paniers repas</p>
          </button>

          {/* Card Boutique */}
          <button 
            onClick={() => {
              if (setBoutiqueCategory) setBoutiqueCategory('Kits Alimentaires');
              setActiveTab('boutique');
            }}
            className="p-4 bg-white hover:bg-slate-50/50 rounded-3xl border border-slate-100 text-left transition-all hover:shadow-md active:scale-97 group shadow-sm"
          >
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 mb-3 group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-5.5 h-5.5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 leading-tight">Boutique</h4>
            <p className="text-[10px] text-slate-500 mt-1 leading-snug">Acheter des kits alimentaires et produits</p>
          </button>

          {/* Card Mamans Fiables */}
          <button 
            onClick={() => setActiveTab('community')}
            className="p-4 bg-white hover:bg-slate-50/50 rounded-3xl border border-slate-100 text-left transition-all hover:shadow-md active:scale-97 group shadow-sm"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-105 transition-transform">
              <Users className="w-5.5 h-5.5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 leading-tight">Mamans Fiables</h4>
            <p className="text-[10px] text-slate-500 mt-1 leading-snug">Réseau social privé de confiance</p>
          </button>

          {/* Card Chat */}
          <button 
            onClick={() => setActiveTab('chat')}
            className="p-4 bg-white hover:bg-slate-50/50 rounded-3xl border border-slate-100 text-left transition-all hover:shadow-md active:scale-97 group shadow-sm"
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mb-3 group-hover:scale-105 transition-transform">
              <MessageCircle className="w-5.5 h-5.5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 leading-tight">Chat & Groupes</h4>
            <p className="text-[10px] text-slate-500 mt-1 leading-snug">Échanger en privé avec vos paires</p>
          </button>

        </div>
      </div>

      {/* MEMBER ONLY ROLE UPGRADE BOX (Allows member to request becoming Vendeuse or Admin) */}
      {!isAdmin && (
        <div className="p-4 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3">
          <div className="flex items-center gap-1.5 text-[#02569B] text-xs font-black uppercase">
            <Briefcase className="w-4 h-4" />
            <span>Faire Évoluer Mon Compte</span>
          </div>
          <p className="text-[10px] text-slate-600 leading-snug">
            Vous souhaitez vendre vos produits sur notre Boutique solidaire ou participer à l'administration des tontines ? Déposez votre demande ci-dessous.
          </p>

          {upgradeSuccess ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-[10px] font-semibold flex items-center gap-2 animate-bounce">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Demande soumise avec succès ! Elle sera validée par l'administrateur sous peu.</span>
            </div>
          ) : (
            <form onSubmit={handleRoleUpgradeSubmit} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wide mb-1">Rôle demandé</label>
                  <select
                    value={requestedUpgrade}
                    onChange={(e) => setRequestedUpgrade(e.target.value as UserRole)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-[10px] font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="Admin">🛡️ Admin Coopérative</option>
                    <option value="Membre">👤 Membre Simple</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wide mb-1">Abonnement</label>
                  <div className="p-2 bg-slate-100 border border-slate-200 text-slate-600 font-semibold rounded-xl text-[10px] text-center">
                    {currentUser.tier} ⭐
                  </div>
                </div>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Pourquoi souhaitez-vous évoluer ? (Ex: Pour vendre mes beignets)"
                  value={upgradeMotivation}
                  onChange={(e) => setUpgradeMotivation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0175C2]"
                />
              </div>

              <button
                type="submit"
                disabled={!upgradeMotivation.trim()}
                className="w-full bg-[#0175C2] hover:bg-[#02569B] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-[10px] py-2 rounded-xl uppercase transition-colors flex items-center justify-center gap-1 active:scale-98"
              >
                Soumettre ma demande <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      )}

      {/* REFERRAL & COOPERATIVE NETWORK SPOTLIGHT */}
      <div className="p-4 bg-gradient-to-r from-[#0175C2]/10 to-[#02569B]/10 border border-[#02569B]/10 rounded-3xl flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[#0175C2] text-[10px] font-black uppercase tracking-wider">
              <Gift className="w-3.5 h-3.5 animate-bounce" />
              <span>Votre Réseau de Parrainage</span>
            </div>
            <h4 className="text-xs font-black text-slate-950 leading-tight">Votre Code de Parrainage</h4>
          </div>
          <button 
            onClick={handleCopyCode}
            className="bg-[#0175C2] hover:bg-[#02569B] text-white font-bold py-1 px-2.5 rounded-lg text-[9px] shadow transition-transform active:scale-95 shrink-0 flex items-center gap-1"
          >
            {copiedCode ? 'Copié ! ✓' : 'Copier'} <Share2 className="w-2.5 h-2.5" />
          </button>
        </div>

        <div className="flex justify-between items-center bg-white/70 p-2.5 rounded-2xl border border-[#0175C2]/20 text-xs font-extrabold">
          <span className="font-mono text-slate-700 tracking-wider select-all">{currentUser.referralCode || 'ASSI-MAMAN'}</span>
          <span className="text-[#02569B] text-[10px]">Points cumulés : {currentUser.points || 50} pts</span>
        </div>

        {/* List of referred moms */}
        <div className="space-y-1">
          <p className="text-[8px] font-black uppercase text-slate-400 tracking-wide">Membres du réseau co-optés ({referredMoms.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {referredMoms.map(m => (
              <div key={m.id} className="flex items-center gap-1 bg-white p-1 rounded-full border border-slate-200/60 shadow-sm pr-2 text-[9px] font-semibold text-slate-700">
                <img src={m.avatar || undefined} alt="" className="w-5 h-5 rounded-full object-cover" />
                <span>{m.name.split(' ')[0]}</span>
                {m.status === 'Validé' ? (
                  <span className="text-emerald-500 text-[8px]">✓</span>
                ) : (
                  <span className="text-amber-500 text-[8px]">⏳</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ACTIVE TONTINES COMPACT CHECKLIST */}
      <div>
        <div className="flex justify-between items-center mb-2.5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mes Tontines Actives</h3>
          <span className="text-[10px] text-[#0175C2] font-bold">{activeTontinesUser.length} Tontines</span>
        </div>

        <div className="space-y-2">
          {activeTontinesUser.map(t => {
            const userPart = t.participants.find(p => p.memberId === currentUser.id || p.memberId === 'user_current');
            const totalCollected = t.contributionAmount * t.participants.length;
            return (
              <div 
                key={t.id} 
                className="p-3.5 bg-white border border-slate-100 hover:border-slate-200/60 rounded-2xl flex items-center justify-between cursor-pointer transition-all shadow-sm"
                onClick={() => setActiveTab('tontines')}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] px-1.5 py-0.2 font-bold rounded bg-slate-100 text-slate-700">
                      {t.type}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{t.name}</h4>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Cagnotte : <span className="font-bold text-amber-600">{totalCollected.toLocaleString('fr-FR')} F</span> | Prochain tirage : {t.nextDrawDate}
                  </div>
                </div>

                <div className="text-right">
                  {userPart?.hasPaidThisRound ? (
                    <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full border border-emerald-100 font-bold">
                      Payé ✓
                    </span>
                  ) : (
                    <span className="text-[9px] bg-rose-50 text-rose-600 px-2.5 py-0.5 rounded-full border border-rose-100 font-bold animate-pulse">
                      À payer ⚠️
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
