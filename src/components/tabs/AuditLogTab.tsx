import React, { useState } from 'react';
import { useCMMS } from '../../context/CMMSContext';
import { UI_TEXTS } from '../../config/uiTexts';
import { AuditLog } from '../../types/cmms';
import { SmartHorizontalScroll } from '../common/SmartHorizontalScroll';
import { Activity, Search, Filter, Download, User, Calendar, Shield } from 'lucide-react';

export const AuditLogTab: React.FC = () => {
  const { auditLogs, employees } = useCMMS();

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const resolveActorInfo = (rawActor: string) => {
    const trimmed = (rawActor || '').trim();
    const match = trimmed.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    if (match) {
      return { name: match[1].trim(), code: match[2].trim() };
    }
    const matchedEmp = employees.find(
      (e) =>
        e.tenNhanVien.trim().toLowerCase() === trimmed.toLowerCase() ||
        e.maNhanVien.trim().toLowerCase() === trimmed.toLowerCase()
    );
    return {
      name: matchedEmp?.tenNhanVien || trimmed,
      code: matchedEmp?.maNhanVien || '',
    };
  };

  const filteredLogs = auditLogs.filter((log) => {
    const actor = resolveActorInfo(log.nguoiThaoTac);
    const q = searchTerm.trim().toLowerCase();
    const matchSearch =
      !q ||
      log.nguoiThaoTac.toLowerCase().includes(q) ||
      actor.name.toLowerCase().includes(q) ||
      actor.code.toLowerCase().includes(q) ||
      log.chucNang.toLowerCase().includes(q) ||
      log.doiTuong.toLowerCase().includes(q) ||
      log.chiTietNoiDung.toLowerCase().includes(q);

    const matchAction = actionFilter === 'ALL' || log.hanhDong === actionFilter;

    return matchSearch && matchAction;
  });

  const handleExportCSV = () => {
    const headers = [
      'Thời gian',
      'ID Người thao tác',
      'Người thao tác',
      'Hành động',
      'Chức năng',
      'Đối tượng',
      'Chi tiết nội dung',
    ];
    const rows = filteredLogs.map((l) => {
      const actor = resolveActorInfo(l.nguoiThaoTac);
      return [
        `"${l.thoiGian}"`,
        `"${actor.code}"`,
        `"${actor.name}"`,
        `"${l.hanhDong}"`,
        `"${l.chucNang}"`,
        `"${l.doiTuong}"`,
        `"${l.chiTietNoiDung.replace(/"/g, '""')}"`,
      ];
    });
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Log_He_thong_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">({auditLogs.length} bản ghi nhật ký)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight mt-1">
            {UI_TEXTS.tabs.logs.title}
          </h2>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          Xuất Nhật Ký CSV
        </button>
      </div>

      {/* Control bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo người thao tác, ID, đối tượng, nội dung..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ALL">Tất cả hành động</option>
            <option value="Thêm">Thêm</option>
            <option value="Sửa">Sửa</option>
            <option value="Cập nhật">Cập nhật</option>
            <option value="Xóa">Xóa</option>
            <option value="Hoàn thành">Hoàn thành</option>
            <option value="Xuất kho">Xuất kho</option>
            <option value="Nhập kho">Nhập kho</option>
            <option value="Chốt số">Chốt số</option>
            <option value="Đăng nhập">Đăng nhập</option>
            <option value="Đăng xuất">Đăng xuất</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <SmartHorizontalScroll>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Thời Gian</th>
                <th className="py-3 px-4">Người Thao Tác</th>
                <th className="py-3 px-4">Hành Động</th>
                <th className="py-3 px-4">Chức Năng</th>
                <th className="py-3 px-4">Đối Tượng</th>
                <th className="py-3 px-4">Chi Tiết Nội Dung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredLogs.map((log, index) => {
                const actor = resolveActorInfo(log.nguoiThaoTac);
                return (
                  <tr key={`${log.id}-${index}`} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {log.thoiGian}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-100 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{actor.name}</span>
                        {actor.code && (
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            {actor.code}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          log.hanhDong === 'Thêm'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : log.hanhDong === 'Hoàn thành'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : log.hanhDong === 'Xuất kho'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : log.hanhDong === 'Xóa'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : log.hanhDong === 'Đăng nhập'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : log.hanhDong === 'Đăng xuất'
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {log.hanhDong}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-cyan-300 font-medium whitespace-nowrap">
                      {log.chucNang}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200 whitespace-nowrap">
                      {log.doiTuong}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 leading-snug">
                      {log.chiTietNoiDung}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </SmartHorizontalScroll>
      </div>
    </div>
  );
};
