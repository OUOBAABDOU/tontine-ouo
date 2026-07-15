import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  getDoc,
  collection,
  setDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase Firestore connected successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration. Client is offline.");
    } else {
      console.log("Initial Firestore ping done (expected if document doesn't exist yet).");
    }
  }
}
testConnection();

// Firestore error handler types and function conforming to security rules requirements
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error details:', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

export let isOfflineFallbackMode = false;

// Perform anonymous authentication to guarantee that Firestore security rules are happy
export async function ensureSignedInAnonymously() {
  if (isOfflineFallbackMode) {
    return { uid: 'user_current_init', isAnonymous: true } as any;
  }
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
      console.log("Signed in anonymously with UID:", auth.currentUser?.uid);
    } catch (error) {
      console.warn("Firebase Anonymous Sign-In is restricted or disabled on this database: ", error);
      console.warn("Falling back to local fallback mode because anonymous auth is restricted (auth/admin-restricted-operation).");
      isOfflineFallbackMode = true;
      return { uid: 'user_current_init', isAnonymous: true } as any;
    }
  }
  return auth.currentUser;
}

// -------------------------------------------------------------
// SEEDING AND SYNCING HELPERS FOR REAL-TIME SIMULATION BYPASS
// -------------------------------------------------------------
import { 
  UserProfile, 
  Tontine, 
  Post, 
  ChatThread, 
  Transaction, 
  AppNotification, 
  SystemLog,
  Member,
  License
} from '../types';

// -------------------------------------------------------------
// LOCALSTORAGE SIMULATION LAYER FOR OFFLINE / FALLBACK OPERATION
// -------------------------------------------------------------
type ListenerCallback<T> = (data: T) => void;

interface ListenersRegistry {
  users: ListenerCallback<UserProfile | null>[];
  members: ListenerCallback<Member[]>[];
  tontines: ListenerCallback<Tontine[]>[];
  posts: ListenerCallback<Post[]>[];
  chats: ListenerCallback<ChatThread[]>[];
  systemLogs: ListenerCallback<SystemLog[]>[];
  transactions: { [uid: string]: ListenerCallback<Transaction[]>[] };
  notifications: { [uid: string]: ListenerCallback<AppNotification[]>[] };
}

const listeners: ListenersRegistry = {
  users: [],
  members: [],
  tontines: [],
  posts: [],
  chats: [],
  systemLogs: [],
  transactions: {},
  notifications: {}
};

const profileListeners: { [uid: string]: ListenerCallback<UserProfile | null>[] } = {};

