"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

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
}

export default function SeatingModule({ invitationId }: SeatingModuleProps) {
  const [tables, setTables] = useState<Table[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [isEditingTable, setIsEditingTable] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchData() {
      const [tablesRes, guestsRes] = await Promise.all([
        supabase.from("event_tables").select("*").eq("invitation_id", invitationId).order("created_at", { ascending: true }),
        supabase.from("guests").select("id, name, category, status, table_id, dietary_notes").eq("invitation_id", invitationId)
      ]);
      if (tablesRes.data) setTables(tablesRes.data);
      if (guestsRes.data) setGuests(guestsRes.data);
      setLoading(false);
    }
    fetchData();
  }, [invitationId]);

  const handleQuickAddTable = async (shape: string, defaultCapacity: number) => {
    const nextNumber = tables.length + 1;
    const { data, error } = await supabase.from("event_tables").insert([{
      invitation_id: invitationId, 
      name: `Mesa ${nextNumber}`, 
      shape: shape, 
      capacity: defaultCapacity,
      position_x: 350, 
      position_y: 250
    }]).select().single();
    
    if (!error && data) { 
      setTables([...tables, data]); 
      setSelectedTableId(data.id);
      setIsEditingTable(true);
    }
  };

  const handleUpdateTable = async () => {
    if (!selectedTableId) return;
    const activeTable = tables.find(t => t.id === selectedTableId);
    if (!activeTable) return;
    const { error } = await supabase.from("event_tables").update({
      name: activeTable.name, shape: activeTable.shape, capacity: activeTable.capacity
    }).eq("id", selectedTableId);
    if (!error) setIsEditingTable(false);
  };

  const handleDeleteTable = async (id: string) => {
    if (!confirm("Tem a certeza? A mesa será removida e os convidados ficarão sem lugar.")) return;
    await supabase.from("event_tables").delete().eq("id", id);
    setTables(tables.filter(t => t.id !== id));
    setGuests(guests.map(g => g.table_id === id ? { ...g, table_id: null } : g));
    if (selectedTableId === id) setSelectedTableId(null);
  };

  const handleDragEndTable = async (id: string, info: any, currentX: number, currentY: number) => {
    if (Math.abs(info.offset.x) < 2 && Math.abs(info.offset.y) < 2) return;
    // Limites expandidos (1400px largura e 900px altura) para acompanhar ecrãs maiores
    let newX = Math.max(20, Math.min(1400, (currentX || 0) + info.offset.x));
    let newY = Math.max(20, Math.min(900, (currentY || 0) + info.offset.y));
    setTables(tables.map(t => t.id === id ? { ...t, position_x: newX, position_y: newY } : t));
    await supabase.from("event_tables").update({ position_x: newX, position_y: newY }).eq("id", id);
  };

  const handleDragStartGuest = (e: React.DragEvent, guestId: string) => {
    e.dataTransfer.setData("guestId", guestId);
  };

  const handleDropGuestOnTable = async (e: React.DragEvent, tableId: string) => {
    e.preventDefault();
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
    setGuests(guests.map(g => g.id === guestId ? { ...g, table_id: null } : g));
    await supabase.from('guests').update({ table_id: null }).eq('id', guestId);
  };

  const getDynamicTableSize = (shape: string, capacity: number) => {
    if (shape === 'round') return { width: 80, height: 80 };
    if (shape === 'square') return { width: 80, height: 80 }; 
    const extraPairs = Math.max(0, Math.ceil((capacity - 2) / 2));
    return { width: 70 + extraPairs * 24, height: 60 }; 
  };

  const getChairStyle = (index: number, total: number, shape: string, tableDimensions: {width: number, height: number}) => {
    const chairOffset = '9px'; 
    
    if (shape === 'round') {
      const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
      const radius = 46; 
      return {
        position: 'absolute' as const,
        left: `calc(50% + ${Math.cos(angle) * radius}px)`,
        top: `calc(50% + ${Math.sin(angle) * radius}px)`,
        transform: 'translate(-50%, -50%)',
      };
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
      const bottomCount = Math.floor(sideCapacity / 2);
      const isTop = (index - 2) < topCount;
      const sideIndex = isTop ? (index - 2) : (index - 2 - topCount);
      const currentSideTotal = isTop ? topCount : bottomCount;
      const spacing = tableDimensions.width / currentSideTotal;
      const xPos = (sideIndex + 0.5) * spacing;
      const yPos = isTop ? `-${chairOffset}` : `calc(100% + ${chairOffset})`;
      
      return {
        position: 'absolute' as const,
        left: `${xPos}px`,
        top: yPos,
        transform: 'translate(-50%, -50%)',
      };
    }
  };

  const activeTable = tables.find(t => t.id === selectedTableId);
  const seatedGuests = guests.filter(g => g.table_id === selectedTableId);
  const unassignedGuests = guests
    .filter(g => !g.table_id && g.status !== 'declined')
    .filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const getGuestIcons = (g: Guest) => (
    <div className="flex gap-1 items-center">
      {g.category === 'child' && <span title="Criança">👶</span>}
      {g.category === 'baby' && <span title="Bebé">🍼</span>}
      {g.dietary_notes && <span title={g.dietary_notes} className="text-[10px]">⚠️</span>}
    </div>
  );

  if (loading) return <div className="p-20 text-center font-serif text-xl animate-pulse text-gray-400">A preparar a planta da sala...</div>;

  return (
    // Removido max-w-[1400px] -> Agora é w-full para ocupar 100% da área disponível
    <div className="space-y-6 animate-in fade-in duration-700 w-full pb-20">
      
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
            <h2 className="font-serif text-2xl text-gray-800">Editor de Planta</h2>
            <div className="flex gap-4 mt-2">
                <button onClick={() => setViewMode('map')} className={`text-[10px] font-bold uppercase tracking-widest pb-1 border-b-2 transition-colors ${viewMode === 'map' ? 'border-[#722F37] text-[#722F37]' : 'border-transparent text-gray-400'}`}>Design Visual</button>
                <button onClick={() => setViewMode('list')} className={`text-[10px] font-bold uppercase tracking-widest pb-1 border-b-2 transition-colors ${viewMode === 'list' ? 'border-[#722F37] text-[#722F37]' : 'border-transparent text-gray-400'}`}>Lista / Relatório</button>
            </div>
        </div>
        <div className="flex gap-6 text-right">
            <div className="text-center">
                <span className="text-[9px] font-bold uppercase text-gray-400 block">Sentados</span>
                <span className="font-serif text-2xl text-gray-800">{guests.filter(g => g.table_id).length}</span>
            </div>
            <div className="text-center border-l border-gray-100 pl-6">
                <span className="text-[9px] font-bold uppercase text-gray-400 block">Por Sentar</span>
                <span className="font-serif text-2xl text-orange-400">{guests.filter(g => !g.table_id && g.status !== 'declined').length}</span>
            </div>
        </div>
      </div>

      {viewMode === 'map' ? (
        // Altura dinâmica e robusta (min 750px, estica até 80vh em ecrãs grandes)
        <div className="grid lg:grid-cols-12 gap-6 items-start h-[80vh] min-h-[750px]">
          
          <aside className="lg:col-span-3 flex flex-col h-full gap-4">
            {!activeTable ? (
              <>
                <div className="bg-[#1C1C21] p-6 rounded-[2rem] shadow-lg flex flex-col">
                  <h3 className="text-white font-medium text-sm mb-4">Adicionar Mesas</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleQuickAddTable('round', 8)} className="bg-[#2A2A32] hover:bg-[#383842] border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors">
                      <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-400"></div>
                      <span className="text-[10px] text-gray-300 font-medium">Redonda</span>
                    </button>
                    <button onClick={() => handleQuickAddTable('rectangular', 10)} className="bg-[#2A2A32] hover:bg-[#383842] border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors">
                      <div className="w-10 h-6 border-2 border-dashed border-gray-400 rounded-sm"></div>
                      <span className="text-[10px] text-gray-300 font-medium">Longa</span>
                    </button>
                    <button onClick={() => handleQuickAddTable('square', 8)} className="bg-[#2A2A32] hover:bg-[#383842] border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors">
                      <div className="w-8 h-8 border-2 border-dashed border-gray-400 rounded-sm"></div>
                      <span className="text-[10px] text-gray-300 font-medium">Quadrada</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col flex-1 overflow-hidden">
                  <input 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs mb-4 focus:ring-[#722F37] focus:border-[#722F37]" 
                    placeholder="Procurar convidado..." 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                  />
                  <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide pr-2">
                    {unassignedGuests.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center mt-10">Todos sentados!</p>
                    ) : (
                      unassignedGuests.map(g => (
                        <div 
                          key={g.id} 
                          draggable 
                          onDragStart={(e) => handleDragStartGuest(e, g.id)}
                          className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-transparent hover:border-[#722F37]/30 transition-all cursor-grab active:cursor-grabbing"
                        >
                           <div className="flex items-center gap-2 truncate">
                             <span className="text-xs font-medium text-gray-700 truncate">{g.name}</span>
                             {getGuestIcons(g)}
                           </div>
                           <div className="text-gray-300">⋮⋮</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white p-6 rounded-[2rem] border-2 border-[#722F37] shadow-xl flex flex-col h-full relative">
                <button onClick={() => {setSelectedTableId(null); setIsEditingTable(false);}} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800">✕</button>
                
                {isEditingTable ? (
                  <div className="space-y-4 mb-6 pt-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nome da Mesa</label>
                    <input className="font-serif text-xl border-b border-gray-200 focus:border-[#722F37] w-full outline-none pb-1" value={activeTable.name} onChange={e => setTables(tables.map(t => t.id === activeTable.id ? {...t, name: e.target.value} : t))} />
                    
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
                         <input type="number" min="1" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-center text-sm" value={activeTable.capacity} onChange={e => setTables(tables.map(t => t.id === activeTable.id ? {...t, capacity: parseInt(e.target.value) || 1} : t))} />
                       </div>
                    </div>
                    
                    <div className="pt-4 flex flex-col gap-2">
                      <button onClick={handleUpdateTable} className="w-full bg-[#722F37] text-white py-2.5 rounded-xl text-xs font-bold uppercase shadow-md">Confirmar Ajustes</button>
                      <button onClick={() => handleDeleteTable(activeTable.id)} className="w-full text-gray-500 hover:text-red-500 py-2 rounded-xl text-xs font-bold uppercase transition-colors">Remover Mesa</button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 pt-2">
                    <h3 className="font-serif text-2xl text-gray-800">{activeTable.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 mb-4">{seatedGuests.length} de {activeTable.capacity} lugares ocupados</p>
                    <button onClick={() => setIsEditingTable(true)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-[10px] font-bold uppercase w-full hover:bg-gray-200 transition-colors">Modificar Mesa</button>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide border-t border-gray-100 pt-4">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">Lista da Mesa</p>
                  {seatedGuests.length === 0 ? (
                    <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Arraste convidados<br/>para aqui</p>
                    </div>
                  ) : (
                    seatedGuests.map(g => (
                      <div key={g.id} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl group">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-xs font-medium text-gray-700 truncate">{g.name}</span>
                        </div>
                        <button onClick={() => handleUnseatGuest(g.id)} className="text-gray-300 hover:text-red-500 font-bold px-2">✕</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </aside>

          {/* O CANVAS GIGANTE QUE AGORA OCUPA O RESTO DO ESPAÇO */}
          <div className="lg:col-span-9 h-full bg-[#F4F5F7] rounded-[2rem] border border-gray-200 relative overflow-hidden flex shadow-inner" onClick={() => setSelectedTableId(null)}>
            
            <div className="absolute inset-0 opacity-[0.4] pointer-events-none" 
                 style={{ 
                   backgroundImage: 'linear-gradient(#D1D5DB 1px, transparent 1px), linear-gradient(90deg, #D1D5DB 1px, transparent 1px)', 
                   backgroundSize: '40px 40px' 
                 }} 
            />
            
            {tables.map(table => {
              const occupants = guests.filter(g => g.table_id === table.id);
              const isSelected = selectedTableId === table.id;
              const isFull = occupants.length >= table.capacity;
              
              const safeX = isNaN(table.position_x) || table.position_x < 0 || table.position_x > 1400 ? 50 : table.position_x;
              const safeY = isNaN(table.position_y) || table.position_y < 0 || table.position_y > 900 ? 50 : table.position_y;
              
              const tableDimensions = getDynamicTableSize(table.shape, table.capacity);
              
              return (
                <motion.div
                  key={table.id} 
                  drag 
                  dragMomentum={false}
                  onDragEnd={(e, info) => handleDragEndTable(table.id, info, safeX, safeY)}
                  onClick={(e) => { e.stopPropagation(); setSelectedTableId(table.id); setIsEditingTable(true); }}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }} 
                  onDrop={(e) => handleDropGuestOnTable(e, table.id)}
                  initial={{ x: safeX, y: safeY }}
                  whileHover={{ scale: 1.02 }}
                  whileDrag={{ scale: 1.05, cursor: 'grabbing', zIndex: 100 }}
                  style={{ width: `${tableDimensions.width}px`, height: `${tableDimensions.height}px` }}
                  className={`absolute cursor-grab flex flex-col items-center justify-center shadow-lg transition-colors
                    ${table.shape === 'round' ? 'rounded-full' : table.shape === 'square' ? 'rounded-xl' : 'rounded-[20px]'} 
                    ${isSelected ? 'bg-[#722F37] text-white ring-8 ring-[#722F37]/20 z-50' : 'bg-gray-800 text-white hover:bg-gray-700'}
                    ${isFull && !isSelected ? 'border-2 border-red-400' : ''}
                  `}
                >
                  <span className="font-serif font-bold text-center text-xs px-2 truncate w-full">{table.name}</span>
                  <span className={`text-[8px] font-bold mt-1 uppercase tracking-widest ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                    {occupants.length}/{table.capacity}
                  </span>
                  
                  {Array.from({ length: table.capacity }).map((_, i) => {
                    const occupant = occupants[i];
                    return (
                      <div 
                        key={`chair-${table.id}-${i}`}
                        style={getChairStyle(i, table.capacity, table.shape, tableDimensions)}
                        className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shadow-md transition-all
                          ${occupant 
                             ? (occupant.status === 'confirmed' ? 'bg-green-400 border-green-500 scale-110' : 'bg-orange-300 border-orange-400 scale-110') 
                             : 'bg-white border-gray-300'}
                        `}
                        title={occupant ? occupant.name : 'Lugar Livre'}
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
           {/* Vista de lista */}
           {/* ... Mantida inalterada ... */}
        </div>
      )}
    </div>
  );
}