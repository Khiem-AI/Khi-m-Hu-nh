import React, { useMemo, useState } from 'react';
import { Employee } from '../../types/cmms';
import { formatAssigneeNames, parseAssigneeNames } from '../../utils/cmmsLogic';
import { Search, Users, X, Check } from 'lucide-react';

interface MultiAssigneePickerProps {
  employees: Employee[];
  value: string;
  onChange: (formattedNames: string, selectedList: string[]) => void;
  label?: string;
  accentColor?: 'indigo' | 'cyan' | 'amber' | 'emerald';
  required?: boolean;
}

export const MultiAssigneePicker: React.FC<MultiAssigneePickerProps> = ({
  employees,
  value,
  onChange,
  label = 'Người Thực Hiện',
  accentColor = 'indigo',
  required = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const selectedNames = useMemo(() => parseAssigneeNames(value), [value]);

  // Include any legacy names currently in value that might not be in employees list
  const extraNames = useMemo(
    () =>
      selectedNames.filter(
        (name) => !employees.some((e) => e.tenNhanVien.trim().toLowerCase() === name.toLowerCase())
      ),
    [selectedNames, employees]
  );

  const filteredEmployees = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.tenNhanVien.toLowerCase().includes(q) ||
        e.maNhanVien.toLowerCase().includes(q) ||
        e.chucVu.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q)
    );
  }, [employees, searchTerm]);

  const toggleName = (name: string) => {
    const exists = selectedNames.some((n) => n.toLowerCase() === name.toLowerCase());
    const next = exists
      ? selectedNames.filter((n) => n.toLowerCase() !== name.toLowerCase())
      : [...selectedNames, name];
    onChange(formatAssigneeNames(next), next);
  };

  const handleSelectAllFiltered = () => {
    const merged = Array.from(
      new Set([...selectedNames, ...filteredEmployees.map((e) => e.tenNhanVien)])
    );
    onChange(formatAssigneeNames(merged), merged);
  };

  const handleClearAll = () => {
    onChange('', []);
  };

  const ringClass =
    accentColor === 'amber'
      ? 'focus:ring-amber-500'
      : accentColor === 'cyan'
      ? 'focus:ring-cyan-500'
      : accentColor === 'emerald'
      ? 'focus:ring-emerald-500'
      : 'focus:ring-indigo-500';

  const chipBgClass =
    accentColor === 'amber'
      ? 'bg-amber-500/15 text-amber-200 border-amber-500/40'
      : accentColor === 'cyan'
      ? 'bg-cyan-500/15 text-cyan-200 border-cyan-500/40'
      : accentColor === 'emerald'
      ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/40'
      : 'bg-indigo-500/15 text-indigo-200 border-indigo-500/40';

  const activeRowClass =
    accentColor === 'amber'
      ? 'bg-amber-600/20 border-amber-500/50 text-slate-100'
      : accentColor === 'cyan'
      ? 'bg-cyan-600/20 border-cyan-500/50 text-slate-100'
      : accentColor === 'emerald'
      ? 'bg-emerald-600/20 border-emerald-500/50 text-slate-100'
      : 'bg-indigo-600/20 border-indigo-500/50 text-slate-100';

  const checkboxBgClass =
    accentColor === 'amber'
      ? 'bg-amber-600 border-amber-500'
      : accentColor === 'cyan'
      ? 'bg-cyan-600 border-cyan-500'
      : accentColor === 'emerald'
      ? 'bg-emerald-600 border-emerald-500'
      : 'bg-indigo-600 border-indigo-500';

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            {label}
            {required ? ' *' : ''}
          </span>
        </label>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="font-mono font-bold text-cyan-400">
            Đã chọn: {selectedNames.length}
          </span>
          <span className="text-slate-600">•</span>
          <button
            type="button"
            onClick={handleSelectAllFiltered}
            className="text-cyan-400 hover:underline font-semibold"
          >
            Chọn tất cả
          </button>
          {selectedNames.length > 0 && (
            <>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-rose-400 hover:underline font-semibold"
              >
                Bỏ chọn
              </button>
            </>
          )}
        </div>
      </div>

      {/* Selected Chips */}
      {selectedNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          {selectedNames.map((name) => (
            <span
              key={name}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${chipBgClass}`}
            >
              <span>{name}</span>
              <button
                type="button"
                onClick={() => toggleName(name)}
                aria-label={`Bỏ chọn ${name}`}
                className="hover:text-rose-300 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search + Checkboxes */}
      <div className="rounded-xl bg-slate-800/70 border border-slate-700 overflow-hidden">
        <div className="relative border-b border-slate-700/80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm nhân viên..."
            className={`w-full pl-8 pr-3 py-2 bg-transparent text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 ${ringClass}`}
          />
        </div>

        <div className="max-h-44 overflow-y-auto p-1.5 space-y-1">
          {extraNames.map((name) => (
            <button
              key={`extra-${name}`}
              type="button"
              onClick={() => toggleName(name)}
              className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border text-left text-xs transition ${activeRowClass}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 text-white ${checkboxBgClass}`}
                >
                  <Check className="w-3 h-3" />
                </span>
                <span className="font-semibold truncate">{name}</span>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0">Hiện tại</span>
            </button>
          ))}

          {filteredEmployees.map((emp) => {
            const isSelected = selectedNames.some(
              (n) => n.toLowerCase() === emp.tenNhanVien.trim().toLowerCase()
            );
            return (
              <button
                key={emp.maNhanVien}
                type="button"
                onClick={() => toggleName(emp.tenNhanVien)}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border text-left text-xs transition ${
                  isSelected
                    ? activeRowClass
                    : 'bg-slate-900/50 border-transparent hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition ${
                      isSelected
                        ? `${checkboxBgClass} text-white`
                        : 'border-slate-600 bg-slate-900'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">
                      <span className="font-mono text-[11px] text-cyan-400 mr-1.5">
                        [{emp.maNhanVien}]
                      </span>
                      {emp.tenNhanVien}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {emp.chucVu} • {emp.email}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {filteredEmployees.length === 0 && extraNames.length === 0 && (
            <div className="py-4 text-center text-xs text-slate-500">
              Không tìm thấy nhân viên phù hợp.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
