import React, { useState } from 'react';
import { 
  ShoppingCart, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  Percent, 
  Coins, 
  ArrowRight,
  Info
} from 'lucide-react';
import { Product, UserProfile } from '../types';

interface BoutiqueScreenProps {
  products: Product[];
  setProducts?: React.Dispatch<React.SetStateAction<Product[]>>;
  currentUser: UserProfile;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  addTransaction: (type: 'Recharge' | 'Paiement Tontine' | 'Achat Boutique' | 'Réception Tontine' | 'Bonus Parrainage', amount: number, description: string) => void;
  setActiveTab: (tab: string) => void;
  selectedCategory: 'Kits Alimentaires' | 'Produits Individuels';
  setSelectedCategory: (cat: 'Kits Alimentaires' | 'Produits Individuels') => void;
  triggerNotification?: (type: 'tontine' | 'chat' | 'transaction' | 'alert', title: string, message: string, linkToTab?: string) => void;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function BoutiqueScreen({
  products,
  setProducts,
  currentUser,
  setCurrentUser,
  addTransaction,
  setActiveTab,
  selectedCategory,
  setSelectedCategory,
  triggerNotification
}: BoutiqueScreenProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Seller / Add Product states
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState(5000);
  const [newProdCategory, setNewProdCategory] = useState<'Kits Alimentaires' | 'Produits Individuels'>('Kits Alimentaires');
  const [newProdImg, setNewProdImg] = useState('🍅');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdDiscount, setNewProdDiscount] = useState(0);

  const handleAddProduct = () => {
    if (!newProdName.trim()) {
      alert("Veuillez donner un nom à votre produit.");
      return;
    }

    if (!setProducts) return;

    const newProduct: Product = {
      id: `p_${Date.now()}`,
      name: newProdName,
      description: newProdDesc || "Produit de qualité supérieure proposé par nos mamans maraîchères de la coopérative.",
      price: Number(newProdPrice),
      image: newProdImg || "🍅",
      category: newProdCategory,
      discountPercentage: Number(newProdDiscount) > 0 ? Number(newProdDiscount) : undefined
    };

    setProducts(prev => [newProduct, ...prev]);
    
    // reset form
    setNewProdName('');
    setNewProdDesc('');
    setNewProdPrice(5000);
    setNewProdDiscount(0);
    setShowAddProduct(false);

    if (triggerNotification) {
      triggerNotification(
        'transaction',
        '🧑‍🌾 Nouvel arrivage au Marché !',
        `Le produit '${newProdName}' vient d'être mis en ligne par une maman vendeuse.`,
        'boutique'
      );
    }

    alert("Votre article a été publié sur la boutique avec succès !");
  };

