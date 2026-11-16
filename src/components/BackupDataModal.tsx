import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useCMMS } from '../context/CMMSContext';
import { canAccessBackup } from '../utils/cmmsLogic';
import { exportCombinedMaintenanceWorkbook } from '../utils/excelExport';
import { generateInitialDataTsSource } from '../utils/codeExport';
import {
  X,
  Database,
  Download,
  Upload,
  Calendar,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  HardDrive,
  Cloud,
  FileSpreadsheet,
  FileCode2,
  Copy,
  Check,
} from 'lucide-react';

interface BackupDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BackupScheduleConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // "17:30"
  lastBackupDate?: string;
}

interface LocalSnapshot {
  id: string;
  timestamp: string;
  sizeKb: number;
  recordSummary: string;
  data: any;
}

type PendingConfirmAction = { type: 'restore_snapshot'; snapshot: LocalSnapshot };

export const BackupDataModal: React.FC<BackupDataModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    equipment,
    maintenancePlans,
    maintenanceHistory,
    tickets,
    spareParts,
    stockTransactions,
    power10Days,
    costRecords,
    waterMonthly,
    employees,
    meterReadings,
    documents,
    projects,
    safetyInspections,
    tools,
    toolLogs,
    auditLogs,
    tariffConfig,
    emailConfig,
    emailLogs,
    restoreFullBackup,
    addAuditLog,
    currentUser,
  } = useCMMS();

  const [activeTab, setActiveTab] = useState<'backup' | 'drive' | 'schedule' | 'restore'>('backup');
  const [copiedLink, setCopiedLink] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmAction | null>(null);

  // Schedule config state
  const [scheduleConfig, setScheduleConfig] = useState<BackupScheduleConfig>(() => {
    try {
      const saved = localStorage.getItem('cmms_backup_schedule');
      return saved
        ? JSON.parse(saved)
        : {
            enabled: true,
            frequency: 'daily',
            time: '17:30',
            lastBackupDate: new Date().toISOString().slice(0, 10),
          };
    } catch {
      return { enabled: true, frequency: 'daily', time: '17:30' };
    }
  });

  // Local Snapshots state
  const [snapshots, setSnapshots] = useState<LocalSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem('cmms_backup_snapshots');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    localStorage.setItem('cmms_backup_schedule', JSON.stringify(scheduleConfig));
  }, [scheduleConfig]);

  useEffect(() => {
    localStorage.setItem('cmms_backup_snapshots', JSON.stringify(snapshots));
  }, [snapshots]);

  if (!isOpen || !canAccessBackup(currentUser)) return null;

  // Generate full backup payload
  const createBackupData = () => {
    return {
      version: 'FSM_BACKUP_V1',
      exportedAt: new Date().toISOString(),
      metadata: {
        totalTickets: tickets.length,
        totalSpareParts: spareParts.length,
        totalEquipment: equipment.length,
        totalPower10Days: power10Days.length,
        totalWaterMonths: waterMonthly.length,
        totalEmployees: employees.length,
        totalMeterReadings: meterReadings.length,
        totalDocuments: documents.length,
        totalProjects: projects.length,
        totalSafetyInspections: safetyInspections.length,
        totalTools: tools.length,
      },
      equipment,
      maintenancePlans,
      maintenanceHistory,
      tickets,
      spareParts,
      stockTransactions,
      power10Days,
      costRecords,
      waterMonthly,
      employees,
      meterReadings,
      documents,
      projects,
      safetyInspections,
      tools,
      toolLogs,
      auditLogs,
      tariffConfig,
      emailConfig,
      emailLogs,
    };
  };

  // Execute confirmed snapshot restore action
  const handleExecuteConfirmedAction = () => {
    if (!pendingConfirm) return;
    setRestoreSuccess(null);
    setRestoreError(null);

    const ok = restoreFullBackup(pendingConfirm.snapshot.data);
    if (ok) {
      setRestoreSuccess(
        `Đã khôi phục thành công bản sao lưu lúc ${pendingConfirm.snapshot.timestamp}!`
      );
    } else {
      setRestoreError('Không thể khôi phục dữ liệu từ snapshot này.');
    }
    setPendingConfirm(null);
  };

  // 1-Click Download full JSON backup to user's computer
  const handleDownloadFullBackup = () => {
    const backupObj = createBackupData();
    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FSM_FULL_BACKUP_${dateStr}.json`;
    link.click();
    URL.revokeObjectURL(url);

    // Save snapshot to local snapshot history
    const sizeKb = Math.round(jsonStr.length / 1024);
    const summary = `${tickets.length} Tickets • ${projects.length} Dự án • ${power10Days.length} Kỳ điện • ${waterMonthly.length} Nước • ${spareParts.length} Vật tư`;
    const newSnapshot: LocalSnapshot = {
      id: `SNP-${Date.now()}`,
      timestamp: new Date().toLocaleString('vi-VN'),
      sizeKb,
      recordSummary: summary,
      data: backupObj,
    };
    setSnapshots((prev) => [newSnapshot, ...prev.slice(0, 4)]);

    addAuditLog('Cập nhật', 'Sao Lưu Dữ Liệu', 'Toàn bộ hệ thống', `Xuất file backup về máy tính (${sizeKb} KB)`);
  };

  // 1-Click Export live Cloud/App state directly as src/data/initialData.ts
  const handleDownloadInitialDataTs = () => {
    const tsSource = generateInitialDataTsSource({
      equipment,
      maintenancePlans,
      maintenanceHistory,
      tickets,
      spareParts,
      stockTransactions,
      power10Days,
      costRecords,
      waterMonthly,
      employees,
      meterReadings,
      auditLogs,
      emailConfig,
      emailLogs,
      documents,
      projects,
      safetyInspections,
      tools,
      toolLogs,
    });
    const blob = new Blob([tsSource], { type: 'text/typescript;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'initialData.ts';
    link.click();
    URL.revokeObjectURL(url);

    const sizeKb = Math.round(tsSource.length / 1024);
    addAuditLog(
      'Cập nhật',
      'Đồng Bộ Code',
      'initialData.ts',
      `Xuất file TypeScript initialData.ts từ dữ liệu Cloud (${sizeKb} KB)`
    );
  };

  // Export specific module to CSV
  const handleExportModuleCSV = (moduleName: 'tickets' | 'power10' | 'water' | 'spares' | 'equipment') => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    const filename = `FSM_${moduleName}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (moduleName === 'tickets') {
      headers = ['Mã Ticket', 'Tiêu Đề', 'Mức Độ', 'Trạng Thái', 'Người Phụ Trách', 'Người Lập', 'Ngày Tạo', 'Ngày Hoàn Thành', 'Mô Tả'];
      rows = tickets.map((t) => [t.maTicket, `"${t.tieuDe}"`, t.mucDoUuTien, t.trangThai, `"${t.nguoiPhuTrach}"`, `"${t.nguoiLap}"`, t.ngayTao, t.ngayHoanThanh || '', `"${t.moTaChiTiet}"`]);
    } else if (moduleName === 'power10') {
      headers = ['Chu Kỳ', 'Từ Ngày', 'Đến Ngày', 'Ngày Làm Việc', 'Loại Ca', 'Tổng EVN', 'Tổng Solar', 'Tổng kWh', 'TB/Ngày', 'Người Chốt'];
      rows = power10Days.map((p) => [p.chuKy, p.tuNgay, p.denNgay, p.ngayLamViec, p.loaiCa, p.evnBT + p.evnCD + p.evnTD, p.solarBT + p.solarCD, p.evnBT + p.evnCD + p.evnTD + p.solarBT + p.solarCD, p.tbNgayKwh, `"${p.nguoiChot}"`]);
    } else if (moduleName === 'water') {
      headers = ['Tháng', 'Nước Cấp (m3)', 'Nước Thải 80% (m3)', 'Tiền Nước Cấp (VND)', 'Tiền Nước Cấp (USD)', 'Phí Nước Thải (VND)', 'Phí Nước Thải (USD)'];
      rows = waterMonthly.map((w) => [w.month, w.waterM3, Math.round(w.waterM3 * 0.8 * 10) / 10, w.waterVND, w.waterUSD, w.sewageVND, w.sewageUSD]);
    } else if (moduleName === 'spares') {
      headers = ['Mã Vật Tư', 'Tên Vật Tư', 'Thiết Bị Sử Dụng', 'Đơn Vị', 'Tồn Thực Tế', 'Tồn Tối Thiểu', 'Đơn Giá (VND)', 'Vị Trí Lưu'];
      rows = spareParts.map((s) => [s.maVatTu, `"${s.tenVatTu}"`, `"${s.tenThietBiSuDung}"`, s.donViTinh, s.tonThucTe, s.tonToiThieu, s.donGia, `"${s.viTriLuu}"`]);
    } else if (moduleName === 'equipment') {
      headers = ['Mã Thiết Bị', 'Tên Thiết Bị', 'Hệ Thống', 'Trạng Thái', 'Vị Trí', 'Mức Độ Rủi Ro', 'Tần Suất Bảo Trì'];
      rows = equipment.map((e) => [e.maThietBi, `"${e.tenThietBi}"`, e.heThong, e.trangThai, `"${e.viTri}"`, e.mucDoRuiRo, e.tanSuat]);
    }

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Restore handler from uploaded JSON file
  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreSuccess(null);
    setRestoreError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const ok = restoreFullBackup(parsed);
        if (ok) {
          setRestoreSuccess(`Đã khôi phục thành công toàn bộ hệ thống từ file "${file.name}"!`);
        } else {
          setRestoreError('File không đúng định dạng dữ liệu FACILITY SYSTEM MANAGEMENT hợp lệ.');
        }
      } catch (err) {
        setRestoreError(`Lỗi đọc file JSON: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    reader.readAsText(file);
  };

  // Copy Google Drive link
  const handleCopyDriveLink = () => {
    navigator.clipboard.writeText('https://drive.google.com');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const modalNode = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 dark:bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md">
              <Database className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Trung Tâm Sao Lưu &amp; Khôi Phục Dữ Liệu Hệ Thống
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Lưu trữ an toàn trên trình duyệt • Xuất file JSON / Excel / CSV • Sao lưu thủ công
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-xl p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/40 p-2 gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'backup'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800/60'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            Xuất File Backup
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('drive')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'drive'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800/60'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-300" />
            Lưu Lên Drive (Thủ Công)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'schedule'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />
            Lịch &amp; Snapshot
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('restore')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'restore'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800/60'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" />
            Khôi Phục File JSON
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[76vh] overflow-y-auto">
          {/* Success / Error notification */}
          {restoreSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{restoreSuccess}</span>
            </div>
          )}
          {restoreError && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-300 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span className="break-words">{restoreError}</span>
            </div>
          )}

          {/* TAB 1: XUẤT FILE MÁY TÍNH */}
          {activeTab === 'backup' && (
            <div className="space-y-5">
              {/* Main Full Backup Button */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/50 via-slate-900 to-indigo-950/40 border border-blue-500/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded border border-cyan-800/60">
                      Đầy Đủ 100% Cơ Sở Dữ Liệu
                    </span>
                    <h4 className="text-base font-bold text-slate-100 mt-1">
                      Xuất File Sao Lưu Toàn Bộ Hệ Thống (.JSON)
                    </h4>
                    <p className="text-xs text-slate-400">
                      Gói đầy đủ Tickets, Điện 10 ngày, Nước tháng, Vật tư phụ tùng, Thiết bị, Kiểm định, Dụng cụ, Nhân viên và Cấu hình đơn giá.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadFullBackup}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    Tải Về Máy Tính Ngay
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="text-slate-300">
                    <span className="text-slate-400 text-[10px] block">Sự vụ Tickets:</span>
                    <strong className="text-amber-400">{tickets.length} bản ghi</strong>
                  </div>
                  <div className="text-slate-300">
                    <span className="text-slate-400 text-[10px] block">Điện 10 ngày:</span>
                    <strong className="text-cyan-400">{power10Days.length} chu kỳ</strong>
                  </div>
                  <div className="text-slate-300">
                    <span className="text-slate-400 text-[10px] block">Nước tháng:</span>
                    <strong className="text-emerald-400">{waterMonthly.length} tháng</strong>
                  </div>
                  <div className="text-slate-300">
                    <span className="text-slate-400 text-[10px] block">Vật tư &amp; Thiết bị &amp; TL:</span>
                    <strong className="text-indigo-400">
                      {spareParts.length + equipment.length + documents.length} mục
                    </strong>
                  </div>
                </div>
              </div>

              {/* Export Code initialData.ts */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileCode2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Đồng Bộ Dữ Liệu App Đã Publish Về Code (initialData.ts)
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Tải xuống toàn bộ dữ liệu thực tế hiện tại dưới dạng file mã nguồn TypeScript chuẩn (<code className="font-mono text-cyan-700 dark:text-cyan-300">initialData.ts</code>) để cập nhật dữ liệu gốc trước khi phát triển tính năng mới.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadInitialDataTs}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-cyan-600 hover:bg-slate-800 dark:hover:bg-cyan-500 text-white font-bold text-xs shadow-sm transition shrink-0"
                >
                  <FileCode2 className="w-4 h-4" />
                  Tải initialData.ts
                </button>
              </div>

              {/* Export Specific Module to Excel / CSV */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Xuất Từng Phân Hệ Dữ Liệu Ra File Excel / CSV
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      exportCombinedMaintenanceWorkbook({
                        plans: maintenancePlans,
                        history: maintenanceHistory,
                        tickets,
                        equipment,
                        meta: {
                          exportedBy: currentUser.tenNhanVien,
                          includePrintLayout: true,
                          filterNote: 'Toàn bộ dữ liệu bảo trì & sửa chữa',
                        },
                      });
                      addAuditLog(
                        'Cập nhật',
                        'Sao Lưu & Xuất Excel',
                        'Bảo trì & Sửa chữa (.xlsx)',
                        'Xuất sổ tay Excel tổng hợp 4 sheet bảo trì và lịch sử sửa chữa'
                      );
                    }}
                    className="sm:col-span-2 p-3 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/40 text-left transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 transition">
                        Báo Cáo Bảo Trì &amp; Lịch Sử Sửa Chữa (Excel .xlsx 4 Sheets)
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                        {maintenanceHistory.length} lịch sử • {maintenancePlans.length} kế hoạch • {tickets.length} tickets sửa chữa
                      </div>
                    </div>
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportModuleCSV('tickets')}
                    className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/70 text-left transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-700 dark:group-hover:text-cyan-400 transition">
                        Bảng Sự Vụ &amp; Tickets Bảo Trì
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                        {tickets.length} tickets đầy đủ người phụ trách, kết quả
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportModuleCSV('power10')}
                    className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/70 text-left transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-700 dark:group-hover:text-cyan-400 transition">
                        Bảng Điện 10 Ngày (Sheet Dien_10_Ngay)
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                        {power10Days.length} chu kỳ đầy đủ 3 giá EVN, Solar
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportModuleCSV('water')}
                    className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/70 text-left transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-700 dark:group-hover:text-cyan-400 transition">
                        Bảng Nước Hàng Tháng (Sheet Nuoc_month)
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                        {waterMonthly.length} tháng cấp, thải 80% &amp; chi phí USD
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportModuleCSV('spares')}
                    className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/70 text-left transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-700 dark:group-hover:text-cyan-400 transition">
                        Danh Mục Vật Tư Phụ Tùng (Spare_part)
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                        {spareParts.length} linh kiện, vị trí kho và tồn an toàn
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SAO LƯU THỦ CÔNG LÊN GOOGLE DRIVE */}
          {activeTab === 'drive' && (
            <div className="space-y-5">
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-cyan-500/40 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                    <Cloud className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Hướng Dẫn Lưu Trữ File Sao Lưu Lên Google Drive Cá Nhân
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Dữ liệu hiện được lưu trực tiếp trên trình duyệt (LocalStorage). Để lưu trữ an toàn sang Google Drive cá nhân hoặc nội bộ công ty, bạn chỉ cần tải file JSON về máy và kéo thả vào thư mục Drive của mình.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
                      1
                    </span>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Tải File Backup (.JSON)
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Xuất toàn bộ 15 phân hệ CMMS thành 1 file JSON gọn nhẹ về máy tính.
                    </p>
                    <button
                      type="button"
                      onClick={handleDownloadFullBackup}
                      className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Tải File Backup (.JSON)
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-600 text-white text-xs font-bold">
                      2
                    </span>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Mở Google Drive
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Mở Drive của bạn và kéo thả file vừa tải vào thư mục lưu trữ dự phòng.
                    </p>
                    <a
                      href="https://drive.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Mở Google Drive
                    </a>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                      3
                    </span>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Sao Chép Đường Dẫn
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Chép nhanh URL Google Drive để mở trên máy tính khác khi cần khôi phục.
                    </p>
                    <button
                      type="button"
                      onClick={handleCopyDriveLink}
                      className="w-full py-2 px-3 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedLink ? 'Đã sao chép!' : 'Sao chép đường dẫn Drive'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LỊCH SAO LƯU ĐỊNH KỲ */}
          {activeTab === 'schedule' && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                      Cài Đặt Lịch Tự Động Sao Lưu Dữ Liệu
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Tự động chụp bản sao lưu (snapshot) an toàn vào bộ nhớ hệ thống theo chu kỳ định trước
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleConfig.enabled}
                      onChange={(e) => setScheduleConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block">Tần Suất Sao Lưu</label>
                    <select
                      value={scheduleConfig.frequency}
                      disabled={!scheduleConfig.enabled}
                      onChange={(e) => setScheduleConfig((prev) => ({ ...prev, frequency: e.target.value as any }))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <option value="daily">Hàng Ngày (Cuối ca chiều: 17h30)</option>
                      <option value="weekly">Hàng Tuần (Thứ Sáu: 17h30)</option>
                      <option value="monthly">Hàng Tháng (Ngày 28 cuối tháng)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block">Thời Gian Kích Hoạt</label>
                    <input
                      type="time"
                      value={scheduleConfig.time}
                      disabled={!scheduleConfig.enabled}
                      onChange={(e) => setScheduleConfig((prev) => ({ ...prev, time: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/20 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Trạng thái lịch trình:</span>
                  <strong className={scheduleConfig.enabled ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-500'}>
                    {scheduleConfig.enabled
                      ? `Đang BẬT • ${scheduleConfig.frequency === 'daily' ? 'Hàng ngày' : scheduleConfig.frequency === 'weekly' ? 'Hàng tuần' : 'Hàng tháng'} lúc ${scheduleConfig.time}`
                      : 'Đã Tắt'}
                  </strong>
                </div>
              </div>

              {/* Local Snapshots Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Các Bản Snapshot Tự Động Lưu Gần Nhất ({snapshots.length} bản)
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const backupObj = createBackupData();
                      const jsonStr = JSON.stringify(backupObj);
                      const sizeKb = Math.round(jsonStr.length / 1024);
                      const summary = `${tickets.length} Tickets • ${power10Days.length} Kỳ điện • ${waterMonthly.length} Nước • ${spareParts.length} Vật tư`;
                      const newSnp: LocalSnapshot = {
                        id: `SNP-${Date.now()}`,
                        timestamp: new Date().toLocaleString('vi-VN'),
                        sizeKb,
                        recordSummary: summary,
                        data: backupObj,
                      };
                      setSnapshots((prev) => [newSnp, ...prev.slice(0, 4)]);
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Chụp Snapshot Ngay
                  </button>
                </div>

                <div className="space-y-2">
                  {snapshots.map((snp) => (
                    <div
                      key={snp.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-200">{snp.timestamp}</span>
                          <span className="text-[10px] text-cyan-800 dark:text-cyan-400 bg-cyan-500/15 dark:bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30 dark:border-cyan-800 font-mono">
                            {snp.sizeKb} KB
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">{snp.recordSummary}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const blob = new Blob([JSON.stringify(snp.data, null, 2)], {
                              type: 'application/json',
                            });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `FSM_Snapshot_${snp.id}.json`;
                            link.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold text-[11px] flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> Tải về
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingConfirm({ type: 'restore_snapshot', snapshot: snp })}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Khôi phục
                        </button>
                      </div>
                    </div>
                  ))}

                  {snapshots.length === 0 && (
                    <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-slate-500 text-xs">
                      Chưa có snapshot nào được tạo. Bấm "Chụp Snapshot Ngay" để tạo bản sao lưu đầu tiên.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: KHÔI PHỤC DỮ LIỆU TỪ FILE JSON */}
          {activeTab === 'restore' && (
            <div className="space-y-5">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-2xl border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-900/60 p-8 flex flex-col items-center justify-center text-center transition space-y-3 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200">
                    Bấm để chọn file sao lưu (.JSON) cần khôi phục
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Hỗ trợ các file sao lưu (.JSON) được xuất từ FACILITY SYSTEM MANAGEMENT
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileRestore}
                  className="hidden"
                />
              </div>

              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Lưu ý khi khôi phục:</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                  Quá trình khôi phục sẽ nạp lại toàn bộ danh sách thiết bị, kế hoạch bảo trì, sự vụ tickets, số liệu điện 10 ngày và nước tháng theo đúng file sao lưu vào trình duyệt hiện tại.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* EXPLICIT CONFIRMATION OVERLAY FOR SNAPSHOT RESTORE */}
        {pendingConfirm && (
          <div
            onClick={() => setPendingConfirm(null)}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl shrink-0 bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Xác nhận khôi phục từ Snapshot?
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Khôi phục dữ liệu về bản Snapshot lúc <strong>{pendingConfirm.snapshot.timestamp}</strong> ({pendingConfirm.snapshot.recordSummary}). Dữ liệu hiện tại trên ứng dụng sẽ được cập nhật theo bản này.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingConfirm(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleExecuteConfirmedAction}
                  className="px-4 py-2 rounded-xl text-white text-xs font-bold shadow inline-flex items-center gap-1.5 transition bg-emerald-600 hover:bg-emerald-500"
                >
                  <span>Xác nhận khôi phục</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
};
