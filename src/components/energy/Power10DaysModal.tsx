import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useCMMS } from '../../context/CMMSContext';
import { Power10Days } from '../../types/cmms';
import { isAdminLevel } from '../../utils/cmmsLogic';
import { NumericInput } from '../common/NumericInput';
import {
  X,
  Zap,
  Sun,
  CheckCircle2,
  AlertTriangle,
  User,
  Building2,
  Factory,
  Cpu,
  ShieldCheck,
} from 'lucide-react';

interface Power10DaysModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRecord?: Power10Days | null;
}

export const Power10DaysModal: React.FC<Power10DaysModalProps> = ({
  isOpen,
  onClose,
  editingRecord = null,
}) => {
  const { currentUser, addPower10DaysRecord, updatePower10DaysRecord } = useCMMS();
  const isAdmin = isAdminLevel(currentUser);
  const isEditMode = Boolean(editingRecord && isAdmin);

  // Đề xuất chu kỳ mới nhất tiếp theo
  const nextPeriodSuggestion = useMemo(() => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const y = d.getFullYear();
    const day = d.getDate();
    let p = '01-10';
    let tu = `${y}-${m}-01`;
    let den = `${y}-${m}-10`;
    if (day > 20) {
      p = '21-31';
      tu = `${y}-${m}-21`;
      den = `${y}-${m}-31`;
    } else if (day > 10) {
      p = '11-20';
      tu = `${y}-${m}-11`;
      den = `${y}-${m}-20`;
    }
    return {
      chuKy: `${m}/${y}-${p}`,
      tuNgay: tu,
      denNgay: den,
    };
  }, []);

  const [chuKy, setChuKy] = useState(nextPeriodSuggestion.chuKy);
  const [tuNgay, setTuNgay] = useState(nextPeriodSuggestion.tuNgay);
  const [denNgay, setDenNgay] = useState(nextPeriodSuggestion.denNgay);
  const [ngayLamViec, setNgayLamViec] = useState<number>(10);
  const [loaiCa, setLoaiCa] = useState<string>('Ca 2');
  const [nguoiChot, setNguoiChot] = useState<string>(currentUser.tenNhanVien || 'Khiêm Huỳnh');

  // EVN 3 Khung Giờ (kWh)
  const [evnBT, setEvnBT] = useState<number>(75000);
  const [evnCD, setEvnCD] = useState<number>(32000);
  const [evnTD, setEvnTD] = useState<number>(18000);

  // Solar 2 Khung Giờ (kWh)
  const [solarBT, setSolarBT] = useState<number>(24000);
  const [solarCD, setSolarCD] = useState<number>(11000);

  // 1. Phân hệ Utility = U_Chiller + U_mChiller + U_Comp + U_Pump + U_Cooling + U_Other
  const [uChiller, setUChiller] = useState<number>(42000);
  const [uMChiller, setUMChiller] = useState<number>(4500);
  const [uComp, setUComp] = useState<number>(21500);
  const [uPump, setUPump] = useState<number>(8500);
  const [uCooling, setUCooling] = useState<number>(6800);
  const [uOther, setUOther] = useState<number>(2200);

  // 2. Phân hệ Production = P_Lighting + P_ACMV + P_Equipment
  const [pLighting, setPLighting] = useState<number>(5400);
  const [pAcmv, setPAcmv] = useState<number>(18500);
  const [pEquipment, setPEquipment] = useState<number>(31200);

  // 3. Phân hệ Office = O_ACMV + O_Socket + O_Kit + O_Server + O_Lighting
  const [oAcmv, setOAcmv] = useState<number>(5800);
  const [oSocket, setOSocket] = useState<number>(3200);
  const [oKit, setOKit] = useState<number>(1800);
  const [oServer, setOServer] = useState<number>(5200);
  const [oLighting, setOLighting] = useState<number>(3500);

  const [activeAreaTab, setActiveAreaTab] = useState<'ALL' | 'UTILITY' | 'PRODUCTION' | 'OFFICE'>('ALL');
  const [errorMsg, setErrorMsg] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const initializedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      initializedKeyRef.current = null;
      return;
    }
    const nextKey = editingRecord ? `edit:${editingRecord.id}` : 'new';
    if (initializedKeyRef.current === nextKey) return;
    initializedKeyRef.current = nextKey;

    setErrorMsg('');
    setSavedSuccess(false);
    if (editingRecord) {
      setChuKy(editingRecord.chuKy);
      setTuNgay(editingRecord.tuNgay);
      setDenNgay(editingRecord.denNgay);
      setNgayLamViec(editingRecord.ngayLamViec);
      setLoaiCa(editingRecord.loaiCa);
      setNguoiChot(editingRecord.nguoiChot || currentUser.tenNhanVien || 'Khiêm Huỳnh');
      setEvnBT(editingRecord.evnBT);
      setEvnCD(editingRecord.evnCD);
      setEvnTD(editingRecord.evnTD);
      setSolarBT(editingRecord.solarBT);
      setSolarCD(editingRecord.solarCD);
      setUChiller(editingRecord.uChiller);
      setUMChiller(editingRecord.uMChiller);
      setUComp(editingRecord.uComp);
      setUPump(editingRecord.uPump);
      setUCooling(editingRecord.uCooling);
      setUOther(editingRecord.uOther);
      setPLighting(editingRecord.pLighting);
      setPAcmv(editingRecord.pAcmv);
      setPEquipment(editingRecord.pEquipment);
      setOAcmv(editingRecord.oAcmv);
      setOSocket(editingRecord.oSocket);
      setOKit(editingRecord.oKit);
      setOServer(editingRecord.oServer);
      setOLighting(editingRecord.oLighting);
    } else {
      setChuKy(nextPeriodSuggestion.chuKy);
      setTuNgay(nextPeriodSuggestion.tuNgay);
      setDenNgay(nextPeriodSuggestion.denNgay);
      setNgayLamViec(10);
      setLoaiCa('Ca 2');
      setNguoiChot(currentUser.tenNhanVien || 'Khiêm Huỳnh');
      setEvnBT(75000);
      setEvnCD(32000);
      setEvnTD(18000);
      setSolarBT(24000);
      setSolarCD(11000);
      setUChiller(42000);
      setUMChiller(4500);
      setUComp(21500);
      setUPump(8500);
      setUCooling(6800);
      setUOther(2200);
      setPLighting(5400);
      setPAcmv(18500);
      setPEquipment(31200);
      setOAcmv(5800);
      setOSocket(3200);
      setOKit(1800);
      setOServer(5200);
      setOLighting(3500);
    }
  }, [isOpen, editingRecord, nextPeriodSuggestion, currentUser.tenNhanVien]);

  if (!isOpen) return null;

  // Tính tổng EVN, Solar & Chu kỳ
  const totalEvn = evnBT + evnCD + evnTD;
  const totalSolar = solarBT + solarCD;
  const grandTotal = totalEvn + totalSolar;
  const tbNgay = ngayLamViec > 0 ? Math.round(grandTotal / ngayLamViec) : 0;

  // Tính tổng 3 Phân Vùng theo đúng công thức yêu cầu:
  // Utility = U_Chiller + U_mChiller + U_Comp + U_Pump + U_Cooling + U_Other
  const totalUtility = uChiller + uMChiller + uComp + uPump + uCooling + uOther;

  // Production = P_Lighting + P_ACMV + P_Equipment
  const totalProduction = pLighting + pAcmv + pEquipment;

  // Office = O_ACMV + O_Socket + O_Kit + O_Server + O_Lighting
  const totalOffice = oAcmv + oSocket + oKit + oServer + oLighting;

  const totalAllAreas = totalUtility + totalProduction + totalOffice;
  const areaDifference = totalAllAreas - grandTotal;
  const diffPct = grandTotal > 0 ? (areaDifference / grandTotal) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (editingRecord && !isAdmin) {
      setErrorMsg('Chỉ tài khoản Admin mới có quyền chỉnh sửa dữ liệu chu kỳ 10 ngày.');
      return;
    }

    if (grandTotal <= 0) {
      setErrorMsg('Tổng sản lượng điện chu kỳ phải lớn hơn 0 kWh!');
      return;
    }

    const now = new Date();
    const thoiGianLuu = editingRecord?.thoiGianLuu || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const payload: Omit<Power10Days, 'id'> = {
      thoiGianLuu,
      chuKy,
      tuNgay,
      denNgay,
      ngayLamViec,
      loaiCa,
      tbNgayKwh: tbNgay,
      evnBT,
      evnCD,
      evnTD,
      solarBT,
      solarCD,
      pLighting,
      pAcmv,
      pEquipment,
      uChiller,
      uMChiller,
      uComp,
      uPump,
      uCooling,
      uOther,
      oAcmv,
      oSocket,
      oKit,
      oServer,
      oLighting,
      nguoiChot,
    };

    if (editingRecord && isAdmin) {
      updatePower10DaysRecord({ ...editingRecord, ...payload });
    } else {
      addPower10DaysRecord(payload);
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-md">
              <Zap className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-base">
                  {isEditMode
                    ? `Chỉnh Sửa Số Điện Chu Kỳ 10 Ngày (${editingRecord?.chuKy})`
                    : 'Chốt Chỉ Số Điện Chu Kỳ 10 Ngày (Sheet Dien_10_Ngay)'}
                </h3>
                {isEditMode && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    Admin Only
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                EVN &amp; Solar theo khung giờ (BT, CĐ, TĐ) • 3 Phân hệ: Utility, Production, Office
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-xl p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {savedSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Đã lưu thành công chu kỳ điện {chuKy} vào hệ thống!</span>
            </div>
          )}

          {/* KHỐI 1: Thông tin chu kỳ vận hành */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wide block">
              1. Thông Tin Chu Kỳ & Điều Kiện Vận Hành
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-300">Tên Chu Kỳ (MM/YYYY-DD1-DD2)</label>
                <input
                  type="text"
                  value={chuKy}
                  onChange={(e) => setChuKy(e.target.value)}
                  placeholder="11/2026-01-10"
                  required
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Từ Ngày</label>
                <input
                  type="date"
                  value={tuNgay}
                  onChange={(e) => setTuNgay(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Đến Ngày</label>
                <input
                  type="date"
                  value={denNgay}
                  onChange={(e) => setDenNgay(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Số Ngày LV</label>
                <NumericInput
                  value={ngayLamViec}
                  onChange={(v) => setNgayLamViec(v)}
                  className="text-center text-xs py-1"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Loại Ca</label>
                <select
                  value={loaiCa}
                  onChange={(e) => setLoaiCa(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Ca 2">Ca 2 (2 ca/ngày)</option>
                  <option value="Ca 3">Ca 3 (3 ca liên tục)</option>
                  <option value="Hành chính">Hành chính (1 ca)</option>
                </select>
              </div>

              {/* Người chốt số */}
              {isEditMode ? (
                <div className="col-span-2 sm:col-span-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30 text-xs">
                  <div className="flex items-center gap-2 flex-1">
                    <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-slate-400 shrink-0">Người chốt số:</span>
                    <input
                      type="text"
                      value={nguoiChot}
                      onChange={(e) => setNguoiChot(e.target.value)}
                      className="flex-1 max-w-xs px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <span className="text-[11px] text-amber-300 font-semibold shrink-0">
                    Đang sửa bởi Admin: {currentUser.tenNhanVien} ({currentUser.maNhanVien})
                  </span>
                </div>
              ) : (
                <div className="col-span-2 sm:col-span-6 flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-slate-400">Người chốt số (Tài khoản đăng nhập):</span>
                    <span className="font-bold text-slate-100">{currentUser.tenNhanVien}</span>
                    <span className="text-[11px] text-slate-400">({currentUser.chucVu})</span>
                  </div>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold border border-slate-700 shrink-0 ml-2">
                    {currentUser.maNhanVien}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* KHỐI 2: Điện EVN & Solar Theo Khung Giờ (3 giá) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lưới Điện EVN */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-cyan-500/20 text-cyan-400">
                    <Zap className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-cyan-400">2.1 Điện Lưới EVN 3 Khung Giờ</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-100">
                  Tổng: {totalEvn.toLocaleString()} kWh
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">EVN Bình Thường</label>
                  <NumericInput
                    value={evnBT}
                    onChange={(v) => setEvnBT(v)}
                    suffix="kWh"
                    className="text-right text-xs py-1"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-amber-300">EVN Cao Điểm</label>
                  <NumericInput
                    value={evnCD}
                    onChange={(v) => setEvnCD(v)}
                    suffix="kWh"
                    className="text-right text-xs py-1"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-emerald-300">EVN Thấp Điểm</label>
                  <NumericInput
                    value={evnTD}
                    onChange={(v) => setEvnTD(v)}
                    suffix="kWh"
                    className="text-right text-xs py-1"
                  />
                </div>
              </div>
            </div>

            {/* Mái Solar Tự Dùng */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-amber-500/20 text-amber-400">
                    <Sun className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-amber-400">2.2 Điện Solar Mái Tự Dùng</span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-300">
                  Tổng: {totalSolar.toLocaleString()} kWh
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Solar Bình Thường</label>
                  <NumericInput
                    value={solarBT}
                    onChange={(v) => setSolarBT(v)}
                    suffix="kWh"
                    className="text-right text-xs py-1"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-amber-300">Solar Cao Điểm</label>
                  <NumericInput
                    value={solarCD}
                    onChange={(v) => setSolarCD(v)}
                    suffix="kWh"
                    className="text-right text-xs py-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* KHỐI 3: Sản Lượng Điện Theo 3 Khu Vực Lớn */}
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-3">
              <div>
                <span className="text-xs font-bold text-slate-100 uppercase tracking-wide block">
                  3. Phân Bổ Sản Lượng Điện Theo 3 Khu Vực Máy Móc
                </span>
                <p className="text-[11px] text-slate-400">
                  Utility (Phụ trợ) • Production (Sản xuất) • Office (Văn phòng)
                </p>
              </div>

              {/* Area Tab Switcher */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveAreaTab('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    activeAreaTab === 'ALL'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tất Cả
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAreaTab('UTILITY')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    activeAreaTab === 'UTILITY'
                      ? 'bg-cyan-600 text-white'
                      : 'text-cyan-400/80 hover:text-cyan-200'
                  }`}
                >
                  Utility ({totalUtility.toLocaleString()} kWh)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAreaTab('PRODUCTION')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    activeAreaTab === 'PRODUCTION'
                      ? 'bg-amber-600 text-white'
                      : 'text-amber-400/80 hover:text-amber-200'
                  }`}
                >
                  Production ({totalProduction.toLocaleString()} kWh)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAreaTab('OFFICE')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    activeAreaTab === 'OFFICE'
                      ? 'bg-purple-600 text-white'
                      : 'text-purple-400/80 hover:text-purple-200'
                  }`}
                >
                  Office ({totalOffice.toLocaleString()} kWh)
                </button>
              </div>
            </div>

            {/* 3.1 Khu Vực Utility */}
            {(activeAreaTab === 'ALL' || activeAreaTab === 'UTILITY') && (
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-cyan-500/20 text-cyan-300">
                      <Cpu className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-bold text-cyan-300">
                      Khu Vực Utility = U_Chiller + U_mChiller + U_Comp + U_Pump + U_Cooling + U_Other
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    {totalUtility.toLocaleString()} kWh
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">U_Chiller</label>
                    <NumericInput
                      value={uChiller}
                      onChange={setUChiller}
                      className="text-right text-xs py-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">U_mChiller</label>
                    <NumericInput
                      value={uMChiller}
                      onChange={setUMChiller}
                      className="text-right text-xs py-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">U_Comp (Khí nén)</label>
                    <NumericInput
                      value={uComp}
                      onChange={setUComp}
                      className="text-right text-xs py-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">U_Pump (Bơm)</label>
                    <NumericInput
                      value={uPump}
                      onChange={setUPump}
                      className="text-right text-xs py-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">U_Cooling (Tháp)</label>
                    <NumericInput
                      value={uCooling}
                      onChange={setUCooling}
                      className="text-right text-xs py-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">U_Other</label>
                    <NumericInput
                      value={uOther}
                      onChange={setUOther}
                      className="text-right text-xs py-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3.2 Khu Vực Production */}
            {(activeAreaTab === 'ALL' || activeAreaTab === 'PRODUCTION') && (
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-amber-500/20 text-amber-300">
                      <Factory className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-bold text-amber-300">
                      Khu Vực Production = P_Lighting + P_ACMV + P_Equipment
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    {totalProduction.toLocaleString()} kWh
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">P_Lighting (Chiếu sáng xưởng)</label>
                    <NumericInput
                      value={pLighting}
                      onChange={setPLighting}
                      className="text-right text-xs py-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">P_ACMV (Điều hòa xưởng SX)</label>
                    <NumericInput
                      value={pAcmv}
                      onChange={setPAcmv}
                      className="text-right text-xs py-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">P_Equipment (Máy móc SX)</label>
                    <NumericInput
                      value={pEquipment}
                      onChange={setPEquipment}
                      className="text-right text-xs py-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3.3 Khu Vực Office */}
            {(activeAreaTab === 'ALL' || activeAreaTab === 'OFFICE') && (
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-purple-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-purple-500/20 text-purple-300">
                      <Building2 className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-bold text-purple-300">
                      Khu Vực Office = O_ACMV + O_Socket + O_Kit + O_Server + O_Lighting
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-300">
                    {totalOffice.toLocaleString()} kWh
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">O_ACMV (ĐH VP)</label>
                    <NumericInput
                      value={oAcmv}
                      onChange={setOAcmv}
                      className="text-right text-xs py-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">O_Socket (Ổ cắm)</label>
                    <NumericInput
                      value={oSocket}
                      onChange={setOSocket}
                      className="text-right text-xs py-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">O_Kit (Bếp/Pantry)</label>
                    <NumericInput
                      value={oKit}
                      onChange={setOKit}
                      className="text-right text-xs py-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">O_Server (Phòng IT)</label>
                    <NumericInput
                      value={oServer}
                      onChange={setOServer}
                      className="text-right text-xs py-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">O_Lighting (Đèn VP)</label>
                    <NumericInput
                      value={oLighting}
                      onChange={setOLighting}
                      className="text-right text-xs py-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* KHỐI 4: Đối Soát Cân Bằng Năng Lượng & Tổng Kết Chu Kỳ */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <span className="text-[11px] text-slate-400 font-bold block">Tổng Tiêu Thụ Chu Kỳ</span>
              <span className="text-xl font-black text-slate-100 font-mono mt-0.5 block">
                {grandTotal.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-400">kWh</span>
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                TB: {tbNgay.toLocaleString()} kWh/ngày ({ngayLamViec} ngày)
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <span className="text-[11px] text-slate-400 font-bold block">Tổng 3 Khu Vực</span>
              <span className="text-xl font-black text-cyan-300 font-mono mt-0.5 block">
                {totalAllAreas.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-400">kWh</span>
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                U: {((totalUtility / (grandTotal || 1)) * 100).toFixed(0)}% • P:{' '}
                {((totalProduction / (grandTotal || 1)) * 100).toFixed(0)}% • O:{' '}
                {((totalOffice / (grandTotal || 1)) * 100).toFixed(0)}%
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <span className="text-[11px] text-slate-400 font-bold block">Độ Lệch Kiểm Tra</span>
              <span
                className={`text-lg font-black font-mono mt-0.5 block ${
                  Math.abs(areaDifference) < 500 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {areaDifference > 0 ? `+${areaDifference.toLocaleString()}` : areaDifference.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-400">kWh</span>
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                Sai số: {diffPct.toFixed(2)}% ({Math.abs(areaDifference) < 500 ? 'Rất tốt' : 'Cần kiểm tra'})
              </span>
            </div>

            <div className="flex flex-col justify-center">
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:brightness-110 text-white shadow-lg transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isEditMode ? 'Cập Nhật Chu Kỳ 10 Ngày' : 'Lưu Số Điện Chu Kỳ 10 Ngày'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full mt-2 py-1 text-center text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
