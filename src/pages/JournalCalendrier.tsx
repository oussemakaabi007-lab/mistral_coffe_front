import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Receipt, 
  Settings, 
  FileSpreadsheet, 
  FileText 
} from 'lucide-react';

interface DailyVente {
  id: number;
  heure: string;
  serveur: string;
  montant: string;
  statut: string;
  details: string;
}

interface DailyLog {
  id: number;
  heure: string;
  action: string;
  description: string;
  utilisateur: string;
}

interface DailySessionSummary {
  utilisateur: string;
  totalRevenue: string;
}

interface JournalPayload {
  ventes: DailyVente[];
  logs: DailyLog[];
  sessions?: DailySessionSummary[];
}

export const JournalCalendrier: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [journalData, setJournalData] = useState<JournalPayload>({ ventes: [], logs: [], sessions: [] });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'ventes' | 'logs'>('ventes');

  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchDailyJournal = async (date: Date) => {
    setIsLoading(true);
    try {
      const targetDateStr = formatDateString(date);
      const res = await api.get<JournalPayload>(`/analyses/journal-quotidien?date=${targetDateStr}`);
      setJournalData(res.data);
    } catch (err) {
      console.error("Error fetching daily logs grid payload:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyJournal(selectedDate);
  }, [selectedDate]);

  const getSessionSummaries = (): DailySessionSummary[] => {
    if (journalData.sessions && journalData.sessions.length > 0) {
      return journalData.sessions;
    }

    const revenueMap: Record<string, number> = {};
    journalData.ventes.forEach((v) => {
      if (v.statut === 'COMPLETED') {
        const numericValue = parseFloat(v.montant.replace(/[^\d.]/g, '')) || 0;
        revenueMap[v.serveur] = (revenueMap[v.serveur] || 0) + numericValue;
      }
    });

    return Object.entries(revenueMap).map(([utilisateur, total]) => ({
      utilisateur,
      totalRevenue: `${total.toFixed(3)} DT`
    }));
  };

  const sessionSummaries = getSessionSummaries();

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: Date[] = [];
    
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;
    
    for (let i = startDayOfWeek; i > 0; i--) {
      days.push(new Date(year, month, 1 - i));
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const offset = direction === 'prev' ? -1 : 1;
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    if (isLoading) return;

    const dateTargetStr = formatDateString(selectedDate);
    const contextName = activeTab === 'ventes' ? 'Ventes' : 'Logs';
    const fileName = `Journal_${contextName}_${dateTargetStr}`;

    if (type === 'excel') {
      const wb = XLSX.utils.book_new();

      if (activeTab === 'ventes') {
        const ventesRows = journalData.ventes.map((v) => ({
          "Heure": v.heure,
          "Détails Commande": v.details || 'Commande vide',
          "Serveur / Caissier": v.serveur,
          "Montant": v.montant,
          "Statut Validation": v.statut,
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ventesRows), "Ventes Encaissées");
      } else {
        const logsRows = journalData.logs.map((l) => ({
          "Heure": l.heure,
          "Type Action": l.action,
          "Opérateur / Utilisateur": l.utilisateur,
          "Description Log": l.description,
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(logsRows), "Logs Journal Système");
      }

      const sessionRows = sessionSummaries.map(s => ({
        "Collaborateur / Session": s.utilisateur,
        "Chiffre d'Affaires Réalisé": s.totalRevenue
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sessionRows), "CA par Session");

      XLSX.writeFile(wb, `${fileName}.xlsx`);
    } else {
      const doc = new jsPDF();
      const dateFormatee = selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(62, 39, 35);
      doc.text(`Journal d'Audit de Caisse : Extrait ${contextName}`, 14, 20);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`Date ciblée : ${dateFormatee} | Extraction : ${new Date().toLocaleString()}`, 14, 27);
      doc.line(14, 31, 196, 31);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(62, 39, 35);
      doc.text("Rendement Financier des Sessions Actives", 14, 39);

      const sessionBody = sessionSummaries.map(s => [s.utilisateur, s.totalRevenue]);
      autoTable(doc, {
        startY: 43,
        head: [['Collaborateur / Session', 'Recettes Totales Encaissées (COMPLETED)']],
        body: sessionBody.length > 0 ? sessionBody : [['Aucun utilisateur actif', '0.000 DT']],
        theme: 'plain',
        styles: { font: "helvetica", fontSize: 9 },
        headStyles: { fontStyle: 'bold', textColor: [110, 80, 60] }
      });

      let nextY = (doc as any).lastAutoTable.finalY + 10;

      if (activeTab === 'ventes') {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Registre Isolé des Ventes Enregistrées", 14, nextY);

        const ventesBody = journalData.ventes.map((v) => [
          v.heure,
          v.details || 'Commande vide',
          v.serveur,
          v.montant,
          v.statut,
        ]);

        autoTable(doc, {
          startY: nextY + 4,
          head: [['Heure', 'Détails Commande', 'Serveur / Caissier', 'Montant', 'Statut']],
          body: ventesBody.length > 0 ? ventesBody : [['-', 'Aucune transaction enregistrée', '-', '-', '-']],
          theme: 'striped',
          headStyles: { fillColor: [62, 39, 35] },
          styles: { font: "helvetica", fontSize: 9 }
        });
      } else {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Registre Isolé des Actions Système (Logs)", 14, nextY);

        const logsBody = journalData.logs.map((l) => [
          l.heure,
          l.action.toUpperCase(),
          l.utilisateur,
          l.description,
        ]);

        autoTable(doc, {
          startY: nextY + 4,
          head: [['Heure', 'Action Structure', 'Utilisateur', 'Description de l\'Événement']],
          body: logsBody.length > 0 ? logsBody : [['-', 'Aucun log ou anomalie rapportée', '-', '-']],
          theme: 'striped',
          headStyles: { fillColor: [120, 110, 99] },
          styles: { font: "helvetica", fontSize: 9 },
          columnStyles: { 3: { cellWidth: 90 } }
        });
      }

      doc.save(`${fileName}.pdf`);
    }
  };

  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const daysGrid = getDaysInMonth(currentMonth);
  const currentTabCount = activeTab === 'ventes' ? journalData.ventes.length : journalData.logs.length;

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D9CFC1] pb-5">
        <h1 className="text-2xl font-serif font-black tracking-tight text-[#3E2723] flex items-center gap-2">
          <CalendarDays className="text-[#B07A50]" /> Historique & Journaux de Caisse
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">Sélectionnez une date pour auditer le détail complet des ventes et actions système.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        <div className="bg-[#F4EFE6] rounded-xl border border-[#D9CFC1] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#D9CFC1] pb-3">
            <h3 className="text-xs font-black text-[#3E2723] uppercase font-mono tracking-wider">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <div className="flex gap-1.5">
              <button onClick={() => changeMonth('prev')} className="w-8 h-8 flex items-center justify-center bg-white border border-[#D9CFC1] hover:bg-[#FAF2EB] rounded-lg text-xs transition font-bold text-[#3E2723] shadow-2xs">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => changeMonth('next')} className="w-8 h-8 flex items-center justify-center bg-white border border-[#D9CFC1] hover:bg-[#FAF2EB] rounded-lg text-xs transition font-bold text-[#3E2723] shadow-2xs">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            <span>Lun</span><span>Mar</span><span>Mer</span><span>Jeu</span><span>Ven</span><span>Sam</span><span>Dim</span>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {daysGrid.map((day, idx) => {
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isSelected = formatDateString(day) === formatDateString(selectedDate);
              const isToday = formatDateString(day) === formatDateString(new Date());

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`h-11 rounded-lg text-xs font-bold flex flex-col items-center justify-center relative transition-all border ${
                    !isCurrentMonth ? 'text-stone-300 border-transparent opacity-30' : 'text-[#3E2723]'
                  } ${
                    isSelected 
                      ? 'bg-[#B07A50] text-white border-[#B07A50] shadow-xs scale-105 z-10' 
                      : 'bg-white hover:bg-[#FAF2EB] border-[#D9CFC1]/40 shadow-2xs'
                  }`}
                >
                  <span>{day.getDate()}</span>
                  {isToday && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B07A50] absolute bottom-1"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 bg-[#F4EFE6] rounded-xl border border-[#D9CFC1] p-5 shadow-sm min-h-[440px] flex flex-col justify-between gap-4">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#D9CFC1] pb-3 gap-3">
              <div>
                <h3 className="text-xs font-black text-[#3E2723] uppercase tracking-wider">
                  Journée du {selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </h3>
                <p className="text-[10px] text-stone-400 font-bold mt-0.5 font-mono uppercase tracking-wider">Target: {formatDateString(selectedDate)}</p>
              </div>

              <div className="flex bg-[#FAF7F2] border border-[#D9CFC1] rounded-lg p-1 self-start shadow-2xs">
                <button
                  onClick={() => setActiveTab('ventes')}
                  className={`px-3 py-1.5 text-[11px] font-black rounded-md transition uppercase tracking-wider flex items-center gap-1.5 ${
                    activeTab === 'ventes' ? 'bg-[#3E2723] text-white' : 'text-[#5D4037] hover:bg-[#FAF2EB]'
                  }`}
                >
                  <Receipt size={14} /> Ventes ({isLoading ? '..' : journalData.ventes.length})
                </button>
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`px-3 py-1.5 text-[11px] font-black rounded-md transition uppercase tracking-wider flex items-center gap-1.5 ${
                    activeTab === 'logs' ? 'bg-[#3E2723] text-white' : 'text-[#5D4037] hover:bg-[#FAF2EB]'
                  }`}
                >
                  <Settings size={14} /> Logs ({isLoading ? '..' : journalData.logs.length})
                </button>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-stone-400 mb-2 font-mono">Sessions Actives & Chiffre d'Affaires</h4>
              {isLoading ? (
                <div className="h-10 bg-white/60 animate-pulse rounded-xl border border-[#D9CFC1]" />
              ) : sessionSummaries.length === 0 ? (
                <div className="text-[11px] text-stone-400 italic bg-white/40 border border-[#D9CFC1]/60 px-3 py-2 rounded-lg">
                  Aucun encaissement ou session active détectée pour cette journée.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {sessionSummaries.map((session, index) => (
                    <div 
                      key={index} 
                      className="bg-white border border-[#D9CFC1] rounded-lg px-3 py-1.5 shadow-2xs flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <div className="text-[11px]">
                        <span className="font-bold text-[#3E2723]">{session.utilisateur} : </span>
                        <span className="font-mono font-black text-[#B07A50]">{session.totalRevenue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="overflow-y-auto mt-4 max-h-[300px] pr-1 space-y-3">
              {isLoading ? (
                <div className="bg-white rounded-xl border border-[#D9CFC1] p-2 divide-y divide-[#EBE4D8] shadow-2xs">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={`journal-skel-${idx}`} className="p-3 flex items-start justify-between gap-4 first:pt-2 last:pb-2 animate-pulse">
                      <div className="space-y-2 w-2/3">
                        <div className="flex items-center gap-2">
                          <div className="h-4 bg-stone-200 rounded w-12" />
                          <div className="h-4 bg-stone-200 rounded w-44" />
                        </div>
                        <div className="h-3 bg-stone-100 rounded w-28" />
                      </div>
                      <div className="space-y-1.5 text-right w-16 flex flex-col items-end">
                        <div className="h-3 bg-stone-200 rounded w-12" />
                        <div className="h-3 bg-stone-100 rounded w-14" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeTab === 'ventes' ? (
                journalData.ventes.length === 0 ? (
                  <p className="text-xs italic text-stone-400 text-center py-12 bg-white rounded-xl border border-[#D9CFC1]">Aucune vente enregistrée pour cette journée.</p>
                ) : (
                  <div className="bg-white rounded-xl border border-[#D9CFC1] p-2 divide-y divide-[#EBE4D8] shadow-2xs">
                    {journalData.ventes.map((v) => (
                      <div key={v.id} className="p-3 flex items-start justify-between gap-4 first:pt-2 last:pb-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono font-black bg-[#EAD7C3] text-[#3E2723] px-1.5 py-0.5 rounded border border-[#D9CFC1]/40 uppercase tracking-wide">{v.heure}</span>
                            <span className="text-xs font-bold text-[#3E2723]">{v.details || 'Commande vide'}</span>
                          </div>
                          <p className="text-[10px] text-stone-400 font-semibold">Encaissé par : <span className="text-stone-600 font-bold">{v.serveur}</span></p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-xs font-black text-[#5D4037] font-mono">{v.montant}</p>
                          <span className={`inline-block text-[9px] font-black font-mono px-1.5 py-0.5 rounded-md uppercase border ${
                            v.statut === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                          }`}>{v.statut}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                journalData.logs.length === 0 ? (
                  <p className="text-xs italic text-stone-400 text-center py-12 bg-white rounded-xl border border-[#D9CFC1]">Aucune action ou anomalie enregistrée au journal log.</p>
                ) : (
                  <div className="bg-white rounded-xl border border-[#D9CFC1] p-2 divide-y divide-[#EBE4D8] shadow-2xs">
                    {journalData.logs.map((l) => (
                      <div key={l.id} className="p-3 space-y-1 first:pt-2 last:pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-stone-400">{l.heure}</span>
                            <h4 className="text-xs font-black text-[#3E2723] uppercase tracking-wide">{l.action}</h4>
                          </div>
                          <span className="text-[9px] font-black text-stone-500 bg-stone-50 px-2 py-0.5 rounded-md border border-stone-200/60 font-mono">{l.utilisateur}</span>
                        </div>
                        <p className="text-xs text-stone-500 leading-relaxed pl-1">{l.description}</p>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#D9CFC1] flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border-dashed border-[#D9CFC1] shadow-2xs">
            <span className="text-[10px] uppercase font-black tracking-wider text-stone-400">
              Extraire l'audit ({activeTab === 'ventes' ? 'Ventes Seules' : 'Logs Seuls'})
            </span>
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={() => handleExport('excel')} 
                disabled={isLoading || currentTabCount === 0}
                className="flex-1 sm:flex-none text-xs bg-white hover:bg-[#FAF2EB] border border-[#D9CFC1] text-[#3E2723] px-3 py-2 rounded-lg font-bold transition disabled:opacity-40 shadow-2xs flex items-center justify-center gap-1.5"
              >
                <FileSpreadsheet size={14} /> Excel Exclusif
              </button>
              <button 
                onClick={() => handleExport('pdf')} 
                disabled={isLoading || currentTabCount === 0}
                className="flex-1 sm:flex-none text-xs bg-[#3E2723] hover:bg-[#2D1F16] text-white px-3 py-2 rounded-lg font-bold transition disabled:opacity-40 shadow-xs flex items-center justify-center gap-1.5"
              >
                <FileText size={14} /> Imprimer PDF
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};