import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  ArrowLeft, 
  Send, 
  Lock, 
  Unlock, 
  Clock, 
  Circle,
  AlertCircle
} from 'lucide-react';
import { ChatThread, Message, UserProfile } from '../types';

interface ChatScreenProps {
  chats: ChatThread[];
  setChats: React.Dispatch<React.SetStateAction<ChatThread[]>>;
  currentUser: UserProfile;
  triggerNotification?: (type: 'tontine' | 'chat' | 'transaction' | 'alert', title: string, message: string, linkToTab?: string) => void;
}

export default function ChatScreen({
  chats,
  setChats,
  currentUser,
  triggerNotification
}: ChatScreenProps) {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [newMsgContent, setNewMsgContent] = useState('');
  const [isSecretMode, setIsSecretMode] = useState(false);
  const [countdownMsgId, setCountdownMsgId] = useState<string | null>(null);
  const [countdownVal, setCountdownVal] = useState<number>(0);
  
  const selectedChat = chats.find(c => c.id === selectedChatId);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedChat?.messages, selectedChat?.isTyping]);

  // Handle countdown for secret messages
  useEffect(() => {
    if (!countdownMsgId || countdownVal <= 0) return;

    const interval = setInterval(() => {
      setCountdownVal(prev => {
        if (prev <= 1) {
          // Remove the secret message from the list
          setChats(chatsPrev => chatsPrev.map(c => {
            if (c.id === selectedChatId) {
              return {
                ...c,
                messages: c.messages.filter(m => m.id !== countdownMsgId)
              };
            }
            return c;
          }));
          setCountdownMsgId(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [countdownMsgId, countdownVal, selectedChatId, setChats]);

  // Send message
  const handleSendMessage = () => {
    if (!newMsgContent.trim() || !selectedChatId) return;

    const messageId = `msg_${Date.now()}`;
    const userMessage: Message = {
      id: messageId,
      senderId: 'user_current',
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      content: newMsgContent,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      isSecret: isSecretMode
    };

    // Update messages
    setChats(prev => prev.map(c => {
      if (c.id === selectedChatId) {
        return {
          ...c,
          lastMessage: isSecretMode ? '🤫 Message secret' : `${currentUser.name}: ${newMsgContent}`,
          lastMessageTime: userMessage.timestamp,
          messages: [...c.messages, userMessage]
        };
      }
      return c;
    }));

    setNewMsgContent('');

    // If it's secret mode, start self-destruct timer
    if (isSecretMode) {
      setCountdownMsgId(messageId);
      setCountdownVal(5); // 5 seconds to read
    }

    // Trigger AI / simulated response after a small delay
    triggerSimulatedResponse(selectedChatId, newMsgContent, isSecretMode);
  };

  // Simulate conversation responses
  const triggerSimulatedResponse = (chatId: string, userText: string, userSecret: boolean) => {
    // 1. Mark as typing
    setTimeout(() => {
      setChats(prev => prev.map(c => {
        if (c.id === chatId) {
          return { ...c, isTyping: true, isOnline: true };
        }
        return c;
      }));
    }, 1500);

    // 2. Append reply
    setTimeout(() => {
      let replyText = "Bonjour Maman Marie, j'ai bien reçu votre message. Ensemble construisons une tontine forte ! 💪";
      let responderName = "Maman Beatrice";
      let responderAvatar = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200';
      let responderId = 'm2';

      if (chatId === 'chat_g1') {
        responderId = 'm1';
        responderName = "Maman Antoinette";
        responderAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200';
        
        if (userText.toLowerCase().includes('cotis') || userText.toLowerCase().includes('pay')) {
          replyText = "Oui ! De mon côté c'est déjà payé d'avance par Orange Money. L'automatisme de l'app est parfait !";
        } else if (userText.toLowerCase().includes('tirage') || userText.toLowerCase().includes('gagn')) {
          replyText = "Hâte de voir qui sera la gagnante de ce mois ! Les certificats de tirage sécurisés me rassurent beaucoup.";
        } else {
          replyText = "Bonjour les mamans, j'espère que vous passez une excellente journée productive !";
        }
      } else if (chatId === 'chat_m5') {
        responderId = 'm5';
        responderName = "Maman Martine (Vendeuse)";
        responderAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200';
        
        if (userText.toLowerCase().includes('command') || userText.toLowerCase().includes('kit') || userText.toLowerCase().includes('livr')) {
          replyText = "Votre commande est bien enregistrée ! Nos kits alimentaires Premium de riz et huile sont prêts pour livraison demain matin.";
        } else {
          replyText = "Coucou Maman Marie, de quoi as-tu besoin aujourd'hui pour ta cuisine ? Des kits disponibles !";
        }
      } else {
        // Individual Beatrice response
        if (userSecret) {
          replyText = "🤫 Ouh là, un message secret ! Je l'ai lu, c'est super discret et sécurisé !";
        } else if (userText.toLowerCase().includes('parrain') || userText.toLowerCase().includes('code')) {
          replyText = "Oui, j'ai utilisé ton code de parrainage et j'ai eu mon bonus immédiat de bienvenue !";
        } else {
          replyText = "Tout à fait, nous avançons bien ! C'est vraiment la meilleure application de tontine.";
        }
      }

      const botMessage: Message = {
        id: `msg_${Date.now()}`,
        senderId: responderId,
        senderName: responderName,
        senderAvatar: responderAvatar,
        content: replyText,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };

      setChats(prev => prev.map(c => {
        if (c.id === chatId) {
          return {
            ...c,
            isTyping: false,
            lastMessage: `${responderName}: ${replyText}`,
            lastMessageTime: botMessage.timestamp,
            messages: [...c.messages, botMessage],
            unreadCount: 0
          };
        }
        return c;
      }));

      if (triggerNotification) {
        triggerNotification(
          'chat',
          `💬 Message de ${responderName}`,
          replyText.length > 55 ? `${replyText.substring(0, 52)}...` : replyText,
          'chat'
        );
      }

    }, 3800);
  };

  return (
    <div className="space-y-4 animate-fade-in flex-1 flex flex-col h-full min-h-[580px] pb-10 text-slate-800">
      
      {!selectedChatId ? (
        // THREADS LIST
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle className="w-5 h-5 text-[#0175C2]" />
            <h2 className="text-md font-bold text-slate-900">Discussions de Groupe & Privées</h2>
          </div>

          <div className="space-y-2.5">
            {chats.map(c => (
              <div
                key={c.id}
                onClick={() => {
                  setSelectedChatId(c.id);
                  // Reset unread count
                  setChats(prev => prev.map(chat => chat.id === c.id ? { ...chat, unreadCount: 0 } : chat));
                }}
                className="p-3.5 bg-white border border-slate-100 rounded-3xl flex items-center justify-between cursor-pointer transition-all hover:border-slate-200 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    {c.isGroup ? (
                      <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl select-none">
                        {c.avatar}
                      </div>
                    ) : (
                      <img src={c.avatar || undefined} alt={c.name} className="w-10 h-10 rounded-full object-cover border border-slate-100" />
                    )}

                    {/* Online indicator */}
                    {!c.isGroup && c.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <h4 className="text-xs font-extrabold text-slate-900 truncate leading-tight">{c.name}</h4>
                      {c.isGroup && (
                        <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-bold">Groupe</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5 leading-snug">{c.lastMessage}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[9px] text-slate-400 font-bold block">{c.lastMessageTime}</span>
                  {c.unreadCount > 0 && (
                    <span className="mt-1 inline-block bg-rose-500 text-white font-extrabold px-1.5 py-0.2 rounded-full text-[9px]">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-rose-50 border border-rose-100 rounded-3xl flex items-start gap-2.5 text-xs text-rose-800 shadow-sm animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-extrabold text-rose-955 block leading-tight">Confidentialité Assurée</span>
              <p className="text-[10px] text-rose-700 leading-relaxed font-semibold">
                Utilisez l'icône de cadenas lors de vos discussions privées pour activer les messages secrets auto-supprimés (parfaits pour partager des codes de paiement sensibles).
              </p>
            </div>
          </div>
        </div>
      ) : (
        // ACTIVE DISCUSSION WINDOW
        <div className="flex-1 flex flex-col bg-white border border-slate-100 rounded-3xl overflow-hidden relative shadow-sm">
          
          {/* Active chat header */}
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => {
                  setSelectedChatId(null);
                  setIsSecretMode(false);
                }} 
                className="p-1.5 text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-2">
                {selectedChat?.isGroup ? (
                  <div className="w-8.5 h-8.5 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-lg">
                    {selectedChat.avatar}
                  </div>
                ) : (
                  <img src={selectedChat?.avatar || undefined} alt="" className="w-8.5 h-8.5 rounded-full object-cover border border-slate-100" />
                )}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">{selectedChat?.name}</h4>
                  <div className="flex items-center gap-1 mt-0.5">
                    {selectedChat?.isTyping ? (
                      <span className="text-[9px] text-amber-600 font-extrabold animate-pulse">En train d'écrire...</span>
                    ) : selectedChat?.isGroup ? (
                      <span className="text-[9px] text-slate-400 font-semibold">Membres actifs</span>
                    ) : selectedChat?.isOnline ? (
                      <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
                        <Circle className="w-1.5 h-1.5 fill-emerald-500 text-emerald-500" /> En ligne
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-400 font-semibold">Hors ligne</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Secret chat status toggle */}
            <button
              onClick={() => setIsSecretMode(!isSecretMode)}
              className={`p-1.5 rounded-xl border transition-all flex items-center gap-1.5 text-[9px] font-bold ${
                isSecretMode 
                  ? 'bg-purple-50 border-purple-250 text-purple-700 shadow-sm font-extrabold' 
                  : 'bg-white border-slate-150 text-slate-500 hover:text-slate-800 shadow-sm'
              }`}
              title={isSecretMode ? "Mode Secret Actif (Auto-suppression)" : "Activer Discussion Secrète"}
            >
              {isSecretMode ? <Lock className="w-3 h-3 text-purple-600" /> : <Unlock className="w-3 h-3 text-slate-400" />}
              <span>{isSecretMode ? 'Secret Actif' : 'Secret'}</span>
            </button>
          </div>

          {/* ACTIVE CHAT BUBBLES CONTAINER */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 max-h-[420px] no-scrollbar">
            {selectedChat?.messages.map((m) => {
              const isCurrentUser = m.senderId === 'user_current';
              return (
                <div 
                  key={m.id}
                  className={`flex gap-2.5 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isCurrentUser && (
                    <img src={m.senderAvatar || undefined} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 mt-1 border border-slate-100" />
                  )}

                  <div className="space-y-0.5 max-w-[75%]">
                    {!isCurrentUser && selectedChat.isGroup && (
                      <span className="text-[9px] text-slate-400 font-bold pl-1">{m.senderName}</span>
                    )}
                    
                    <div className={`p-3 rounded-2xl text-xs relative overflow-hidden ${
                      isCurrentUser 
                        ? m.isSecret
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none shadow-md border border-purple-400'
                          : 'bg-[#0175C2] text-white rounded-tr-none shadow-sm' 
                        : 'bg-slate-100 text-slate-850 rounded-tl-none font-medium'
                    }`}>
                      <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>

                      {/* Secret mode indicators */}
                      {m.isSecret && (
                        <div className="mt-1.5 pt-1.5 border-t border-purple-500/50 flex justify-between items-center text-[9px] text-purple-200">
                          <span className="flex items-center gap-1 font-bold">
                            <Clock className="w-3 h-3" /> Destruction dans :
                          </span>
                          <span className="font-mono font-extrabold text-amber-300">
                            {countdownMsgId === m.id ? `${countdownVal}s` : '5s'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <span className={`text-[8px] text-slate-400 block font-semibold ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator bubble */}
            {selectedChat?.isTyping && (
              <div className="flex gap-2.5 justify-start">
                <img src={selectedChat.isGroup ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' : (selectedChat.avatar || undefined)} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 mt-1" />
                <div className="bg-slate-50 text-slate-400 p-2.5 rounded-2xl rounded-tl-none flex items-center gap-1 border border-slate-100 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ACTIVE CHAT INPUT CONTAINER */}
          <div className={`p-3.5 border-t flex gap-2 items-center ${
            isSecretMode ? 'border-purple-100 bg-purple-50/40' : 'border-slate-100 bg-slate-50'
          }`}>
            <input
              type="text"
              placeholder={isSecretMode ? "🤫 Entrez un message secret..." : "Écrivez votre message..."}
              value={newMsgContent}
              onChange={(e) => setNewMsgContent(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
              className="flex-1 bg-white text-xs text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-150 focus:outline-none focus:border-[#0175C2] font-semibold"
            />
            <button
              onClick={handleSendMessage}
              className={`p-2.5 rounded-xl text-white font-bold transition-all shadow-md active:scale-95 ${
                isSecretMode 
                  ? 'bg-purple-600 hover:bg-purple-700' 
                  : 'bg-[#0175C2] hover:bg-[#02569B]'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
