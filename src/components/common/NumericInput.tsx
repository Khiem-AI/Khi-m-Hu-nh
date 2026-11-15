import React from 'react';

interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  suffix?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  autoFocus?: boolean;
}

/**
 * NumericInput xử lý triệt để yêu cầu: "lưu ý bỏ đi số '0' trước số nhập vào".
 * - Tự động xóa số 0 ở đầu khi gõ (ví dụ: gõ '5' khi đang là 0 sẽ thành 5 chứ không bị thành 05).
 * - Tự động bôi đen toàn bộ số khi focus để người dùng gõ đè ngay lập tức.
 * - Hỗ trợ suffix như 'kWh', 'm³', 'VNĐ', 'USD'.
 */
export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  placeholder = '0',
  min = 0,
  max,
  step = 1,
  className = '',
  suffix,
  disabled = false,
  required = false,
  id,
  name,
  autoFocus = false,
}) => {
  // Chuỗi hiển thị: nếu value là 0 và người dùng muốn bắt đầu gõ, hoặc chuyển đổi an toàn
  const displayValue = value === 0 ? '0' : String(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // Loại bỏ các ký tự không phải số hoặc dấu chấm thập phân
    raw = raw.replace(/[^0-9.]/g, '');

    // Nếu có nhiều hơn 1 dấu chấm thập phân, chỉ giữ dấu chấm đầu tiên
    const parts = raw.split('.');
    if (parts.length > 2) {
      raw = parts[0] + '.' + parts.slice(1).join('');
    }

    // BỎ ĐI SỐ '0' TRƯỚC SỐ NHẬP VÀO (ví dụ: "05" -> "5", "00123" -> "123", nhưng "0." giữ nguyên)
    if (raw.length > 1 && raw.startsWith('0') && !raw.startsWith('0.')) {
      raw = raw.replace(/^0+/, '');
      if (raw === '') raw = '0';
    }

    if (raw === '') {
      onChange(0);
      return;
    }

    const num = parseFloat(raw);
    if (!isNaN(num)) {
      if (max !== undefined && num > max) {
        onChange(max);
      } else {
        onChange(num);
      }
    } else {
      onChange(0);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Tự động select all khi click/focus để người dùng gõ đè số mới mà không cần xóa số cũ
    e.target.select();
  };

  return (
    <div className="relative flex items-center w-full">
      <input
        id={id}
        name={name}
        type="text"
        inputMode="decimal"
        autoFocus={autoFocus}
        disabled={disabled}
        required={required}
        value={value === 0 ? '' : displayValue}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={handleFocus}
        className={`w-full font-mono text-sm px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed ${
          suffix ? 'pr-12' : ''
        } ${className}`}
      />
      {suffix && (
        <span className="absolute right-3 text-xs font-semibold text-slate-400 pointer-events-none select-none">
          {suffix}
        </span>
      )}
    </div>
  );
};
