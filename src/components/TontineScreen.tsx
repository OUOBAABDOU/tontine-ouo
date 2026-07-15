import React, { useState } from 'react';
import { 
  Award, 
  ArrowLeft, 
  Users, 
  Coins, 
  Calendar, 
  Play, 
  FileText, 
  Check, 
  X, 
  AlertTriangle, 
  Download, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Tontine, Member, UserProfile, DrawCertificate, UserRole, SystemLog } from '../types';

interface TontineScreenProps {
  tontines: Tontine[];
  setTontines: React.Dispatch<React.SetStateAction<Tontine[]>>;
  members: Member[];
  setMembers?: React.Dispatch<React.SetStateAction<Member[]>>;
  currentUser: UserProfile;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  addTransaction: (type: 'Recharge' | 'Paiement Tontine' | 'Achat Boutique' | 'Réception Tontine' | 'Bonus Parrainage', amount: number, description: string) => void;
  setActiveTab: (tab: string) => void;
  triggerNotification?: (type: 'tontine' | 'chat' | 'transaction' | 'alert', title: string, message: string, linkToTab?: string) => void;
  systemLogs?: SystemLog[];
  addSystemLog?: (
    type: 'creation_compte' | 'validation_compte' | 'creation_tontine' | 'cotisation' | 'retrait_wallet' | 'changement_role' | 'rejet_compte' | 'divers',
    userId: string,
    userName: string,
    userAvatar: string,
    description: string
  ) => void;
}

