import React, { useEffect, useState } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  Save, 
  Plus, 
  AlertTriangle, 
  Edit2, 
  X, 
  Check, 
  Archive, 
  Unlock 
} from 'lucide-react';
import api from '../services/api';

interface Categorie {
  id: number;
  nom: string;
  actif: boolean;
}

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [nom, setNom] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [targetCategory, setTargetCategory] = useState<{ id: number; nom: string; actif: boolean } | null>(null);

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      showNotification('Erreur lors du chargement des catégories.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const showNotification = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setNom('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || isMutating) return;

    setIsMutating(true);
    try {
      if (isEditing && editingId) {
        await api.patch(`/categories/${editingId}`, { nom: nom.trim() });
        showNotification(`Catégorie renommée en [${nom}] avec succès !`, 'success');
      } else {
        await api.post('/categories', { nom: nom.trim() });
        showNotification(`Nouvelle catégorie [${nom}] créée avec succès !`, 'success');
      }
      setNom('');
      handleCancelEdit();
      await loadCategories();
    } catch (err: any) {
      showNotification(err.response?.data?.message || "Erreur lors du traitement de l'opération.", 'error');
    } finally {
      setIsMutating(false);
    }
  };

  const startEdit = (cat: Categorie) => {
    setIsEditing(true);
    setEditingId(cat.id);
    setNom(cat.nom);
  };

  const openConfirmModal = (id: number, nom: string, actif: boolean) => {
    if (isMutating) return;
    setTargetCategory({ id, nom, actif });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (isMutating) return;
    setModalOpen(false);
    setTargetCategory(null);
  };

  const handleConfirmStatusToggle = async () => {
    if (!targetCategory || isMutating) return;
    
    const { id, nom, actif } = targetCategory;
    setIsMutating(true);

    try {
      await api.delete(`/categories/${id}`);
      
      const actionTxt = actif ? 'archivée (masquée)' : 'réactivée';
      showNotification(`La catégorie [${nom}] a été ${actionTxt} avec succès.`, 'success');
      
      setModalOpen(false);
      setTargetCategory(null);
      if (editingId === id) handleCancelEdit();
      await loadCategories();
    } catch (err: any) {
      showNotification(
        err.response?.data?.message || "Impossible de modifier le statut de cette catégorie.",
        'error'
      );
      setModalOpen(false);
      setTargetCategory(null);
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
      <div className="border-b border-[#E8E2D9] pb-5">
        <h1 className="text-2xl font-serif font-black tracking-tight text-[#3E2723]">Structure des Catégories</h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Gérez l'arborescence de votre carte. Les catégories inactives et leurs produits associés seront masqués sur l'interface.
        </p>
      </div>
      {msg && (
        <div className={`p-3 text-xs rounded-xl font-semibold border shadow-xs max-w-xl transition-all duration-300 ${
          msg.type === 'success' ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {msg.type === 'success' ? <Check className="inline w-3 h-3 mr-1" /> : <AlertTriangle className="inline w-3 h-3 mr-1" />} {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 bg-[#F4EFE6] rounded-xl border border-[#D9CFC1] p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#3E2723]">Groupes de Produits</h3>
          
          <div className="border border-[#D9CFC1] rounded-xl overflow-hidden bg-white shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#EBE4D8]/60 text-[#5D4037] font-bold text-[11px] uppercase tracking-wider border-b border-[#D9CFC1]">
                <tr>
                  <th className="p-3.5 w-16 text-center">ID</th>
                  <th className="p-3.5">Intitulé de la Catégorie</th>
                  <th className="p-3.5 w-28 text-center">Statut</th>
                  <th className="p-3.5 text-right w-44">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE4D8]">
                {isLoading ? (
                  [1, 2, 3].map((n) => (
                    <tr key={n} className="animate-pulse bg-white">
                      <td className="p-4"><div className="h-3 bg-stone-200 rounded-sm w-6 mx-auto"></div></td>
                      <td className="p-4"><div className="h-3 bg-stone-200 rounded-sm w-32"></div></td>
                      <td className="p-4"><div className="h-4 bg-stone-200 rounded-md w-16 mx-auto"></div></td>
                      <td className="p-4 flex justify-end gap-2"><div className="h-6 bg-stone-200 rounded-md w-16"></div><div className="h-6 bg-stone-200 rounded-md w-16"></div></td>
                    </tr>
                  ))
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-xs italic text-stone-400 bg-white font-medium">
                      Aucune catégorie configurée pour le moment.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className={`hover:bg-[#FAF8F5] transition duration-75 text-xs ${editingId === cat.id ? 'bg-[#FAF2EB]' : ''}`}>
                      <td className="p-3.5 text-center font-mono font-bold text-stone-400">#{cat.id}</td>
                      <td className="p-3.5 font-bold text-[#3E2723]">
                        <span className={!cat.actif ? 'line-through text-stone-400 font-medium' : ''}>
                          {cat.nom}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        {cat.actif ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ● Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                            ○ Masqué
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-1.5">
                          <button
                            disabled={isMutating}
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(cat);
                            }}
                            className="text-[10px] bg-white hover:bg-[#FAF2EB] border border-[#BFB3A3] text-[#3E2723] px-2.5 py-1 rounded-md font-bold transition-all shadow-2xs whitespace-nowrap disabled:opacity-50 flex items-center gap-1"
                            title="Modifier le nom"
                          >
                            <Edit2 size={10} /> Modifier
                          </button>
                          <button
                            disabled={isMutating}
                            onClick={(e) => {
                              e.stopPropagation();
                              openConfirmModal(cat.id, cat.nom, cat.actif);
                            }}
                            className={`text-[10px] border px-2.5 py-1 rounded-md font-bold transition-all whitespace-nowrap disabled:opacity-50 flex items-center justify-center gap-1 ${
                              cat.actif 
                                ? 'bg-white hover:bg-rose-50 border-rose-200 text-rose-600' 
                                : 'bg-white hover:bg-emerald-50 border-emerald-200 text-emerald-600'
                            }`}
                            title={cat.actif ? "Archiver la catégorie" : "Réactiver la catégorie"}
                          >
                            {cat.actif ? <><Trash2 size={10} /> Archiver</> : <><Unlock size={10} /> Activer</>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E8E2D9] p-4 shadow-sm space-y-4">
          <h4 className="text-[11px] font-bold bg-[#3E2723] text-[#EAD7C3] px-3 py-2 rounded-lg tracking-wider uppercase text-center">
            {isEditing ? 'Modifier la Catégorie' : 'Nouvelle Catégorie'}
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1 tracking-wide">
                Nom de la catégorie
              </label>
              <input
                type="text"
                required
                disabled={isMutating}
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full rounded-lg border border-[#D8CFC4] p-2 text-xs font-bold text-[#3E2723] focus:outline-none focus:border-[#B07A50] bg-white transition-all placeholder-stone-300 disabled:opacity-50"
                placeholder="Ex: Cafés Spéciaux, Jus Frais..."
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#F5EFE6]">
              <button
                type="submit"
                disabled={isMutating}
                className={`flex-1 p-2 rounded-lg text-xs font-bold shadow-xs text-white transition-all active:scale-98 disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2 ${
                  isEditing ? 'bg-[#B07A50] hover:bg-[#96633D]' : 'bg-[#1C120C] hover:bg-[#2D1F16]'
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
                  <><Plus size={14} /> Ajouter la catégorie</>
                )}
              </button>
              
              {isEditing && (
                <button
                  type="button"
                  disabled={isMutating}
                  onClick={handleCancelEdit}
                  className="bg-stone-50 hover:bg-stone-100 text-stone-500 border border-stone-200 px-3 text-xs rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </form>
        </div>

      </div>
      {modalOpen && targetCategory && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity animate-fadeIn"
          onClick={closeModal}
        >
          <div 
            className="bg-white max-w-sm w-full rounded-xl border border-stone-200 p-5 shadow-2xl text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mx-auto border ${
              targetCategory.actif ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
            }`}>
              {targetCategory.actif ? <Archive size={24} /> : <RotateCcw size={24} />}
            </div>
            
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                {targetCategory.actif ? 'Archiver la catégorie ?' : 'Réactiver la catégorie ?'}
              </h3>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                {targetCategory.actif ? (
                  <>
                    Êtes-vous sûr de vouloir masquer <span className="font-bold text-stone-800">[{targetCategory.nom}]</span> ? 
                    Elle ne sera plus disponible sur l'interface de prise de commande. 
                    <span className="block mt-2 font-black text-rose-700 text-[10px] uppercase tracking-wide bg-rose-50 border border-rose-100 rounded-md py-1 px-2">
                      <AlertTriangle className="inline mr-1" size={10} /> Bloqué s'il reste des produits actifs dedans.
                    </span>
                  </>
                ) : (
                  <>
                    Voulez-vous réactiver la catégorie <span className="font-bold text-stone-800">[{targetCategory.nom}]</span> ? 
                    Elle réapparaîtra immédiatement sur l'application avec ses configurations de menu.
                  </>
                )}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isMutating}
                onClick={handleConfirmStatusToggle}
                className={`flex-1 font-bold text-xs py-2 px-3 rounded-lg shadow-xs transition-colors text-white disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  targetCategory.actif 
                    ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800' 
                    : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                }`}
              >
                {isMutating ? (
                  <>
                    <Spinner />
                    Patientez...
                  </>
                ) : targetCategory.actif ? (
                  'Archiver'
                ) : (
                  'Confirmer'
                )}
              </button>
              <button
                type="button"
                disabled={isMutating}
                onClick={closeModal}
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