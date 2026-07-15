import { Member, Tontine, Product, Post, ChatThread, Transaction, UserProfile, AppNotification } from '../types';

export const INITIAL_USER: UserProfile = {
  id: 'user_current',
  name: 'Maman Marie',
  avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
  tier: 'Premium',
  reliabilityScore: 98,
  walletBalance: 75000,
  referralCode: 'MARIE-98F',
  points: 450,
  referralsCount: 4,
  role: 'Super Admin',
  phone: '+226 70 00 00 00',
  pinCode: '1234',
  email: 'marie@tontine.com',
  password: 'password123'
};

export const MOCK_MEMBERS: Member[] = [
  {
    id: 'm1',
    name: 'Maman Antoinette',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    reliabilityScore: 84,
    tier: 'Premium',
    role: 'Admin',
    status: 'Validé',
    phone: '+226 70 11 11 11',
    pinCode: '1234',
    email: 'antoinette@tontine.com',
    password: 'password123'
  },
  {
    id: 'm2',
    name: 'Maman Beatrice',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
    reliabilityScore: 96,
    tier: 'VIP',
    role: 'Membre',
    status: 'Validé',
    phone: '+226 70 22 22 22',
    pinCode: '1234',
    email: 'beatrice@tontine.com',
    password: 'password123'
  },
  {
    id: 'm3',
    name: 'Maman Georgette',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    reliabilityScore: 72,
    tier: 'Gratuit',
    role: 'Membre',
    status: 'Validé',
    phone: '+226 70 33 33 33',
    pinCode: '1234',
    email: 'georgette@tontine.com',
    password: 'password123'
  },
  {
    id: 'm4',
    name: 'Maman Sidonie',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    reliabilityScore: 48,
    tier: 'Gratuit',
    role: 'Membre',
    status: 'Validé',
    phone: '+226 70 44 44 44',
    pinCode: '1234',
    email: 'sidonie@tontine.com',
    password: 'password123'
  },
  {
    id: 'm5',
    name: 'Maman Martine',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    reliabilityScore: 94,
    tier: 'Vendeuse',
    isVerifiedVendeuse: true,
    role: 'Membre',
    status: 'Validé',
    phone: '+226 70 55 55 55',
    pinCode: '1234',
    email: 'martine@tontine.com',
    password: 'password123'
  },
  {
    id: 'm6',
    name: 'Maman Chantal',
    avatar: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&q=80&w=200',
    reliabilityScore: 99,
    tier: 'VIP',
    role: 'Membre',
    status: 'Validé',
    phone: '+226 70 66 66 66',
    pinCode: '1234',
    email: 'chantal@tontine.com',
    password: 'password123'
  },
  {
    id: 'm_pending1',
    name: 'Maman Florence',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=200',
    reliabilityScore: 80,
    tier: 'Gratuit',
    role: 'Membre',
    status: 'En attente',
    phone: '+226 70 12 34 56',
    pinCode: '1234',
    requestedRole: 'Membre',
    email: 'florence@tontine.com',
    password: 'password123'
  },
  {
    id: 'm_pending2',
    name: 'Maman Fatoumata',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=200',
    reliabilityScore: 85,
    tier: 'Premium',
    role: 'Membre',
    status: 'En attente',
    phone: '+225 05 67 89 01',
    pinCode: '1234',
    requestedRole: 'Admin',
    email: 'fatoumata@tontine.com',
    password: 'password123'
  }
];