function getLocalCollection<T>(name: string): T[] {
  try {
    const raw = localStorage.getItem(`fluttercraft_${name}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Local storage read error", e);
    return [];
  }
}

function saveLocalCollection<T>(name: string, data: T[]) {
  try {
    localStorage.setItem(`fluttercraft_${name}`, JSON.stringify(data));
  } catch (e) {
    console.error("Local storage write error", e);
  }
}

function getLocalDocument<T>(collectionName: string, id: string): T | null {
  const list = getLocalCollection<any>(collectionName);
  return list.find(item => item.id === id) || null;
}

function saveLocalDocument<T extends { id: string }>(collectionName: string, docData: T) {
  const list = getLocalCollection<any>(collectionName);
  const index = list.findIndex(item => item.id === docData.id);
  if (index >= 0) {
    list[index] = docData;
  } else {
    list.push(docData);
  }
  saveLocalCollection(collectionName, list);
}

function triggerProfileListeners(uid: string) {
  const profile = getLocalDocument<UserProfile>('users', uid);
  profileListeners[uid]?.forEach(cb => cb(profile));
}

function triggerMembersListeners() {
  const list = getLocalCollection<any>('users');
  const membersList: Member[] = list.map(u => ({
    id: u.id,
    name: u.name || '',
    avatar: u.avatar || '',
    reliabilityScore: u.reliabilityScore ?? 100,
    tier: u.tier || 'Gratuit',
    isVerifiedVendeuse: u.tier === 'Vendeuse' || u.isVerifiedVendeuse || false,
    role: u.role || 'Membre',
    status: u.status || 'Validé',
    phone: u.phone || '',
    requestedRole: u.requestedRole || 'Membre',
    pinCode: u.pinCode || '1234'
  }));
  listeners.members?.forEach(cb => cb(membersList));
}

function triggerTontinesListeners() {
  const list = getLocalCollection<Tontine>('tontines');
  listeners.tontines?.forEach(cb => cb(list));
}

function triggerPostsListeners() {
  const list = getLocalCollection<Post>('posts');
  list.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.id.localeCompare(a.id);
  });
  listeners.posts?.forEach(cb => cb(list));
}

function triggerChatsListeners() {
  const list = getLocalCollection<ChatThread>('chats');
  listeners.chats?.forEach(cb => cb(list));
}

function triggerSystemLogsListeners() {
  const list = getLocalCollection<SystemLog>('systemLogs');
  list.sort((a, b) => b.id.localeCompare(a.id));
  listeners.systemLogs?.forEach(cb => cb(list));
}

function triggerTransactionsListeners(uid: string) {
  const list = getLocalCollection<Transaction>(`transactions_${uid}`);
  list.sort((a, b) => b.id.localeCompare(a.id));
  listeners.transactions[uid]?.forEach(cb => cb(list));
}

function triggerNotificationsListeners(uid: string) {
  const list = getLocalCollection<AppNotification>(`notifications_${uid}`);
  list.sort((a, b) => b.id.localeCompare(a.id));
  listeners.notifications[uid]?.forEach(cb => cb(list));
}


// Helper to determine if Firestore is already seeded, and if not, populate it
export async function seedFirestore(
  initialTontines: Tontine[],
  initialMembers: Member[],
  initialPosts: Post[],
  initialChats: ChatThread[],
  initialSystemLogs: SystemLog[]
) {
  if (isOfflineFallbackMode) {
    console.log("Offline fallback mode: seeding localStorage if empty...");
    const existingTontines = getLocalCollection<Tontine>('tontines');
    if (existingTontines.length === 0) {
      saveLocalCollection('tontines', initialTontines);
      
      const userList = initialMembers.map(m => ({
        id: m.id,
        name: m.name,
        avatar: m.avatar,
        tier: m.tier,
        reliabilityScore: m.reliabilityScore,
        walletBalance: m.id === 'm2' ? 120000 : m.id === 'm1' ? 75000 : 15000,
        referralCode: `${m.name.split(' ')[0].toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        points: 50,
        referralsCount: 0,
        role: m.role || 'Membre',
        status: m.status || 'Validé',
        phone: m.phone || '+226 70 00 00 00',
        requestedRole: m.requestedRole || m.role || 'Membre',
        pinCode: m.pinCode || '1234'
      }));
      saveLocalCollection('users', userList);
      
      saveLocalCollection('posts', initialPosts.map(p => ({
        ...p,
        image: p.image || '',
        isPinned: p.isPinned || false,
        comments: p.comments || []
      })));
      
      saveLocalCollection('chats', initialChats.map(c => ({
        ...c,
        tontineId: c.tontineId || '',
        messages: c.messages || []
      })));
      
      saveLocalCollection('systemLogs', initialSystemLogs);
      saveLocalCollection('licenses', [
        { id: 'LICENCE-FREE-2026', status: 'unused', tier: 'Gratuit' },
        { id: 'LICENCE-PREMIUM-2026', status: 'unused', tier: 'Premium' },
        { id: 'LICENCE-VIP-2026', status: 'unused', tier: 'VIP' }
      ]);
      console.log("Local storage fallback database successfully seeded.");
    }
    return;
  }

  try {
    const tontinesSnap = await getDocs(collection(db, 'tontines'));
    if (tontinesSnap.empty) {
      console.log("Firestore empty. Seeding initial data...");

      // Seed tontines
      for (const t of initialTontines) {
        await setDoc(doc(db, 'tontines', t.id), {
          id: t.id,
          name: t.name,
          type: t.type,
          contributionAmount: t.contributionAmount,
          frequency: t.frequency,
          totalPlaces: t.totalPlaces,
          status: t.status,
          description: t.description,
          nextDrawDate: t.nextDrawDate,
          drawHistory: t.drawHistory,
          participants: t.participants || []
        });
      }

      // Seed members as users
      for (const m of initialMembers) {
        await setDoc(doc(db, 'users', m.id), {
          id: m.id,
          name: m.name,
          avatar: m.avatar,
          tier: m.tier,
          reliabilityScore: m.reliabilityScore,
          walletBalance: m.id === 'm2' ? 120000 : m.id === 'm1' ? 75000 : 15000,
          referralCode: `${m.name.split(' ')[0].toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
          points: 50,
          referralsCount: 0,
          role: m.role || 'Membre',
          status: m.status || 'Validé',
          phone: m.phone || '+226 70 00 00 00',
          requestedRole: m.requestedRole || m.role || 'Membre',
          pinCode: m.pinCode || '1234'
        });
      }

      // Seed posts
      for (const p of initialPosts) {
        await setDoc(doc(db, 'posts', p.id), {
          id: p.id,
          memberId: p.memberId,
          memberName: p.memberName,
          memberAvatar: p.memberAvatar,
          memberTier: p.memberTier,
          content: p.content,
          image: p.image || '',
          likes: p.likes,
          commentsCount: p.commentsCount,
          timestamp: p.timestamp,
          isPinned: p.isPinned || false,
          comments: p.comments || []
        });
      }

      // Seed chats
      for (const c of initialChats) {
        await setDoc(doc(db, 'chats', c.id), {
          id: c.id,
          name: c.name,
          avatar: c.avatar,
          isGroup: c.isGroup,
          tontineId: c.tontineId || '',
          lastMessage: c.lastMessage,
          lastMessageTime: c.lastMessageTime,
          unreadCount: c.unreadCount,
          messages: c.messages || []
        });
      }

      // Seed system logs
      for (const l of initialSystemLogs) {
        await setDoc(doc(db, 'systemLogs', l.id), {
          id: l.id,
          type: l.type,
          userId: l.userId,
          userName: l.userName,
          userAvatar: l.userAvatar,
          description: l.description,
          timestamp: l.timestamp
        });
      }

      // Seed licenses
      const defaultLicenses: License[] = [
        { id: 'LICENCE-FREE-2026', status: 'unused', tier: 'Gratuit' },
        { id: 'LICENCE-PREMIUM-2026', status: 'unused', tier: 'Premium' },
        { id: 'LICENCE-VIP-2026', status: 'unused', tier: 'VIP' }
      ];
      for (const lic of defaultLicenses) {
        await setDoc(doc(db, 'licenses', lic.id), lic);
      }

      console.log("Firestore successfully seeded with initial data.");
    }
  } catch (error) {
    console.error("Failed to seed Firestore:", error);
  }
}

// Syncing Profiles
export function syncUserProfile(uid: string, callback: (profile: UserProfile | null) => void) {
  if (isOfflineFallbackMode) {
    const profile = getLocalDocument<UserProfile>('users', uid);
    callback(profile);
    
    if (!profileListeners[uid]) {
      profileListeners[uid] = [];
    }
    profileListeners[uid].push(callback);
    return () => {
      profileListeners[uid] = profileListeners[uid].filter(cb => cb !== callback);
    };
  }

  const userDocRef = doc(db, 'users', uid);
  return onSnapshot(userDocRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() } as UserProfile);
    } else {
      callback(null);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  });
}

export async function saveUserProfile(uid: string, profile: UserProfile) {
  if (isOfflineFallbackMode) {
    saveLocalDocument<UserProfile>('users', profile);
    triggerProfileListeners(uid);
    triggerMembersListeners();
    return;
  }

  try {
    await setDoc(doc(db, 'users', uid), profile);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
  }
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>) {
  if (isOfflineFallbackMode) {
    const existing = getLocalDocument<UserProfile>('users', uid);
    if (existing) {
      const updated = { ...existing, ...updates };
      saveLocalDocument<UserProfile>('users', updated);
      triggerProfileListeners(uid);
      triggerMembersListeners();
    }
    return;
  }

  try {
    await updateDoc(doc(db, 'users', uid), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

// Syncing Members
export function syncMembers(callback: (members: Member[]) => void) {
  if (isOfflineFallbackMode) {
    const list = getLocalCollection<any>('users').map(u => ({
      id: u.id,
      name: u.name || '',
      avatar: u.avatar || '',
      reliabilityScore: u.reliabilityScore ?? 100,
      tier: u.tier || 'Gratuit',
      isVerifiedVendeuse: u.tier === 'Vendeuse' || u.isVerifiedVendeuse || false,
      role: u.role || 'Membre',
      status: u.status || 'Validé',
      phone: u.phone || '',
      requestedRole: u.requestedRole || 'Membre',
      pinCode: u.pinCode || '1234'
    }));
    callback(list);
    
    listeners.members.push(callback);
    return () => {
      listeners.members = listeners.members.filter(cb => cb !== callback);
    };
  }

  return onSnapshot(collection(db, 'users'), (snapshot) => {
    const list: Member[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        name: data.name || '',
        avatar: data.avatar || '',
        reliabilityScore: data.reliabilityScore ?? 100,
        tier: data.tier || 'Gratuit',
        isVerifiedVendeuse: data.tier === 'Vendeuse' || data.isVerifiedVendeuse || false,
        role: data.role || 'Membre',
        status: data.status || 'Validé',
        phone: data.phone || '',
        requestedRole: data.requestedRole || 'Membre'
      });
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'users');
  });
}

// Syncing Tontines
export function syncTontines(callback: (tontines: Tontine[]) => void) {
  if (isOfflineFallbackMode) {
    const list = getLocalCollection<Tontine>('tontines');
    callback(list);
    
    listeners.tontines.push(callback);
    return () => {
      listeners.tontines = listeners.tontines.filter(cb => cb !== callback);
    };
  }

  return onSnapshot(collection(db, 'tontines'), (snapshot) => {
    const list: Tontine[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        name: data.name || '',
        type: data.type || 'Argent',
        contributionAmount: data.contributionAmount || 0,
        frequency: data.frequency || 'Mensuelle',
        totalPlaces: data.totalPlaces || 10,
        status: data.status || 'Recrutement',
        description: data.description || '',
        nextDrawDate: data.nextDrawDate || '',
        drawHistory: data.drawHistory || [],
        participants: data.participants || []
      });
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'tontines');
  });
}

export async function saveTontine(tontine: Tontine) {
  if (isOfflineFallbackMode) {
    saveLocalDocument<Tontine>('tontines', tontine);
    triggerTontinesListeners();
    return;
  }

  try {
    await setDoc(doc(db, 'tontines', tontine.id), tontine);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `tontines/${tontine.id}`);
  }
}

// Syncing Posts
export function syncPosts(callback: (posts: Post[]) => void) {
  if (isOfflineFallbackMode) {
    const list = getLocalCollection<Post>('posts');
    list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.id.localeCompare(a.id);
    });
    callback(list);
    
    listeners.posts.push(callback);
    return () => {
      listeners.posts = listeners.posts.filter(cb => cb !== callback);
    };
  }

  const q = query(collection(db, 'posts'), limit(50));
  return onSnapshot(q, (snapshot) => {
    const list: Post[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        memberId: data.memberId || '',
        memberName: data.memberName || '',
        memberAvatar: data.memberAvatar || '',
        memberTier: data.memberTier || 'Gratuit',
        content: data.content || '',
        image: data.image || '',
        likes: data.likes ?? 0,
        commentsCount: data.commentsCount ?? 0,
        timestamp: data.timestamp || '',
        isPinned: data.isPinned || false,
        comments: data.comments || []
      });
    });
    // Sort so pinned are on top, then by timestamp (or ID descending to get newest first)
    list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.id.localeCompare(a.id);
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'posts');
  });
}

export async function savePost(post: Post) {
  if (isOfflineFallbackMode) {
    saveLocalDocument<Post>('posts', post);
    triggerPostsListeners();
    return;
  }

  try {
    await setDoc(doc(db, 'posts', post.id), post);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `posts/${post.id}`);
  }
}

// Syncing Chats
export function syncChats(callback: (chats: ChatThread[]) => void) {
  if (isOfflineFallbackMode) {
    const list = getLocalCollection<ChatThread>('chats');
    callback(list);
    
    listeners.chats.push(callback);
    return () => {
      listeners.chats = listeners.chats.filter(cb => cb !== callback);
    };
  }

  return onSnapshot(collection(db, 'chats'), (snapshot) => {
    const list: ChatThread[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        name: data.name || '',
        avatar: data.avatar || '',
        isGroup: data.isGroup ?? false,
        tontineId: data.tontineId || '',
        lastMessage: data.lastMessage || '',
        lastMessageTime: data.lastMessageTime || '',
        unreadCount: data.unreadCount ?? 0,
        messages: data.messages || []
      });
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'chats');
  });
}

export async function saveChatThread(chat: ChatThread) {
  if (isOfflineFallbackMode) {
    saveLocalDocument<ChatThread>('chats', chat);
    triggerChatsListeners();
    return;
  }

  try {
    await setDoc(doc(db, 'chats', chat.id), chat);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `chats/${chat.id}`);
  }
}

// Syncing System Logs
export function syncSystemLogs(callback: (logs: SystemLog[]) => void) {
  if (isOfflineFallbackMode) {
    const list = getLocalCollection<SystemLog>('systemLogs');
    list.sort((a, b) => b.id.localeCompare(a.id));
    callback(list);
    
    listeners.systemLogs.push(callback);
    return () => {
      listeners.systemLogs = listeners.systemLogs.filter(cb => cb !== callback);
    };
  }

  const q = query(collection(db, 'systemLogs'), limit(50));
  return onSnapshot(q, (snapshot) => {
    const list: SystemLog[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        type: data.type || 'divers',
        userId: data.userId || '',
        userName: data.userName || '',
        userAvatar: data.userAvatar || '',
        description: data.description || '',
        timestamp: data.timestamp || ''
      });
    });
    // Newest logs first
    list.sort((a, b) => b.id.localeCompare(a.id));
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'systemLogs');
  });
}

export async function saveSystemLog(log: SystemLog) {
  if (isOfflineFallbackMode) {
    saveLocalDocument<SystemLog>('systemLogs', log);
    triggerSystemLogsListeners();
    return;
  }

  try {
    await setDoc(doc(db, 'systemLogs', log.id), log);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `systemLogs/${log.id}`);
  }
}

// User subcollections (Transactions & Notifications)
export function syncTransactions(userId: string, callback: (transactions: Transaction[]) => void) {
  if (isOfflineFallbackMode) {
    const list = getLocalCollection<Transaction>(`transactions_${userId}`);
    list.sort((a, b) => b.id.localeCompare(a.id));
    callback(list);
    
    if (!listeners.transactions[userId]) {
      listeners.transactions[userId] = [];
    }
    listeners.transactions[userId].push(callback);
    return () => {
      listeners.transactions[userId] = listeners.transactions[userId].filter(cb => cb !== callback);
    };
  }

  const colPath = `users/${userId}/transactions`;
  return onSnapshot(collection(db, 'users', userId, 'transactions'), (snapshot) => {
    const list: Transaction[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        type: data.type,
        amount: data.amount,
        date: data.date,
        description: data.description
      });
    });
    // Newest first
    list.sort((a, b) => b.id.localeCompare(a.id));
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, colPath);
  });
}

export async function saveTransaction(userId: string, tx: Transaction) {
  if (isOfflineFallbackMode) {
    saveLocalDocument<Transaction>(`transactions_${userId}`, tx);
    triggerTransactionsListeners(userId);
    return;
  }

  const colPath = `users/${userId}/transactions`;
  try {
    await setDoc(doc(db, 'users', userId, 'transactions', tx.id), tx);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${colPath}/${tx.id}`);
  }
}

export function syncNotifications(userId: string, callback: (notifications: AppNotification[]) => void) {
  if (isOfflineFallbackMode) {
    const list = getLocalCollection<AppNotification>(`notifications_${userId}`);
    list.sort((a, b) => b.id.localeCompare(a.id));
    callback(list);
    
    if (!listeners.notifications[userId]) {
      listeners.notifications[userId] = [];
    }
    listeners.notifications[userId].push(callback);
    return () => {
      listeners.notifications[userId] = listeners.notifications[userId].filter(cb => cb !== callback);
    };
  }

  const colPath = `users/${userId}/notifications`;
  return onSnapshot(collection(db, 'users', userId, 'notifications'), (snapshot) => {
    const list: AppNotification[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        type: data.type,
        title: data.title,
        message: data.message,
        timestamp: data.timestamp,
        isRead: data.isRead ?? false,
        linkToTab: data.linkToTab || ''
      });
    });
    // Newest first
    list.sort((a, b) => b.id.localeCompare(a.id));
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, colPath);
  });
}