  const getPrice = (product: Product) => {
    const isPremiumUser = currentUser.tier === 'Premium' || currentUser.tier === 'VIP';
    if (isPremiumUser && product.discountPercentage) {
      return product.price * (1 - product.discountPercentage / 100);
    }
    return product.price;
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const getCartTotal = () => {
    return cart.reduce((acc, item) => acc + (getPrice(item.product) * item.quantity), 0);
  };

  const getOriginalTotalWithoutDiscount = () => {
    return cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    const total = getCartTotal();
    if (currentUser.walletBalance < total) {
      alert(`Solde insuffisant dans votre portefeuille (${currentUser.walletBalance.toLocaleString('fr-FR')} F). Veuillez effectuer une recharge.`);
      setActiveTab('wallet');
      return;
    }

    // Deduct from user wallet
    setCurrentUser(prev => ({
      ...prev,
      walletBalance: prev.walletBalance - total
    }));

    // Register transaction
    addTransaction(
      'Achat Boutique',
      total,
      `Achat Boutique : ${cart.map(item => `${item.quantity}x ${item.product.name}`).join(', ')}`
    );

    if (triggerNotification) {
      triggerNotification(
        'transaction',
        '🛍️ Commande Validée !',
        `Votre commande de ${total.toLocaleString('fr-FR')} F a été enregistrée. Elle est prête pour expédition !`,
        'wallet'
      );
    }

    // Empty cart and show success
    setCart([]);
    setCheckoutSuccess(true);
    setTimeout(() => {
      setCheckoutSuccess(false);
      setShowCart(false);
    }, 4000);
  };

  const filteredProducts = products.filter(p => p.category === selectedCategory);
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const isPremiumUser = currentUser.tier === 'Premium' || currentUser.tier === 'VIP';

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      
      {/* SHOPPING HEADER */}
      <div className="flex justify-between items-center z-10 py-1">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-teal-600" />
          <h2 className="text-md font-bold text-slate-900">Boutique Alimentaire</h2>
        </div>

        <button 
          onClick={() => setShowCart(!showCart)}
          className="relative bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-100 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Panier</span>
          {cartItemCount > 0 && (
            <span className="bg-rose-500 text-white font-extrabold px-1.5 py-0.2 rounded-full text-[10px]">
              {cartItemCount}
            </span>
          )}
        </button>
      </div>

      {/* MEMBERSHIP DISCOUNT BANNER */}
      {isPremiumUser ? (
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between text-xs text-emerald-700 shadow-sm">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="font-medium">
              <span className="font-bold">Privilèges Actifs :</span> Réductions 'Maman Fiable+' appliquées automatiquement sur les kits !
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3.5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between text-xs text-slate-600 shadow-sm">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#0175C2] mt-0.5 shrink-0" />
            <p className="leading-relaxed">
              Devenez membre <span className="font-bold text-[#0175C2]">'Maman Fiable+'</span> pour obtenir jusqu'à <span className="font-bold text-emerald-600">10% de réduction</span> sur tous vos kits alimentaires !
            </p>
          </div>
        </div>
      )}

      {/* SELLER PANEL (Vendeuse, Admin, Super Admin) */}
      {(currentUser.tier === 'Vendeuse' || currentUser.role === 'Admin' || currentUser.role === 'Super Admin') && (
        <div className="bg-[#E6F4EA] border border-emerald-200/50 rounded-3xl p-4 space-y-3.5 shadow-sm animate-fade-in text-slate-800">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-emerald-600 text-white font-black text-[8px] uppercase tracking-wider">VENDEUSE</span>
              <h3 className="text-[11px] font-bold text-emerald-800">Votre étalage maraîcher</h3>
            </div>
            <button
              onClick={() => setShowAddProduct(!showAddProduct)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[9px] py-1 px-2.5 rounded-xl transition-all active:scale-95 shadow-sm"
            >
              {showAddProduct ? 'Fermer ×' : 'Ajouter un Produit 🧑‍🌾'}
            </button>
          </div>

          {showAddProduct && (
            <div className="space-y-3 bg-white p-3 rounded-2xl border border-emerald-100 mt-2 text-xs">
              <div>
                <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Nom de l'article / kit</label>
                <input
                  type="text"
                  placeholder="Ex: Sac de piments frais du jardin"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Catégorie</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value as 'Kits Alimentaires' | 'Produits Individuels')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="Kits Alimentaires">🍲 Kits Complets</option>
                    <option value="Produits Individuels">🌽 Produits de Détail</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Émoji / Visuel</label>
                  <select
                    value={newProdImg}
                    onChange={(e) => setNewProdImg(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="🍅">🍅 Tomates fraîches</option>
                    <option value="🍚">🍚 Riz parfumé</option>
                    <option value="🌶️">🌶️ Piment rouge</option>
                    <option value="🥔">🥔 Pommes de terre</option>
                    <option value="🧅">🧅 Oignons</option>
                    <option value="🍗">🍗 Poulet frais</option>
                    <option value="🥩">🥩 Viande de Boeuf</option>
                    <option value="🥕">🥕 Carottes</option>
                    <option value="🍌">🍌 Banane pays</option>
                    <option value="🐟">🐟 Poisson séché</option>
                    <option value="📦">📦 Kit Divers</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Prix (FCFA)</label>
                  <input
                    type="number"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Réduction (%)</label>
                  <input
                    type="number"
                    value={newProdDiscount}
                    onChange={(e) => setNewProdDiscount(Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Description (optionnelle)</label>
                <textarea
                  placeholder="Décrivez la qualité, le poids ou la composition..."
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs h-16 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                onClick={handleAddProduct}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] py-2 rounded-xl uppercase transition-colors shadow-sm active:scale-99"
              >
                Mettre en vente sur le Marché 🛒
              </button>
            </div>
          )}
        </div>
      )}

      {/* CATEGORY SWITCHERS */}
      <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 shadow-sm">
        <button
          onClick={() => setSelectedCategory('Kits Alimentaires')}
          className={`flex-1 text-center py-2.5 rounded-xl text-xs font-bold transition-all ${
            selectedCategory === 'Kits Alimentaires' 
              ? 'bg-white text-teal-700 shadow-sm font-extrabold' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          🍲 Kits Complets
        </button>
        <button
          onClick={() => setSelectedCategory('Produits Individuels')}
          className={`flex-1 text-center py-2.5 rounded-xl text-xs font-bold transition-all ${
            selectedCategory === 'Produits Individuels' 
              ? 'bg-white text-teal-700 shadow-sm font-extrabold' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          🌽 Produits de Détail
        </button>
      </div>

      {/* PRODUCTS GRID */}
      <div className="grid grid-cols-1 gap-3.5">
        {filteredProducts.map(p => {
          const discountPrice = getPrice(p);
          const hasDiscount = discountPrice < p.price;

          return (
            <div 
              key={p.id}
              className="bg-white border border-slate-100 p-4 rounded-3xl flex gap-3.5 hover:border-slate-200 transition-all shadow-sm"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl shrink-0 select-none">
                {p.image}
              </div>

              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 truncate">{p.name}</h3>
                  <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{p.description}</p>
                </div>

                <div className="flex justify-between items-end mt-2.5">
                  <div className="space-y-1">
                    {hasDiscount && (
                      <span className="text-[8px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 border border-rose-100 rounded-full inline-block">
                        Promo -{p.discountPercentage}%
                      </span>
                    )}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-teal-700">
                        {discountPrice.toLocaleString('fr-FR')} F
                      </span>
                      {hasDiscount && (
                        <span className="text-[9px] text-slate-400 line-through font-semibold">
                          {p.price.toLocaleString('fr-FR')} F
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center">
                    {/* Admin/Super Admin Delete product controls */}
                    {(currentUser.role === 'Admin' || currentUser.role === 'Super Admin') && (
                      <button
                        onClick={() => {
                          if (setProducts) {
                            setProducts(prev => prev.filter(x => x.id !== p.id));
                            if (triggerNotification) {
                              triggerNotification(
                                'alert',
                                '🛡️ Article Modéré',
                                `L'article '${p.name}' a été retiré de la vente par l'administrateur.`,
                                'boutique'
                              );
                            }
                          }
                        }}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 font-bold text-[10px] p-2 rounded-xl transition-all mr-2 active:scale-95"
                        title="Retirer cet article"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => addToCart(p)}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-[10px] py-1.5 px-3.5 rounded-xl flex items-center gap-1 transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" /> Ajouter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SLIDE-OVER BASKET (SHOPPING CART) */}
      {showCart && (
        <div className="fixed inset-x-0 bottom-0 top-0 bg-slate-950/40 backdrop-blur-xs z-50 flex justify-end">
          <div className="w-full max-w-[405px] h-full bg-white border-l border-slate-100 flex flex-col justify-between overflow-hidden shadow-2xl relative text-slate-800">
            
            {/* CART HEADER */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-2 text-teal-700 font-bold text-sm">
                <ShoppingCart className="w-5 h-5" />
                <span>Mon Panier Alimentaire</span>
              </div>
              <button 
                onClick={() => setShowCart(false)} 
                className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            {/* CART CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {checkoutSuccess ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 p-4 animate-scale-up">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 text-3xl">
                    ✓
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Commande Validée ! 🎉</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Le montant a été débité de votre portefeuille. Votre livraison de kit alimentaire est en préparation !
                  </p>
                  <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 text-[10px] text-slate-600 w-full font-medium">
                    Statut : <span className="text-[#0175C2] font-bold">Livraison en cours (24h-48h)</span>
                  </div>
                </div>
              ) : cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                  <ShoppingBag className="w-12 h-12 text-slate-350" />
                  <span className="text-xs font-bold text-slate-800">Votre panier est vide</span>
                  <p className="text-[10px] text-slate-450 max-w-[180px]">Ajoutez des produits pour préparer votre stock repas.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => {
                    const price = getPrice(item.product);
                    return (
                      <div 
                        key={item.product.id}
                        className="p-3.5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between gap-2.5 shadow-sm"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-2xl select-none shrink-0">{item.product.image}</span>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-800 truncate">{item.product.name}</h4>
                            <span className="text-[10px] text-teal-700 font-bold">{price.toLocaleString('fr-FR')} F</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl p-0.5">
                            <button 
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-800"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-extrabold text-slate-800 px-2">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-800"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button 
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-rose-500 hover:text-rose-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

            {/* CART FOOTER */}
            {cart.length > 0 && !checkoutSuccess && (
              <div className="p-4 bg-white border-t border-slate-100 space-y-3">
                <div className="space-y-1 text-xs">
                  {isPremiumUser && (
                    <div className="flex justify-between text-[10px] text-emerald-600 font-bold">
                      <span>Économies réalisées (Premium) :</span>
                      <span>-{(getOriginalTotalWithoutDiscount() - getCartTotal()).toLocaleString('fr-FR')} F</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500">
                    <span>Sous-total :</span>
                    <span>{getOriginalTotalWithoutDiscount().toLocaleString('fr-FR')} F</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-slate-900 text-sm pt-1.5 border-t border-slate-100">
                    <span>Total à régler :</span>
                    <span className="text-teal-700">{getCartTotal().toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>

                <div className="pt-1 flex justify-between items-center text-[10px] text-slate-500">
                  <span>Mon Solde Wallet :</span>
                  <span className={`font-bold ${currentUser.walletBalance >= getCartTotal() ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {currentUser.walletBalance.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={currentUser.walletBalance < getCartTotal()}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all ${
                    currentUser.walletBalance >= getCartTotal()
                      ? 'bg-teal-600 hover:bg-teal-700 text-white active:scale-98'
                      : 'bg-slate-100 text-slate-450 cursor-not-allowed border border-slate-200'
                  }`}
                >
                  <Coins className="w-4 h-4" /> 
                  {currentUser.walletBalance >= getCartTotal() 
                    ? `Payer par Wallet (${getCartTotal().toLocaleString('fr-FR')} F)`
                    : 'Solde Wallet Insuffisant'
                  }
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