export const INITIAL_TONTINES: Tontine[] = [
  {
    id: 't1',
    name: "Solidarité Mensuelle d'Argent",
    type: 'Argent',
    contributionAmount: 50000,
    frequency: 'Mensuelle',
    totalPlaces: 10,
    status: 'En Cours',
    description: "Une tontine rotative d'argent pour financer vos projets. Chaque membre cotise 50 000 FCFA chaque mois, et un tirage au sort désigne la gagnante de la cagnotte globale (500 000 FCFA) !",
    nextDrawDate: '2026-08-01',
    drawHistory: ['m2', 'm1'], // Beatrice and Antoinette have already won
    participants: [
      { memberId: 'user_current', hasPaidThisRound: true },
      { memberId: 'm1', hasPaidThisRound: true },
      { memberId: 'm2', hasPaidThisRound: true },
      { memberId: 'm3', hasPaidThisRound: true },
      { memberId: 'm4', hasPaidThisRound: false }, // Sidonie has not paid yet
      { memberId: 'm5', hasPaidThisRound: true },
      { memberId: 'm6', hasPaidThisRound: true }
    ]
  },
  {
    id: 't2',
    name: 'Panier Alimentaire des Mamans',
    type: 'Alimentaire',
    contributionAmount: 15000,
    frequency: 'Mensuelle',
    totalPlaces: 12,
    status: 'En Cours',
    description: "Idéal pour faire vos provisions de kits alimentaires sans vous ruiner. Cotisez 15 000 FCFA/mois. Chaque mois, le tirage désigne les gagnantes qui reçoivent un super kit alimentaire complet livré chez elles.",
    nextDrawDate: '2026-07-25',
    drawHistory: ['m3'], // Georgette won
    participants: [
      { memberId: 'user_current', hasPaidThisRound: true },
      { memberId: 'm1', hasPaidThisRound: true },
      { memberId: 'm2', hasPaidThisRound: true },
      { memberId: 'm3', hasPaidThisRound: true },
      { memberId: 'm5', hasPaidThisRound: true }
    ]
  },
  {
    id: 't3',
    name: 'Tontine Flash Rentrée Scolaire',
    type: 'Argent',
    contributionAmount: 25000,
    frequency: 'Hebdomadaire',
    totalPlaces: 8,
    status: 'Recrutement',
    description: "Tontine rapide sur 8 semaines pour préparer sereinement la rentrée scolaire des enfants. Cagnotte totale de 200 000 FCFA.",
    nextDrawDate: '2026-07-20',
    drawHistory: [],
    participants: [
      { memberId: 'user_current', hasPaidThisRound: false },
      { memberId: 'm2', hasPaidThisRound: false },
      { memberId: 'm6', hasPaidThisRound: false }
    ]
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Kit Alimentaire Premium',
    price: 25000,
    image: '📦',
    category: 'Kits Alimentaires',
    description: 'Comprend : 1 sac de riz parfumé 25kg, 1 bidon d\'huile de 5L, 1 carton de spaghetti (20 sachets), 1 boîte de tomates concentrées et 1 sachet de sel de table 1kg.',
    isPremiumPromo: true,
    discountPercentage: 10
  },
  {
    id: 'p2',
    name: 'Kit Alimentaire De Base',
    price: 15000,
    image: '🧺',
    category: 'Kits Alimentaires',
    description: 'Comprend : 1 sac de riz 10kg, 1 bidon d\'huile de 3L, 5 paquets de pâtes et 1 sachet de cubes d\'assaisonnement.',
    isPremiumPromo: false
  },
  {
    id: 'p3',
    name: 'Sac de Riz Parfumé (25kg)',
    price: 13500,
    image: '🌾',
    category: 'Produits Individuels',
    description: 'Riz parfumé de première qualité, grains longs, saveur excellente.',
    isPremiumPromo: true,
    discountPercentage: 5
  },
  {
    id: 'p4',
    name: 'Bidon d\'Huile Végétale 5L',
    price: 6500,
    image: '🧪',
    category: 'Produits Individuels',
    description: 'Huile végétale raffinée, idéale pour toutes vos fritures et cuissons.',
    isPremiumPromo: false
  },
  {
    id: 'p5',
    name: 'Carton de Spaghetti (20 sachets)',
    price: 5200,
    image: '🍝',
    category: 'Produits Individuels',
    description: 'Spaghetti de blé dur de qualité supérieure, cuisson rapide.',
    isPremiumPromo: false
  },
  {
    id: 'p6',
    name: 'Poulet Entier Congelé (Lot de 3)',
    price: 9000,
    image: '🐔',
    category: 'Produits Individuels',
    description: 'Lot de 3 poulets de chair entiers vidés, d\'environ 1.2kg chacun.',
    isPremiumPromo: true,
    discountPercentage: 8
  }
];

