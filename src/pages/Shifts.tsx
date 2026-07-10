import React, { useEffect, useState, useMemo } from 'react';
import { Clock, AlertTriangle, Shield, History, Loader2, Calendar } from 'lucide-react';
import api from '../services/api';

interface Session {
  id: number;
  utilisateur: { nomUtilisateur: string; role: string };
  dateOuverture: string;
  dateFermeture?: string;
  fondDeCaisse: string;
  caisseReelle?: string;
  statut: 'OUVERT' | 'FERME';
}

export const Shifts: React.FC = () => {
  const [shifts, setShifts] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [shiftToClose, setShiftToClose] = useState<Session | null>(null);
  
  const today = new Date().toISOString().split('T')[0];
  const [dateStart, setDateStart] = useState(today);
  const [dateEnd, setDateEnd] = useState(today);

  const loadShifts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/sessions-poste');
      setShifts(res.data);
    } catch (err) {
      console.error('Erreur chargement');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadShifts(); }, []);

  const handleCloseShift = async () => {
    if (!shiftToClose) return;
    setIsMutating(true);
    try {
      await api.patch(`/sessions-poste/${shiftToClose.id}/cloturer`, { montantFinal: 0 });
      await loadShifts();
      setShowCloseModal(false);
      setShiftToClose(null);
    } catch (err) {
      console.error("Erreur clôture:", err);
    } finally {
      setIsMutating(false);
    }
  };

  const activeSessions = useMemo(() => shifts.filter(s => s.statut === 'OUVERT'), [shifts]);
  const historicalSessions = useMemo(() => {
    return shifts.filter(s => s.statut === 'FERME').filter(s => {
      const sDate = s.dateOuverture.split('T')[0];
      return sDate >= dateStart && sDate <= dateEnd;
    });
  }, [shifts, dateStart, dateEnd]);

  const SkeletonRow = ({ cols }: { cols: number }) => (
    <tr className="animate-pulse">
      {[...Array(cols)].map((_, i) => <td key={i} className="p-4"><div className="h-4 bg-stone-100 rounded"></div></td>)}
    </tr>
  );

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-sm font-black text-[#3E2723] mb-4 flex items-center gap-2">
          <Clock size={16} className="text-[#8C5832]" /> Sessions Actives
        </h2>
        <div className="bg-white border border-[#D9CFC1] rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-[#5D4037]">
              <tr>
                <th className="p-4 uppercase font-black">Utilisateur</th>
                <th className="p-4 uppercase font-black">Fond Initial</th>
                <th className="p-4 uppercase font-black text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? <SkeletonRow cols={3} /> : activeSessions.map(s => (
                <tr key={s.id} className="border-t">
                  <td className="p-4 font-bold flex items-center gap-2"><Shield size={14}/> {s.utilisateur.nomUtilisateur}</td>
                  <td className="p-4 font-mono text-stone-600">{Number(s.fondDeCaisse).toFixed(3)} DT</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => { setShiftToClose(s); setShowCloseModal(true); }}
                      className="bg-[#3E2723] text-white px-3 py-1 rounded hover:bg-black transition"
                    >
                      Clôturer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-[#3E2723] flex items-center gap-2">
            <History size={16} className="text-[#8C5832]" /> Sessions Clôturées
          </h2>
          <div className="flex gap-2 bg-[#FAF7F2] p-1 rounded-lg border border-[#D9CFC1]">
            <span className="text-[10px] text-stone-600 font-bold self-center">Filtrer par date :</span>
            <span className="text-[10px] text-stone-600 font-bold self-center">Du</span>
            <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="bg-transparent text-[10px] p-1" />
            <span className="text-[10px] text-stone-600 font-bold self-center">Au</span>
            <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="bg-transparent text-[10px] p-1" />
          </div>
        </div>
        <div className="bg-white border border-[#D9CFC1] rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-[#5D4037]">
              <tr>
                <th className="p-4 uppercase font-black">Ouverture</th>
                <th className="p-4 uppercase font-black">Fermeture</th>
                <th className="p-4 uppercase font-black">Utilisateur</th>
                <th className="p-4 uppercase font-black">Caisse Réelle</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? <SkeletonRow cols={4} /> : historicalSessions.map(s => (
                <tr key={s.id} className="border-t">
                  <td className="p-4">{new Date(s.dateOuverture).toLocaleString()}</td>
                  <td className="p-4">{s.dateFermeture ? new Date(s.dateFermeture).toLocaleString() : '-'}</td>
                  <td className="p-4 font-bold">{s.utilisateur.nomUtilisateur}</td>
                  <td className="p-4 font-mono font-bold text-[#8C5832]">
                    {s.caisseReelle ? `${Number(s.caisseReelle).toFixed(3)} DT` : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showCloseModal && shiftToClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm text-center">
            <AlertTriangle className="mx-auto text-amber-600 mb-4" size={48} />
            <h3 className="font-black text-[#3E2723] mb-2">Clôturer la session ?</h3>
            <p className="text-xs text-stone-500 mb-6">Confirmer la fermeture pour {shiftToClose.utilisateur.nomUtilisateur}.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowCloseModal(false)} className="flex-1 p-2 bg-stone-100 rounded-lg text-xs font-bold">Annuler</button>
              <button onClick={handleCloseShift} disabled={isMutating} className="flex-1 p-2 bg-[#8C5832] text-white rounded-lg text-xs font-bold">
                {isMutating ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};