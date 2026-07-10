import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  BarChart3, 
  DollarSign, 
  FileText, 
  ShoppingCart, 
  Lock, 
  Trophy, 
  Users, 
  Wheat, 
  TrendingUp,
  FileSpreadsheet,
  FileDown,
  AlertTriangle
} from 'lucide-react';

interface MetricStats {
  chiffreAffaire: string;
  totalCommandes: string;
  panierMoyen: string;
  cloturesValidees: string;
}

interface TopProduct {
  nom: string;
  ventes: number;
  CA: string;
}

interface TopServer {
  nomUtilisateur: string;
  role: string;
  totalVentes: string;
  nombreCommandes: number;
}

interface IngredientDepletion {
  nomIngredient: string;
  quantiteEstimee: number;
  unite: string;
}

interface TimeDistribution {
  "06:00 - 09:59": number;
  "10:00 - 13:59": number;
  "14:00 - 17:59": number;
  "18:00 - 21:59": number;
  "22:00 - 05:59": number;
}

interface ComprehensiveReportData {
  stats: MetricStats;
  topProduits: TopProduct[];
  topServeurs: TopServer[];
  ingredientsImpact: IngredientDepletion[];
  repartitionHoraires?: TimeDistribution;
}

interface StatCardProps {
  title: string;
  value: string | React.ReactNode;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
}

