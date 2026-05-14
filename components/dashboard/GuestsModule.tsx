"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Trash2, Edit2, UserPlus, Users, Baby, UserCheck, FileText, Download, FileSpreadsheet, Upload, Loader2, ChevronDown, CheckCircle2, X } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface Guest {
  id: string;
  name: string;
  category: string;
  gender: string;
  side: string;
  status: string;
  group_id?: string;
  dietary_notes?: string;
}

interface GuestsModuleProps {
  guests: Guest[];
  setGuests: (guests: Guest[]) => void;
  invitationId: string;
  groomName: string;
  brideName: string;
  canEdit: boolean;
}

const suggestGender = (name: string) => {
  const first = name.trim().split(' ')[0].toLowerCase();
  if (!first) return 'masculino';
  const femaleEndings = ['a', 'ia', 'is', 'iz', 'ne', 'me'];
  if (femaleEndings.some(end => first.endsWith(end)) || ['maria', 'alice', 'beatriz', 'matilde', 'ana'].includes(first)) return 'feminino';
  return 'masculino';
};

const COLUMN_LABELS: Record<string, string> = {
  name: 'Convidado',
  group_id: 'Grupo',
  gender: 'Sexo',
  category: 'Idade',
  side: 'Lado / Tag',
  dietary_notes: 'Restrições',
  status: 'Estado'
};