export async function saveNotification(userId: string, notif: AppNotification) {
  if (isOfflineFallbackMode) {
    saveLocalDocument<AppNotification>(`notifications_${userId}`, notif);
    triggerNotificationsListeners(userId);
    return;
  }

  const colPath = `users/${userId}/notifications`;
  try {
    await setDoc(doc(db, 'users', userId, 'notifications', notif.id), notif);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${colPath}/${notif.id}`);
  }
}

export async function updateNotificationRead(userId: string, notifId: string, isRead: boolean) {
  if (isOfflineFallbackMode) {
    const list = getLocalCollection<AppNotification>(`notifications_${userId}`);
    const existing = list.find(n => n.id === notifId);
    if (existing) {
      existing.isRead = isRead;
      saveLocalCollection(`notifications_${userId}`, list);
      triggerNotificationsListeners(userId);
    }
    return;
  }

  const colPath = `users/${userId}/notifications`;
  try {
    await updateDoc(doc(db, 'users', userId, 'notifications', notifId), { isRead });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${colPath}/${notifId}`);
  }
}

// Syncing Licenses for Admin Dashboard
export function syncLicenses(callback: (licenses: License[]) => void) {
  if (isOfflineFallbackMode) {
    const list = getLocalCollection<License>('licenses');
    callback(list);
    return () => {};
  }

  return onSnapshot(collection(db, 'licenses'), (snapshot) => {
    const list: License[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        status: data.status || 'unused',
        activatedBy: data.activatedBy || '',
        activatedByName: data.activatedByName || '',
        activatedAt: data.activatedAt || '',
        tier: data.tier || 'Gratuit'
      });
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'licenses');
  });
}

