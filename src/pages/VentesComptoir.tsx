import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface Produit {
  id: number;
  nom: string;
  prix: string;
  imageUrl?: string | null;
  actif: boolean; 
}

interface SaisieLigne {
  produitId: number;
  nom: string;
  prix: number;
  imageUrl?: string;
  quantiteServeurs: number; 
  quantiteComptoir: number; 
  quantiteInitial: number;  
  quantiteAjustee: number;  
  actif: boolean; 
}

export const VentesComptoir: React.FC = () => {
  const [activeShift, setActiveShift] = useState<'AVANT_MIDI' | 'APRES_MIDI'>(() => {
    const currentHour = new Date().getHours();
    return currentHour < 12 ? 'AVANT_MIDI' : 'APRES_MIDI';
  });
  const [lignesSaisie, setLignesSaisie] = useState<SaisieLigne[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false); 
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [caAvantMidi, setCaAvantMidi] = useState(0);
  const [caApresMidi, setCaApresMidi] = useState(0);

  const chargerDonneesShift = async (shift: 'AVANT_MIDI' | 'APRES_MIDI') => {
    if (loading) return; 
    setLoading(true);
    try {
      const [resProds, resSaisie, resRevenue] = await Promise.all([
        api.get('/produits'),
        api.get(`/ventes/saisie-poste?type=${shift}`),
        api.get('/ventes/chiffre-affaires-aujourdhui')
      ]);

      let produitsDeLaBase: any[] = [];
      if (Array.isArray(resProds.data)) {
        produitsDeLaBase = resProds.data;
      } else if (resProds.data && Array.isArray(resProds.data.produits)) {
        produitsDeLaBase = resProds.data.produits;
      } else if (resProds.data && typeof resProds.data === 'object') {
        const possibleArray = Object.values(resProds.data).find(val => Array.isArray(val));
        if (possibleArray) produitsDeLaBase = possibleArray as any[];
      }

      const payloadSaisie = resSaisie.data || {};
      const mapServeurs: Record<number, number> = payloadSaisie.serveurs || payloadSaisie.serveursMap || {};
      const mapComptoir: Record<number, number> = payloadSaisie.comptoir || payloadSaisie.comptoirMap || {};

      const matriceFusionnee = produitsDeLaBase
        .map((prod) => {
          const qtyS = mapServeurs[prod.id] !== undefined ? mapServeurs[prod.id] : (mapServeurs[String(prod.id)] || 0);
          const qtyC = mapComptoir[prod.id] !== undefined ? mapComptoir[prod.id] : (mapComptoir[String(prod.id)] || 0);
          const totalInitial = qtyS + qtyC;

          return {
            produitId: prod.id,
            nom: prod.nom,
            prix: parseFloat(prod.prix) || 0,
            imageUrl: prod.imageUrl || undefined,
            quantiteServeurs: qtyS,
            quantiteComptoir: qtyC,
            quantiteInitial: totalInitial,
            quantiteAjustee: totalInitial,
            actif: prod.actif !== undefined ? prod.actif : true 
          };
        })
        .filter(item => item.actif || item.quantiteInitial > 0);

      setLignesSaisie(matriceFusionnee);

      if (resRevenue.data) {
        setCaAvantMidi(parseFloat(resRevenue.data.avantMidi) || 0);
        setCaApresMidi(parseFloat(resRevenue.data.apresMidi) || 0);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des données", err);
      showNotification("Impossible de charger les indicateurs de session.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerDonneesShift(activeShift);
  }, [activeShift]);

  const showNotification = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 5000);
  };

  const updateQty = (produitId: number, delta: number) => {
    if (isSaving || loading) return; 
    setLignesSaisie(prev => prev.map(item => {
      if (item.produitId === produitId) {
        const nouvelleQty = Math.max(item.quantiteInitial, item.quantiteAjustee + delta);
        return { ...item, ...{ quantiteAjustee: nouvelleQty } };
      }
      return item;
    }));
  };

  const handleSauvegarder = async () => {
    if (isSaving || loading) return; 

    const itemsPayload = lignesSaisie
      .map(l => ({
        produitId: l.produitId,
        quantite: l.quantiteAjustee - l.quantiteInitial 
      }))
      .filter(item => item.quantite > 0);

    if (itemsPayload.length === 0) {
      showNotification("Veuillez incrémenter au moins un article pour émettre un ticket.", "error");
      return;
    }

    try {
      setIsSaving(true);

      await api.post('/ventes/enregistrer-saisie', {
        typePoste: activeShift,
        items: itemsPayload
      });

      showNotification("Nouvel ajout comptoir enregistré et stocks d'ingrédients déduits !", "success");
      await chargerDonneesShift(activeShift);
    } catch (err: any) {
      console.error("Erreur d'envoi payload:", err);
      const errMsg = err.response?.data?.message || "Échec de la communication réseau avec l'API.";
      showNotification(errMsg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNouvelleVente = () => {
    if (isSaving || loading) return;
    setLignesSaisie(prev => prev.map(item => ({ ...item, ...{ quantiteAjustee: item.quantiteInitial } })));
  };

  // 📈 CALCULS POUR LES STATISTIQUES RESTRUCTURÉES
  const totalNouvellesVentesComptoir = lignesSaisie.reduce((acc, curr) => {
    const delta = curr.quantiteAjustee - curr.quantiteInitial;
    return acc + (curr.prix * delta);
  }, 0);

  const totalServeursShift = lignesSaisie.reduce((acc, curr) => acc + (curr.quantiteServeurs * curr.prix), 0);
  const totalComptoirShift = lignesSaisie.reduce((acc, curr) => acc + (curr.quantiteComptoir * curr.prix), 0);
  const totalGlobalShift = totalServeursShift + totalComptoirShift;

  const pourcentServeurs = totalGlobalShift > 0 ? Number(((totalServeursShift / totalGlobalShift) * 100).toFixed(1)) : 0;
  const pourcentComptoir = totalGlobalShift > 0 ? Number(((totalComptoirShift / totalGlobalShift) * 100).toFixed(1)) : 0;
  const degresFlux = Math.round((pourcentServeurs / 100) * 360);

  const totalGeneralJournee = caAvantMidi + caApresMidi;
  const pourcentAM = totalGeneralJournee > 0 ? Number(((caAvantMidi / totalGeneralJournee) * 100).toFixed(1)) : 50;
  const pourcentPM = totalGeneralJournee > 0 ? Number(((caApresMidi / totalGeneralJournee) * 100).toFixed(1)) : 50;
  const degresAM = Math.round((pourcentAM / 100) * 360);

  const getBackendBaseRoot = () => {
    const base = api.defaults.baseURL || '';
    if (base.startsWith('http')) {
      try {
        const urlObj = new URL(base);
        return urlObj.origin;
      } catch (e) {
        return base.split('/api')[0];
      }
    }
    return '';
  };

  const backendRoot = getBackendBaseRoot();

  return (
    <div className="space-y-6">
      {msg && (
        <div className={`p-3 text-xs rounded-lg border font-black transition-all uppercase tracking-wider ${
          msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Colonne de Gauche : Caisse et Tableau */}
        <div className="xl:col-span-2 bg-[#F4EFE6] rounded-xl border border-[#D9CFC1] p-6 shadow-sm space-y-5">
          <div className="border-b border-[#D9CFC1] pb-4">
            <h3 className="text-xl font-serif font-black tracking-tight text-[#3E2723]">Caisse Enregistreuse Comptoir</h3>
            <p className="text-xs text-stone-500 mt-0.5">Suivi des ventes serveurs et comptoir par tranche horaire.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              disabled={loading || isSaving}
              onClick={() => setActiveShift('AVANT_MIDI')}
              className={`p-3 rounded-xl text-xs uppercase tracking-wider font-black border transition-all disabled:opacity-50 ${
                activeShift === 'AVANT_MIDI' 
                  ? 'bg-[#B07A50] text-white border-[#B07A50] shadow-xs' 
                  : 'bg-white text-[#5D4037] border-[#D9CFC1] hover:bg-[#FAF2EB] shadow-2xs'
              }`}
            >
              ☀️ Service : Avant Midi {new Date().getHours() < 12 && "(Actuel)"}
            </button>
            <button
              type="button"
              disabled={loading || isSaving}
              onClick={() => setActiveShift('APRES_MIDI')}
              className={`p-3 rounded-xl text-xs uppercase tracking-wider font-black border transition-all disabled:opacity-50 ${
                activeShift === 'APRES_MIDI' 
                  ? 'bg-[#B07A50] text-white border-[#B07A50] shadow-xs' 
                  : 'bg-white text-[#5D4037] border-[#D9CFC1] hover:bg-[#FAF2EB] shadow-2xs'
              }`}
            >
              🌙 Service : Après Midi {new Date().getHours() >= 12 && "(Actuel)"}
            </button>
          </div>

          <div className="border border-[#D9CFC1] rounded-xl overflow-hidden bg-white shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF7F2] text-[#5D4037] font-black uppercase border-b border-[#D9CFC1]">
                <tr>
                  <th className="p-3 w-12 text-center text-[10px] tracking-wider text-stone-400">N°</th>
                  <th className="p-3 tracking-wider">Produit</th>
                  <th className="p-3 text-center w-32 bg-amber-50/40 text-amber-900 tracking-wider">Ventes Serveurs</th>
                  <th className="p-3 text-center w-32 bg-blue-50/30 text-blue-900 tracking-wider">Ventes Comptoir</th>
                  <th className="p-3 text-center w-40 tracking-wider">Nouvel Ajout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE4D8]">
                {loading ? (
                  // ⏳ SKELETON ANIMATION FOR TABLE
                  Array.from({ length: 5 }).map((_, skeletonIdx) => (
                    <tr key={`skeleton-${skeletonIdx}`} className="animate-pulse">
                      <td className="p-4"><div className="h-3 bg-stone-200 rounded-sm w-4 mx-auto"></div></td>
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-9 h-9 bg-stone-200 rounded-lg shrink-0"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-3 bg-stone-200 rounded-sm w-2/3"></div>
                          <div className="h-2.5 bg-stone-200 rounded-sm w-1/3"></div>
                        </div>
                      </td>
                      <td className="p-4 bg-amber-50/10"><div className="h-3 bg-stone-200 rounded-sm w-6 mx-auto"></div></td>
                      <td className="p-4 bg-blue-50/5"><div className="h-3 bg-stone-200 rounded-sm w-6 mx-auto"></div></td>
                      <td className="p-4"><div className="h-7 bg-stone-100 rounded-lg w-24 mx-auto border border-stone-200/60"></div></td>
                    </tr>
                  ))
                ) : lignesSaisie.length === 0 ? (
                  <tr><td colSpan={5} className="p-14 text-center text-stone-400 italic font-medium">Aucun produit trouvé.</td></tr>
                ) : (
                  lignesSaisie.map((item, idx) => {
                    const extraSales = item.quantiteAjustee - item.quantiteInitial;
                    const finalImgPath = item.imageUrl 
                      ? (item.imageUrl.startsWith('http') ? item.imageUrl : `${backendRoot}${item.imageUrl}`) 
                      : undefined;

                    return (
                      <tr key={item.produitId} className={`hover:bg-[#FAF8F5]/60 transition-colors ${!item.actif ? 'bg-stone-50/70 opacity-75' : ''}`}>
                        <td className="p-2.5 font-bold text-stone-400 text-center">{idx + 1}</td>
                        <td className="p-2.5 flex items-center gap-3 font-bold text-[#3E2723]">
                          {finalImgPath ? (
                            <img 
                              src={finalImgPath} 
                              alt={item.nom} 
                              className="w-9 h-9 object-cover rounded-lg border border-[#D9CFC1]" 
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallbackEl = document.getElementById(`fallback-${item.produitId}`);
                                if (fallbackEl) fallbackEl.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          
                          <span 
                            id={`fallback-${item.produitId}`}
                            className="w-9 h-9 items-center justify-center text-base bg-[#FAF2EB] rounded-lg border border-[#D9CFC1]"
                            style={{ display: finalImgPath ? 'none' : 'flex' }}
                          >
                            ☕
                          </span>

                          <div className="flex flex-col">
                            <span className={`tracking-tight font-bold ${!item.actif ? 'line-through text-stone-400' : ''}`}>
                              {item.nom} {!item.actif && <span className="text-[9px] font-black bg-stone-200 text-stone-600 px-1 rounded-sm ml-1 uppercase font-sans">Masqué</span>}
                            </span>
                            <span className="text-[10px] font-mono font-black text-[#B07A50]">{item.prix.toFixed(3)} DT</span>
                          </div>
                        </td>
                        
                        <td className="p-2.5 text-center font-mono font-black text-amber-800 bg-amber-50/10">
                          {item.quantiteServeurs}
                        </td>

                        <td className="p-2.5 text-center font-mono font-black text-blue-800 bg-blue-50/5">
                          {item.quantiteComptoir}
                        </td>
                        
                        <td className="p-2.5">
                          <div className="flex flex-col items-center">
                            <div className="flex items-center justify-between border border-[#D9CFC1] rounded-lg h-8 bg-white w-full max-w-[110px] shadow-2xs overflow-hidden">
                              <button 
                                type="button" 
                                onClick={() => updateQty(item.produitId, -1)} 
                                disabled={item.quantiteAjustee <= item.quantiteInitial || isSaving || loading}
                                className="w-8 bg-[#3E2723] hover:bg-[#2D1F16] text-white font-black h-full transition-colors disabled:opacity-30 text-xs"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-black font-mono text-[#3E2723] text-xs">{extraSales}</span>
                              <button 
                                type="button" 
                                onClick={() => updateQty(item.produitId, 1)} 
                                disabled={isSaving || loading}
                                className="w-8 bg-[#3E2723] hover:bg-[#2D1F16] text-white font-black h-full transition-colors disabled:opacity-30 text-xs"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-white border border-[#D9CFC1] rounded-xl p-3.5 flex justify-between items-center text-xs font-black text-[#3E2723] shadow-2xs uppercase tracking-wider">
            <span>Ticket comptoir en cours de saisie :</span>
            <span className="font-mono text-sm text-emerald-700 font-black">{totalNouvellesVentesComptoir.toFixed(3)} DT</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button" 
              onClick={handleSauvegarder} 
              disabled={loading || isSaving} 
              className={`p-3 rounded-xl text-xs uppercase tracking-wider font-black transition shadow-xs text-white ${
                isSaving || loading 
                  ? 'bg-stone-400 cursor-not-allowed opacity-60' 
                  : 'bg-[#B07A50] hover:bg-[#96633D]'
              }`}
            >
              {isSaving ? "⏳ Enregistrement..." : "💾 Enregistrer le ticket"}
            </button>
            <button 
              type="button" 
              onClick={handleNouvelleVente} 
              disabled={loading || isSaving} 
              className="bg-[#1C120C] hover:bg-[#2D1F16] text-white p-3 rounded-xl text-xs uppercase tracking-wider font-black transition shadow-xs disabled:opacity-50"
            >
              🔄 Vider la saisie
            </button>
          </div>
        </div>

        {/* Colonne de Droite : Indicateurs & Flux */}
        <div className="space-y-6">
          
          {/* Bloc 1 : Répartition des flux Serv vs Comptoir */}
          <div className="bg-[#F4EFE6] rounded-xl border border-[#D9CFC1] p-5 shadow-sm space-y-4">
            <h4 className="text-[10px] font-black bg-[#A26D42] text-white px-3 py-1.5 rounded-md uppercase tracking-wider">
              Flux du Shift Actuel
            </h4>
            {loading ? (
              <div className="animate-pulse flex items-center justify-around py-2">
                <div className="w-24 h-24 bg-stone-200 rounded-full"></div>
                <div className="space-y-3 flex-1 pl-4">
                  <div className="h-3 bg-stone-200 rounded-sm w-3/4"></div>
                  <div className="h-3 bg-stone-200 rounded-sm w-1/2"></div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-around gap-2">
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center shadow-inner"
                  style={{ background: `conic-gradient(#D69E2E 0deg ${degresFlux}deg, #3182CE ${degresFlux}deg 360deg)` }}
                >
                  <div className="w-18 h-18 rounded-full bg-white flex items-center justify-center flex-col shadow-xs">
                    <span className="text-[8px] uppercase font-black text-stone-400 tracking-wider">Shift Brut</span>
                    <span className="text-xs font-black text-[#3E2723] font-mono">{totalGlobalShift.toFixed(2)} DT</span>
                  </div>
                </div>
                <div className="space-y-3 text-[11px] flex-1 pl-3 font-bold">
                  <div>
                    <div className="flex items-center gap-1.5 text-amber-900 font-black uppercase tracking-wide">
                      <div className="w-2 h-2 bg-[#D69E2E] rounded-xs"></div>
                      <span>Serveurs</span>
                    </div>
                    <p className="text-stone-500 font-mono pl-3.5 mt-0.5">{pourcentServeurs}% ({totalServeursShift.toFixed(2)} DT)</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-blue-900 font-black uppercase tracking-wide">
                      <div className="w-2 h-2 bg-[#3182CE] rounded-xs"></div>
                      <span>Comptoir</span>
                    </div>
                    <p className="text-stone-500 font-mono pl-3.5 mt-0.5">{pourcentComptoir}% ({totalComptoirShift.toFixed(2)} DT)</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bloc 2 : Recette cumulée globale */}
          <div className="bg-[#F4EFE6] rounded-xl border border-[#D9CFC1] p-5 shadow-sm space-y-4">
            <h4 className="text-[10px] font-black bg-[#3E2723] text-[#EAD7C3] px-3 py-1.5 rounded-md uppercase tracking-wider">Recette cumulée globale</h4>
            {loading ? (
              <div className="animate-pulse space-y-3 py-1">
                <div className="h-3 bg-stone-200 rounded-sm"></div>
                <div className="h-3 bg-stone-200 rounded-sm"></div>
                <div className="h-3 bg-stone-200 rounded-sm"></div>
              </div>
            ) : (
              <div className="text-xs space-y-2.5 text-[#5D4037] font-bold">
                <div className="flex justify-between border-b border-[#D9CFC1] border-dashed pb-1.5"><span>Date de session</span><span className="font-black font-mono">{new Date().toLocaleDateString('fr-FR')}</span></div>
                <div className="flex justify-between border-b border-[#D9CFC1] border-dashed pb-1.5"><span>Total Shift Matin</span><span className="font-black font-mono text-stone-600">{caAvantMidi.toFixed(3)} DT</span></div>
                <div className="flex justify-between border-b border-[#D9CFC1] border-dashed pb-1.5"><span>Total Shift Soir</span><span className="font-black font-mono text-stone-600">{caApresMidi.toFixed(3)} DT</span></div>
              </div>
            )}
            <div className="pt-3 flex justify-between items-center border-t border-[#D9CFC1]">
              <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Total Journée Brut</span>
              {loading ? (
                <div className="h-5 bg-stone-200 rounded-sm w-20 animate-pulse"></div>
              ) : (
                <span className="text-lg font-black text-emerald-700 font-mono">{totalGeneralJournee.toFixed(3)} DT</span>
              )}
            </div>
          </div>

          {/* Bloc 3 : Graphique Volume Horaires */}
          <div className="bg-[#F4EFE6] rounded-xl border border-[#D9CFC1] p-5 shadow-sm space-y-4">
            <h4 className="text-[10px] font-black bg-[#3E2723] text-[#EAD7C3] px-3 py-1.5 rounded-md uppercase tracking-wider">Volume Shifts</h4>
            {loading ? (
              <div className="animate-pulse flex items-center justify-around py-2">
                <div className="w-24 h-24 bg-stone-200 rounded-full"></div>
                <div className="space-y-3 flex-1 pl-4">
                  <div className="h-3 bg-stone-200 rounded-sm w-3/4"></div>
                  <div className="h-3 bg-stone-200 rounded-sm w-1/2"></div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-around gap-2">
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center shadow-inner"
                  style={{ background: `conic-gradient(#B07A50 0deg ${degresAM}deg, #3E2723 ${degresAM}deg 360deg)` }}
                >
                  <div className="w-18 h-18 rounded-full bg-white flex items-center justify-center flex-col shadow-xs">
                    <span className="text-[8px] uppercase font-black text-stone-400 tracking-wider">Total</span>
                    <span className="text-xs font-black text-[#3E2723] font-mono">{totalGeneralJournee.toFixed(2)} DT</span>
                  </div>
                </div>
                <div className="space-y-3 text-[11px] flex-1 pl-3 font-bold">
                  <div>
                    <div className="flex items-center gap-1.5 text-[#3E2723] font-black uppercase tracking-wide"><div className="w-2 h-2 bg-[#B07A50] rounded-xs"></div><span>Matin</span></div>
                    <p className="text-stone-500 font-mono pl-3.5 mt-0.5">{pourcentAM}% ({caAvantMidi.toFixed(2)} DT)</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-[#3E2723] font-black uppercase tracking-wide"><div className="w-2 h-2 bg-[#3E2723] rounded-xs"></div><span>Soir</span></div>
                    <p className="text-stone-500 font-mono pl-3.5 mt-0.5">{pourcentPM}% ({caApresMidi.toFixed(2)} DT)</p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};