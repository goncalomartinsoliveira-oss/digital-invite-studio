"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Trash2, UserMinus, Loader2, Map as MapIcon, List, Search, 
  Users, QrCode, X, Copy, Check, ExternalLink, Download, 
  Image as ImageIcon, Move, Info, ChevronRight, CheckCircle2, FileText
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";

interface Table {
  id: string;
  name: string;
  shape: string;
  capacity: number;
  position_x: number;
  position_y: number;
}

interface Guest {
  id: string;
  name: string;
  category: string;
  status: string;
  dietary_notes?: string;
  table_id?: string | null;
}

interface SeatingModuleDict {
  qrCode: {
    title: string; description: string; downloadPng: string; downloadSvg: string;
    openBtn: string; copied: string; copyLink: string;
  };
  orgStatus: { label: string; seated: string; noTable: string };
  tabs: { map: string; list: string; exportPdf: string; exportingPdf: string };
  mapView: {
    addTables: string; roundTable: string; squareTable: string; longTable: string;
    unseatedGuests: string; searchPlaceholder: string; seatsLabel: string; defaultTableName: string;
  };
  alerts: { removeTableConfirm: string; tableFull: string; pdfError: string };
  pdf: {
    eventLabel: string; generatedOn: string; reportTitle: string;
    totalSeated: string; noGuestsAssigned: string; footer: string;
  };
  listView: {
    title: string; subtitle: string; seated: string;
    seatsOf: string; seatsLabel: string; emptyTable: string;
  };
}

interface SeatingModuleProps {
  invitationId: string;
  canEdit: boolean;
  dict: SeatingModuleDict;
}