export const INITIAL_POSTS: Post[] = [
  {
    id: 'post_1',
    memberId: 'm2',
    memberName: 'Maman Beatrice',
    memberAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
    memberTier: 'VIP',
    content: "🎉 Tellement heureuse ! Je viens de recevoir mon virement de la tontine d'argent Solidarité Mensuelle (500 000 FCFA). Un grand merci à l'automatisme et la transparence de l'application Tontine & Market Pro ! Cet argent va me permettre d'agrandir mon commerce d'épices. Confiance totale ! 💪🔥",
    likes: 24,
    commentsCount: 3,
    timestamp: 'Il y a 2 heures',
    isPinned: true,
    likedByCurrentUser: true,
    comments: [
      {
        id: 'c1',
        memberName: 'Maman Antoinette',
        content: 'Félicitations maman ! Très mérité, ton sérieux paye toujours ! 🎉👏',
        timestamp: 'Il y a 1 heure'
      },
      {
        id: 'c2',
        memberName: 'Maman Georgette',
        content: 'Superbe réussite ! C\'est motivant de voir que la tontine est 100% fiable.',
        timestamp: 'Il y a 45 min'
      },
      {
        id: 'c3',
        memberName: 'Maman Chantal',
        content: 'Félicitations ma belle ! Prochain tour pour moi j\'espère ! 😉',
        timestamp: 'Il y a 15 min'
      }
    ]
  },
  {
    id: 'post_2',
    memberId: 'm5',
    memberName: 'Maman Martine',
    memberAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    memberTier: 'Vendeuse',
    content: "🌾 Les mamans ! De nouveaux arrivages de sacs de riz parfumé 25kg de qualité supérieure sont disponibles à la boutique. En collaboration avec la Tontine Alimentaire, bénéficiez de réductions spéciales si vous êtes membre Premium 'Maman Fiable+'. Contactez-moi directement ou passez commande via l'onglet Boutique ! Delivery rapide. 📦🚚",
    likes: 18,
    commentsCount: 1,
    timestamp: 'Il y a 5 heures',
    comments: [
      {
        id: 'c4',
        memberName: 'Maman Marie',
        content: 'Je viens de passer commande pour 2 sacs, merci pour le service !',
        timestamp: 'Il y a 3 heures'
      }
    ]
  },
  {
    id: 'post_3',
    memberId: 'm1',
    memberName: 'Maman Antoinette',
    memberAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    memberTier: 'Premium',
    content: "📦 Kit Alimentaire Premium reçu ce matin ! Le sac de riz est excellent et l'huile de cuisine est de super qualité. Merci à la tontine alimentaire ASSI TONTINE pour l'organisation parfaite. C'est tellement plus facile de nourrir la famille ainsi. ❤️",
    likes: 15,
    commentsCount: 0,
    timestamp: 'Hier',
    comments: []
  }
];

export const INITIAL_CHATS: ChatThread[] = [
  {
    id: 'chat_g1',
    name: "Groupe Tontine d'Argent",
    avatar: '💰',
    isGroup: true,
    tontineId: 't1',
    lastMessage: 'Maman Sidonie: Je ferai mon paiement Mobile Money d\'ici ce soir.',
    lastMessageTime: '10:42',
    unreadCount: 2,
    messages: [
      {
        id: 'gm1',
        senderId: 'm2',
        senderName: 'Maman Beatrice',
        senderAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
        content: 'Bonjour les mamans, le tirage de ce mois approche ! Est-ce que tout le monde a cotisé ?',
        timestamp: 'Hier'
      },
      {
        id: 'gm2',
        senderId: 'm1',
        senderName: 'Maman Antoinette',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
        content: 'Oui, de mon côté c\'est déjà réglé par Orange Money ! 👍',
        timestamp: 'Hier'
      },
      {
        id: 'gm3',
        senderId: 'm4',
        senderName: 'Maman Sidonie',
        senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
        content: 'Je ferai mon paiement Mobile Money d\'ici ce soir.',
        timestamp: '10:42'
      }
    ]
  },
  {
    id: 'chat_m2',
    name: 'Maman Beatrice',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
    isGroup: false,
    lastMessage: 'Félicitations pour ton parrainage ! J\'ai bien reçu tes points.',
    lastMessageTime: '09:15',
    unreadCount: 0,
    isOnline: true,
    messages: [
      {
        id: 'm2_m1',
        senderId: 'user_current',
        senderName: 'Maman Marie',
        senderAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
        content: 'Coucou Beatrice, as-tu utilisé mon code de parrainage pour t\'inscrire ?',
        timestamp: 'Hier'
      },
      {
        id: 'm2_m2',
        senderId: 'm2',
        senderName: 'Maman Beatrice',
        senderAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
        content: 'Oui tout à fait ! Félicitations pour ton parrainage ! J\'ai bien reçu tes points.',
        timestamp: '09:15'
      }
    ]
  },
  {
    id: 'chat_m5',
    name: 'Maman Martine (Vendeuse)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    isGroup: false,
    lastMessage: 'Votre commande de kit alimentaire est prête pour livraison.',
    lastMessageTime: 'Hier',
    unreadCount: 0,
    isOnline: false,
    messages: [
      {
        id: 'm5_m1',
        senderId: 'm5',
        senderName: 'Maman Martine',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        content: 'Bonjour Maman Marie, votre commande de kit alimentaire est prête pour livraison.',
        timestamp: 'Hier'
      }
    ]
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx1',
    type: 'Recharge',
    amount: 100000,
    date: '2026-07-10',
    description: 'Recharge Portefeuille par MTN Mobile Money'
  },
  {
    id: 'tx2',
    type: 'Paiement Tontine',
    amount: 50000,
    date: '2026-07-12',
    description: 'Contribution - Solidarité Mensuelle d\'Argent (Session Juillet)'
  },
  {
    id: 'tx3',
    type: 'Paiement Tontine',
    amount: 15000,
    date: '2026-07-13',
    description: 'Contribution - Panier Alimentaire des Mamans (Session Juillet)'
  },
  {
    id: 'tx4',
    type: 'Bonus Parrainage',
    amount: 5000,
    date: '2026-07-14',
    description: 'Bonus inscription filleule Maman Beatrice'
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    type: 'tontine',
    title: '⏰ Cotisation à venir',
    message: "Rappel : Votre cotisation de 15 000 FCFA pour la tontine 'Panier Alimentaire' doit être réglée avant le 25 Juillet.",
    timestamp: 'Il y a 2 heures',
    isRead: false,
    linkToTab: 'tontines'
  },
  {
    id: 'n2',
    type: 'chat',
    title: '💬 Nouveau message tontine',
    message: "Maman Sidonie a écrit : 'Je ferai mon paiement Mobile Money d'ici ce soir.' dans Groupe Tontine d'Argent.",
    timestamp: 'Il y a 3 heures',
    isRead: false,
    linkToTab: 'chat'
  },
  {
    id: 'n3',
    type: 'transaction',
    title: '✅ Rechargement Réussi',
    message: 'Votre compte a été crédité de 100 000 FCFA par MTN Mobile Money. Transaction validée.',
    timestamp: 'Il y a 5 jours',
    isRead: true,
    linkToTab: 'wallet'
  },
  {
    id: 'n4',
    type: 'tontine',
    title: '🎉 Résultats du Tirage',
    message: "Maman Beatrice a remporté la cagnotte de 500 000 FCFA pour la Tontine d'Argent de Juillet !",
    timestamp: 'Il y a 2 jours',
    isRead: true,
    linkToTab: 'tontines'
  }
];

