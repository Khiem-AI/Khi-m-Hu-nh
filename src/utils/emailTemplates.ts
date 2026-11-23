import { EmailLog } from '../types/cmms';

export interface EmailTemplateTheme {
  badgeText: string;
  accentColor: string;
  badgeBg: string;
  badgeTextColor: string;
  badgeBorder: string;
  calloutBg: string;
  calloutBorder: string;
  subtitle: string;
}

export function getEmailTemplateTheme(type: EmailLog['type']): EmailTemplateTheme {
  switch (type) {
    case 'TICKET_MOI':
      return {
        badgeText: 'PHIẾU SỰ CỐ MỚI',
        accentColor: '#dc2626',
        badgeBg: '#fef2f2',
        badgeTextColor: '#b91c1c',
        badgeBorder: '#fecaca',
        calloutBg: '#fef2f2',
        calloutBorder: '#fca5a5',
        subtitle: 'Yêu cầu xử lý sự cố & bảo trì đột xuất tại nhà máy',
      };
    case 'BAO_TRI_QUA_HAN':
      return {
        badgeText: 'CẢNH BÁO QUÁ HẠN',
        accentColor: '#dc2626',
        badgeBg: '#fef2f2',
        badgeTextColor: '#b91c1c',
        badgeBorder: '#fecaca',
        calloutBg: '#fef2f2',
        calloutBorder: '#fca5a5',
        subtitle: 'Cảnh báo thiết bị đã vượt quá lịch bảo trì định kỳ',
      };
    case 'BAO_TRI_DEN_HAN':
      return {
        badgeText: 'NHẮC HẠN BẢO TRÌ',
        accentColor: '#d97706',
        badgeBg: '#fffbeb',
        badgeTextColor: '#b45309',
        badgeBorder: '#fde68a',
        calloutBg: '#fffbeb',
        calloutBorder: '#fcd34d',
        subtitle: 'Danh sách thiết bị đến hạn / sắp đến hạn bảo dưỡng',
      };
    case 'KIEM_DINH_DEN_HAN':
      return {
        badgeText: 'KIỂM ĐỊNH & HIỆU CHUẨN',
        accentColor: '#ea580c',
        badgeBg: '#fff7ed',
        badgeTextColor: '#c2410c',
        badgeBorder: '#fed7aa',
        calloutBg: '#fff7ed',
        calloutBorder: '#fdba74',
        subtitle: 'Theo dõi hồ sơ an toàn thiết bị & hiệu chuẩn đo lường',
      };
    case 'GIAO_VIEC':
      return {
        badgeText: 'PHÂN CÔNG CÔNG VIỆC',
        accentColor: '#0284c7',
        badgeBg: '#f0f9ff',
        badgeTextColor: '#0369a1',
        badgeBorder: '#bae6fd',
        calloutBg: '#f0f9ff',
        calloutBorder: '#7dd3fc',
        subtitle: 'Thông báo giao nhiệm vụ kỹ thuật trên hệ thống CMMS',
      };
    case 'BAO_CAO_HOAN_THANH':
      return {
        badgeText: 'BÁO CÁO HOÀN THÀNH',
        accentColor: '#059669',
        badgeBg: '#ecfdf5',
        badgeTextColor: '#047857',
        badgeBorder: '#a7f3d0',
        calloutBg: '#ecfdf5',
        calloutBorder: '#6ee7b7',
        subtitle: 'Biên bản nghiệm thu & hoàn thành công việc kỹ thuật',
      };
    case 'BAO_CAO_THANG_BGD':
      return {
        badgeText: 'BÁO CÁO THÁNG BGĐ',
        accentColor: '#1d4ed8',
        badgeBg: '#eff6ff',
        badgeTextColor: '#1e40af',
        badgeBorder: '#bfdbfe',
        calloutBg: '#f8fafc',
        calloutBorder: '#93c5fd',
        subtitle: 'Báo cáo tổng hợp vận hành, bảo trì & năng lượng định kỳ trình Ban Giám Đốc',
      };
    case 'THU_NGHIEM':
    default:
      return {
        badgeText: 'KIỂM TRA HỆ THỐNG',
        accentColor: '#0891b2',
        badgeBg: '#ecfeff',
        badgeTextColor: '#0e7490',
        badgeBorder: '#a5f3fc',
        calloutBg: '#f0fdfa',
        calloutBorder: '#99f6e4',
        subtitle: 'Kiểm tra kết nối & định dạng kênh thông báo nhà máy',
      };
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatLineWithStatusChips(line: string): string {
  const safe = escapeHtml(line);
  return safe
    .replace(/\[QUÁ HẠN([^\]]*)\]/gi, '<span style="display:inline-block;padding:2px 7px;border-radius:4px;background-color:#fef2f2;color:#b91c1c;border:1px solid #fecaca;font-size:11px;font-weight:700;">QUÁ HẠN$1</span>')
    .replace(/\[TỚI HẠN([^\]]*)\]/gi, '<span style="display:inline-block;padding:2px 7px;border-radius:4px;background-color:#fffbeb;color:#b45309;border:1px solid #fde68a;font-size:11px;font-weight:700;">TỚI HẠN$1</span>')
    .replace(/\[ĐẾN HẠN([^\]]*)\]/gi, '<span style="display:inline-block;padding:2px 7px;border-radius:4px;background-color:#fffbeb;color:#b45309;border:1px solid #fde68a;font-size:11px;font-weight:700;">ĐẾN HẠN$1</span>')
    .replace(/\[SẮP TỚI([^\]]*)\]/gi, '<span style="display:inline-block;padding:2px 7px;border-radius:4px;background-color:#f0f9ff;color:#0369a1;border:1px solid #bae6fd;font-size:11px;font-weight:700;">SẮP TỚI$1</span>')
    .replace(/\[(Còn \d+ ngày)\]/gi, '<span style="display:inline-block;padding:2px 7px;border-radius:4px;background-color:#fff7ed;color:#c2410c;border:1px solid #fed7aa;font-size:11px;font-weight:700;">$1</span>');
}