export default function GuestsModule({ guests, setGuests, invitationId, groomName, brideName, canEdit }: GuestsModuleProps) {
  const [groupTag, setGroupTag] = useState("");
  const [newMembers, setNewMembers] = useState([{ name: "", category: "adult", gender: "masculino", side: "comum", dietary_notes: "" }]);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Guest, direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  
  const [customSides, setCustomSides] = useState<string[]>(["comum", "noiva", "noivo"]);
  const [newSideLabel, setNewSideLabel] = useState("");

  // Sistema de Tags de Restrições Alimentares
  const [dietaryTags, setDietaryTags] = useState<string[]>(["Vegan", "Vegetariano"]);
  const [newDietaryTag, setNewDietaryTag] = useState("");

  const [isImporting, setIsImporting] = useState(false);
  const [isPdfMenuOpen, setIsPdfMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extrair tags únicas já existentes na base de dados para garantir que não se perdem
  useEffect(() => {
    const extractedTags = new Set(["Vegan", "Vegetariano"]);
    guests.forEach(g => {
      if (g.dietary_notes) {
        g.dietary_notes.split(',').forEach(t => extractedTags.add(t.trim()));
      }
    });
    setDietaryTags(Array.from(extractedTags).filter(Boolean));
  }, [guests]);

  const stats = useMemo(() => {
    const getSubStats = (cat: string) => {
      const filtered = guests.filter(g => g.category === cat && g.status !== 'declined');
      return {
        confirmed: filtered.filter(g => g.status === 'confirmed').length,
        pending: filtered.filter(g => g.status === 'pending').length,
        total: filtered.length
      };
    };

    const getGenderStats = (cat: string, gender: string) => {
      const filtered = guests.filter(g => g.category === cat && g.gender === gender && g.status !== 'declined');
      return {
        confirmed: filtered.filter(g => g.status === 'confirmed').length,
        pending: filtered.filter(g => g.status === 'pending').length
      };
    };

    return {
      rsvp: {
        total: guests.length,
        active: guests.filter(g => g.status !== 'declined').length,
        confirmed: guests.filter(g => g.status === 'confirmed').length,
        pending: guests.filter(g => g.status === 'pending').length,
        declined: guests.filter(g => g.status === 'declined').length
      },
      adults: getSubStats('adult'),
      children: getSubStats('child'),
      babies: getSubStats('baby'),
      adultsM: getGenderStats('adult', 'masculino'),
      adultsF: getGenderStats('adult', 'feminino'),
      childrenM: getGenderStats('child', 'masculino'),
      childrenF: getGenderStats('child', 'feminino'),
      babiesM: getGenderStats('baby', 'masculino'),
      babiesF: getGenderStats('baby', 'feminino'),
      sides: guests.reduce((acc, g) => {
        if (g.status !== 'declined') {
          if (!acc[g.side]) acc[g.side] = { total: 0, confirmed: 0, pending: 0 };
          acc[g.side].total++;
          if (g.status === 'confirmed') acc[g.side].confirmed++;
          if (g.status === 'pending') acc[g.side].pending++;
        }
        return acc;
      }, {} as Record<string, { total: number, confirmed: number, pending: number }>),
      // Estatísticas de Restrições Alimentares
      dietary: guests.reduce((acc, g) => {
        if (g.status !== 'declined' && g.dietary_notes) {
          g.dietary_notes.split(',').filter(Boolean).forEach(tag => {
            const cleanTag = tag.trim();
            if (!acc[cleanTag]) acc[cleanTag] = 0;
            acc[cleanTag]++;
          });
        }
        return acc;
      }, {} as Record<string, number>)
    };
  }, [guests]);

  const sortedGuests = useMemo(() => {
    let items = [...guests];
    items.sort((a, b) => {
      const aV = String(a[sortConfig.key] || "").toLowerCase();
      const bV = String(b[sortConfig.key] || "").toLowerCase();
      return sortConfig.direction === 'asc' ? aV.localeCompare(bV) : bV.localeCompare(aV);
    });
    return items;
  }, [guests, sortConfig]);

  // --- FUNÇÕES DE EXPORTAÇÃO ---
  const exportToPDF = async (type: 'confirmed' | 'confirmed_pending' | 'all') => {
    const doc = new jsPDF();
    const websiteUrl = "https://digitalinvitestudio.com";

    let list = guests;
    let label = "Lista Total";
    
    if (type === 'confirmed') {
      list = guests.filter(g => g.status === 'confirmed');
      label = "Apenas Confirmados";
    } else if (type === 'confirmed_pending') {
      list = guests.filter(g => g.status === 'confirmed' || g.status === 'pending');
      label = "Confirmados e Pendentes";
    } else {
      list = guests.filter(g => g.status !== 'declined');
      label = "Lista Total Ativa";
    }
    
    let contentY = 32;

    try {
      const logoImg = new window.Image();
      logoImg.src = "/logo-dis.png";
      
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
      });

      const logoWidth = 40; 
      const logoHeight = logoWidth * (logoImg.height / logoImg.width);
      
      doc.addImage(logoImg, "PNG", 14, 10, logoWidth, logoHeight);
      doc.link(14, 10, logoWidth, logoHeight, { url: websiteUrl });

      contentY = 10 + logoHeight + 12;
    } catch (e) {
      doc.setFontSize(16);
      doc.setTextColor(99, 1, 0); 
      doc.setFont("helvetica", "bold");
      doc.text("DIGITAL INVITE STUDIO", 14, 20);
      doc.link(14, 14, 70, 8, { url: websiteUrl }); 
      doc.setFont("helvetica", "normal");
      contentY = 35;
    }

    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text(`Lista de Convidados: ${label}`, 14, contentY);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`${brideName} & ${groomName} | Gerado em: ${new Date().toLocaleDateString()} | Total: ${list.length} pessoas`, 14, contentY + 6);

    const tableData: string[][] = list.map(g => [
      g.name ? String(g.name) : "-", 
      g.group_id && !g.group_id.includes('SOLO-') ? String(g.group_id) : "-", 
      g.category === 'adult' ? 'Adulto' : g.category === 'child' ? 'Criança' : 'Bebé',
      g.side === 'noiva' ? String(brideName) : g.side === 'noivo' ? String(groomName) : (g.side ? String(g.side) : "-"),
      g.dietary_notes || "-", 
      g.status === 'confirmed' ? 'Confirmado' : g.status === 'declined' ? 'Recusado' : 'Pendente'
    ]);

    autoTable(doc, {
      startY: contentY + 12,
      head: [['Nome', 'Grupo', 'Idade', 'Lado', 'Restrições', 'Estado']],
      body: tableData,
      headStyles: { fillColor: [99, 1, 0], textColor: [239, 223, 187] },
      alternateRowStyles: { fillColor: [253, 251, 247] },
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 3 }
    });

    doc.save(`lista_convidados_${invitationId.slice(0,5)}.pdf`);
    setIsPdfMenuOpen(false);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(guests.map(g => ({
      Nome: g.name,
      Grupo: g.group_id?.includes('SOLO-') ? '-' : g.group_id,
      Idade: g.category === 'adult' ? 'Adulto' : g.category === 'child' ? 'Criança' : 'Bebé',
      Sexo: g.gender === 'masculino' ? 'Masculino' : 'Feminino',
      Lado: g.side === 'noiva' ? brideName : g.side === 'noivo' ? groomName : g.side,
      Restrições: g.dietary_notes || "-",
      Estado: g.status === 'confirmed' ? 'Confirmado' : g.status === 'declined' ? 'Recusado' : 'Pendente'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Convidados");
    XLSX.writeFile(wb, `lista_convidados_${invitationId.slice(0,5)}.xlsx`);
  };

  const downloadTemplate = () => {
    const data = [
      ["Nome", "Grupo", "Idade (adulto/crianca/bebe)", "Sexo (masculino/feminino)", "Lado (comum/noivo/noiva)", "Restricoes"],
      ["Exemplo Convidado", "Família Exemplo", "adulto", "feminino", "noiva", "Vegan, Sem Glúten"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo");
    XLSX.writeFile(wb, "modelo_importacao_convidados.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canEdit) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const toInsert = data.map(row => ({
          invitation_id: invitationId,
          name: row["Nome"] || "Sem Nome",
          group_id: row["Grupo"] || `SOLO-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          category: row["Idade (adulto/crianca/bebe)"] === 'bebe' ? 'baby' : row["Idade (adulto/crianca/bebe)"] === 'crianca' ? 'child' : 'adult',
          gender: row["Sexo (masculino/feminino)"] || suggestGender(row["Nome"] || ""),
          side: row["Lado (comum/noivo/noiva)"] || "comum",
          dietary_notes: row["Restricoes"] || "",
          status: 'pending'
        }));

        const { data: inserted, error } = await supabase.from("guests").insert(toInsert).select();
        if (!error && inserted) {
          setGuests([...guests, ...inserted]);
          alert(`${inserted.length} convidados importados com sucesso!`);
        } else {
          alert("Erro ao inserir na base de dados.");
        }
      } catch (err) {
        alert("Erro ao ler o ficheiro. Verifique se o formato está correto de acordo com o modelo.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const validMembers = newMembers.filter(m => m.name.trim() !== "");
    if (validMembers.length === 0) return;

    const toInsert = validMembers.map(m => ({
      invitation_id: invitationId,
      group_id: groupTag.trim() || `SOLO-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      name: m.name,
      category: m.category,
      gender: m.gender,
      side: m.side,
      dietary_notes: m.dietary_notes, 
      status: 'pending'
    }));

    const { data, error } = await supabase.from("guests").insert(toInsert).select();
    if (!error && data) {
      setGuests([...guests, ...data]);
      setGroupTag("");
      setNewMembers([{ name: "", category: "adult", gender: "masculino", side: "comum", dietary_notes: "" }]);
    }
  };

  const handleDeleteGuest = async (id: string) => {
    if (!canEdit || !confirm("Tem a certeza que deseja eliminar este convidado?")) return;
    const { error } = await supabase.from("guests").delete().eq("id", id);
    if (!error) {
      setGuests(guests.filter(g => g.id !== id));
      setEditingGuest(null);
    } else {
      alert("Erro ao apagar convidado.");
    }
  };

  const handleAddSide = () => {
    if (!canEdit) return;
    const formatted = newSideLabel.trim().toLowerCase();
    if (formatted && !customSides.includes(formatted)) {
      setCustomSides([...customSides, formatted]);
      setNewSideLabel("");
    }
  };

  const handleAddDietaryTag = () => {
    if (!canEdit) return;
    const formatted = newDietaryTag.trim();
    if (formatted && !dietaryTags.includes(formatted)) {
      setDietaryTags([...dietaryTags, formatted]);
      setNewDietaryTag("");
    }
  };

  const handleRemoveDietaryTag = (tagToRemove: string) => {
    if (!canEdit) return;
    setDietaryTags(dietaryTags.filter(t => t !== tagToRemove));
  };

  const inputClass = "w-full bg-transparent border-0 border-b border-gray-200 focus:ring-0 focus:border-[#630100] text-sm text-gray-800 px-0 py-2 transition-colors font-montserrat";
  const labelClass = "text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1 block font-montserrat";

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-20 px-4 md:px-0 font-montserrat">
      
      {/* PAINEL DE ESTATÍSTICAS */}
      <div className="flex flex-col">
        
        {/* 1. CARD RSVP (HERO HORIZONTAL) */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm mb-6">
          <p className={labelClass}>Resumo RSVP</p>
          <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
            
            <div className="flex items-center gap-6 w-full md:w-auto border-b md:border-b-0 md:border-r border-gray-50 pb-6 md:pb-0 md:pr-12">
              <div className="flex flex-col">
                <span className="text-base font-bold text-gray-800">Total Previsto</span>
                <span className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">*(Ativos: Conf. e Pend.)</span>
              </div>
              <span className="font-serif text-5xl text-[#630100] leading-none">{stats.rsvp.active}</span>
            </div>

            <div className="flex-1 w-full grid grid-cols-3 gap-4 text-center divide-x divide-gray-50">
              <div className="flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-green-600 mb-1">{stats.rsvp.confirmed}</span>
                <span className="bg-green-50 px-2 py-0.5 rounded text-[9px] uppercase font-bold text-green-700 tracking-widest">Confirmados</span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-yellow-500 mb-1">{stats.rsvp.pending}</span>
                <span className="bg-yellow-50 px-2 py-0.5 rounded text-[9px] uppercase font-bold text-yellow-700 tracking-widest">Pendentes</span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-red-500 mb-1">{stats.rsvp.declined}</span>
                <span className="bg-red-50 px-2 py-0.5 rounded text-[9px] uppercase font-bold text-red-700 tracking-widest">Recusados</span>
              </div>
            </div>

          </div>
        </div>

        {/* 2. GRELHA INFERIOR (4 CARDS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* CARD CATEGORIAS */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col">
            <p className={labelClass}>Por Faixa Etária</p>
            <div className="mt-4 space-y-4 flex-1">
              {[
                { label: 'Adultos', data: stats.adults },
                { label: 'Crianças', data: stats.children },
                { label: 'Bebés', data: stats.babies }
              ].map(item => (
                <div key={item.label} className="flex flex-col border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-gray-800">{item.label}</span>
                    <span className="text-sm font-serif italic text-gray-600">Total: {item.data.total}</span>
                  </div>
                  <div className="flex gap-4 text-[11px] font-medium text-gray-500">
                    <span className="text-green-600 bg-green-50 px-1.5 rounded">{item.data.confirmed} Confirmados</span>
                    <span className="text-yellow-600 bg-yellow-50 px-1.5 rounded">{item.data.pending} Pendentes</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CARD GÉNERO */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col">
            <p className={labelClass}>Distribuição Sexo</p>
            <div className="mt-4 space-y-4 flex-1">
              {[
                { label: 'Adultos', m: stats.adultsM, f: stats.adultsF },
                { label: 'Crianças', m: stats.childrenM, f: stats.childrenF },
                { label: 'Bebés', m: stats.babiesM, f: stats.babiesF }
              ].map(item => (
                <div key={item.label} className="flex flex-col border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                  <span className="text-xs font-bold text-gray-800 mb-2">{item.label}</span>
                  <div className="space-y-1.5 text-[11px] font-medium">
                    <div className="flex items-center justify-between bg-blue-50/50 px-2 py-1 rounded">
                      <span className="text-blue-700 font-bold">Masculino</span>
                      <span className="text-blue-600">{item.m.confirmed} Conf. | {item.m.pending} Pend.</span>
                    </div>
                    <div className="flex items-center justify-between bg-pink-50/50 px-2 py-1 rounded">
                      <span className="text-pink-700 font-bold">Feminino</span>
                      <span className="text-pink-600">{item.f.confirmed} Conf. | {item.f.pending} Pend.</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CARD LADOS */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col">
            <p className={labelClass}>Convidado de...</p>
            <div className="mt-4 space-y-4 max-h-[180px] overflow-y-auto custom-scrollbar pr-1 flex-1">
              {customSides.map(side => {
                const sideData = stats.sides[side] || { total: 0, confirmed: 0, pending: 0 };
                if (sideData.total === 0) return null;
                return (
                  <div key={side} className="flex flex-col border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold uppercase text-[#630100]">
                        {side === 'noiva' ? brideName : side === 'noivo' ? groomName : side}
                      </span>
                      <span className="text-sm font-serif italic text-gray-600">Total: {sideData.total}</span>
                    </div>
                    <div className="flex gap-4 text-[11px] font-medium">
                      <span className="text-green-600 bg-green-50 px-1.5 rounded">{sideData.confirmed} Confirmados</span>
                      <span className="text-yellow-600 bg-yellow-50 px-1.5 rounded">{sideData.pending} Pendentes</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="pt-4 mt-auto">
              <div className="p-4 bg-[#FDFBF7] rounded-xl border border-[#EFDFBB]/50 space-y-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#630100] mb-1 block font-montserrat">Gerir Etiquetas (Lados)</p>
                <div className="flex gap-2">
                  <input className="flex-grow bg-transparent border-0 border-b border-gray-200 text-xs py-1 focus:ring-0 focus:border-[#630100]" placeholder="Ex: Trabalho" value={newSideLabel} onChange={(e) => setNewSideLabel(e.target.value)} />
                  <button type="button" onClick={handleAddSide} className="text-[10px] font-bold text-[#630100] uppercase">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {customSides.map(s => (
                        <span key={s} className="bg-white border border-[#EFDFBB]/50 text-[8px] font-bold uppercase px-2 py-1 rounded-md text-[#630100]">
                            {s === 'noiva' ? brideName : s === 'noivo' ? groomName : s}
                        </span>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* CARD RESTRIÇÕES */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col">
            <p className={labelClass}>Restrições Alimentares</p>
            <div className="mt-4 space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-1 flex-1">
              {Object.entries(stats.dietary).length === 0 && (
                <p className="text-[10px] text-gray-400 italic uppercase tracking-widest text-center py-4">Sem restrições</p>
              )}
              {Object.entries(stats.dietary).map(([tag, count]) => (
                <div key={tag} className="flex justify-between items-center bg-orange-50/50 px-3 py-2 rounded-xl">
                  <span className="text-[10px] font-bold text-orange-800 uppercase">{tag}</span>
                  <span className="text-[10px] font-bold text-orange-600 bg-white px-2 py-0.5 rounded-md shadow-sm">{count as number}</span>
                </div>
              ))}
            </div>
            
            <div className="pt-4 mt-auto">
              <div className="p-4 bg-orange-50/30 rounded-xl border border-orange-100 space-y-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-orange-600 mb-1 block font-montserrat">Gerir Etiquetas (Restrições)</p>
                <div className="flex gap-2">
                  <input className="flex-grow bg-transparent border-0 border-b border-gray-200 text-xs py-1 focus:ring-0 focus:border-orange-500" placeholder="Ex: Sem Glúten" value={newDietaryTag} onChange={(e) => setNewDietaryTag(e.target.value)} />
                  <button type="button" onClick={handleAddDietaryTag} className="text-[10px] font-bold text-orange-600 uppercase">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {dietaryTags.map(t => (
                        <span key={t} className="bg-white border border-orange-200 text-[8px] font-bold uppercase px-2 py-1 rounded-md text-orange-600 flex items-center gap-2">
                            {t}
                            <button type="button" onClick={() => handleRemoveDietaryTag(t)} className="hover:text-red-500"><X size={10} strokeWidth={3}/></button>
                        </span>
                    ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* FERRAMENTAS DE DADOS COM TÍTULOS VISUAIS */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="bg-[#630100]/5 p-3 rounded-2xl text-[#630100]">
            <FileSpreadsheet size={24}/>
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-800">Ferramentas de Dados</h4>
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Importar ou exportar listas</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-end justify-center md:justify-end gap-6 w-full md:w-auto">
          
          {/* GRUPO EXPORTAR */}
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#630100] text-center md:text-left">Exportar</span>
            <div className="flex gap-2">
              <div className="relative">
                <button 
                  onClick={() => setIsPdfMenuOpen(!isPdfMenuOpen)} 
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
                >
                  <FileText size={14}/> Exportar PDF <ChevronDown size={12} className={`transition-transform ${isPdfMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isPdfMenuOpen && (
                  <div className="absolute top-full mt-2 left-0 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl z-[100] p-2 animate-in fade-in slide-in-from-top-2">
                    <button onClick={() => exportToPDF('confirmed')} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-50 rounded-xl flex items-center gap-2 transition-colors"><CheckCircle2 size={12} className="text-green-500" /> Apenas Confirmados</button>
                    <button onClick={() => exportToPDF('confirmed_pending')} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-50 rounded-xl flex items-center gap-2 transition-colors"><Loader2 size={12} className="text-yellow-500" /> Conf. + Pendentes</button>
                    <button onClick={() => exportToPDF('all')} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-50 rounded-xl flex items-center gap-2 transition-colors"><Users size={12} className="text-blue-500" /> Lista Total Ativa</button>
                  </div>
                )}
              </div>
              <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
                <FileSpreadsheet size={14}/> Excel Total
              </button>
            </div>
          </div>
          
          <div className="h-10 w-[1px] bg-gray-200 hidden md:block mb-1"></div>

          {/* GRUPO IMPORTAR */}
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#630100] text-center md:text-left">Importar</span>
            <div className="flex gap-2">
              <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2.5 bg-[#FDFBF7] border border-[#EFDFBB] rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#630100] hover:bg-[#F8F4E9] transition-all shadow-sm">
                <Download size={14}/> Baixar Modelo
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls, .csv" />
              <button 
                disabled={!canEdit || isImporting} 
                onClick={() => fileInputRef.current?.click()} 
                className="flex items-center gap-2 px-6 py-2.5 bg-[#630100] text-[#EFDFBB] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-md disabled:opacity-50"
              >
                {isImporting ? <Loader2 className="animate-spin" size={14}/> : <Upload size={14}/>} Importar Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 items-start">
        
        {/* ADICIONAR CONVIDADOS */}
        <aside className="w-full lg:col-span-4 lg:sticky lg:top-24">
          <div className={`bg-white p-8 rounded-[2rem] border border-gray-100 shadow-lg ${!canEdit ? 'opacity-70 pointer-events-none' : ''}`}>
            <h3 className="font-serif text-2xl text-[#630100] mb-6 border-b border-gray-50 pb-4 italic">Adicionar à Lista</h3>
            <form onSubmit={handleSaveGroup} className="space-y-6">
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {newMembers.map((m, i) => (
                  <div key={i} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 relative space-y-4">
                    {newMembers.length > 1 && (
                      <button type="button" onClick={() => setNewMembers(newMembers.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-white text-red-500 shadow-sm w-6 h-6 rounded-full flex items-center justify-center font-bold border border-gray-100">✕</button>
                    )}
                    <div>
                      <label className={labelClass}>Nome</label>
                      <input className="w-full bg-transparent border-0 border-b border-gray-200 text-sm font-bold py-1 focus:ring-0 focus:border-[#630100]" value={m.name} onChange={e => {
                        const u = [...newMembers]; u[i].name = e.target.value; u[i].gender = suggestGender(e.target.value); setNewMembers(u);
                      }} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Categoria</label>
                        <select className="w-full bg-transparent border-0 border-b border-gray-200 text-xs font-medium focus:ring-0" value={m.category} onChange={e => { const u = [...newMembers]; u[i].category = e.target.value; setNewMembers(u); }}>
                          <option value="adult">Adulto</option>
                          <option value="child">Criança</option>
                          <option value="baby">Bebé</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Sexo</label>
                        <select className="w-full bg-transparent border-0 border-b border-gray-200 text-xs font-medium focus:ring-0" value={m.gender} onChange={e => { const u = [...newMembers]; u[i].gender = e.target.value; setNewMembers(u); }}>
                          <option value="masculino">Masculino</option>
                          <option value="feminino">Feminino</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Lado</label>
                      <select className="w-full bg-transparent border-0 border-b border-gray-200 text-[10px] font-bold uppercase focus:ring-0" value={m.side} onChange={e => { const u = [...newMembers]; u[i].side = e.target.value; setNewMembers(u); }}>
                        {customSides.map(s => <option key={s} value={s}>{s === 'noiva' ? brideName : s === 'noivo' ? groomName : s.toUpperCase()}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>Restrições Alimentares</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {dietaryTags.map(tag => {
                          const currentTags = m.dietary_notes ? m.dietary_notes.split(',').filter(Boolean) : [];
                          const isSelected = currentTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                let newTags = [...currentTags];
                                if (isSelected) newTags = newTags.filter(t => t !== tag);
                                else newTags.push(tag);
                                const u = [...newMembers];
                                u[i].dietary_notes = newTags.join(',');
                                setNewMembers(u);
                              }}
                              className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase transition-colors border ${isSelected ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-gray-200 text-gray-400 hover:border-orange-200 hover:text-orange-500'}`}
                            >
                              {tag}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
              
              <button type="button" onClick={() => setNewMembers([...newMembers, { name: "", category: "adult", gender: "masculino", side: "comum", dietary_notes: "" }])} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-[9px] font-black uppercase text-gray-400 hover:border-[#630100] hover:text-[#630100] transition-all flex items-center justify-center gap-2 tracking-widest"><UserPlus size={14}/> Adicionar Outro no Grupo</button>

              <div className="pt-4 border-t border-gray-50">
                <label className={labelClass}>Etiqueta do Grupo</label>
                <input className={inputClass} placeholder="Ex: Família Silva" value={groupTag} onChange={e => setGroupTag(e.target.value)} />
              </div>

              <button disabled={!canEdit} type="submit" className="w-full bg-[#630100] text-[#EFDFBB] py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50">Gravar Convidado(s)</button>
            </form>
          </div>
        </aside>

        {/* TABELA DE CONVIDADOS */}
        <div className="w-full lg:col-span-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {Object.keys(COLUMN_LABELS).map((k) => (
                    <th key={k} onClick={() => setSortConfig({key: k as keyof Guest, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'})} className="px-3 py-4 text-[10px] uppercase font-black text-gray-400 cursor-pointer hover:text-[#630100] tracking-widest">
                      <div className="flex items-center gap-2">
                        {COLUMN_LABELS[k]}
                        {sortConfig.key === k && <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-4 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedGuests.map(g => (
                  <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-4 font-bold text-gray-800">{g.name}</td>
                    <td className="px-3 py-4 text-[11px] font-semibold text-gray-500">{g.group_id?.includes('SOLO-') ? '-' : g.group_id}</td>
                    <td className="px-3 py-4 text-[10px] uppercase font-bold text-gray-500">{g.gender === 'masculino' ? 'M' : 'F'}</td>
                    <td className="px-3 py-4 text-[10px] uppercase font-bold text-gray-500">
                      {g.category === 'adult' ? 'Adulto' : g.category === 'child' ? 'Criança' : 'Bebé'}
                    </td>
                    <td className="px-3 py-4 text-[10px] uppercase font-black text-[#630100]">
                      {g.side === 'noiva' ? brideName : g.side === 'noivo' ? groomName : (g.side ? g.side.toUpperCase() : '-')}
                    </td>
                    <td className="px-3 py-4">
                      {g.dietary_notes ? (
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {g.dietary_notes.split(',').filter(Boolean).map(tag => (
                            <span key={tag} className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">{tag}</span>
                          ))}
                        </div>
                      ) : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-3 py-4">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${g.status === 'confirmed' ? 'bg-green-100 text-green-700' : g.status === 'declined' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {g.status === 'confirmed' ? 'Confirmado' : g.status === 'declined' ? 'Recusado' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-right">
                      {canEdit && (
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => setEditingGuest(g)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Editar"><Edit2 size={16}/></button>
                          <button onClick={() => handleDeleteGuest(g.id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Apagar"><Trash2 size={16}/></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO */}
      {editingGuest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg p-10 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-8 border-b border-gray-50 pb-4">
              <h3 className="font-serif text-3xl text-[#630100] italic">Editar Ficha</h3>
              <button onClick={() => handleDeleteGuest(editingGuest.id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors" title="Eliminar Convidado">
                <Trash2 size={18}/>
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className={labelClass}>Nome Completo</label>
                <input className={inputClass} value={editingGuest.name} onChange={e => setEditingGuest({...editingGuest, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Categoria</label>
                  <select className={inputClass} value={editingGuest.category} onChange={e => setEditingGuest({...editingGuest, category: e.target.value})}>
                    <option value="adult">Adulto</option>
                    <option value="child">Criança</option>
                    <option value="baby">Bebé</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Sexo</label>
                  <select className={inputClass} value={editingGuest.gender} onChange={e => setEditingGuest({...editingGuest, gender: e.target.value})}>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Grupo Familiar</label>
                  <input className={inputClass} value={editingGuest.group_id} onChange={e => setEditingGuest({...editingGuest, group_id: e.target.value})} />
                </div>
                <div>
                  <label className={labelClass}>Lado / Tag</label>
                  <select className={inputClass} value={editingGuest.side} onChange={e => setEditingGuest({...editingGuest, side: e.target.value})}>
                    {customSides.map(s => <option key={s} value={s}>{s === 'noiva' ? brideName : s === 'noivo' ? groomName : s.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              {/* SELECTOR DE RESTRIÇÕES NA EDIÇÃO */}
              <div>
                <label className={labelClass}>Restrições Alimentares</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {dietaryTags.map(tag => {
                    const currentTags = editingGuest.dietary_notes ? editingGuest.dietary_notes.split(',').filter(Boolean) : [];
                    const isSelected = currentTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          let newTags = [...currentTags];
                          if (isSelected) newTags = newTags.filter(t => t !== tag);
                          else newTags.push(tag);
                          setEditingGuest({...editingGuest, dietary_notes: newTags.join(',')});
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors border ${isSelected ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-gray-200 text-gray-400 hover:border-orange-200 hover:text-orange-500'}`}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className={labelClass}>Estado (RSVP)</label>
                <select className={inputClass} value={editingGuest.status} onChange={e => setEditingGuest({...editingGuest, status: e.target.value})}>
                  <option value="pending">Pendente</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="declined">Recusado</option>
                </select>
              </div>
              <div className="flex gap-4 pt-8">
                <button onClick={() => setEditingGuest(null)} className="w-1/3 text-[10px] font-black uppercase text-gray-400 tracking-widest hover:text-gray-600 transition-colors">Cancelar</button>
                <button onClick={async () => {
                  await supabase.from("guests").update(editingGuest).eq("id", editingGuest.id);
                  setGuests(guests.map(g => g.id === editingGuest.id ? editingGuest : g));
                  setEditingGuest(null);
                }} className="w-2/3 py-5 bg-[#630100] text-[#EFDFBB] rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all active:scale-95">Salvar Alterações</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOADER DE IMPORTAÇÃO */}
      {isImporting && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-[10000] flex flex-col items-center justify-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 border-4 border-[#630100]/10 border-t-[#630100] rounded-full animate-spin"></div>
            <Upload className="absolute inset-0 m-auto text-[#630100]" size={32} />
          </div>
          <p className="font-serif text-2xl text-[#630100] italic">A processar lista de convidados...</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mt-2">Por favor, aguarde um momento</p>
        </div>
      )}
    </div>
  );
}