export default function SeatingModule({ invitationId, canEdit, dict }: SeatingModuleProps) {
  const params = useParams();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [tables, setTables] = useState<Table[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [isEditingTable, setIsEditingTable] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const TABLES_DB = "event_tables";
  const seatingPlanUrl = typeof window !== 'undefined' ? `${window.location.origin}/${params.locale}/seating/${params.slug}` : '';

  useEffect(() => {
    async function fetchData() {
      const [tablesRes, guestsRes] = await Promise.all([
        supabase.from(TABLES_DB).select("*").eq("invitation_id", invitationId).order("created_at", { ascending: true }),
        supabase.from("guests").select("id, name, category, status, table_id, dietary_notes").eq("invitation_id", invitationId)
      ]);

      const loadedTables = tablesRes.data || [];
      const tableIds = loadedTables.map(t => t.id);

      const loadedGuests = (guestsRes.data || []).map(g => {
        if (g.table_id && !tableIds.includes(g.table_id)) return { ...g, table_id: null };
        return g;
      });

      setTables(loadedTables);
      setGuests(loadedGuests);
      setLoading(false);
    }
    fetchData();
  }, [invitationId]);

  // --- FUNÇÕES DE GESTÃO ---
  const handleQuickAddTable = async (shape: string, defaultCapacity: number) => {
    if (!canEdit) return;
    const nextNumber = tables.length + 1;
    const { data } = await supabase.from(TABLES_DB).insert([{
      invitation_id: invitationId, name: `${dict.mapView.defaultTableName} ${nextNumber}`, shape, capacity: defaultCapacity, position_x: 50, position_y: 50
    }]).select().single();
    if (data) { setTables([...tables, data]); setSelectedTableId(data.id); setIsEditingTable(true); }
  };

  const handleUpdateTable = async () => {
    if (!canEdit || !selectedTableId) return;
    const activeTable = tables.find(t => t.id === selectedTableId);
    if (!activeTable) return;
    
    // Bloqueia Valores Negativos e Limita Redondas/Quadradas a 18
    let finalCapacity = Math.max(1, activeTable.capacity);
    if ((activeTable.shape === 'round' || activeTable.shape === 'square') && finalCapacity > 18) {
      finalCapacity = 18;
    }

    await supabase.from(TABLES_DB).update({ 
      name: activeTable.name, 
      shape: activeTable.shape, 
      capacity: finalCapacity 
    }).eq("id", selectedTableId);
    
    setIsEditingTable(false);
  };

  const handleDeleteTable = async (id: string) => {
    if (!canEdit) return;
    if (!confirm(dict.alerts.removeTableConfirm)) return;
    await supabase.from(TABLES_DB).delete().eq("id", id);
    setTables(tables.filter(t => t.id !== id));
    setGuests(guests.map(g => g.table_id === id ? { ...g, table_id: null } : g));
    setSelectedTableId(null);
  };

  // CORREÇÃO DOS SALTOS ALEATÓRIOS: Bloqueio estrito no tamanho real com scrollWidth
  const handleDragEndTable = async (id: string, info: any, currentX: number, currentY: number, w: number, h: number) => {
    if (!canEdit || !containerRef.current) return;
    
    let newX = currentX + info.offset.x;
    let newY = currentY + info.offset.y;

    const maxW = containerRef.current.scrollWidth - w - 20; 
    const maxH = containerRef.current.scrollHeight - h - 20;
    
    newX = Math.max(10, Math.min(newX, maxW));
    newY = Math.max(10, Math.min(newY, maxH));

    setTables(prev => prev.map(t => t.id === id ? { ...t, position_x: newX, position_y: newY } : t));
    await supabase.from(TABLES_DB).update({ position_x: newX, position_y: newY }).eq("id", id);
  };

  const handleDropGuestOnTable = async (e: React.DragEvent, tableId: string) => {
    e.preventDefault();
    if (!canEdit) return;
    const guestId = e.dataTransfer.getData("guestId");
    const table = tables.find(t => t.id === tableId);
    const seatedCount = guests.filter(g => g.table_id === tableId).length;
    if (table && seatedCount < table.capacity) {
      setGuests(guests.map(g => g.id === guestId ? { ...g, table_id: tableId } : g));
      await supabase.from('guests').update({ table_id: tableId }).eq('id', guestId);
    } else { alert(dict.alerts.tableFull); }
  };

  const handleUnseatGuest = async (guestId: string) => {
    if (!canEdit) return;
    setGuests(guests.map(g => g.id === guestId ? { ...g, table_id: null } : g));
    await supabase.from('guests').update({ table_id: null }).eq('id', guestId);
  };

  // CÁLCULOS GEOMÉTRICOS MELHORADOS
  const getDynamicTableSize = (shape: string, capacity: number) => {
    if (shape === 'round' || shape === 'square') return { width: 75, height: 75 };
    // Mesa longa aumenta significativamente a largura por cada par extra para as bolinhas "respirarem"
    const pairs = Math.ceil(capacity / 2);
    const extraPairs = Math.max(0, pairs - 2); 
    return { width: 75 + extraPairs * 30, height: 55 };
  };

  const getChairStyle = (index: number, total: number, shape: string, tableDimensions: {width: number, height: number}) => {
    const chairGap = 12; 
    const baseStyle = { position: 'absolute' as const, transform: 'translate(-50%, -50%)' }; 

    if (shape === 'round') {
      const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
      const radius = (tableDimensions.width / 2) + chairGap; 
      return { ...baseStyle, left: `calc(50% + ${Math.cos(angle) * radius}px)`, top: `calc(50% + ${Math.sin(angle) * radius}px)` };
    } 
    
    if (shape === 'square') {
      const side = index % 4;
      const positionInSide = Math.floor(index / 4);
      const totalOnSide = Math.floor(total / 4) + ( (total % 4) > side ? 1 : 0 );
      const spacing = 100 / (totalOnSide + 1);
      const percentage = (positionInSide + 1) * spacing;

      if (side === 0) return { ...baseStyle, left: `${percentage}%`, top: `-${chairGap}px` }; // Top
      if (side === 1) return { ...baseStyle, left: `calc(100% + ${chairGap}px)`, top: `${percentage}%` }; // Right
      if (side === 2) return { ...baseStyle, left: `${percentage}%`, top: `calc(100% + ${chairGap}px)` }; // Bottom
      return { ...baseStyle, left: `-${chairGap}px`, top: `${percentage}%` }; // Left
    } 
    
    // Retangular - SEM CABECEIRAS
    const isTop = index % 2 === 0;
    const positionInSide = Math.floor(index / 2);
    
    const topTotal = Math.ceil(total / 2);
    const bottomTotal = Math.floor(total / 2);
    const currentSideTotal = isTop ? topTotal : bottomTotal;
    
    const spacing = tableDimensions.width / (currentSideTotal + 1);
    const xPos = (positionInSide + 1) * spacing;
    const yPos = isTop ? `-${chairGap}px` : `calc(100% + ${chairGap}px)`;

    return { ...baseStyle, left: `${xPos}px`, top: yPos };
  };

  const downloadQR = (format: 'png' | 'svg') => {
    const svg = document.getElementById("qr-sala");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    if (format === 'svg') {
      const blob = new Blob([svgData], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = `QR-Sala-${params.slug}.svg`; link.click();
    } else {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = 1000; canvas.height = 1000;
        ctx!.fillStyle = "white"; ctx!.fillRect(0, 0, 1000, 1000);
        ctx!.drawImage(img, 0, 0, 1000, 1000);
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png"); link.download = `QR-Sala-${params.slug}.png`; link.click();
      };
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  // --- NOVA FUNÇÃO: EXPORTAR PARA PDF PREMIUM ---
  const exportLayoutToPDF = async () => {
    if (!containerRef.current) return;
    setIsExporting(true);
    
    const websiteUrl = "https://digitalinvitestudio.com"; // O seu site

    try {
      const dataUrl = await toPng(containerRef.current, { 
          cacheBust: true, 
          pixelRatio: 3, // Qualidade ultra-alta
          backgroundColor: '#F4F5F7' 
      });
      
      const pdf = new jsPDF("l", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      // --- PÁGINA 1: O MAPA VISUAL ---
      // 1. Cabeçalho Premium com Logo Mantendo Proporção (Sem Esticar)
      try {
        const logoImg = new window.Image();
        logoImg.src = "/logo-dis.png";
        
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
        });

        // Calcula a altura correta com base na largura que queremos (ex: 40mm) para não esticar a imagem
        const logoRatio = logoImg.height / logoImg.width;
        const logoWidth = 40; 
        const logoHeight = logoWidth * logoRatio;
        
        pdf.addImage(logoImg, "PNG", 14, 8, logoWidth, logoHeight);
        pdf.link(14, 8, logoWidth, logoHeight, { url: websiteUrl });
      } catch (e) {
        // Fallback se a imagem não existir
        pdf.setFontSize(16);
        pdf.setTextColor(99, 1, 0);
        pdf.setFont("helvetica", "bold");
        pdf.text("DIGITAL INVITE STUDIO", 14, 18);
        pdf.link(14, 10, 70, 10, { url: websiteUrl });
      }

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(150, 150, 150);
      pdf.text(`${dict.pdf.eventLabel}: ${params.slug?.toString().toUpperCase()}`, pdfWidth - 14, 15, { align: 'right' });
      pdf.text(`${dict.pdf.generatedOn}: ${new Date().toLocaleDateString()}`, pdfWidth - 14, 20, { align: 'right' });
      
      pdf.setDrawColor(239, 223, 187); // Cor Dourado/Creme
      pdf.setLineWidth(0.5);
      pdf.line(14, 28, pdfWidth - 14, 28); // Linha divisória

      // 2. O Mapa (Cálculo Rigoroso do Aspect Ratio para a sala não esticar)
      const containerW = containerRef.current.scrollWidth;
      const containerH = containerRef.current.scrollHeight;
      const maxAvailableWidth = pdfWidth - 28; // Margens laterais (14+14)
      const maxAvailableHeight = 160; // Limite vertical na página
      
      let printWidth = maxAvailableWidth;
      let printHeight = (containerH * printWidth) / containerW;
      
      // Se a imagem for demasiado alta, ajustamos a largura para não distorcer nem sair da folha
      if (printHeight > maxAvailableHeight) {
        printHeight = maxAvailableHeight;
        printWidth = (containerW * printHeight) / containerH;
      }
      
      const xPos = 14 + ((maxAvailableWidth - printWidth) / 2); // Centraliza a imagem
      
      pdf.addImage(dataUrl, "PNG", xPos, 33, printWidth, printHeight);
      
      // 3. Rodapé
      pdf.setFontSize(8);
      pdf.text(dict.pdf.footer, pdfWidth / 2, 200, { align: 'center' });

      // --- PÁGINA 2: O RELATÓRIO ESCRITO ---
      pdf.addPage("a4", "p"); 
      const pWidth = pdf.internal.pageSize.getWidth();
      
      pdf.setFontSize(18);
      pdf.setTextColor(99, 1, 0);
      pdf.setFont("helvetica", "bold");
      pdf.text(dict.pdf.reportTitle, 14, 20);
      
      pdf.setFontSize(9);
      pdf.setTextColor(120, 120, 120);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${dict.pdf.totalSeated}: ${guests.filter(g => g.table_id).length}`, 14, 27);
      
      pdf.setDrawColor(99, 1, 0);
      pdf.setLineWidth(0.5);
      pdf.line(14, 32, pWidth - 14, 32);

      let yPos = 45;
      
      tables.forEach((t) => {
        const seated = guests.filter(g => g.table_id === t.id);
        
        if (yPos > 260) {
          pdf.addPage("a4", "p");
          yPos = 25;
        }

        // Card da Mesa no PDF
        pdf.setFillColor(253, 251, 247);
        pdf.roundedRect(14, yPos - 5, pWidth - 28, (seated.length > 0 ? (seated.length * 6) + 15 : 15), 3, 3, 'F');
        
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", "bold");
        pdf.text(`${t.name.toUpperCase()} (${seated.length}/${t.capacity})`, 20, yPos + 2);
        
        yPos += 10;
        
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(60, 60, 60);
        
        if (seated.length === 0) {
          pdf.text(dict.pdf.noGuestsAssigned, 20, yPos);
          yPos += 10;
        } else {
          seated.forEach(g => {
            pdf.text(`• ${g.name}`, 25, yPos);
            yPos += 6;
          });
          yPos += 8;
        }
      });
      
      pdf.save(`Relatorio_Sala_${params.slug || 'evento'}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert(dict.alerts.pdfError);
    } finally {
      setIsExporting(false);
    }
  };

  const activeTable = tables.find(t => t.id === selectedTableId);
  const seatedInActive = guests.filter(g => g.table_id === selectedTableId);
  const unassignedGuests = guests
    .filter(g => !g.table_id && g.status !== 'declined')
    .filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-[#630100]" size={40} /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-700 w-full pb-20 font-montserrat">
      
      {/* 1. CARD QR CODE ISOLADO & EXPLICATIVO */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
          <div className="bg-[#FDFBF7] p-4 rounded-3xl border border-[#EFDFBB]/50 shadow-inner">
            <QRCodeSVG id="qr-sala" value={seatingPlanUrl} size={140} />
          </div>
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 text-[#630100] mb-1">
                <QrCode size={18} />
                <h3 className="font-serif text-2xl">{dict.qrCode.title}</h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {dict.qrCode.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <button onClick={() => downloadQR('png')} className="bg-[#332E2B] text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all">
                <Download size={14} /> {dict.qrCode.downloadPng}
              </button>
              <button onClick={() => downloadQR('svg')} className="bg-white text-gray-600 border border-gray-200 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all">
                {dict.qrCode.downloadSvg}
              </button>
              <button onClick={() => window.open(seatingPlanUrl, '_blank')} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-gray-200 transition-all">
                <ExternalLink size={14} /> {dict.qrCode.openBtn}
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(seatingPlanUrl); setCopied(true); setTimeout(()=>setCopied(false), 2000); }}
                className="bg-[#630100]/5 text-[#630100] px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#630100]/10 transition-all"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? dict.qrCode.copied : dict.qrCode.copyLink}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">{dict.orgStatus.label}</p>
          <div className="flex gap-8">
            <div>
              <span className="block font-serif text-4xl text-[#630100]">{guests.filter(g => g.table_id).length}</span>
              <span className="text-[9px] font-bold uppercase text-gray-400">{dict.orgStatus.seated}</span>
            </div>
            <div className="w-[1px] bg-gray-100 h-12 my-auto"></div>
            <div>
              <span className="block font-serif text-4xl text-orange-400">{unassignedGuests.length}</span>
              <span className="text-[9px] font-bold uppercase text-gray-400">{dict.orgStatus.noTable}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ABAS DE NAVEGAÇÃO E BOTÃO PDF */}
      <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setViewMode('map')} 
            className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${viewMode === 'map' ? 'bg-[#630100] text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
          >
            <MapIcon size={14} /> {dict.tabs.map}
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${viewMode === 'list' ? 'bg-[#630100] text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
          >
            <List size={14} /> {dict.tabs.list}
          </button>
        </div>
        
        {viewMode === 'map' && (
          <button 
            onClick={exportLayoutToPDF} 
            disabled={isExporting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#FDFBF7] border border-[#EFDFBB] text-[#630100] px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm hover:bg-[#630100] hover:text-white transition-all disabled:opacity-50"
          >
            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            {isExporting ? dict.tabs.exportingPdf : dict.tabs.exportPdf}
          </button>
        )}
      </div>

      {/* VISTA: MAPA (PLANTA) */}
      {viewMode === 'map' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-1/4 space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><Plus size={14} /> {dict.mapView.addTables}</h4>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => handleQuickAddTable('round', 8)} className="flex flex-col items-center gap-2 bg-gray-50 border border-gray-100 p-2 rounded-xl hover:border-[#630100]/30 group transition-all"><div className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 group-hover:border-[#630100]"></div><span className="text-[8px] font-bold uppercase">{dict.mapView.roundTable}</span></button>
                  <button onClick={() => handleQuickAddTable('square', 8)} className="flex flex-col items-center gap-2 bg-gray-50 border border-gray-100 p-2 rounded-xl hover:border-[#630100]/30 group transition-all"><div className="w-5 h-5 border-2 border-dashed border-gray-300 group-hover:border-[#630100]"></div><span className="text-[8px] font-bold uppercase">{dict.mapView.squareTable}</span></button>
                  <button onClick={() => handleQuickAddTable('rectangular', 10)} className="flex flex-col items-center gap-2 bg-gray-50 border border-gray-100 p-2 rounded-xl hover:border-[#630100]/30 group transition-all"><div className="w-6 h-4 border-2 border-dashed border-gray-300 group-hover:border-[#630100]"></div><span className="text-[8px] font-bold uppercase">{dict.mapView.longTable}</span></button>
                </div>
              </div>

              <div className="lg:w-3/4 space-y-4 border-l border-gray-50 lg:pl-6">
                <div className="flex items-center justify-between gap-4"><h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><Users size={14} /> {dict.mapView.unseatedGuests} ({unassignedGuests.length})</h4><div className="relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} /><input className="w-full bg-gray-50 border border-gray-100 rounded-full pl-8 pr-4 py-1.5 text-[10px] outline-none" placeholder={dict.mapView.searchPlaceholder} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div></div>
                <div className="max-h-32 overflow-y-auto pr-2 custom-scrollbar p-1">
                  <div className="flex flex-wrap gap-2">
                    {unassignedGuests.map(g => (<div key={g.id} draggable={canEdit} onDragStart={(e) => { e.dataTransfer.setData("guestId", g.id); }} className="bg-[#FDFBF7] border border-[#EFDFBB]/30 px-3 py-2 rounded-xl text-[10px] font-bold flex items-center gap-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-all whitespace-nowrap">{g.name} {g.category === 'child' && <span>👶</span>} {g.category === 'baby' && <span>🍼</span>}</div>))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {selectedTableId && activeTable && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-[#1C1C21] rounded-[2rem] overflow-hidden shadow-xl">
                <div className="p-6 flex flex-col md:flex-row gap-6 items-center">
                  <div className="flex-1 flex flex-wrap items-center gap-6">
                    <input className="bg-transparent border-b border-white/20 text-white font-serif text-2xl outline-none focus:border-[#EFDFBB] w-48" value={activeTable.name} onChange={e => setTables(tables.map(t => t.id === activeTable.id ? {...t, name: e.target.value} : t))} onBlur={handleUpdateTable} />
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl"><span className="text-[10px] font-bold text-gray-400 uppercase">{dict.mapView.seatsLabel}</span><input type="number" min="1" className="bg-transparent text-white text-sm font-bold w-12 outline-none text-center" value={activeTable.capacity} onChange={e => { const val = parseInt(e.target.value); setTables(tables.map(t => t.id === activeTable.id ? {...t, capacity: isNaN(val) ? 1 : Math.max(1, val)} : t)); }} onBlur={handleUpdateTable} /></div>
                    <div className="flex flex-wrap gap-2 flex-1 border-l border-white/10 pl-6">{seatedInActive.map(g => (<div key={g.id} className="bg-white/10 text-white px-3 py-1.5 rounded-lg text-[10px] font-medium flex items-center gap-2">{g.name} <button onClick={() => handleUnseatGuest(g.id)} className="hover:text-red-400"><X size={12}/></button></div>))}</div>
                  </div>
                  <div className="flex gap-2"><button onClick={() => handleDeleteTable(activeTable.id)} className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20}/></button><button onClick={() => setSelectedTableId(null)} className="p-3 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-all"><CheckCircle2 size={24}/></button></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full bg-[#F4F5F7] rounded-[3rem] border-2 border-dashed border-gray-200 overflow-x-auto overflow-y-hidden custom-scrollbar shadow-inner">
            <div className="relative h-[750px] min-w-[1024px] w-full" ref={containerRef}>
              <div className="absolute inset-0 opacity-[0.2] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#630100 1.2px, transparent 1px)', backgroundSize: '35px 35px' }} />
              {tables.map(table => {
                const occupants = guests.filter(g => g.table_id === table.id);
                const isSelected = selectedTableId === table.id;
                const tableDimensions = getDynamicTableSize(table.shape, table.capacity);
                return (
                  <motion.div key={table.id} drag={canEdit} dragMomentum={false} dragElastic={0} dragConstraints={containerRef} onDragEnd={(e, info) => handleDragEndTable(table.id, info, table.position_x, table.position_y, tableDimensions.width, tableDimensions.height)} onClick={(e) => { e.stopPropagation(); setSelectedTableId(table.id); setIsEditingTable(false); }} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDropGuestOnTable(e, table.id)} style={{ position: 'absolute', top: 0, left: 0, width: tableDimensions.width, height: tableDimensions.height }} animate={{ x: table.position_x, y: table.position_y }} transition={{ type: "tween", duration: 0 }} className={`flex items-center justify-center transition-shadow ${isSelected ? 'z-50' : 'z-10'}`}>
                    <div className="relative flex items-center justify-center" style={{ width: tableDimensions.width, height: tableDimensions.height }}>
                      {Array.from({ length: table.capacity }).map((_, i) => {
                        const guest = occupants[i];
                        const chairPos = getChairStyle(i, table.capacity, table.shape, tableDimensions);
                        return (
                          <div key={i} style={chairPos} className={`group absolute w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shadow-sm transition-colors duration-500 cursor-pointer ${guest ? (guest.status === 'confirmed' ? 'bg-green-500 border-green-700' : 'bg-orange-400 border-orange-600') : 'bg-white border-gray-300'}`}>
                            {guest && <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-[#1C1C21] text-white text-[9px] px-2 py-1 rounded-md shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[100] transition-opacity font-bold">{guest.name}</div>}
                          </div>
                        );
                      })}
                      <div className={`w-full h-full shadow-lg flex items-center justify-center text-center p-2 transition-all relative z-10 ${table.shape === 'round' ? 'rounded-full' : table.shape === 'square' ? 'rounded-xl' : 'rounded-lg'} ${isSelected ? 'bg-[#630100] text-white scale-105 shadow-[#630100]/20' : 'bg-white text-[#332E2B] border border-gray-100'}`}><span className="text-[8px] font-black uppercase leading-tight pointer-events-none">{table.name}</span></div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VISTA: RELATÓRIO (LISTA ORGANIZADA) */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-8 lg:p-12 animate-in fade-in slide-in-from-bottom-4">
          <div className="mb-10 border-b border-gray-50 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h3 className="font-serif text-3xl text-[#630100]">{dict.listView.title}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2">{dict.listView.subtitle}</p>
            </div>
            <div className="bg-[#FDFBF7] border border-[#EFDFBB]/50 px-6 py-4 rounded-2xl text-center shadow-sm">
              <span className="block font-serif text-3xl text-gray-800 leading-none">{guests.filter(g => g.table_id).length}</span>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 block">{dict.listView.seated}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tables.map(t => {
              const tableGuests = guests.filter(g => g.table_id === t.id);
              return (
                <div key={t.id} className="flex flex-col bg-[#FDFBF7] rounded-[2.5rem] border border-[#EFDFBB]/40 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="bg-gradient-to-r from-[#630100] to-[#800100] p-6 text-center">
                     <h5 className="font-serif text-2xl text-[#EFDFBB]">{t.name}</h5>
                     <p className="text-[9px] font-bold uppercase text-[#EFDFBB]/70 tracking-[0.2em] mt-1">{tableGuests.length} {dict.listView.seatsOf} {t.capacity} {dict.listView.seatsLabel}</p>
                  </div>
                  <div className="p-6 space-y-3 flex-1 bg-white">
                    {tableGuests.length > 0 ? (
                      tableGuests.map((g, index) => (
                        <div key={g.id} className="flex items-center justify-between gap-3 group border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                          <div className="flex items-center gap-3">
                             <span className="text-[10px] text-gray-300 font-serif italic">{index + 1}.</span>
                             <span className="text-xs font-bold text-gray-700">{g.name}</span>
                          </div>
                          <span className={`text-[8px] font-black uppercase px-2 py-1 rounded tracking-widest ${g.category === 'adult' ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-500'}`}>
                            {g.category === 'adult' ? 'A' : g.category === 'child' ? 'C' : 'B'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex items-center justify-center py-8">
                        <p className="text-[10px] text-gray-300 italic uppercase font-bold tracking-widest">{dict.listView.emptyTable}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}