// Check and Activate a License Key
export async function checkAndActivateLicense(
  licenseKey: string,
  userId: string,
  userName: string
): Promise<License> {
  const cleanKey = licenseKey.trim().toUpperCase();

  if (isOfflineFallbackMode) {
    const licenses = getLocalCollection<License>('licenses');
    let index = licenses.findIndex(l => l.id === cleanKey);
    
    if (index === -1) {
      // If it is a valid pre-generated demo key but missing in local storage, auto-inject it
      const defaultTiers: { [key: string]: 'Gratuit' | 'Premium' | 'VIP' } = {
        'LICENCE-FREE-2026': 'Gratuit',
        'LICENCE-PREMIUM-2026': 'Premium',
        'LICENCE-VIP-2026': 'VIP'
      };
      if (defaultTiers[cleanKey]) {
        const newLic: License = {
          id: cleanKey,
          status: 'unused',
          tier: defaultTiers[cleanKey]
        };
        licenses.push(newLic);
        saveLocalCollection('licenses', licenses);
        index = licenses.length - 1;
      } else {
        throw new Error("Clé de licence invalide. Essayez les clés de démo fournies.");
      }
    }
    
    const license = licenses[index];
    if (license.status === 'active' && license.activatedBy !== userId) {
      throw new Error(`Cette licence a déjà été activée par un autre utilisateur (${license.activatedByName || 'Inconnu'}).`);
    }

    // Update license local state
    const updatedLic: License = {
      ...license,
      status: 'active',
      activatedBy: userId,
      activatedByName: userName || 'Utilisateur',
      activatedAt: new Date().toISOString()
    };
    licenses[index] = updatedLic;
    saveLocalCollection('licenses', licenses);

    // Update user profile local state
    const users = getLocalCollection<any>('users');
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex >= 0) {
      users[userIndex].isLicensed = true;
      users[userIndex].licenseKey = cleanKey;
      users[userIndex].tier = license.tier;
      saveLocalCollection('users', users);
      triggerProfileListeners(userId);
      triggerMembersListeners();
    }

    return updatedLic;
  }

  try {
    const licenseRef = doc(db, 'licenses', cleanKey);
    let licenseSnap = await getDoc(licenseRef);

    if (!licenseSnap.exists()) {
      // Auto-create/seed the demo key on demand in online mode if it does not exist
      const defaultTiers: { [key: string]: 'Gratuit' | 'Premium' | 'VIP' } = {
        'LICENCE-FREE-2026': 'Gratuit',
        'LICENCE-PREMIUM-2026': 'Premium',
        'LICENCE-VIP-2026': 'VIP'
      };
      if (defaultTiers[cleanKey]) {
        const newLic: License = {
          id: cleanKey,
          status: 'unused',
          tier: defaultTiers[cleanKey]
        };
        await setDoc(licenseRef, newLic);
        licenseSnap = await getDoc(licenseRef);
      } else {
        throw new Error("Clé de licence inexistante dans notre base de données en ligne.");
      }
    }

    const licenseData = licenseSnap.data() as License;
    if (licenseData.status === 'active' && licenseData.activatedBy !== userId) {
      throw new Error(`Cette clé a déjà été activée par un autre membre (${licenseData.activatedByName || 'Inconnu'}).`);
    }

    const activatedLicense: License = {
      id: cleanKey,
      status: 'active',
      activatedBy: userId,
      activatedByName: userName || 'Utilisateur',
      activatedAt: new Date().toISOString(),
      tier: licenseData.tier
    };

    // 1. Mark license as active
    await setDoc(licenseRef, activatedLicense);

    // 2. Update user profile to reflect licensure and tier in Firestore (only if user document exists)
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      await updateDoc(userRef, {
        isLicensed: true,
        licenseKey: cleanKey,
        tier: licenseData.tier
      });
    }

    return activatedLicense;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Clé")) {
      throw error;
    }
    throw new Error("Erreur lors de la validation en ligne : " + (error instanceof Error ? error.message : String(error)));
  }
}

