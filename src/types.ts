export type SubscriptionTier = 'Gratuit' | 'Premium' | 'VIP' | 'Vendeuse';
export type UserRole = 'Membre' | 'Admin' | 'Super Admin';

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  tier: SubscriptionTier;
  reliabilityScore: number; // 0 to 100
  walletBalance: number; // in FCFA
  referralCode: string;
  points: number;
  referralsCount: number;
  role?: UserRole;
  status?: 'En attente' | 'Validé' | 'Rejeté';
  phone?: string;
  requestedRole?: UserRole;
  pinCode?: string;
  email?: string;
  password?: string;
  licenseKey?: string;
  isLicensed?: boolean;
}

export interface Member {
  id: string;
  name: string;
  avatar: string;
  reliabilityScore: number;
  tier: SubscriptionTier;
  isVerifiedVendeuse?: boolean;
  role?: UserRole;
  status?: 'En attente' | 'Validé' | 'Rejeté';
  phone?: string;
  requestedRole?: UserRole;
  pinCode?: string;
  email?: string;
  password?: string;
  licenseKey?: string;
  isLicensed?: boolean;
}

export interface Participant {
  memberId: string;
  hasPaidThisRound: boolean;
  orderNumber?: number; // for rotating draw
}

export interface DrawCertificate {
  id: string;
  tontineId: string;
  tontineName: string;
  winnerName: string;
  winnerAvatar: string;
  amount: number;
  date: string;
  signature: string;
}

export interface Tontine {
  id: string;
  name: string;
  type: 'Argent' | 'Alimentaire';
  contributionAmount: number; // in FCFA
  frequency: 'Mensuelle' | 'Hebdomadaire';
  totalPlaces: number;
  participants: Participant[];
  status: 'Recrutement' | 'En Cours' | 'Terminée';
  description: string;
  nextDrawDate: string;
  drawHistory: string[]; // memberIds of previous winners in order
}

export interface Product {
  id: string;
  name: string;
  price: number; // in FCFA
  image: string;
  category: 'Kits Alimentaires' | 'Produits Individuels';
  description: string;
  isPremiumPromo?: boolean;
  discountPercentage?: number;
}

export interface Post {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  memberTier: SubscriptionTier;
  content: string;
  image?: string;
  likes: number;
  commentsCount: number;
  timestamp: string;
  isPinned?: boolean;
  likedByCurrentUser?: boolean;
  comments: {
    id: string;
    memberName: string;
    content: string;
    timestamp: string;
  }[];
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  isSecret?: boolean; // self-destructs
}

export interface ChatThread {
  id: string;
  name: string;
  avatar: string;
  isGroup: boolean;
  tontineId?: string; // if it's a tontine group chat
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline?: boolean;
  isTyping?: boolean;
  messages: Message[];
}

export interface Transaction {
  id: string;
  type: 'Recharge' | 'Paiement Tontine' | 'Achat Boutique' | 'Réception Tontine' | 'Bonus Parrainage';
  amount: number; // in FCFA
  date: string;
  description: string;
}

export interface AppNotification {
  id: string;
  type: 'tontine' | 'chat' | 'transaction' | 'alert';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  linkToTab?: string;
}

export interface SystemLog {
  id: string;
  type: 'creation_compte' | 'validation_compte' | 'creation_tontine' | 'cotisation' | 'retrait_wallet' | 'changement_role' | 'rejet_compte' | 'divers';
  userId: string;
  userName: string;
  userAvatar: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface License {
  id: string; // The license code itself
  status: 'unused' | 'active';
  activatedBy?: string;
  activatedByName?: string;
  activatedAt?: string;
  tier: SubscriptionTier;
}

