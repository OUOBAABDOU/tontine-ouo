import React, { useState, useEffect } from 'react';
import PhoneFrame from './components/PhoneFrame';
import DashboardScreen from './components/DashboardScreen';
import TontineScreen from './components/TontineScreen';
import BoutiqueScreen from './components/BoutiqueScreen';
import CommunityScreen from './components/CommunityScreen';
import ChatScreen from './components/ChatScreen';
import WalletScreen from './components/WalletScreen';
import RegisterScreen from './components/RegisterScreen';
import PendingApprovalScreen from './components/PendingApprovalScreen';
import AppLockScreen from './components/AppLockScreen';

import { 
  INITIAL_USER, 
  INITIAL_TONTINES, 
  INITIAL_PRODUCTS, 
  INITIAL_POSTS, 
  INITIAL_CHATS, 
  INITIAL_TRANSACTIONS,
  MOCK_MEMBERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SYSTEM_LOGS
} from './data/mockData';
import { UserProfile, Tontine, Product, Post, ChatThread, Transaction, SubscriptionTier, AppNotification, Member, SystemLog } from './types';

// Real Firestore backend integrations
import { doc, getDocFromServer } from 'firebase/firestore';
import { 
  db,
  auth,
  ensureSignedInAnonymously,
  seedFirestore,
  syncUserProfile,
  saveUserProfile,
  updateUserProfile,
  syncMembers,
  syncTontines,
  saveTontine,
  syncPosts,
  savePost,
  syncChats,
  saveChatThread,
  syncSystemLogs,
  saveSystemLog,
  syncTransactions,
  saveTransaction,
  syncNotifications,
  saveNotification
} from './lib/firebase';

