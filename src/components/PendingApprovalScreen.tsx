import React from 'react';
import { UserProfile } from '../types';
import { Clock, ShieldAlert, ArrowLeft, Key, Phone, User, Award } from 'lucide-react';

interface PendingApprovalScreenProps {
  currentUser: UserProfile;
  onLogout: () => void;
  onSwitchToAdmin: () => void;
}

export default function PendingApprovalScreen({ currentUser, onLogout, onSwitchToAdmin }: PendingApprovalScreenProps) {
  return (
    <div className="flex-1 flex flex-col justify-between bg-slate-50 p-4 text-slate-800 rounded-3xl min-h-[500px]">
      <div className="space-y-6 pt-6">
        {/* Animated clock / hourglass indicator */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-4 bg-amber-500/10 rounded-full text-amber-500 animate-pulse">
            <Clock className="w-10 h-10" />
          </div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Inscription en cours d'examen</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Pour garantir la sécurité de notre tontine solidaire, un administrateur doit valider votre identité et vos coordonnées.
          </p>
        </div>

        {/* User Card Recap */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <img src={currentUser.avatar} alt="" className="w-11 h-11 rounded-full object-cover border border-slate-100 ring-2 ring-amber-400" />
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 leading-tight">{currentUser.name}</h3>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200/40 rounded-full px-2 py-0.5 mt-1 inline-block">
                ⏳ Statut : En attente de validation
              </span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10px] uppercase">
                <Phone className="w-3.5 h-3.5" /> Téléphone
              </span>
              <span className="font-bold text-slate-900">{currentUser.phone || 'Non renseigné'}</span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10px] uppercase">
                <User className="w-3.5 h-3.5" /> Rôle demandé
              </span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-extrabold rounded-lg text-[10px]">
                {currentUser.requestedRole || 'Membre'}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10px] uppercase">
                <Award className="w-3.5 h-3.5" /> Type de compte
              </span>
              <span className="font-extrabold text-slate-900">{currentUser.tier}</span>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-3 flex gap-2 text-[10px] text-amber-800 leading-normal">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <p>
            Dès qu'un administrateur valide votre compte et attribue votre rôle officiel, vous serez notifié et aurez accès à toutes les tontines et au marché.
          </p>
        </div>
      </div>

      <div className="space-y-2.5 pb-2">
        {/* testing shortcut */}
        <button
          onClick={onSwitchToAdmin}
          className="w-full bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-xs py-2.5 rounded-xl uppercase transition-colors shadow-md flex items-center justify-center gap-1.5 active:scale-98 border border-slate-800"
        >
          <Key className="w-4 h-4 text-amber-400" />
          🔑 Passer en Admin pour approuver
        </button>

        <button
          onClick={onLogout}
          className="w-full bg-white hover:bg-slate-100 text-slate-600 font-bold text-xs py-2 rounded-xl transition-all border border-slate-200 active:scale-98 flex items-center justify-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Retourner à l'accueil / Connexion
        </button>
      </div>
    </div>
  );
}