export default function TontineScreen({
  tontines,
  setTontines,
  members,
  setMembers,
  currentUser,
  setCurrentUser,
  addTransaction,
  setActiveTab,
  triggerNotification,
  systemLogs,
  addSystemLog
}: TontineScreenProps) {
  const [selectedTontineId, setSelectedTontineId] = useState<string | null>(null);

  // Admin Dashboard States
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminTab, setAdminTab] = useState<'create' | 'members' | 'approvals' | 'logs'>('create');
  const [assignedRoles, setAssignedRoles] = useState<Record<string, UserRole>>({});
  const [newTontineName, setNewTontineName] = useState('');
  const [newTontineType, setNewTontineType] = useState<'Argent' | 'Alimentaire'>('Argent');
  const [newTontineAmount, setNewTontineAmount] = useState(25000);
  const [newTontinePlaces, setNewTontinePlaces] = useState(10);
  const [newTontineFreq, setNewTontineFreq] = useState<'Mensuelle' | 'Hebdomadaire'>('Mensuelle');
  const [selectedMemberId, setSelectedMemberId] = useState('m1');
  
  // Rotating draw animation state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawCandidates, setDrawCandidates] = useState<Member[]>([]);
  const [activeCandidateIndex, setActiveCandidateIndex] = useState(0);
  const [winner, setWinner] = useState<Member | null>(null);
  const [certificate, setCertificate] = useState<DrawCertificate | null>(null);
  const [smsAlertLogs, setSmsAlertLogs] = useState<string[]>([]);
  const [isSendingSms, setIsSendingSms] = useState(false);

  // Helper to send real SMS alerts via backend API proxy
  const triggerRealSmsAlert = async (phone: string, message: string) => {
    setIsSendingSms(true);
    setSmsAlertLogs(prev => [...prev, `📡 Initialisation de l'envoi SMS à ${phone}...`]);
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber: phone, message })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        if (data.simulated) {
          setSmsAlertLogs(prev => [...prev, `📲 SMS simulé avec succès à ${phone} : "${message}"`]);
        } else {
          setSmsAlertLogs(prev => [...prev, `✅ SMS réel envoyé avec succès via Twilio à ${phone} ! (SID: ${data.sid || 'N/A'})`]);
        }
      } else {
        setSmsAlertLogs(prev => [...prev, `❌ Échec SMS à ${phone} : ${data.error || 'Erreur inconnue'}`]);
      }
    } catch (err: any) {
      console.error(err);
      setSmsAlertLogs(prev => [...prev, `❌ Erreur réseau lors de l'envoi SMS : ${err.message || err}`]);
    } finally {
      setIsSendingSms(false);
    }
  };
  
  const selectedTontine = tontines.find(t => t.id === selectedTontineId);

  // Admin Actions
  const handleCreateTontine = () => {
    if (!newTontineName.trim()) {
      alert("Veuillez saisir un nom pour la tontine.");
      return;
    }

    const newT: Tontine = {
      id: `t_${Date.now()}`,
      name: newTontineName,
      type: newTontineType,
      contributionAmount: Number(newTontineAmount),
      frequency: newTontineFreq,
      totalPlaces: Number(newTontinePlaces),
      status: 'Recrutement',
      description: `Une tontine rotative d'${newTontineType.toLowerCase()} créée par l'administration. Cotisation de ${Number(newTontineAmount).toLocaleString('fr-FR')} FCFA par mois, cagnotte totale disponible par tirage au sort automatique.`,
      nextDrawDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().split('T')[0],
      drawHistory: [],
      participants: [
        { memberId: 'user_current', hasPaidThisRound: false },
        { memberId: 'm1', hasPaidThisRound: true },
        { memberId: 'm2', hasPaidThisRound: false }
      ]
    };

    setTontines(prev => [newT, ...prev]);
    
    if (addSystemLog) {
      addSystemLog(
        'creation_tontine',
        currentUser.id,
        currentUser.name,
        currentUser.avatar,
        `Création de la tontine '${newTontineName}' par l'administrateur ${currentUser.name} (${newTontineType}, ${Number(newTontineAmount).toLocaleString('fr-FR')} FCFA)`
      );
    }

    setNewTontineName('');
    
    if (triggerNotification) {
      triggerNotification(
        'tontine',
        '📢 Nouvelle Tontine lancée !',
        `La tontine '${newTontineName}' est maintenant ouverte au recrutement. Rejoignez-nous !`,
        'tontines'
      );
    }
    
    alert(`La tontine '${newTontineName}' a été créée avec succès !`);
  };

  const handleUpdateMemberScore = (memberId: string, delta: number) => {
    if (!setMembers) return;
    
    const targetMember = members.find(m => m.id === memberId);
    if (targetMember && addSystemLog) {
      const direction = delta > 0 ? "augmenté" : "diminué";
      addSystemLog(
        'divers',
        currentUser.id,
        currentUser.name,
        currentUser.avatar,
        `Score de confiance de ${targetMember.name} ${direction} de ${Math.abs(delta)} points par ${currentUser.name}`
      );
    }

    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        const newScore = Math.max(10, Math.min(100, m.reliabilityScore + delta));
        return { ...m, reliabilityScore: newScore };
      }
      return m;
    }));
  };

  const handleToggleMemberRole = (memberId: string) => {
    if (!setMembers) return;

    const targetMember = members.find(m => m.id === memberId);
    if (targetMember && addSystemLog) {
      const currentRole = targetMember.role || 'Membre';
      const nextRole = currentRole === 'Admin' ? 'Membre' : 'Admin';
      addSystemLog(
        'changement_role',
        currentUser.id,
        currentUser.name,
        currentUser.avatar,
        `Rôle de ${targetMember.name} modifié vers [${nextRole}] par ${currentUser.name}`
      );
    }

    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        const currentRole = m.role || 'Membre';
        const nextRole = currentRole === 'Admin' ? 'Membre' : 'Admin';
        return { ...m, role: nextRole };
      }
      return m;
    }));
  };

  const handleToggleVendeuseStatus = (memberId: string) => {
    if (!setMembers) return;

    const targetMember = members.find(m => m.id === memberId);
    if (targetMember && addSystemLog) {
      const nextStatus = !targetMember.isVerifiedVendeuse;
      addSystemLog(
        'changement_role',
        currentUser.id,
        currentUser.name,
        currentUser.avatar,
        `Statut vendeuse de ${targetMember.name} défini sur [${nextStatus ? "Vérifiée" : "Non-vérifiée"}] par ${currentUser.name}`
      );
    }

    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        const isVerified = !m.isVerifiedVendeuse;
        return { 
          ...m, 
          isVerifiedVendeuse: isVerified,
          tier: isVerified ? 'Vendeuse' : 'Gratuit'
        };
      }
      return m;
    }));
  };

  // Find member details
  const getMemberDetails = (memberId: string): Member => {
    if (memberId === 'user_current') {
      return {
        id: 'user_current',
        name: currentUser.name,
        avatar: currentUser.avatar,
        reliabilityScore: currentUser.reliabilityScore,
        tier: currentUser.tier,
        phone: currentUser.phone || '+226 70 00 00 00'
      };
    }
    const found = members.find(m => m.id === memberId);
    return found ? {
      ...found,
      phone: found.phone || '+226 70 00 00 00'
    } : {
      id: memberId,
      name: 'Membre Anonyme',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      reliabilityScore: 80,
      tier: 'Gratuit',
      phone: '+226 70 00 00 00'
    };
  };

  const getReliabilityStar = (score: number) => {
    if (score >= 80) return { label: 'Maman Fiable', color: 'text-emerald-700 bg-emerald-50 border-emerald-100' };
    if (score >= 60) return { label: 'Maman Sérieuse', color: 'text-amber-700 bg-amber-50 border-amber-100' };
    return { label: 'En observation', color: 'text-rose-700 bg-rose-50 border-rose-100' };
  };

  // Perform contribution payment
  const handlePayContribution = (tontine: Tontine) => {
    if (currentUser.walletBalance < tontine.contributionAmount) {
      alert(`Solde insuffisant (${currentUser.walletBalance.toLocaleString('fr-FR')} F). Veuillez recharger votre portefeuille via Mobile Money.`);
      setActiveTab('wallet');
      return;
    }

    // Deduct from wallet balance
    setCurrentUser(prev => ({
      ...prev,
      walletBalance: prev.walletBalance - tontine.contributionAmount
    }));

    // Add transaction history
    addTransaction(
      'Paiement Tontine',
      tontine.contributionAmount,
      `Cotisation pour la tontine : ${tontine.name}`
    );

    // Update tontine participant payment status
    setTontines(prev => prev.map(t => {
      if (t.id === tontine.id) {
        return {
          ...t,
          participants: t.participants.map(p => {
            if (p.memberId === 'user_current') {
              return { ...p, hasPaidThisRound: true };
            }
            return p;
          })
        };
      }
      return t;
    }));

    // Add dynamic system log for traceability
    if (addSystemLog) {
      addSystemLog(
        'cotisation',
        currentUser.id,
        currentUser.name,
        currentUser.avatar,
        `Cotisation de ${tontine.contributionAmount.toLocaleString('fr-FR')} FCFA payée par ${currentUser.name} pour la tontine '${tontine.name}'`
      );
    }

    if (triggerNotification) {
      triggerNotification(
        'transaction',
        '✅ Cotisation Validée',
        `Votre cotisation de ${tontine.contributionAmount.toLocaleString('fr-FR')} FCFA pour '${tontine.name}' a été enregistrée avec succès.`,
        'tontines'
      );
    }
  };

  // Simulate drawing animation
  const handleLaunchDraw = (tontine: Tontine) => {
    if (isDrawing) return;

    // Get all paid participants of the tontine
    const paidMemberIds = tontine.participants
      .filter(p => p.hasPaidThisRound)
      .map(p => p.memberId);

    if (paidMemberIds.length === 0) {
      alert("Aucun participant n'a encore payé sa cotisation pour cette session ! Impossible de lancer le tirage.");
      return;
    }

    // Filter out previous winners if possible, to favor people who haven't won
    const eligibleWinners = paidMemberIds.filter(id => !tontine.drawHistory.includes(id));
    const candidatesIds = eligibleWinners.length > 0 ? eligibleWinners : paidMemberIds;
    
    const candidates = candidatesIds.map(id => getMemberDetails(id));

    setDrawCandidates(candidates);
    setIsDrawing(true);
    setWinner(null);
    setCertificate(null);

    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % candidates.length;
      setActiveCandidateIndex(index);
    }, 180);

    // Stop after 3.5 seconds and pick winner
    setTimeout(() => {
      clearInterval(interval);
      
      // Select the final winner
      const finalWinner = candidates[Math.floor(Math.random() * candidates.length)];
      setWinner(finalWinner);
      setIsDrawing(false);

      // Total pool won
      const totalPoolWon = tontine.contributionAmount * tontine.participants.length;

      // Update Tontine history in global state
      setTontines(prev => prev.map(t => {
        if (t.id === tontine.id) {
          return {
            ...t,
            drawHistory: [...t.drawHistory, finalWinner.id],
            // Reset paid status for the next rotation round
            participants: t.participants.map(p => ({ ...p, hasPaidThisRound: false }))
          };
        }
        return t;
      }));

      // If the winner is the current user, credit their wallet!
      if (finalWinner.id === 'user_current') {
        setCurrentUser(prev => ({
          ...prev,
          walletBalance: prev.walletBalance + totalPoolWon
        }));
        addTransaction(
          'Réception Tontine',
          totalPoolWon,
          `Gagné la cagnotte globale de : ${tontine.name}`
        );
      }

      // Generate certificate
      const cert: DrawCertificate = {
        id: `CERT-${tontine.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
        tontineId: tontine.id,
        tontineName: tontine.name,
        winnerName: finalWinner.name,
        winnerAvatar: finalWinner.avatar,
        amount: totalPoolWon,
        date: new Date().toLocaleDateString('fr-FR'),
        signature: 'ALGORITHME ASSI TONTINE'
      };
      setCertificate(cert);

      // Add audit log for draw execution
      if (addSystemLog) {
        addSystemLog(
          'divers',
          currentUser.id,
          currentUser.name,
          currentUser.avatar,
          `Tirage effectué pour la tontine '${tontine.name}'. Maman ${finalWinner.name} remporte la cagnotte globale de ${totalPoolWon.toLocaleString('fr-FR')} FCFA !`
        );
      }

      if (triggerNotification) {
        if (finalWinner.id === 'user_current') {
          triggerNotification(
            'tontine',
            '🎉 Victoire ! Vous gagnez la tontine !',
            `Félicitations ! Vous avez remporté la cagnotte globale de '${tontine.name}' d'un montant de ${totalPoolWon.toLocaleString('fr-FR')} F !`,
            'wallet'
          );
        } else {
          triggerNotification(
            'tontine',
            `🏆 Gagnante : ${finalWinner.name}`,
            `${finalWinner.name} remporte la cagnotte de la tontine '${tontine.name}' d'un montant de ${totalPoolWon.toLocaleString('fr-FR')} F.`,
            'tontines'
          );
        }
      }

    }, 3500);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      
      {!selectedTontineId ? (
        // LIST OF AVAILABLE TONTINES
        <div className="space-y-4">
          
          {/* Admin panel triggers only for Admin/Super Admin roles */}
          {(currentUser.role === 'Admin' || currentUser.role === 'Super Admin') && (
            <div className="bg-slate-950 text-white rounded-3xl p-4 border border-slate-800 shadow-xl space-y-3.5 animate-fade-in">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider">
                    {currentUser.role === 'Super Admin' ? 'SUPER' : 'ADMIN'}
                  </div>
                  <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
                    Console d'Administration
                  </h3>
                </div>
                <button 
                  onClick={() => setShowAdminPanel(!showAdminPanel)}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold text-[9px] py-1 px-2.5 rounded-xl transition-all"
                >
                  {showAdminPanel ? 'Masquer' : 'Gérer Système ⚙️'}
                </button>
              </div>

              {showAdminPanel && (
                <div className="space-y-3.5 border-t border-white/10 pt-3">
                  {/* Tabs */}
                  <div className="flex border-b border-white/5 pb-2 gap-3 overflow-x-auto no-scrollbar">
                    <button
                      onClick={() => setAdminTab('create')}
                      className={`text-[10px] font-extrabold uppercase pb-1.5 border-b-2 shrink-0 transition-colors ${
                        adminTab === 'create' ? 'border-amber-400 text-amber-400' : 'border-transparent text-white/50 hover:text-white'
                      }`}
                    >
                      🚀 Lancer Tontine
                    </button>
                    <button
                      onClick={() => setAdminTab('members')}
                      className={`text-[10px] font-extrabold uppercase pb-1.5 border-b-2 shrink-0 transition-colors ${
                        adminTab === 'members' ? 'border-amber-400 text-amber-400' : 'border-transparent text-white/50 hover:text-white'
                      }`}
                    >
                      👥 Membres ({members.filter(m => m.status !== 'En attente').length})
                    </button>
                    <button
                      onClick={() => setAdminTab('approvals')}
                      className={`text-[10px] font-extrabold uppercase pb-1.5 border-b-2 shrink-0 transition-colors relative ${
                        adminTab === 'approvals' ? 'border-amber-400 text-amber-400' : 'border-transparent text-white/50 hover:text-white'
                      }`}
                    >
                      ⏳ Demandes
                      {members.some(m => m.status === 'En attente') && (
                        <span className="ml-1.5 px-1.5 py-0.2 bg-rose-500 text-white font-black rounded-full text-[8px] animate-pulse">
                          {members.filter(m => m.status === 'En attente').length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setAdminTab('logs')}
                      className={`text-[10px] font-extrabold uppercase pb-1.5 border-b-2 shrink-0 transition-colors ${
                        adminTab === 'logs' ? 'border-amber-400 text-amber-400' : 'border-transparent text-white/50 hover:text-white'
                      }`}
                    >
                      📜 Traçabilité
                    </button>
                  </div>

                  {/* Tab 1: Create Tontine */}
                  {adminTab === 'create' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[8px] font-bold uppercase text-white/50 mb-1 tracking-wider">Nom de la Tontine</label>
                        <input
                          type="text"
                          placeholder="Ex: Tontine Solidaire d'Argent"
                          value={newTontineName}
                          onChange={(e) => setNewTontineName(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] font-bold uppercase text-white/50 mb-1 tracking-wider">Type de tontine</label>
                          <select
                            value={newTontineType}
                            onChange={(e) => setNewTontineType(e.target.value as 'Argent' | 'Alimentaire')}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none"
                          >
                            <option value="Argent">💰 Argent</option>
                            <option value="Alimentaire">📦 Alimentaire</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold uppercase text-white/50 mb-1 tracking-wider">Fréquence</label>
                          <select
                            value={newTontineFreq}
                            onChange={(e) => setNewTontineFreq(e.target.value as 'Mensuelle' | 'Hebdomadaire')}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none"
                          >
                            <option value="Mensuelle">Mensuelle</option>
                            <option value="Hebdomadaire">Hebdomadaire</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] font-bold uppercase text-white/50 mb-1 tracking-wider">Mensualité</label>
                          <select
                            value={newTontineAmount}
                            onChange={(e) => setNewTontineAmount(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none"
                          >
                            <option value="10000">10 000 FCFA</option>
                            <option value="15000">15 000 FCFA</option>
                            <option value="25000">25 000 FCFA</option>
                            <option value="50000">50 000 FCFA</option>
                            <option value="100000">100 000 FCFA</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold uppercase text-white/50 mb-1 tracking-wider">Nombre de places</label>
                          <select
                            value={newTontinePlaces}
                            onChange={(e) => setNewTontinePlaces(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none"
                          >
                            <option value="5">5 places</option>
                            <option value="8">8 places</option>
                            <option value="10">10 places</option>
                            <option value="12">12 places</option>
                            <option value="15">15 places</option>
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={handleCreateTontine}
                        className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] py-2 rounded-xl uppercase transition-colors shadow-md mt-2"
                      >
                        Créer & Publier la Tontine 📢
                      </button>
                    </div>
                  )}

                  {/* Tab 2: Moderate Members */}
                  {adminTab === 'members' && (
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-[8px] font-bold uppercase text-white/50 mb-1 tracking-wider">Sélectionner un membre</label>
                        <select
                          value={selectedMemberId}
                          onChange={(e) => setSelectedMemberId(e.target.value)}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none"
                        >
                          {members.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} (Rôle: {m.role || 'Membre'})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Selected member detail row */}
                      {(() => {
                        const m = members.find(x => x.id === selectedMemberId);
                        if (!m) return null;
                        return (
                          <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-2.5">
                            <div className="flex items-center gap-2.5">
                              <img src={m.avatar || undefined} alt="" className="w-9 h-9 rounded-full object-cover border border-white/20 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-extrabold text-[11px] text-white leading-tight truncate">{m.name}</h4>
                                <div className="flex items-center gap-1 mt-0.5 text-[8px] font-semibold flex-wrap">
                                  <span className="text-emerald-400">Score : {m.reliabilityScore}%</span>
                                  <span className="text-white/40">•</span>
                                  <span className="text-[#40D1FF]">{m.role || 'Membre'}</span>
                                  {m.isVerifiedVendeuse && (
                                    <>
                                      <span className="text-white/40">•</span>
                                      <span className="text-amber-400">🤝 Vendeuse</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions buttons */}
                            <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-white/5">
                              <button
                                onClick={() => handleUpdateMemberScore(m.id, 5)}
                                className="bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 font-bold text-[9px] p-1.5 rounded-lg transition-all border border-emerald-500/20 active:scale-95"
                              >
                                Score +5% ⭐
                              </button>
                              <button
                                onClick={() => handleUpdateMemberScore(m.id, -5)}
                                className="bg-rose-600/30 hover:bg-rose-600 text-rose-300 font-bold text-[9px] p-1.5 rounded-lg transition-all border border-rose-500/20 active:scale-95"
                              >
                                Score -5% 📉
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                onClick={() => handleToggleVendeuseStatus(m.id)}
                                className={`font-bold text-[9px] p-1.5 rounded-lg transition-all border active:scale-95 ${
                                  m.isVerifiedVendeuse
                                    ? 'bg-amber-600/35 hover:bg-amber-600 text-amber-300 border-amber-500/20'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/5'
                                }`}
                              >
                                {m.isVerifiedVendeuse ? '❌ Retirer Vendeuse' : '🤝 Promouvoir Vendeuse'}
                              </button>

                              {/* Role upgrade/downgrade available only for Super Admin */}
                              {currentUser.role === 'Super Admin' ? (
                                <button
                                  onClick={() => handleToggleMemberRole(m.id)}
                                  className={`font-bold text-[9px] p-1.5 rounded-lg transition-all border active:scale-95 ${
                                    m.role === 'Admin'
                                      ? 'bg-blue-600/35 hover:bg-blue-600 text-blue-300 border-blue-500/25'
                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/5'
                                  }`}
                                >
                                  {m.role === 'Admin' ? '👤 Passer Membre' : '🛡️ Nommer Admin'}
                                </button>
                              ) : (
                                <div className="text-[8px] text-white/40 text-center flex items-center justify-center p-1 bg-white/2 rounded-lg border border-white/5 select-none font-bold">
                                  🛡️ S. Admin requis
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Tab 3: Pending Inscriptions & Role Attribution */}
                  {adminTab === 'approvals' && (
                    <div className="space-y-3.5 text-xs">
                      <div className="flex justify-between items-center pb-1.5 border-b border-white/5">
                        <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300">
                          Demandes d'inscription en attente
                        </h4>
                        <span className="text-[8px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full font-black">
                          {members.filter(m => m.status === 'En attente').length} DEMANDES
                        </span>
                      </div>

                      {members.filter(m => m.status === 'En attente').length === 0 ? (
                        <div className="py-8 px-4 bg-white/2 border border-white/5 rounded-2xl text-center flex flex-col items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
                            ✓
                          </div>
                          <p className="text-[10px] text-white/55 font-semibold">Aucune demande d'inscription en attente.</p>
                          <p className="text-[8px] text-white/30">Les nouvelles demandes d'inscription apparaîtront ici.</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                          {members.filter(m => m.status === 'En attente').map((m) => {
                            const currentAssignedRole = assignedRoles[m.id] || m.requestedRole || 'Membre';
                            return (
                              <div key={m.id} className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-3 transition-all hover:bg-white/8">
                                <div className="flex items-start gap-2.5">
                                  <img 
                                    src={m.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"} 
                                    alt="" 
                                    className="w-9 h-9 rounded-full object-cover border border-white/20 shrink-0 mt-0.5" 
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-extrabold text-[11px] text-white leading-tight truncate">{m.name}</h5>
                                    <p className="text-[9px] text-white/55 mt-0.5 font-mono">{m.phone || 'Pas de numéro'}</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <span className="text-[8px] font-bold text-white/40 uppercase">Rôle demandé :</span>
                                      <span className="text-[8px] font-extrabold text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded uppercase">
                                        {m.requestedRole || 'Membre'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-1.5 pt-2 border-t border-white/5">
                                  <label className="block text-[8px] font-bold uppercase text-white/40 tracking-wider">
                                    Attribuer le rôle final :
                                  </label>
                                  <select
                                    value={currentAssignedRole}
                                    onChange={(e) => setAssignedRoles(prev => ({ ...prev, [m.id]: e.target.value as UserRole }))}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-400"
                                  >
                                    <option value="Membre">👤 Membre ordinaire</option>
                                    <option value="Admin">🛡️ Administrateur</option>
                                    <option value="Super Admin">👑 Super Administrateur</option>
                                  </select>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1">
                                  <button
                                    onClick={() => {
                                      if (!setMembers) return;
                                      
                                      // Update in members list
                                      setMembers(prev => prev.map(x => {
                                        if (x.id === m.id) {
                                          return { ...x, status: 'Validé', role: currentAssignedRole };
                                        }
                                        return x;
                                      }));

                                      // If user being validated is currentUser
                                      if (currentUser.id === m.id) {
                                        setCurrentUser(prev => ({
                                          ...prev,
                                          status: 'Validé',
                                          role: currentAssignedRole
                                        }));
                                      }

                                      // Register validation log entry
                                      if (addSystemLog) {
                                        addSystemLog(
                                          'validation_compte',
                                          m.id,
                                          m.name,
                                          m.avatar,
                                          `Inscription approuvée par l'administration (${currentUser.name}). Rôle attribué : [${currentAssignedRole}]`
                                        );
                                      }

                                      if (triggerNotification) {
                                        triggerNotification(
                                          'transaction',
                                          '🎉 Compte Validé !',
                                          `Félicitations ${m.name}, votre inscription a été validée en tant que ${currentAssignedRole}.`,
                                          'home'
                                        );
                                      }
                                    }}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[9px] py-2 rounded-xl uppercase transition-colors flex items-center justify-center gap-1 active:scale-95"
                                  >
                                    <span>Valider ✓</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (!setMembers) return;
                                      
                                      // Filter out / Reject
                                      setMembers(prev => prev.filter(x => x.id !== m.id));

                                      if (currentUser.id === m.id) {
                                        setCurrentUser(prev => ({
                                          ...prev,
                                          status: 'Rejeté'
                                        }));
                                      }

                                      // Register rejection log entry
                                      if (addSystemLog) {
                                        addSystemLog(
                                          'rejet_compte',
                                          m.id,
                                          m.name,
                                          m.avatar,
                                          `Demande d'inscription de ${m.name} rejetée par ${currentUser.name}`
                                        );
                                      }

                                      if (triggerNotification) {
                                        triggerNotification(
                                          'alert',
                                          '❌ Demande Rejetée',
                                          `L'inscription de ${m.name} a été rejetée par l'administration.`,
                                          'home'
                                        );
                                      }
                                    }}
                                    className="bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white font-bold text-[9px] py-2 rounded-xl uppercase transition-colors flex items-center justify-center gap-1 active:scale-95 border border-rose-500/20"
                                  >
                                    <span>Rejeter ✕</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 4: Traceability Audit Trail */}
                  {adminTab === 'logs' && (
                    <div className="space-y-3.5 text-xs">
                      <div className="flex justify-between items-center pb-1.5 border-b border-white/5">
                        <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300">
                          Journal d'Activités & Traçabilité
                        </h4>
                        <span className="text-[8px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full font-black">
                          {systemLogs?.length || 0} ACTIONS
                        </span>
                      </div>

                      <div className="flex gap-1.5 mb-2 flex-wrap">
                        <span className="text-[8.5px] bg-white/5 text-white/70 px-2 py-0.5 rounded-full border border-white/5">💡 Filtre par défaut : Toutes</span>
                        <span className="text-[8.5px] bg-blue-400/10 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/25">👤 Comptes</span>
                        <span className="text-[8.5px] bg-emerald-400/10 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/25">💰 Cotisations</span>
                      </div>

                      {(!systemLogs || systemLogs.length === 0) ? (
                        <div className="py-8 px-4 bg-white/2 border border-white/5 rounded-2xl text-center">
                          <p className="text-[10px] text-white/55">Aucune action enregistrée pour le moment.</p>
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                          {systemLogs.map((log) => {
                            // Determine visual styling based on log type
                            let badgeColor = "bg-white/5 text-white/70";
                            let icon = "📝";
                            if (log.type === 'creation_compte') {
                              badgeColor = "bg-blue-500/15 text-blue-300 border border-blue-500/20";
                              icon = "👤";
                            } else if (log.type === 'validation_compte') {
                              badgeColor = "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20";
                              icon = "✅";
                            } else if (log.type === 'rejet_compte') {
                              badgeColor = "bg-rose-500/15 text-rose-300 border border-rose-500/20";
                              icon = "❌";
                            } else if (log.type === 'creation_tontine') {
                              badgeColor = "bg-amber-500/15 text-amber-300 border border-amber-500/20";
                              icon = "🚀";
                            } else if (log.type === 'cotisation') {
                              badgeColor = "bg-teal-500/15 text-teal-300 border border-teal-500/20";
                              icon = "💰";
                            } else if (log.type === 'changement_role') {
                              badgeColor = "bg-purple-500/15 text-purple-300 border border-purple-500/20";
                              icon = "🛡️";
                            }

                            return (
                              <div key={log.id} className="p-2.5 bg-white/5 border border-white/5 rounded-xl flex items-start gap-2.5 hover:bg-white/8 transition-all">
                                <img 
                                  src={log.userAvatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200"} 
                                  alt="" 
                                  className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 border border-white/10"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1 flex-wrap">
                                    <span className="font-extrabold text-[9.5px] text-white truncate">{log.userName}</span>
                                    <span className="text-[8px] text-white/40 font-medium font-mono">{log.timestamp}</span>
                                  </div>
                                  <p className="text-[10px] text-white/80 mt-1 leading-snug">{log.description}</p>
                                  <div className="flex items-center gap-1.5 mt-1.5">
                                    <span className={`text-[7px] font-extrabold uppercase px-1.5 py-0.2 rounded-sm ${badgeColor}`}>
                                      {icon} {log.type.replace('_', ' ')}
                                    </span>
                                    <span className="text-[7.5px] text-white/35 font-mono">ID: {log.id}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-[#0175C2]" />
            <h2 className="text-md font-bold text-slate-900">Nos Tontines Actives</h2>
          </div>

          <div className="space-y-3.5">
            {tontines.map(t => {
              const userPart = t.participants.find(p => p.memberId === 'user_current');
              const totalPool = t.contributionAmount * t.participants.length;
              const hasPaid = userPart?.hasPaidThisRound;

              return (
                <div 
                  key={t.id}
                  onClick={() => setSelectedTontineId(t.id)}
                  className="bg-white border border-slate-100 hover:border-slate-200 p-4 rounded-3xl cursor-pointer transition-all hover:scale-99 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                      t.type === 'Argent' 
                        ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                        : 'bg-teal-50 text-teal-700 border border-teal-100'
                    }`}>
                      {t.type === 'Argent' ? '💰 Argent' : '📦 Alimentaire'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {t.participants.length}/{t.totalPlaces} membres
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 mt-2.5 leading-tight">{t.name}</h3>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{t.description}</p>

                  <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex justify-between items-center text-[11px]">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-semibold uppercase">Mensualité</span>
                      <span className="font-extrabold text-[#02569B]">{t.contributionAmount.toLocaleString('fr-FR')} F</span>
                    </div>

                    <div className="text-center">
                      <span className="text-[9px] text-slate-400 block font-semibold uppercase">Cagnotte</span>
                      <span className="font-extrabold text-amber-600">{totalPool.toLocaleString('fr-FR')} F</span>
                    </div>

                    <div className="text-right">
                      {t.status === 'Recrutement' ? (
                        <span className="bg-blue-50 text-blue-600 text-[9px] px-2.5 py-0.5 rounded-full border border-blue-100 font-bold">
                          Recrutement
                        </span>
                      ) : hasPaid ? (
                        <span className="bg-emerald-50 text-emerald-600 text-[9px] px-2.5 py-0.5 rounded-full border border-emerald-100 font-bold">
                          Cotisé ✓
                        </span>
                      ) : (
                        <span className="bg-rose-50 text-rose-600 text-[9px] px-2.5 py-0.5 rounded-full border border-rose-100 font-bold animate-pulse">
                          Régler ⚠️
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-white border border-slate-100 rounded-3xl flex items-start gap-3 mt-4 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-900">Algorithme de tirage sécurisé</h4>
              <p className="text-[10px] text-slate-500 leading-normal">
                Nos tirages rotatifs sont 100% automatisés par algorithme. Une fois le tirage effectué, l'application génère un certificat numérique infalsifiable consultable à tout moment.
              </p>
            </div>
          </div>
        </div>
      ) : (
        // TONTINE DETAIL VIEW
        <div className="space-y-4">
          <button 
            onClick={() => {
              setSelectedTontineId(null);
              setWinner(null);
              setCertificate(null);
            }}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#0175C2] font-bold mb-2 bg-white border border-slate-100 rounded-xl py-1.5 px-3 w-fit transition-all active:scale-95 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux tontines
          </button>

          {selectedTontine && (
            <div className="space-y-4">
              
              {/* HEADER INFOS */}
              <div className="p-4 bg-white border border-slate-100 rounded-3xl space-y-3 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full ${
                    selectedTontine.type === 'Argent' ? 'bg-amber-50 text-amber-700' : 'bg-teal-50 text-teal-700'
                  }`}>
                    Tontine {selectedTontine.type}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Tirage : {selectedTontine.frequency}</span>
                  </div>
                </div>

                <h2 className="text-md font-extrabold text-slate-950 tracking-tight">{selectedTontine.name}</h2>
                <p className="text-[10px] text-slate-500 leading-relaxed">{selectedTontine.description}</p>
                
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">Cotisation</span>
                    <span className="text-xs font-bold text-[#02569B]">{selectedTontine.contributionAmount.toLocaleString('fr-FR')} F</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">Participants</span>
                    <span className="text-xs font-bold text-slate-800">{selectedTontine.participants.length} / {selectedTontine.totalPlaces}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">Cagnotte</span>
                    <span className="text-xs font-bold text-amber-600">{(selectedTontine.contributionAmount * selectedTontine.participants.length).toLocaleString('fr-FR')} F</span>
                  </div>
                </div>

                {/* USER PAYMENT STATUS & ACTION */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Mon Statut :</span>
                    {selectedTontine.participants.find(p => p.memberId === 'user_current')?.hasPaidThisRound ? (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                        <Check className="w-3.5 h-3.5" /> Cotisation Réglée ✓
                      </span>
                    ) : (
                      <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1 mt-0.5 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" /> Cotisation En Attente
                      </span>
                    )}
                  </div>

                  {!selectedTontine.participants.find(p => p.memberId === 'user_current')?.hasPaidThisRound && (
                    <button
                      onClick={() => handlePayContribution(selectedTontine)}
                      className="bg-[#0175C2] hover:bg-[#02569B] text-white font-bold text-[10px] px-3.5 py-2 rounded-xl flex items-center gap-1 shadow-md transition-all active:scale-95"
                    >
                      <Coins className="w-3.5 h-3.5" /> Payez {selectedTontine.contributionAmount.toLocaleString('fr-FR')} F
                    </button>
                  )}
                </div>
              </div>

              {/* AUTOMATED DRAW ACTIONS */}
              <div className="p-5 bg-gradient-to-r from-[#0175C2]/10 to-[#02569B]/10 border border-[#02569B]/15 rounded-3xl space-y-3.5 relative shadow-sm">
                <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#0175C2] animate-ping" />
                
                <div className="flex items-center gap-1.5 text-[#0175C2] text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Système de tirage automatisé</span>
                </div>

                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Lancer le tirage automatique une fois que les participantes sont prêtes. L'algorithme choisit un gagnant parmi les cotisantes à jour de paiement.
                </p>

                {/* ANIMATED DRAW PLATFORM */}
                {isDrawing && (
                  <div className="py-4 flex flex-col items-center justify-center bg-white border border-slate-100 rounded-2xl space-y-3 overflow-hidden shadow-inner">
                    <span className="text-[10px] text-[#0175C2] font-bold uppercase tracking-widest animate-pulse">
                      TIRAGE EN COURS...
                    </span>
                    
                    {/* Visual active candidate indicator */}
                    <div className="relative w-48 h-12 flex items-center justify-center bg-slate-50 border border-slate-150 rounded-xl shadow-inner overflow-hidden">
                      <AnimatePresence mode="popLayout">
                        <motion.div 
                          key={activeCandidateIndex}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -20, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="flex items-center gap-2"
                        >
                          <img 
                            src={drawCandidates[activeCandidateIndex]?.avatar || undefined} 
                            alt="" 
                            className="w-7 h-7 rounded-full object-cover border border-[#0175C2]"
                          />
                          <span className="text-xs font-bold text-slate-800">
                            {drawCandidates[activeCandidateIndex]?.name}
                          </span>
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    <div className="text-[9px] text-slate-400 font-semibold">Sélection aléatoire via algorithme ASSI</div>
                  </div>
                )}

                {/* WINNER SHOWCASE */}
                {winner && !isDrawing && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl text-center space-y-2 animate-bounce-short shadow-sm">
                    <div className="text-emerald-700 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                      <Sparkles className="w-4 h-4 text-emerald-500" /> Gagnante Désignée ! <Sparkles className="w-4 h-4 text-emerald-500" />
                    </div>
                    
                    <div className="flex items-center justify-center gap-3 py-1">
                      <img 
                        src={winner.avatar || undefined} 
                        alt={winner.name} 
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500"
                      />
                      <div className="text-left">
                        <h4 className="text-xs font-extrabold text-slate-850">{winner.name}</h4>
                        <span className="text-[9px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 font-bold">
                          Fiabilité {winner.reliabilityScore}%
                        </span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-600">
                      Gagne la cagnotte globale de : <span className="font-bold text-amber-600">{(selectedTontine.contributionAmount * selectedTontine.participants.length).toLocaleString('fr-FR')} FCFA</span>
                    </p>
                  </div>
                )}

                {/* ACTIONS */}
                {!isDrawing && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLaunchDraw(selectedTontine)}
                      className="flex-1 bg-[#0175C2] hover:bg-[#02569B] text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow transition-transform active:scale-95"
                    >
                      <Play className="w-4 h-4" /> Lancer le tirage
                    </button>
                    {certificate && (
                      <button
                        onClick={() => {}}
                        className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs p-2.5 rounded-xl transition-transform active:scale-95"
                        title="Voir le Certificat"
                      >
                        <FileText className="w-4 h-4 text-[#0175C2]" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* DRAWING CERTIFICATE DISPLAY */}
              {certificate && (
                <div className="p-4 bg-white text-slate-900 rounded-3xl border-2 border-amber-400/70 shadow-lg space-y-3 relative overflow-hidden font-serif">
                  {/* Subtle stamp water mark */}
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 border-4 border-emerald-600/30 text-emerald-600/30 rounded-full flex items-center justify-center font-bold text-[10px] uppercase rotate-12 select-none pointer-events-none">
                    VÉRIFIÉ
                  </div>

                  <div className="text-center border-b border-slate-200 pb-2">
                    <span className="text-[8px] font-sans font-bold text-slate-500 uppercase tracking-wider block">ASSI TONTINE MOBILE</span>
                    <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">CERTIFICAT DE TIRAGE</h3>
                    <span className="text-[8px] font-mono text-amber-600 font-semibold">{certificate.id}</span>
                  </div>

                  <div className="text-[10px] space-y-1.5 font-sans leading-normal">
                    <p>
                      Nous certifions que le tirage automatisé de la tontine <span className="font-bold">{certificate.tontineName}</span> s'est déroulé de manière totalement équitable ce jour.
                    </p>
                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded border border-slate-100">
                      <img src={certificate.winnerAvatar || undefined} alt="" className="w-7 h-7 rounded-full object-cover" />
                      <div>
                        <span className="text-[8px] text-slate-500 block">Gagnante du cycle</span>
                        <span className="text-xs font-bold text-slate-900">{certificate.winnerName}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span>Montant attribué :</span>
                      <span className="font-extrabold text-emerald-600">{certificate.amount.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div className="flex justify-between text-[10px] pt-1 border-t border-slate-100">
                      <span>Date de validation :</span>
                      <span>{certificate.date}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-end pt-2 border-t border-dashed border-slate-200 text-[8px] font-sans text-slate-400">
                    <div>
                      <span>Signature Algorithmique</span>
                      <span className="block font-mono text-slate-900 font-semibold">✓ CONFIRMÉ</span>
                    </div>
                    <button 
                      onClick={() => alert("Certificat enregistré dans la galerie de votre smartphone !")}
                      className="bg-slate-900 text-white font-sans font-bold px-2 py-1.5 rounded text-[8px] flex items-center gap-0.5 hover:bg-slate-800 transition-colors"
                    >
                      <Download className="w-3 h-3" /> Télécharger
                    </button>
                  </div>
                </div>
              )}

              {/* PARTICIPANTS CHECKLIST */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Membres de la tontine</h3>
                  <span className="text-[10px] text-[#0175C2] font-bold">{selectedTontine.participants.length} Participant(e)s</span>
                </div>

                <div className="space-y-2">
                  {selectedTontine.participants.map(p => {
                    const member = getMemberDetails(p.memberId);
                    const rel = getReliabilityStar(member.reliabilityScore);

                    return (
                      <div 
                        key={p.memberId}
                        className="bg-white border border-slate-100 p-2.5 rounded-2xl flex items-center justify-between shadow-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={member.avatar || undefined} 
                            alt={member.name} 
                            className="w-9 h-9 rounded-full object-cover border border-slate-100"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold text-slate-900">{member.name}</h4>
                              {p.memberId === 'user_current' && (
                                <span className="text-[8px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.2 rounded">Moi</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={`text-[8px] px-2 py-0.2 rounded-full border font-semibold ${rel.color}`}>
                                {member.reliabilityScore}% - {rel.label}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          {p.hasPaidThisRound ? (
                            <span className="bg-emerald-50 text-emerald-600 text-[9px] px-2.5 py-0.5 rounded-full border border-emerald-100 font-bold flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Payé
                            </span>
                          ) : (
                            <span className="bg-rose-50 text-rose-600 text-[9px] px-2.5 py-0.5 rounded-full border border-rose-100 font-bold flex items-center gap-0.5">
                              <X className="w-3 h-3" /> Impayé
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RECENT ROTATING DRAW HISTORY */}
              {selectedTontine.drawHistory.length > 0 && (
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl space-y-2 shadow-sm">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Historique des gains (Rotation)</span>
                  <div className="space-y-1.5">
                    {selectedTontine.drawHistory.map((winnerId, idx) => {
                      const m = getMemberDetails(winnerId);
                      return (
                        <div key={idx} className="flex justify-between items-center text-[11px] py-1 border-b border-slate-100 last:border-0">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <span className="text-[9px] font-mono font-bold text-slate-400">#{idx + 1}</span>
                            <img src={m.avatar || undefined} alt="" className="w-4 h-4 rounded-full object-cover" />
                            <span className="font-semibold">{m.name}</span>
                          </div>
                          <span className="text-emerald-600 font-bold">
                            +{(selectedTontine.contributionAmount * selectedTontine.participants.length).toLocaleString('fr-FR')} F
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}

    </div>
  );
}
