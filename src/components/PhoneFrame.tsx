import React, { useState } from 'react';
import { 
  Home, 
  ShoppingCart, 
  Users, 
  MessageCircle, 
  Wallet, 
  Bell, 
  Settings, 
  Smartphone, 
  ShieldCheck, 
  Award,
  Sparkles,
  RefreshCw,
  UserCheck,
  AlertCircle,
  Trash2,
  X,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SubscriptionTier, UserProfile, AppNotification, UserRole } from '../types';

interface PhoneFrameProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile;
  setCurrentUser?: React.Dispatch<React.SetStateAction<UserProfile>>;
  setSubscriptionTier: (tier: SubscriptionTier) => void;
  unreadMessagesCount: number;
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  activeToast: AppNotification | null;
  setActiveToast: (toast: AppNotification | null) => void;
}

export default function PhoneFrame({ 
  children, 
  activeTab, 
  setActiveTab, 
  currentUser,
  setCurrentUser,
  setSubscriptionTier,
  unreadMessagesCount,
  notifications,
  setNotifications,
  activeToast,
  setActiveToast
}: PhoneFrameProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showNotificationAlert, setShowNotificationAlert] = useState(false);
  const [usePhoneFrame, setUsePhoneFrame] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  // Time for the smartphone status bar
  const [time, setTime] = React.useState('12:45');
  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'VIP': return 'from-purple-600 to-indigo-600 text-white';
      case 'Premium': return 'from-amber-500 to-yellow-600 text-white';
      case 'Vendeuse': return 'from-teal-500 to-emerald-600 text-white';
      default: return 'from-slate-400 to-slate-600 text-white';
    }
  };

  const getTierBadgeLabel = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'VIP': return '💎 VIP Business';
      case 'Premium': return '🌟 Maman Fiable+';
      case 'Vendeuse': return '🤝 Vendeuse Vérifiée';
      default: return '🌱 Membre Gratuit';
    }
  };

  return (
    <div className={usePhoneFrame 
      ? "flex flex-col lg:flex-row items-center justify-center min-h-screen bg-[#F0F7FF] p-3 lg:p-6 text-slate-800 font-sans gap-6"
      : "flex items-center justify-center min-h-screen bg-[#F0F7FF] text-slate-800 font-sans"
    }>
      
      {/* Floating desktop control to switch back to simulator */}
      {!usePhoneFrame && (
        <div className="hidden lg:flex fixed top-4 left-4 z-50 flex-col gap-2.5 max-w-[260px] bg-white p-4.5 rounded-2xl shadow-xl border border-slate-150 animate-fade-in">
          <div className="flex items-center gap-1.5 text-[#0175C2] font-black uppercase text-[10px] tracking-wider">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Assi Tontine Pro</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal">
            Vous testez actuellement l'application en mode <strong>Plein Écran Normal</strong>. Ce mode est optimal pour tester directement sur votre téléphone portable.
          </p>
          <button
            type="button"
            onClick={() => setUsePhoneFrame(true)}
            className="py-2 px-3 bg-[#0175C2] text-white text-[10px] font-bold rounded-xl shadow-md hover:bg-[#02569B] active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Activer le Simulateur</span>
          </button>
        </div>
      )}

      {/* LEFT COLUMN: Controls and project overview */}
      {usePhoneFrame && (
        <div className="w-full lg:w-[380px] flex flex-col gap-5 p-6 bg-[#02569B] text-white rounded-3xl shadow-xl shadow-blue-900/20 animate-fade-in">
          <div>
            <div className="flex items-center gap-2 text-[#40D1FF] mb-1">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span className="text-xs font-bold tracking-wider uppercase">ASSI TONTINE</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Tontine & Market Pro</h1>
            <p className="text-xs text-blue-100 mt-1 leading-relaxed">
              Un simulateur interactif haute-fidélité fidèle à votre proposition de projet mobile.
            </p>
          </div>

          {/* PROFILE CONTROL / TIER CHANGER */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-xs font-bold text-blue-200 block mb-2.5 uppercase tracking-wider">
              Simuler un niveau d'abonnement :
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(['Gratuit', 'Premium', 'VIP', 'Vendeuse'] as SubscriptionTier[]).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSubscriptionTier(tier)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                    currentUser.tier === tier
                      ? 'bg-[#40D1FF] border-[#40D1FF] text-blue-950 shadow-md shadow-blue-950/20'
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <span>
                    {tier === 'Gratuit' && '🌱 Gratuit'}
                    {tier === 'Premium' && '🌟 Premium'}
                    {tier === 'VIP' && '💎 VIP'}
                    {tier === 'Vendeuse' && '🤝 Vendeuse'}
                  </span>
                  {currentUser.tier === tier && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-950" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ROLE SIMULATOR FOR DEV/EVAL */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-xs font-bold text-blue-200 block mb-2.5 uppercase tracking-wider">
              Simuler un Rôle Utilisateur :
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['Membre', 'Admin', 'Super Admin'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    if (setCurrentUser) {
                      setCurrentUser(prev => ({ ...prev, role }));
                    }
                  }}
                  className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all text-center flex flex-col items-center justify-center gap-1 ${
                    (currentUser.role || 'Membre') === role
                      ? 'bg-amber-400 border-amber-400 text-slate-950 shadow-md'
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <span>
                    {role === 'Membre' && '👤 Membre'}
                    {role === 'Admin' && '🛡️ Admin'}
                    {role === 'Super Admin' && '👑 S. Admin'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* VIEW MODE CONTROLLER IN LEFT COLUMN */}
          <div className="p-4 bg-white/10 rounded-2xl border border-[#40D1FF]/30 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider text-xs">
              <Smartphone className="w-4 h-4 text-[#40D1FF]" />
              <span>Mode d'Affichage</span>
            </div>
            <p className="text-[10px] text-blue-100 leading-normal">
              Basculez entre le cadre de simulation de smartphone Flutter (idéal pour PC) ou le mode Plein Écran Normal (recommandé pour votre téléphone réel ou tablette).
            </p>
            <button
              type="button"
              onClick={() => setUsePhoneFrame(false)}
              className="w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md hover:from-amber-400 hover:to-amber-500 active:scale-95 transition-all"
            >
              <span>📺 Activer le Plein Écran</span>
            </button>
          </div>

          {/* PERMISSION OR AD CLUTTER PREVENTER */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2.5 text-xs text-blue-100">
            <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[#40D1FF]" />
              <span>Règles de conformité client</span>
            </div>
            <ul className="space-y-2 list-disc pl-4 leading-relaxed text-blue-100/90">
              <li>Les membres <span className="text-white font-semibold">Gratuits</span> ne peuvent pas poster sur le réseau social ni accéder aux tontines Premium.</li>
              <li>Les membres <span className="text-[#40D1FF] font-semibold">Maman Fiable+</span> obtiennent <span className="font-bold text-white">10% de réduction</span> en boutique et une priorité aux tirages.</li>
              <li>Le niveau <span className="text-[#40D1FF] font-semibold">VIP Business</span> débloque les tontines illimitées et le badge Diamant.</li>
              <li>Le statut <span className="text-[#40D1FF] font-semibold">Vendeuse Vérifiée</span> permet d'intégrer son catalogue de produits.</li>
            </ul>
          </div>

          {/* SPONSOR / WALLET INSIGHT */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-xs space-y-2 text-blue-100">
            <div className="flex justify-between">
              <span className="opacity-80">Utilisateur actif :</span>
              <span className="text-white font-bold">{currentUser.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-80">Solde :</span>
              <span className="text-[#40D1FF] font-bold">{currentUser.walletBalance.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-80">Code Parrainage :</span>
              <span className="text-white font-mono font-bold">{currentUser.referralCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-80">Score de Fiabilité :</span>
              <span className="text-[#40D1FF] font-bold">⭐ {currentUser.reliabilityScore}%</span>
            </div>
          </div>
          
          <div className="text-[10px] text-blue-200/60 text-center">
            Conçu avec l'identité visuelle Flutter. Éléments graphiques et cinétiques fluides.
          </div>
        </div>
      )}

      {/* CENTER COLUMN: SMARTPHONE DEVICE WRAPPER OR FULL SCREEN NATIVE */}
      <div className={usePhoneFrame 
        ? "relative w-full max-w-[405px] h-[820px] bg-slate-900 rounded-[50px] p-3 shadow-2xl shadow-blue-900/10 ring-12 ring-slate-800/80 border-4 border-slate-700 flex flex-col overflow-hidden"
        : "relative w-full max-w-md min-h-screen bg-white flex flex-col overflow-hidden shadow-2xl md:border-x border-slate-150"
      }>
        
        {/* Notch / Speaker bar */}
        {usePhoneFrame && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-36 bg-slate-900 rounded-b-2xl z-50 flex items-center justify-center">
            <div className="w-12 h-1 bg-slate-850 rounded-full" />
          </div>
        )}

        {/* Smartphone Screen Header Area */}
        {usePhoneFrame && (
          <div className="h-7 px-6 pt-1 flex justify-between items-center text-[11px] font-semibold text-slate-400 select-none z-40 bg-slate-900">
            <span>{time}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px]">4G</span>
              <div className="w-4.5 h-2.5 border border-slate-500 rounded-sm p-0.5 flex items-center">
                <div className="w-full h-full bg-slate-400 rounded-2xs" />
              </div>
              <Smartphone className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        )}

        {/* MAIN DISPLAY VIEW */}
        <div className={`flex-1 bg-[#F0F7FF] overflow-y-auto relative flex flex-col no-scrollbar ${
          usePhoneFrame ? 'rounded-[32px]' : 'rounded-none pb-24'
        }`}>
          
          {/* Internal Simulated Header (Sticky to screen top) */}
          {currentUser && currentUser.id !== '' && currentUser.status !== 'En attente' && (
            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3.5 flex justify-between items-center z-30 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <img 
                    src={currentUser.avatar} 
                    alt="Avatar" 
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-[#0175C2]"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] font-bold text-white border border-white">
                    ✓
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-slate-900 leading-tight">{currentUser.name}</h3>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                      ⭐ {currentUser.reliabilityScore}%
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-500 flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#02569B] animate-pulse" />
                    <span className="font-semibold text-slate-600">{getTierBadgeLabel(currentUser.tier)}</span>
                    <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shadow-2xs ${
                      currentUser.role === 'Super Admin' ? 'bg-slate-950 text-amber-400 border border-amber-400/25 font-black' :
                      currentUser.role === 'Admin' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {currentUser.role === 'Super Admin' ? '👑 S. Admin' :
                       currentUser.role === 'Admin' ? '🛡️ Admin' :
                       '👤 Membre'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowNotificationAlert(!showNotificationAlert)} 
                  className="w-8.5 h-8.5 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 relative transition-transform active:scale-95"
                >
                  <Bell className="w-4 h-4" />
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                      {notifications.filter(n => !n.isRead).length}
                    </span>
                  )}
                </button>
                
                <button 
                  onClick={() => setShowSettings(!showSettings)} 
                  className="w-8.5 h-8.5 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-transform active:scale-95"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Real-time Push Notification Toast Banner */}
          <AnimatePresence>
            {activeToast && (
              <motion.div 
                initial={{ y: -50, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -20, opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                onClick={() => {
                  setNotifications(prev => prev.map(n => n.id === activeToast.id ? { ...n, isRead: true } : n));
                  if (activeToast.linkToTab) {
                    setActiveTab(activeToast.linkToTab);
                  }
                  setActiveToast(null);
                }}
                className="absolute top-10 left-3 right-3 bg-slate-950/95 backdrop-blur-md text-white p-3.5 rounded-2xl flex items-start gap-3 z-50 shadow-xl border border-slate-800 cursor-pointer hover:bg-slate-900/90 transition-all"
              >
                <div className="p-2 rounded-xl bg-white/15 shrink-0 text-amber-400">
                  {activeToast.type === 'tontine' && <Award className="w-4 h-4" />}
                  {activeToast.type === 'chat' && <MessageCircle className="w-4 h-4 text-[#40D1FF]" />}
                  {activeToast.type === 'transaction' && <Wallet className="w-4 h-4 text-emerald-400" />}
                  {activeToast.type === 'alert' && <AlertCircle className="w-4 h-4 text-rose-400" />}
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-extrabold text-[#40D1FF] uppercase tracking-wider">ASSI PUSH</span>
                    <span className="text-[8px] text-white/40">Maintenant</span>
                  </div>
                  <h4 className="text-[11px] font-extrabold leading-tight truncate text-white">{activeToast.title}</h4>
                  <p className="text-[10px] text-slate-200 leading-snug">{activeToast.message}</p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveToast(null);
                  }}
                  className="text-white/40 hover:text-white shrink-0 self-center p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interactive Notification Center Drawer */}
          <AnimatePresence>
            {showNotificationAlert && (
              <motion.div 
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="mx-4 mt-2 p-4 bg-white border border-slate-150 rounded-3xl text-xs space-y-3 z-45 shadow-xl relative animate-fade-in"
              >
                <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-slate-950 text-xs uppercase tracking-wider">🔔 Notifications</span>
                    {notifications.filter(n => !n.isRead).length > 0 && (
                      <span className="bg-rose-100 text-rose-700 font-extrabold px-2 py-0.5 rounded-full text-[9px]">
                        {notifications.filter(n => !n.isRead).length} nouvelles
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => setShowNotificationAlert(false)} 
                    className="text-slate-400 hover:text-slate-600 font-bold p-1 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick actions row */}
                {notifications.length > 0 && (
                  <div className="flex justify-between items-center text-[10px] text-slate-500 pb-1 border-b border-slate-100">
                    <button 
                      onClick={() => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))}
                      className="hover:text-[#0175C2] font-bold flex items-center gap-1 transition-colors"
                    >
                      ✓ Tout marquer comme lu
                    </button>
                    <button 
                      onClick={() => setNotifications([])}
                      className="hover:text-rose-600 font-bold flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Tout effacer
                    </button>
                  </div>
                )}

                {/* Notifications list */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar pr-0.5">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center space-y-2">
                      <Bell className="w-8 h-8 text-slate-300 mx-auto stroke-1 animate-pulse" />
                      <p className="text-slate-400 text-[10px] font-medium">Votre boîte de réception est vide.</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.id}
                        onClick={() => {
                          // Mark as read
                          setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
                          if (notif.linkToTab) {
                            setActiveTab(notif.linkToTab);
                          }
                          setShowNotificationAlert(false);
                        }}
                        className={`p-3 rounded-2xl flex items-start gap-2.5 cursor-pointer transition-all hover:scale-[1.01] active:scale-99 border ${
                          notif.isRead 
                            ? 'bg-slate-50 border-slate-100 opacity-75 hover:opacity-100' 
                            : 'bg-[#0175C2]/5 border-[#0175C2]/15 shadow-sm'
                        }`}
                      >
                        {/* Status tag color */}
                        <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                          notif.type === 'tontine' ? 'bg-amber-50 text-amber-600' :
                          notif.type === 'chat' ? 'bg-blue-50 text-blue-600' :
                          notif.type === 'transaction' ? 'bg-emerald-50 text-emerald-600' :
                          'bg-rose-50 text-rose-600'
                        }`}>
                          {notif.type === 'tontine' && <Award className="w-4 h-4" />}
                          {notif.type === 'chat' && <MessageCircle className="w-4 h-4" />}
                          {notif.type === 'transaction' && <Wallet className="w-4 h-4" />}
                          {notif.type === 'alert' && <AlertCircle className="w-4 h-4" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex justify-between items-start gap-1">
                            <h4 className={`text-[11px] leading-tight truncate ${notif.isRead ? 'text-slate-700 font-medium' : 'text-slate-900 font-extrabold'}`}>
                              {notif.title}
                            </h4>
                            {!notif.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1 animate-ping" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 leading-normal">{notif.message}</p>
                          <span className="text-[8px] text-slate-400 font-semibold block pt-0.5">{notif.timestamp}</span>
                        </div>

                        {/* Delete individual */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setNotifications(prev => prev.filter(n => n.id !== notif.id));
                          }}
                          className="text-slate-300 hover:text-rose-500 self-center p-1 rounded-lg hover:bg-slate-100/50 transition-colors"
                          title="Supprimer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Settings / Profile Drawer inside the screen */}
          {showSettings && (
            <div className="mx-4 mt-2 p-3 bg-white border border-slate-150 rounded-xl text-xs space-y-3 z-30 shadow-xl relative animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-900">Mon Compte Tontine & Market</span>
                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
              </div>
              <div className="space-y-2.5">
                <div>
                  <span className="text-slate-500 text-[10px] font-semibold">Nom de profil :</span>
                  <input 
                    type="text" 
                    value={currentUser.name} 
                    onChange={(e) => {
                      if (setCurrentUser) {
                        setCurrentUser(prev => ({ ...prev, name: e.target.value }));
                      }
                    }} 
                    className="w-full bg-slate-50 text-slate-700 p-2 rounded-xl border border-slate-200 mt-1 font-semibold focus:ring-1 focus:ring-[#0175C2]"
                  />
                </div>
                
                <div>
                  <span className="text-slate-500 text-[10px] font-semibold">Rôle de l'utilisateur :</span>
                  <select
                    value={currentUser.role || 'Membre'}
                    onChange={(e) => {
                      const newRole = e.target.value as UserRole;
                      if (setCurrentUser) {
                        setCurrentUser(prev => ({ ...prev, role: newRole }));
                      }
                    }}
                    className="w-full bg-slate-50 text-slate-900 font-semibold p-2 rounded-xl border border-slate-200 mt-1 focus:ring-1 focus:ring-[#0175C2] outline-none"
                  >
                    <option value="Membre">👤 Membre Standard</option>
                    <option value="Admin">🛡️ Administrateur (Admin)</option>
                    <option value="Super Admin">👑 Super Administrateur</option>
                  </select>
                </div>

                <div className="flex justify-between text-slate-600 pt-1 text-[10px]">
                  <span>Score : {currentUser.reliabilityScore}%</span>
                  <span className="text-emerald-600 font-semibold">Qualité : Maman Fiable</span>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-500 text-[10px] font-semibold block mb-1.5">Affichage de l'application :</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setUsePhoneFrame(true)}
                      className={`py-1.5 px-2 rounded-lg text-[9px] font-bold border text-center transition-all ${
                        usePhoneFrame 
                          ? 'bg-[#0175C2] border-[#0175C2] text-white shadow-xs' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      📱 Simulateur Flutter
                    </button>
                    <button
                      type="button"
                      onClick={() => setUsePhoneFrame(false)}
                      className={`py-1.5 px-2 rounded-lg text-[9px] font-bold border text-center transition-all ${
                        !usePhoneFrame 
                          ? 'bg-[#0175C2] border-[#0175C2] text-white shadow-xs' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      📺 Plein Écran Normal
                    </button>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center gap-2">
                  <button 
                    onClick={() => {
                      setShowSettings(false);
                      if (setCurrentUser) {
                        setCurrentUser({
                          id: '',
                          name: '',
                          avatar: '',
                          tier: 'Gratuit',
                          reliabilityScore: 0,
                          walletBalance: 0,
                          referralCode: '',
                          points: 0,
                          referralsCount: 0,
                          role: 'Membre',
                          status: undefined
                        });
                      }
                    }} 
                    className="bg-rose-50 hover:bg-rose-150 text-rose-600 font-extrabold px-3 py-1.5 rounded-xl text-[10px] active:scale-95 transition-all"
                  >
                    Déconnexion 🚪
                  </button>
                  <button 
                    onClick={() => setShowSettings(false)} 
                    className="bg-[#0175C2] hover:bg-[#02569B] text-white font-bold px-4 py-1.5 rounded-xl text-[11px] shadow-sm active:scale-95 transition-transform"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN CONTENT AREA */}
          <div className="flex-1 px-4 py-3 flex flex-col gap-4 pb-20">
            {children}
          </div>

        </div>

        {/* BOTTOM SIMULATED NAVIGATION BAR */}
        {currentUser && currentUser.id !== '' && currentUser.status !== 'En attente' && (
          <div className={`absolute bg-white/95 backdrop-blur-md border-t border-slate-150 py-2.5 px-3 flex justify-around items-center z-40 select-none animate-fade-in ${
            usePhoneFrame 
              ? 'bottom-3 left-3 right-3 rounded-b-[38px]' 
              : 'bottom-0 left-0 right-0'
          }`}>
            <button 
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-[#0175C2] scale-105 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[9px] font-medium">Accueil</span>
            </button>
 
            <button 
              onClick={() => setActiveTab('tontines')}
              className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'tontines' ? 'text-[#0175C2] scale-105 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Award className="w-5 h-5" />
              <span className="text-[9px] font-medium">Tontines</span>
            </button>
 
            <button 
              onClick={() => setActiveTab('community')}
              className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'community' ? 'text-[#0175C2] scale-105 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[9px] font-medium">Communauté</span>
            </button>
 
            <button 
              onClick={() => setActiveTab('chat')}
              className={`flex flex-col items-center gap-1 transition-all relative ${activeTab === 'chat' ? 'text-[#0175C2] scale-105 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <MessageCircle className="w-5 h-5" />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {unreadMessagesCount}
                </span>
              )}
              <span className="text-[9px] font-medium">Chat</span>
            </button>
 
            <button 
              onClick={() => setActiveTab('wallet')}
              className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'wallet' ? 'text-[#0175C2] scale-105 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Wallet className="w-5 h-5" />
              <span className="text-[9px] font-medium">Wallet</span>
            </button>
          </div>
        )}
 
        {/* Home Indicator bar */}
        {usePhoneFrame && (
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-800 rounded-full z-50 pointer-events-none" />
        )}

      </div>
    </div>
  );
}