export const INITIAL_SYSTEM_LOGS: any[] = [
  {
    id: 'log1',
    type: 'creation_compte',
    userId: 'm5',
    userName: 'Maman Martine',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    description: 'Création de compte de Maman Martine (Rôle: Membre, Statut: Validé)',
    timestamp: 'Il y a 10 minutes'
  },
  {
    id: 'log2',
    type: 'creation_compte',
    userId: 'm_pending1',
    userName: 'Maman Florence',
    userAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=200',
    description: "Demande d'inscription soumise par Maman Florence (Statut: En attente d'approbation)",
    timestamp: 'Il y a 25 minutes'
  },
  {
    id: 'log3',
    type: 'validation_compte',
    userId: 'm2',
    userName: 'Maman Beatrice',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
    description: 'Compte de Maman Beatrice validé et approuvé par Super Admin Maman Marie',
    timestamp: 'Il y a 1 heure'
  },
  {
    id: 'log4',
    type: 'creation_tontine',
    userId: 'user_current',
    userName: 'Maman Marie',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    description: "Création d'une nouvelle tontine : 'Solidarité Mensuelle d'Argent' par Super Admin Maman Marie",
    timestamp: 'Il y a 2 heures'
  },
  {
    id: 'log5',
    type: 'cotisation',
    userId: 'm1',
    userName: 'Maman Antoinette',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    description: "Cotisation de 50 000 FCFA payée par Maman Antoinette pour 'Solidarité Mensuelle d'Argent'",
    timestamp: 'Il y a 3 heures'
  },
  {
    id: 'log6',
    type: 'changement_role',
    userId: 'm1',
    userName: 'Maman Antoinette',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    description: 'Rôle de Maman Antoinette mis à jour vers [Administrateur] par Super Admin Maman Marie',
    timestamp: 'Il y a 1 jour'
  },
  {
    id: 'log7',
    type: 'creation_compte',
    userId: 'm_pending2',
    userName: 'Maman Fatoumata',
    userAvatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=200',
    description: "Demande d'inscription soumise par Maman Fatoumata (Statut: En attente d'approbation)",
    timestamp: 'Il y a 1 jour'
  }
];

