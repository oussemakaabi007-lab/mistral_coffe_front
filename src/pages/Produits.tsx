import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Coffee, 
  AlertTriangle, 
  User, 
  Search, 
  FolderOpen, 
  Sparkles, 
  ClipboardList, 
  Trash2, 
  RotateCcw, 
  Lock, 
  Pencil, 
  Plus, 
  X, 
  Save, 
  Check
} from 'lucide-react';
import api from '../services/api';

interface Ingredient {
  id: number;
  nom: string;
  quantiteStock: number; 
  seuilAlerte: number;   
  uniteMesure: string;
}

interface Categorie {
  id: number;
  nom: string;
}

interface RecetteLine {
  ingredientId?: number;
  ingredient?: { id?: number; nom: string; quantiteStock?: number; seuilAlerte?: number; uniteMesure?: string };
  quantiteRequise: number;
}

interface Product {
  id: number;
  nom: string;
  prix: number;
  remise: number;
  imageUrl?: string;
  categorieId: number;
  categorie: { nom: string };
  recette: RecetteLine[];
  actif: boolean;
}

interface UserProfile {
  id: number;
  nomUtilisateur: string;
  role?: string;
}

interface FormRecetteLine {
  keyId: string; 
  ingredientId: string;
  quantiteRequise: string;
}

