import {
  CompressorConsumableType,
  CompressorMachineReading,
  CompressorMonthlyLog,
  CompressorReplacementEvent,
  CompressorRuntimeStore,
  CompressorUnitSpec,
  UtilityConnectivityItem,
  UtilityConnectivityStatus,
} from '../types/cmms';

export const CONSUMABLE_META: Record<
  CompressorConsumableType,
  { label: string; shortLabel: string; defaultIntervalH: number; unit: string }
> = {
  oil: { label: 'Dầu máy nén khí', shortLabel: 'Dầu MNK', defaultIntervalH: 8000, unit: 'Lít' },
  airFilter: { label: 'Lọc gió', shortLabel: 'Lọc gió', defaultIntervalH: 4000, unit: 'Cái' },
  oilFilter: { label: 'Lọc dầu', shortLabel: 'Lọc dầu', defaultIntervalH: 8000, unit: 'Cái' },
  oilSeparator: { label: 'Lọc tách dầu', shortLabel: 'Tách dầu', defaultIntervalH: 8000, unit: 'Cái' },
  thermostatValve: { label: 'Van nhiệt 75°C', shortLabel: 'Van nhiệt', defaultIntervalH: 16000, unit: 'Bộ' },
};

export const MAIN_CONSUMABLE_KEYS: Array<'oil' | 'airFilter' | 'oilFilter' | 'oilSeparator'> = [
  'oil',
  'airFilter',
  'oilFilter',
  'oilSeparator',
];

export const DEFAULT_COMPRESSOR_UNIT_SPECS: CompressorUnitSpec[] = [
  {
    machineKey: 'GA75-1',
    displayName: 'Máy nén khí GA75-1',
    equipmentCode: 'CMP-GA75-01',
    category: 'Máy nén khí',
    tracksConsumables: true,
    oilCapacityLiters: 18,
    oilIntervalH: 8000,
    airFilterIntervalH: 4000,
    oilFilterIntervalH: 4000,
    oilSeparatorIntervalH: 8000,
    sparePartCodes: {
      airFilter: 'SP-FC-022',
      oilFilter: 'SP-FC-019',
      oilSeparator: 'SP-FC-021',
    },
  },
  {
    machineKey: 'GA75-2',
    displayName: 'Máy nén khí GA75-2',
    equipmentCode: 'CMP-GA75-02',
    category: 'Máy nén khí',
    tracksConsumables: true,
    oilCapacityLiters: 18,
    oilIntervalH: 8000,
    airFilterIntervalH: 4000,
    oilFilterIntervalH: 8000,
    oilSeparatorIntervalH: 8000,
    sparePartCodes: {
      airFilter: 'SP-FC-022',
      oilFilter: 'SP-FC-019',
      oilSeparator: 'SP-FC-021',
    },
  },
  {
    machineKey: 'VSD90-1',
    displayName: 'Máy nén khí VSD90-1',
    equipmentCode: 'CMP-GA90-01',
    category: 'Máy nén khí',
    tracksConsumables: true,
    oilCapacityLiters: 32,
    oilIntervalH: 8000,
    airFilterIntervalH: 4000,
    oilFilterIntervalH: 8000,
    oilSeparatorIntervalH: 8000,
    sparePartCodes: {
      airFilter: 'SP-FC-023',
      oilFilter: 'SP-FC-020',
      oilSeparator: 'SP-FC-024',
    },
  },
  {
    machineKey: 'VSD90-2',
    displayName: 'Máy nén khí VSD90-2',
    equipmentCode: 'CMP-GA90-02',
    category: 'Máy nén khí',
    tracksConsumables: true,
    oilCapacityLiters: 31,
    oilIntervalH: 8000,
    airFilterIntervalH: 4000,
    oilFilterIntervalH: 8000,
    oilSeparatorIntervalH: 8000,
    sparePartCodes: {
      airFilter: 'SP-FC-023',
      oilFilter: 'SP-FC-020',
      oilSeparator: 'SP-FC-024',
    },
  },
  {
    machineKey: 'AD300-1',
    displayName: 'Máy sấy hấp thụ AD300-1',
    equipmentCode: 'CMP-AD300-01',
    category: 'Máy sấy hấp thụ',
    tracksConsumables: false,
    oilIntervalH: 0,
    airFilterIntervalH: 0,
    oilFilterIntervalH: 0,
    oilSeparatorIntervalH: 0,
  },
  {
    machineKey: 'AD300-2',
    displayName: 'Máy sấy hấp thụ AD300-2',
    equipmentCode: 'CMP-AD300-02',
    category: 'Máy sấy hấp thụ',
    tracksConsumables: false,
    oilIntervalH: 0,
    airFilterIntervalH: 0,
    oilFilterIntervalH: 0,
    oilSeparatorIntervalH: 0,
  },
  {
    machineKey: 'NPG360-1',
    displayName: 'Máy tạo Nito NPG360-1',
    equipmentCode: 'CMP-NPG-01',
    category: 'Máy tạo Nito',
    tracksConsumables: false,
    oilIntervalH: 0,
    airFilterIntervalH: 0,
    oilFilterIntervalH: 0,
    oilSeparatorIntervalH: 0,
  },
  {
    machineKey: 'NPG360-2',
    displayName: 'Máy tạo Nito NPG360-2',
    equipmentCode: 'CMP-NPG-02',
    category: 'Máy tạo Nito',
    tracksConsumables: false,
    oilIntervalH: 0,
    airFilterIntervalH: 0,
    oilFilterIntervalH: 0,
    oilSeparatorIntervalH: 0,
  },
  {
    machineKey: 'FD220-1',
    displayName: 'Máy sấy khí FD220-1',
    equipmentCode: 'CMP-FD220-01',
    category: 'Máy sấy tác nhân lạnh',
    tracksConsumables: false,
    oilIntervalH: 0,
    airFilterIntervalH: 0,
    oilFilterIntervalH: 0,
    oilSeparatorIntervalH: 0,
  },
  {
    machineKey: 'FD220-2',
    displayName: 'Máy sấy khí FD220-2',
    equipmentCode: 'CMP-FD220-02',
    category: 'Máy sấy tác nhân lạnh',
    tracksConsumables: false,
    oilIntervalH: 0,
    airFilterIntervalH: 0,
    oilFilterIntervalH: 0,
    oilSeparatorIntervalH: 0,
  },
];