export const Rapports: React.FC = () => {
  const [periode, setPeriode] = useState<'jour' | 'semaine' | 'mois'>('jour');
  const [activeTab, setActiveTab] = useState<'produits' | 'serveurs' | 'ingredients'>('produits');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [data, setData] = useState<ComprehensiveReportData>({
    stats: { chiffreAffaire: '0.000 DT', totalCommandes: '0', panierMoyen: '0.000 DT', cloturesValidees: '0/0' },
    topProduits: [],
    topServeurs: [],
    ingredientsImpact: [],
    repartitionHoraires: { 
      "06:00 - 09:59": 0, 
      "10:00 - 13:59": 0, 
      "14:00 - 17:59": 0, 
      "18:00 - 21:59": 0, 
      "22:00 - 05:59": 0 
    }
  });

  const fetchDetailedReportData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await api.get<ComprehensiveReportData>(`/analyses/rapport-complet?periode=${periode}`);
      setData(response.data);
    } catch (err: any) {
      console.error("Error loading deep analytical payload:", err);
      setErrorMsg("Échec du chargement des analyses avancées.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetailedReportData();
  }, [periode]);

  const handleExport = (type: 'pdf' | 'excel') => {
    if (isLoading) return;
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `Rapport_Premium_${periode.toUpperCase()}_${timestamp}`;

    if (type === 'excel') {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
        { "Indicateur": "Chiffre d'Affaires (CA)", "Valeur": data.stats.chiffreAffaire },
        { "Indicateur": "Commandes Traitées", "Valeur": data.stats.totalCommandes },
        { "Indicateur": "Commande Moyenne", "Valeur": data.stats.panierMoyen },
        { "Indicateur": "Sessions de Caisse", "Valeur": data.stats.cloturesValidees }
      ]), "Indicateurs Généraux");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.topProduits.map((p, idx) => ({
        "Rang": idx + 1, "Désignation Article": p.nom, "Unités Vendues": p.ventes, "Chiffre d'Affaires": p.CA
      }))), "Ventes Articles");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.topServeurs.map((s, idx) => ({
        "Classement": idx + 1, "Nom Serveur / Caissier": s.nomUtilisateur, "Rôle Équipe": s.role, "Commandes Saisies": s.nombreCommandes, "Chiffre Affaire Généré": s.totalVentes
      }))), "Performance Serveurs");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.ingredientsImpact.map(i => ({
        "Matière Première": i.nomIngredient, "Quantité Estimée Consommée": Number(i.quantiteEstimee.toFixed(2)), "Unité de Mesure": i.unite
      }))), "Estimation Sorties Stock");
      XLSX.writeFile(wb, `${fileName}.xlsx`);
    } else {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(62, 39, 35);
      doc.text("Rapport d'Activité Global & Détaillé", 14, 20);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`Analyse structurelle : ${periode.toUpperCase()} | Imprimé le : ${new Date().toLocaleString()}`, 14, 27);
      doc.line(14, 31, 196, 31);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(62, 39, 35);
      doc.text("1. Indicateurs Financiers Principaux", 14, 40);
      autoTable(doc, {
        startY: 44,
        head: [['Indicateur de Performance', 'Valeur Actuelle']],
        body: [
          ["Chiffre d'Affaires Brut", data.stats.chiffreAffaire],
          ['Volume Commandes Complétées', data.stats.totalCommandes],
          ['Commande Moyenne', data.stats.panierMoyen],
          ['Rapport Sessions (Fermées / Ouvertes)', data.stats.cloturesValidees],
        ],
        theme: 'striped',
        headStyles: { fillColor: [62, 39, 35] },
        styles: { font: "helvetica", fontSize: 10 }
      });
      let nextY = (doc as any).lastAutoTable.finalY + 12;
      doc.text("2. Performance de l'Équipe (Classement Serveurs)", 14, nextY);
      const serversBody = data.topServeurs.map((s, idx) => [`#${idx + 1}`, s.nomUtilisateur, s.role.toUpperCase(), `${s.nombreCommandes} fiches`, s.totalVentes]);
      autoTable(doc, {
        startY: nextY + 4,
        head: [['Rang', 'Collaborateur', 'Rôle', 'Commandes Traitées', 'Volume d\'Affaires']],
        body: serversBody.length > 0 ? serversBody : [['-', 'Aucune donnée disponible', '-', '-', '-']],
        theme: 'striped',
        headStyles: { fillColor: [93, 64, 55] },
        styles: { font: "helvetica", fontSize: 10 }
      });
      nextY = (doc as any).lastAutoTable.finalY + 12;
      doc.text("3. Palmarès de Rotation des Produits", 14, nextY);
      const productsBody = data.topProduits.map((p, idx) => [`#${idx + 1}`, p.nom, `${p.ventes} unités`, p.CA]);
      autoTable(doc, {
        startY: nextY + 4,
        head: [['Classement', 'Désignation de l\'Article', 'Quantité Vendue', 'Chiffre d\'Affaires']],
        body: productsBody.length > 0 ? productsBody : [['-', 'Aucune transaction enregistrée', '-', '-']],
        theme: 'striped',
        headStyles: { fillColor: [176, 122, 80] },
        styles: { font: "helvetica", fontSize: 10 }
      });
      nextY = (doc as any).lastAutoTable.finalY + 12;
      if (nextY > 230) { doc.addPage(); nextY = 20; }
      doc.text("4. Impact Estimé Ingrédients (Sorties Stock)", 14, nextY);
      const ingredientsBody = data.ingredientsImpact.map(i => [i.nomIngredient, `${i.quantiteEstimee.toFixed(2)} ${i.unite}`, 'Déduction théorique sur fiches techniques']);
      autoTable(doc, {
        startY: nextY + 4,
        head: [['Matière Première', 'Volume de Consommation Estimé', 'Méthode d\'Analyse']],
        body: ingredientsBody.length > 0 ? ingredientsBody : [['-', 'Aucun impact ingrédient calculé sur la période', '-']],
        theme: 'striped',
        headStyles: { fillColor: [120, 110, 99] },
        styles: { font: "helvetica", fontSize: 10 }
      });
      doc.save(`${fileName}.pdf`);
    }
  };

  const intervalKeys: Array<keyof TimeDistribution> = ["06:00 - 09:59", "10:00 - 13:59", "14:00 - 17:59", "18:00 - 21:59", "22:00 - 05:59"];
  const rawWeights = intervalKeys.map(key => data.repartitionHoraires?.[key] ?? 0);
  const maxRawWeight = Math.max(...rawWeights, 1);
  const barPercentages = rawWeights.map(w => w > 0 ? Math.max(8, (w / maxRawWeight) * 100) : 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#D9CFC1] pb-5">
        <div>
          <h1 className="text-2xl font-serif font-black tracking-tight text-[#3E2723] flex items-center gap-2">
            <BarChart3 className="w-7 h-7" /> Rapports & Analyses
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">Indicateurs croisés : Serveurs, Volumes de ventes, et affluence par tranche horaire réelle.</p>
        </div>
        <div className="flex bg-[#FAF7F2] border border-[#D9CFC1] rounded-lg p-1 self-start sm:self-center shadow-2xs">
          {(['jour', 'semaine', 'mois'] as const).map((p) => (
            <button key={p} onClick={() => setPeriode(p)} disabled={isLoading} className={`px-3.5 py-1.5 text-[11px] font-black rounded-md transition uppercase tracking-wider ${periode === p ? 'bg-[#B07A50] text-white shadow-xs' : 'text-[#5D4037] hover:bg-[#FAF2EB] disabled:opacity-50'}`}>
              {p === 'jour' ? "Aujourd'hui" : p === 'semaine' ? 'Semaine' : 'Mois'}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 text-sm rounded-xl border bg-red-50 border-red-200 text-red-900 shadow-2xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Chiffre d'Affaires (CA)" value={isLoading ? <div className="h-5 bg-[#EBE4D8] rounded-md w-24 animate-pulse mt-1" /> : data.stats.chiffreAffaire} change="Flux synchronisé" isPositive={true} icon={<DollarSign className="w-5 h-5 text-[#3E2723]" />} />
        <StatCard title="Commandes Traitées" value={isLoading ? <div className="h-5 bg-[#EBE4D8] rounded-md w-12 animate-pulse mt-1" /> : data.stats.totalCommandes} change="Statut Complété" isPositive={true} icon={<FileText className="w-5 h-5 text-[#3E2723]" />} />
        <StatCard title="Commande Moyenne" value={isLoading ? <div className="h-5 bg-[#EBE4D8] rounded-md w-24 animate-pulse mt-1" /> : data.stats.panierMoyen} change="Valeur unitaire moyenne" isPositive={true} icon={<ShoppingCart className="w-5 h-5 text-[#3E2723]" />} />
        <StatCard title="Sessions de Caisse" value={isLoading ? <div className="h-5 bg-[#EBE4D8] rounded-md w-16 animate-pulse mt-1" /> : data.stats.cloturesValidees} change="Clôtures d'activité" isPositive={true} icon={<Lock className="w-5 h-5 text-[#3E2723]" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 bg-[#F4EFE6] rounded-xl border border-[#D9CFC1] p-5 shadow-sm space-y-4">
          <div className="flex border-b border-[#D9CFC1] gap-3">
            <button onClick={() => setActiveTab('produits')} className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 ${activeTab === 'produits' ? 'border-[#B07A50] text-[#B07A50]' : 'border-transparent text-stone-400 hover:text-stone-600'}`}>
              <Trophy className="w-3.5 h-3.5" /> Top Articles
            </button>
            <button onClick={() => setActiveTab('serveurs')} className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 ${activeTab === 'serveurs' ? 'border-[#B07A50] text-[#B07A50]' : 'border-transparent text-stone-400 hover:text-stone-600'}`}>
              <Users className="w-3.5 h-3.5" /> Classement Serveurs
            </button>
            <button onClick={() => setActiveTab('ingredients')} className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 ${activeTab === 'ingredients' ? 'border-[#B07A50] text-[#B07A50]' : 'border-transparent text-stone-400 hover:text-stone-600'}`}>
              <Wheat className="w-3.5 h-3.5" /> Impact Ingrédients
            </button>
          </div>
          <div className="pt-1 bg-white rounded-xl border border-[#D9CFC1] p-4 shadow-2xs">
            {isLoading ? (
              <div className="divide-y divide-[#EBE4D8]">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={`tab-skel-${idx}`} className="py-3 flex justify-between items-center first:pt-0 last:pb-0 animate-pulse">
                    <div className="flex items-center gap-3"><div className="w-6 h-6 bg-[#FAF2EB] rounded-lg border border-[#EBE4D8]" /><div className="space-y-1.5"><div className="h-3 bg-stone-200 rounded w-32" /><div className="h-2.5 bg-stone-100 rounded w-20" /></div></div><div className="h-3 bg-stone-200 rounded w-16" />
                  </div>
                ))}
              </div>
            ) : activeTab === 'produits' ? (
              <div className="divide-y divide-[#EBE4D8]">
                {data.topProduits.length === 0 ? <p className="text-xs text-center text-stone-400 py-6">Aucun article enregistré.</p> : data.topProduits.map((prod, idx) => (
                  <div key={idx} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3"><span className="w-6 h-6 flex items-center justify-center bg-[#FAF2EB] text-[#B07A50] text-xs font-black rounded-lg border border-[#EAD7C3]/50">{idx + 1}</span><div><p className="text-xs font-bold text-[#3E2723]">{prod.nom}</p><p className="text-[10px] text-stone-400">{prod.ventes} unités vendues</p></div></div><p className="text-xs font-black text-[#5D4037] font-mono">{prod.CA}</p>
                  </div>
                ))}
              </div>
            ) : activeTab === 'serveurs' ? (
              <div className="divide-y divide-[#EBE4D8]">
                {data.topServeurs.length === 0 ? <p className="text-xs text-center text-stone-400 py-6">Aucune commande liée à un serveur.</p> : data.topServeurs.map((serv, idx) => (
                  <div key={idx} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3"><span className="w-6 h-6 flex items-center justify-center bg-stone-100 text-stone-600 text-xs font-black rounded-lg border border-stone-200">{idx + 1}</span><div><p className="text-xs font-bold text-[#3E2723]">{serv.nomUtilisateur} <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 bg-amber-100 rounded-md text-amber-800 border border-amber-200/50">{serv.role}</span></p><p className="text-[10px] text-stone-400">{serv.nombreCommandes} fiches enregistrées</p></div></div><p className="text-xs font-black text-emerald-700 font-mono">+{serv.totalVentes}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-[#EBE4D8]">
                {data.ingredientsImpact.length === 0 ? <p className="text-xs text-center text-stone-400 py-6">Aucun impact ingrédient calculé.</p> : data.ingredientsImpact.map((ing, idx) => (
                  <div key={idx} className="py-3 flex justify-between items-center first:pt-0 last:pb-0"><div><p className="text-xs font-bold text-[#3E2723]">{ing.nomIngredient}</p><p className="text-[10px] text-stone-400">Consommation théorique</p></div><p className="text-xs font-bold text-red-700 font-mono">-{ing.quantiteEstimee.toFixed(2)} {ing.unite}</p></div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="bg-[#F4EFE6] rounded-xl border border-[#D9CFC1] p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#3E2723]">Densité d'Affluence Réelle</h3>
          <div className="bg-white border border-[#D9CFC1] rounded-xl p-4 shadow-2xs space-y-4">
            <div className="h-32 flex items-end justify-between gap-2 pt-4 px-1 border-b border-[#EBE4D8]">
              {isLoading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="w-full bg-stone-100 animate-pulse rounded-t-md h-8" />) : barPercentages.map((heightPct, i) => (
                <div key={i} style={{ height: `${heightPct}%` }} className="w-full bg-[#EAD7C3] hover:bg-[#B07A50] rounded-t-md transition-all relative group cursor-pointer"><span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-stone-800 text-white px-1.5 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity z-10">{rawWeights[i]} cmd</span></div>
              ))}
            </div>
            <div className="flex justify-between text-[8px] font-black text-stone-400 font-mono tracking-tighter text-center">
              <span className="w-full">06h-10h</span><span className="w-full">10h-14h</span><span className="w-full">14h-18h</span><span className="w-full">18h-22h</span><span className="w-full">22h-06h</span>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[#F4EFE6] border border-[#D9CFC1] rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div><h4 className="text-sm font-bold text-[#3E2723]">Audits Légaux Rapprochements Avancés</h4><p className="text-xs text-stone-500 mt-0.5">Les documents générés contiennent le palmarès complet, les serveurs et l'état des sorties de stock.</p></div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => handleExport('excel')} disabled={isLoading} className="flex items-center gap-2 flex-1 md:flex-none text-xs bg-white hover:bg-stone-50 border border-[#D9CFC1] text-[#3E2723] px-4 py-2.5 rounded-lg font-bold transition shadow-2xs disabled:opacity-50"><FileSpreadsheet className="w-3.5 h-3.5" /> Excel Complet</button>
          <button onClick={() => handleExport('pdf')} disabled={isLoading} className="flex items-center gap-2 flex-1 md:flex-none text-xs bg-[#3E2723] hover:bg-[#2D1F16] text-white px-4 py-2.5 rounded-lg font-bold transition shadow-md disabled:opacity-50"><FileDown className="w-3.5 h-3.5" /> Imprimer Bilan PDF</button>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon }) => (
  <div className="bg-[#F4EFE6] rounded-xl border border-[#D9CFC1] p-4 flex items-start justify-between shadow-sm">
    <div className="space-y-1 w-full">
      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{title}</p>
      <div className="text-xl font-black text-[#3E2723] font-mono tracking-tight">{value}</div>
      <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5 pt-0.5"><TrendingUp className="w-3 h-3" /> <span className="font-sans text-stone-500 font-medium">{change}</span></p>
    </div>
    <div className="bg-white w-9 h-9 rounded-lg border border-[#D9CFC1] flex items-center justify-center shadow-2xs flex-shrink-0 ml-2">{icon}</div>
  </div>
);