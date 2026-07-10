import React, { useEffect, useState, useContext } from 'react';
import { 
  User, Edit2, Lock, Unlock, Save, AlertTriangle, Shield, UserCog, Check, X, Plus, Ban, KeyRound 
} from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

interface StaffMember {
  id: number;
  nomUtilisateur: string;
  role: 'ADMIN' | 'GERANT' | 'SERVEUR';
  actif: boolean;
}

interface SessionPoste {
  id: number;
  utilisateurId: number;
  statut: 'OUVERT' | 'CLOTURE';
}

export const Staff: React.FC = () => {
  const auth = useContext(AuthContext);
  const currentUserRole = auth?.user?.role;
  const currentUserId = auth?.user?.id;

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [activeSessions, setActiveSessions] = useState<SessionPoste[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [memberToToggle, setMemberToToggle] = useState<StaffMember | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nomUtilisateur, setNomUtilisateur] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'GERANT' | 'SERVEUR'>('SERVEUR');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [staffRes, sessionRes] = await Promise.all([
        api.get('/utilisateurs'),
        api.get('/sessions-poste/active').catch(() => ({ data: [] })),
      ]);
      setStaff(staffRes.data);
      setActiveSessions(Array.isArray(sessionRes.data) ? sessionRes.data : []);
    } catch (err) {
      showNotification('Erreur de chargement des données du personnel.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setNomUtilisateur('');
    setMotDePasse('');
    setRole('SERVEUR');
  };
  const canManage = (member: StaffMember) => {
    if (currentUserRole === 'ADMIN') return true;
    return member.role === 'SERVEUR';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomUtilisateur.trim() || isMutating) return;
    if (currentUserRole === 'GERANT' && role !== 'SERVEUR') {
      showNotification('Action non autorisée.', 'error');
      return;
    }

    setIsMutating(true);
    try {
      if (isEditing && editingId) {
        const payload: any = { nomUtilisateur: nomUtilisateur.trim(), role };
        if (motDePasse.trim()) payload.motDePasse = motDePasse;

        await api.patch(`/utilisateurs/${editingId}`, payload);
        showNotification(`Compte de [${nomUtilisateur}] mis à jour !`, 'success');
      } else {
        if (!motDePasse) {
          showNotification('Le mot de passe est obligatoire pour la création.', 'error');
          setIsMutating(false);
          return;
        }
        await api.post('/utilisateurs', {
          nomUtilisateur: nomUtilisateur.trim(),
          motDePasse,
          role,
        });
        showNotification(`Compte créé pour [${nomUtilisateur}] !`, 'success');
      }
      resetForm();
      await loadData();
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Erreur lors de l’opération.', 'error');
    } finally {
      setIsMutating(false);
    }
  };

  const handleEdit = (member: StaffMember) => {
    if (!canManage(member)) return;
    setIsEditing(true);
    setEditingId(member.id);
    setNomUtilisateur(member.nomUtilisateur);
    setRole(member.role);
    setMotDePasse('');
  };

  const openStatusModal = (member: StaffMember) => {
    if (member.id === currentUserId) {
      showNotification('Vous ne pouvez pas modifier votre propre statut d’activité.', 'error');
      return;
    }
    if (!canManage(member)) {
      showNotification('Action non autorisée.', 'error');
      return;
    }
    setMemberToToggle(member);
    setShowStatusModal(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!memberToToggle || isMutating) return;

    setIsMutating(true);
    const { id, nomUtilisateur: username, actif } = memberToToggle;

    try {
      await api.delete(`/utilisateurs/${id}`);
      showNotification(
        `Le compte de [${username}] a été ${actif ? 'désactivé' : 'activé'} avec succès.`,
        'success'
      );
      setShowStatusModal(false);
      setMemberToToggle(null);
      await loadData();
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Impossible de modifier le statut du compte.', 'error');
    } finally {
      setIsMutating(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'GERANT': return 'bg-orange-100 text-orange-900 border-orange-200';
      default: return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  const Spinner = () => (
    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  if (currentUserRole !== 'ADMIN' && currentUserRole !== 'GERANT') {
    return (
      <div className="bg-white rounded-xl border border-[#EBE4D8] p-8 text-center text-sm font-medium text-stone-500 shadow-xs">
        <Shield className="mx-auto mb-2 text-stone-400" /> Zone sécurisée. Seuls les administrateurs et gérants peuvent administrer les comptes d'accès.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-2 space-y-4">
        <div>
          <h1 className="text-xl font-serif font-black text-[#3E2723]">Équipe & Droits d'Accès</h1>
          <p className="text-xs text-stone-500 mt-0.5">Gestion des comptes serveurs, gérants et configuration des statuts.</p>
        </div>

        {msg && (
          <div className={`p-3 text-xs rounded-xl font-semibold border shadow-2xs transition-all ${msg.type === 'success' ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
            {msg.type === 'success' ? <Check className="inline mr-1" size={14} /> : <AlertTriangle className="inline mr-1" size={14} />} {msg.text}
          </div>
        )}

        {isLoading ? (
          <div className="bg-[#FAF7F2] border border-[#D9CFC1] rounded-xl overflow-hidden animate-pulse">
            <div className="h-10 bg-[#EBE4D8]/50 border-b border-[#D9CFC1]"></div>
            {[1, 2, 3].map((n) => (
              <div key={n} className="p-4 border-b border-stone-100 flex justify-between items-center">
                <div className="space-y-2 w-1/3">
                  <div className="h-3 bg-stone-200 rounded w-3/4"></div>
                  <div className="h-2 bg-stone-200 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-stone-200 rounded w-16"></div>
                <div className="h-6 bg-stone-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[#D9CFC1] rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EBE4D8]/40 border-b border-[#D9CFC1] text-[10px] uppercase font-bold text-[#5D4037] tracking-wider">
                  <th className="p-3">Utilisateur</th>
                  <th className="p-3">Rôle système</th>
                  <th className="p-3">Statut Service</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {staff.map((member) => {
                  const isSessionOpen = activeSessions.some(s => s.utilisateurId === member.id && s.statut === 'OUVERT');
                  const isSelf = member.id === currentUserId;

                  return (
                    <tr 
                      key={member.id} 
                      className={`transition-colors ${!member.actif ? 'bg-stone-50/70 opacity-60' : 'hover:bg-[#FAF7F2]/50'}`}
                    >
                      <td className="p-3">
                        <div className="font-bold text-[#3E2723] flex items-center gap-1.5">
                          <User size={14} /> {member.nomUtilisateur}
                          {isSelf && <span className="text-[9px] bg-stone-700 text-white px-1.5 py-0.5 rounded font-mono font-normal">Moi</span>}
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono">ID: #{member.id}</div>
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${getRoleBadgeColor(member.role)}`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="p-3">
                        {isSessionOpen ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> En service
                          </span>
                        ) : (
                          <span className="text-stone-400 text-[11px] italic">Hors poste</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEdit(member)}
                            disabled={!canManage(member) || !member.actif || isMutating}
                            className={`text-[10px] px-2 py-1.5 rounded border font-bold transition ${
                              !canManage(member) || !member.actif || isMutating
                                ? 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed' 
                                : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-300 shadow-2xs'
                            }`}
                          >
                            <Edit2 size={12} className="inline mr-1" /> Éditer
                          </button>
                          
                          <button
                            type="button"
                            disabled={isSelf || !canManage(member) || isMutating}
                            onClick={() => openStatusModal(member)}
                            className={`text-[10px] px-2 py-1.5 rounded border font-bold transition shadow-2xs ${
                              isSelf || !canManage(member) || isMutating
                                ? 'bg-stone-50 border-stone-100 text-stone-300 cursor-not-allowed'
                                : member.actif
                                ? 'bg-white hover:bg-rose-50 text-rose-600 border-rose-200'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                            }`}
                          >
                            {member.actif ? <Lock size={12} className="inline mr-1" /> : <Unlock size={12} className="inline mr-1" />} 
                            {member.actif ? 'Désactiver' : 'Activer'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="bg-[#FAF7F2] border border-[#D9CFC1] rounded-xl p-4 shadow-xs">
        <h3 className="text-xs font-black tracking-wider uppercase text-[#5D4037] border-b border-[#EBE4D8] pb-2 mb-3">
          {isEditing ? '✏️ Modifier l’accès' : '➕ Nouveau collaborateur'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#5D4037] mb-1">Identifiant unique</label>
            <input
              type="text"
              required
              disabled={isMutating}
              value={nomUtilisateur}
              onChange={(e) => setNomUtilisateur(e.target.value)}
              className="w-full rounded-lg border border-[#D9CFC1] bg-white p-2.5 text-sm text-[#3E2723] font-bold focus:outline-none focus:border-[#B07A50] disabled:opacity-60"
              placeholder="Ex: amine_serveur"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#5D4037] mb-1">
              {isEditing ? 'Mot de passe (Optionnel)' : 'Mot de passe'}
            </label>
            <input
              type="password"
              required={!isEditing}
              disabled={isMutating}
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="w-full rounded-lg border border-[#D9CFC1] bg-white p-2.5 text-sm text-[#3E2723] focus:outline-none focus:border-[#B07A50] placeholder-stone-400 disabled:opacity-60"
              placeholder={isEditing ? 'Laisser vide si inchangé' : '••••••••'}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#5D4037] mb-1">Rôle & habilitations</label>
            <select
              value={role}
              disabled={isMutating}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full rounded-lg border border-[#D9CFC1] bg-white p-2.5 text-sm text-[#3E2723] font-bold focus:outline-none focus:border-[#B07A50] disabled:opacity-60"
            >
              <option value="SERVEUR">👤 SERVEUR (Prise de commande unique)</option>
              {currentUserRole === 'ADMIN' && (
                <>
                  <option value="GERANT">💼 GÉRANT (Clôtures & supervision stocks)</option>
                  <option value="ADMIN">👑 ADMIN (Contrôle total & tarifs)</option>
                </>
              )}
            </select>
          </div>

          <div className="flex gap-2 pt-2 border-t border-[#EBE4D8]">
            <button
              type="submit"
              disabled={isMutating}
              className="flex-1 bg-[#1C120C] hover:bg-[#2D1F16] text-white p-2.5 text-sm rounded-lg font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isMutating ? <Spinner /> : isEditing ? <Save size={16} /> : <Plus size={16} />} 
              {isMutating ? 'Traitement...' : isEditing ? 'Sauvegarder' : 'Créer le compte'}
            </button>
            <button
              type="button"
              disabled={isMutating}
              onClick={resetForm}
              className="bg-white hover:bg-stone-50 text-stone-600 border border-[#D9CFC1] px-4 text-sm rounded-lg font-semibold transition disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </div>
        </form>
      </div>
      {showStatusModal && memberToToggle && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          onClick={() => !isMutating && setShowStatusModal(false)}
        >
          <div 
            className="bg-white max-w-sm w-full rounded-xl border border-stone-200 p-5 shadow-2xl text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mx-auto border ${
              memberToToggle.actif 
                ? 'bg-rose-50 border-rose-100 text-rose-600' 
                : 'bg-emerald-50 border-emerald-100 text-emerald-600'
            }`}>
              {memberToToggle.actif ? <Ban size={24} /> : <KeyRound size={24} />}
            </div>
            
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                {memberToToggle.actif ? 'Désactiver' : 'Activer'} le compte ?
              </h3>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                Voulez-vous vraiment <span className="font-bold text-stone-800">{memberToToggle.actif ? 'désactiver' : 'activer'}</span> le compte de <span className="font-bold text-stone-800">[{memberToToggle.nomUtilisateur}]</span> ?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isMutating}
                onClick={handleConfirmToggleStatus}
                className={`flex-1 font-bold text-xs py-2 px-3 rounded-lg text-white flex items-center justify-center gap-2 transition ${
                  memberToToggle.actif 
                    ? 'bg-rose-600 hover:bg-rose-700' 
                    : 'bg-emerald-600 hover:bg-emerald-700'
                } disabled:opacity-70`}
              >
                {isMutating ? <Spinner /> : 'Confirmer'}
              </button>
              <button
                type="button" 
                disabled={isMutating} 
                onClick={() => setShowStatusModal(false)}
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