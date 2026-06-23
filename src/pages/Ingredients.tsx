import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface Ingredient {
  id: number;
  nom: string;
  quantiteStock: number;
  seuilAlerte: number;
  uniteMesure: string;
}

export const Ingredients: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true); // 🔄 Added Loading State
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [quantiteAjoutee, setQuantiteAjoutee] = useState('');
  
  // Form State Matrix (Used for both Creation and Editing)
  const [nom, setNom] = useState('');
  const [quantiteStock, setQuantiteStock] = useState('');
  const [seuilAlerte, setSeuilAlerte] = useState('0');
  const [uniteMesure, setUniteMesure] = useState('g'); 

  // UI Flow Controls
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadIngredients = async () => {
    setIsLoading(true); // Ensure pulse plays during manual updates/refresh
    try {
      const res = await api.get('/ingredients');
      setIngredients(res.data);
    } catch (err) {
      showNotification('Erreur lors du chargement des ingrédients.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIngredients();
  }, []);

  const showNotification = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  const resetForm = () => {
    setNom('');
    setQuantiteStock('');
    setSeuilAlerte('0');
    setUniteMesure('g');
    setIsEditing(false);
    setEditingId(null);
  };

  // 📝 Trigger Edit Mode
  const startEdit = (ing: Ingredient) => {
    setIsEditing(true);
    setEditingId(ing.id);
    setNom(ing.nom);
    setQuantiteStock(ing.quantiteStock.toString());
    setSeuilAlerte(ing.seuilAlerte.toString());
    setUniteMesure(ing.uniteMesure);
    setSelectedId(null); // Close refill drawer if open to clear space
  };

  // 💾 Submit Handler for Creation & Modification
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !uniteMesure) return;

    const payload = {
      nom,
      quantiteStock: quantiteStock ? parseFloat(quantiteStock) : 0,
      seuilAlerte: seuilAlerte ? parseFloat(seuilAlerte) : 0,
      uniteMesure,
    };

    try {
      if (isEditing && editingId) {
        // Update Action
        await api.patch(`/ingredients/${editingId}`, payload);
        showNotification(`L'ingrédient [${nom}] a été modifié avec succès.`, 'success');
      } else {
        // Create Action
        await api.post('/ingredients', payload);
        showNotification(`L'ingrédient [${nom}] a été créé avec succès !`, 'success');
      }
      resetForm();
      loadIngredients();
    } catch (err: any) {
      showNotification(err.response?.data?.message || "Erreur lors de l'enregistrement.", 'error');
    }
  };

  // 🔄 Restock Delivery Action Handler
  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !quantiteAjoutee) return;

    try {
      await api.patch(`/ingredients/${selectedId}/ravitaillement`, {
        quantiteAjoutee: parseFloat(quantiteAjoutee),
      });
      showNotification('Ravitaillement validé avec succès !', 'success');
      setQuantiteAjoutee('');
      setSelectedId(null);
      loadIngredients();
    } catch (err) {
      showNotification('Erreur lors de la mise à jour du stock.', 'error');
    }
  };

  // ❌ Delete Ingredient Action Handler
  const handleDelete = async (id: number, targetNom: string) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer définitivement l'ingrédient [${targetNom}] ?`)) {
      return;
    }

    try {
      await api.delete(`/ingredients/${id}`);
      showNotification(`L'ingrédient [${targetNom}] a été retiré de l'inventaire.`, 'success');
      if (selectedId === id) setSelectedId(null);
      if (editingId === id) resetForm();
      loadIngredients();
    } catch (err: any) {
      showNotification(
        err.response?.data?.message || 'Impossible de supprimer cet ingrédient (il peut être lié à une recette active).', 
        'error'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="border-b border-[#D9CFC1] pb-5">
        <h1 className="text-2xl font-serif font-black tracking-tight text-[#3E2723]">Stock Ingrédients</h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Suivi quantitatif des matières premières, alertes de seuils critiques et gestion des fiches d'inventaire brut.
        </p>
      </div>

      {msg && (
        <div className={`p-3.5 text-sm rounded-xl font-medium border transition-all shadow-2xs ${
          msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
        }`}>
          <span className="mr-1.5">{msg.type === 'success' ? '✓' : '⚠️'}</span> {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* ================= INVENTORY TABLE LEDGER ================= */}
        <div className="lg:col-span-2 bg-[#F4EFE6] rounded-xl border border-[#D9CFC1] p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-[#3E2723]">Fiches des Matières Premières</h3>
          
          <div className="border border-[#D9CFC1] rounded-xl overflow-hidden bg-white shadow-2xs">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[#EBE4D8]/60 text-[#5D4037] font-bold text-xs uppercase tracking-wider border-b border-[#D9CFC1]">
                <tr>
                  <th className="p-3">Matière Première</th>
                  <th className="p-3">Quantité en Stock</th>
                  <th className="p-3">Seuil Alerte</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE4D8]">
                {isLoading ? (
                  /* 🧱 SKELETON ANIMATION ROWS */
                  Array.from({ length: 4 }).map((_, index) => (
                    <tr key={`skeleton-${index}`} className="animate-pulse bg-white">
                      <td className="p-3">
                        <div className="h-4 bg-[#EBE4D8] rounded-md w-32 my-1"></div>
                      </td>
                      <td className="p-3">
                        <div className="h-4 bg-[#EBE4D8] rounded-md w-16 my-1"></div>
                      </td>
                      <td className="p-3">
                        <div className="h-4 bg-[#EBE4D8]/60 rounded-md w-12 my-1"></div>
                      </td>
                      <td className="p-3 text-right flex justify-end gap-1.5 whitespace-nowrap">
                        <div className="h-7 bg-[#EBE4D8] rounded-lg w-16"></div>
                        <div className="h-7 bg-[#EBE4D8] rounded-lg w-8"></div>
                        <div className="h-7 bg-[#EBE4D8]/60 rounded-lg w-8"></div>
                      </td>
                    </tr>
                  ))
                ) : ingredients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center italic text-stone-400 bg-white">
                      Aucun ingrédient répertorié dans la base de données.
                    </td>
                  </tr>
                ) : (
                  ingredients.map((ing) => {
                    const isCritical = ing.quantiteStock <= ing.seuilAlerte;

                    return (
                      <tr key={ing.id} className={`transition duration-75 ${isCritical ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-[#FAF8F5]'}`}>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#3E2723]">{ing.nom}</span>
                            {isCritical && (
                              <span className="text-[9px] bg-red-600 text-white font-black uppercase px-1.5 py-0.5 rounded tracking-wide animate-pulse">
                                Critique
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`p-3 font-mono font-bold ${isCritical ? 'text-red-700' : 'text-stone-700'}`}>
                          {ing.quantiteStock.toLocaleString('fr-TN')} <span className="text-xs text-stone-400 font-sans font-medium">{ing.uniteMesure}</span>
                        </td>
                        <td className="p-3 font-mono text-xs text-stone-400 font-semibold">
                          {ing.seuilAlerte} <span className="font-sans font-normal">{ing.uniteMesure}</span>
                        </td>
                        <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => { setSelectedId(ing.id); setQuantiteAjoutee(''); }}
                            className="text-xs bg-[#B07A50] hover:bg-[#96633D] text-white px-2.5 py-1.5 rounded-lg font-bold transition shadow-2xs"
                          >
                            Réassort
                          </button>
                          <button
                            onClick={() => startEdit(ing)}
                            className="text-xs bg-white border border-[#D9CFC1] text-[#3E2723] hover:bg-[#FAF2EB] px-2.5 py-1.5 rounded-lg font-bold transition shadow-2xs"
                            title="Modifier la fiche"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(ing.id, ing.nom)}
                            className="text-xs bg-transparent border border-red-100 hover:bg-red-50 text-red-600 px-2.5 py-1.5 rounded-lg font-bold transition"
                            title="Supprimer de l'inventaire"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= MANAGEMENT CONTROL INTERFACES ================= */}
        <div className="space-y-6">
          
          {/* 1. REFILL INTERFACE DRAWER */}
          {selectedId && (
            <div className="bg-[#F4EFE6] rounded-xl border border-[#D9CFC1] p-5 shadow-sm space-y-4 border-l-4 border-l-[#B07A50]">
              <h4 className="text-xs font-bold bg-[#3E2723] text-[#EAD7C3] px-3 py-1.5 rounded-lg tracking-wider uppercase">
                Enregistrer une Livraison
              </h4>
              <form onSubmit={handleRestock} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#5D4037] mb-1">
                    Quantité Reçue (Ajoutée)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={quantiteAjoutee}
                    onChange={(e) => setQuantiteAjoutee(e.target.value)}
                    className="w-full rounded-lg bg-white border border-[#D9CFC1] p-2.5 text-[#3E2723] font-bold focus:outline-none focus:border-[#B07A50] placeholder-stone-400"
                    placeholder="Ex: 5000"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" className="flex-1 bg-[#B07A50] hover:bg-[#96633D] text-white p-2 text-sm rounded-lg font-bold transition shadow-md">
                    Confirmer
                  </button>
                  <button type="button" onClick={() => setSelectedId(null)} className="bg-white hover:bg-stone-50 text-stone-600 border border-[#D9CFC1] px-3 text-sm rounded-lg font-medium transition">
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 2. INGREDIENT RESOURCE FORM (CREATION & EDITING) */}
          <div className="bg-[#F4EFE6] rounded-xl border border-[#D9CFC1] p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold bg-[#3E2723] text-[#EAD7C3] px-3 py-1.5 rounded-lg tracking-wider uppercase">
                {isEditing ? 'Modifier l\'Ingrédient' : 'Nouvel Ingrédient'}
              </h4>
              {isEditing && (
                <button 
                  onClick={resetForm}
                  className="text-xs text-red-600 font-bold hover:underline"
                >
                  Annuler X
                </button>
              )}
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#5D4037] mb-1">
                  Nom de l'ingrédient
                </label>
                <input
                  type="text"
                  required
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full rounded-lg border border-[#D9CFC1] bg-white p-2.5 text-sm font-bold text-[#3E2723] focus:outline-none focus:border-[#B07A50] placeholder-stone-400"
                  placeholder="Ex: Grains de Café, Lait..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#5D4037] mb-1">
                    {isEditing ? 'Quantité en Stock' : 'Stock Initial'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={quantiteStock}
                    onChange={(e) => setQuantiteStock(e.target.value)}
                    className="w-full rounded-lg border border-[#D9CFC1] bg-white p-2.5 text-sm text-[#3E2723] font-bold focus:outline-none focus:border-[#B07A50] placeholder-stone-400"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#5D4037] mb-1">
                    Unité
                  </label>
                  <select
                    value={uniteMesure}
                    onChange={(e) => setUniteMesure(e.target.value)}
                    className="w-full rounded-lg border border-[#D9CFC1] bg-white p-2.5 text-sm text-[#3E2723] font-bold focus:outline-none focus:border-[#B07A50]"
                  >
                    <option value="g">Grammes (g)</option>
                    <option value="ml">Millilitres (ml)</option>
                    <option value="unite">Unités (u)</option>
                    <option value="kg">Kilogrammes (kg)</option>
                    <option value="L">Litres (L)</option>
                  </select>
                </div>
              </div>

              {/* Seuil d'Alerte input field config */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#5D4037] mb-1">
                  Seuil d'alerte minimum
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={seuilAlerte}
                  onChange={(e) => setSeuilAlerte(e.target.value)}
                  className="w-full rounded-lg border border-[#D9CFC1] bg-white p-2.5 text-sm font-mono text-red-700 font-bold focus:outline-none focus:border-[#B07A50]"
                  placeholder="Seuil minimum"
                />
                <p className="text-[10px] text-stone-500 mt-1">
                  Déclenche une étiquette d'alerte lorsque le stock descend sous cette valeur.
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-[#1C120C] hover:bg-[#2D1F16] text-white p-2.5 text-sm rounded-lg font-bold shadow-md transition"
                >
                  {isEditing ? '💾 Appliquer' : '➕ Enregistrer'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-white hover:bg-stone-50 text-stone-600 border border-[#D9CFC1] px-4 text-sm rounded-lg font-semibold transition"
                >
                  Vider
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};