// Create a new license (Admin only)
export async function createNewLicense(lic: License) {
  if (isOfflineFallbackMode) {
    const list = getLocalCollection<License>('licenses');
    if (list.some(l => l.id === lic.id)) {
      throw new Error("Cette clé de licence existe déjà.");
    }
    list.push(lic);
    saveLocalCollection('licenses', list);
    return;
  }

  try {
    const docRef = doc(db, 'licenses', lic.id);
    await setDoc(docRef, lic);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `licenses/${lic.id}`);
  }
}

// Verify license status at startup for a specific user device
export async function verifyLicenseAtStartup(licenseKey: string, userId: string): Promise<boolean> {
  const cleanKey = licenseKey.trim().toUpperCase();
  if (isOfflineFallbackMode) {
    const licenses = getLocalCollection<License>('licenses');
    let license = licenses.find(l => l.id === cleanKey);
    if (!license) {
      // If the user's profile already contains this key, auto-restore the license record
      const defaultTiers: { [key: string]: 'Gratuit' | 'Premium' | 'VIP' } = {
        'LICENCE-FREE-2026': 'Gratuit',
        'LICENCE-PREMIUM-2026': 'Premium',
        'LICENCE-VIP-2026': 'VIP'
      };
      if (defaultTiers[cleanKey]) {
        license = {
          id: cleanKey,
          status: 'active',
          activatedBy: userId,
          activatedByName: 'Utilisateur',
          activatedAt: new Date().toISOString(),
          tier: defaultTiers[cleanKey]
        };
        licenses.push(license);
        saveLocalCollection('licenses', licenses);
      } else {
        return false;
      }
    }
    return license.status === 'active' && license.activatedBy === userId;
  }

  try {
    const licenseRef = doc(db, 'licenses', cleanKey);
    const licenseSnap = await getDoc(licenseRef);
    if (!licenseSnap.exists()) return false;
    const data = licenseSnap.data();
    return data.status === 'active' && data.activatedBy === userId;
  } catch (error) {
    console.error("Error verifying license at startup:", error);
    return false;
  }
}