export function parseCsvMatrix(csvText: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const cleaned = csvText.replace(/^\uFEFF/, '');

  for (let i = 0; i < cleaned.length; i += 1) {
    const ch = cleaned[i];
    if (inQuotes) {
      if (ch === '"') {
        if (cleaned[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\r') {
      // skip CR
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function escapeCsvCell(val: unknown): string {
  const str = val === null || val === undefined ? '' : String(val);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function cleanText(val: string | undefined): string {
  if (!val) return '';
  return val
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' / ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function isTruthyMark(val: string | undefined): boolean {
  const t = (val || '').trim().toUpperCase();
  return t === 'V' || t === 'Y' || t === 'YES' || t === 'X' || t === '1';
}

function parseOptionalNumber(val: string | undefined): number | null {
  if (!val) return null;
  const trimmed = val.trim();
  if (!trimmed || trimmed === '_' || trimmed === '-' || trimmed.toUpperCase() === 'N/A') return null;
  const num = Number(trimmed.replace(/,/g, ''));
  return Number.isFinite(num) ? num : null;
}

export function normalizeDbAndMsb(rawDb: string): { dbPanel: string; msbSource: string } {
  const cleaned = cleanText(rawDb);
  if (!cleaned || cleaned === '-' || cleaned === '_') {
    return { dbPanel: 'Chưa xác định', msbSource: 'Chưa xác định' };
  }

  const upper = cleaned.toUpperCase();
  if (upper.includes('DB-UPS') || upper === 'UPS') {
    return { dbPanel: 'DB-UPS', msbSource: 'Hệ thống UPS (Nguồn liên tục)' };
  }
  if (upper.includes('SOCKET GRID') || upper === 'SOCKET') {
    return { dbPanel: 'Socket Grid', msbSource: 'Hệ ổ cắm 220V/110V' };
  }

  // Extract parenthesized MSB feeder info if present, e.g. "(DB-P1/380-M2)"
  const parenMatch = cleaned.match(/\(([^)]+)\)/);
  const parenText = parenMatch ? parenMatch[1].replace(/\s+/g, ' ').trim() : '';

  // Infer MSB from feeder tag or DB name
  let msbSource = 'Chưa gán MSB';
  const combinedUpper = `${upper} ${parenText.toUpperCase()}`;
  if (combinedUpper.includes('-M1') || combinedUpper.includes('M1)')) {
    msbSource = parenText ? `MSB 1 (${parenText})` : 'MSB 1';
  } else if (combinedUpper.includes('-M2') || combinedUpper.includes('M2)')) {
    msbSource = parenText ? `MSB 2 (${parenText})` : 'MSB 2';
  } else if (combinedUpper.includes('-M3') || combinedUpper.includes('M3)')) {
    msbSource = parenText ? `MSB 3 (${parenText})` : 'MSB 3';
  } else if (combinedUpper.includes('-M4') || combinedUpper.includes('M4)')) {
    msbSource = parenText ? `MSB 4 (${parenText})` : 'MSB 4';
  } else if (combinedUpper.includes('-M5') || combinedUpper.includes('M5)')) {
    msbSource = parenText ? `MSB 5 (${parenText})` : 'MSB 5';
  } else if (upper.includes('DB-FAC-380V-02') || upper.includes('DB-FAC-380-2')) {
    msbSource = 'MSB 1 (DB-P2/380-M1)';
  } else if (upper.includes('DB-FAC-380V-03') || upper.includes('DB-FAC-380-3')) {
    msbSource = 'MSB 1 (DB-P3/380-M1)';
  } else if (upper.includes('DB-FAC-380V-01') || upper.includes('DB-FAC-380-1') || upper.includes('DB-380V-04') || upper.includes('DB-FAC-380-4')) {
    msbSource = 'MSB 2 (DB-P1/380-M2)';
  } else if (upper.includes('DB-FAC-208') || upper.includes('DB-208')) {
    msbSource = 'MSB 4 (Hệ 208V)';
  } else if (upper.includes('DB-FAC-480')) {
    msbSource = 'MSB 5 (Hệ 480V)';
  } else if (upper.includes('DB-FAC-SO-')) {
    msbSource = 'Hệ tủ Socket / Phụ trợ';
  }

  // Normalize panel ID (strip leading "To ", "ICT 3 New / ", trailing "(...)")
  let panelPart = cleaned
    .replace(/\([^)]*\)/g, '')
    .replace(/^ICT\s*3\s*New\s*\/\s*/i, '')
    .replace(/^To\s+/i, '')
    .trim();

  // Unify naming conventions across factory records
  const panelNorm = panelPart
    .replace(/\s+/g, ' ')
    .replace(/^DB-FAC-380V-0?(\d+(?:\.\d+)?)/i, 'DB-FAC-380-$1')
    .replace(/^DB-380V-0?(\d+)/i, 'DB-FAC-380-$1')
    .replace(/^DB-FAC-208V-0?(\d+)/i, 'DB-FAC-208-$1')
    .replace(/^DB-FAC-380-\s*$/i, 'DB-FAC-380-1')
    .replace(/\s*-\s*P\d+$/i, '')
    .replace(/\/P\d+$/i, '')
    .trim();

  return {
    dbPanel: panelNorm || cleaned,
    msbSource,
  };
}

export function inferConnectivityArea(tenMay: string, tenBanVe: string, dbPanel: string): string {
  const s = `${tenMay} ${tenBanVe}`.toUpperCase();
  if (s.includes('SMT A')) return 'SMT Line A';
  if (s.includes('SMT B')) return 'SMT Line B';
  if (s.includes('SMT C')) return 'SMT Line C';
  if (s.includes('SMT D')) return 'SMT Line D';
  if (s.includes('LASER')) return 'Laser Marking';
  if (s.includes('WAVE ') || s.includes('WASH') || s.includes('HEATING TANK')) return 'Wave & Wash';
  if (s.includes('SELECTIVE')) return 'Selective Wave';
  if (s.includes('COATING') || s.includes('UV ') || s.includes('KỆ PHƠI') || s.includes('BUỒNG QUÉT')) {
    return 'Coating Room';
  }
  if (s.includes('GENERAC') || s.includes('GRID SIMULATOR') || s.includes('INVERTER')) {
    return 'Generac / Inverter Testing';
  }
  if (s.includes('ICT') || s.includes('X RAY') || s.includes('XRAY') || s.includes('THERMAL SHOCK')) {
    return 'ICT, X-Ray & Testing';
  }
  if (s.includes('POTTING') || s.includes('OVEN TESTING') || s.includes('60HZ CONVERTER')) {
    return 'Potting & Oven (PV Link / Teton)';
  }
  if (s.includes('EXHAUST') || s.includes('REWORK') || s.includes('SOLDERING') || s.includes('SOCKET KÉO THẲNG')) {
    return 'Bàn Thao Tác & Rework';
  }
  if (dbPanel === 'DB-UPS') return 'Hệ thống UPS';
  return 'Thiết bị Phụ trợ & Khác';
}

export function inferConnectivityStatus(note: string, dbRaw: string): UtilityConnectivityStatus {
  const lower = `${note} ${dbRaw}`.toLowerCase();
  if (
    lower.includes('đã tháo nguồn') ||
    lower.includes('đã dời') ||
    lower.includes('ngưng sử dụng') ||
    lower.includes('thanh lý')
  ) {
    return 'Đã tháo nguồn / Di dời';
  }
  if (lower.includes('??') || lower.includes('chưa kiểm') || lower.includes('cần bổ sung')) {
    return 'Cần kiểm tra';
  }
  return 'Đang cấp nguồn';
}

export function parseConnectivityCsv(csvText: string): UtilityConnectivityItem[] {
  const rows = parseCsvMatrix(csvText);
  if (rows.length < 2) return [];

  const result: UtilityConnectivityItem[] = [];
  let seq = 1;

  for (let i = 1; i < rows.length; i += 1) {
    const r = rows[i];
    if (!r || !r.some((cell) => (cell || '').trim() !== '')) continue;

    const tenMay = cleanText(r[0]);
    const tenBanVe = cleanText(r[2]);
    if (!tenMay && !tenBanVe) continue;

    const cableSize = cleanText(r[1]);
    const modelManual = cleanText(r[3]);
    const qtyNum = parseOptionalNumber(r[4]);
    const soLuong = qtyNum && qtyNum > 0 ? Math.round(qtyNum) : 1;

    const voltages: string[] = [];
    if (isTruthyMark(r[5])) voltages.push('480V');
    if (isTruthyMark(r[6])) voltages.push('380V');
    if (isTruthyMark(r[7])) voltages.push('208V');
    if (isTruthyMark(r[8])) voltages.push('220V');
    if (isTruthyMark(r[9])) voltages.push('110V');

    let phase: '1P' | '3P' | 'N/A' = 'N/A';
    if (isTruthyMark(r[11]) || (r[11] || '').trim() === '3') {
      phase = '3P';
    } else if (isTruthyMark(r[10]) || (r[10] || '').trim() === '1') {
      phase = '1P';
    }

    const maxCurrentA = parseOptionalNumber(r[12]);
    const dbRaw = cleanText(r[13]);
    const { dbPanel, msbSource } = normalizeDbAndMsb(dbRaw);

    const lan = isTruthyMark(r[14]);
    const nitrogen = isTruthyMark(r[15]);
    const air = isTruthyMark(r[16]);
    const vacuum = isTruthyMark(r[17]);
    const di = isTruthyMark(r[18]);

    const exhaustRaw = cleanText(r[19]);
    const exhaustFlow = parseOptionalNumber(exhaustRaw);
    const exhaust = isTruthyMark(exhaustRaw) || (exhaustFlow !== null && exhaustFlow > 0);

    const ghiChu = cleanText(r[20]);
    const displayMachineName =
      tenMay.toLowerCase() === 'coating room' && tenBanVe
        ? `Coating Room - ${tenBanVe}`
        : tenMay || tenBanVe;

    const khuVuc = inferConnectivityArea(tenMay, tenBanVe, dbPanel);
    const trangThai = inferConnectivityStatus(ghiChu, dbRaw);

    result.push({
      id: `CONN-${String(seq).padStart(3, '0')}`,
      tenMay: displayMachineName,
      khuVuc,
      tenBanVe: tenBanVe === '_' || tenBanVe === '-' ? '' : tenBanVe,
      modelManual: modelManual === '_' || modelManual === '-' ? '' : modelManual,
      soLuong,
      cableSize: cableSize === '_' || cableSize === '-' ? '' : cableSize,
      voltages,
      phase,
      maxCurrentA,
      dbRaw: dbRaw === '_' ? '' : dbRaw,
      dbPanel,
      msbSource,
      utilities: {
        lan,
        nitrogen,
        air,
        vacuum,
        di,
        exhaust,
        exhaustFlowM3h: exhaustFlow,
      },
      trangThai,
      ghiChu,
    });
    seq += 1;
  }

  return result;
}

export function exportConnectivityCsv(items: UtilityConnectivityItem[]): string {
  const header = [
    'Mã',
    'Tên máy',
    'Khu vực / Line',
    'Tên bản vẽ SX',
    'Model / Manual',
    'Số lượng',
    'Cỡ cáp (Cable size)',
    'Điện áp',
    'Số pha',
    'Dòng tối đa (A)',
    'Tủ nhánh (DB)',
    'Nguồn tủ tổng (MSB)',
    'DB-MSB gốc',
    'LAN',
    'Nitrogen',
    'Air (Khí nén)',
    'Vacuum',
    'DI Water',
    'Exhaust (m3/h)',
    'Trạng thái',
    'Ghi chú',
  ];

  const lines = [header.map(escapeCsvCell).join(',')];
  for (const item of items) {
    lines.push(
      [
        item.id,
        item.tenMay,
        item.khuVuc,
        item.tenBanVe,
        item.modelManual,
        item.soLuong,
        item.cableSize,
        item.voltages.join(' / '),
        item.phase,
        item.maxCurrentA ?? '',
        item.dbPanel,
        item.msbSource,
        item.dbRaw,
        item.utilities.lan ? 'Y' : '',
        item.utilities.nitrogen ? 'Y' : '',
        item.utilities.air ? 'Y' : '',
        item.utilities.vacuum ? 'Y' : '',
        item.utilities.di ? 'Y' : '',
        item.utilities.exhaustFlowM3h != null
          ? item.utilities.exhaustFlowM3h
          : item.utilities.exhaust
            ? 'Y'
            : '',
        item.trangThai,
        item.ghiChu,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }
  return `\uFEFF${lines.join('\n')}`;
}

function parseShortVnDateToIso(raw: string): { isoDate: string; extraNote: string } | null {
  const cleaned = raw.replace(/\r/g, '').trim();
  if (!cleaned) return null;
  const match = cleaned.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!match) return null;
  const dd = match[1].padStart(2, '0');
  const mm = match[2].padStart(2, '0');
  const yyyy = match[3].length === 2 ? `20${match[3]}` : match[3];
  const rest = cleaned
    .replace(match[0], '')
    .replace(/[()]/g, ' ')
    .replace(/\n+/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
  return { isoDate: `${yyyy}-${mm}-${dd}`, extraNote: rest };
}

export function parseCompressorRuntimeCsv(csvText: string): CompressorRuntimeStore {
  const rows = parseCsvMatrix(csvText);
  const logsByMonth = new Map<string, CompressorMonthlyLog>();
  const replacementEvents: CompressorReplacementEvent[] = [];

  for (let i = 2; i < rows.length; i += 1) {
    const r = rows[i];
    if (!r || r.length === 0) continue;
    const monthRaw = (r[0] || '').trim();
    const mMatch = monthRaw.match(/^(\d{1,2})\/(\d{4})$/);
    if (!mMatch) continue;

    const mm = mMatch[1].padStart(2, '0');
    const yyyy = mMatch[2];
    const monthIso = `${yyyy}-${mm}`;

    const readings: Record<string, CompressorMachineReading> = {
      'GA75-1': {
        runningHours: parseOptionalNumber(r[1]),
        loadHours: parseOptionalNumber(r[2]),
        oilRemainingH: parseOptionalNumber(r[3]),
        airFilterRemainingH: parseOptionalNumber(r[4]),
        oilFilterRemainingH: parseOptionalNumber(r[5]),
        oilSeparatorRemainingH: parseOptionalNumber(r[6]),
      },
      'GA75-2': {
        runningHours: parseOptionalNumber(r[7]),
        loadHours: parseOptionalNumber(r[8]),
        oilRemainingH: parseOptionalNumber(r[9]),
        airFilterRemainingH: parseOptionalNumber(r[10]),
        oilFilterRemainingH: parseOptionalNumber(r[11]),
        oilSeparatorRemainingH: parseOptionalNumber(r[12]),
      },
      'VSD90-1': {
        runningHours: parseOptionalNumber(r[13]),
        loadHours: parseOptionalNumber(r[14]),
        oilRemainingH: parseOptionalNumber(r[15]),
        airFilterRemainingH: parseOptionalNumber(r[16]),
        oilFilterRemainingH: parseOptionalNumber(r[17]),
        oilSeparatorRemainingH: parseOptionalNumber(r[18]),
      },
      'VSD90-2': {
        runningHours: parseOptionalNumber(r[19]),
        loadHours: parseOptionalNumber(r[20]),
        oilRemainingH: parseOptionalNumber(r[21]),
        airFilterRemainingH: parseOptionalNumber(r[22]),
        oilFilterRemainingH: parseOptionalNumber(r[23]),
        oilSeparatorRemainingH: parseOptionalNumber(r[24]),
      },
      'AD300-1': {
        runningHours: parseOptionalNumber(r[25]),
        loadHours: parseOptionalNumber(r[26]),
      },
      'AD300-2': {
        runningHours: parseOptionalNumber(r[27]),
        loadHours: parseOptionalNumber(r[28]),
      },
      'NPG360-1': {
        runningHours: parseOptionalNumber(r[29]),
        loadHours: parseOptionalNumber(r[30]),
      },
      'NPG360-2': {
        runningHours: parseOptionalNumber(r[31]),
        loadHours: parseOptionalNumber(r[32]),
      },
      'FD220-1': {
        runningHours: parseOptionalNumber(r[33]),
        loadHours: parseOptionalNumber(r[34]),
      },
      'FD220-2': {
        runningHours: parseOptionalNumber(r[35]),
        loadHours: parseOptionalNumber(r[36]),
      },
    };

    const note = cleanText(r[37]);

    // Deduplicate identical months (e.g. duplicate 08/2025 row in spreadsheet)
    logsByMonth.set(monthIso, {
      id: `MNK-LOG-${monthIso}`,
      month: monthIso,
      recordedDate: `${monthIso}-15`,
      readings,
      note: note || undefined,
      recordedBy: 'Import CSV',
    });
  }

  // Parse bottom replacement history table (starting where col[7] === 'STT')
  const histStartIdx = rows.findIndex((r) => (r[7] || '').trim().toUpperCase() === 'STT');
  if (histStartIdx >= 0) {
    let evSeq = 1;
    const consumableCols: Array<{ col: number; type: CompressorConsumableType; defaultInterval: number }> = [
      { col: 8, type: 'oil', defaultInterval: 8000 },
      { col: 9, type: 'airFilter', defaultInterval: 4000 },
      { col: 10, type: 'oilFilter', defaultInterval: 8000 },
      { col: 11, type: 'oilSeparator', defaultInterval: 8000 },
      { col: 12, type: 'thermostatValve', defaultInterval: 16000 },
    ];

    for (let i = histStartIdx + 1; i < rows.length; i += 1) {
      const r = rows[i];
      const machineKey = cleanText(r[7]);
      if (!machineKey) continue;

      for (const spec of consumableCols) {
        const cell = (r[spec.col] || '').trim();
        if (!cell) continue;
        const parsed = parseShortVnDateToIso(cell);
        if (!parsed) continue;
        const is4000 = /4000\s*h/i.test(parsed.extraNote);
        replacementEvents.push({
          id: `MNK-REP-${String(evSeq).padStart(3, '0')}`,
          machineKey,
          date: parsed.isoDate,
          consumable: spec.type,
          newIntervalH: is4000 ? 4000 : spec.defaultInterval,
          note: parsed.extraNote || undefined,
          performedBy: 'Đội Kỹ thuật Utility',
        });
        evSeq += 1;
      }
    }
  }

  const monthlyLogs = Array.from(logsByMonth.values()).sort((a, b) => a.month.localeCompare(b.month));
  replacementEvents.sort((a, b) => b.date.localeCompare(a.date));

  return {
    warningThresholdH: 2000,
    readingDayOfMonth: 15,
    unitSpecs: DEFAULT_COMPRESSOR_UNIT_SPECS,
    monthlyLogs,
    replacementEvents,
    updatedAt: new Date().toISOString(),
  };
}

export function exportCompressorRuntimeCsv(store: CompressorRuntimeStore): string {
  const header1 = [
    'Tháng',
    'GA75-1 Giờ chạy',
    'GA75-1 Có tải',
    'GA75-1 Dầu còn lại',
    'GA75-1 Lọc gió còn lại',
    'GA75-1 Lọc dầu còn lại',
    'GA75-1 Tách dầu còn lại',
    'GA75-2 Giờ chạy',
    'GA75-2 Có tải',
    'GA75-2 Dầu còn lại',
    'GA75-2 Lọc gió còn lại',
    'GA75-2 Lọc dầu còn lại',
    'GA75-2 Tách dầu còn lại',
    'VSD90-1 Giờ chạy',
    'VSD90-1 Có tải',
    'VSD90-1 Dầu còn lại',
    'VSD90-1 Lọc gió còn lại',
    'VSD90-1 Lọc dầu còn lại',
    'VSD90-1 Tách dầu còn lại',
    'VSD90-2 Giờ chạy',
    'VSD90-2 Có tải',
    'VSD90-2 Dầu còn lại',
    'VSD90-2 Lọc gió còn lại',
    'VSD90-2 Lọc dầu còn lại',
    'VSD90-2 Tách dầu còn lại',
    'AD300-1 Giờ chạy',
    'AD300-2 Giờ chạy',
    'NPG360-1 Giờ chạy',
    'NPG360-2 Giờ chạy',
    'FD220-1 Giờ chạy',
    'FD220-2 Giờ chạy',
    'Ghi chú',
  ];

  const sorted = [...store.monthlyLogs].sort((a, b) => a.month.localeCompare(b.month));
  const lines = [header1.map(escapeCsvCell).join(',')];

  for (const log of sorted) {
    const [yyyy, mm] = log.month.split('-');
    const r = log.readings;
    const g1 = r['GA75-1'] || ({} as CompressorMachineReading);
    const g2 = r['GA75-2'] || ({} as CompressorMachineReading);
    const v1 = r['VSD90-1'] || ({} as CompressorMachineReading);
    const v2 = r['VSD90-2'] || ({} as CompressorMachineReading);
    lines.push(
      [
        `${mm}/${yyyy}`,
        g1.runningHours ?? '',
        g1.loadHours ?? '',
        g1.oilRemainingH ?? '',
        g1.airFilterRemainingH ?? '',
        g1.oilFilterRemainingH ?? '',
        g1.oilSeparatorRemainingH ?? '',
        g2.runningHours ?? '',
        g2.loadHours ?? '',
        g2.oilRemainingH ?? '',
        g2.airFilterRemainingH ?? '',
        g2.oilFilterRemainingH ?? '',
        g2.oilSeparatorRemainingH ?? '',
        v1.runningHours ?? '',
        v1.loadHours ?? '',
        v1.oilRemainingH ?? '',
        v1.airFilterRemainingH ?? '',
        v1.oilFilterRemainingH ?? '',
        v1.oilSeparatorRemainingH ?? '',
        v2.runningHours ?? '',
        v2.loadHours ?? '',
        v2.oilRemainingH ?? '',
        v2.airFilterRemainingH ?? '',
        v2.oilFilterRemainingH ?? '',
        v2.oilSeparatorRemainingH ?? '',
        r['AD300-1']?.runningHours ?? '',
        r['AD300-2']?.runningHours ?? '',
        r['NPG360-1']?.runningHours ?? '',
        r['NPG360-2']?.runningHours ?? '',
        r['FD220-1']?.runningHours ?? '',
        r['FD220-2']?.runningHours ?? '',
        log.note || '',
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  return `\uFEFF${lines.join('\n')}`;
}

export type ConsumableAlertLevel = 'qua_han' | 'sap_den_han' | 'an_toan' | 'khong_ro';

export interface ConsumableStatusInfo {
  type: 'oil' | 'airFilter' | 'oilFilter' | 'oilSeparator';
  label: string;
  intervalH: number;
  remainingH: number | null;
  usedPct: number;
  alertLevel: ConsumableAlertLevel;
  estimatedDaysLeft: number | null;
  estimatedDueDate: string | null;
  lastReplacedDate: string | null;
  sparePartCode?: string;
  formulaAnomaly?: string;
}

export interface CompressorUnitAnalytics {
  spec: CompressorUnitSpec;
  latestMonth: string | null;
  latestValidMonth: string | null;
  isMissingLatestReading: boolean;
  runningHours: number | null;
  loadHours: number | null;
  loadRatioPct: number | null;
  deltaLastMonthH: number | null;
  avgHoursPerMonth: number;
  avgHoursPerDay: number;
  consumables: ConsumableStatusInfo[];
  worstAlert: ConsumableAlertLevel;
  anomalies: string[];
}

function monthsBetween(m1: string, m2: string): number {
  const [y1, mo1] = m1.split('-').map(Number);
  const [y2, mo2] = m2.split('-').map(Number);
  if (!y1 || !mo1 || !y2 || !mo2) return 1;
  return Math.max(1, (y2 - y1) * 12 + (mo2 - mo1));
}

function addDaysToIso(baseIsoDate: string, days: number): string {
  const d = new Date(`${baseIsoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + Math.round(days));
  return d.toISOString().slice(0, 10);
}

export function analyzeCompressorStore(store: CompressorRuntimeStore): {
  latestLog: CompressorMonthlyLog | null;
  units: CompressorUnitAnalytics[];
  overdueAlerts: Array<{ machineKey: string; displayName: string; item: ConsumableStatusInfo }>;
  warningAlerts: Array<{ machineKey: string; displayName: string; item: ConsumableStatusInfo }>;
  allAnomalies: Array<{ machineKey: string; message: string }>;
} {
  const sortedLogs = [...store.monthlyLogs].sort((a, b) => a.month.localeCompare(b.month));
  const latestLog = sortedLogs.length > 0 ? sortedLogs[sortedLogs.length - 1] : null;
  const warningThreshold = store.warningThresholdH || 2000;

  const units: CompressorUnitAnalytics[] = [];
  const overdueAlerts: Array<{ machineKey: string; displayName: string; item: ConsumableStatusInfo }> = [];
  const warningAlerts: Array<{ machineKey: string; displayName: string; item: ConsumableStatusInfo }> = [];
  const allAnomalies: Array<{ machineKey: string; message: string }> = [];

  for (const spec of store.unitSpecs) {
    const key = spec.machineKey;
    const validPoints = sortedLogs
      .map((l) => ({ month: l.month, recordedDate: l.recordedDate, reading: l.readings[key] }))
      .filter((p) => p.reading && p.reading.runningHours !== null && p.reading.runningHours !== undefined);

    const latestValid = validPoints.length > 0 ? validPoints[validPoints.length - 1] : null;
    const prevValid = validPoints.length > 1 ? validPoints[validPoints.length - 2] : null;

    const latestReading = latestLog?.readings[key] || null;
    const isMissingLatestReading = Boolean(
      latestLog && (!latestReading || latestReading.runningHours === null || latestReading.runningHours === undefined)
    );

    const runningHours = latestValid?.reading.runningHours ?? null;
    const loadHours = latestValid?.reading.loadHours ?? null;
    const loadRatioPct =
      runningHours && runningHours > 0 && loadHours !== null && loadHours <= runningHours
        ? Math.round((loadHours / runningHours) * 1000) / 10
        : null;

    const deltaLastMonthH =
      latestValid && prevValid && latestValid.reading.runningHours !== null && prevValid.reading.runningHours !== null
        ? Math.max(0, latestValid.reading.runningHours - prevValid.reading.runningHours)
        : null;

    // Average run rate over last up-to-6 valid months
    let avgHoursPerMonth = 0;
    if (validPoints.length >= 2) {
      const windowStart = validPoints[Math.max(0, validPoints.length - 7)];
      const windowEnd = validPoints[validPoints.length - 1];
      const totalDelta = Math.max(
        0,
        (windowEnd.reading.runningHours || 0) - (windowStart.reading.runningHours || 0)
      );
      const spanMonths = monthsBetween(windowStart.month, windowEnd.month);
      avgHoursPerMonth = Math.round(totalDelta / spanMonths);
    }
    const avgHoursPerDay = Math.round((avgHoursPerMonth / 30) * 10) / 10;

    const anomalies: string[] = [];
    if (isMissingLatestReading && latestValid && latestLog) {
      const msg = `Chưa có chỉ số giờ chạy từ sau tháng ${latestValid.month.split('-').reverse().join('/')} (đang trống đến ${latestLog.month.split('-').reverse().join('/')}).`;
      anomalies.push(msg);
      allAnomalies.push({ machineKey: key, message: msg });
    }

    const consumables: ConsumableStatusInfo[] = [];
    if (spec.tracksConsumables) {
      // Use latestValid's remaining values when latestLog has empty runningHours (avoids Excel 18852h bug!)
      const activeReading = isMissingLatestReading ? latestValid?.reading : latestReading;
      const baseDateIso = (isMissingLatestReading ? latestValid?.recordedDate : latestLog?.recordedDate) || new Date().toISOString().slice(0, 10);

      const mapField: Array<{
        type: 'oil' | 'airFilter' | 'oilFilter' | 'oilSeparator';
        field: 'oilRemainingH' | 'airFilterRemainingH' | 'oilFilterRemainingH' | 'oilSeparatorRemainingH';
        intervalH: number;
        spareCode?: string;
      }> = [
        { type: 'oil', field: 'oilRemainingH', intervalH: spec.oilIntervalH || 8000, spareCode: spec.sparePartCodes?.oil },
        { type: 'airFilter', field: 'airFilterRemainingH', intervalH: spec.airFilterIntervalH || 4000, spareCode: spec.sparePartCodes?.airFilter },
        { type: 'oilFilter', field: 'oilFilterRemainingH', intervalH: spec.oilFilterIntervalH || 8000, spareCode: spec.sparePartCodes?.oilFilter },
        { type: 'oilSeparator', field: 'oilSeparatorRemainingH', intervalH: spec.oilSeparatorIntervalH || 8000, spareCode: spec.sparePartCodes?.oilSeparator },
      ];

      for (const m of mapField) {
        const rawRem = activeReading?.[m.field] ?? null;
        let formulaAnomaly: string | undefined;

        // Detect inverted formula in legacy spreadsheet (remaining increases when runningHours increases without a replacement!)
        if (validPoints.length >= 3 && !isMissingLatestReading) {
          const pA = validPoints[validPoints.length - 3];
          const pB = validPoints[validPoints.length - 2];
          const pC = validPoints[validPoints.length - 1];
          const rA = pA.reading[m.field];
          const rB = pB.reading[m.field];
          const rC = pC.reading[m.field];
          const dRun1 = (pB.reading.runningHours || 0) - (pA.reading.runningHours || 0);
          const dRun2 = (pC.reading.runningHours || 0) - (pB.reading.runningHours || 0);
          if (
            typeof rA === 'number' &&
            typeof rB === 'number' &&
            typeof rC === 'number' &&
            dRun1 > 10 &&
            dRun2 > 10 &&
            rB > rA &&
            rC > rB &&
            rB - rA < 1500 &&
            rC - rB < 1500
          ) {
            formulaAnomaly = `Số giờ còn lại của ${CONSUMABLE_META[m.type].shortLabel} đang tăng ngược theo giờ chạy (lỗi công thức từ file Excel gốc) — hãy kiểm tra & cập nhật lại mốc thay.`;
            anomalies.push(formulaAnomaly);
            allAnomalies.push({ machineKey: key, message: formulaAnomaly });
          }
        }

        const effectiveInterval = rawRem !== null && rawRem > m.intervalH && rawRem <= 8000 ? 8000 : m.intervalH;
        const usedPct =
          rawRem === null
            ? 0
            : Math.min(100, Math.max(0, Math.round(((effectiveInterval - rawRem) / effectiveInterval) * 100)));

        let alertLevel: ConsumableAlertLevel = 'khong_ro';
        if (rawRem !== null) {
          if (rawRem <= 0) alertLevel = 'qua_han';
          else if (rawRem < warningThreshold) alertLevel = 'sap_den_han';
          else alertLevel = 'an_toan';
        }

        const estimatedDaysLeft =
          rawRem !== null && avgHoursPerDay > 0 ? Math.round(rawRem / avgHoursPerDay) : null;
        const estimatedDueDate =
          estimatedDaysLeft !== null ? addDaysToIso(baseDateIso, estimatedDaysLeft) : null;

        const latestRep = store.replacementEvents.find(
          (ev) => ev.machineKey === key && ev.consumable === m.type
        );

        const info: ConsumableStatusInfo = {
          type: m.type,
          label: CONSUMABLE_META[m.type].label,
          intervalH: effectiveInterval,
          remainingH: rawRem,
          usedPct,
          alertLevel,
          estimatedDaysLeft,
          estimatedDueDate,
          lastReplacedDate: latestRep?.date || null,
          sparePartCode: m.spareCode,
          formulaAnomaly,
        };
        consumables.push(info);

        if (alertLevel === 'qua_han') {
          overdueAlerts.push({ machineKey: key, displayName: spec.displayName, item: info });
        } else if (alertLevel === 'sap_den_han') {
          warningAlerts.push({ machineKey: key, displayName: spec.displayName, item: info });
        }
      }
    }

    let worstAlert: ConsumableAlertLevel = 'an_toan';
    if (consumables.some((c) => c.alertLevel === 'qua_han')) worstAlert = 'qua_han';
    else if (consumables.some((c) => c.alertLevel === 'sap_den_han')) worstAlert = 'sap_den_han';
    else if (consumables.length === 0) worstAlert = 'an_toan';

    units.push({
      spec,
      latestMonth: latestLog?.month || null,
      latestValidMonth: latestValid?.month || null,
      isMissingLatestReading,
      runningHours,
      loadHours,
      loadRatioPct,
      deltaLastMonthH,
      avgHoursPerMonth,
      avgHoursPerDay,
      consumables,
      worstAlert,
      anomalies,
    });
  }

  return { latestLog, units, overdueAlerts, warningAlerts, allAnomalies };
}

export function calculateNextMonthReadings(
  prevLog: CompressorMonthlyLog | null,
  nextInputs: Record<string, { runningHours: number | null; loadHours: number | null }>,
  unitSpecs: CompressorUnitSpec[]
): Record<string, CompressorMachineReading> {
  const result: Record<string, CompressorMachineReading> = {};

  for (const spec of unitSpecs) {
    const key = spec.machineKey;
    const prev = prevLog?.readings[key];
    const inp = nextInputs[key] || { runningHours: null, loadHours: null };
    const newRun = inp.runningHours;
    const newLoad = inp.loadHours;

    if (!spec.tracksConsumables) {
      result[key] = { runningHours: newRun, loadHours: newLoad };
      continue;
    }

    const prevRun = prev?.runningHours ?? null;
    const delta =
      newRun !== null && prevRun !== null && newRun >= prevRun ? newRun - prevRun : 0;

    const subtractSafe = (prevRem: number | null | undefined, fallbackInterval: number) => {
      if (newRun === null) return prevRem ?? null;
      if (typeof prevRem === 'number') {
        return Math.round(prevRem - delta);
      }
      return fallbackInterval;
    };

    result[key] = {
      runningHours: newRun,
      loadHours: newLoad,
      oilRemainingH: subtractSafe(prev?.oilRemainingH, spec.oilIntervalH || 8000),
      airFilterRemainingH: subtractSafe(prev?.airFilterRemainingH, spec.airFilterIntervalH || 4000),
      oilFilterRemainingH: subtractSafe(prev?.oilFilterRemainingH, spec.oilFilterIntervalH || 8000),
      oilSeparatorRemainingH: subtractSafe(prev?.oilSeparatorRemainingH, spec.oilSeparatorIntervalH || 8000),
    };
  }

  return result;
}
