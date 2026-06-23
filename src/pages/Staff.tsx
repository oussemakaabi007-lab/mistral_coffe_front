import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

// Interface étendue pour englober tous les rôles du personnel
interface StaffMember {
  id: number;
  nomUtilisateur: string;
  role: 'ADMIN' | 'GERANT' | 'SERVEUR';
}

interface SessionPoste {
  id: number;
  utilisateurId: number;
  statut: 'OUVERT' | 'CLOTURE';
}

export const Staff: React.FC = () => {
  const auth = useContext(AuthContext);
  const currentUserRole = auth?.user?.role; // 'ADMIN' | 'GERANT' | 'SERVEUR'
  const currentUserId = auth?.user?.id;     // ID de l'utilisateur actuellement connecté

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [activeSessions, setActiveSessions] = useState<SessionPoste[]>([]);
  const [isLoading, setIsLoading] = useState(true); // 🔄 Added Loading State
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form States
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nomUtilisateur, setNomUtilisateur] = useState('');
  const [motDePasse, setMotDePasse] = useState(''); 
  const [role, setRole] = useState<'ADMIN' | 'GERANT' | 'SERVEUR'>('SERVEUR');
  const [showForm, setShowForm] = useState(false);

  // 🔄 Chargement des données avec filtrage dynamique selon les rôles
  const loadData = async () => {
    setIsLoading(true); // Trigger skeleton rows during data refresh
    try {
      const [usersRes, sessionsRes] = await Promise.all([
        api.get('/utilisateurs'),
        api.get('/sessions-poste/active').catch((err) => {
          console.log("Aucune session active ou route indisponible.");
          return { data: [] };
        })
      ]);

      const allUsers = usersRes.data;
      let filteredStaff: StaffMember[] = [];

      // Filtrage selon la hiérarchie
      if (currentUserRole === 'ADMIN') {
        filteredStaff = allUsers; // L'admin voit et gère tout le monde
      } else if (currentUserRole === 'GERANT') {
        filteredStaff = allUsers.filter((user: StaffMember) => user.role === 'SERVEUR'); // Le gérant ne voit que les serveurs
      }

      setStaff(filteredStaff);

      const sessions = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];
      setActiveSessions(sessions.filter(s => s.statut === 'OUVERT'));
    } catch (err) {
      showNotification('Erreur lors du chargement du personnel et des sessions.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserRole) {
      loadData();
    }
  }, [currentUserRole]);

  const showNotification = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  const resetForm = () => {
    setNomUtilisateur('');
    setMotDePasse('');
    setRole('SERVEUR');
    setIsEditing(false);
    setEditingId(null);
    setShowForm(false);
  };

  // ➕ Soumission du formulaire (Création / Modification)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sécurité front-end : un gérant ne peut créer ou éditer qu'un rôle SERVEUR
    const assignedRole = currentUserRole === 'GERANT' ? 'SERVEUR' : role;

    const payload: any = { 
      nomUtilisateur: nomUtilisateur.trim(),
      role: assignedRole 
    };

    if (motDePasse) {
      payload.motDePasse = motDePasse;
    }

    try {
      if (isEditing && editingId) {
        await api.patch(`/utilisateurs/${editingId}`, payload);
        showNotification(`Le compte [${nomUtilisateur}] a été mis à jour.`, 'success');
      } else {
        await api.post('/utilisateurs', payload);
        showNotification(`L'utilisateur [${nomUtilisateur}] a été créé avec le rôle ${assignedRole}.`, 'success');
      }
      resetForm();
      loadData();
    } catch (err: any) {
      showNotification(err.response?.data?.message || "Erreur lors de l'enregistrement.", 'error');
    }
  };

  const startEdit = (s: StaffMember) => {
    setIsEditing(true);
    setEditingId(s.id);
    setNomUtilisateur(s.nomUtilisateur);
    setRole(s.role);
    setMotDePasse(''); 
    setShowForm(true);
  };

  // ❌ Suppression avec déconnexion forcée intégrée
  const handleDelete = async (id: number, username: string) => {
    const isSelfDeletion = currentUserId === id;

    const confirmationMessage = isSelfDeletion
      ? `⚠️ ATTENTION : Vous allez supprimer VOTRE PROPRE COMPTE [${username}]. Vous serez déconnecté et redirigé immédiatement. Continuer ?`
      : `Supprimer définitivement le compte de [${username}] ?`;

    if (!window.confirm(confirmationMessage)) return;
    
    try {
      await api.delete(`/utilisateurs/${id}`);
      
      showNotification(`Le compte [${username}] a été supprimé de la base de données.`, 'success');
      
      // Auto-logout si l'utilisateur supprime sa propre session
      if (isSelfDeletion) {
        if (auth && typeof auth.logout === 'function') {
          auth.logout();
          return;
        }
      }

      if (editingId === id) resetForm();
      loadData();
    } catch (err: any) {
      console.error("Erreur de suppression:", err);
      showNotification(err.response?.data?.message || `Erreur ${err.response?.status} : Impossible de supprimer l'utilisateur.`, 'error');
    }
  };

  const handleCloseSession = async (userId: number, username: string) => {
    const sessionActive = activeSessions.find(session => session.utilisateurId === userId);
    
    if (!sessionActive) {
      showNotification(`Aucune session active trouvée pour [${username}].`, 'error');
      return;
    }

    if (!window.confirm(`Confirmer la clôture automatique de la session de poste de [${username}] ?`)) return;

    try {
      const response = await api.patch(`/sessions-poste/${sessionActive.id}/cloturer`);
      const montantCalcule = response.data?.caisseReelle ? `${Number(response.data.caisseReelle).toFixed(3)} DT` : '';
      
      showNotification(`La session de [${username}] a été clôturée automatiquement. Caisse finale : ${montantCalcule}`, 'success');
      loadData();
    } catch (err: any) {
      showNotification(err.response?.data?.message || "Erreur lors de la clôture automatique.", 'error');
    }
  };

  const renderRoleBadge = (userRole: string) => {
    const styles = {
      ADMIN: 'bg-red-50 text-red-700 border-red-200',
      GERANT: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      SERVEUR: 'bg-amber-50 text-amber-700 border-amber-200'
    };
    return (
      <span className={`text-[10px] font-black px-2.5 py-1 rounded-md border tracking-wide uppercase ${styles[userRole as keyof typeof styles] || styles.SERVEUR}`}>
        {userRole}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#D9CFC1] pb-5">
        <div>
          <h1 className="text-2xl font-serif font-black tracking-tight text-[#3E2723]">
            {currentUserRole === 'ADMIN' ? 'Gestion des Collaborateurs' : 'Équipe des Serveurs'}
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {currentUserRole === 'ADMIN' 
              ? 'Console globale d\'administration des accès (Admins, Gérants, Serveurs).' 
              : 'Gestion des comptes d\'accès et des sessions pour le personnel de salle.'}
          </p>
        </div>
        <button
          onClick={() => { if (showForm) resetForm(); setShowForm(!showForm); }}
          className="bg-[#B07A50] hover:bg-[#96633D] text-white px-4 py-2.5 rounded-lg font-bold shadow-sm transition text-sm self-start sm:self-center"
        >
          {showForm ? '✕ Fermer le volet' : currentUserRole === 'ADMIN' ? '👤 Nouveau Collaborateur' : '👤 Nouveau Serveur'}
        </button>
      </div>

      {msg && (
        <div className={`p-3.5 text-sm rounded-xl font-medium border transition-all shadow-2xs ${
          msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
        }`}>
          <span className="mr-1.5">{msg.type === 'success' ? '✓' : '⚠️'}</span> {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* ================= TABLEAU DU PERSONNEL ================= */}
        <div className="lg:col-span-2 bg-[#F4EFE6] rounded-xl border border-[#D9CFC1] p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-[#3E2723]">
            {currentUserRole === 'ADMIN' ? 'Registre Général du Personnel' : 'Liste du Personnel de Salle'}
          </h3>
          
          <div className="border border-[#D9CFC1] rounded-xl overflow-hidden bg-white shadow-2xs">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[#EBE4D8]/60 text-[#5D4037] font-bold text-xs uppercase tracking-wider border-b border-[#D9CFC1]">
                <tr>
                  <th className="p-3.5 w-16 text-center">ID</th>
                  <th className="p-3.5">Identifiant (Username)</th>
                  {currentUserRole === 'ADMIN' && <th className="p-3.5">Rôle</th>}
                  <th className="p-3.5 text-center w-32">Session</th>
                  <th className="p-3.5 text-right w-64">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE4D8]">
                {isLoading ? (
                  /* 🧱 SKELETON ANIMATION ROWS */
                  Array.from({ length: 3 }).map((_, idx) => (
                    <tr key={`staff-skel-${idx}`} className="animate-pulse bg-white">
                      <td className="p-3.5 text-center">
                        <div className="h-3.5 bg-[#EBE4D8]/70 rounded-md w-6 mx-auto"></div>
                      </td>
                      <td className="p-3.5">
                        <div className="h-7 bg-[#EBE4D8] rounded-lg w-28 my-0.5"></div>
                      </td>
                      {currentUserRole === 'ADMIN' && (
                        <td className="p-3.5">
                          <div className="h-5 bg-[#EBE4D8]/60 rounded-md w-16"></div>
                        </td>
                      )}
                      <td className="p-3.5 flex justify-center">
                        <div className="h-5 bg-[#EBE4D8]/80 rounded-full w-20 my-1"></div>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex gap-1.5 justify-end w-full">
                          <div className="h-7 bg-[#EBE4D8] rounded-lg w-20"></div>
                          <div className="h-7 bg-[#EBE4D8]/60 rounded-lg w-20"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : staff.length === 0 ? (
                  <tr>
                    <td colSpan={currentUserRole === 'ADMIN' ? 5 : 4} className="p-8 text-center italic text-stone-400 bg-white">
                      Aucun membre du personnel configuré dans la base de données.
                    </td>
                  </tr>
                ) : (
                  staff.map((s) => {
                    const hasActiveSession = activeSessions.some(session => session.utilisateurId === s.id);

                    return (
                      <tr key={s.id} className={`hover:bg-[#FAF8F5] transition duration-75 ${editingId === s.id ? 'bg-[#FAF2EB]' : ''}`}>
                        <td className="p-3.5 text-center font-mono font-bold text-stone-400">#{s.id}</td>
                        <td className="p-3.5 font-bold text-[#3E2723]">
                          <span className="font-mono text-xs text-[#B07A50] bg-[#FAF2EB] px-2.5 py-1.5 rounded-lg border border-[#EAD7C3]/40 font-bold">
                            {s.nomUtilisateur}
                          </span>
                        </td>
                        {currentUserRole === 'ADMIN' && (
                          <td className="p-3.5">{renderRoleBadge(s.role)}</td>
                        )}
                        <td className="p-3.5 text-center">
                          {s.role === 'SERVEUR' && hasActiveSession ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 animate-pulse uppercase tracking-wide">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              En Service
                            </span>
                          ) : s.role === 'SERVEUR' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-100 text-stone-500 uppercase tracking-wide">
                              Hors Ligne
                            </span>
                          ) : (
                            <span className="text-stone-300 text-xs italic">sans session</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          {s.role === 'SERVEUR' && hasActiveSession && (
                            <button
                              onClick={() => handleCloseSession(s.id, s.nomUtilisateur)}
                              className="text-xs bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 px-2.5 py-1.5 rounded-lg font-bold transition shadow-2xs"
                              title="Fermer la session de poste ouverte"
                            >
                              🔒 Clôture
                            </button>
                          )}

                          <button
                            onClick={() => startEdit(s)}
                            className="text-xs bg-white hover:bg-[#FAF2EB] border border-[#D9CFC1] text-[#3E2723] px-2.5 py-1.5 rounded-lg font-bold transition shadow-2xs"
                          >
                            ✏️ Modifier
                          </button>
                          
                          <button
                            onClick={() => handleDelete(s.id, s.nomUtilisateur)}
                            className="text-xs bg-transparent border border-red-100 hover:bg-red-50 text-red-600 px-2.5 py-1.5 rounded-lg font-bold transition"
                          >
                            🗑️ Supprimer
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

        {/* ================= FORMULAIRE DYNAMIQUE DE CONFIGURATION ================= */}
        {showForm && (
          <div className="bg-[#F4EFE6] rounded-xl border border-[#D9CFC1] p-5 shadow-sm space-y-4 lg:sticky lg:top-6">
            <h4 className="text-xs font-bold bg-[#3E2723] text-[#EAD7C3] px-3 py-1.5 rounded-lg tracking-wider uppercase">
              {isEditing ? 'Modifier le Compte' : 'Créer un Compte'}
            </h4>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5D4037] mb-1">
                  Nom d'utilisateur (Username)
                </label>
                <input
                  type="text"
                  required
                  value={nomUtilisateur}
                  onChange={(e) => setNomUtilisateur(e.target.value)}
                  className="w-full rounded-lg border border-[#D9CFC1] bg-white p-2.5 text-sm font-mono text-[#3E2723] font-bold focus:outline-none focus:border-[#B07A50] placeholder-stone-400"
                  placeholder="Ex: hamza_mistral"
                />
              </div>

              {/* Rôle sélectionnable uniquement pour les comptes ADMIN */}
              {currentUserRole === 'ADMIN' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5D4037] mb-1">
                    Rôle Système
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full rounded-lg border border-[#D9CFC1] bg-white p-2.5 text-sm font-bold text-[#3E2723] focus:outline-none focus:border-[#B07A50]"
                  >
                    <option value="SERVEUR">SERVEUR (Interface de Caisse / Tactile)</option>
                    <option value="GERANT">GÉRANT (Accès Dashboard & Back-office)</option>
                    <option value="ADMIN">ADMINISTRATEUR (Contrôle total)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5D4037] mb-1">
                  {isEditing ? 'Mot de passe (Optionnel)' : 'Mot de passe'}
                </label>
                <input
                  type="password"
                  required={!isEditing}
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  className="w-full rounded-lg border border-[#D9CFC1] bg-white p-2.5 text-sm text-[#3E2723] focus:outline-none focus:border-[#B07A50] placeholder-stone-400"
                  placeholder={isEditing ? 'Laisser vide si inchangé' : '••••••••'}
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#EBE4D8]">
                <button
                  type="submit"
                  className="flex-1 bg-[#1C120C] hover:bg-[#2D1F16] text-white p-2.5 text-sm rounded-lg font-bold shadow-md transition"
                >
                  {isEditing ? '💾 Sauvegarder' : '➕ Créer le compte'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-white hover:bg-stone-50 text-stone-600 border border-[#D9CFC1] px-4 text-sm rounded-lg font-semibold transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};