"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { useBrand } from "@/components/site/BrandProvider";
import { supabase } from "@/lib/supabase";
import { Trash2, Edit2, UserPlus, Users, FileText, Download, FileSpreadsheet, Upload, Loader2, ChevronDown, CheckCircle2, X } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { loadImageForPdf, fitLogoBox } from "@/lib/pdfLogo";

interface Guest {
  id: string;
  name: string;
  category: string;
  gender: string;
  side: string;
  status: string;
  group_id?: string;
  dietary_notes?: string;
  notes?: string;
}

interface GuestsModuleDict {
  stats: {
    rsvpSummary: string; totalForecast: string; totalNote: string;
    confirmed: string; pending: string; declined: string;
    byAgeGroup: string; adults: string; children: string; babies: string;
    total: string; confirmedShort: string; pendingShort: string;
    genderDistribution: string; male: string; female: string;
    guestOf: string; manageSideTags: string; sideTagPlaceholder: string; addBtn: string;
    dietaryRestrictions: string; noDietary: string;
    manageDietaryTags: string; dietaryTagPlaceholder: string;
  };
  requests: {
    title: string; description: string; messageLabel: string;
    approveBtn: string; ignoreBtn: string;
  };
  dataTools: {
    title: string; subtitle: string; exportLabel: string;
    exportPdfBtn: string; pdfConfirmed: string; pdfConfirmedPending: string; pdfAll: string;
    excelBtn: string; importLabel: string; downloadTemplateBtn: string; importExcelBtn: string;
  };
  form: {
    title: string; nameLbl: string; categoryLbl: string;
    adult: string; child: string; baby: string;
    genderLbl: string; male: string; female: string;
    sideLbl: string; dietaryLbl: string; notesLbl: string; notesPlaceholder: string;
    groupTagLbl: string; groupTagPlaceholder: string; addAnotherBtn: string; saveBtn: string;
  };
  table: {
    colName: string; colGroup: string; colGender: string; colAge: string;
    colSide: string; colDietary: string; colNotes: string; colStatus: string;
    statusConfirmed: string; statusDeclined: string; statusPending: string;
    categoryAdult: string; categoryChild: string; categoryBaby: string;
  };
  editModal: {
    title: string; fullNameLbl: string; categoryLbl: string; genderLbl: string;
    familyGroupLbl: string; sideTagLbl: string; dietaryLbl: string;
    notesLbl: string; notesPlaceholder: string; statusLbl: string;
    statusPending: string; statusConfirmed: string; statusDeclined: string;
    cancelBtn: string; saveBtn: string; deleteTitle: string; editTitle: string; deleteRowTitle: string;
  };
  importOverlay: { processing: string; wait: string };
  alerts: {
    deleteConfirm: string; deleteError: string; approveError: string;
    importSuccess: string; importDbError: string; importFileError: string;
  };
  pdf: {
    labelAll: string; labelConfirmed: string; labelConfirmedPending: string; labelActive: string;
    headerTitle: string; headerGenerated: string; headerTotal: string;
    colName: string; colGroup: string; colAge: string; colGuestOf: string;
    colDietary: string; colNotes: string; colStatus: string;
    statusConfirmed: string; statusDeclined: string; statusPending: string;
    categoryAdult: string; categoryChild: string; categoryBaby: string;
  };
  excel: {
    colName: string; colGroup: string; colAge: string; colGender: string;
    colGuestOf: string; colDietary: string; colNotes: string; colStatus: string;
    statusConfirmed: string; statusDeclined: string; statusPending: string;
    categoryAdult: string; categoryChild: string; categoryBaby: string;
    genderMale: string; genderFemale: string; sheetName: string;
  };
  template: {
    colName: string; colGroup: string; colAge: string; colGender: string;
    colSide: string; colDietary: string; colNotes: string;
    valAdult: string; valChild: string; valBaby: string;
    valMale: string; valFemale: string; valCommon: string; valGroom: string; valBride: string;
    exampleName: string; exampleGroup: string; exampleDietary: string; exampleNotes: string;
    sheetName: string; filename: string; defaultName: string;
  };
}

interface GuestsModuleProps {
  guests: Guest[];
  setGuests: (guests: Guest[]) => void;
  invitationId: string;
  groomName: string;
  brideName: string;
  canEdit: boolean;
  dict: GuestsModuleDict;
}

const suggestGender = (name: string) => {
  const first = name.trim().split(' ')[0].toLowerCase();
  if (!first) return 'masculino';
  const femaleEndings = ['a', 'ia', 'is', 'iz', 'ne', 'me'];
  if (femaleEndings.some(end => first.endsWith(end)) || ['maria', 'alice', 'beatriz', 'matilde', 'ana'].includes(first)) return 'feminino';
  return 'masculino';
};