export default function App() {
  const [currentUser, setCurrentUserLocal] = useState<UserProfile>(INITIAL_USER);
  const [isAppUnlocked, setIsAppUnlocked] = useState<boolean>(false);
  const [tontines, setTontinesLocal] = useState<Tontine[]>(INITIAL_TONTINES);
  const [members, setMembersLocal] = useState<Member[]>(MOCK_MEMBERS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [posts, setPostsLocal] = useState<Post[]>(INITIAL_POSTS);
  const [chats, setChatsLocal] = useState<ChatThread[]>(INITIAL_CHATS);
  const [transactions, setTransactionsLocal] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [systemLogs, setSystemLogsLocal] = useState<SystemLog[]>(INITIAL_SYSTEM_LOGS);
  
  const [notifications, setNotificationsLocal] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);

  const [activeTab, setActiveTab] = useState<string>('home');
  const [boutiqueCategory, setBoutiqueCategory] = useState<'Kits Alimentaires' | 'Produits Individuels'>('Kits Alimentaires');

  const [firebaseReady, setFirebaseReady] = useState(false);
  const [authUid, setAuthUid] = useState<string | null>(null);

  // Initialize Firebase and seed if empty
  useEffect(() => {
    async function initFirebase() {
      const user = await ensureSignedInAnonymously();
      if (user) {
        setAuthUid(user.uid);
        // Seed Firestore if tontines collection is empty
        await seedFirestore(
          INITIAL_TONTINES,
          MOCK_MEMBERS,
          INITIAL_POSTS,
          INITIAL_CHATS,
          INITIAL_SYSTEM_LOGS
        );
        setFirebaseReady(true);
      }
    }
    initFirebase();
  }, []);

  // Sync global collections from Firestore in real-time
  useEffect(() => {
    if (!firebaseReady) return;

    const unsubMembers = syncMembers((newList) => {
      if (newList.length > 0) setMembersLocal(newList);
    });

    const unsubTontines = syncTontines((newList) => {
      if (newList.length > 0) setTontinesLocal(newList);
    });

    const unsubPosts = syncPosts((newList) => {
      if (newList.length > 0) setPostsLocal(newList);
    });

    const unsubChats = syncChats((newList) => {
      if (newList.length > 0) setChatsLocal(newList);
    });

    const unsubLogs = syncSystemLogs((newList) => {
      if (newList.length > 0) setSystemLogsLocal(newList);
    });

    return () => {
      unsubMembers();
      unsubTontines();
      unsubPosts();
      unsubChats();
      unsubLogs();
    };
  }, [firebaseReady]);

  // Sync user profile and user-specific subcollections in real-time
  useEffect(() => {
    if (!firebaseReady || !authUid) return;

    const unsubProfile = syncUserProfile(authUid, async (profile) => {
      if (profile) {
        setCurrentUserLocal(profile);
      } else {
        // Initial setup for the user: Maman Marie (Super Admin)
        const defaultProfile: UserProfile = {
          ...INITIAL_USER,
          id: authUid,
          referralCode: `MARIE-${authUid.substring(0, 4).toUpperCase()}`
        };
        await saveUserProfile(authUid, defaultProfile);
      }
    });

    const unsubTx = syncTransactions(authUid, (newList) => {
      setTransactionsLocal(newList);
    });

    const unsubNotif = syncNotifications(authUid, (newList) => {
      setNotificationsLocal(newList);
    });

    return () => {
      unsubProfile();
      unsubTx();
      unsubNotif();
    };
  }, [firebaseReady, authUid]);

  // Handle mobile money payment redirect success or cancellation
  useEffect(() => {
    if (!firebaseReady || !authUid) return;

    const params = new URLSearchParams(window.location.search);
    const status = params.get('payment_status');
    const amtStr = params.get('amount');
    const txId = params.get('tx_id');

    if (status === 'success' && amtStr) {
      const amt = parseFloat(amtStr);
      if (!isNaN(amt)) {
        const processedKey = `processed_tx_${txId}`;
        if (!localStorage.getItem(processedKey)) {
          localStorage.setItem(processedKey, 'true');

          const updateBalanceAndTx = async () => {
            const currentBalance = currentUser.walletBalance || 0;
            const newBalance = currentBalance + amt;

            await updateUserProfile(authUid, { walletBalance: newBalance });
            await saveTransaction(authUid, {
              id: txId || `tx_${Date.now()}`,
              type: 'Recharge',
              amount: amt,
              date: new Date().toISOString().split('T')[0],
              description: `Recharge réussie de ${amt.toLocaleString('fr-FR')} FCFA via Mobile Money`
            });

            triggerNotification(
              'transaction',
              '💳 Recharge Réussie !',
              `Votre portefeuille a été crédité de ${amt.toLocaleString('fr-FR')} F via Mobile Money.`,
              'wallet'
            );

            window.history.replaceState({}, document.title, window.location.pathname);
          };

          updateBalanceAndTx();
        }
      }
    } else if (status === 'cancelled') {
      triggerNotification(
        'alert',
        '✕ Paiement Annulé',
        'La transaction de recharge mobile money a été annulée.',
        'wallet'
      );
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [firebaseReady, authUid, currentUser.walletBalance]);

  // Automatically clear activeToast after 4 seconds
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  // Firestore-backed notification trigger
  const triggerNotification = async (
    type: 'tontine' | 'chat' | 'transaction' | 'alert',
    title: string,
    message: string,
    linkToTab?: string
  ) => {
    if (!authUid) return;
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      title,
      message,
      timestamp: "À l'instant",
      isRead: false,
      linkToTab
    };
    await saveNotification(authUid, newNotif);
    setActiveToast(newNotif);
  };

  // Firestore-backed transaction tracker
  const addTransaction = async (
    type: 'Recharge' | 'Paiement Tontine' | 'Achat Boutique' | 'Réception Tontine' | 'Bonus Parrainage',
    amount: number,
    description: string
  ) => {
    if (!authUid) return;
    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      type,
      amount,
      date: new Date().toISOString().split('T')[0],
      description
    };
    await saveTransaction(authUid, newTx);
  };

  // Firestore-backed system logs
  const addSystemLog = async (
    type: 'creation_compte' | 'validation_compte' | 'creation_tontine' | 'cotisation' | 'retrait_wallet' | 'changement_role' | 'rejet_compte' | 'divers',
    userId: string,
    userName: string,
    userAvatar: string,
    description: string
  ) => {
    const newLog: SystemLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      userId,
      userName,
      userAvatar,
      description,
      timestamp: "À l'instant"
    };
    await saveSystemLog(newLog);
  };

  // Helper to change subscription tier and adjust limits in Firestore
  const setSubscriptionTier = async (tier: SubscriptionTier) => {
    if (!authUid) return;
    await updateUserProfile(authUid, { tier });
  };

  // Firestore-backed state interceptor for tontines
  const setTontines = async (value: Tontine[] | ((prev: Tontine[]) => Tontine[])) => {
    const nextVal = typeof value === 'function' ? value(tontines) : value;
    setTontinesLocal(nextVal);
    if (firebaseReady) {
      for (const t of nextVal) {
        const existing = tontines.find(old => old.id === t.id);
        if (!existing || JSON.stringify(existing) !== JSON.stringify(t)) {
          await saveTontine(t);
        }
      }
    }
  };

  // Firestore-backed state interceptor for members/users
  const setMembers = async (value: Member[] | ((prev: Member[]) => Member[])) => {
    const nextVal = typeof value === 'function' ? value(members) : value;
    setMembersLocal(nextVal);
    if (firebaseReady) {
      for (const m of nextVal) {
        const existing = members.find(old => old.id === m.id);
        if (!existing || JSON.stringify(existing) !== JSON.stringify(m)) {
          const userDocRef = doc(db, 'users', m.id);
          const docSnap = await getDocFromServer(userDocRef).catch(() => null);
          const currentData = docSnap?.exists() ? docSnap.data() : {};
          
          await saveUserProfile(m.id, {
            id: m.id,
            name: m.name,
            avatar: m.avatar,
            tier: m.tier,
            reliabilityScore: m.reliabilityScore,
            walletBalance: currentData.walletBalance ?? 15000,
            referralCode: currentData.referralCode ?? `${m.name.split(' ')[0].toUpperCase()}-${Math.floor(100+Math.random()*900)}`,
            points: currentData.points ?? 50,
            referralsCount: currentData.referralsCount ?? 0,
            role: m.role || 'Membre',
            status: m.status || 'Validé',
            phone: m.phone || currentData.phone || '+226 70 00 00 00',
            requestedRole: m.requestedRole || currentData.requestedRole || m.role,
            pinCode: m.pinCode || currentData.pinCode || '1234'
          });
        }
      }
    }
  };

  // Firestore-backed state interceptor for posts
  const setPosts = async (value: Post[] | ((prev: Post[]) => Post[])) => {
    const nextVal = typeof value === 'function' ? value(posts) : value;
    setPostsLocal(nextVal);
    if (firebaseReady) {
      for (const p of nextVal) {
        const existing = posts.find(old => old.id === p.id);
        if (!existing || JSON.stringify(existing) !== JSON.stringify(p)) {
          await savePost(p);
        }
      }
    }
  };

  // Firestore-backed state interceptor for chats
  const setChats = async (value: ChatThread[] | ((prev: ChatThread[]) => ChatThread[])) => {
    const nextVal = typeof value === 'function' ? value(chats) : value;
    setChatsLocal(nextVal);
    if (firebaseReady) {
      for (const c of nextVal) {
        const existing = chats.find(old => old.id === c.id);
        if (!existing || JSON.stringify(existing) !== JSON.stringify(c)) {
          await saveChatThread(c);
        }
      }
    }
  };

  // Firestore-backed state interceptor for transactions
  const setTransactions = async (value: Transaction[] | ((prev: Transaction[]) => Transaction[])) => {
    const nextVal = typeof value === 'function' ? value(transactions) : value;
    setTransactionsLocal(nextVal);
    if (firebaseReady && authUid) {
      for (const tx of nextVal) {
        const existing = transactions.find(old => old.id === tx.id);
        if (!existing || JSON.stringify(existing) !== JSON.stringify(tx)) {
          await saveTransaction(authUid, tx);
        }
      }
    }
  };

  // Firestore-backed state interceptor for notifications
  const setNotifications = async (value: AppNotification[] | ((prev: AppNotification[]) => AppNotification[])) => {
    const nextVal = typeof value === 'function' ? value(notifications) : value;
    setNotificationsLocal(nextVal);
    if (firebaseReady && authUid) {
      for (const n of nextVal) {
        const existing = notifications.find(old => old.id === n.id);
        if (!existing || JSON.stringify(existing) !== JSON.stringify(n)) {
          await saveNotification(authUid, n);
        }
      }
    }
  };

  const setCurrentUser = async (value: UserProfile | ((prev: UserProfile) => UserProfile)) => {
    const nextVal = typeof value === 'function' ? value(currentUser) : value;
    setCurrentUserLocal(nextVal);
    if (firebaseReady && authUid && nextVal) {
      await saveUserProfile(authUid, {
        ...nextVal,
        id: authUid
      });
    }
  };

  // Calculate total unread messages
  const unreadMessagesCount = chats.reduce((acc, c) => acc + c.unreadCount, 0);

  const handleLogout = async () => {
    if (!authUid) return;
    await saveUserProfile(authUid, {
      id: authUid,
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
    setIsAppUnlocked(false);
  };

  // Router for tabs
  const renderScreen = () => {
    // 1. Check if logged out
    if (!currentUser || currentUser.name === '') {
      return (
        <RegisterScreen 
          onRegister={async (newProfile) => {
            if (!authUid) return;
            const userProf: UserProfile = {
              ...newProfile,
              id: authUid,
              status: 'En attente'
            };
            
            await saveUserProfile(authUid, userProf);

            // Create account traceability log
            await addSystemLog(
              'creation_compte',
              authUid,
              userProf.name,
              userProf.avatar,
              `Demande d'inscription soumise par ${userProf.name} (Rôle demandé : ${userProf.requestedRole || 'Membre'})`
            );
            
            await triggerNotification(
              'alert',
              '📝 Inscription Soumise',
              `La demande d'inscription pour '${userProf.name}' a été soumise avec succès et attend l'approbation de l'admin.`,
              'tontines'
            );
          }}
          onLogin={async (userId, customProfile) => {
            if (!authUid) return;
            if (customProfile) {
              const userProf: UserProfile = {
                ...customProfile,
                id: authUid
              };
              await saveUserProfile(authUid, userProf);
              setIsAppUnlocked(true);
              await addSystemLog(
                'divers',
                authUid,
                userProf.name,
                userProf.avatar,
                `Connexion sécurisée réussie par téléphone ou email (${userProf.phone || userProf.email})`
              );
              return;
            }
            if (userId === 'user_current' || userId === 'user_current_init') {
              const defaultProfile: UserProfile = {
                ...INITIAL_USER,
                id: authUid,
                referralCode: `MARIE-${authUid.substring(0, 4).toUpperCase()}`
              };
              await saveUserProfile(authUid, defaultProfile);
              setIsAppUnlocked(true);
            } else {
              const matchedMember = members.find(m => m.id === userId);
              if (matchedMember) {
                const userProf: UserProfile = {
                  id: authUid,
                  name: matchedMember.name,
                  avatar: matchedMember.avatar,
                  tier: matchedMember.tier,
                  reliabilityScore: matchedMember.reliabilityScore,
                  walletBalance: matchedMember.id === 'm2' ? 120000 : 15000,
                  referralCode: `${matchedMember.name.split(' ')[0].toUpperCase()}-XYZ`,
                  points: 50,
                  referralsCount: 0,
                  role: matchedMember.role || 'Membre',
                  status: matchedMember.status,
                  phone: matchedMember.phone || '+226 70 00 00 00',
                  requestedRole: matchedMember.requestedRole || matchedMember.role,
                  pinCode: matchedMember.pinCode,
                  email: matchedMember.email,
                  password: matchedMember.password
                };
                await saveUserProfile(authUid, userProf);
                setIsAppUnlocked(true);
                await addSystemLog(
                  'divers',
                  authUid,
                  userProf.name,
                  userProf.avatar,
                  `Connexion en tant que ${userProf.name} pour test/simulation`
                );
              }
            }
          }}
          members={members}
        />
      );
    }

    // 2. Check if pending approval
    if (currentUser.status === 'En attente') {
      return (
        <PendingApprovalScreen 
          currentUser={currentUser}
          onLogout={handleLogout}
          onSwitchToAdmin={async () => {
            if (!authUid) return;
            const defaultProfile: UserProfile = {
              ...INITIAL_USER,
              id: authUid,
              referralCode: `MARIE-${authUid.substring(0, 4).toUpperCase()}`
            };
            await saveUserProfile(authUid, defaultProfile);
            setIsAppUnlocked(true);
            setActiveTab('tontines');
          }}
        />
      );
    }

    // 3. Check PIN Lock (Secures access to the app contents after successful login)
    if (!isAppUnlocked) {
      return (
        <AppLockScreen 
          currentUser={currentUser}
          onUnlock={() => setIsAppUnlocked(true)}
          onLogout={handleLogout}
        />
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <DashboardScreen 
            currentUser={currentUser}
            tontines={tontines}
            setTontines={setTontines}
            members={members}
            setMembers={setMembers}
            systemLogs={systemLogs}
            addSystemLog={addSystemLog}
            triggerNotification={triggerNotification}
            addTransaction={addTransaction}
            setActiveTab={setActiveTab}
            setBoutiqueCategory={setBoutiqueCategory}
          />
        );
      case 'tontines':
        return (
          <TontineScreen 
            tontines={tontines}
            setTontines={setTontines}
            members={members}
            setMembers={setMembers}
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            addTransaction={addTransaction}
            setActiveTab={setActiveTab}
            triggerNotification={triggerNotification}
            systemLogs={systemLogs}
            addSystemLog={addSystemLog}
          />
        );
      case 'boutique':
        return (
          <BoutiqueScreen 
            products={products}
            setProducts={setProducts}
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            addTransaction={addTransaction}
            setActiveTab={setActiveTab}
            selectedCategory={boutiqueCategory}
            setSelectedCategory={setBoutiqueCategory}
            triggerNotification={triggerNotification}
          />
        );
      case 'community':
        return (
          <CommunityScreen 
            members={members}
            setMembers={setMembers}
            posts={posts}
            setPosts={setPosts}
            currentUser={currentUser}
            setActiveTab={setActiveTab}
          />
        );
      case 'chat':
        return (
          <ChatScreen 
            chats={chats}
            setChats={setChats}
            currentUser={currentUser}
            triggerNotification={triggerNotification}
          />
        );
      case 'wallet':
        return (
          <WalletScreen 
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            transactions={transactions}
            setTransactions={setTransactions}
            addTransaction={addTransaction}
            triggerNotification={triggerNotification}
          />
        );
      default:
        return (
          <DashboardScreen 
            currentUser={currentUser}
            tontines={tontines}
            setActiveTab={setActiveTab}
          />
        );
    }
  };

  return (
    <PhoneFrame
      activeTab={activeTab === 'boutique' ? 'home' : activeTab} // Keep home icon active when inside boutique
      setActiveTab={setActiveTab}
      currentUser={currentUser}
      setCurrentUser={setCurrentUser}
      setSubscriptionTier={setSubscriptionTier}
      unreadMessagesCount={unreadMessagesCount}
      notifications={notifications}
      setNotifications={setNotifications}
      activeToast={activeToast}
      setActiveToast={setActiveToast}
    >
      {renderScreen()}
    </PhoneFrame>
  );
}
