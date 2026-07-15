import React, { useState } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  History, 
  Gift, 
  Smartphone, 
  Check, 
  Copy, 
  ArrowRight,
  Award,
  Users
} from 'lucide-react';
import { Transaction, UserProfile } from '../types';

interface WalletScreenProps {
  currentUser: UserProfile;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  addTransaction: (type: 'Recharge' | 'Paiement Tontine' | 'Achat Boutique' | 'Réception Tontine' | 'Bonus Parrainage', amount: number, description: string) => void;
  triggerNotification?: (type: 'tontine' | 'chat' | 'transaction' | 'alert', title: string, message: string, linkToTab?: string) => void;
}

export default function WalletScreen({
  currentUser,
  setCurrentUser,
  transactions,
  setTransactions,
  addTransaction,
  triggerNotification
}: WalletScreenProps) {
  const [activeTab, setActiveTab] = useState<'wallet' | 'parrainage'>('wallet');
  
  // Recharge modal states
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeStep, setRechargeStep] = useState<1 | 2 | 3>(1); // 1: Info, 2: Redirection / Validation, 3: Success
  const [rechargeOperator, setRechargeOperator] = useState<'Moov' | 'Orange' | 'Wave'>('Orange');
  const [rechargePhone, setRechargePhone] = useState('+226 70 00 00 00');
  const [rechargeAmount, setRechargeAmount] = useState('20000');
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [paymentCheckoutUrl, setPaymentCheckoutUrl] = useState('');

  // Code input states
  const [referralInput, setReferralInput] = useState('');
  const [referralSuccessMsg, setReferralSuccessMsg] = useState('');

  const [hasCopiedCode, setHasCopiedCode] = useState(false);

  // Mock referrals list
  const mockReferrals = [
    { name: 'Maman Beatrice', date: '14/07/2026', status: 'Actif', bonus: '+250 pts' },
    { name: 'Maman Georgette', date: '10/07/2026', status: 'Actif', bonus: '+250 pts' },
    { name: 'Maman Sidonie', date: '05/07/2026', status: 'En attente', bonus: '0 pts' },
  ];

  // Copy referral code mockup
  const handleCopyCode = () => {
    setHasCopiedCode(true);
    setTimeout(() => setHasCopiedCode(false), 2000);
  };

  // Process mobile money recharge
  const handleRechargeSubmit = async () => {
    const amt = parseFloat(rechargeAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Veuillez saisir un montant valide.");
      return;
    }

    setIsLoadingPayment(true);
    try {
      const response = await fetch('/api/payment/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          phoneNumber: rechargePhone,
          operator: rechargeOperator,
          customerName: currentUser.name
        })
      });

      const data = await response.json();
      if (response.ok && data.success && data.transaction?.payment_url) {
        setPaymentCheckoutUrl(data.transaction.payment_url);
        setRechargeStep(2); // Go to payment redirection screen
      } else {
        alert(data.error || "Une erreur est survenue lors de l'initialisation du paiement.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Erreur de connexion avec le serveur de paiement.");
    } finally {
      setIsLoadingPayment(false);
    }
  };

  const handlePinValidation = () => {
    // This is kept as a local backup or quick payment validation bypass
    const amt = parseFloat(rechargeAmount);

    // Credit user balance
    setCurrentUser(prev => ({
      ...prev,
      walletBalance: prev.walletBalance + amt
    }));

    // Register transaction
    addTransaction(
      'Recharge',
      amt,
      `Recharge de compte via ${rechargeOperator} Money`
    );

    if (triggerNotification) {
      triggerNotification(
        'transaction',
        '💳 Recharge Réussie !',
        `Votre portefeuille a été crédité de ${amt.toLocaleString('fr-FR')} F via ${rechargeOperator} Money.`,
        'wallet'
      );
    }

    setRechargeStep(3); // Success screen
  };

  const applyReferralCode = () => {
    if (referralInput.trim().toUpperCase() === 'NMI-2026' || referralInput.trim().toUpperCase() === 'PROMO') {
      setCurrentUser(prev => ({
        ...prev,
        walletBalance: prev.walletBalance + 2000,
        points: prev.points + 50
      }));
      setReferralSuccessMsg("Félicitations ! Code validé. Vous recevez un bonus de bienvenue de +2 000 FCFA et le badge 'Nouvelle Maman' ! 🎉");
      
      if (triggerNotification) {
        triggerNotification(
          'alert',
          '🎁 Bonus de Bienvenue !',
          'Félicitations ! Votre code promo a été validé (+2 000 FCFA crédités).',
          'wallet'
        );
      }
      
      setReferralInput('');
    } else {
      alert("Code de parrainage non valide ou expiré.");
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'Recharge':
      case 'Réception Tontine':
      case 'Bonus Parrainage':
        return 'text-emerald-700 bg-emerald-50 border-emerald-100';
      default:
        return 'text-rose-700 bg-rose-50 border-rose-100';
    }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      
      {/* DOUBLE HEADER TABS */}
      <div className="flex bg-slate-150/80 p-1 rounded-2xl gap-1">
        <button
          onClick={() => setActiveTab('wallet')}
          className={`flex-1 text-center py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'wallet' 
              ? 'bg-white text-[#0175C2] shadow-sm font-extrabold' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          Mon Portefeuille
        </button>
        <button
          onClick={() => setActiveTab('parrainage')}
          className={`flex-1 text-center py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'parrainage' 
              ? 'bg-white text-[#0175C2] shadow-sm font-extrabold' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          Parrainage & Points
        </button>
      </div>

      {activeTab === 'wallet' && (
        <div className="space-y-4">
          
          {/* BALANCE CARD (Vibrant Blue Premium Design) */}
          <div className="p-5 bg-gradient-to-r from-[#0468D7] to-[#02569B] text-white rounded-3xl flex flex-col justify-between h-40 relative overflow-hidden shadow-lg shadow-blue-900/10">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -left-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />

            <div className="flex justify-between items-start text-xs text-blue-100">
              <span>Solde Courant ASSI Wallet</span>
              <span className="font-mono text-[9px] bg-white/15 px-2 py-0.5 rounded text-white font-bold">FCFA</span>
            </div>

            <div className="my-1">
              <span className="text-[10px] text-blue-200 block font-bold uppercase tracking-wider">Solde Disponible</span>
              <span className="text-3xl font-extrabold tracking-tight">
                {currentUser.walletBalance.toLocaleString('fr-FR')} F
              </span>
            </div>

            <button
              onClick={() => {
                setRechargeStep(1);
                setShowRechargeModal(true);
              }}
              className="bg-[#40D1FF] hover:bg-[#40D1FF]/90 text-blue-950 font-extrabold text-[11px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all hover:scale-102 active:scale-95 self-start"
            >
              <ArrowUpRight className="w-4 h-4" /> Recharger mon compte
            </button>
          </div>

          {/* QUICK TRANSACTIONS HISTORY */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 pl-1 mb-1">
              <History className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Historique des transactions</h3>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto no-scrollbar">
              {transactions.map(tx => {
                const isPositive = tx.type === 'Recharge' || tx.type === 'Réception Tontine' || tx.type === 'Bonus Parrainage';
                return (
                  <div 
                    key={tx.id}
                    className="p-3.5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between gap-2.5 shadow-sm hover:border-slate-200/60 transition-all"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[8px] font-bold px-1.5 py-0.2 border rounded ${getTransactionColor(tx.type)}`}>
                          {tx.type}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold">{tx.date}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 truncate max-w-[190px]">{tx.description}</h4>
                    </div>

                    <span className={`text-xs font-extrabold shrink-0 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isPositive ? '+' : '-'}{tx.amount.toLocaleString('fr-FR')} F
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {activeTab === 'parrainage' && (
        <div className="space-y-4">
          
          {/* USER REFERRAL CODE */}
          <div className="p-5 bg-white border border-slate-100 rounded-3xl text-center space-y-3.5 shadow-sm">
            <div className="flex items-center justify-center gap-1.5 text-[#0175C2] text-[10px] font-bold uppercase tracking-wider">
              <Award className="w-4 h-4 animate-bounce" />
              <span>Mon Code de Parrainage</span>
            </div>

            <div className="flex items-center justify-center gap-2 bg-slate-50 border border-slate-100 p-3 rounded-2xl max-w-[200px] mx-auto">
              <span className="text-sm font-mono font-extrabold text-[#02569B] tracking-widest">
                {currentUser.referralCode}
              </span>
              <button 
                onClick={handleCopyCode}
                className="text-slate-400 hover:text-[#0175C2] transition-colors"
                title="Copier le code"
              >
                {hasCopiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed max-w-[260px] mx-auto">
              Partagez votre code unique. Lorsqu'une nouvelle maman s'inscrit avec ce code : vous recevez <span className="font-bold text-emerald-600">5 000 FCFA</span> de bonus et augmentez vos points de fidélité !
            </p>
          </div>

          {/* INPUT TO APPLY A SPONSOR CODE */}
          <div className="p-5 bg-white border border-slate-100 rounded-3xl space-y-3 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800">Saisir un code de parrainage</h3>
            
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex : NMI-2026 ou PROMO"
                value={referralInput}
                onChange={(e) => setReferralInput(e.target.value)}
                className="flex-1 bg-slate-50 text-xs text-slate-800 px-3.5 py-2 rounded-xl border border-slate-150 focus:outline-none focus:border-slate-300 font-mono tracking-widest uppercase font-semibold"
              />
              <button
                onClick={applyReferralCode}
                className="bg-[#0175C2] hover:bg-[#02569B] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all active:scale-95 shrink-0"
              >
                Valider
              </button>
            </div>

            {referralSuccessMsg && (
              <div className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 p-2.5 rounded-xl leading-relaxed animate-fade-in font-medium">
                {referralSuccessMsg}
              </div>
            )}
          </div>

          {/* REF HISTORY */}
          <div className="space-y-2">
            <div className="flex justify-between items-center pl-1 mb-1 text-slate-500">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Mes Filleules ({currentUser.referralsCount})</h3>
              </div>
              <span className="text-[10px] text-[#0175C2] font-bold">Total : {currentUser.points} pts fidélité</span>
            </div>

            <div className="space-y-2">
              {mockReferrals.map((r, idx) => (
                <div key={idx} className="p-3.5 bg-white border border-slate-100 rounded-2xl flex justify-between items-center shadow-sm">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800">{r.name}</h4>
                    <span className="text-[9px] text-slate-400 font-medium">Inscrite le {r.date}</span>
                  </div>

                  <div className="text-right">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block ${
                      r.status === 'Actif' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {r.status}
                    </span>
                    <span className="block text-[10px] font-bold text-[#0175C2] mt-1">{r.bonus}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* RECHARGE SYSTEM MODAL PANEL */}
      {showRechargeModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-[340px] bg-white border border-slate-100 rounded-3xl p-5 shadow-2xl space-y-4 animate-scale-up text-slate-800">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-[#0175C2] font-bold text-xs uppercase">
                <Smartphone className="w-4 h-4" />
                <span>Recharge Mobile Money</span>
              </div>
              <button 
                onClick={() => setShowRechargeModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* STEP 1: DEFINE OPERATOR AND AMOUNT */}
            {rechargeStep === 1 && (
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] block mb-1.5 font-bold uppercase tracking-wider">1. Choisissez un opérateur :</span>
                  <div className="grid grid-cols-3 gap-2">
                    {['Orange', 'Moov', 'Wave'].map((op) => (
                      <button
                        key={op}
                        onClick={() => setRechargeOperator(op as any)}
                        className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${
                          rechargeOperator === op 
                            ? 'bg-[#0175C2]/10 border-[#0175C2] text-[#0175C2] shadow-sm font-extrabold' 
                            : 'bg-slate-50 border-slate-100 text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {op === 'Orange' && '🟠 Orange'}
                        {op === 'Moov' && '🟢 Moov'}
                        {op === 'Wave' && '🔵 Wave'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] block mb-1.5 font-bold uppercase tracking-wider">2. Numéro de téléphone (ex: BF/AOF) :</span>
                  <input
                    type="tel"
                    value={rechargePhone}
                    onChange={(e) => setRechargePhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-slate-700 font-mono tracking-wider focus:outline-none focus:border-[#0175C2] font-semibold"
                  />
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] block mb-1.5 font-bold uppercase tracking-wider">3. Montant à créditer (FCFA) :</span>
                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    {['5000', '10000', '25000'].map(amt => (
                      <button
                        key={amt}
                        onClick={() => setRechargeAmount(amt)}
                        className="py-1 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-700 transition-colors"
                      >
                        +{parseFloat(amt).toLocaleString('fr-FR')} F
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl p-2.5 text-[#02569B] font-extrabold text-sm focus:outline-none focus:border-[#0175C2]"
                  />
                </div>

                <button
                  onClick={handleRechargeSubmit}
                  disabled={isLoadingPayment}
                  className="w-full bg-[#0175C2] hover:bg-[#02569B] text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 shadow-md transition-all active:scale-95 mt-2 disabled:opacity-50"
                >
                  {isLoadingPayment ? 'Initialisation...' : 'Générer facture'} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* STEP 2: SECURE REDIRECTION */}
            {rechargeStep === 2 && (
              <div className="space-y-4 text-xs text-center py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600 text-2xl animate-pulse">
                  📲
                </div>
                
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900">Facture générée !</h4>
                  <p className="text-slate-500 text-[10px] leading-relaxed max-w-[240px] mx-auto">
                    Le paiement de recharge est prêt. Veuillez cliquer ci-dessous pour payer en toute sécurité.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-left space-y-1.5">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Opérateur :</span>
                    <span className="font-bold text-slate-800">{rechargeOperator} Money</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Numéro :</span>
                    <span className="font-mono font-bold text-slate-800">{rechargePhone}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Montant :</span>
                    <span className="font-extrabold text-emerald-600">{parseFloat(rechargeAmount).toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>

                <a
                  href={paymentCheckoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-700/10 transition-all hover:scale-102 active:scale-95 mt-2"
                >
                  🔗 Procéder au Paiement Sécurisé
                </a>

                <p className="text-[9px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-100 font-semibold leading-normal">
                  Redirection sécurisée via FedaPay. Après confirmation, votre compte ASSI Wallet sera automatiquement crédité.
                </p>

                <div className="flex gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => setRechargeStep(1)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-600 transition-all active:scale-95"
                  >
                    Retour
                  </button>
                  <button
                    onClick={handlePinValidation}
                    className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl font-bold border border-slate-150 transition-all active:scale-95"
                    title="Simulation rapide"
                  >
                    Bypass de test 🧪
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SUCCESS CONFIRMATION */}
            {rechargeStep === 3 && (
              <div className="space-y-4 text-xs text-center py-2 animate-scale-up">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-500 text-2xl">
                  ✓
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900">Recharge Réussie ! 🎉</h4>
                  <p className="text-slate-500 text-[10px] leading-relaxed">
                    Votre portefeuille ASSI Wallet a été crédité avec succès.
                  </p>
                </div>

                <div className="text-sm font-extrabold text-emerald-600 font-mono">
                  +{parseFloat(rechargeAmount).toLocaleString('fr-FR')} FCFA
                </div>

                <button
                  onClick={() => setShowRechargeModal(false)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