// Delete a license completely (Admin only)
export async function deleteLicense(licenseId: string) {
  if (isOfflineFallbackMode) {
    const list = getLocalCollection<License>('licenses');
    const index = list.findIndex(l => l.id === licenseId);
    if (index >= 0) {
      list.splice(index, 1);
      saveLocalCollection('licenses', list);
    }
    return;
  }

  try {
    const docRef = doc(db, 'licenses', licenseId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `licenses/${licenseId}`);
  }
}

// Revoke an active license to make it unused again or deactivate it (Admin only)
export async function revokeLicense(licenseId: string) {
  if (isOfflineFallbackMode) {
    const list = getLocalCollection<License>('licenses');
    const index = list.findIndex(l => l.id === licenseId);
    if (index >= 0) {
      const lic = list[index];
      
      // If there's an associated user, deactivate them too in local state
      if (lic.activatedBy) {
        const users = getLocalCollection<any>('users');
        const userIndex = users.findIndex(u => u.id === lic.activatedBy);
        if (userIndex >= 0) {
          users[userIndex].isLicensed = false;
          users[userIndex].licenseKey = '';
          saveLocalCollection('users', users);
          triggerProfileListeners(lic.activatedBy);
        }
      }

      list[index] = {
        id: lic.id,
        status: 'unused',
        tier: lic.tier
      };
      saveLocalCollection('licenses', list);
    }
    return;
  }

  try {
    const docRef = doc(db, 'licenses', licenseId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as License;
      
      // Deactivate user document first if it was activated
      if (data.activatedBy) {
        const userRef = doc(db, 'users', data.activatedBy);
        await updateDoc(userRef, {
          isLicensed: false,
          licenseKey: ''
        });
      }

      // Mark license as unused
      await setDoc(docRef, {
        id: licenseId,
        status: 'unused',
        tier: data.tier
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `licenses/${licenseId}`);
  }
}