export default function GuestsModule({ guests, setGuests, invitationId, groomName, brideName, canEdit, dict }: GuestsModuleProps) {
  const brand = useBrand();
  const [groupTag, setGroupTag] = useState("");
  const [newMembers, setNewMembers] = useState([{ name: "", category: "adult", gender: "masculino", side: "comum", dietary_notes: "", notes: "" }]);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Guest, direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

  const [customSides, setCustomSides] = useState<string[]>(["comum", "noiva", "noivo"]);
  const [newSideLabel, setNewSideLabel] = useState("");

  const [dietaryTags, setDietaryTags] = useState<string[]>([]);
  const [newDietaryTag, setNewDietaryTag] = useState("");

  const [isImporting, setIsImporting] = useState(false);
  const [isPdfMenuOpen, setIsPdfMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requestedGuests = useMemo(() => guests.filter(g => g.status === 'requested'), [guests]);
  const regularGuests = useMemo(() => guests.filter(g => g.status !== 'requested'), [guests]);

  useEffect(() => {
    const fetchInvitationTags = async () => {
      if (!invitationId) return;
      const { data, error } = await supabase
        .from('invitations')
        .select('dietary_tags')
        .eq('id', invitationId)
        .single();
      if (!error && data && data.dietary_tags) {
        setDietaryTags(data.dietary_tags.split(',').map((t: string) => t.trim()).filter(Boolean));
      }
    };
    fetchInvitationTags();
  }, [invitationId]);

  const stats = useMemo(() => {
    const getSubStats = (cat: string) => {
      const filtered = regularGuests.filter(g => g.category === cat && g.status !== 'declined');
      return {
        confirmed: filtered.filter(g => g.status === 'confirmed').length,
        pending: filtered.filter(g => g.status === 'pending').length,
        total: filtered.length
      };
    };
    const getGenderStats = (cat: string, gender: string) => {
      const filtered = regularGuests.filter(g => g.category === cat && g.gender === gender && g.status !== 'declined');
      return {
        confirmed: filtered.filter(g => g.status === 'confirmed').length,
        pending: filtered.filter(g => g.status === 'pending').length
      };
    };
    return {
      rsvp: {
        total: regularGuests.length,
        active: regularGuests.filter(g => g.status !== 'declined').length,
        confirmed: regularGuests.filter(g => g.status === 'confirmed').length,
        pending: regularGuests.filter(g => g.status === 'pending').length,
        declined: regularGuests.filter(g => g.status === 'declined').length
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
      sides: regularGuests.reduce((acc, g) => {
        if (g.status !== 'declined') {
          if (!acc[g.side]) acc[g.side] = { total: 0, confirmed: 0, pending: 0 };
          acc[g.side].total++;
          if (g.status === 'confirmed') acc[g.side].confirmed++;
          if (g.status === 'pending') acc[g.side].pending++;
        }
        return acc;
      }, {} as Record<string, { total: number, confirmed: number, pending: number }>),
      dietary: regularGuests.reduce((acc, g) => {
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
  }, [regularGuests]);

  const sortedGuests = useMemo(() => {
    let items = [...regularGuests];
    items.sort((a, b) => {
      const aV = String(a[sortConfig.key] || "").toLowerCase();
      const bV = String(b[sortConfig.key] || "").toLowerCase();
      return sortConfig.direction === 'asc' ? aV.localeCompare(bV) : bV.localeCompare(aV);
    });
    return items;
  }, [regularGuests, sortConfig]);

  const COLUMN_LABELS: Record<string, string> = {
    name: dict.table.colName,
    group_id: dict.table.colGroup,
    gender: dict.table.colGender,
    category: dict.table.colAge,
    side: dict.table.colSide,
    dietary_notes: dict.table.colDietary,
    notes: dict.table.colNotes,
    status: dict.table.colStatus,
  };

  const resolvePdfCategory = (cat: string) =>
    cat === 'adult' ? dict.pdf.categoryAdult : cat === 'child' ? dict.pdf.categoryChild : dict.pdf.categoryBaby;

  const resolvePdfStatus = (status: string) =>
    status === 'confirmed' ? dict.pdf.statusConfirmed : status === 'declined' ? dict.pdf.statusDeclined : dict.pdf.statusPending;

  const exportToPDF = async (type: 'confirmed' | 'confirmed_pending' | 'all') => {
    const doc = new jsPDF();
    const websiteUrl = "https://digitalinvitestudio.com";
    const p = dict.pdf;

    let list = regularGuests;
    let label = p.labelAll;
    if (type === 'confirmed') { list = regularGuests.filter(g => g.status === 'confirmed'); label = p.labelConfirmed; }
    else if (type === 'confirmed_pending') { list = regularGuests.filter(g => g.status === 'confirmed' || g.status === 'pending'); label = p.labelConfirmedPending; }
    else { list = regularGuests.filter(g => g.status !== 'declined'); label = p.labelActive; }

    let contentY = 32;
    try {
      // Carregado via fetch→data URL (evita canvas "tainted" com logos de outra origem).
      const { dataUrl, width, height, format } = await loadImageForPdf(brand.logoRaster);
      const { width: logoWidth, height: logoHeight } = fitLogoBox(width, height);
      doc.addImage(dataUrl, format, 14, 10, logoWidth, logoHeight);
      doc.link(14, 10, logoWidth, logoHeight, { url: websiteUrl });
      contentY = 10 + logoHeight + 12;
    } catch {
      doc.setFontSize(16); doc.setTextColor(99, 1, 0); doc.setFont("helvetica", "bold");
      doc.text(brand.name.toUpperCase(), 14, 20);
      doc.link(14, 14, 70, 8, { url: websiteUrl });
      doc.setFont("helvetica", "normal"); contentY = 35;
    }

    doc.setFontSize(12); doc.setTextColor(50, 50, 50);
    doc.text(`${p.headerTitle}: ${label}`, 14, contentY);
    doc.setFontSize(9); doc.setTextColor(100, 100, 100);
    doc.text(`${brideName} & ${groomName} | ${p.headerGenerated}: ${new Date().toLocaleDateString()} | ${p.headerTotal}: ${list.length}`, 14, contentY + 6);

    const tableData: string[][] = list.map(g => [
      g.name ? String(g.name) : "-",
      g.group_id && !g.group_id.includes('SOLO-') ? String(g.group_id) : "-",
      resolvePdfCategory(g.category),
      g.side === 'noiva' ? String(brideName) : g.side === 'noivo' ? String(groomName) : (g.side ? String(g.side) : "-"),
      g.dietary_notes || "-",
      g.notes || "-",
      resolvePdfStatus(g.status)
    ]);

    autoTable(doc, {
      startY: contentY + 12,
      head: [[p.colName, p.colGroup, p.colAge, p.colGuestOf, p.colDietary, p.colNotes, p.colStatus]],
      body: tableData,
      headStyles: { fillColor: [99, 1, 0], textColor: [239, 223, 187] },
      alternateRowStyles: { fillColor: [253, 251, 247] },
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 3 }
    });

    doc.save(`lista_convidados_${invitationId.slice(0, 5)}.pdf`);
    setIsPdfMenuOpen(false);
  };

  const resolveExcelCategory = (cat: string) => {
    const e = dict.excel;
    return cat === 'adult' ? e.categoryAdult : cat === 'child' ? e.categoryChild : e.categoryBaby;
  };

  const resolveExcelGender = (gender: string) =>
    gender === 'masculino' ? dict.excel.genderMale : dict.excel.genderFemale;

  const resolveExcelStatus = (status: string) => {
    const e = dict.excel;
    return status === 'confirmed' ? e.statusConfirmed : status === 'declined' ? e.statusDeclined : e.statusPending;
  };

  const exportToExcel = () => {
    const e = dict.excel;
    const ws = XLSX.utils.json_to_sheet(regularGuests.map(g => ({
      [e.colName]: g.name,
      [e.colGroup]: g.group_id?.includes('SOLO-') ? '-' : g.group_id,
      [e.colAge]: resolveExcelCategory(g.category),
      [e.colGender]: resolveExcelGender(g.gender),
      [e.colGuestOf]: g.side === 'noiva' ? brideName : g.side === 'noivo' ? groomName : g.side,
      [e.colDietary]: g.dietary_notes || "-",
      [e.colNotes]: g.notes || "-",
      [e.colStatus]: resolveExcelStatus(g.status)
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, e.sheetName);
    XLSX.writeFile(wb, `lista_convidados_${invitationId.slice(0, 5)}.xlsx`);
  };

  const downloadTemplate = () => {
    const t = dict.template;
    const data = [
      [t.colName, t.colGroup, t.colAge, t.colGender, t.colSide, t.colDietary, t.colNotes],
      [t.exampleName, t.exampleGroup, t.valAdult, t.valFemale, t.valBride, t.exampleDietary, t.exampleNotes]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t.sheetName);
    XLSX.writeFile(wb, t.filename);
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
        const t = dict.template;

        const toInsert = data.map(row => {
          const rawCat = row[t.colAge] || "";
          const category = rawCat === t.valBaby ? 'baby' : rawCat === t.valChild ? 'child' : 'adult';

          const rawGender = row[t.colGender] || "";
          const gender = rawGender === t.valMale ? 'masculino' : rawGender === t.valFemale ? 'feminino' : suggestGender(row[t.colName] || "");

          const rawSide = row[t.colSide] || t.valCommon;
          const sideMap: Record<string, string> = { [t.valCommon]: "comum", [t.valGroom]: "noivo", [t.valBride]: "noiva" };
          const side = sideMap[rawSide] || rawSide;

          return {
            invitation_id: invitationId,
            name: row[t.colName] || t.defaultName,
            group_id: row[t.colGroup] || `SOLO-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
            category, gender, side,
            dietary_notes: row[t.colDietary] || "",
            notes: row[t.colNotes] || "",
            status: 'pending'
          };
        });

        const { data: inserted, error } = await supabase.from("guests").insert(toInsert).select();
        if (!error && inserted) {
          setGuests([...guests, ...inserted]);
          alert(`${inserted.length} ${dict.alerts.importSuccess}`);
        } else {
          alert(dict.alerts.importDbError);
        }
      } catch {
        alert(dict.alerts.importFileError);
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
      name: m.name, category: m.category, gender: m.gender,
      side: m.side, dietary_notes: m.dietary_notes, notes: m.notes, status: 'pending'
    }));

    const { data, error } = await supabase.from("guests").insert(toInsert).select();
    if (!error && data) {
      setGuests([...guests, ...data]);
      setGroupTag("");
      setNewMembers([{ name: "", category: "adult", gender: "masculino", side: "comum", dietary_notes: "", notes: "" }]);
    }
  };

  const handleDeleteGuest = async (id: string) => {
    if (!canEdit || !confirm(dict.alerts.deleteConfirm)) return;
    const { error } = await supabase.from("guests").delete().eq("id", id);
    if (!error) { setGuests(guests.filter(g => g.id !== id)); setEditingGuest(null); }
    else alert(dict.alerts.deleteError);
  };

  const handleApproveRequest = async (id: string) => {
    if (!canEdit) return;
    const { error } = await supabase.from("guests").update({ status: 'pending' }).eq("id", id);
    if (!error) setGuests(guests.map(g => g.id === id ? { ...g, status: 'pending' } : g));
    else alert(dict.alerts.approveError);
  };

  const handleAddSide = () => {
    if (!canEdit) return;
    const formatted = newSideLabel.trim().toLowerCase();
    if (formatted && !customSides.includes(formatted)) { setCustomSides([...customSides, formatted]); setNewSideLabel(""); }
  };

  const handleRemoveSide = (sideToRemove: string) => {
    if (!canEdit) return;
    setCustomSides(customSides.filter(s => s !== sideToRemove));
  };

  const handleAddDietaryTag = async () => {
    if (!canEdit) return;
    const formatted = newDietaryTag.trim();
    if (formatted && !dietaryTags.includes(formatted)) {
      const newTags = [...dietaryTags, formatted];
      setDietaryTags(newTags); setNewDietaryTag("");
      await supabase.from('invitations').update({ dietary_tags: newTags.join(',') }).eq('id', invitationId);
    }
  };

  const handleRemoveDietaryTag = async (tagToRemove: string) => {
    if (!canEdit) return;
    const newTags = dietaryTags.filter(t => t !== tagToRemove);
    setDietaryTags(newTags);
    await supabase.from('invitations').update({ dietary_tags: newTags.join(',') }).eq('id', invitationId);
  };

  const inputClass = "w-full bg-transparent border-0 border-b border-gray-200 focus:ring-0 focus:border-brand text-sm text-gray-800 px-0 py-2 transition-colors font-montserrat";
  const labelClass = "text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1 block font-montserrat";
  const s = dict.stats;

  const resolveTableCategory = (cat: string) => {
    const t = dict.table;
    return cat === 'adult' ? t.categoryAdult : cat === 'child' ? t.categoryChild : t.categoryBaby;
  };
  const resolveTableStatus = (status: string) => {
    const t = dict.table;
    return status === 'confirmed' ? t.statusConfirmed : status === 'declined' ? t.statusDeclined : t.statusPending;
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-20 px-4 md:px-0 font-montserrat">

      {/* STATS PANEL */}
      <div className="flex flex-col">

        {/* RSVP HERO CARD */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm mb-6">
          <p className={labelClass}>{s.rsvpSummary}</p>
          <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
            <div className="flex items-center gap-6 w-full md:w-auto border-b md:border-b-0 md:border-r border-gray-50 pb-6 md:pb-0 md:pr-12">
              <div className="flex flex-col">
                <span className="text-base font-bold text-gray-800">{s.totalForecast}</span>
                <span className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">{s.totalNote}</span>
              </div>
              <span className="font-serif text-5xl text-brand leading-none">{stats.rsvp.active}</span>
            </div>
            <div className="flex-1 w-full grid grid-cols-3 gap-4 text-center divide-x divide-gray-50">
              <div className="flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-green-600 mb-1">{stats.rsvp.confirmed}</span>
                <span className="bg-green-50 px-2 py-0.5 rounded text-[9px] uppercase font-bold text-green-700 tracking-widest">{s.confirmed}</span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-yellow-500 mb-1">{stats.rsvp.pending}</span>
                <span className="bg-yellow-50 px-2 py-0.5 rounded text-[9px] uppercase font-bold text-yellow-700 tracking-widest">{s.pending}</span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-red-500 mb-1">{stats.rsvp.declined}</span>
                <span className="bg-red-50 px-2 py-0.5 rounded text-[9px] uppercase font-bold text-red-700 tracking-widest">{s.declined}</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM GRID (4 CARDS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* AGE GROUP CARD */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col">
            <p className={labelClass}>{s.byAgeGroup}</p>
            <div className="mt-4 space-y-4 flex-1">
              {[
                { label: s.adults, data: stats.adults },
                { label: s.children, data: stats.children },
                { label: s.babies, data: stats.babies }
              ].map(item => (
                <div key={item.label} className="flex flex-col border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-gray-800">{item.label}</span>
                    <span className="text-sm font-serif italic text-gray-600">{s.total}: {item.data.total}</span>
                  </div>
                  <div className="flex gap-4 text-[11px] font-medium text-gray-500">
                    <span className="text-green-600 bg-green-50 px-1.5 rounded">{item.data.confirmed} {s.confirmedShort}</span>
                    <span className="text-yellow-600 bg-yellow-50 px-1.5 rounded">{item.data.pending} {s.pendingShort}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GENDER CARD */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col">
            <p className={labelClass}>{s.genderDistribution}</p>
            <div className="mt-4 space-y-4 flex-1">
              {[
                { label: s.adults, m: stats.adultsM, f: stats.adultsF },
                { label: s.children, m: stats.childrenM, f: stats.childrenF },
                { label: s.babies, m: stats.babiesM, f: stats.babiesF }
              ].map(item => (
                <div key={item.label} className="flex flex-col border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                  <span className="text-xs font-bold text-gray-800 mb-2">{item.label}</span>
                  <div className="space-y-1.5 text-[11px] font-medium">
                    <div className="flex items-center justify-between bg-blue-50/50 px-2 py-1 rounded">
                      <span className="text-blue-700 font-bold">{s.male}</span>
                      <span className="text-blue-600">{item.m.confirmed} {s.confirmedShort} | {item.m.pending} {s.pendingShort}</span>
                    </div>
                    <div className="flex items-center justify-between bg-pink-50/50 px-2 py-1 rounded">
                      <span className="text-pink-700 font-bold">{s.female}</span>
                      <span className="text-pink-600">{item.f.confirmed} {s.confirmedShort} | {item.f.pending} {s.pendingShort}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SIDES CARD */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col">
            <p className={labelClass}>{s.guestOf}</p>
            <div className="mt-4 space-y-4 max-h-[180px] overflow-y-auto custom-scrollbar pr-1 flex-1">
              {customSides.map(side => {
                const sideData = stats.sides[side] || { total: 0, confirmed: 0, pending: 0 };
                if (sideData.total === 0) return null;
                return (
                  <div key={side} className="flex flex-col border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold uppercase text-brand">
                        {side === 'noiva' ? brideName : side === 'noivo' ? groomName : side}
                      </span>
                      <span className="text-sm font-serif italic text-gray-600">{s.total}: {sideData.total}</span>
                    </div>
                    <div className="flex gap-4 text-[11px] font-medium">
                      <span className="text-green-600 bg-green-50 px-1.5 rounded">{sideData.confirmed} {s.confirmedShort}</span>
                      <span className="text-yellow-600 bg-yellow-50 px-1.5 rounded">{sideData.pending} {s.pendingShort}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="pt-4 mt-auto">
              <div className="p-4 bg-cream rounded-xl border border-gold-soft/50 space-y-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-brand mb-1 block font-montserrat">{s.manageSideTags}</p>
                <div className="flex gap-2">
                  <input className="flex-grow bg-transparent border-0 border-b border-gray-200 text-xs py-1 focus:ring-0 focus:border-brand" placeholder={s.sideTagPlaceholder} value={newSideLabel} onChange={(e) => setNewSideLabel(e.target.value)} />
                  <button type="button" onClick={handleAddSide} className="text-[10px] font-bold text-brand uppercase">{s.addBtn}</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {customSides.map(sv => (
                    <span key={sv} className="bg-white border border-gold-soft/50 text-[8px] font-bold uppercase px-2 py-1 rounded-md text-brand flex items-center gap-2">
                      {sv === 'noiva' ? brideName : sv === 'noivo' ? groomName : sv}
                      <button type="button" onClick={() => handleRemoveSide(sv)} className="hover:text-red-500"><X size={10} strokeWidth={3} /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* DIETARY CARD */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col">
            <p className={labelClass}>{s.dietaryRestrictions}</p>
            <div className="mt-4 space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-1 flex-1">
              {Object.entries(stats.dietary).length === 0 && (
                <p className="text-[10px] text-gray-400 italic uppercase tracking-widest text-center py-4">{s.noDietary}</p>
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
                <p className="text-[9px] font-bold uppercase tracking-widest text-orange-600 mb-1 block font-montserrat">{s.manageDietaryTags}</p>
                <div className="flex gap-2">
                  <input className="flex-grow bg-transparent border-0 border-b border-gray-200 text-xs py-1 focus:ring-0 focus:border-orange-500" placeholder={s.dietaryTagPlaceholder} value={newDietaryTag} onChange={(e) => setNewDietaryTag(e.target.value)} />
                  <button type="button" onClick={handleAddDietaryTag} className="text-[10px] font-bold text-orange-600 uppercase">{s.addBtn}</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {dietaryTags.map(t => (
                    <span key={t} className="bg-white border border-orange-200 text-[8px] font-bold uppercase px-2 py-1 rounded-md text-orange-600 flex items-center gap-2">
                      {t}
                      <button type="button" onClick={() => handleRemoveDietaryTag(t)} className="hover:text-red-500"><X size={10} strokeWidth={3} /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ACCESS REQUESTS */}
      {requestedGuests.length > 0 && (
        <div className="bg-orange-50/50 p-6 md:p-8 rounded-[2rem] border-2 border-orange-200 shadow-sm flex flex-col mt-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
            <h3 className="font-serif text-2xl text-brand italic">{dict.requests.title} ({requestedGuests.length})</h3>
          </div>
          <p className="text-sm text-gray-600 mb-6 font-medium">{dict.requests.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {requestedGuests.map(req => (
              <div key={req.id} className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-gray-800 text-lg">{req.name}</h4>
                  {req.notes && (
                    <div className="mt-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-widest">{dict.requests.messageLabel}</p>
                      <p className="text-xs text-gray-600 italic">"{req.notes}"</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-5 pt-4 border-t border-gray-50">
                  <button onClick={() => handleApproveRequest(req.id)} className="flex-1 bg-green-50 text-green-700 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all flex items-center justify-center gap-2"><CheckCircle2 size={14} /> {dict.requests.approveBtn}</button>
                  <button onClick={() => handleDeleteGuest(req.id)} className="flex-1 bg-red-50 text-red-700 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"><Trash2 size={14} /> {dict.requests.ignoreBtn}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DATA TOOLS */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="bg-brand/5 p-3 rounded-2xl text-brand"><FileSpreadsheet size={24} /></div>
          <div>
            <h4 className="text-sm font-bold text-gray-800">{dict.dataTools.title}</h4>
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{dict.dataTools.subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-end justify-center md:justify-end gap-6 w-full md:w-auto">
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand text-center md:text-left">{dict.dataTools.exportLabel}</span>
            <div className="flex gap-2">
              <div className="relative">
                <button onClick={() => setIsPdfMenuOpen(!isPdfMenuOpen)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
                  <FileText size={14} /> {dict.dataTools.exportPdfBtn} <ChevronDown size={12} className={`transition-transform ${isPdfMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isPdfMenuOpen && (
                  <div className="absolute top-full mt-2 left-0 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl z-[100] p-2 animate-in fade-in slide-in-from-top-2">
                    <button onClick={() => exportToPDF('confirmed')} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-50 rounded-xl flex items-center gap-2 transition-colors"><CheckCircle2 size={12} className="text-green-500" /> {dict.dataTools.pdfConfirmed}</button>
                    <button onClick={() => exportToPDF('confirmed_pending')} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-50 rounded-xl flex items-center gap-2 transition-colors"><Loader2 size={12} className="text-yellow-500" /> {dict.dataTools.pdfConfirmedPending}</button>
                    <button onClick={() => exportToPDF('all')} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-50 rounded-xl flex items-center gap-2 transition-colors"><Users size={12} className="text-blue-500" /> {dict.dataTools.pdfAll}</button>
                  </div>
                )}
              </div>
              <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
                <FileSpreadsheet size={14} /> {dict.dataTools.excelBtn}
              </button>
            </div>
          </div>
          <div className="h-10 w-[1px] bg-gray-200 hidden md:block mb-1"></div>
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand text-center md:text-left">{dict.dataTools.importLabel}</span>
            <div className="flex gap-2">
              <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2.5 bg-cream border border-gold-soft rounded-xl text-[10px] font-bold uppercase tracking-widest text-brand hover:bg-[#F8F4E9] transition-all shadow-sm">
                <Download size={14} /> {dict.dataTools.downloadTemplateBtn}
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls, .csv" />
              <button disabled={!canEdit || isImporting} onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-6 py-2.5 bg-brand text-gold-soft rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-md disabled:opacity-50">
                {isImporting ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />} {dict.dataTools.importExcelBtn}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 w-full">

        {/* ADD GUESTS FORM */}
        <div className="w-full">
          <div className={`bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-lg ${!canEdit ? 'opacity-70 pointer-events-none' : ''}`}>
            <h3 className="font-serif text-2xl text-brand mb-6 border-b border-gray-50 pb-4 italic">{dict.form.title}</h3>
            <form onSubmit={handleSaveGroup} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {newMembers.map((m, i) => (
                  <div key={i} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 relative space-y-4">
                    {newMembers.length > 1 && (
                      <button type="button" onClick={() => setNewMembers(newMembers.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-white text-red-500 shadow-sm w-6 h-6 rounded-full flex items-center justify-center font-bold border border-gray-100">✕</button>
                    )}
                    <div>
                      <label className={labelClass}>{dict.form.nameLbl}</label>
                      <input className="w-full bg-transparent border-0 border-b border-gray-200 text-sm font-bold py-1 focus:ring-0 focus:border-brand" value={m.name} onChange={e => {
                        const u = [...newMembers]; u[i].name = e.target.value; u[i].gender = suggestGender(e.target.value); setNewMembers(u);
                      }} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>{dict.form.categoryLbl}</label>
                        <select className="w-full bg-transparent border-0 border-b border-gray-200 text-xs font-medium focus:ring-0" value={m.category} onChange={e => { const u = [...newMembers]; u[i].category = e.target.value; setNewMembers(u); }}>
                          <option value="adult">{dict.form.adult}</option>
                          <option value="child">{dict.form.child}</option>
                          <option value="baby">{dict.form.baby}</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>{dict.form.genderLbl}</label>
                        <select className="w-full bg-transparent border-0 border-b border-gray-200 text-xs font-medium focus:ring-0" value={m.gender} onChange={e => { const u = [...newMembers]; u[i].gender = e.target.value; setNewMembers(u); }}>
                          <option value="masculino">{dict.form.male}</option>
                          <option value="feminino">{dict.form.female}</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>{dict.form.sideLbl}</label>
                      <select className="w-full bg-transparent border-0 border-b border-gray-200 text-[10px] font-bold uppercase focus:ring-0" value={m.side} onChange={e => { const u = [...newMembers]; u[i].side = e.target.value; setNewMembers(u); }}>
                        {customSides.map(sv => <option key={sv} value={sv}>{sv === 'noiva' ? brideName : sv === 'noivo' ? groomName : sv.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>{dict.form.dietaryLbl}</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {dietaryTags.map(tag => {
                          const currentTags = m.dietary_notes ? m.dietary_notes.split(',').filter(Boolean) : [];
                          const isSelected = currentTags.includes(tag);
                          return (
                            <button key={tag} type="button" onClick={() => {
                              let newTags = [...currentTags];
                              if (isSelected) newTags = newTags.filter(t => t !== tag); else newTags.push(tag);
                              const u = [...newMembers]; u[i].dietary_notes = newTags.join(','); setNewMembers(u);
                            }} className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase transition-colors border ${isSelected ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-gray-200 text-gray-400 hover:border-orange-200 hover:text-orange-500'}`}>
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>{dict.form.notesLbl}</label>
                      <input className="w-full bg-transparent border-0 border-b border-gray-200 text-xs py-1 focus:ring-0 focus:border-brand italic" placeholder={dict.form.notesPlaceholder} value={m.notes} onChange={e => { const u = [...newMembers]; u[i].notes = e.target.value; setNewMembers(u); }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4 border-t border-gray-50">
                <div>
                  <label className={labelClass}>{dict.form.groupTagLbl}</label>
                  <input className="w-full bg-transparent border-0 border-b border-gray-200 focus:ring-0 focus:border-brand text-sm text-gray-800 px-0 py-2.5 transition-colors font-montserrat" placeholder={dict.form.groupTagPlaceholder} value={groupTag} onChange={e => setGroupTag(e.target.value)} />
                </div>
                <div>
                  <button type="button" onClick={() => setNewMembers([...newMembers, { name: "", category: "adult", gender: "masculino", side: "comum", dietary_notes: "", notes: "" }])} className="w-full py-3.5 border-2 border-dashed border-gray-200 rounded-xl text-[9px] font-black uppercase text-gray-400 hover:border-brand hover:text-brand transition-all flex items-center justify-center gap-2 tracking-widest"><UserPlus size={14} /> {dict.form.addAnotherBtn}</button>
                </div>
                <div>
                  <button disabled={!canEdit} type="submit" className="w-full bg-brand text-gold-soft py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50">{dict.form.saveBtn}</button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* GUESTS TABLE */}
        <div className="w-full bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {Object.keys(COLUMN_LABELS).map((k) => (
                    <th key={k} onClick={() => setSortConfig({ key: k as keyof Guest, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })} className="px-3 py-4 text-[10px] uppercase font-black text-gray-400 cursor-pointer hover:text-brand tracking-widest">
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
                    <td className="px-3 py-4 text-[10px] uppercase font-bold text-gray-500">{resolveTableCategory(g.category)}</td>
                    <td className="px-3 py-4 text-[10px] uppercase font-black text-brand">
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
                    <td className="px-3 py-4 text-[10px] text-gray-500 truncate max-w-[150px] italic" title={g.notes}>
                      {g.notes ? g.notes : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-3 py-4">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${g.status === 'confirmed' ? 'bg-green-100 text-green-700' : g.status === 'declined' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {resolveTableStatus(g.status)}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-right">
                      {canEdit && (
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => setEditingGuest(g)} className="text-gray-400 hover:text-blue-600 transition-colors" title={dict.editModal.editTitle}><Edit2 size={16} /></button>
                          <button onClick={() => handleDeleteGuest(g.id)} className="text-gray-400 hover:text-red-600 transition-colors" title={dict.editModal.deleteRowTitle}><Trash2 size={16} /></button>
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

      {/* EDIT MODAL */}
      {editingGuest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg p-10 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-8 border-b border-gray-50 pb-4">
              <h3 className="font-serif text-3xl text-brand italic">{dict.editModal.title}</h3>
              <button onClick={() => handleDeleteGuest(editingGuest.id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors" title={dict.editModal.deleteTitle}>
                <Trash2 size={18} />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className={labelClass}>{dict.editModal.fullNameLbl}</label>
                <input className={inputClass} value={editingGuest.name} onChange={e => setEditingGuest({ ...editingGuest, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>{dict.editModal.categoryLbl}</label>
                  <select className={inputClass} value={editingGuest.category} onChange={e => setEditingGuest({ ...editingGuest, category: e.target.value })}>
                    <option value="adult">{dict.form.adult}</option>
                    <option value="child">{dict.form.child}</option>
                    <option value="baby">{dict.form.baby}</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{dict.editModal.genderLbl}</label>
                  <select className={inputClass} value={editingGuest.gender} onChange={e => setEditingGuest({ ...editingGuest, gender: e.target.value })}>
                    <option value="masculino">{dict.form.male}</option>
                    <option value="feminino">{dict.form.female}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>{dict.editModal.familyGroupLbl}</label>
                  <input className={inputClass} value={editingGuest.group_id} onChange={e => setEditingGuest({ ...editingGuest, group_id: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>{dict.editModal.sideTagLbl}</label>
                  <select className={inputClass} value={editingGuest.side} onChange={e => setEditingGuest({ ...editingGuest, side: e.target.value })}>
                    {customSides.map(sv => <option key={sv} value={sv}>{sv === 'noiva' ? brideName : sv === 'noivo' ? groomName : sv.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>{dict.editModal.dietaryLbl}</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {dietaryTags.map(tag => {
                    const currentTags = editingGuest.dietary_notes ? editingGuest.dietary_notes.split(',').filter(Boolean) : [];
                    const isSelected = currentTags.includes(tag);
                    return (
                      <button key={tag} type="button" onClick={() => {
                        let newTags = [...currentTags];
                        if (isSelected) newTags = newTags.filter(t => t !== tag); else newTags.push(tag);
                        setEditingGuest({ ...editingGuest, dietary_notes: newTags.join(',') });
                      }} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors border ${isSelected ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-gray-200 text-gray-400 hover:border-orange-200 hover:text-orange-500'}`}>
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className={labelClass}>{dict.editModal.notesLbl}</label>
                <textarea className={`${inputClass} resize-none italic`} rows={2} placeholder={dict.editModal.notesPlaceholder} value={editingGuest.notes || ''} onChange={e => setEditingGuest({ ...editingGuest, notes: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>{dict.editModal.statusLbl}</label>
                <select className={inputClass} value={editingGuest.status} onChange={e => setEditingGuest({ ...editingGuest, status: e.target.value })}>
                  <option value="pending">{dict.editModal.statusPending}</option>
                  <option value="confirmed">{dict.editModal.statusConfirmed}</option>
                  <option value="declined">{dict.editModal.statusDeclined}</option>
                </select>
              </div>
              <div className="flex gap-4 pt-8">
                <button onClick={() => setEditingGuest(null)} className="w-1/3 text-[10px] font-black uppercase text-gray-400 tracking-widest hover:text-gray-600 transition-colors">{dict.editModal.cancelBtn}</button>
                <button onClick={async () => {
                  await supabase.from("guests").update(editingGuest).eq("id", editingGuest.id);
                  setGuests(guests.map(g => g.id === editingGuest.id ? editingGuest : g));
                  setEditingGuest(null);
                }} className="w-2/3 py-5 bg-brand text-gold-soft rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all active:scale-95">{dict.editModal.saveBtn}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT OVERLAY */}
      {isImporting && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-[10000] flex flex-col items-center justify-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 border-4 border-brand/10 border-t-brand rounded-full animate-spin"></div>
            <Upload className="absolute inset-0 m-auto text-brand" size={32} />
          </div>
          <p className="font-serif text-2xl text-brand italic">{dict.importOverlay.processing}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mt-2">{dict.importOverlay.wait}</p>
        </div>
      )}
    </div>
  );
}
