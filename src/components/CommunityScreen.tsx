import React, { useState } from 'react';
import { 
  Users, 
  Rss, 
  Heart, 
  MessageCircle, 
  Search, 
  Plus, 
  Lock,
  ArrowRight,
  Send,
  Pin
} from 'lucide-react';
import { Member, Post, UserProfile, SubscriptionTier } from '../types';

interface CommunityScreenProps {
  members: Member[];
  setMembers?: React.Dispatch<React.SetStateAction<Member[]>>;
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  currentUser: UserProfile;
  setActiveTab: (tab: string) => void;
}

export default function CommunityScreen({
  members,
  setMembers,
  posts,
  setPosts,
  currentUser,
  setActiveTab
}: CommunityScreenProps) {
  const [activeSubTab, setActiveSubTab] = useState<'membres' | 'social'>('social');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberReliabilityFilter, setMemberReliabilityFilter] = useState<'All' | 'Fiable' | 'Sérieuse' | 'Observation'>('All');
  
  // New social post state
  const [newPostContent, setNewPostContent] = useState('');
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  // New comment state
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  const getReliabilityTier = (score: number) => {
    if (score >= 80) return 'Fiable';
    if (score >= 60) return 'Sérieuse';
    return 'Observation';
  };

  const getTierBadge = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'VIP':
        return <span className="bg-purple-50 text-purple-700 text-[8px] font-bold px-2 py-0.5 rounded-full border border-purple-100">💎 VIP</span>;
      case 'Premium':
        return <span className="bg-amber-50 text-amber-700 text-[8px] font-bold px-2 py-0.5 rounded-full border border-amber-100">🌟 Or</span>;
      case 'Vendeuse':
        return <span className="bg-teal-50 text-teal-700 text-[8px] font-bold px-2 py-0.5 rounded-full border border-teal-100">🤝 Vendeuse</span>;
      default:
        return <span className="bg-slate-50 text-slate-500 text-[8px] font-bold px-2 py-0.5 rounded-full border border-slate-100">🌱 Vert</span>;
    }
  };

  // Like a post
  const handleLikePost = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const liked = !p.likedByCurrentUser;
        return {
          ...p,
          likedByCurrentUser: liked,
          likes: liked ? p.likes + 1 : p.likes - 1
        };
      }
      return p;
    }));
  };

  // Add a comment
  const handleAddComment = (postId: string) => {
    if (!newCommentText.trim()) return;

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const newComment = {
          id: `comment_${Date.now()}`,
          memberName: currentUser.name,
          content: newCommentText,
          timestamp: 'À l\'instant'
        };
        return {
          ...p,
          commentsCount: p.commentsCount + 1,
          comments: [...(p.comments || []), newComment]
        };
      }
      return p;
    }));

    setNewCommentText('');
    setActiveCommentPostId(null);
  };

  // Submit new post
  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;

    const newPost: Post = {
      id: `post_${Date.now()}`,
      memberId: 'user_current',
      memberName: currentUser.name,
      memberAvatar: currentUser.avatar,
      memberTier: currentUser.tier,
      content: newPostContent,
      likes: 0,
      commentsCount: 0,
      timestamp: "À l'instant",
      comments: []
    };

    setPosts(prev => [newPost, ...prev]);
    setNewPostContent('');
    setIsCreatingPost(false);
  };

  // Filter members
  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(memberSearchQuery.toLowerCase());
    const rel = getReliabilityTier(m.reliabilityScore);
    const matchesRel = memberReliabilityFilter === 'All' || rel === memberReliabilityFilter;
    return matchesSearch && matchesRel;
  });

  const isFreeUser = currentUser.tier === 'Gratuit';

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      
      {/* DOUBLE HEADER TABS */}
      <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 shadow-sm">
        <button
          onClick={() => setActiveSubTab('social')}
          className={`flex-1 text-center py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'social' 
              ? 'bg-white text-[#0175C2] shadow-sm font-extrabold' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Rss className="w-3.5 h-3.5" />
          Mini-Réseau Social
        </button>
        <button
          onClick={() => setActiveSubTab('membres')}
          className={`flex-1 text-center py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'membres' 
              ? 'bg-white text-[#0175C2] shadow-sm font-extrabold' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Mamans Fiables ({members.length})
        </button>
      </div>

      {/* SUB-SCREEN 1: MINI-SOCIAL FEED */}
      {activeSubTab === 'social' && (
        <div className="space-y-4">
          
          {/* CREATE POST BAR */}
          {isFreeUser ? (
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-xs text-slate-500 shadow-sm">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>La publication est réservée aux abonnés Premium.</span>
              </div>
              <button 
                onClick={() => setActiveTab('wallet')} 
                className="text-[10px] font-bold text-[#0175C2] flex items-center hover:underline"
              >
                Passez Premium <ArrowRight className="w-3 h-3 ml-0.5" />
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 p-4 rounded-3xl space-y-2.5 shadow-sm">
              {!isCreatingPost ? (
                <div 
                  onClick={() => setIsCreatingPost(true)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <img src={currentUser.avatar || undefined} alt="" className="w-7.5 h-7.5 rounded-full object-cover border border-slate-100" />
                  <div className="flex-1 bg-slate-50 border border-slate-100 text-xs text-slate-500 p-2.5 rounded-xl font-medium">
                    Partagez un achat, un témoignage ou un succès...
                  </div>
                  <button className="w-8 h-8 rounded-full bg-[#0175C2]/10 text-[#0175C2] flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Nouvelle publication</span>
                    <button onClick={() => setIsCreatingPost(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xs">✕</button>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Publiez un message sur le mur des mamans fiables..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="w-full bg-slate-50 text-xs text-slate-800 p-3 rounded-xl border border-slate-150 focus:outline-none focus:border-slate-300 resize-none font-semibold"
                  />
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setIsCreatingPost(false)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-600 font-bold rounded-lg transition-colors"
                    >
                      Annuler
                    </button>
                    <button 
                      onClick={handleCreatePost}
                      className="px-3.5 py-1.5 bg-[#0175C2] hover:bg-[#02569B] text-[10px] text-white font-bold rounded-lg transition-all"
                    >
                      Publier
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SOCIAL POSTS LIST */}
          <div className="space-y-4 text-slate-800">
            {posts.map(p => {
              const isLiked = p.likedByCurrentUser;
              return (
                <div 
                  key={p.id}
                  className="bg-white border border-slate-100 p-4.5 rounded-3xl space-y-3.5 shadow-sm"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <img src={p.memberAvatar || undefined} alt={p.memberName} className="w-8.5 h-8.5 rounded-full object-cover border border-slate-100" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 leading-tight">{p.memberName}</h4>
                          {getTierBadge(p.memberTier)}
                        </div>
                        <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">{p.timestamp}</span>
                      </div>
                    </div>

                    {p.isPinned && (
                      <span className="text-[8px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-1 font-bold">
                        <Pin className="w-2.5 h-2.5 shrink-0" /> Épinglé
                      </span>
                    )}
                  </div>

                  {/* Body Text */}
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{p.content}</p>

                  {/* Micro Interactions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500 font-semibold select-none">
                    <button 
                      onClick={() => handleLikePost(p.id)}
                      className={`flex items-center gap-1.5 hover:text-rose-600 transition-colors ${isLiked ? 'text-rose-600 font-bold animate-pulse' : ''}`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                      <span>{p.likes}</span>
                    </button>

                    <button 
                      onClick={() => {
                        setActiveCommentPostId(activeCommentPostId === p.id ? null : p.id);
                      }}
                      className="flex items-center gap-1.5 hover:text-[#0175C2] transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{p.commentsCount} Commentaires</span>
                    </button>
                  </div>

                  {/* COMMENTS EXPANSION PANEL */}
                  {activeCommentPostId === p.id && (
                    <div className="pt-3.5 border-t border-slate-100 space-y-3.5">
                      <div className="space-y-2.5">
                        {p.comments && p.comments.map(c => (
                          <div key={c.id} className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 space-y-0.5">
                            <div className="flex justify-between font-bold text-slate-800">
                              <span>{c.memberName}</span>
                              <span className="text-[8px] text-slate-400 font-normal">{c.timestamp}</span>
                            </div>
                            <p className="text-slate-600 leading-relaxed text-[11px]">{c.content}</p>
                          </div>
                        ))}
                      </div>

                      {/* Comment Input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Écrivez un commentaire..."
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          className="flex-1 bg-slate-50 text-xs text-slate-800 px-3.5 py-2 rounded-xl border border-slate-150 focus:outline-none focus:border-[#0175C2] font-semibold"
                        />
                        <button
                          onClick={() => handleAddComment(p.id)}
                          className="p-2 bg-[#0175C2] text-white hover:bg-[#02569B] rounded-xl transition-all"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* SUB-SCREEN 2: MEMBERS DIRECTORY */}
      {activeSubTab === 'membres' && (
        <div className="space-y-4">
          
          {/* SEARCH & FILTERS */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher une maman..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="w-full bg-white text-xs text-slate-800 pl-9 pr-4 py-2.5 rounded-2xl border border-slate-150 focus:outline-none focus:border-[#0175C2] font-semibold shadow-sm"
              />
            </div>

            {/* Reliability score presets filters */}
            <div className="flex gap-1.5 text-[10px] font-bold overflow-x-auto no-scrollbar py-0.5">
              {(['All', 'Fiable', 'Sérieuse', 'Observation'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setMemberReliabilityFilter(f)}
                  className={`py-1 px-3 rounded-full border transition-all shrink-0 ${
                    memberReliabilityFilter === f
                      ? 'bg-[#0175C2]/10 border-[#0175C2] text-[#0175C2] font-bold'
                      : 'bg-white border-slate-100 text-slate-500 hover:text-slate-850 shadow-sm'
                  }`}
                >
                  {f === 'All' && 'Tout'}
                  {f === 'Fiable' && '🌟 Fiables (80-100%)'}
                  {f === 'Sérieuse' && '👍 Sérieuses (60-79%)'}
                  {f === 'Observation' && '⚠️ Obs. (0-59%)'}
                </button>
              ))}
            </div>
          </div>

          {/* MEMBERS LIST */}
          <div className="space-y-2.5">
            {filteredMembers.map(m => {
              const scoreTier = getReliabilityTier(m.reliabilityScore);
              
              return (
                <div 
                  key={m.id}
                  className="p-3.5 bg-white border border-slate-100 rounded-3xl flex items-center justify-between shadow-sm hover:border-slate-200 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <img src={m.avatar || undefined} alt={m.name} className="w-9 h-9 rounded-full object-cover border border-slate-100" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{m.name}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {getTierBadge(m.tier)}
                        
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${
                          scoreTier === 'Fiable' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : scoreTier === 'Sérieuse'
                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                            : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                          ⭐ {m.reliabilityScore}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-semibold block">Qualité :</span>
                    <span className={`text-[10px] font-bold ${
                      scoreTier === 'Fiable' ? 'text-emerald-600' : scoreTier === 'Sérieuse' ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {scoreTier === 'Fiable' && 'Maman Fiable'}
                      {scoreTier === 'Sérieuse' && 'Maman Sérieuse'}
                      {scoreTier === 'Observation' && 'En observation'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}
