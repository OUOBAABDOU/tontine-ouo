import React, { useState } from 'react';
import { UserProfile, Member, UserRole, SubscriptionTier } from '../types';
import { User, Phone, Shield, ArrowRight, Sparkles, AlertCircle, KeyRound, HelpCircle, Mail, Lock } from 'lucide-react';

interface RegisterScreenProps {
  onRegister: (newProfile: UserProfile) => void;
  onLogin: (userId: string, customProfile?: UserProfile) => void;
  members: Member[];
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200', // Marie
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200', // Antoinette
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200', // Beatrice
  'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=200', // Florence
  'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=200', // Fatoumata
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200', // Sidonie
];

export default function RegisterScreen({ onRegister, onLogin, members }: RegisterScreenProps) {
  const [isRegistering, setIsRegistering] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [requestedRole, setRequestedRole] = useState<UserRole>('Membre');
  const [tier, setTier] = useState<SubscriptionTier>('Gratuit');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[3]); // Default Florence
  const [error, setError] = useState('');

  // Authentication Type: Phone + PIN vs Email + Password
  const [useEmailAuth, setUseEmailAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Login States
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showDemoList, setShowDemoList] = useState(false);

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Veuillez saisir votre nom complet.');
      return;
    }

    if (useEmailAuth) {
      if (!email.trim() || !email.includes('@')) {
        setError('Veuillez saisir une adresse email valide.');
        return;
      }
      if (password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères.');
        return;
      }
    } else {
      if (!phone.trim()) {
        setError('Veuillez saisir votre numéro de téléphone.');
        return;
      }
    }

    if (pinCode.length < 4) {
      setError('Veuillez définir un code PIN de 4 chiffres pour sécuriser l\'accès à l\'application.');
      return;
    }

    const referralCode = `${name.split(' ')[0].toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const newProfile: UserProfile = {
      id: `user_${Date.now()}`,
      name: name.trim(),
      avatar: selectedAvatar,
      tier: tier,
      reliabilityScore: 50, // Starts at 50% for fresh users
      walletBalance: 0,
      referralCode,
      points: 0,
      referralsCount: 0,
      role: requestedRole,
      status: 'En attente', // Needs admin validation!
      phone: phone.trim() || undefined,
      requestedRole: requestedRole,
      pinCode: pinCode.trim(),
      email: useEmailAuth ? email.trim().toLowerCase() : undefined,
      password: useEmailAuth ? password.trim() : undefined
    };

    onRegister(newProfile);
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (useEmailAuth) {
      if (!loginEmail.trim() || !loginEmail.includes('@')) {
        setError('Veuillez saisir une adresse email valide.');
        return;
      }
      if (!loginPassword.trim()) {
        setError('Veuillez saisir votre mot de passe.');
        return;
      }
    } else {
      if (!loginPhone.trim()) {
        setError('Veuillez saisir votre numéro de téléphone.');
        return;
      }
      if (loginPin.length < 4) {
        setError('Veuillez saisir votre code PIN à 4 chiffres.');
        return;
      }
    }

    // Combine standard Admin and fetched members
    const allUsers = [
      {
        id: 'user_current',
        name: 'Maman Marie',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
        tier: 'Premium' as SubscriptionTier,
        role: 'Super Admin' as UserRole,
        status: 'Validé' as const,
        phone: '+226 70 00 00 00',
        pinCode: '1234',
        email: 'marie@tontine.com',
        password: 'password123',
        reliabilityScore: 98
      },
      ...members
    ];

    let matched;
    if (useEmailAuth) {
      matched = allUsers.find(m => {
        return m.email?.toLowerCase() === loginEmail.trim().toLowerCase() && m.password === loginPassword;
      });
    } else {
      matched = allUsers.find(m => {
        const pClean = (m.phone || '').replace(/[\s\-\+]/g, '');
        const loginPhoneClean = loginPhone.replace(/[\s\-\+]/g, '');
        return pClean.includes(loginPhoneClean) && m.pinCode === loginPin;
      });
    }

    if (matched) {
      const userProf: UserProfile = {
        id: matched.id,
        name: matched.name,
        avatar: matched.avatar,
        tier: matched.tier,
        reliabilityScore: matched.reliabilityScore,
        walletBalance: matched.id === 'm2' ? 120000 : matched.id === 'user_current' ? 75000 : 15000,
        referralCode: `${matched.name.split(' ')[0].toUpperCase()}-XYZ`,
        points: matched.id === 'user_current' ? 450 : 50,
        referralsCount: matched.id === 'user_current' ? 4 : 0,
        role: matched.role || 'Membre',
        status: matched.status || 'Validé',
        phone: matched.phone || (useEmailAuth ? '' : loginPhone.trim()),
        requestedRole: matched.requestedRole || matched.role,
        pinCode: matched.pinCode,
        email: matched.email,
        password: matched.password
      };
      onLogin(matched.id, userProf);
    } else {
      if (useEmailAuth) {
        setError('Adresse email ou mot de passe incorrect. Pour tester, essayez marie@tontine.com avec le mot de passe password123.');
      } else {
        setError('Téléphone ou code PIN incorrect. Veuillez vérifier vos identifiants ou essayer les comptes de démo ci-dessous.');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-start bg-slate-50 p-2 text-slate-800 rounded-3xl min-h-[500px]">
      <div className="text-center my-4 space-y-1">
        <div className="inline-flex items-center justify-center p-2.5 bg-[#0175C2]/10 rounded-2xl mb-1.5 text-[#0175C2]">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <h1 className="text-lg font-black tracking-tight text-slate-950">Tontine & Market</h1>
        <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Plateforme Solidaire des Mamans</p>
      </div>

      {/* Tabs: Register vs Login */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl gap-1 mb-3 mx-2">
        <button
          onClick={() => {
            setIsRegistering(true);
            setError('');
          }}
          className={`flex-1 py-2 rounded-xl text-center text-[11px] font-extrabold uppercase transition-all duration-200 ${
            isRegistering 
              ? 'bg-white text-slate-950 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Créer un compte 📝
        </button>
        <button
          onClick={() => {
            setIsRegistering(false);
            setError('');
          }}
          className={`flex-1 py-2 rounded-xl text-center text-[11px] font-extrabold uppercase transition-all duration-200 ${
            !isRegistering 
              ? 'bg-white text-slate-950 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Se Connecter 🔑
        </button>
      </div>

      {/* Auth Method Toggle: Phone/PIN vs Email/Password */}
      <div className="flex bg-slate-100 p-0.5 rounded-xl gap-1 mb-4 mx-2 border border-slate-200">
        <button
          type="button"
          onClick={() => {
            setUseEmailAuth(false);
            setError('');
          }}
          className={`flex-1 py-1 rounded-lg text-center text-[10px] font-bold transition-all ${
            !useEmailAuth 
              ? 'bg-[#0175C2] text-white shadow-sm' 
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          📱 Téléphone & PIN
        </button>
        <button
          type="button"
          onClick={() => {
            setUseEmailAuth(true);
            setError('');
          }}
          className={`flex-1 py-1 rounded-lg text-center text-[10px] font-bold transition-all ${
            useEmailAuth 
              ? 'bg-[#0175C2] text-white shadow-sm' 
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          📧 Email & Mot de passe
        </button>
      </div>

      {error && (
        <div className="mx-2 mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-[10px] font-medium flex items-center gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isRegistering ? (
        /* REGISTRATION FORM */
        <form onSubmit={handleRegisterSubmit} className="space-y-3 px-2">
          {/* Avatar selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Choisissez votre photo de profil
            </label>
            <div className="flex justify-between items-center bg-white p-2 rounded-2xl border border-slate-200">
              <img 
                src={selectedAvatar || undefined} 
                alt="Selected" 
                className="w-12 h-12 rounded-full object-cover ring-2 ring-[#0175C2] ring-offset-2 shrink-0" 
              />
              <div className="flex gap-1.5 overflow-x-auto ml-3 pb-1 max-w-[190px]">
                {AVATAR_PRESETS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedAvatar(url)}
                    className={`w-8 h-8 rounded-full overflow-hidden border-2 shrink-0 transition-transform hover:scale-105 active:scale-95 ${
                      selectedAvatar === url ? 'border-[#0175C2] scale-110' : 'border-transparent opacity-75'
                    }`}
                  >
                    <img src={url || undefined} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
              Nom complet
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Ex: Maman Florence"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-9 text-xs focus:outline-none focus:ring-1 focus:ring-[#0175C2] text-slate-900 font-medium"
              />
            </div>
          </div>

          {useEmailAuth ? (
            /* EMAIL & PASSWORD FIELDS FOR SIGN UP */
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                  Adresse Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="Ex: florence@tontine.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-9 text-xs focus:outline-none focus:ring-1 focus:ring-[#0175C2] text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Au moins 6 caractères"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-9 text-xs focus:outline-none focus:ring-1 focus:ring-[#0175C2] text-slate-900 font-medium"
                  />
                </div>
              </div>
            </>
          ) : (
            /* PHONE FIELD FOR SIGN UP */
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Numéro de téléphone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ex: +226 70 12 34 56"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-9 text-xs focus:outline-none focus:ring-1 focus:ring-[#0175C2] text-slate-900 font-medium"
                />
              </div>
            </div>
          )}

          {/* PIN code (needed for both methods as security lock screen) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
              {useEmailAuth ? "Définir votre Code PIN de Sécurité (4 chiffres)" : "Définir votre Code PIN de connexion (4 chiffres)"}
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                maxLength={4}
                placeholder="Ex: 1234"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-9 text-xs focus:outline-none focus:ring-1 focus:ring-[#0175C2] text-slate-900 font-medium tracking-widest"
              />
            </div>
            <p className="text-[9px] text-slate-400 mt-0.5">Ce code PIN vous sera demandé après connexion pour sécuriser vos transactions.</p>
          </div>

          {/* Requested Role & Subscription Tier */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Rôle demandé
              </label>
              <select
                value={requestedRole}
                onChange={(e) => setRequestedRole(e.target.value as UserRole)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none text-slate-900"
              >
                <option value="Membre">👤 Membre</option>
                <option value="Admin">🛡️ Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Adhésion
              </label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as SubscriptionTier)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none text-slate-900"
              >
                <option value="Gratuit">Gratuit</option>
                <option value="Premium">Premium ⭐</option>
                <option value="VIP">VIP 👑</option>
                <option value="Vendeuse">Vendeuse 🤝</option>
              </select>
            </div>
          </div>

          <div className="p-2.5 bg-amber-50 border border-amber-200/60 rounded-2xl text-[9px] text-amber-800 leading-normal">
            ⚠️ <strong>Validation requise :</strong> Pour garantir la sécurité et la confiance au sein de nos tontines, votre inscription devra être validée par un administrateur système.
          </div>

          <button
            type="submit"
            className="w-full bg-[#0175C2] hover:bg-[#02569B] text-white font-extrabold text-xs py-2.5 rounded-xl uppercase transition-colors shadow-md flex items-center justify-center gap-1.5 active:scale-98"
          >
            S'inscrire à la Tontine <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      ) : (
        /* LOGIN FORM */
        <div className="space-y-4 px-2 flex-1 flex flex-col justify-between">
          
          <form onSubmit={handleCustomLogin} className="space-y-3.5">
            <h3 className="text-[11px] font-black text-[#02569B] uppercase tracking-wide flex items-center gap-1">
              <KeyRound className="w-4 h-4" />
              <span>Connexion avec vos identifiants {useEmailAuth ? "email" : "téléphone"}</span>
            </h3>

            {useEmailAuth ? (
              /* EMAIL & PASSWORD LOGIN FIELDS */
              <>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Adresse Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="Ex: marie@tontine.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-9 text-xs focus:outline-none focus:ring-1 focus:ring-[#0175C2] text-slate-900 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      placeholder="Votre mot de passe"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-9 text-xs focus:outline-none focus:ring-1 focus:ring-[#0175C2] text-slate-900 font-medium"
                    />
                  </div>
                </div>
              </>
            ) : (
              /* PHONE & PIN LOGIN FIELDS */
              <>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Numéro de téléphone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Ex: +226 70 00 00 00"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-9 text-xs focus:outline-none focus:ring-1 focus:ring-[#0175C2] text-slate-900 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Code PIN à 4 chiffres
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="Ex: 1234"
                      value={loginPin}
                      onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-9 text-xs focus:outline-none focus:ring-1 focus:ring-[#0175C2] text-slate-900 font-medium tracking-widest"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full bg-[#0175C2] hover:bg-[#02569B] text-white font-extrabold text-xs py-2.5 rounded-xl uppercase transition-colors shadow-md flex items-center justify-center gap-1.5 active:scale-98"
            >
              Se Connecter <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Dropdown/Accordion for Demo Accounts */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setShowDemoList(!showDemoList)}
              className="w-full p-3 bg-slate-100 hover:bg-slate-200/75 flex items-center justify-between text-[11px] font-bold text-slate-700 transition-colors"
            >
              <span className="flex items-center gap-1.5 text-slate-800">
                <HelpCircle className="w-4 h-4 text-slate-500" />
                Besoin de tester ? Comptes de Démo
              </span>
              <span className="text-[10px] text-[#0175C2]">{showDemoList ? 'Masquer ▲' : 'Afficher ▼'}</span>
            </button>

            {showDemoList && (
              <div className="p-2 space-y-1.5 max-h-[190px] overflow-y-auto bg-slate-50/50">
                {/* Maman Marie (Super Admin) Demo Button */}
                <button
                  onClick={() => {
                    if (useEmailAuth) {
                      setLoginEmail('marie@tontine.com');
                      setLoginPassword('password123');
                    } else {
                      setLoginPhone('+226 70 00 00 00');
                      setLoginPin('1234');
                    }
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-950 text-white p-2 rounded-xl text-left flex items-center gap-2.5 transition-all active:scale-[0.98]"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200" 
                    alt="" 
                    className="w-8 h-8 rounded-full object-cover border border-amber-400 shrink-0" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-extrabold text-[11px]">Maman Marie</span>
                      <span className="px-1 py-0.2 rounded bg-amber-400 text-slate-950 text-[6px] font-black uppercase">SUPER ADMIN</span>
                    </div>
                    <p className="text-[8px] text-slate-400 leading-none">
                      {useEmailAuth ? 'Email: marie@tontine.com • Mdp: password123' : 'Phone: +226 70 00 00 00 • PIN: 1234'}
                    </p>
                  </div>
                </button>

                {/* Other members list */}
                {members.map((m) => {
                  if (m.id === 'user_current') return null;
                  const isPending = m.status === 'En attente';
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        if (useEmailAuth) {
                          setLoginEmail(m.email || `${m.name.split(' ')[1]?.toLowerCase() || 'maman'}@tontine.com`);
                          setLoginPassword(m.password || 'password123');
                        } else {
                          setLoginPhone(m.phone || '');
                          setLoginPin(m.pinCode || '1234');
                        }
                      }}
                      className="w-full bg-white hover:bg-slate-100 text-slate-800 p-2 rounded-xl border border-slate-200 text-left flex items-center gap-2.5 transition-all active:scale-[0.98]"
                    >
                      <img src={m.avatar || undefined} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[11px] truncate max-w-[100px]">{m.name}</span>
                          {isPending ? (
                            <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 border border-rose-200 text-[6px] font-black uppercase">En attente</span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-600 text-[6px] font-black uppercase">{m.role || 'Membre'}</span>
                          )}
                        </div>
                        <p className="text-[8px] text-slate-500 leading-none mt-0.5">
                          {useEmailAuth 
                            ? `Email: ${m.email || 'maman@tontine.com'} • Mdp: ${m.password || 'password123'}` 
                            : `Phone: ${m.phone || 'N/A'} • PIN: ${m.pinCode || '1234'}`
                          }
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-3 bg-blue-50 border border-blue-150 rounded-2xl text-[10px] text-blue-800 leading-normal">
            ℹ️ <strong>Connexion Flexible :</strong> Vous pouvez basculer d'une méthode de connexion à l'autre et remplir automatiquement les champs de test en cliquant sur l'un des comptes de démo ci-dessus.
          </div>
        </div>
      )}
    </div>
  );
}
