import React, { useState } from 'react';
import { useCMMS } from '../../context/CMMSContext';
import { DEFAULT_ENERGY_TARIFF_CONFIG, EnergyTariffConfig } from '../../types/cmms';
import { NumericInput } from '../common/NumericInput';
import { formatVND, getSolarDiscountPct } from '../../utils/cmmsLogic';
import {
  X,
  Settings,
  Zap,
  Droplet,
  DollarSign,
  Sun,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface TariffConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TariffConfigModal: React.FC<TariffConfigModalProps> = ({ isOpen, onClose }) => {
  const { tariffConfig, updateTariffConfig } = useCMMS();

  const [form, setForm] = useState<EnergyTariffConfig>(() => ({
    ...DEFAULT_ENERGY_TARIFF_CONFIG,
    ...tariffConfig,
  }));
  const [savedSuccess, setSavedSuccess] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setForm({
        ...DEFAULT_ENERGY_TARIFF_CONFIG,
        ...tariffConfig,
        solarBT: tariffConfig.evnBT,
        solarCD: tariffConfig.evnCD,
        solarDiscountPct: getSolarDiscountPct(tariffConfig),
      });
    }
  }, [isOpen, tariffConfig]);

  if (!isOpen) return null;

  const discountPct = getSolarDiscountPct(form);
  const solarFactor = (100 - discountPct) / 100;
  const effectiveSolarBT = form.evnBT * solarFactor;
  const effectiveSolarCD = form.evnCD * solarFactor;

  const handleResetDefault = () => {
    setForm({ ...DEFAULT_ENERGY_TARIFF_CONFIG });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const clampedDiscount = Math.min(100, Math.max(0, Number(form.solarDiscountPct) || 0));
    updateTariffConfig({
      ...form,
      solarBT: form.evnBT,
      solarCD: form.evnCD,
      solarDiscountPct: clampedDiscount,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/80">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md">
              <Settings className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                Cài Đặt Đơn Giá Năng Lượng & Tỷ Giá USD/VNĐ
              </h3>
              <p className="text-xs text-slate-400">
                Áp dụng tính chi phí EVN + Solar theo khung giờ và hiệu suất / 1 giờ vận hành
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

        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {savedSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Đã lưu cấu hình đơn giá thành công! Dữ liệu phân tích đã được cập nhật.</span>
            </div>
          )}

          {/* Nhóm 1: Biểu giá điện EVN 3 giá */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2 text-sm font-bold text-cyan-400">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>Biểu Giá Điện Lưới EVN Theo Khung Giờ (VNĐ / kWh)</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Quy định EVN</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  <div className="flex items-center justify-between">
                    <span>Giờ Bình Thường (BT)</span>
                    <span className="text-[10px] text-cyan-400 font-mono">13h - 18h/ngày</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal block leading-tight">
                    T2-T7: 06h-17h30 & 22h30-24h • CN: 06h-24h
                  </span>
                </label>
                <NumericInput
                  value={form.evnBT}
                  onChange={(v) => {
                    setForm((prev) => ({
                      ...prev,
                      evnBT: v,
                      solarBT: v,
                    }));
                  }}
                  suffix="đ/kWh"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-amber-300 block">
                  <div className="flex items-center justify-between">
                    <span>Giờ Cao Điểm (CĐ)</span>
                    <span className="text-[10px] text-amber-400 font-mono">5h/ngày (T2-T7)</span>
                  </div>
                  <span className="text-[10px] text-amber-300/70 font-normal block leading-tight">
                    T2-T7: 17h30-22h30 • CN: Không có giờ CĐ
                  </span>
                </label>
                <NumericInput
                  value={form.evnCD}
                  onChange={(v) => {
                    setForm((prev) => ({
                      ...prev,
                      evnCD: v,
                      solarCD: v,
                    }));
                  }}
                  suffix="đ/kWh"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-emerald-300 block">
                  <div className="flex items-center justify-between">
                    <span>Giờ Thấp Điểm (TĐ)</span>
                    <span className="text-[10px] text-emerald-400 font-mono">6h/ngày</span>
                  </div>
                  <span className="text-[10px] text-emerald-300/70 font-normal block leading-tight">
                    00h00 - 06h00 hàng ngày (kể cả CN)
                  </span>
                </label>
                <NumericInput
                  value={form.evnTD}
                  onChange={(v) => setForm((prev) => ({ ...prev, evnTD: v }))}
                  suffix="đ/kWh"
                />
              </div>
            </div>
          </div>

          {/* Nhóm 2: Biểu giá điện Solar (tính theo giá EVN và giảm 5% tổng chi phí) */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Chi Phí Điện Mặt Trời Solar (Giá EVN Giảm {discountPct}%)</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Giảm {discountPct}% tổng chi phí Solar
              </span>
            </div>

            <p className="text-[11px] text-slate-400 bg-amber-950/20 p-2.5 rounded-xl border border-amber-500/20 leading-relaxed">
              <strong>Quy tắc tính toán:</strong> Điện Solar áp dụng biểu giá gốc EVN theo 2 khung giờ Bình Thường (BT) và Cao Điểm (CĐ) (không có giờ Thấp Điểm), sau đó <strong>giảm trực tiếp {discountPct}% trên tổng chi phí Solar</strong> trước khi cộng vào Tổng Chi Phí Năng Lượng.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-emerald-300 flex items-center justify-between">
                  <span>Chiết Khấu Solar (%)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Mặc định 5%</span>
                </label>
                <NumericInput
                  value={discountPct}
                  onChange={(v) =>
                    setForm((prev) => ({
                      ...prev,
                      solarDiscountPct: Math.min(100, Math.max(0, v)),
                    }))
                  }
                  suffix="%"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Solar BT (sau giảm {discountPct}%)</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Gốc: {form.evnBT.toLocaleString('vi-VN')}đ
                  </span>
                </label>
                <div className="px-3 py-2.5 rounded-xl bg-slate-900/70 border border-slate-700 text-sm font-mono font-bold text-amber-400 flex items-center justify-between">
                  <span>
                    {effectiveSolarBT.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-slate-400">đ/kWh</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-amber-300 flex items-center justify-between">
                  <span>Solar CĐ (sau giảm {discountPct}%)</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Gốc: {form.evnCD.toLocaleString('vi-VN')}đ
                  </span>
                </label>
                <div className="px-3 py-2.5 rounded-xl bg-slate-900/70 border border-slate-700 text-sm font-mono font-bold text-amber-400 flex items-center justify-between">
                  <span>
                    {effectiveSolarCD.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-slate-400">đ/kWh</span>
                </div>
              </div>
            </div>
          </div>

          {/* Nhóm 3: Giá nước sinh hoạt, nước thải & Tỷ giá USD */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-400 border-b border-slate-800/80 pb-2">
              <Droplet className="w-4 h-4 text-blue-400" />
              <span>Đơn Giá Nước Cấp, Nước Thải & Tỷ Giá Ngoại Tệ</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Giá Nước Sinh Hoạt (Cấp)
                </label>
                <NumericInput
                  value={form.waterVNDPerM3}
                  onChange={(v) => setForm((prev) => ({ ...prev, waterVNDPerM3: v }))}
                  suffix="đ/m³"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Phí Xử Lý Nước Thải
                </label>
                <NumericInput
                  value={form.sewageVNDPerM3}
                  onChange={(v) => setForm((prev) => ({ ...prev, sewageVNDPerM3: v }))}
                  suffix="đ/m³"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-emerald-300 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tỷ Giá USD / VNĐ</span>
                </label>
                <NumericInput
                  value={form.usdToVndRate}
                  onChange={(v) => setForm((prev) => ({ ...prev, usdToVndRate: v }))}
                  suffix="đ/USD"
                />
              </div>
            </div>
          </div>

          {/* Preview nhanh công thức */}
          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-blue-300">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Quy tắc hạch toán tự động trong hệ thống:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] font-mono">
              <li>
                Chi phí điện EVN = (EVN BT × {formatVND(form.evnBT)}) + (EVN CĐ × {formatVND(form.evnCD)}) + (EVN TĐ × {formatVND(form.evnTD)})
              </li>
              <li>
                Chi phí điện Solar (giảm {discountPct}%) = [(Solar BT × {formatVND(form.evnBT)}) + (Solar CĐ × {formatVND(form.evnCD)})] × {(100 - discountPct)}%
              </li>
              <li>
                Tổng chi phí năng lượng = Chi phí EVN + Chi phí Solar (sau giảm {discountPct}%)
              </li>
              <li>
                Chi phí / 1 giờ vận hành = Tổng chi phí năng lượng / (Số ngày làm việc × Số giờ ca/ngày)
              </li>
              <li>
                Hóa đơn nước hàng tháng: Lượng nước thải = 80% × Lượng nước sinh hoạt chốt theo tháng.
              </li>
              <li>
                Tỷ giá quy đổi: 1 USD = {form.usdToVndRate.toLocaleString()} VNĐ (tự động tính song song cả VNĐ và USD).
              </li>
            </ul>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleResetDefault}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Khôi Phục Mặc Định
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
              >
                Hủy Bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg transition"
              >
                Lưu Cấu Hình
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
