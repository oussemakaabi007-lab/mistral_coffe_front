import React, { useEffect, useState } from 'react';
import { 
  CalendarDays, 
  LayoutGrid, 
  ClipboardList, 
  Sparkles,
  Sun,
  Moon,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api';

interface DailyRevenueBreakdown {
  avantMidi: number;
  apresMidi: number;
}

interface IngredientAlert {
  id: number;
  nom: string;
  quantiteStock: number;
  seuilAlerte: number;
  uniteMesure: string;
}

export const Overview: React.FC = () => {
  const [revenue, setRevenue] = useState<DailyRevenueBreakdown | null>(null);
  const [alerts, setAlerts] = useState<IngredientAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [revRes, alertRes] = await Promise.all([
          api.get('/ventes/chiffre-affaires-aujourdhui'),
          api.get('/ingredients/alertes'), 
        ]);
        setRevenue(revRes.data);
        setAlerts(alertRes.data);
      } catch (err) {
        console.error('Erreur lors du chargement du tableau de bord', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const todayDateStr = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const caAM = revenue?.avantMidi ?? 0;
  const caPM = revenue?.apresMidi ?? 0;
  const totalRevenue = caAM + caPM;

  const percentAM = totalRevenue > 0 ? Math.round((caAM / totalRevenue) * 100) : 0;
  const percentPM = totalRevenue > 0 ? Math.round((caPM / totalRevenue) * 100) : 0;
  
  const dominantShift = caAM > caPM ? 'Matin (AM)' : caPM > caAM ? 'Après-midi (PM)' : 'Égalité';

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#D9CFC1] pb-5">
        <div>
          <h1 className="text-2xl font-serif font-black tracking-tight text-[#3E2723]">Vue Générale</h1>
          <p className="text-xs text-stone-500 mt-0.5">Suivi des flux financiers en direct et alertes d'approvisionnement.</p>
        </div>
        <div className="bg-[#F4EFE6] border border-[#D9CFC1] px-4 py-2.5 rounded-xl flex items-center gap-2 self-start md:self-auto shadow-sm">
          <CalendarDays size={16} className="text-[#B07A50]" />
          <span className="text-xs font-bold text-[#3E2723] font-mono capitalize">{todayDateStr}</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-8 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#F4EFE6] p-6 rounded-xl border border-[#D9CFC1] h-36 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-3.5 bg-stone-200/80 rounded w-1/2" />
                <div className="h-8 bg-stone-300/60 rounded w-2/3" />
              </div>
              <div className="h-3 bg-stone-200/60 rounded w-5/6 border-t border-dashed border-[#D9CFC1] pt-2" />
            </div>
            <div className="bg-[#F4EFE6] p-6 rounded-xl border border-[#D9CFC1] h-36 flex flex-col justify-between">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-2 border border-[#D9CFC1] rounded-lg space-y-2">
                  <div className="h-2.5 bg-stone-200 rounded w-3/4" />
                  <div className="h-4 bg-stone-300/70 rounded w-1/2" />
                </div>
                <div className="bg-white p-2 border border-[#D9CFC1] rounded-lg space-y-2">
                  <div className="h-2.5 bg-stone-200 rounded w-3/4" />
                  <div className="h-4 bg-stone-300/70 rounded w-1/2" />
                </div>
              </div>
              <div className="h-2 bg-stone-200 rounded-full w-full" />
            </div>
            <div className="bg-[#F4EFE6] p-6 rounded-xl border border-[#D9CFC1] h-36 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-3.5 bg-stone-200/80 rounded w-1/2" />
                <div className="flex justify-between items-center mt-2">
                  <div className="h-3 bg-stone-200 rounded w-2/5" />
                  <div className="h-5 bg-stone-300/80 rounded w-8" />
                </div>
              </div>
              <div className="h-3 bg-stone-200/60 rounded w-3/4 border-t border-dashed border-[#D9CFC1] pt-2" />
            </div>
          </div>

          <div className="bg-[#F4EFE6] rounded-xl border border-[#D9CFC1] p-6 space-y-4">
            <div className="space-y-2">
              <div className="h-5 bg-stone-300/70 rounded w-1/4" />
              <div className="h-3 bg-stone-200/80 rounded w-1/2" />
            </div>
            <div className="border border-[#D9CFC1] rounded-xl bg-white overflow-hidden">
              <div className="bg-[#EBE4D8]/60 h-10 border-b border-[#D9CFC1]" />
              <div className="p-3.5 space-y-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={`table-skel-${idx}`} className="flex justify-between items-center py-2 border-b border-[#EBE4D8] last:border-0">
                    <div className="h-4 bg-stone-200 rounded w-1/4" />
                    <div className="h-4 bg-stone-200 rounded w-16" />
                    <div className="h-4 bg-stone-300/70 rounded w-20" />
                    <div className="h-6 bg-stone-200 rounded w-32" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#F4EFE6] p-6 rounded-xl shadow-sm border border-[#D9CFC1] flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Chiffre d'Affaires Global</p>
                  <span className="text-xs bg-white text-emerald-800 border border-[#D9CFC1] px-2 py-0.5 rounded-full font-bold">Aujourd'hui</span>
                </div>
                <p className="text-3xl font-black text-[#2E7D32] font-mono mt-3">{totalRevenue.toFixed(3)} <span className="text-sm font-sans font-bold">TND</span></p>
              </div>
              <div className="text-[11px] text-[#5D4037] border-t border-dashed border-[#D9CFC1] pt-2">
                Meilleur rendement : <span className="font-bold text-[#3E2723]">{dominantShift}</span>
              </div>
            </div>

            <div className="bg-[#F4EFE6] p-6 rounded-xl shadow-sm border border-[#D9CFC1] flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Ventilation des Shifts</p>
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div className="bg-white p-2 border border-[#D9CFC1] rounded-lg">
                    <span className="flex items-center gap-1 text-stone-400 font-sans text-[10px] font-bold uppercase"><Sun size={12}/> MATIN (AM)</span>
                    <span className="text-sm font-bold text-[#3E2723]">{caAM.toFixed(3)} DT</span>
                    <span className="block text-[10px] text-stone-400 font-sans">{percentAM}% des ventes</span>
                  </div>
                  <div className="bg-white p-2 border border-[#D9CFC1] rounded-lg">
                    <span className="flex items-center gap-1 text-stone-400 font-sans text-[10px] font-bold uppercase"><Moon size={12}/> SOIR (PM)</span>
                    <span className="text-sm font-bold text-[#3E2723]">{caPM.toFixed(3)} DT</span>
                    <span className="block text-[10px] text-stone-400 font-sans">{percentPM}% des ventes</span>
                  </div>
                </div>
              </div>

              {totalRevenue > 0 && (
                <div className="w-full space-y-1">
                  <div className="w-full h-2 bg-[#EBE4D8] rounded-full overflow-hidden flex">
                    <div style={{ width: `${percentAM}%` }} className="bg-[#B07A50] h-full transition-all" title="AM" />
                    <div style={{ width: `${percentPM}%` }} className="bg-[#3E2723] h-full transition-all" title="PM" />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#F4EFE6] p-6 rounded-xl shadow-sm border border-[#D9CFC1] flex flex-col justify-between space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Santé de l'Établissement</p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#3E2723]">Alertes de stock actives :</span>
                    <span className={`px-2 py-0.5 rounded font-mono ${alerts.length > 0 ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'}`}>
                      {alerts.length}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-stone-400 border-t border-dashed border-[#D9CFC1] pt-2">
                Mise à jour matérielle automatique en temps réel.
              </div>
            </div>
          </div>

          <div className="bg-[#F4EFE6] rounded-xl shadow-sm border border-[#D9CFC1] p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-[#3E2723] flex items-center gap-2">
                <ClipboardList size={20} /> État Critique des Ingrédients ({alerts.length})
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">Ingrédients dont le niveau est inférieur ou égal au seuil de sécurité minimum configuré.</p>
            </div>
            
            {alerts.length === 0 ? (
              <div className="flex items-center gap-3 text-sm text-emerald-900 bg-white border border-emerald-200 p-4 rounded-xl font-medium shadow-2xs">
                <CheckCircle2 size={18} />
                <p>Excellent ! Tous les niveaux de matières premières sont au-dessus de la ligne d'alerte.</p>
              </div>
            ) : (
              <div className="overflow-hidden border border-[#D9CFC1] rounded-xl bg-white shadow-2xs">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-[#EBE4D8]/60 border-b border-[#D9CFC1] text-xs font-bold uppercase tracking-wider text-[#5D4037]">
                    <tr>
                      <th className="p-3.5">Ingrédient</th>
                      <th className="p-3.5">Seuil Minimum</th>
                      <th className="p-3.5">Stock Actuel</th>
                      <th className="p-3.5 text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBE4D8]">
                    {alerts.map((item) => {
                      const isZero = item.quantiteStock <= 0;

                      return (
                        <tr key={item.id} className="hover:bg-[#FAF8F5] transition duration-75">
                          <td className="p-3.5 font-bold text-[#3E2723] tracking-tight">{item.nom}</td>
                          <td className="p-3.5 text-stone-500 font-medium font-mono text-xs">
                            {item.seuilAlerte} {item.uniteMesure}
                          </td>
                          <td className={`p-3.5 font-black font-mono ${isZero ? 'text-red-700' : 'text-amber-700'}`}>
                            {item.quantiteStock} {item.uniteMesure}
                          </td>

                          <td className="p-3.5 text-center">
                            {isZero ? (
                              <span className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-red-50 border border-red-200 text-red-700 uppercase tracking-wider">
                                <AlertTriangle size={12}/> Rupture de Stock
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-800 uppercase tracking-wider">
                                Réapprovisionnement Requis
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};