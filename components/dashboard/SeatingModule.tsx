"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, UserMinus, Loader2, Map as MapIcon, List, Search, Users, QrCode, X, Copy, Check, ExternalLink, Download, Image as ImageIcon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

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

interface SeatingModuleProps {
  invitationId: string;
  canEdit: boolean;
}

export default function SeatingModule({ invitationId, canEdit }: SeatingModuleProps) {
  const params = useParams();
  
  const [tables, setTables] = useState<Table[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [isEditingTable, setIsEditingTable] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const TABLES_DB = "event_tables";

  useEffect(() => {
    async function fetchData() {
      const [tablesRes, guestsRes] = await Promise.all([
        supabase.from(TABLES_DB).select("*").eq("invitation_id", invitationId).order("created_at", { ascending: true }),
        supabase.from("guests").select("id, name, category, status, table_id, dietary_notes").eq("invitation_id", invitationId)
      ]);

      if (tablesRes.error) {
        console.error("Erro a carregar mesas:", tablesRes.error.message);
      }

      const loadedTables = tablesRes.data || [];
      const tableIds = loadedTables.map(t => t.id);

      const loadedGuests = (guestsRes.data || []).map(g => {
        if (g.table_id && !tableIds.includes(g.table_id)) {
          return { ...g, table_id: null };
        }
        return g;
      });

      setTables(loadedTables);
      setGuests(loadedGuests);
      setLoading(false);
    }
    fetchData();
  }, [invitationId]);

  const handleQuickAddTable = async (shape: string, defaultCapacity: number) => {
    if (!canEdit) return;
    const nextNumber = tables.length + 1;
    
    const { data, error } = await supabase.from(TABLES_DB).insert([{
      invitation_id: invitationId, 
      name: `Mesa ${nextNumber}`, 
      shape: shape, 
      capacity: defaultCapacity,
      position_x: 350, 
      position_y: 250
    }]).select().single();
    
    if (error) {
      alert("Erro ao criar mesa em " + TABLES_DB + ": " + error.message);
      return;
    }

    if (data) { 
      setTables([...tables, data]); 
      setSelectedTableId(data.id);
      setIsEditingTable(true);
    }
  };

  const handleUpdateTable = async () => {
    if (!canEdit || !selectedTableId) return;
    const activeTable = tables.find(t => t.id === selectedTableId);
    if (!activeTable) return;
    const { error } = await supabase.from(TABLES_DB).update({
      name: activeTable.name, shape: activeTable.shape, capacity: activeTable.capacity
    }).eq("id", selectedTableId);
    if (!error) setIsEditingTable(false);
  };

  const handleDeleteTable = async (id: string) => {
    if (!canEdit) return;
    if (!confirm("Tem a certeza? A mesa será removida e os convidados ficarão sem lugar.")) return;
    await supabase.from(TABLES_DB).delete().eq("id", id);
    setTables(tables.filter(t => t.id !== id));
    setGuests(guests.map(g => g.table_id === id ? { ...g, table_id: null } : g));
    if (selectedTableId === id) setSelectedTableId(null);
  };

  const handleDragEndTable = async (id: string, info: any, currentX: number, currentY: number) => {
    if (!canEdit) return;
    if (Math.abs(info.offset.x) < 2 && Math.abs(info.offset.y) < 2) return;
    let newX = Math.max(20, Math.min(1400, (currentX || 0) + info.offset.x));
    let newY = Math.max(20, Math.min(900, (currentY || 0) + info.offset.y));
    setTables(tables.map(t => t.id === id ? { ...t, position_x: newX, position_y: newY } : t));
    await supabase.from(TABLES_DB).update({ position_x: newX, position_y: newY }).eq("id", id);
  };

  const handleDragStartGuest = (e: React.DragEvent, guestId: string) => {
    if (!canEdit) { e.preventDefault(); return; }
    e.dataTransfer.setData("guestId", guestId);
  };

  const handleDropGuestOnTable = async (e: React.DragEvent, tableId: string) => {
    e.preventDefault();
    if (!canEdit) return;
    const guestId = e.dataTransfer.getData("guestId");
    if (!guestId) return;
    const table = tables.find(t => t.id === tableId);
    const currentSeated = guests.filter(g => g.table_id === tableId).length;
    if (table && currentSeated < table.capacity) {
      setGuests(guests.map(g => g.id === guestId ? { ...g, table_id: tableId } : g));
      await supabase.from('guests').update({ table_id: tableId }).eq('id', guestId);
    } else {
      alert("Esta mesa já está cheia!");
    }
  };

  const handleUnseatGuest = async (guestId: string) => {
    if (!canEdit) return;
    setGuests(guests.map(g => g.id === guestId ? { ...g, table_id: null } : g));
    await supabase.from('guests').update({ table_id: null }).eq('id', guestId);
  };

  const getDynamicTableSize = (shape: string, capacity: number) => {
    if (shape === 'round' || shape === 'square') return { width: 80, height: 80 };
    const extraPairs = Math.max(0, Math.ceil((capacity - 2) / 2));
    return { width: 70 + extraPairs * 24, height: 60 }; 
  };

  const getChairStyle = (index: number, total: number, shape: string, tableDimensions: {width: number, height: number}) => {
    const chairOffset = '9px'; 
    if (shape === 'round') {
      const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
      const radius = 46; 
      return { position: 'absolute' as const, left: `calc(50% + ${Math.cos(angle) * radius}px)`, top: `calc(50% + ${Math.sin(angle) * radius}px)`, transform: 'translate(-50%, -50%)' };
    } else if (shape === 'square') {
      const side = index % 4; 
      const itemsPerSide = Math.ceil(total / 4);
      const positionInSide = Math.floor(index / 4);
      const spacing = 100 / (itemsPerSide + 1);
      const percentage = (positionInSide + 1) * spacing;
      if (side === 0) return { position: 'absolute' as const, left: `${percentage}%`, top: `-${chairOffset}`, transform: 'translate(-50%, -50%)' };
      if (side === 1) return { position: 'absolute' as const, left: `calc(100% + ${chairOffset})`, top: `${percentage}%`, transform: 'translate(-50%, -50%)' };
      if (side === 2) return { position: 'absolute' as const, left: `${percentage}%`, top: `calc(100% + ${chairOffset})`, transform: 'translate(-50%, -50%)' };
      return { position: 'absolute' as const, left: `-${chairOffset}`, top: `${percentage}%`, transform: 'translate(-50%, -50%)' };
    } else {
      if (index === 0) return { position: 'absolute' as const, left: `-${chairOffset}`, top: '50%', transform: 'translate(-50%, -50%)' }; 
      if (index === 1 && total > 1) return { position: 'absolute' as const, left: `calc(100% + ${chairOffset})`, top: '50%', transform: 'translate(-50%, -50%)' }; 
      const sideCapacity = total - 2;
      const topCount = Math.ceil(sideCapacity / 2);
      const isTop = (index - 2) < topCount;
      const sideIndex = isTop ? (index - 2) : (index - 2 - topCount);
      const currentSideTotal = isTop ? topCount : Math.floor(sideCapacity / 2);
      const spacing = tableDimensions.width / (currentSideTotal + 1);
      const xPos = (sideIndex + 1) * spacing;
      const yPos = isTop ? `-${chairOffset}` : `calc(100% + ${chairOffset})`;
      return { position: 'absolute' as const, left: `${xPos}px`, top: yPos, transform: 'translate(-50%, -50%)' };
    }
  };

  const getGuestIcons = (g: Guest) => (
    <div className="flex gap-1 items-center">
      {g.category === 'child' && <span title="Criança">👶</span>}
      {g.category === 'baby' && <span title="Bebé">🍼</span>}
      {g.dietary_notes && <span title={g.dietary_notes} className="text-[10px]">⚠️</span>}
    </div>
  );

  const downloadQRCodeSVG = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `QR-Mesas-${params.slug}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadQRCodePNG = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    const size = 1000;
    canvas.width = size;
    canvas.height = size;

    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = "#FDFBF7"; 
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        
        const pngUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = `QR-Mesas-${params.slug}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    };
    img.src = url;
  };

  const copyLink = () => {
    navigator.clipboard.writeText(seatingPlanUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeTable = tables.find(t => t.id === selectedTableId);
  const seatedGuests = guests.filter(g => g.table_id === selectedTableId);
  const unassignedGuests = guests
    .filter(g => !g.table_id && g.status !== 'declined')
    .filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const seatingPlanUrl = `${window.location.origin}/${params.locale}/seating/${params.slug}`;

  if (loading) return <div className="p-20 text-center flex flex-col items-center gap-4"><Loader2 className="animate-spin text-[#630100]" size={40} /><p className="font-serif text-xl text-gray-400">A carregar a planta da sala...</p></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-700 w-full pb-20 font-montserrat">
      
      {/* HEADER PRINCIPAL LIMPADO */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-6">
        <div>
            <h2 className="font-serif text-2xl text-gray-800">Editor de Planta</h2>
            <div className="flex gap-4 mt-2">
                <button onClick={() => setViewMode('map')} className={`text-[10px] font-bold uppercase tracking-widest pb-1 border-b-2 transition-colors ${viewMode === 'map' ? 'border-[#630100] text-[#630100]' : 'border-transparent text-gray-400'}`}>Design Visual</button>
                <button onClick={() => setViewMode('list')} className={`text-[10px] font-bold uppercase tracking-widest pb-1 border-b-2 transition-colors ${viewMode === 'list' ? 'border-[#630100] text-[#630100]' : 'border-transparent text-gray-400'}`}>Lista / Relatório</button>
            </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-4 xl:gap-6">
            
            <button 
              onClick={() => setShowQrModal(true)}
              className="flex items-center gap-2 bg-[#630100] text-[#EFDFBB] shadow-md px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#4a0100] transition-colors"
            >
              <QrCode size={16} /> QR Code da Sala
            </button>

            <div className="flex gap-6 text-right border-l border-gray-100 pl-6">
                <div className="text-center">
                    <span className="text-[9px] font-bold uppercase text-gray-400 block tracking-widest">Sentados</span>
                    <span className="font-serif text-2xl text-gray-800">{guests.filter(g => g.table_id).length}</span>
                </div>
                <div className="text-center border-l border-gray-100 pl-6">
                    <span className="text-[9px] font-bold uppercase text-gray-400 block tracking-widest">Por Sentar</span>
                    <span className="font-serif text-2xl text-orange-400">{guests.filter(g => !g.table_id && g.status !== 'declined').length}</span>
                </div>
            </div>
        </div>
      </div>

      {viewMode === 'map' ? (
        <div className="grid lg:grid-cols-12 gap-6 items-start h-[80vh] min-h-[750px]">
          
          <aside className="lg:col-span-3 flex flex-col h-full gap-4">
            {!activeTable ? (
              <>
                <div className={`bg-[#1C1C21] p-6 rounded-[2rem] shadow-lg flex flex-col ${!canEdit ? 'opacity-50 pointer-events-none' : ''}`}>
                  <h3 className="text-white font-medium text-sm mb-4">Adicionar Mesas</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleQuickAddTable('round', 8)} className="bg-[#2A2A32] hover:bg-[#383842] border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors group">
                      <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-400 group-hover:border-[#EFDFBB]"></div>
                      <span className="text-[10px] text-gray-300 font-medium">Redonda</span>
                    </button>
                    <button onClick={() => handleQuickAddTable('rectangular', 10)} className="bg-[#2A2A32] hover:bg-[#383842] border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors group">
                      <div className="w-10 h-6 border-2 border-dashed border-gray-400 rounded-sm group-hover:border-[#EFDFBB]"></div>
                      <span className="text-[10px] text-gray-300 font-medium">Longa</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col flex-1 overflow-hidden">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-[#630100] focus:border-[#630100] outline-none" placeholder="Procurar convidado..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  </div>
                  <div className={`flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar ${!canEdit ? 'pointer-events-none' : ''}`}>
                    {unassignedGuests.map(g => (
                      <div key={g.id} draggable={canEdit} onDragStart={(e) => handleDragStartGuest(e, g.id)} className={`flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-transparent transition-all group ${canEdit ? 'hover:border-[#630100]/30 cursor-grab active:cursor-grabbing' : ''}`}>
                         <div className="flex items-center gap-2 truncate">
                           <span className="text-xs font-medium text-gray-700 truncate">{g.name}</span>
                           {getGuestIcons(g)}
                         </div>
                         {canEdit && <div className="text-gray-300 group-hover:text-[#630100]">⋮⋮</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white p-6 rounded-[2rem] border-2 border-[#630100] shadow-xl flex flex-col h-full relative">
                <button onClick={() => {setSelectedTableId(null); setIsEditingTable(false);}} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800">✕</button>
                
                {isEditingTable && canEdit ? (
                  <div className="space-y-4 mb-6 pt-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nome da Mesa</label>
                    <input className="font-serif text-xl border-b border-gray-200 focus:border-[#630100] w-full outline-none pb-1 bg-transparent" value={activeTable.name} onChange={e => setTables(tables.map(t => t.id === activeTable.id ? {...t, name: e.target.value} : t))} />
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Formato</label>
                         <select className="w-full bg-gray-50 rounded-lg px-2 py-2 text-xs border border-gray-200" value={activeTable.shape} onChange={e => setTables(tables.map(t => t.id === activeTable.id ? {...t, shape: e.target.value} : t))}>
                           <option value="round">Redonda</option>
                           <option value="rectangular">Longa</option>
                           <option value="square">Quadrada</option>
                         </select>
                       </div>
                       <div>
                         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Lugares</label>
                         <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-center text-sm font-bold" value={activeTable.capacity} onChange={e => setTables(tables.map(t => t.id === activeTable.id ? {...t, capacity: parseInt(e.target.value) || 1} : t))} />
                       </div>
                    </div>
                    
                    <div className="pt-4 flex flex-col gap-2">
                      <button onClick={handleUpdateTable} className="w-full bg-[#630100] text-[#EFDFBB] py-2.5 rounded-xl text-xs font-bold uppercase shadow-md">Gravar Ajustes</button>
                      <button onClick={() => handleDeleteTable(activeTable.id)} className="w-full text-red-400 hover:text-red-600 py-2 rounded-xl text-xs font-bold uppercase transition-colors">Remover Mesa</button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 pt-2">
                    <h3 className="font-serif text-2xl text-gray-800">{activeTable.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 mb-4">{seatedGuests.length} de {activeTable.capacity} lugares ocupados</p>
                    {canEdit && (
                      <button onClick={() => setIsEditingTable(true)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-[10px] font-bold uppercase w-full hover:bg-gray-200 transition-colors">Modificar Mesa</button>
                    )}
                  </div>
                )}

                <div className="flex-1 overflow-y-auto space-y-2 border-t border-gray-100 pt-4 custom-scrollbar">
                  {seatedGuests.length === 0 ? (
                    <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Arraste convidados para aqui</p>
                    </div>
                  ) : (
                    seatedGuests.map(g => (
                      <div key={g.id} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl group">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-xs font-medium text-gray-700 truncate">{g.name}</span>
                          {getGuestIcons(g)}
                        </div>
                        {canEdit && (
                          <button onClick={() => handleUnseatGuest(g.id)} className="text-gray-300 hover:text-red-500 font-bold px-2">✕</button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </aside>

          <div className="lg:col-span-9 h-full bg-[#F4F5F7] rounded-[2rem] border border-gray-200 relative overflow-hidden flex shadow-inner" onClick={() => setSelectedTableId(null)}>
            <div className="absolute inset-0 opacity-[0.2] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#D1D5DB 1px, transparent 1px), linear-gradient(90deg, #D1D5DB 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            
            {tables.map(table => {
              const occupants = guests.filter(g => g.table_id === table.id);
              const isSelected = selectedTableId === table.id;
              const isFull = occupants.length >= table.capacity;
              const tableDimensions = getDynamicTableSize(table.shape, table.capacity);
              
              return (
                <motion.div
                  key={table.id} drag={canEdit} dragMomentum={false}
                  onDragEnd={(e, info) => handleDragEndTable(table.id, info, table.position_x, table.position_y)}
                  onClick={(e) => { e.stopPropagation(); setSelectedTableId(table.id); setIsEditingTable(false); }}
                  onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDropGuestOnTable(e, table.id)}
                  initial={{ x: table.position_x, y: table.position_y }}
                  style={{ width: tableDimensions.width, height: tableDimensions.height }}
                  className={`absolute flex flex-col items-center justify-center shadow-lg transition-all
                    ${canEdit ? 'cursor-grab' : 'cursor-pointer'}
                    ${table.shape === 'round' ? 'rounded-full' : 'rounded-xl'} 
                    ${isSelected ? 'bg-[#630100] text-white ring-8 ring-[#630100]/10 z-50' : 'bg-white text-[#332E2B] border border-gray-100 hover:border-[#630100]/30'}
                    ${isFull && !isSelected ? 'border-2 border-red-400' : ''}
                  `}
                >
                  <span className="font-serif font-bold text-[10px] px-1 truncate w-full text-center leading-none">{table.name}</span>
                  {Array.from({ length: table.capacity }).map((_, i) => {
                    const occupant = occupants[i];
                    return (
                      <div key={`chair-${table.id}-${i}`} style={getChairStyle(i, table.capacity, table.shape, tableDimensions)}
                        className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shadow-sm transition-all
                          ${occupant ? (occupant.status === 'confirmed' ? 'bg-green-400 border-green-500 scale-110' : 'bg-orange-300 border-orange-400 scale-110') : 'bg-white border-gray-200'}
                        `}
                      />
                    );
                  })}
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-10 animate-in fade-in slide-in-from-bottom-4">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tables.map(t => (
              <div key={t.id} className="p-6 bg-[#FDFBF7] rounded-3xl border border-gray-100">
                <h4 className="font-serif text-xl text-[#630100] mb-4 border-b border-[#630100]/10 pb-2">{t.name}</h4>
                <div className="space-y-2">
                  {guests.filter(g => g.table_id === t.id).map(g => (
                    <div key={g.id} className="text-xs font-medium text-gray-600 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> {g.name}
                      </div>
                      {getGuestIcons(g)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DO QR CODE */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md w-full text-center relative"
            >
              <button 
                onClick={() => setShowQrModal(false)}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-[#630100] hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
              
              <h3 className="font-serif text-2xl text-[#630100] mb-2">Acesso à Sala</h3>
              <p className="text-xs text-gray-500 mb-8 px-4">
                Disponibilize este código à entrada para os convidados encontrarem rapidamente as suas mesas.
              </p>

              <div className="bg-[#FDFBF7] p-6 rounded-3xl border border-[#EFDFBB]/50 inline-block mb-8 shadow-sm">
                <QRCodeSVG 
                  id="qr-code-svg"
                  value={seatingPlanUrl} 
                  size={200}
                  bgColor={"#FDFBF7"}
                  fgColor={"#332E2B"}
                  level={"Q"}
                  includeMargin={false}
                />
              </div>

              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={downloadQRCodePNG}
                      className="bg-[#332E2B] text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                      <ImageIcon size={14} /> PNG (Imagem)
                    </button>
                    <button 
                      onClick={downloadQRCodeSVG}
                      className="bg-white text-[#332E2B] border border-gray-200 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Download size={14} /> SVG (Vetor)
                    </button>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => window.open(seatingPlanUrl, '_blank')}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors flex justify-center items-center gap-2"
                  >
                    <ExternalLink size={14} /> Testar
                  </button>
                  <button 
                    onClick={copyLink}
                    className="flex-1 bg-gray-100 text-[#630100] py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors flex justify-center items-center gap-2"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copiado" : "Copiar"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}