const ProductCard = React.memo(({ 
  prod, 
  ingredients, 
  isShiftActive, 
  isMutating,
  onEdit, 
  onDelete 
}: { 
  prod: Product; 
  ingredients: Ingredient[]; 
  isShiftActive: boolean; 
  isMutating: boolean;
  onEdit: (prod: Product) => void; 
  onDelete: (id: number, name: string) => void; 
}) => {
  return (
    <div className="bg-[#F4EFE6] rounded-xl border border-[#D9CFC1] overflow-hidden flex flex-col shadow-sm group hover:shadow-md hover:border-[#C4B7A6] transition-all duration-200">
      {prod.imageUrl ? (
        <div className="w-full aspect-video overflow-hidden border-b border-[#D9CFC1] relative bg-[#FAF7F2] flex items-center justify-center shrink-0">
          <img 
            src={prod.imageUrl.startsWith('http') ? prod.imageUrl : `${prod.imageUrl}`} 
            alt={prod.nom} 
            className="max-w-full max-h-full block object-contain group-hover:scale-102 transition duration-300"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x250?text=Cafe'; }}
          />
        </div>
      ) : (
        <div className="w-full aspect-video bg-[#EBE4D8] border-b border-[#D9CFC1] flex items-center justify-center text-2xl shrink-0">
          <Coffee size={32} />
        </div>
      )}

      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <div className="flex justify-between items-start gap-2">
            <span className="text-[9px] uppercase font-bold tracking-wider bg-[#EADCC6]/60 text-[#8C5832] px-2 py-0.5 rounded-md border border-[#D9CFC1] truncate max-w-[120px]">
              {prod.categorie?.nom || 'Menu'}
            </span>
            <div className="text-right shrink-0">
              <p className="text-sm font-black text-[#3E2723] font-mono leading-none">{Number(prod.prix).toFixed(3)}</p>
              {Number(prod.remise) > 0 && <p className="text-[10px] text-rose-700 font-bold font-mono mt-0.5">-{Number(prod.remise).toFixed(3)}</p>}
            </div>
          </div>
          <h3 className="text-sm font-bold text-[#261713] tracking-tight truncate" title={prod.nom}>{prod.nom}</h3>
        </div>

        <div className="bg-white border border-[#D9CFC1] p-2 rounded-lg space-y-1 shadow-2xs">
          <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Composition :</p>
          {prod.recette && prod.recette.length > 0 ? (
            <ul className="space-y-1">
              {prod.recette.map((line, idx) => {
                const matchIng = ingredients.find(i => i.id === line.ingredientId || i.id === line.ingredient?.id);
                const isShortage = matchIng ? matchIng.quantiteStock <= matchIng.seuilAlerte : false;
                return (
                  <li key={idx} className={`text-[11px] px-1 py-0.5 rounded flex justify-between items-center ${isShortage ? 'bg-rose-50 text-rose-900 font-bold' : 'text-[#5D4037]'}`}>
                    <span className="flex items-center gap-1 truncate max-w-[70%]">
                      <span className="truncate">• {line.ingredient?.nom || matchIng?.nom || 'Inconnu'}</span>
                      {isShortage && <span className="text-[8px] px-1 bg-rose-600 text-white font-black rounded-sm shrink-0"><AlertTriangle size={8} /></span>}
                    </span>
                    <span className={`font-mono text-[10px] shrink-0 ${isShortage ? 'text-rose-600 font-bold' : 'text-stone-400'}`}>
                      {line.quantiteRequise}<span className="text-[9px] font-sans ml-0.5 text-stone-400">{line.ingredient?.uniteMesure || matchIng?.uniteMesure || ''}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-[10px] italic text-stone-400">Aucun ingrédient brut.</p>
          )}
        </div>
      </div>

      <div className="bg-[#EBE4D8]/50 border-t border-[#D9CFC1] px-3 py-2 flex justify-end gap-1.5">
        <button
          type="button"
          disabled={isShiftActive || isMutating}
          onClick={() => onEdit(prod)}
          className={`text-[10px] border px-2.5 py-1 rounded-md font-bold transition-all ${isShiftActive || isMutating ? 'bg-stone-50 border-stone-200 text-stone-300 cursor-not-allowed shadow-none' : 'bg-white hover:bg-[#FAF2EB] border-[#BFB3A3] text-[#3E2723]'}`}
        >
          <div className="flex items-center gap-1"><Pencil size={10} /> Modifier</div>
        </button>
        <button
          type="button"
          disabled={isShiftActive || isMutating}
          onClick={() => onDelete(prod.id, prod.nom)}
          className={`text-[10px] border px-2.5 py-1 rounded-md font-bold transition-all ${isShiftActive || isMutating ? 'border-stone-100 text-stone-200 cursor-not-allowed shadow-none' : 'bg-white hover:bg-rose-50 border-rose-200 text-rose-600'}`}
        >
          <div className="flex items-center gap-1"><Trash2 size={10} /> Archiver</div>
        </button>
      </div>
    </div>
  );
});
ProductCard.displayName = 'ProductCard';


export const Produits: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [activeUsers, setActiveUsers] = useState<UserProfile[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: number; nom: string } | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [nom, setNom] = useState('');
  const [prix, setPrix] = useState('');
  const [remise, setRemise] = useState('0');
  const [categorieId, setCategorieId] = useState('');
  const [recetteLines, setRecetteLines] = useState<FormRecetteLine[]>([]);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [prodRes, ingRes, catRes, sessionRes] = await Promise.all([
        api.get('/produits'),
        api.get('/ingredients'),
        api.get('/categories'),
        api.get('/sessions-poste/active').catch(() => ({ data: [] })),
      ]);

      setProducts(prodRes.data);
      setIngredients(ingRes.data);
      setCategories(catRes.data);
      
      const sessions = Array.isArray(sessionRes.data) ? sessionRes.data : [];
      const openShifts = sessions.filter(session => session.statut === 'OUVERT');

      if (openShifts.length > 0) {
        setIsShiftActive(true);
        try {
          const userIds = Array.from(new Set(openShifts.map(s => s.utilisateurId).filter(Boolean)));
          const userRequests = userIds.map(id => api.get(`/utilisateurs/${id}`));
          const userResponses = await Promise.all(userRequests);
          setActiveUsers(userResponses.map(res => res.data));
        } catch (err) {
          setActiveUsers([]);
        }
      } else {
        setIsShiftActive(false);
        setActiveUsers([]); 
      }
    } catch (err) {
      showNotification('Erreur lors de la récupération des données.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeProducts = useMemo(() => {
    return products.filter((prod) => {
      const isActif = prod.actif === true || prod.actif === undefined || String(prod.actif) === 'true' || Number(prod.actif) === 1;
      const matchesSearch = prod.nom.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategoryFilter === '' || prod.categorieId === parseInt(selectedCategoryFilter, 10);
      return isActif && matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategoryFilter]);

  const archivedProducts = useMemo(() => {
    return products.filter((prod) => {
      return prod.actif === false || String(prod.actif) === 'false' || Number(prod.actif) === 0;
    });
  }, [products]);

  const showNotification = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setNom('');
    setPrix('');
    setRemise('0');
    setSelectedFile(null);
    setPreviewUrl(null);
    setCategorieId(categories[0]?.id?.toString() || '');
    setRecetteLines([]);
    setEditingId(null);
    setIsEditing(false);
  };

  const addRecetteLine = () => {
    const generateUID = () => `line_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    setRecetteLines((prev) => [
      ...prev,
      { keyId: generateUID(), ingredientId: '', quantiteRequise: '' }
    ]);
  };

  const removeRecetteLine = (index: number) => {
    setRecetteLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRecetteChange = (index: number, field: 'ingredientId' | 'quantiteRequise', value: string) => {
    setRecetteLines((prevLines) => {
      const updated = [...prevLines];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isShiftActive || isMutating) return;
    if (!nom || !prix || !categorieId) return;

    setIsMutating(true);
    const formattedRecette = recetteLines
      .filter((line) => line.ingredientId && line.quantiteRequise && !isNaN(parseInt(line.ingredientId, 10)))
      .map((line) => ({
        ingredientId: parseInt(line.ingredientId, 10),
        quantiteRequise: parseFloat(line.quantiteRequise),
      }));

    try {
      const formData = new FormData();
      formData.append('nom', nom.trim());
      formData.append('prix', String(prix));
      formData.append('remise', String(remise || '0'));
      formData.append('categorieId', String(categorieId));

      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      formattedRecette.forEach((line, index) => {
        formData.append(`recette[${index}][ingredientId]`, String(line.ingredientId));
        formData.append(`recette[${index}][quantiteRequise]`, String(line.quantiteRequise));
      });

      const headers = { 'Content-Type': 'multipart/form-data' };

      if (isEditing && editingId) {
        await api.patch(`/produits/${editingId}`, formData, { headers });
      } else {
        await api.post('/produits', formData, { headers });
      }

      showNotification(isEditing ? `[${nom}] mis à jour !` : `[${nom}] créé !`, 'success');
      resetForm();
      setShowFormModal(false);
      await loadData();
    } catch (err: any) {
      const backendError = err.response?.data?.message || err.message || "Erreur inconnue";
      showNotification(Array.isArray(backendError) ? backendError.join(', ') : backendError, 'error');
    } finally {
      setIsMutating(false);
    }
  };

  const startEdit = useCallback((product: Product) => {
    if (isShiftActive) return; 
    
    setIsEditing(true);
    setEditingId(product.id);
    setNom(product.nom);
    setPrix(product.prix.toString());
    setRemise(product.remise.toString());
    setCategorieId(product.categorieId.toString());
    setSelectedFile(null);
    setPreviewUrl(product.imageUrl || null);
    
    const lines = product.recette.map((line, idx) => {
      const resolvedId = line.ingredientId || line.ingredient?.id || '';
      return {
        keyId: `line_edit_${idx}_${resolvedId}`, 
        ingredientId: resolvedId.toString(),
        quantiteRequise: line.quantiteRequise ? line.quantiteRequise.toString() : '',
      };
    });

    setRecetteLines(lines);
    setShowFormModal(true);
  }, [isShiftActive]);

  const openDeleteModal = useCallback((id: number, nom: string) => {
    if (isShiftActive) return;
    setProductToDelete({ id, nom });
    setShowDeleteModal(true);
  }, [isShiftActive]);

  const handleConfirmDelete = async () => {
    if (!productToDelete || isMutating) return;
    const targetId = productToDelete.id;
    const targetNom = productToDelete.nom;
    setIsMutating(true);

    try {
      setProducts((prev) => 
        prev.map((p) => p.id === targetId ? { ...p, actif: false } : p)
      );

      await api.delete(`/produits/${targetId}`);
      showNotification(`Produit [${targetNom}] archivé avec succès.`, 'success');
      setShowDeleteModal(false);
      setProductToDelete(null);
      await loadData();
    } catch (err: any) {
      showNotification(err.response?.data?.message || "Erreur lors de l'archivage.", 'error');
      await loadData(); 
    } finally {
      setIsMutating(false);
    }
  };

  const handleUnarchive = async (id: number, name: string) => {
    if (isShiftActive || isMutating) return;
    setIsMutating(true);

    try {
      setProducts((prev) => 
        prev.map((p) => p.id === id ? { ...p, actif: true } : p)
      );

      await api.delete(`/produits/${id}`);
      showNotification(`Produit [${name}] remis sur la carte avec succès.`, 'success');
      await loadData();
    } catch (err: any) {
      showNotification(err.response?.data?.message || "Erreur lors du désarchivage.", 'error');
      await loadData();
    } finally {
      setIsMutating(false);
    }
  };

  const Spinner = ({ className = "w-4 h-4 text-white" }: { className?: string }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <div className="space-y-6">
      {isShiftActive && (
        <div className="bg-[#FFF9F2] border border-[#F5E6D3] rounded-xl p-4 flex items-start gap-3 text-[#5C4636] shadow-sm max-w-4xl">
          <span className="text-lg bg-[#EEDCC6] w-8 h-8 rounded-lg flex items-center justify-center shrink-0"><Lock size={16} /></span>
          <div className="text-xs font-medium w-full">
            <p className="font-bold uppercase tracking-wider text-[#3E2723]">Sessions de Poste Ouvertes</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {activeUsers.length === 0 ? (
                <span className="text-stone-400 animate-pulse text-xs">Chargement des profils...</span>
              ) : (
                activeUsers.map((user) => (
                  <span key={user.id} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-[#EEDCC6] text-[#3E2723] shadow-xs">
                    <User size={12} className="mr-1" /> {user.nomUtilisateur}
                  </span>
                ))
              )}
            </div>
            <p className="text-stone-500 mt-2 text-[11px]">
              Les structures de prix et fiches techniques sont verrouillées pendant le service en cours.
            </p>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E8E2D9] pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-serif font-black tracking-tight text-[#3E2723]">Catalogue Menu</h1>
          <p className="text-xs text-stone-500 mt-0.5">Gestion de la carte et des fiches techniques des boissons.</p>
        </div>
        <button
          type="button"
          disabled={isShiftActive || isLoading}
          onClick={() => { resetForm(); setShowFormModal(true); }}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold tracking-wide shadow-xs transition-all duration-200 border shrink-0 ${
            isShiftActive 
              ? 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed shadow-none' 
              : 'bg-[#B07A50] hover:bg-[#96633D] text-white border-[#A26D42] active:scale-98'
          }`}
        >
          <div className="flex items-center gap-1"><Coffee size={14} /> Nouveau Produit</div>
        </button>
      </div>
      <div className="bg-[#F4EFE6] border border-[#D9CFC1] rounded-xl p-3 flex flex-col sm:flex-row gap-3 items-center shadow-xs">
        <div className="w-full sm:flex-1 relative">
          <span className="absolute left-3 top-2.5 text-stone-400 text-xs"><Search size={14} /></span>
          <input
            type="text"
            placeholder="Rechercher un produit au menu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-[#D9CFC1] rounded-lg pl-8 pr-3 py-2 text-xs text-[#3E2723] font-medium focus:outline-none focus:border-[#B07A50]"
          />
        </div>
        <div className="w-full sm:w-64">
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="w-full bg-white border border-[#D9CFC1] rounded-lg px-3 py-2 text-xs text-[#3E2723] font-bold focus:outline-none focus:border-[#B07A50]"
          >
            <option value="">📂 Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.nom}</option>
            ))}
          </select>
        </div>
        {(searchTerm || selectedCategoryFilter) && (
          <button 
            onClick={() => { setSearchTerm(''); setSelectedCategoryFilter(''); }}
            className="text-xs font-bold text-stone-500 hover:text-red-600 transition shrink-0"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {msg && (
        <div className={`p-3 text-xs rounded-xl font-semibold border shadow-xs max-w-xl transition-all duration-300 ${msg.type === 'success' ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
          {msg.type === 'success' ? <Check  size={12} className="inline mr-1" /> : <AlertTriangle size={12} className="inline mr-1" />} {msg.text}
        </div>
      )}
      <div className="space-y-3">
        <h2 className="text-xs font-black tracking-wider uppercase text-stone-400"><Sparkles size={14} className="inline mr-1" /> Produits sur la carte active ({isLoading ? '...' : activeProducts.length})</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {isLoading ? (
            [1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-[#F4EFE6]/60 rounded-xl border border-stone-200 overflow-hidden flex flex-col p-4 space-y-4 animate-pulse">
                <div className="w-full aspect-video bg-stone-200 rounded-lg shrink-0"></div>
                <div className="flex justify-between items-center">
                  <div className="h-3 bg-stone-200 rounded w-16"></div>
                  <div className="h-3 bg-stone-200 rounded w-12"></div>
                </div>
                <div className="h-4 bg-stone-200 rounded w-3/4"></div>
                <div className="space-y-2 pt-2">
                  <div className="h-2 bg-stone-200 rounded w-full"></div>
                  <div className="h-2 bg-stone-200 rounded w-5/6"></div>
                </div>
              </div>
            ))
          ) : activeProducts.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl border border-[#E8E2D9] p-12 text-center text-xs italic text-stone-400 font-medium">
              Aucun produit actif ne correspond à vos critères.
            </div>
          ) : (
            activeProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                prod={prod}
                ingredients={ingredients}
                isShiftActive={isShiftActive}
                isMutating={isMutating}
                onEdit={startEdit}
                onDelete={openDeleteModal}
              />
            ))
          )}
        </div>
      </div>
      <div className="space-y-3 pt-6 border-t border-[#E8E2D9]">
        <h2 className="text-xs font-black tracking-wider uppercase text-rose-800 flex items-center gap-1.5">
          <FolderOpen size={14} /> Produits Archivés / Hors Carte ({isLoading ? '...' : archivedProducts.length})
        </h2>
        
        {isLoading ? (
          <div className="bg-stone-50 border border-stone-200 rounded-xl overflow-hidden animate-pulse">
            <div className="h-8 bg-stone-100 border-b border-stone-200"></div>
            {[1, 2].map((n) => (
              <div key={n} className="p-4 border-b border-stone-100 flex justify-between items-center">
                <div className="h-3 bg-stone-200 rounded w-1/3"></div>
                <div className="h-3 bg-stone-200 rounded w-24"></div>
                <div className="h-6 bg-stone-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        ) : archivedProducts.length === 0 ? (
          <p className="text-[11px] text-stone-400 italic">Aucun produit historique archivé.</p>
        ) : (
          <div className="bg-stone-50 border border-stone-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-100 border-b border-stone-200 text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                  <th className="p-3 w-24 text-center">Visuel</th>
                  <th className="p-3">Produit</th>
                  <th className="p-3">Catégorie</th>
                  <th className="p-3 text-right">Ancien Prix</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {archivedProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-white transition-colors">
                    <td className="p-2 text-center whitespace-nowrap">
                      {prod.imageUrl ? (
                        <div className="w-16 h-10 mx-auto rounded border border-stone-200 bg-[#FAF7F2] overflow-hidden flex items-center justify-center">
                          <img 
                            src={prod.imageUrl.startsWith('http') ? prod.imageUrl : `${prod.imageUrl}`} 
                            alt={prod.nom} 
                            className="max-w-full max-h-full block object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x250?text=Cafe'; }}
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-10 mx-auto rounded border border-stone-200 bg-stone-200 flex items-center justify-center text-sm">
                          <Coffee size={16} />
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-bold text-stone-700">
                      {prod.nom}
                    </td>
                    <td className="p-3 text-stone-500 font-medium">
                      {prod.categorie?.nom || 'Indéfinie'}
                    </td>
                    <td className="p-3 font-mono font-bold text-right text-stone-600">
                      {Number(prod.prix).toFixed(3)} DT
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        disabled={isShiftActive || isMutating}
                        onClick={() => handleUnarchive(prod.id, prod.nom)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-md border transition-all ${
                          isShiftActive || isMutating
                            ? 'bg-stone-100 border-stone-200 text-stone-300 cursor-not-allowed shadow-none' 
                            : 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 active:scale-95'
                        }`}
                      >
                        <div className="flex items-center gap-1"><RotateCcw size={10} /> Désarchiver</div>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showFormModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3 mb-4">
              <h4 className="text-sm font-black tracking-tight text-[#3E2723] uppercase">
                {isEditing ? '✏️ Modifier la Fiche Produit' : '☕ Nouvelle Fiche Catalogue'}
              </h4>
              <button 
                type="button" 
                disabled={isMutating}
                onClick={() => { resetForm(); setShowFormModal(false); }}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold p-1 disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1 tracking-wide">Nom du produit</label>
                <input
                  type="text"
                  required
                  disabled={isShiftActive || isMutating}
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full rounded-lg border border-[#D8CFC4] p-2 text-xs font-bold text-[#3E2723] focus:outline-none focus:border-[#B07A50] bg-white transition-all disabled:opacity-50"
                  placeholder="Ex: Capuccino Caramel"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1 tracking-wide">Image du Produit</label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isShiftActive || isMutating}
                    onChange={handleFileChange}
                    className="w-full text-[10px] text-stone-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-[#E8E2D9] file:text-[10px] file:font-bold file:bg-[#FAF7F2] file:hover:bg-[#FAF2EB] cursor-pointer disabled:opacity-50"
                  />
                  {previewUrl && (
                    <div className="relative w-full h-36 rounded-lg overflow-hidden border border-[#D9CFC1] bg-[#FAF7F2] flex items-center justify-center shrink-0">
                      <img 
                        src={previewUrl.startsWith('blob:') || previewUrl.startsWith('data:') || previewUrl.startsWith('http') ? previewUrl : `${previewUrl}`} 
                        alt="Aperçu" 
                        className="max-w-full max-h-full block object-contain" 
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1 tracking-wide">Prix (DT)</label>
                  <input
                    type="number"
                    step="0.005"
                    required
                    disabled={isShiftActive || isMutating}
                    value={prix}
                    onChange={(e) => setPrix(e.target.value)}
                    className="w-full rounded-lg border border-[#D8CFC4] p-2 text-xs font-mono font-bold text-[#3E2723] focus:outline-none focus:border-[#B07A50] disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1 tracking-wide">Remise (DT)</label>
                  <input
                    type="number"
                    step="0.005"
                    disabled={isShiftActive || isMutating}
                    value={remise}
                    onChange={(e) => setRemise(e.target.value)}
                    className="w-full rounded-lg border border-[#D8CFC4] p-2 text-xs font-mono font-bold text-rose-600 focus:outline-none focus:border-[#B07A50] disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1 tracking-wide">Catégorie</label>
                <select
                  required
                  disabled={isShiftActive || isMutating}
                  value={categorieId}
                  onChange={(e) => setCategorieId(e.target.value)}
                  className="w-full rounded-lg border border-[#D8CFC4] bg-white p-2 text-xs font-bold text-[#3E2723] focus:outline-none focus:border-[#B07A50] disabled:opacity-50"
                >
                  <option value="" disabled>Sélectionner une catégorie</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nom}</option>
                  ))}
                </select>
              </div>

              <div className="border-t border-[#F5EFE6] pt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold uppercase text-[#3E2723] tracking-wide">Fiche Technique / Recette</label>
                  <button
                    type="button"
                    disabled={isShiftActive || isMutating}
                    onClick={addRecetteLine}
                    className="text-[10px] bg-[#FAF2EB] text-[#B07A50] border border-[#EEDCC6] px-2 py-1 rounded-md font-bold transition-all hover:bg-white disabled:opacity-50"
                  >
                    <div className="flex items-center gap-1"><Plus size={10} /> Ingrédient</div>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {recetteLines.map((line, idx) => {
                    const selectedIng = ingredients.find(i => i.id === parseInt(line.ingredientId, 10));
                    const isLineAlert = selectedIng ? selectedIng.quantiteStock <= selectedIng.seuilAlerte : false;

                    return (
                      <div key={line.keyId} className={`flex gap-1.5 items-center p-1.5 rounded-lg border transition-all ${isLineAlert ? 'bg-rose-50/70 border-rose-200' : 'bg-[#FAFBF9] border-[#E8E2D9]'}`}>
                        <select
                          required
                          disabled={isShiftActive || isMutating}
                          value={line.ingredientId}
                          onChange={(e) => handleRecetteChange(idx, 'ingredientId', e.target.value)}
                          className={`flex-1 rounded border p-1 text-[11px] font-bold bg-white focus:outline-none disabled:opacity-50 ${isLineAlert ? 'border-rose-300 text-rose-950' : 'border-[#D8CFC4] text-[#3E2723]'}`}
                        >
                          <option value="" disabled>Choisir...</option>
                          {ingredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.nom} ({ing.uniteMesure}) {ing.quantiteStock <= ing.seuilAlerte ? '⚠️' : ''}
                            </option>
                          ))}
                        </select>
                        
                        <input
                          type="number"
                          step="0.01"
                          required
                          disabled={isShiftActive || isMutating}
                          placeholder="Qté"
                          value={line.quantiteRequise}
                          onChange={(e) => handleRecetteChange(idx, 'quantiteRequise', e.target.value)}
                          className={`w-14 rounded border p-1 text-[11px] font-mono text-center font-bold focus:outline-none disabled:opacity-50 ${isLineAlert ? 'border-rose-300 text-rose-700' : 'border-[#D8CFC4] text-[#3E2723]'}`}
                        />

                        <button
                          type="button"
                          disabled={isShiftActive || isMutating}
                          onClick={() => removeRecetteLine(idx)}
                          className="text-stone-400 hover:text-rose-600 text-xs px-1 font-bold transition-colors disabled:opacity-50"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-stone-100">
                <button
                  type="submit"
                  disabled={isShiftActive || isMutating}
                  className={`flex-1 p-2 rounded-lg text-xs font-bold shadow-xs text-white transition-all flex items-center justify-center gap-2 ${
                    isShiftActive 
                      ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none' 
                      : 'bg-[#3E2723] hover:bg-[#2A1A17] active:scale-98'
                  }`}
                >
                  {isMutating ? (
                    <>
                      <Spinner />
                      Traitement...
                    </>
                  ) : isEditing ? (
                    <><Save size={14} /> Sauvegarder</>
                  ) : (
                    <><Plus size={14} /> Ajouter au catalogue</>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isMutating}
                  onClick={() => { resetForm(); setShowFormModal(false); }}
                  className="bg-stone-50 hover:bg-stone-100 text-stone-500 border border-stone-200 px-3 text-xs rounded-lg font-semibold transition-all disabled:opacity-50"
                >
                  Fermer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity" onClick={() => !isMutating && setShowDeleteModal(false)}>
          <div className="bg-white max-w-sm w-full rounded-xl border border-stone-200 p-5 shadow-2xl text-center space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-xl mx-auto text-rose-600">
              <Trash2 size={24} />
            </div>
            
            <div>
              <h3 className="text-sm font-bold text-stone-900">Archiver le produit ?</h3>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                Voulez-vous retirer l'article <span className="font-bold text-stone-800">[{productToDelete.nom}]</span> de la carte active ? Il sera transféré dans l'historique des archives.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isMutating}
                onClick={handleConfirmDelete}
                className="flex-1 font-bold text-xs py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isMutating ? (
                  <>
                    <Spinner />
                    Archivage...
                  </>
                ) : (
                  'Confirmer'
                )}
              </button>
              <button
                type="button" 
                disabled={isMutating} 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold text-xs py-2 px-3 rounded-lg transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};