function renderStructuredBodyHtml(body: string, theme: EmailTemplateTheme): string {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const blocks: string[] = [];
  let kvRows: Array<{ label: string; value: string }> = [];
  let listItems: string[] = [];

  const flushKvRows = () => {
    if (kvRows.length === 0) return;
    const rowsHtml = kvRows
      .map((row, idx) => {
        const bg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
        const isCriticalVal = /khẩn cấp|quá hạn|chưa đạt|dừng máy/i.test(row.value);
        const isGoodVal = /hoàn thành|đạt|bình thường|ổn định/i.test(row.value);
        const valueColor = isCriticalVal ? '#b91c1c' : isGoodVal ? '#047857' : '#0f172a';
        const valueWeight = isCriticalVal || isGoodVal || /mã|ticket|thiết bị|người/i.test(row.label) ? '700' : '500';
        return `
          <tr style="background-color:${bg};">
            <td style="width:34%;padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:600;color:#475569;vertical-align:top;">
              ${escapeHtml(row.label)}
            </td>
            <td style="width:66%;padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:${valueWeight};color:${valueColor};vertical-align:top;line-height:1.5;">
              ${formatLineWithStatusChips(row.value)}
            </td>
          </tr>
        `;
      })
      .join('');

    blocks.push(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden;border-collapse:separate;">
        ${rowsHtml}
      </table>
    `);
    kvRows = [];
  };

  const flushListItems = () => {
    if (listItems.length === 0) return;
    const itemsHtml = listItems
      .map((item, idx) => {
        const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        return `
          <div style="padding:10px 14px;background-color:${bg};border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b;line-height:1.55;">
            ${formatLineWithStatusChips(item)}
          </div>
        `;
      })
      .join('');
    blocks.push(`
      <div style="margin:14px 0;border:1px solid ${theme.calloutBorder};border-radius:8px;overflow:hidden;background-color:${theme.calloutBg};">
        ${itemsHtml}
      </div>
    `);
    listItems = [];
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      flushKvRows();
      flushListItems();
      continue;
    }

    // Bullet key-value line: "- Mã Ticket: TCK-001"
    const kvMatch = trimmed.match(/^-\s*([^:]{1,60}):\s*(.+)$/);
    if (kvMatch) {
      flushListItems();
      kvRows.push({ label: kvMatch[1].trim(), value: kvMatch[2].trim() });
      continue;
    }

    // Numbered alert list item: "1. [QUÁ HẠN] ..." or sub-detail "   - Tần suất: ..."
    if (/^\d+\.\s+/.test(trimmed)) {
      flushKvRows();
      listItems.push(trimmed);
      continue;
    }

    if (listItems.length > 0 && trimmed.startsWith('-')) {
      listItems[listItems.length - 1] = `${listItems[listItems.length - 1]}\n${trimmed}`;
      continue;
    }

    flushKvRows();
    flushListItems();

    const isGreeting = /^kính gửi/i.test(trimmed);
    const isSignoff = /^trân trọng/i.test(trimmed);
    blocks.push(`
      <p style="margin:0 0 10px 0;font-size:${isGreeting ? '14px' : '13px'};font-weight:${isGreeting ? '700' : isSignoff ? '600' : '400'};color:${isGreeting ? '#0f172a' : '#334155'};line-height:1.65;">
        ${formatLineWithStatusChips(trimmed)}
      </p>
    `);
  }

  flushKvRows();
  flushListItems();

  return blocks.join('\n');
}

export function buildProfessionalEmailHtml(params: {
  type: EmailLog['type'];
  subject: string;
  body: string;
  senderName?: string;
  relatedId?: string;
  timestamp?: string;
  appUrl?: string;
}): string {
  const theme = getEmailTemplateTheme(params.type);
  const senderLabel = (params.senderName || 'FACILITY SYSTEM MANAGEMENT').trim();
  const timeText =
    params.timestamp ||
    new Date().toLocaleString('vi-VN', {
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  const portalUrl =
    params.appUrl ||
    (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '');

  const cleanSubject = escapeHtml(params.subject.trim());
  const contentHtml = renderStructuredBodyHtml(params.body, theme);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${cleanSubject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background-color:#ffffff;border:1px solid #cbd5e1;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(15,23,42,0.06);">
          <!-- Top Accent Bar -->
          <tr>
            <td style="height:5px;background-color:${theme.accentColor};font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Corporate Header -->
          <tr>
            <td style="background-color:#0f172a;padding:20px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#38bdf8;margin-bottom:4px;">
                      FACILITY SYSTEM MANAGEMENT · CMMS
                    </div>
                    <div style="font-size:17px;font-weight:800;color:#ffffff;line-height:1.3;">
                      ${escapeHtml(senderLabel)}
                    </div>
                    <div style="font-size:12px;color:#94a3b8;margin-top:3px;">
                      ${escapeHtml(theme.subtitle)}
                    </div>
                  </td>
                  <td align="right" style="vertical-align:top;">
                    <span style="display:inline-block;padding:5px 10px;border-radius:6px;background-color:${theme.badgeBg};color:${theme.badgeTextColor};border:1px solid ${theme.badgeBorder};font-size:11px;font-weight:800;letter-spacing:0.04em;white-space:nowrap;">
                      ${escapeHtml(theme.badgeText)}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Subject & Reference Strip -->
          <tr>
            <td style="background-color:#f8fafc;padding:14px 24px;border-bottom:1px solid #e2e8f0;">
              <div style="font-size:15px;font-weight:800;color:#0f172a;line-height:1.4;">
                ${cleanSubject}
              </div>
              <div style="margin-top:6px;font-size:11px;color:#64748b;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;">
                ${params.relatedId ? `Mã tham chiếu: <strong style="color:#0f172a;">${escapeHtml(params.relatedId)}</strong> &nbsp;·&nbsp; ` : ''}Thời gian ghi nhận: ${escapeHtml(timeText)}
              </div>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding:22px 24px 18px 24px;">
              ${contentHtml}

              ${
                portalUrl
                  ? `<div style="margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:left;">
                      <a href="${escapeHtml(portalUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:10px 18px;border-radius:8px;background-color:${theme.accentColor};color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;">
                        Mở Hệ Thống Quản Lý Nhà Máy &rarr;
                      </a>
                    </div>`
                  : ''
              }
            </td>
          </tr>

          <!-- Standard Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;">
              <div style="font-size:11px;color:#64748b;line-height:1.5;">
                <strong style="color:#334155;">${escapeHtml(senderLabel)}</strong> · Hệ thống vận hành &amp; bảo trì thiết bị nhà máy.<br />
                Đây là email thông báo tự động. Vui lòng truy cập hệ thống để cập nhật tiến độ hoặc phản hồi công việc.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
