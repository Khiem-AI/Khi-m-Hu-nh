import { CompressorRuntimeStore, UtilityConnectivityItem } from '../types/cmms';

// Auto-seeded from Connectivity_661c317e.csv (147 items)
export const INITIAL_UTILITY_CONNECTIVITY: UtilityConnectivityItem[] = [
  {
    "id": "CONN-001",
    "tenMay": "Laser marking 1",
    "khuVuc": "Laser Marking",
    "tenBanVe": "Laser 1",
    "modelManual": "YT line",
    "soLuong": 1,
    "cableSize": "3x4mm2",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 10,
    "dbRaw": "To DB-FAC-380-4 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-4",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-002",
    "tenMay": "Laser marking 2",
    "khuVuc": "Laser Marking",
    "tenBanVe": "Laser 2",
    "modelManual": "YT line",
    "soLuong": 1,
    "cableSize": "3x4mm2",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 10,
    "dbRaw": "To DB-FAC-380-4 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-4",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": true,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-003",
    "tenMay": "SMT A - Loader",
    "khuVuc": "SMT Line A",
    "tenBanVe": "",
    "modelManual": "Conveyor Tech",
    "soLuong": 1,
    "cableSize": "3x4mm2",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 5,
    "dbRaw": "To DB-FAC-380-1 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-1",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": true,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-004",
    "tenMay": "SMT A - Printer",
    "khuVuc": "SMT Line A",
    "tenBanVe": "Dek Printer",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "3x4mm2",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 5,
    "dbRaw": "To DB-FAC-380-1 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-1",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-005",
    "tenMay": "SMT A - Mounter 1",
    "khuVuc": "SMT Line A",
    "tenBanVe": "HF 3",
    "modelManual": "SIPLACE HF3",
    "soLuong": 1,
    "cableSize": "4mm2 / 4mm2 PE",
    "voltages": [
      "208V"
    ],
    "phase": "3P",
    "maxCurrentA": 19,
    "dbRaw": "DB-UPS",
    "dbPanel": "DB-UPS",
    "msbSource": "Hệ thống UPS (Nguồn liên tục)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-006",
    "tenMay": "SMT A - Mounter 2",
    "khuVuc": "SMT Line A",
    "tenBanVe": "HF 3",
    "modelManual": "SIPLACE HF3",
    "soLuong": 1,
    "cableSize": "4mm2 / 4mm2 PE",
    "voltages": [
      "208V"
    ],
    "phase": "3P",
    "maxCurrentA": 19,
    "dbRaw": "DB-UPS",
    "dbPanel": "DB-UPS",
    "msbSource": "Hệ thống UPS (Nguồn liên tục)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-007",
    "tenMay": "SMT A - Tray cabinet",
    "khuVuc": "SMT Line A",
    "tenBanVe": "Tray cabinet",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "4mm2 / 4mm2 PE",
    "voltages": [
      "208V"
    ],
    "phase": "3P",
    "maxCurrentA": 4,
    "dbRaw": "To DB-FAC-208-1 (DB-P1/208-M4)",
    "dbPanel": "DB-FAC-208-1",
    "msbSource": "MSB 4 (DB-P1/208-M4)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-008",
    "tenMay": "SMT A - Converyer",
    "khuVuc": "SMT Line A",
    "tenBanVe": "Converyer",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 5,
    "dbRaw": "-",
    "dbPanel": "Chưa xác định",
    "msbSource": "Chưa xác định",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-009",
    "tenMay": "SMT A - Reflow 1",
    "khuVuc": "SMT Line A",
    "tenBanVe": "Pyramax 125A Reflow",
    "modelManual": "Pyramax 125A",
    "soLuong": 1,
    "cableSize": "50mm2 / 25mm2 PE",
    "voltages": [
      "480V"
    ],
    "phase": "3P",
    "maxCurrentA": 111,
    "dbRaw": "To DB-FAC-480-1 (DB-P1/480-M5)",
    "dbPanel": "DB-FAC-480-1",
    "msbSource": "MSB 5 (DB-P1/480-M5)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": true,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-010",
    "tenMay": "SMT A - AOI",
    "khuVuc": "SMT Line A",
    "tenBanVe": "QX1500 AOI",
    "modelManual": "CYBEROPTICS QX1500",
    "soLuong": 1,
    "cableSize": "3x4mm2",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 5,
    "dbRaw": "To DB-FAC-380-1(DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-1",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": true,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-011",
    "tenMay": "SMT A - Socket 110/220 - 1",
    "khuVuc": "SMT Line A",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V",
      "110V"
    ],
    "phase": "1P",
    "maxCurrentA": 16,
    "dbRaw": "Conect to socket Grid",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-012",
    "tenMay": "SMT A - Socket 110/220 - 2",
    "khuVuc": "SMT Line A",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V",
      "110V"
    ],
    "phase": "1P",
    "maxCurrentA": 16,
    "dbRaw": "Conect to socket Grid",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-013",
    "tenMay": "SMT A - Socket 110/220 - 3",
    "khuVuc": "SMT Line A",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V",
      "110V"
    ],
    "phase": "1P",
    "maxCurrentA": 16,
    "dbRaw": "Conect to socket Grid",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-014",
    "tenMay": "SMT A - Socket 110/220 - 4",
    "khuVuc": "SMT Line A",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V",
      "110V"
    ],
    "phase": "1P",
    "maxCurrentA": 16,
    "dbRaw": "Conect to socket Grid",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-015",
    "tenMay": "SMT A - Socket 110/220 - 5",
    "khuVuc": "SMT Line A",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V",
      "110V"
    ],
    "phase": "1P",
    "maxCurrentA": 16,
    "dbRaw": "Conect to socket Grid",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-016",
    "tenMay": "SMT A - Socket 110/220 - 6",
    "khuVuc": "SMT Line A",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V",
      "110V"
    ],
    "phase": "1P",
    "maxCurrentA": 16,
    "dbRaw": "Conect to socket Grid",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-017",
    "tenMay": "SMT B - Loader",
    "khuVuc": "SMT Line B",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "3x4mm2",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 5,
    "dbRaw": "To DB-FAC-380-1 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-1",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": true,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-018",
    "tenMay": "SMT B - PIC 01",
    "khuVuc": "SMT Line B",
    "tenBanVe": "PIC 01",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [],
    "phase": "N/A",
    "maxCurrentA": null,
    "dbRaw": "-",
    "dbPanel": "Chưa xác định",
    "msbSource": "Chưa xác định",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-019",
    "tenMay": "SMT B - Printer",
    "khuVuc": "SMT Line B",
    "tenBanVe": "Dek Printer",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "3x4mm2",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 6,
    "dbRaw": "To DB-FAC-380-1 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-1",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-020",
    "tenMay": "SMT B - SPI",
    "khuVuc": "SMT Line B",
    "tenBanVe": "",
    "modelManual": "Kohyoung",
    "soLuong": 1,
    "cableSize": "3x4mm2",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 10,
    "dbRaw": "To DB-FAC-380-1 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-1",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-021",
    "tenMay": "SMT B - Mounter 1",
    "khuVuc": "SMT Line B",
    "tenBanVe": "SX",
    "modelManual": "SIPLACE SX",
    "soLuong": 1,
    "cableSize": "4mm2 / 4mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 10,
    "dbRaw": "DB-UPS",
    "dbPanel": "DB-UPS",
    "msbSource": "Hệ thống UPS (Nguồn liên tục)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-022",
    "tenMay": "SMT B - Mounter 2",
    "khuVuc": "SMT Line B",
    "tenBanVe": "SX",
    "modelManual": "SIPLACE SX",
    "soLuong": 1,
    "cableSize": "4mm2 / 4mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 10,
    "dbRaw": "DB-UPS",
    "dbPanel": "DB-UPS",
    "msbSource": "Hệ thống UPS (Nguồn liên tục)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-023",
    "tenMay": "SMT B - Tray cabinet",
    "khuVuc": "SMT Line B",
    "tenBanVe": "Tray cabinet",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "4mm2 / 4mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 5,
    "dbRaw": "To DB-FAC-380- ( DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-1",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-024",
    "tenMay": "SMT B - Converyer",
    "khuVuc": "SMT Line B",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 5,
    "dbRaw": "To DB-FAC-380-1 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-1",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-025",
    "tenMay": "SMT B - Reflow",
    "khuVuc": "SMT Line B",
    "tenBanVe": "Ommi Excel 7 Reflow",
    "modelManual": "Ommi excel 7",
    "soLuong": 1,
    "cableSize": "25mm2 / 16mm2 PE",
    "voltages": [
      "480V"
    ],
    "phase": "3P",
    "maxCurrentA": 60,
    "dbRaw": "To DB-FAC-480-1 (DB-P1/480-M5)",
    "dbPanel": "DB-FAC-480-1",
    "msbSource": "MSB 5 (DB-P1/480-M5)",
    "utilities": {
      "lan": false,
      "nitrogen": true,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": true,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-026",
    "tenMay": "SMT B - AOI",
    "khuVuc": "SMT Line B",
    "tenBanVe": "QX600 AOI",
    "modelManual": "CYBEROPTICS QX600",
    "soLuong": 1,
    "cableSize": "3x4mm2",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 5,
    "dbRaw": "To DB-FAC-380-1 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-1",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": true,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-027",
    "tenMay": "SMT B - AC for printer",
    "khuVuc": "SMT Line B",
    "tenBanVe": "",
    "modelManual": "EAC 1000E5",
    "soLuong": 1,
    "cableSize": "3x4mm2",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 6,
    "dbRaw": "To DB-FAC-380-1 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-1",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-028",
    "tenMay": "SMT B - Socket 110/220 - 1",
    "khuVuc": "SMT Line B",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V",
      "110V"
    ],
    "phase": "1P",
    "maxCurrentA": 16,
    "dbRaw": "Conect to socket Grid",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-029",
    "tenMay": "SMT B - Socket 110/220 - 2",
    "khuVuc": "SMT Line B",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V",
      "110V"
    ],
    "phase": "1P",
    "maxCurrentA": 16,
    "dbRaw": "Conect to socket Grid",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-030",
    "tenMay": "SMT B - Socket 110/220 - 3",
    "khuVuc": "SMT Line B",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V",
      "110V"
    ],
    "phase": "1P",
    "maxCurrentA": 16,
    "dbRaw": "Conect to socket Grid",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-031",
    "tenMay": "SMT B - Socket 110/220 - 4",
    "khuVuc": "SMT Line B",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V",
      "110V"
    ],
    "phase": "1P",
    "maxCurrentA": 16,
    "dbRaw": "Conect to socket Grid",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-032",
    "tenMay": "SMT B - Socket 110/220 - 5",
    "khuVuc": "SMT Line B",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V",
      "110V"
    ],
    "phase": "1P",
    "maxCurrentA": 16,
    "dbRaw": "Conect to socket Grid",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-033",
    "tenMay": "SMT B - Socket 110/220 - 6",
    "khuVuc": "SMT Line B",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V",
      "110V"
    ],
    "phase": "1P",
    "maxCurrentA": 16,
    "dbRaw": "Conect to socket Grid",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-034",
    "tenMay": "SMT C - Loader",
    "khuVuc": "SMT Line C",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "3x4mm2",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 5,
    "dbRaw": "To DB-FAC-380-1 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-1",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": true,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-035",
    "tenMay": "SMT C - Printer",
    "khuVuc": "SMT Line C",
    "tenBanVe": "Dek Printer",
    "modelManual": "Dek",
    "soLuong": 1,
    "cableSize": "3x4mm2",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 6,
    "dbRaw": "To DB-FAC-380-1 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-1",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-036",
    "tenMay": "SMT C - AC for printer",
    "khuVuc": "SMT Line C",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 6,
    "dbRaw": "To DB-FAC-380-1 ( DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-1",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-037",
    "tenMay": "SMT C - SPI",
    "khuVuc": "SMT Line C",
    "tenBanVe": "SPI",
    "modelManual": "Kohyoung",
    "soLuong": 1,
    "cableSize": "3x4mm2",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 5,
    "dbRaw": "To DB-FAC-380-1 ( DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-1",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-038",
    "tenMay": "SMT C - Mounter 1",
    "khuVuc": "SMT Line C",
    "tenBanVe": "SX",
    "modelManual": "SIPLACE SX",
    "soLuong": 1,
    "cableSize": "4mm2 / 4mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 16,
    "dbRaw": "DB-UPS",
    "dbPanel": "DB-UPS",
    "msbSource": "Hệ thống UPS (Nguồn liên tục)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-039",
    "tenMay": "SMT C - Mounter 2",
    "khuVuc": "SMT Line C",
    "tenBanVe": "SX",
    "modelManual": "SIPLACE SX",
    "soLuong": 1,
    "cableSize": "4mm2 / 4mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 16,
    "dbRaw": "DB-UPS",
    "dbPanel": "DB-UPS",
    "msbSource": "Hệ thống UPS (Nguồn liên tục)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-040",
    "tenMay": "SMT C - Mounter 3",
    "khuVuc": "SMT Line C",
    "tenBanVe": "SX",
    "modelManual": "SIPLACE SX",
    "soLuong": 1,
    "cableSize": "4mm2 / 4mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 16,
    "dbRaw": "DB-UPS",
    "dbPanel": "DB-UPS",
    "msbSource": "Hệ thống UPS (Nguồn liên tục)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-041",
    "tenMay": "SMT C - Tray Cabinet",
    "khuVuc": "SMT Line C",
    "tenBanVe": "Tray cabinet",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "4mm2 / 4mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 5,
    "dbRaw": "To DB-FAC-380-1 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-1",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-042",
    "tenMay": "SMT C - Converyer",
    "khuVuc": "SMT Line C",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 5,
    "dbRaw": "-",
    "dbPanel": "Chưa xác định",
    "msbSource": "Chưa xác định",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-043",
    "tenMay": "SMT C - Reflow",
    "khuVuc": "SMT Line C",
    "tenBanVe": "Hotflow 3-20 Reflow",
    "modelManual": "Hotflow 3-20",
    "soLuong": 1,
    "cableSize": "50mm2 / 25mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 160,
    "dbRaw": "To DB-FAC-380-1 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-1",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": true,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": true,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-044",
    "tenMay": "SMT C - AOI",
    "khuVuc": "SMT Line C",
    "tenBanVe": "Zenith AOI",
    "modelManual": "Zenith",
    "soLuong": 1,
    "cableSize": "3x4mm2",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 5,
    "dbRaw": "To DB-FAC-380-1 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-1",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": true,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-045",
    "tenMay": "SMT C - Unloader",
    "khuVuc": "SMT Line C",
    "tenBanVe": "",
    "modelManual": "Nuteck",
    "soLuong": 1,
    "cableSize": "3x4mm2",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 3,
    "dbRaw": "To DB-FAC-380-1 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-1",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-046",
    "tenMay": "SMT C - Socket 110/220 - 1",
    "khuVuc": "SMT Line C",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V",
      "110V"
    ],
    "phase": "1P",
    "maxCurrentA": 16,
    "dbRaw": "Conect to socket Grid",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-047",
    "tenMay": "SMT C - Socket 110/220 - 2",
    "khuVuc": "SMT Line C",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V",
      "110V"
    ],
    "phase": "1P",
    "maxCurrentA": 16,
    "dbRaw": "Conect to socket Grid",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-048",
    "tenMay": "SMT C - Socket 110/220 - 3",
    "khuVuc": "SMT Line C",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V",
      "110V"
    ],
    "phase": "1P",
    "maxCurrentA": 16,
    "dbRaw": "Conect to socket Grid",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-049",
    "tenMay": "SMT C - Socket 110/220 - 4",
    "khuVuc": "SMT Line C",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V",
      "110V"
    ],
    "phase": "1P",
    "maxCurrentA": 16,
    "dbRaw": "Conect to socket Grid",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-050",
    "tenMay": "SMT C - Socket 110/220 - 5",
    "khuVuc": "SMT Line C",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V",
      "110V"
    ],
    "phase": "1P",
    "maxCurrentA": 16,
    "dbRaw": "Conect to socket Grid",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-051",
    "tenMay": "SMT C - Socket 110/220 - 6",
    "khuVuc": "SMT Line C",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V",
      "110V"
    ],
    "phase": "1P",
    "maxCurrentA": 16,
    "dbRaw": "Conect to socket Grid",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-052",
    "tenMay": "SMT D - Loader",
    "khuVuc": "SMT Line D",
    "tenBanVe": "",
    "modelManual": "YJLINK",
    "soLuong": 1,
    "cableSize": "3x4mm2",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 5,
    "dbRaw": "To DB-FAC-380-1 ( DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-1",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": true,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-053",
    "tenMay": "SMT D - Printer",
    "khuVuc": "SMT Line D",
    "tenBanVe": "ESE Printer",
    "modelManual": "ESE",
    "soLuong": 1,
    "cableSize": "3x4mm2",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 15,
    "dbRaw": "To DB-FAC-380-1 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-1",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-054",
    "tenMay": "SMT D - AC for printer",
    "khuVuc": "SMT Line D",
    "tenBanVe": "",
    "modelManual": "EAC 1000E5",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 5,
    "dbRaw": "To DB-FAC-380-1 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-1",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-055",
    "tenMay": "SMT D - SPI",
    "khuVuc": "SMT Line D",
    "tenBanVe": "SPI",
    "modelManual": "Kohyoung",
    "soLuong": 1,
    "cableSize": "3x4mm2",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 10,
    "dbRaw": "To DB-FAC-380-1 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-1",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-056",
    "tenMay": "SMT D - Mounter 1",
    "khuVuc": "SMT Line D",
    "tenBanVe": "X Series",
    "modelManual": "ASM X3S",
    "soLuong": 1,
    "cableSize": "4mm2 / 4mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 10,
    "dbRaw": "DB-UPS",
    "dbPanel": "DB-UPS",
    "msbSource": "Hệ thống UPS (Nguồn liên tục)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-057",
    "tenMay": "SMT D - Mounter 2",
    "khuVuc": "SMT Line D",
    "tenBanVe": "X Series",
    "modelManual": "ASM X3S",
    "soLuong": 1,
    "cableSize": "4mm2 / 4mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 10,
    "dbRaw": "DB-UPS",
    "dbPanel": "DB-UPS",
    "msbSource": "Hệ thống UPS (Nguồn liên tục)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-058",
    "tenMay": "SMT D - Tray cabinet",
    "khuVuc": "SMT Line D",
    "tenBanVe": "Tray cabinet",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "4mm2 / 4mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 5,
    "dbRaw": "To DB-FAC-380-1 (DB-P1/380-M2 )",
    "dbPanel": "DB-FAC-380-1",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-059",
    "tenMay": "SMT D - Converyer",
    "khuVuc": "SMT Line D",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 3,
    "dbRaw": "-",
    "dbPanel": "Chưa xác định",
    "msbSource": "Chưa xác định",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-060",
    "tenMay": "SMT D - Reflow",
    "khuVuc": "SMT Line D",
    "tenBanVe": "Hotflow 3-20XL Reflow",
    "modelManual": "Hotflow 3/20 XL",
    "soLuong": 1,
    "cableSize": "50mm2 / 25mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 180,
    "dbRaw": "To DB-FAC-380-1 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-1",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": true,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": true,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-061",
    "tenMay": "SMT D - AOI",
    "khuVuc": "SMT Line D",
    "tenBanVe": "",
    "modelManual": "Kohyoung",
    "soLuong": 1,
    "cableSize": "3x4mm2",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 10,
    "dbRaw": "To DB-FAC-380-1 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-1",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": true,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-062",
    "tenMay": "SMT D - Unloader",
    "khuVuc": "SMT Line D",
    "tenBanVe": "",
    "modelManual": "Nuteck",
    "soLuong": 1,
    "cableSize": "3x4mm2",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 3,
    "dbRaw": "To DB-FAC-380-1 (DB-P1/380-M2 )",
    "dbPanel": "DB-FAC-380-1",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-063",
    "tenMay": "SMT D - Tray cabinet",
    "khuVuc": "SMT Line D",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "N/A",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 5,
    "dbRaw": "To DB-FAC-380-1 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-1",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-064",
    "tenMay": "SMT D - Socket 1",
    "khuVuc": "SMT Line D",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V",
      "110V"
    ],
    "phase": "1P",
    "maxCurrentA": 16,
    "dbRaw": "Conect to socket Grid",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-065",
    "tenMay": "SMT D - Socket 2",
    "khuVuc": "SMT Line D",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V",
      "110V"
    ],
    "phase": "1P",
    "maxCurrentA": 16,
    "dbRaw": "Conect to socket Grid",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-066",
    "tenMay": "SMT D - Socket 3",
    "khuVuc": "SMT Line D",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V",
      "110V"
    ],
    "phase": "1P",
    "maxCurrentA": 16,
    "dbRaw": "Conect to socket Grid",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-067",
    "tenMay": "SMT D - Socket 4",
    "khuVuc": "SMT Line D",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V",
      "110V"
    ],
    "phase": "1P",
    "maxCurrentA": 16,
    "dbRaw": "Conect to socket Grid",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-068",
    "tenMay": "SMT D - Socket 5",
    "khuVuc": "SMT Line D",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V",
      "110V"
    ],
    "phase": "1P",
    "maxCurrentA": 16,
    "dbRaw": "Conect to socket Grid",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-069",
    "tenMay": "SMT D - Socket 6",
    "khuVuc": "SMT Line D",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V",
      "110V"
    ],
    "phase": "1P",
    "maxCurrentA": 16,
    "dbRaw": "Conect to socket Grid",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-070",
    "tenMay": "WAVE A",
    "khuVuc": "Wave & Wash",
    "tenBanVe": "",
    "modelManual": "Electrovert",
    "soLuong": 1,
    "cableSize": "50mm2 / 25mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 125,
    "dbRaw": "To DB-FAC-380-2.1",
    "dbPanel": "DB-FAC-380-2.1",
    "msbSource": "MSB 1 (DB-P2/380-M1)",
    "utilities": {
      "lan": true,
      "nitrogen": true,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": true,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-071",
    "tenMay": "WAVE B",
    "khuVuc": "Wave & Wash",
    "tenBanVe": "",
    "modelManual": "ERSA N2XXL",
    "soLuong": 1,
    "cableSize": "50mm2 / 25mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 125,
    "dbRaw": "To DB-FAC-380-2.1 (DB-P2/380-M1)",
    "dbPanel": "DB-FAC-380-2.1",
    "msbSource": "MSB 1 (DB-P2/380-M1)",
    "utilities": {
      "lan": true,
      "nitrogen": true,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": true,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-072",
    "tenMay": "WAVE C",
    "khuVuc": "Wave & Wash",
    "tenBanVe": "",
    "modelManual": "ERSA N2XL",
    "soLuong": 1,
    "cableSize": "50mm2 / 25mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 125,
    "dbRaw": "To DB-FAC-380-2.1 (DB-P2/380-M1)",
    "dbPanel": "DB-FAC-380-2.1",
    "msbSource": "MSB 1 (DB-P2/380-M1)",
    "utilities": {
      "lan": true,
      "nitrogen": true,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": true,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-073",
    "tenMay": "WAVE D",
    "khuVuc": "Wave & Wash",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "50mm2 / 25mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 125,
    "dbRaw": "To DB-FAC-380-2.1 (DB-P4/380-M1)",
    "dbPanel": "DB-FAC-380-2.1",
    "msbSource": "MSB 1 (DB-P4/380-M1)",
    "utilities": {
      "lan": true,
      "nitrogen": true,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": true,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-074",
    "tenMay": "WASH 2",
    "khuVuc": "Wave & Wash",
    "tenBanVe": "WASH 2",
    "modelManual": "Electrovert",
    "soLuong": 1,
    "cableSize": "120mm2 / 70mm2",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 226,
    "dbRaw": "To DB-FAC-380-2 ( DB-P2/380-M1)",
    "dbPanel": "DB-FAC-380-2",
    "msbSource": "MSB 1 (DB-P2/380-M1)",
    "utilities": {
      "lan": true,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": true,
      "exhaust": true,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-075",
    "tenMay": "Heating tank for WASH A",
    "khuVuc": "Wave & Wash",
    "tenBanVe": "Heater",
    "modelManual": "Rheem 616315 / ( 6x 4.8kW)",
    "soLuong": 1,
    "cableSize": "4x10mm2 / 10mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 50,
    "dbRaw": "To DB-FAC-380-2 (DB-P2/380-M1)",
    "dbPanel": "DB-FAC-380-2",
    "msbSource": "MSB 1 (DB-P2/380-M1)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-076",
    "tenMay": "WASH 1 (New)",
    "khuVuc": "Wave & Wash",
    "tenBanVe": "WASH 1 (New)",
    "modelManual": "Electrovert ( New)",
    "soLuong": 1,
    "cableSize": "120mm2 / 70mm2",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 226,
    "dbRaw": "To DB-FAC-380-2 ( DB-P2/380-M1)",
    "dbPanel": "DB-FAC-380-2",
    "msbSource": "MSB 1 (DB-P2/380-M1)",
    "utilities": {
      "lan": true,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": true,
      "exhaust": true,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-077",
    "tenMay": "Heating tank 1 for WASH B",
    "khuVuc": "Wave & Wash",
    "tenBanVe": "Heater",
    "modelManual": "Rheem 616315 / ( 6x 4.8kW)",
    "soLuong": 1,
    "cableSize": "4x10mm2 / 10mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 50,
    "dbRaw": "To DB-FAC-380-2 (DB-P2/380-M1)",
    "dbPanel": "DB-FAC-380-2",
    "msbSource": "MSB 1 (DB-P2/380-M1)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-078",
    "tenMay": "Heating tank 2 for WASH B",
    "khuVuc": "Wave & Wash",
    "tenBanVe": "Heater",
    "modelManual": "Rheem 616315 / ( 6x 4.8kW)",
    "soLuong": 1,
    "cableSize": "4x10mm2 / 10mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 50,
    "dbRaw": "To DB-FAC-380-2 (DB-P2/380-M1)",
    "dbPanel": "DB-FAC-380-2",
    "msbSource": "MSB 1 (DB-P2/380-M1)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-079",
    "tenMay": "SELECTIVE A",
    "khuVuc": "Wave & Wash",
    "tenBanVe": "S.WAVE A",
    "modelManual": "ERSA Versaflow 3/45",
    "soLuong": 1,
    "cableSize": "25mm2 / 16mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 86,
    "dbRaw": "To DB-FAC-380-2.2 ( DB-P2/380-M1)",
    "dbPanel": "DB-FAC-380-2.2",
    "msbSource": "MSB 1 (DB-P2/380-M1)",
    "utilities": {
      "lan": true,
      "nitrogen": true,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": true,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-080",
    "tenMay": "SELECTIVE B",
    "khuVuc": "Wave & Wash",
    "tenBanVe": "S.WAVE B",
    "modelManual": "ERSA Ecoselect 2",
    "soLuong": 1,
    "cableSize": "4x10mm2 / 10mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 40,
    "dbRaw": "To DB-FAC-380-2 (DB-P2/380-M1)",
    "dbPanel": "DB-FAC-380-2",
    "msbSource": "MSB 1 (DB-P2/380-M1)",
    "utilities": {
      "lan": true,
      "nitrogen": true,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": true,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-081",
    "tenMay": "Thermal shock chamber",
    "khuVuc": "ICT, X-Ray & Testing",
    "tenBanVe": "Thermal shock",
    "modelManual": "ESPEC",
    "soLuong": 1,
    "cableSize": "35mm2 / 16mm2 PE",
    "voltages": [
      "208V",
      "110V"
    ],
    "phase": "3P",
    "maxCurrentA": 70,
    "dbRaw": "To DB-FAC-208-2+3 ( DB-P2+P3/208-M4)",
    "dbPanel": "DB-FAC-208-2+3",
    "msbSource": "MSB 4 (DB-P2+P3/208-M4)",
    "utilities": {
      "lan": true,
      "nitrogen": true,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": true,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-082",
    "tenMay": "X Ray 3D",
    "khuVuc": "ICT, X-Ray & Testing",
    "tenBanVe": "X-Ray",
    "modelManual": "Quadra",
    "soLuong": 1,
    "cableSize": "1. 3x4mm2 / 2. 3x6mm2 / 25mm2 PE",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 16,
    "dbRaw": "To DB-FAC-380-2.1 (DB-P2/380-M1)",
    "dbPanel": "DB-FAC-380-2.1",
    "msbSource": "MSB 1 (DB-P2/380-M1)",
    "utilities": {
      "lan": true,
      "nitrogen": true,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-083",
    "tenMay": "Router",
    "khuVuc": "ICT, X-Ray & Testing",
    "tenBanVe": "Phía sau Thermal shock",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "3x4mm2",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 10,
    "dbRaw": "To DB-FAC-380-2.1 (DB-P2/380-M1)",
    "dbPanel": "DB-FAC-380-2.1",
    "msbSource": "MSB 1 (DB-P2/380-M1)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": "24.67105263"
  },
  {
    "id": "CONN-084",
    "tenMay": "UPS Teledyne",
    "khuVuc": "Thiết bị Phụ trợ & Khác",
    "tenBanVe": "Cần bổ sung trong bản vẽ!",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "3x4mm2",
    "voltages": [
      "220V"
    ],
    "phase": "3P",
    "maxCurrentA": 20,
    "dbRaw": "To DB-FAC-380-3 ( DB-P3/380-M1)",
    "dbPanel": "DB-FAC-380-3",
    "msbSource": "MSB 1 (DB-P3/380-M1)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-085",
    "tenMay": "Vaccum seal",
    "khuVuc": "Thiết bị Phụ trợ & Khác",
    "tenBanVe": "Trong phòng IQC",
    "modelManual": "Máy cũ, ở VSIP Kho và IQC đang dùng",
    "soLuong": 1,
    "cableSize": "4x10mm2 / 10mm2 PE",
    "voltages": [
      "208V"
    ],
    "phase": "3P",
    "maxCurrentA": 15,
    "dbRaw": "To DB-FAC-208-2+3 (DB-P2+P3/208-M4)",
    "dbPanel": "DB-FAC-208-2+3",
    "msbSource": "MSB 4 (DB-P2+P3/208-M4)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-086",
    "tenMay": "ICT 1 New",
    "khuVuc": "ICT, X-Ray & Testing",
    "tenBanVe": "ICT 1 New",
    "modelManual": "GENRAD",
    "soLuong": 1,
    "cableSize": "25mm2 / 16mm2 PE",
    "voltages": [
      "208V"
    ],
    "phase": "3P",
    "maxCurrentA": 50,
    "dbRaw": "To DB-FAC-208-2+3 (DB-P2+P3/208-M4)",
    "dbPanel": "DB-FAC-208-2+3",
    "msbSource": "MSB 4 (DB-P2+P3/208-M4)",
    "utilities": {
      "lan": true,
      "nitrogen": false,
      "air": true,
      "vacuum": true,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-087",
    "tenMay": "ICT 2",
    "khuVuc": "ICT, X-Ray & Testing",
    "tenBanVe": "ICT 2",
    "modelManual": "GENRAD",
    "soLuong": 1,
    "cableSize": "25mm2 / 16mm2 PE",
    "voltages": [
      "208V"
    ],
    "phase": "3P",
    "maxCurrentA": 50,
    "dbRaw": "To DB-FAC-208-2+3 (DB-P2+P3/208-M4)",
    "dbPanel": "DB-FAC-208-2+3",
    "msbSource": "MSB 4 (DB-P2+P3/208-M4)",
    "utilities": {
      "lan": true,
      "nitrogen": false,
      "air": true,
      "vacuum": true,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-088",
    "tenMay": "ICT 3",
    "khuVuc": "ICT, X-Ray & Testing",
    "tenBanVe": "ICT 3",
    "modelManual": "GENRAD",
    "soLuong": 1,
    "cableSize": "4x10mm2 / 10mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 32,
    "dbRaw": "ICT 3 New / To DB-FAC-380-2.1 (DB-P2/380-M1)",
    "dbPanel": "DB-FAC-380-2.1",
    "msbSource": "MSB 1 (DB-P2/380-M1)",
    "utilities": {
      "lan": true,
      "nitrogen": false,
      "air": true,
      "vacuum": true,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-089",
    "tenMay": "ICT4",
    "khuVuc": "ICT, X-Ray & Testing",
    "tenBanVe": "In Circult Test",
    "modelManual": "Keysight I3070 Series 6",
    "soLuong": 1,
    "cableSize": "4x6mm2 + PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 25,
    "dbRaw": "DB-FAC-380V-02.1",
    "dbPanel": "DB-FAC-380-2.1",
    "msbSource": "MSB 1 (DB-P2/380-M1)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": true,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-090",
    "tenMay": "Potting 1",
    "khuVuc": "Potting & Oven (PV Link / Teton)",
    "tenBanVe": "",
    "modelManual": "D&H",
    "soLuong": 1,
    "cableSize": "3x10mm2 / 10mm2 PE",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 25,
    "dbRaw": "To DB-FAC-380-4 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-4",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": true,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đã tháo nguồn / Di dời",
    "ghiChu": "Đã tháo nguồn ngày 27/10/2023"
  },
  {
    "id": "CONN-091",
    "tenMay": "Potting 2",
    "khuVuc": "Potting & Oven (PV Link / Teton)",
    "tenBanVe": "",
    "modelManual": "D&H",
    "soLuong": 1,
    "cableSize": "3x10mm2 / 10mm2 PE",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 25,
    "dbRaw": "To DB-FAC-380-4 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-4",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": true,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đã tháo nguồn / Di dời",
    "ghiChu": "Đã tháo nguồn ngày 27/10/2023"
  },
  {
    "id": "CONN-092",
    "tenMay": "Potting 3",
    "khuVuc": "Potting & Oven (PV Link / Teton)",
    "tenBanVe": "",
    "modelManual": "D&H",
    "soLuong": 1,
    "cableSize": "3x10mm2 / 10mm2 PE",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 25,
    "dbRaw": "To DB-FAC-380-4 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-4",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": true,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đã tháo nguồn / Di dời",
    "ghiChu": "Đã tháo nguồn ngày 27/10/2023"
  },
  {
    "id": "CONN-093",
    "tenMay": "Potting 4",
    "khuVuc": "Potting & Oven (PV Link / Teton)",
    "tenBanVe": "",
    "modelManual": "D&H",
    "soLuong": 1,
    "cableSize": "3x10mm2 / 10mm2 PE",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 25,
    "dbRaw": "To DB-FAC-380-4 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-4",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": true,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đã tháo nguồn / Di dời",
    "ghiChu": "Đã tháo nguồn ngày 27/10/2023"
  },
  {
    "id": "CONN-094",
    "tenMay": "Potting 5",
    "khuVuc": "Potting & Oven (PV Link / Teton)",
    "tenBanVe": "",
    "modelManual": "D&H",
    "soLuong": 1,
    "cableSize": "3x10mm2 / 10mm2 PE",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 25,
    "dbRaw": "To DB-FAC-380-4 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-4",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": true,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đã tháo nguồn / Di dời",
    "ghiChu": "Đã tháo nguồn ngày 27/10/2023"
  },
  {
    "id": "CONN-095",
    "tenMay": "Oven testing 1",
    "khuVuc": "Potting & Oven (PV Link / Teton)",
    "tenBanVe": "Bake Oven 1 - PV Link",
    "modelManual": "Espec",
    "soLuong": 1,
    "cableSize": "4x4mm2 / 4mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 10,
    "dbRaw": "To DB-FAC-380-3 -P1 (DB-P3/380-M1)",
    "dbPanel": "DB-FAC-380-3",
    "msbSource": "MSB 1 (DB-P3/380-M1)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đã tháo nguồn / Di dời",
    "ghiChu": "Đã tháo nguồn ngày 23/10/2023"
  },
  {
    "id": "CONN-096",
    "tenMay": "Oven testing 2",
    "khuVuc": "Potting & Oven (PV Link / Teton)",
    "tenBanVe": "Bake Oven 2 - PV Link",
    "modelManual": "Espec",
    "soLuong": 1,
    "cableSize": "4x4mm2 / 4mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 10,
    "dbRaw": "To DB-FAC-380-3 ( DB-P3/380-M1)",
    "dbPanel": "DB-FAC-380-3",
    "msbSource": "MSB 1 (DB-P3/380-M1)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đã tháo nguồn / Di dời",
    "ghiChu": "Đã tháo nguồn ngày 23/10/2023"
  },
  {
    "id": "CONN-097",
    "tenMay": "Oven testing 3",
    "khuVuc": "Potting & Oven (PV Link / Teton)",
    "tenBanVe": "Bake Oven 3 - PV Link",
    "modelManual": "Espec",
    "soLuong": 1,
    "cableSize": "4x4mm2 / 4mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 10,
    "dbRaw": "To DB-FAC-380-3 (DB-P3/380-M1)",
    "dbPanel": "DB-FAC-380-3",
    "msbSource": "MSB 1 (DB-P3/380-M1)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đã tháo nguồn / Di dời",
    "ghiChu": "Đã tháo nguồn ngày 23/10/2023"
  },
  {
    "id": "CONN-098",
    "tenMay": "Oven testing 4",
    "khuVuc": "Potting & Oven (PV Link / Teton)",
    "tenBanVe": "Bake Oven 4 - PV Link",
    "modelManual": "Espec",
    "soLuong": 1,
    "cableSize": "4x4mm2 / 4mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 10,
    "dbRaw": "To DB-FAC-380-4 - P1 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-4",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đã tháo nguồn / Di dời",
    "ghiChu": "Đã tháo nguồn ngày 23/10/2023"
  },
  {
    "id": "CONN-099",
    "tenMay": "Oven testing 5",
    "khuVuc": "Potting & Oven (PV Link / Teton)",
    "tenBanVe": "Bake Oven 5 - PV Link",
    "modelManual": "Espec",
    "soLuong": 1,
    "cableSize": "4x4mm2 / 4mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 10,
    "dbRaw": "To DB-FAC-380-4- P2 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-4",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đã tháo nguồn / Di dời",
    "ghiChu": "Đã tháo nguồn ngày 23/10/2023"
  },
  {
    "id": "CONN-100",
    "tenMay": "60Hz converter 1",
    "khuVuc": "Potting & Oven (PV Link / Teton)",
    "tenBanVe": "60Hz converter 1 - PV Link",
    "modelManual": "GoHz",
    "soLuong": 1,
    "cableSize": "16mm2 / 16mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 32,
    "dbRaw": "To DB-FAC-380-4 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-4",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đã tháo nguồn / Di dời",
    "ghiChu": "Đã tháo nguồn ngày 23/10/2023"
  },
  {
    "id": "CONN-101",
    "tenMay": "60Hz converter 2",
    "khuVuc": "Potting & Oven (PV Link / Teton)",
    "tenBanVe": "60Hz converter 2 - PV Link",
    "modelManual": "GoHz",
    "soLuong": 1,
    "cableSize": "16mm2 / 16mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 32,
    "dbRaw": "To DB-FAC-380-4 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-4",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đã tháo nguồn / Di dời",
    "ghiChu": "Đã tháo nguồn ngày 23/10/2023"
  },
  {
    "id": "CONN-102",
    "tenMay": "60Hz converter 3",
    "khuVuc": "Potting & Oven (PV Link / Teton)",
    "tenBanVe": "60Hz converter 3 - PV Link",
    "modelManual": "GoHz",
    "soLuong": 1,
    "cableSize": "16mm2 / 16mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 32,
    "dbRaw": "To DB-FAC-380-4 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-4",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đã tháo nguồn / Di dời",
    "ghiChu": "Đã tháo nguồn ngày 23/10/2023"
  },
  {
    "id": "CONN-103",
    "tenMay": "60Hz converter 4",
    "khuVuc": "Potting & Oven (PV Link / Teton)",
    "tenBanVe": "60Hz converter 4 - PV Link",
    "modelManual": "GoHz",
    "soLuong": 1,
    "cableSize": "16mm2 / 16mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 32,
    "dbRaw": "To DB-FAC-380-4 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-4",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đã tháo nguồn / Di dời",
    "ghiChu": "Đã tháo nguồn ngày 23/10/2023"
  },
  {
    "id": "CONN-104",
    "tenMay": "60Hz converter 5",
    "khuVuc": "Potting & Oven (PV Link / Teton)",
    "tenBanVe": "60Hz converter 5 - PV Link",
    "modelManual": "GoHz",
    "soLuong": 1,
    "cableSize": "16mm2 / 16mm2 PE",
    "voltages": [
      "480V"
    ],
    "phase": "3P",
    "maxCurrentA": 25,
    "dbRaw": "To DB-FAC-480-2 (DB-P2/480-M5)",
    "dbPanel": "DB-FAC-480-2",
    "msbSource": "MSB 5 (DB-P2/480-M5)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đã tháo nguồn / Di dời",
    "ghiChu": "Đã tháo nguồn ngày 23/10/2023"
  },
  {
    "id": "CONN-105",
    "tenMay": "Oven testing 6",
    "khuVuc": "Potting & Oven (PV Link / Teton)",
    "tenBanVe": "Burn in 1 (Teton)",
    "modelManual": "Espec",
    "soLuong": 1,
    "cableSize": "4x4mm2 / 4mm2 PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 23,
    "dbRaw": "To DB-FAC-380-4 (DB-P1/380-M2)",
    "dbPanel": "DB-FAC-380-4",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đã tháo nguồn / Di dời",
    "ghiChu": "Đã tháo nguồn ngày 23/10/2023"
  },
  {
    "id": "CONN-106",
    "tenMay": "Oven testing 7",
    "khuVuc": "Potting & Oven (PV Link / Teton)",
    "tenBanVe": "Burn in 2 (Teton)",
    "modelManual": "THERMOTRON",
    "soLuong": 1,
    "cableSize": "3x6mm2",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 25,
    "dbRaw": "To DB-FAC-380-3 (DB-P3/380-M1)",
    "dbPanel": "DB-FAC-380-3",
    "msbSource": "MSB 1 (DB-P3/380-M1)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Cần kiểm tra",
    "ghiChu": "??"
  },
  {
    "id": "CONN-107",
    "tenMay": "3 Line socket kéo thẳng về tủ điện 220/110 cho 3 line Teton, Inverter, PV Link",
    "khuVuc": "Generac / Inverter Testing",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "3x4mm2",
    "voltages": [
      "220V",
      "110V"
    ],
    "phase": "1P",
    "maxCurrentA": 32,
    "dbRaw": "110/ DB-208-SO-01 / 220/ Chưa kiểm",
    "dbPanel": "110/ DB-208-SO-01 / 220/ Chưa kiểm",
    "msbSource": "MSB 4 (Hệ 208V)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Cần kiểm tra",
    "ghiChu": ""
  },
  {
    "id": "CONN-108",
    "tenMay": "SL500 Generac testing 1 (inverter)",
    "khuVuc": "Generac / Inverter Testing",
    "tenBanVe": "Burning 1",
    "modelManual": "Magna",
    "soLuong": 1,
    "cableSize": "4x4mm2 / 4mm2 PE",
    "voltages": [
      "480V"
    ],
    "phase": "3P",
    "maxCurrentA": 13,
    "dbRaw": "To DB-FAC-480-2 (DB-P2/480-M5)",
    "dbPanel": "DB-FAC-480-2",
    "msbSource": "MSB 5 (DB-P2/480-M5)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-109",
    "tenMay": "SL500 Generac testing 2 (inverter)",
    "khuVuc": "Generac / Inverter Testing",
    "tenBanVe": "Burning 2",
    "modelManual": "Magna",
    "soLuong": 1,
    "cableSize": "4x4mm2 / 4mm2 PE",
    "voltages": [
      "480V"
    ],
    "phase": "3P",
    "maxCurrentA": 13,
    "dbRaw": "To DB-FAC-480-2 (DB-P2/480-M5)",
    "dbPanel": "DB-FAC-480-2",
    "msbSource": "MSB 5 (DB-P2/480-M5)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-110",
    "tenMay": "SL500 Generac testing 3 (inverter)",
    "khuVuc": "Generac / Inverter Testing",
    "tenBanVe": "Burning 3",
    "modelManual": "Magna",
    "soLuong": 1,
    "cableSize": "4x4mm2 / 4mm2 PE",
    "voltages": [
      "480V"
    ],
    "phase": "3P",
    "maxCurrentA": 13,
    "dbRaw": "To DB-FAC-480-2 (DB-P2/480-M5)",
    "dbPanel": "DB-FAC-480-2",
    "msbSource": "MSB 5 (DB-P2/480-M5)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-111",
    "tenMay": "SL500 Generac testing 4 (inverter)",
    "khuVuc": "Generac / Inverter Testing",
    "tenBanVe": "Burning 4",
    "modelManual": "Magna",
    "soLuong": 1,
    "cableSize": "4x4mm2 / 4mm2 PE",
    "voltages": [
      "480V"
    ],
    "phase": "3P",
    "maxCurrentA": 13,
    "dbRaw": "To DB-FAC-480-2 (DB-P2/480-M5)",
    "dbPanel": "DB-FAC-480-2",
    "msbSource": "MSB 5 (DB-P2/480-M5)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-112",
    "tenMay": "SL500 Generac testing 5 (inverter)",
    "khuVuc": "Generac / Inverter Testing",
    "tenBanVe": "Burning 5",
    "modelManual": "Magna",
    "soLuong": 1,
    "cableSize": "4x4mm2 / 4mm2 PE",
    "voltages": [
      "480V"
    ],
    "phase": "3P",
    "maxCurrentA": 13,
    "dbRaw": "To DB-FAC-480-2 (DB-P2/480-M5)",
    "dbPanel": "DB-FAC-480-2",
    "msbSource": "MSB 5 (DB-P2/480-M5)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-113",
    "tenMay": "SL500 Generac testing 6 (inverter)",
    "khuVuc": "Generac / Inverter Testing",
    "tenBanVe": "Burning 6",
    "modelManual": "Magna",
    "soLuong": 1,
    "cableSize": "4x4mm2 / 4mm2 PE",
    "voltages": [
      "480V"
    ],
    "phase": "3P",
    "maxCurrentA": 13,
    "dbRaw": "To DB-FAC-480-2 ( DB-P2/480-M5)",
    "dbPanel": "DB-FAC-480-2",
    "msbSource": "MSB 5 (DB-P2/480-M5)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-114",
    "tenMay": "SL500 Generac testing 7 + Grid Simulator 1",
    "khuVuc": "Generac / Inverter Testing",
    "tenBanVe": "Trip Test 1 ( Inverter)",
    "modelManual": "Magna + NHR",
    "soLuong": 1,
    "cableSize": "4x4mm2 / 4mm2 PE",
    "voltages": [
      "480V"
    ],
    "phase": "3P",
    "maxCurrentA": 32,
    "dbRaw": "To DB-FAC-480-2 ( DB-P2/480-M5)",
    "dbPanel": "DB-FAC-480-2",
    "msbSource": "MSB 5 (DB-P2/480-M5)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-115",
    "tenMay": "SL500 Generac testing 8 + Grid Simulator 2",
    "khuVuc": "Generac / Inverter Testing",
    "tenBanVe": "Trip Test 2 ( Inverter)",
    "modelManual": "Magna + NHR",
    "soLuong": 1,
    "cableSize": "4x4mm2 / 4mm2 PE",
    "voltages": [
      "480V"
    ],
    "phase": "3P",
    "maxCurrentA": 32,
    "dbRaw": "To DB-FAC-480-2 (DB-P2/480-M5)",
    "dbPanel": "DB-FAC-480-2",
    "msbSource": "MSB 5 (DB-P2/480-M5)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-116",
    "tenMay": "SL500 Generac testing 9 + Grid Simulator 3",
    "khuVuc": "Generac / Inverter Testing",
    "tenBanVe": "Trip Test 3 ( Inverter)",
    "modelManual": "Magna + NHR",
    "soLuong": 1,
    "cableSize": "4x6mm2 / 6mm2 PE",
    "voltages": [
      "480V"
    ],
    "phase": "3P",
    "maxCurrentA": 32,
    "dbRaw": "To DB-FAC-480-2 (DB-P2/480-M5)",
    "dbPanel": "DB-FAC-480-2",
    "msbSource": "MSB 5 (DB-P2/480-M5)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-117",
    "tenMay": "Bàn exhaust - Hand Soldering",
    "khuVuc": "Bàn Thao Tác & Rework",
    "tenBanVe": "Hand Soldering",
    "modelManual": "",
    "soLuong": 25,
    "cableSize": "",
    "voltages": [
      "220V",
      "110V"
    ],
    "phase": "1P",
    "maxCurrentA": 5,
    "dbRaw": "",
    "dbPanel": "Chưa xác định",
    "msbSource": "Chưa xác định",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": true,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-118",
    "tenMay": "Bàn exhaust-Rework",
    "khuVuc": "Bàn Thao Tác & Rework",
    "tenBanVe": "Rework",
    "modelManual": "",
    "soLuong": 15,
    "cableSize": "",
    "voltages": [
      "220V",
      "110V"
    ],
    "phase": "1P",
    "maxCurrentA": 5,
    "dbRaw": "",
    "dbPanel": "Chưa xác định",
    "msbSource": "Chưa xác định",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": true,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-119",
    "tenMay": "Bàn exhaust-Rework",
    "khuVuc": "Bàn Thao Tác & Rework",
    "tenBanVe": "Nằm trên bàn Rework",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "3x6mm2",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 20,
    "dbRaw": "To DB-FAC-380-2.1 (DB-P2/380-M1)",
    "dbPanel": "DB-FAC-380-2.1",
    "msbSource": "MSB 1 (DB-P2/380-M1)",
    "utilities": {
      "lan": false,
      "nitrogen": true,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": true,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-120",
    "tenMay": "Bàn exhaust-Rework",
    "khuVuc": "Bàn Thao Tác & Rework",
    "tenBanVe": "Nằm trên bàn Rework",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "3x4mm2",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 10,
    "dbRaw": "To DB-FAC-380-2 (DB-P2/380-M1)",
    "dbPanel": "DB-FAC-380-2",
    "msbSource": "MSB 1 (DB-P2/380-M1)",
    "utilities": {
      "lan": false,
      "nitrogen": true,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": true,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-121",
    "tenMay": "Bàn no exhaust",
    "khuVuc": "Bàn Thao Tác & Rework",
    "tenBanVe": "",
    "modelManual": "Trong Production, trong các phòng chức năng, kho",
    "soLuong": 200,
    "cableSize": "",
    "voltages": [
      "220V",
      "110V"
    ],
    "phase": "1P",
    "maxCurrentA": 5,
    "dbRaw": "",
    "dbPanel": "Chưa xác định",
    "msbSource": "Chưa xác định",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-122",
    "tenMay": "Coating Room - Hand spray coating 1",
    "khuVuc": "Coating Room",
    "tenBanVe": "Hand spray coating 1",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [],
    "phase": "N/A",
    "maxCurrentA": null,
    "dbRaw": "Socket",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": true,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-123",
    "tenMay": "Coating Room - Hand spray coating 2",
    "khuVuc": "Coating Room",
    "tenBanVe": "Hand spray coating 2",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [],
    "phase": "N/A",
    "maxCurrentA": null,
    "dbRaw": "Socket",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": true,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-124",
    "tenMay": "Coating Room - Robot Coating",
    "khuVuc": "Coating Room",
    "tenBanVe": "Robot Coating",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [],
    "phase": "1P",
    "maxCurrentA": 10,
    "dbRaw": "Socket",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": true,
      "exhaustFlowM3h": 200
    },
    "trangThai": "Đã tháo nguồn / Di dời",
    "ghiChu": "Đã dời khỏi phòng"
  },
  {
    "id": "CONN-125",
    "tenMay": "Coating Room - Robot Bonding",
    "khuVuc": "Coating Room",
    "tenBanVe": "Robot Bonding",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [],
    "phase": "1P",
    "maxCurrentA": 10,
    "dbRaw": "Socket",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đã tháo nguồn / Di dời",
    "ghiChu": "Đã dời khỏi phòng"
  },
  {
    "id": "CONN-126",
    "tenMay": "Coating Room - Kệ phơi 1",
    "khuVuc": "Coating Room",
    "tenBanVe": "Kệ phơi 1",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [],
    "phase": "N/A",
    "maxCurrentA": null,
    "dbRaw": "-",
    "dbPanel": "Chưa xác định",
    "msbSource": "Chưa xác định",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-127",
    "tenMay": "Coating Room - Kệ phơi 2",
    "khuVuc": "Coating Room",
    "tenBanVe": "Kệ phơi 2",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [],
    "phase": "N/A",
    "maxCurrentA": null,
    "dbRaw": "-",
    "dbPanel": "Chưa xác định",
    "msbSource": "Chưa xác định",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-128",
    "tenMay": "Coating Room - Auto coating 1",
    "khuVuc": "Coating Room",
    "tenBanVe": "Auto coating 1",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "3x4mm2",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 10,
    "dbRaw": "DB-FAC-380V-02.1",
    "dbPanel": "DB-FAC-380-2.1",
    "msbSource": "MSB 1 (DB-P2/380-M1)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-129",
    "tenMay": "Coating Room - Auto coating 2",
    "khuVuc": "Coating Room",
    "tenBanVe": "Auto coating 2",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "3x4mm2",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 10,
    "dbRaw": "DB-FAC-380V-02.1",
    "dbPanel": "DB-FAC-380-2.1",
    "msbSource": "MSB 1 (DB-P2/380-M1)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-130",
    "tenMay": "Coating Room - Auto coating 3",
    "khuVuc": "Coating Room",
    "tenBanVe": "Auto coating 3",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "3x4mm2",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 10,
    "dbRaw": "DB-FAC-380V-02.2",
    "dbPanel": "DB-FAC-380-2.2",
    "msbSource": "MSB 1 (DB-P2/380-M1)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-131",
    "tenMay": "Coating Room - Oven 1",
    "khuVuc": "Coating Room",
    "tenBanVe": "Oven 1",
    "modelManual": "Espec",
    "soLuong": 1,
    "cableSize": "4x4mm2 + PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 16,
    "dbRaw": "DB-FAC-380V-02.1",
    "dbPanel": "DB-FAC-380-2.1",
    "msbSource": "MSB 1 (DB-P2/380-M1)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-132",
    "tenMay": "Coating Room - Oven 2",
    "khuVuc": "Coating Room",
    "tenBanVe": "Oven 2",
    "modelManual": "RMG",
    "soLuong": 1,
    "cableSize": "4x4mm2 + PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 16,
    "dbRaw": "DB-FAC-380V-02.2",
    "dbPanel": "DB-FAC-380-2.2",
    "msbSource": "MSB 1 (DB-P2/380-M1)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-133",
    "tenMay": "Coating Room - Oven 3",
    "khuVuc": "Coating Room",
    "tenBanVe": "Oven 3",
    "modelManual": "Bluem",
    "soLuong": 1,
    "cableSize": "4x4mm2 + PE",
    "voltages": [
      "208V"
    ],
    "phase": "3P",
    "maxCurrentA": 20,
    "dbRaw": "DB-FAC-208V-1",
    "dbPanel": "DB-FAC-208-1",
    "msbSource": "MSB 4 (Hệ 208V)",
    "utilities": {
      "lan": false,
      "nitrogen": true,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": true,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-134",
    "tenMay": "Coating Room - UV Dryer",
    "khuVuc": "Coating Room",
    "tenBanVe": "UV Dryer",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "3x4mm2",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": 20,
    "dbRaw": "DB-FAC-380V-02.2",
    "dbPanel": "DB-FAC-380-2.2",
    "msbSource": "MSB 1 (DB-P2/380-M1)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-135",
    "tenMay": "Coating Room - Buồng UV Coating 1",
    "khuVuc": "Coating Room",
    "tenBanVe": "Buồng UV Coating 1",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [],
    "phase": "N/A",
    "maxCurrentA": null,
    "dbRaw": "Socket",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-136",
    "tenMay": "Coating Room - Buồng UV Coating 2",
    "khuVuc": "Coating Room",
    "tenBanVe": "Buồng UV Coating 2",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [],
    "phase": "N/A",
    "maxCurrentA": null,
    "dbRaw": "Socket",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-137",
    "tenMay": "Coating Room - Buồng quét tay",
    "khuVuc": "Coating Room",
    "tenBanVe": "Buồng quét tay",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [],
    "phase": "N/A",
    "maxCurrentA": null,
    "dbRaw": "Socket",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-138",
    "tenMay": "Coating Room - Bàn làm việc",
    "khuVuc": "Coating Room",
    "tenBanVe": "Bàn làm việc",
    "modelManual": "",
    "soLuong": 15,
    "cableSize": "",
    "voltages": [
      "220V",
      "110V"
    ],
    "phase": "1P",
    "maxCurrentA": 5,
    "dbRaw": "Socket",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-139",
    "tenMay": "Coating Room - UV oven",
    "khuVuc": "Coating Room",
    "tenBanVe": "UV oven",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [
      "220V"
    ],
    "phase": "1P",
    "maxCurrentA": null,
    "dbRaw": "Socket",
    "dbPanel": "Socket Grid",
    "msbSource": "Hệ ổ cắm 220V/110V",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-140",
    "tenMay": "Máy rửa pallet",
    "khuVuc": "Thiết bị Phụ trợ & Khác",
    "tenBanVe": "Soaking Tank",
    "modelManual": "RMG",
    "soLuong": 1,
    "cableSize": "4x10mm2+PE",
    "voltages": [
      "380V"
    ],
    "phase": "3P",
    "maxCurrentA": 40,
    "dbRaw": "DB-FAC-380V-02.2",
    "dbPanel": "DB-FAC-380-2.2",
    "msbSource": "MSB 1 (DB-P2/380-M1)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": true,
      "exhaust": true,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-141",
    "tenMay": "Croma Machine",
    "khuVuc": "Thiết bị Phụ trợ & Khác",
    "tenBanVe": "Croma Machine",
    "modelManual": "Croma 564",
    "soLuong": 1,
    "cableSize": "3x2.5mm2",
    "voltages": [
      "220V"
    ],
    "phase": "N/A",
    "maxCurrentA": null,
    "dbRaw": "DB-380V-04",
    "dbPanel": "DB-FAC-380-4",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-142",
    "tenMay": "Máy rửa Stencil",
    "khuVuc": "Thiết bị Phụ trợ & Khác",
    "tenBanVe": "Máy rửa Stencil",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "",
    "voltages": [],
    "phase": "N/A",
    "maxCurrentA": null,
    "dbRaw": "",
    "dbPanel": "Chưa xác định",
    "msbSource": "Chưa xác định",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-143",
    "tenMay": "Rivet Machine",
    "khuVuc": "Thiết bị Phụ trợ & Khác",
    "tenBanVe": "Rivet Machine",
    "modelManual": "RMG",
    "soLuong": 1,
    "cableSize": "3x2.5mm+PE",
    "voltages": [
      "380V"
    ],
    "phase": "N/A",
    "maxCurrentA": null,
    "dbRaw": "DB-FAC-380V-03/P16",
    "dbPanel": "DB-FAC-380-3",
    "msbSource": "MSB 1 (DB-P3/380-M1)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": false,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-144",
    "tenMay": "CM-10T Machine",
    "khuVuc": "Thiết bị Phụ trợ & Khác",
    "tenBanVe": "CM-10T",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "5x2.5mm",
    "voltages": [
      "380V"
    ],
    "phase": "N/A",
    "maxCurrentA": null,
    "dbRaw": "DB-FAC-380V-02.1",
    "dbPanel": "DB-FAC-380-2.1",
    "msbSource": "MSB 1 (DB-P2/380-M1)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-145",
    "tenMay": "Xray New",
    "khuVuc": "ICT, X-Ray & Testing",
    "tenBanVe": "Xray Machine",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "4x6mm + PE",
    "voltages": [
      "380V"
    ],
    "phase": "N/A",
    "maxCurrentA": 10,
    "dbRaw": "DB-FAC-SO-03",
    "dbPanel": "DB-FAC-SO-03",
    "msbSource": "Hệ tủ Socket / Phụ trợ",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-146",
    "tenMay": "Auto Insert Machine 380V",
    "khuVuc": "Thiết bị Phụ trợ & Khác",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "4x4mm + PE",
    "voltages": [
      "380V"
    ],
    "phase": "N/A",
    "maxCurrentA": null,
    "dbRaw": "DB-FAC-SO-03",
    "dbPanel": "DB-FAC-SO-03",
    "msbSource": "Hệ tủ Socket / Phụ trợ",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  },
  {
    "id": "CONN-147",
    "tenMay": "Auto Insert Machine 220V",
    "khuVuc": "Thiết bị Phụ trợ & Khác",
    "tenBanVe": "",
    "modelManual": "",
    "soLuong": 1,
    "cableSize": "3x2.5mm",
    "voltages": [
      "380V"
    ],
    "phase": "N/A",
    "maxCurrentA": null,
    "dbRaw": "DB-FAC-380V-01",
    "dbPanel": "DB-FAC-380-1",
    "msbSource": "MSB 2 (DB-P1/380-M2)",
    "utilities": {
      "lan": false,
      "nitrogen": false,
      "air": true,
      "vacuum": false,
      "di": false,
      "exhaust": false,
      "exhaustFlowM3h": null
    },
    "trangThai": "Đang cấp nguồn",
    "ghiChu": ""
  }
];

// Auto-seeded from S__gi__ch_y_c_a_MNK_5f891acc.csv (29 monthly logs, 34 replacement events)
export const INITIAL_COMPRESSOR_RUNTIME: CompressorRuntimeStore = {
  "warningThresholdH": 2000,
  "readingDayOfMonth": 15,
  "unitSpecs": [
    {
      "machineKey": "GA75-1",
      "displayName": "Máy nén khí GA75-1",
      "equipmentCode": "CMP-GA75-01",
      "category": "Máy nén khí",
      "tracksConsumables": true,
      "oilCapacityLiters": 18,
      "oilIntervalH": 8000,
      "airFilterIntervalH": 4000,
      "oilFilterIntervalH": 4000,
      "oilSeparatorIntervalH": 8000,
      "sparePartCodes": {
        "airFilter": "SP-FC-022",
        "oilFilter": "SP-FC-019",
        "oilSeparator": "SP-FC-021"
      }
    },
    {
      "machineKey": "GA75-2",
      "displayName": "Máy nén khí GA75-2",
      "equipmentCode": "CMP-GA75-02",
      "category": "Máy nén khí",
      "tracksConsumables": true,
      "oilCapacityLiters": 18,
      "oilIntervalH": 8000,
      "airFilterIntervalH": 4000,
      "oilFilterIntervalH": 8000,
      "oilSeparatorIntervalH": 8000,
      "sparePartCodes": {
        "airFilter": "SP-FC-022",
        "oilFilter": "SP-FC-019",
        "oilSeparator": "SP-FC-021"
      }
    },
    {
      "machineKey": "VSD90-1",
      "displayName": "Máy nén khí VSD90-1",
      "equipmentCode": "CMP-GA90-01",
      "category": "Máy nén khí",
      "tracksConsumables": true,
      "oilCapacityLiters": 32,
      "oilIntervalH": 8000,
      "airFilterIntervalH": 4000,
      "oilFilterIntervalH": 8000,
      "oilSeparatorIntervalH": 8000,
      "sparePartCodes": {
        "airFilter": "SP-FC-023",
        "oilFilter": "SP-FC-020",
        "oilSeparator": "SP-FC-024"
      }
    },
    {
      "machineKey": "VSD90-2",
      "displayName": "Máy nén khí VSD90-2",
      "equipmentCode": "CMP-GA90-02",
      "category": "Máy nén khí",
      "tracksConsumables": true,
      "oilCapacityLiters": 31,
      "oilIntervalH": 8000,
      "airFilterIntervalH": 4000,
      "oilFilterIntervalH": 8000,
      "oilSeparatorIntervalH": 8000,
      "sparePartCodes": {
        "airFilter": "SP-FC-023",
        "oilFilter": "SP-FC-020",
        "oilSeparator": "SP-FC-024"
      }
    },
    {
      "machineKey": "AD300-1",
      "displayName": "Máy sấy hấp thụ AD300-1",
      "equipmentCode": "CMP-AD300-01",
      "category": "Máy sấy hấp thụ",
      "tracksConsumables": false,
      "oilIntervalH": 0,
      "airFilterIntervalH": 0,
      "oilFilterIntervalH": 0,
      "oilSeparatorIntervalH": 0
    },
    {
      "machineKey": "AD300-2",
      "displayName": "Máy sấy hấp thụ AD300-2",
      "equipmentCode": "CMP-AD300-02",
      "category": "Máy sấy hấp thụ",
      "tracksConsumables": false,
      "oilIntervalH": 0,
      "airFilterIntervalH": 0,
      "oilFilterIntervalH": 0,
      "oilSeparatorIntervalH": 0
    },
    {
      "machineKey": "NPG360-1",
      "displayName": "Máy tạo Nito NPG360-1",
      "equipmentCode": "CMP-NPG-01",
      "category": "Máy tạo Nito",
      "tracksConsumables": false,
      "oilIntervalH": 0,
      "airFilterIntervalH": 0,
      "oilFilterIntervalH": 0,
      "oilSeparatorIntervalH": 0
    },
    {
      "machineKey": "NPG360-2",
      "displayName": "Máy tạo Nito NPG360-2",
      "equipmentCode": "CMP-NPG-02",
      "category": "Máy tạo Nito",
      "tracksConsumables": false,
      "oilIntervalH": 0,
      "airFilterIntervalH": 0,
      "oilFilterIntervalH": 0,
      "oilSeparatorIntervalH": 0
    },
    {
      "machineKey": "FD220-1",
      "displayName": "Máy sấy khí FD220-1",
      "equipmentCode": "CMP-FD220-01",
      "category": "Máy sấy tác nhân lạnh",
      "tracksConsumables": false,
      "oilIntervalH": 0,
      "airFilterIntervalH": 0,
      "oilFilterIntervalH": 0,
      "oilSeparatorIntervalH": 0
    },
    {
      "machineKey": "FD220-2",
      "displayName": "Máy sấy khí FD220-2",
      "equipmentCode": "CMP-FD220-02",
      "category": "Máy sấy tác nhân lạnh",
      "tracksConsumables": false,
      "oilIntervalH": 0,
      "airFilterIntervalH": 0,
      "oilFilterIntervalH": 0,
      "oilSeparatorIntervalH": 0
    }
  ],
  "monthlyLogs": [
    {
      "id": "MNK-LOG-2024-04",
      "month": "2024-04",
      "recordedDate": "2024-04-15",
      "readings": {
        "GA75-1": {
          "runningHours": 1143,
          "loadHours": 847,
          "oilRemainingH": null,
          "airFilterRemainingH": null,
          "oilFilterRemainingH": null,
          "oilSeparatorRemainingH": null
        },
        "GA75-2": {
          "runningHours": 1266,
          "loadHours": 991,
          "oilRemainingH": null,
          "airFilterRemainingH": null,
          "oilFilterRemainingH": null,
          "oilSeparatorRemainingH": null
        },
        "VSD90-1": {
          "runningHours": 3972,
          "loadHours": 3816,
          "oilRemainingH": 8000,
          "airFilterRemainingH": 4000,
          "oilFilterRemainingH": 8000,
          "oilSeparatorRemainingH": null
        },
        "VSD90-2": {
          "runningHours": 5011,
          "loadHours": 4951,
          "oilRemainingH": 8000,
          "airFilterRemainingH": 4000,
          "oilFilterRemainingH": 8000,
          "oilSeparatorRemainingH": null
        },
        "AD300-1": {
          "runningHours": 7580,
          "loadHours": 7559
        },
        "AD300-2": {
          "runningHours": 6050,
          "loadHours": 6042
        },
        "NPG360-1": {
          "runningHours": 5037,
          "loadHours": null
        },
        "NPG360-2": {
          "runningHours": 5112,
          "loadHours": null
        },
        "FD220-1": {
          "runningHours": null,
          "loadHours": null
        },
        "FD220-2": {
          "runningHours": null,
          "loadHours": null
        }
      },
      "recordedBy": "Import CSV"
    },
    {
      "id": "MNK-LOG-2024-05",
      "month": "2024-05",
      "recordedDate": "2024-05-15",
      "readings": {
        "GA75-1": {
          "runningHours": 1224,
          "loadHours": 1059,
          "oilRemainingH": null,
          "airFilterRemainingH": null,
          "oilFilterRemainingH": null,
          "oilSeparatorRemainingH": null
        },
        "GA75-2": {
          "runningHours": 1361,
          "loadHours": 1056,
          "oilRemainingH": null,
          "airFilterRemainingH": null,
          "oilFilterRemainingH": null,
          "oilSeparatorRemainingH": null
        },
        "VSD90-1": {
          "runningHours": 3972,
          "loadHours": 3816,
          "oilRemainingH": 8000,
          "airFilterRemainingH": 4000,
          "oilFilterRemainingH": 8000,
          "oilSeparatorRemainingH": null
        },
        "VSD90-2": {
          "runningHours": 5422,
          "loadHours": 5356,
          "oilRemainingH": 7589,
          "airFilterRemainingH": 3589,
          "oilFilterRemainingH": 7589,
          "oilSeparatorRemainingH": null
        },
        "AD300-1": {
          "runningHours": 8090,
          "loadHours": 8068
        },
        "AD300-2": {
          "runningHours": 6560,
          "loadHours": 6551
        },
        "NPG360-1": {
          "runningHours": 5240,
          "loadHours": null
        },
        "NPG360-2": {
          "runningHours": 5358,
          "loadHours": null
        },
        "FD220-1": {
          "runningHours": null,
          "loadHours": null
        },
        "FD220-2": {
          "runningHours": null,
          "loadHours": null
        }
      },
      "recordedBy": "Import CSV"
    },
    {
      "id": "MNK-LOG-2024-06",
      "month": "2024-06",
      "recordedDate": "2024-06-15",
      "readings": {
        "GA75-1": {
          "runningHours": 1387,
          "loadHours": 1064,
          "oilRemainingH": null,
          "airFilterRemainingH": null,
          "oilFilterRemainingH": null,
          "oilSeparatorRemainingH": null
        },
        "GA75-2": {
          "runningHours": 1522,
          "loadHours": 1175,
          "oilRemainingH": null,
          "airFilterRemainingH": null,
          "oilFilterRemainingH": null,
          "oilSeparatorRemainingH": null
        },
        "VSD90-1": {
          "runningHours": 3972,
          "loadHours": 3816,
          "oilRemainingH": 8000,
          "airFilterRemainingH": 4000,
          "oilFilterRemainingH": 8000,
          "oilSeparatorRemainingH": 8000
        },
        "VSD90-2": {
          "runningHours": 5730,
          "loadHours": 5664,
          "oilRemainingH": 7281,
          "airFilterRemainingH": 3281,
          "oilFilterRemainingH": 7281,
          "oilSeparatorRemainingH": 8000
        },
        "AD300-1": {
          "runningHours": 8612,
          "loadHours": 8590
        },
        "AD300-2": {
          "runningHours": 7081,
          "loadHours": 7073
        },
        "NPG360-1": {
          "runningHours": 5452,
          "loadHours": null
        },
        "NPG360-2": {
          "runningHours": 5625,
          "loadHours": null
        },
        "FD220-1": {
          "runningHours": null,
          "loadHours": null
        },
        "FD220-2": {
          "runningHours": null,
          "loadHours": null
        }
      },
      "recordedBy": "Import CSV"
    },
    {
      "id": "MNK-LOG-2024-07",
      "month": "2024-07",
      "recordedDate": "2024-07-15",
      "readings": {
        "GA75-1": {
          "runningHours": 1387,
          "loadHours": 1064,
          "oilRemainingH": 8000,
          "airFilterRemainingH": 4000,
          "oilFilterRemainingH": 4000,
          "oilSeparatorRemainingH": 8000
        },
        "GA75-2": {
          "runningHours": 1523,
          "loadHours": 1175,
          "oilRemainingH": 8000,
          "airFilterRemainingH": 4000,
          "oilFilterRemainingH": 4000,
          "oilSeparatorRemainingH": 8000
        },
        "VSD90-1": {
          "runningHours": 4267,
          "loadHours": 4243,
          "oilRemainingH": 7705,
          "airFilterRemainingH": 3705,
          "oilFilterRemainingH": 7705,
          "oilSeparatorRemainingH": 7705
        },
        "VSD90-2": {
          "runningHours": 5991,
          "loadHours": 5924,
          "oilRemainingH": 7020,
          "airFilterRemainingH": 3020,
          "oilFilterRemainingH": 7020,
          "oilSeparatorRemainingH": 7739
        },
        "AD300-1": {
          "runningHours": 9229,
          "loadHours": 9207
        },
        "AD300-2": {
          "runningHours": 7699,
          "loadHours": 427
        },
        "NPG360-1": {
          "runningHours": 5959,
          "loadHours": null
        },
        "NPG360-2": {
          "runningHours": 5686,
          "loadHours": null
        },
        "FD220-1": {
          "runningHours": null,
          "loadHours": null
        },
        "FD220-2": {
          "runningHours": null,
          "loadHours": null
        }
      },
      "recordedBy": "Import CSV"
    },
    {
      "id": "MNK-LOG-2024-08",
      "month": "2024-08",
      "recordedDate": "2024-08-15",
      "readings": {
        "GA75-1": {
          "runningHours": 1402,
          "loadHours": 1078,
          "oilRemainingH": 7985,
          "airFilterRemainingH": 3985,
          "oilFilterRemainingH": 3985,
          "oilSeparatorRemainingH": 7985
        },
        "GA75-2": {
          "runningHours": 1533,
          "loadHours": 1184,
          "oilRemainingH": 7990,
          "airFilterRemainingH": 3990,
          "oilFilterRemainingH": 3990,
          "oilSeparatorRemainingH": 7990
        },
        "VSD90-1": {
          "runningHours": 4623,
          "loadHours": 4598,
          "oilRemainingH": 7349,
          "airFilterRemainingH": 3349,
          "oilFilterRemainingH": 7349,
          "oilSeparatorRemainingH": 7349
        },
        "VSD90-2": {
          "runningHours": 6077,
          "loadHours": 6010,
          "oilRemainingH": 6934,
          "airFilterRemainingH": 2934,
          "oilFilterRemainingH": 6934,
          "oilSeparatorRemainingH": 7653
        },
        "AD300-1": {
          "runningHours": 9658,
          "loadHours": 9636
        },
        "AD300-2": {
          "runningHours": 8128,
          "loadHours": 856
        },
        "NPG360-1": {
          "runningHours": 6311,
          "loadHours": null
        },
        "NPG360-2": {
          "runningHours": 5750,
          "loadHours": null
        },
        "FD220-1": {
          "runningHours": null,
          "loadHours": null
        },
        "FD220-2": {
          "runningHours": null,
          "loadHours": null
        }
      },
      "recordedBy": "Import CSV"
    },
    {
      "id": "MNK-LOG-2024-09",
      "month": "2024-09",
      "recordedDate": "2024-09-15",
      "readings": {
        "GA75-1": {
          "runningHours": 1430,
          "loadHours": 1089,
          "oilRemainingH": 7957,
          "airFilterRemainingH": 3957,
          "oilFilterRemainingH": 3957,
          "oilSeparatorRemainingH": 7957
        },
        "GA75-2": {
          "runningHours": 1541,
          "loadHours": 1187,
          "oilRemainingH": 7982,
          "airFilterRemainingH": 3982,
          "oilFilterRemainingH": 3982,
          "oilSeparatorRemainingH": 7982
        },
        "VSD90-1": {
          "runningHours": 4918,
          "loadHours": 4893,
          "oilRemainingH": 7054,
          "airFilterRemainingH": 3054,
          "oilFilterRemainingH": 7054,
          "oilSeparatorRemainingH": 7054
        },
        "VSD90-2": {
          "runningHours": 6516,
          "loadHours": 6448,
          "oilRemainingH": 6495,
          "airFilterRemainingH": 2495,
          "oilFilterRemainingH": 6495,
          "oilSeparatorRemainingH": 7214
        },
        "AD300-1": {
          "runningHours": 10255,
          "loadHours": 10232
        },
        "AD300-2": {
          "runningHours": 8725,
          "loadHours": 1452
        },
        "NPG360-1": {
          "runningHours": 6384,
          "loadHours": null
        },
        "NPG360-2": {
          "runningHours": 6283,
          "loadHours": null
        },
        "FD220-1": {
          "runningHours": null,
          "loadHours": null
        },
        "FD220-2": {
          "runningHours": null,
          "loadHours": null
        }
      },
      "recordedBy": "Import CSV"
    },
    {
      "id": "MNK-LOG-2024-12",
      "month": "2024-12",
      "recordedDate": "2024-12-15",
      "readings": {
        "GA75-1": {
          "runningHours": 1987,
          "loadHours": 1564,
          "oilRemainingH": 7400,
          "airFilterRemainingH": 3400,
          "oilFilterRemainingH": 3400,
          "oilSeparatorRemainingH": 7400
        },
        "GA75-2": {
          "runningHours": 2334,
          "loadHours": 1939,
          "oilRemainingH": 7189,
          "airFilterRemainingH": 3189,
          "oilFilterRemainingH": 3189,
          "oilSeparatorRemainingH": 7189
        },
        "VSD90-1": {
          "runningHours": 5426,
          "loadHours": 5400,
          "oilRemainingH": 6546,
          "airFilterRemainingH": 2546,
          "oilFilterRemainingH": 6546,
          "oilSeparatorRemainingH": 6546
        },
        "VSD90-2": {
          "runningHours": 8026,
          "loadHours": 7912,
          "oilRemainingH": 4985,
          "airFilterRemainingH": 985,
          "oilFilterRemainingH": 4985,
          "oilSeparatorRemainingH": 5704
        },
        "AD300-1": {
          "runningHours": 12295,
          "loadHours": 12272
        },
        "AD300-2": {
          "runningHours": 10765,
          "loadHours": 3493
        },
        "NPG360-1": {
          "runningHours": 7734,
          "loadHours": null
        },
        "NPG360-2": {
          "runningHours": 6926,
          "loadHours": null
        },
        "FD220-1": {
          "runningHours": null,
          "loadHours": null
        },
        "FD220-2": {
          "runningHours": null,
          "loadHours": null
        }
      },
      "recordedBy": "Import CSV"
    },
    {
      "id": "MNK-LOG-2025-01",
      "month": "2025-01",
      "recordedDate": "2025-01-15",
      "readings": {
        "GA75-1": {
          "runningHours": 2077,
          "loadHours": 1626,
          "oilRemainingH": 7310,
          "airFilterRemainingH": 3310,
          "oilFilterRemainingH": 3310,
          "oilSeparatorRemainingH": 7310
        },
        "GA75-2": {
          "runningHours": 2817,
          "loadHours": 2364,
          "oilRemainingH": 6706,
          "airFilterRemainingH": 2706,
          "oilFilterRemainingH": 2706,
          "oilSeparatorRemainingH": 6706
        },
        "VSD90-1": {
          "runningHours": 5646,
          "loadHours": 5619,
          "oilRemainingH": 6326,
          "airFilterRemainingH": 2326,
          "oilFilterRemainingH": 6326,
          "oilSeparatorRemainingH": 6326
        },
        "VSD90-2": {
          "runningHours": 8585,
          "loadHours": 8457,
          "oilRemainingH": 4426,
          "airFilterRemainingH": 426,
          "oilFilterRemainingH": 4426,
          "oilSeparatorRemainingH": 5145
        },
        "AD300-1": {
          "runningHours": 13054,
          "loadHours": 202
        },
        "AD300-2": {
          "runningHours": 11524,
          "loadHours": 4252
        },
        "NPG360-1": {
          "runningHours": 8230,
          "loadHours": null
        },
        "NPG360-2": {
          "runningHours": 7536,
          "loadHours": null
        },
        "FD220-1": {
          "runningHours": null,
          "loadHours": null
        },
        "FD220-2": {
          "runningHours": null,
          "loadHours": null
        }
      },
      "recordedBy": "Import CSV"
    },
    {
      "id": "MNK-LOG-2025-02",
      "month": "2025-02",
      "recordedDate": "2025-02-15",
      "readings": {
        "GA75-1": {
          "runningHours": 2124,
          "loadHours": 1670,
          "oilRemainingH": 7263,
          "airFilterRemainingH": 3263,
          "oilFilterRemainingH": 3263,
          "oilSeparatorRemainingH": 7263
        },
        "GA75-2": {
          "runningHours": 2863,
          "loadHours": 2405,
          "oilRemainingH": 6660,
          "airFilterRemainingH": 2660,
          "oilFilterRemainingH": 2660,
          "oilSeparatorRemainingH": 6660
        },
        "VSD90-1": {
          "runningHours": 5750,
          "loadHours": 5723,
          "oilRemainingH": 6222,
          "airFilterRemainingH": 2222,
          "oilFilterRemainingH": 6222,
          "oilSeparatorRemainingH": 6222
        },
        "VSD90-2": {
          "runningHours": 8733,
          "loadHours": 8644,
          "oilRemainingH": 4278,
          "airFilterRemainingH": 278,
          "oilFilterRemainingH": 4278,
          "oilSeparatorRemainingH": 4997
        },
        "AD300-1": {
          "runningHours": 13264,
          "loadHours": 412
        },
        "AD300-2": {
          "runningHours": 11735,
          "loadHours": 4462
        },
        "NPG360-1": {
          "runningHours": 8417,
          "loadHours": null
        },
        "NPG360-2": {
          "runningHours": 7723,
          "loadHours": null
        },
        "FD220-1": {
          "runningHours": null,
          "loadHours": null
        },
        "FD220-2": {
          "runningHours": null,
          "loadHours": null
        }
      },
      "recordedBy": "Import CSV"
    },
    {
      "id": "MNK-LOG-2025-03",
      "month": "2025-03",
      "recordedDate": "2025-03-15",
      "readings": {
        "GA75-1": {
          "runningHours": 2569,
          "loadHours": 2055,
          "oilRemainingH": 6818,
          "airFilterRemainingH": 2818,
          "oilFilterRemainingH": 2818,
          "oilSeparatorRemainingH": 6818
        },
        "GA75-2": {
          "runningHours": 3104,
          "loadHours": 2621,
          "oilRemainingH": 6419,
          "airFilterRemainingH": 2419,
          "oilFilterRemainingH": 2419,
          "oilSeparatorRemainingH": 6419
        },
        "VSD90-1": {
          "runningHours": 6023,
          "loadHours": 5995,
          "oilRemainingH": 5949,
          "airFilterRemainingH": 1949,
          "oilFilterRemainingH": 5949,
          "oilSeparatorRemainingH": 5949
        },
        "VSD90-2": {
          "runningHours": 9033,
          "loadHours": 8898,
          "oilRemainingH": 3978,
          "airFilterRemainingH": -22,
          "oilFilterRemainingH": 3978,
          "oilSeparatorRemainingH": 4697
        },
        "AD300-1": {
          "runningHours": 13952,
          "loadHours": 1101
        },
        "AD300-2": {
          "runningHours": 12424,
          "loadHours": 5151
        },
        "NPG360-1": {
          "runningHours": 8936,
          "loadHours": null
        },
        "NPG360-2": {
          "runningHours": 8271,
          "loadHours": null
        },
        "FD220-1": {
          "runningHours": null,
          "loadHours": null
        },
        "FD220-2": {
          "runningHours": null,
          "loadHours": null
        }
      },
      "recordedBy": "Import CSV"
    },
    {
      "id": "MNK-LOG-2025-04",
      "month": "2025-04",
      "recordedDate": "2025-04-15",
      "readings": {
        "GA75-1": {
          "runningHours": 2674,
          "loadHours": 2148,
          "oilRemainingH": 6713,
          "airFilterRemainingH": 2713,
          "oilFilterRemainingH": 2713,
          "oilSeparatorRemainingH": 6713
        },
        "GA75-2": {
          "runningHours": 3400,
          "loadHours": 2905,
          "oilRemainingH": 6123,
          "airFilterRemainingH": 2123,
          "oilFilterRemainingH": 2123,
          "oilSeparatorRemainingH": 6123
        },
        "VSD90-1": {
          "runningHours": 6172,
          "loadHours": 6144,
          "oilRemainingH": 5800,
          "airFilterRemainingH": 4000,
          "oilFilterRemainingH": 5800,
          "oilSeparatorRemainingH": 5800
        },
        "VSD90-2": {
          "runningHours": 9300,
          "loadHours": 9165,
          "oilRemainingH": 3711,
          "airFilterRemainingH": 4000,
          "oilFilterRemainingH": 3711,
          "oilSeparatorRemainingH": 4430
        },
        "AD300-1": {
          "runningHours": 14392,
          "loadHours": 1540
        },
        "AD300-2": {
          "runningHours": 12864,
          "loadHours": 5591
        },
        "NPG360-1": {
          "runningHours": 9312,
          "loadHours": null
        },
        "NPG360-2": {
          "runningHours": 8650,
          "loadHours": null
        },
        "FD220-1": {
          "runningHours": null,
          "loadHours": null
        },
        "FD220-2": {
          "runningHours": null,
          "loadHours": null
        }
      },
      "recordedBy": "Import CSV"
    },
    {
      "id": "MNK-LOG-2025-05",
      "month": "2025-05",
      "recordedDate": "2025-05-15",
      "readings": {
        "GA75-1": {
          "runningHours": 2718,
          "loadHours": 2184,
          "oilRemainingH": 6669,
          "airFilterRemainingH": 2669,
          "oilFilterRemainingH": 2669,
          "oilSeparatorRemainingH": 6669
        },
        "GA75-2": {
          "runningHours": 3449,
          "loadHours": 2951,
          "oilRemainingH": 6074,
          "airFilterRemainingH": 2074,
          "oilFilterRemainingH": 2074,
          "oilSeparatorRemainingH": 6074
        },
        "VSD90-1": {
          "runningHours": 6581,
          "loadHours": 6552,
          "oilRemainingH": 5391,
          "airFilterRemainingH": 3591,
          "oilFilterRemainingH": 5391,
          "oilSeparatorRemainingH": 5391
        },
        "VSD90-2": {
          "runningHours": 9775,
          "loadHours": 9639,
          "oilRemainingH": 3236,
          "airFilterRemainingH": 3525,
          "oilFilterRemainingH": 3236,
          "oilSeparatorRemainingH": 3955
        },
        "AD300-1": {
          "runningHours": 14876,
          "loadHours": 2023
        },
        "AD300-2": {
          "runningHours": 13349,
          "loadHours": 6076
        },
        "NPG360-1": {
          "runningHours": 9743,
          "loadHours": null
        },
        "NPG360-2": {
          "runningHours": 9117,
          "loadHours": null
        },
        "FD220-1": {
          "runningHours": null,
          "loadHours": null
        },
        "FD220-2": {
          "runningHours": null,
          "loadHours": null
        }
      },
      "recordedBy": "Import CSV"
    },
    {
      "id": "MNK-LOG-2025-06",
      "month": "2025-06",
      "recordedDate": "2025-06-15",
      "readings": {
        "GA75-1": {
          "runningHours": 2727,
          "loadHours": 2191,
          "oilRemainingH": 6660,
          "airFilterRemainingH": 2660,
          "oilFilterRemainingH": 2660,
          "oilSeparatorRemainingH": 6660
        },
        "GA75-2": {
          "runningHours": 3484,
          "loadHours": 2982,
          "oilRemainingH": 6039,
          "airFilterRemainingH": 2039,
          "oilFilterRemainingH": 2039,
          "oilSeparatorRemainingH": 6039
        },
        "VSD90-1": {
          "runningHours": 6955,
          "loadHours": 6927,
          "oilRemainingH": 5017,
          "airFilterRemainingH": 3217,
          "oilFilterRemainingH": 5017,
          "oilSeparatorRemainingH": 5017
        },
        "VSD90-2": {
          "runningHours": 10260,
          "loadHours": 10124,
          "oilRemainingH": 2751,
          "airFilterRemainingH": 3040,
          "oilFilterRemainingH": 4000,
          "oilSeparatorRemainingH": 3470
        },
        "AD300-1": {
          "runningHours": 15380,
          "loadHours": 2527
        },
        "AD300-2": {
          "runningHours": 13852,
          "loadHours": 6579
        },
        "NPG360-1": {
          "runningHours": 10170,
          "loadHours": null
        },
        "NPG360-2": {
          "runningHours": 9521,
          "loadHours": null
        },
        "FD220-1": {
          "runningHours": 10600,
          "loadHours": null
        },
        "FD220-2": {
          "runningHours": 9072,
          "loadHours": null
        }
      },
      "note": "Lọc dầu MNK sử dụng loại 4000h",
      "recordedBy": "Import CSV"
    },
    {
      "id": "MNK-LOG-2025-07",
      "month": "2025-07",
      "recordedDate": "2025-07-15",
      "readings": {
        "GA75-1": {
          "runningHours": 2730,
          "loadHours": 2193,
          "oilRemainingH": 6657,
          "airFilterRemainingH": 2657,
          "oilFilterRemainingH": 2657,
          "oilSeparatorRemainingH": 6657
        },
        "GA75-2": {
          "runningHours": 3489,
          "loadHours": 2986,
          "oilRemainingH": 6034,
          "airFilterRemainingH": 2034,
          "oilFilterRemainingH": 2034,
          "oilSeparatorRemainingH": 6034
        },
        "VSD90-1": {
          "runningHours": 7311,
          "loadHours": 7282,
          "oilRemainingH": 4661,
          "airFilterRemainingH": 2861,
          "oilFilterRemainingH": 4661,
          "oilSeparatorRemainingH": 4661
        },
        "VSD90-2": {
          "runningHours": 10719,
          "loadHours": 10582,
          "oilRemainingH": 2292,
          "airFilterRemainingH": 2581,
          "oilFilterRemainingH": 3541,
          "oilSeparatorRemainingH": 3011
        },
        "AD300-1": {
          "runningHours": 15880,
          "loadHours": 3027
        },
        "AD300-2": {
          "runningHours": 14350,
          "loadHours": 7078
        },
        "NPG360-1": {
          "runningHours": 10602,
          "loadHours": null
        },
        "NPG360-2": {
          "runningHours": 9526,
          "loadHours": null
        },
        "FD220-1": {
          "runningHours": 11102,
          "loadHours": null
        },
        "FD220-2": {
          "runningHours": 9130,
          "loadHours": null
        }
      },
      "recordedBy": "Import CSV"
    },
    {
      "id": "MNK-LOG-2025-08",
      "month": "2025-08",
      "recordedDate": "2025-08-15",
      "readings": {
        "GA75-1": {
          "runningHours": 2738,
          "loadHours": 2196,
          "oilRemainingH": 6649,
          "airFilterRemainingH": 2649,
          "oilFilterRemainingH": 2649,
          "oilSeparatorRemainingH": 6649
        },
        "GA75-2": {
          "runningHours": 3496,
          "loadHours": 2993,
          "oilRemainingH": 6027,
          "airFilterRemainingH": 2027,
          "oilFilterRemainingH": 2027,
          "oilSeparatorRemainingH": 6027
        },
        "VSD90-1": {
          "runningHours": 7710,
          "loadHours": 7681,
          "oilRemainingH": 4262,
          "airFilterRemainingH": 2462,
          "oilFilterRemainingH": 4262,
          "oilSeparatorRemainingH": 4262
        },
        "VSD90-2": {
          "runningHours": 11146,
          "loadHours": 11109,
          "oilRemainingH": 1865,
          "airFilterRemainingH": 2154,
          "oilFilterRemainingH": 3114,
          "oilSeparatorRemainingH": 2584
        },
        "AD300-1": {
          "runningHours": 16283,
          "loadHours": 3430
        },
        "AD300-2": {
          "runningHours": 14692,
          "loadHours": 7420
        },
        "NPG360-1": {
          "runningHours": 10930,
          "loadHours": null
        },
        "NPG360-2": {
          "runningHours": 10320,
          "loadHours": null
        },
        "FD220-1": {
          "runningHours": 11460,
          "loadHours": null
        },
        "FD220-2": {
          "runningHours": 9215,
          "loadHours": null
        }
      },
      "recordedBy": "Import CSV"
    },
    {
      "id": "MNK-LOG-2025-09",
      "month": "2025-09",
      "recordedDate": "2025-09-15",
      "readings": {
        "GA75-1": {
          "runningHours": 2783,
          "loadHours": 2224,
          "oilRemainingH": 6604,
          "airFilterRemainingH": 2621,
          "oilFilterRemainingH": 2694,
          "oilSeparatorRemainingH": 6677
        },
        "GA75-2": {
          "runningHours": 3629,
          "loadHours": 3123,
          "oilRemainingH": 5894,
          "airFilterRemainingH": 1894,
          "oilFilterRemainingH": 1894,
          "oilSeparatorRemainingH": 5894
        },
        "VSD90-1": {
          "runningHours": 8048,
          "loadHours": 8019,
          "oilRemainingH": 3924,
          "airFilterRemainingH": 2124,
          "oilFilterRemainingH": 3924,
          "oilSeparatorRemainingH": 3924
        },
        "VSD90-2": {
          "runningHours": 11423,
          "loadHours": 11286,
          "oilRemainingH": 8000,
          "airFilterRemainingH": 1877,
          "oilFilterRemainingH": 8000,
          "oilSeparatorRemainingH": 8000
        },
        "AD300-1": {
          "runningHours": 16820,
          "loadHours": 3930
        },
        "AD300-2": {
          "runningHours": 15242,
          "loadHours": 7941
        },
        "NPG360-1": {
          "runningHours": 11467,
          "loadHours": null
        },
        "NPG360-2": {
          "runningHours": 10810,
          "loadHours": null
        },
        "FD220-1": {
          "runningHours": 12006,
          "loadHours": null
        },
        "FD220-2": {
          "runningHours": 9375,
          "loadHours": null
        }
      },
      "recordedBy": "Import CSV"
    },
    {
      "id": "MNK-LOG-2025-10",
      "month": "2025-10",
      "recordedDate": "2025-10-15",
      "readings": {
        "GA75-1": {
          "runningHours": 2803,
          "loadHours": 2244,
          "oilRemainingH": 6584,
          "airFilterRemainingH": 2601,
          "oilFilterRemainingH": 2714,
          "oilSeparatorRemainingH": 6697
        },
        "GA75-2": {
          "runningHours": 3871,
          "loadHours": 3360,
          "oilRemainingH": 5652,
          "airFilterRemainingH": 1652,
          "oilFilterRemainingH": 1652,
          "oilSeparatorRemainingH": 5652
        },
        "VSD90-1": {
          "runningHours": 8691,
          "loadHours": 8660,
          "oilRemainingH": 3281,
          "airFilterRemainingH": 1481,
          "oilFilterRemainingH": 3281,
          "oilSeparatorRemainingH": 3281
        },
        "VSD90-2": {
          "runningHours": 11872,
          "loadHours": 11734,
          "oilRemainingH": 7551,
          "airFilterRemainingH": 1428,
          "oilFilterRemainingH": 7551,
          "oilSeparatorRemainingH": 7551
        },
        "AD300-1": {
          "runningHours": 17363,
          "loadHours": 4507
        },
        "AD300-2": {
          "runningHours": 15836,
          "loadHours": 8560
        },
        "NPG360-1": {
          "runningHours": 12005,
          "loadHours": null
        },
        "NPG360-2": {
          "runningHours": 11313,
          "loadHours": null
        },
        "FD220-1": {
          "runningHours": 12583,
          "loadHours": null
        },
        "FD220-2": {
          "runningHours": 9546,
          "loadHours": null
        }
      },
      "recordedBy": "Import CSV"
    },
    {
      "id": "MNK-LOG-2025-11",
      "month": "2025-11",
      "recordedDate": "2025-11-15",
      "readings": {
        "GA75-1": {
          "runningHours": 2806,
          "loadHours": 2246,
          "oilRemainingH": 6581,
          "airFilterRemainingH": 2599,
          "oilFilterRemainingH": 2717,
          "oilSeparatorRemainingH": 6699
        },
        "GA75-2": {
          "runningHours": 3875,
          "loadHours": 3364,
          "oilRemainingH": 5648,
          "airFilterRemainingH": 1648,
          "oilFilterRemainingH": 1648,
          "oilSeparatorRemainingH": 5648
        },
        "VSD90-1": {
          "runningHours": 9338,
          "loadHours": 9307,
          "oilRemainingH": 2634,
          "airFilterRemainingH": 834,
          "oilFilterRemainingH": 2634,
          "oilSeparatorRemainingH": 2634
        },
        "VSD90-2": {
          "runningHours": 12538,
          "loadHours": 12400,
          "oilRemainingH": 6885,
          "airFilterRemainingH": 762,
          "oilFilterRemainingH": 6885,
          "oilSeparatorRemainingH": 6885
        },
        "AD300-1": {
          "runningHours": 18032,
          "loadHours": 5176
        },
        "AD300-2": {
          "runningHours": 16504,
          "loadHours": 9229
        },
        "NPG360-1": {
          "runningHours": 12658,
          "loadHours": null
        },
        "NPG360-2": {
          "runningHours": 11964,
          "loadHours": null
        },
        "FD220-1": {
          "runningHours": 13251,
          "loadHours": null
        },
        "FD220-2": {
          "runningHours": 9998,
          "loadHours": null
        }
      },
      "recordedBy": "Import CSV"
    },
    {
      "id": "MNK-LOG-2025-12",
      "month": "2025-12",
      "recordedDate": "2025-12-15",
      "readings": {
        "GA75-1": {
          "runningHours": 2813,
          "loadHours": 2249,
          "oilRemainingH": 6574,
          "airFilterRemainingH": 2596,
          "oilFilterRemainingH": 2724,
          "oilSeparatorRemainingH": 6702
        },
        "GA75-2": {
          "runningHours": 3879,
          "loadHours": 3367,
          "oilRemainingH": 5644,
          "airFilterRemainingH": 1644,
          "oilFilterRemainingH": 1644,
          "oilSeparatorRemainingH": 5644
        },
        "VSD90-1": {
          "runningHours": 9682,
          "loadHours": 9651,
          "oilRemainingH": 2290,
          "airFilterRemainingH": 490,
          "oilFilterRemainingH": 2290,
          "oilSeparatorRemainingH": 2290
        },
        "VSD90-2": {
          "runningHours": 12985,
          "loadHours": 12847,
          "oilRemainingH": 6438,
          "airFilterRemainingH": 315,
          "oilFilterRemainingH": 6438,
          "oilSeparatorRemainingH": 6438
        },
        "AD300-1": {
          "runningHours": 18479,
          "loadHours": 5623
        },
        "AD300-2": {
          "runningHours": 16951,
          "loadHours": 9836
        },
        "NPG360-1": {
          "runningHours": 13024,
          "loadHours": null
        },
        "NPG360-2": {
          "runningHours": 12326,
          "loadHours": null
        },
        "FD220-1": {
          "runningHours": 13698,
          "loadHours": null
        },
        "FD220-2": {
          "runningHours": 9982,
          "loadHours": null
        }
      },
      "recordedBy": "Import CSV"
    },
    {
      "id": "MNK-LOG-2026-01",
      "month": "2026-01",
      "recordedDate": "2026-01-15",
      "readings": {
        "GA75-1": {
          "runningHours": 2817,
          "loadHours": 2252,
          "oilRemainingH": 6570,
          "airFilterRemainingH": 2593,
          "oilFilterRemainingH": 2728,
          "oilSeparatorRemainingH": 6705
        },
        "GA75-2": {
          "runningHours": 3886,
          "loadHours": 3373,
          "oilRemainingH": 5637,
          "airFilterRemainingH": 1637,
          "oilFilterRemainingH": 1637,
          "oilSeparatorRemainingH": 5637
        },
        "VSD90-1": {
          "runningHours": 10076,
          "loadHours": 10045,
          "oilRemainingH": 1896,
          "airFilterRemainingH": 96,
          "oilFilterRemainingH": 1896,
          "oilSeparatorRemainingH": 1896
        },
        "VSD90-2": {
          "runningHours": 13407,
          "loadHours": 13269,
          "oilRemainingH": 6016,
          "airFilterRemainingH": -107,
          "oilFilterRemainingH": 6016,
          "oilSeparatorRemainingH": 6016
        },
        "AD300-1": {
          "runningHours": 18960,
          "loadHours": 6291
        },
        "AD300-2": {
          "runningHours": 17430,
          "loadHours": 10240
        },
        "NPG360-1": {
          "runningHours": 13494,
          "loadHours": null
        },
        "NPG360-2": {
          "runningHours": 12779,
          "loadHours": null
        },
        "FD220-1": {
          "runningHours": 14180,
          "loadHours": null
        },
        "FD220-2": {
          "runningHours": null,
          "loadHours": null
        }
      },
      "recordedBy": "Import CSV"
    },
    {
      "id": "MNK-LOG-2026-02",
      "month": "2026-02",
      "recordedDate": "2026-02-15",
      "readings": {
        "GA75-1": {
          "runningHours": 2820,
          "loadHours": 2254,
          "oilRemainingH": 6567,
          "airFilterRemainingH": 2591,
          "oilFilterRemainingH": 2731,
          "oilSeparatorRemainingH": 6707
        },
        "GA75-2": {
          "runningHours": 3889,
          "loadHours": 3375,
          "oilRemainingH": 5634,
          "airFilterRemainingH": 1634,
          "oilFilterRemainingH": 1634,
          "oilSeparatorRemainingH": 5634
        },
        "VSD90-1": {
          "runningHours": 10449,
          "loadHours": 10417,
          "oilRemainingH": 1523,
          "airFilterRemainingH": -277,
          "oilFilterRemainingH": 1523,
          "oilSeparatorRemainingH": 1523
        },
        "VSD90-2": {
          "runningHours": 13814,
          "loadHours": 13676,
          "oilRemainingH": 5609,
          "airFilterRemainingH": -514,
          "oilFilterRemainingH": 5609,
          "oilSeparatorRemainingH": 5609
        },
        "AD300-1": {
          "runningHours": 19452,
          "loadHours": 6966
        },
        "AD300-2": {
          "runningHours": 17925,
          "loadHours": 10648
        },
        "NPG360-1": {
          "runningHours": 13968,
          "loadHours": null
        },
        "NPG360-2": {
          "runningHours": 13241,
          "loadHours": null
        },
        "FD220-1": {
          "runningHours": 14672,
          "loadHours": null
        },
        "FD220-2": {
          "runningHours": 9613,
          "loadHours": null
        }
      },
      "recordedBy": "Import CSV"
    },
    {
      "id": "MNK-LOG-2026-03",
      "month": "2026-03",
      "recordedDate": "2026-03-15",
      "readings": {
        "GA75-1": {
          "runningHours": 2831,
          "loadHours": 2260,
          "oilRemainingH": 6556,
          "airFilterRemainingH": 2585,
          "oilFilterRemainingH": 2742,
          "oilSeparatorRemainingH": 6713
        },
        "GA75-2": {
          "runningHours": 3991,
          "loadHours": 3477,
          "oilRemainingH": 5532,
          "airFilterRemainingH": 1532,
          "oilFilterRemainingH": 1532,
          "oilSeparatorRemainingH": 5532
        },
        "VSD90-1": {
          "runningHours": 10852,
          "loadHours": 10825,
          "oilRemainingH": 8000,
          "airFilterRemainingH": 4000,
          "oilFilterRemainingH": 8000,
          "oilSeparatorRemainingH": 8000
        },
        "VSD90-2": {
          "runningHours": 14210,
          "loadHours": 14071,
          "oilRemainingH": 8000,
          "airFilterRemainingH": -910,
          "oilFilterRemainingH": 5213,
          "oilSeparatorRemainingH": 5213
        },
        "AD300-1": {
          "runningHours": 19967,
          "loadHours": 7481
        },
        "AD300-2": {
          "runningHours": 18440,
          "loadHours": 11163
        },
        "NPG360-1": {
          "runningHours": 14498,
          "loadHours": null
        },
        "NPG360-2": {
          "runningHours": 13786,
          "loadHours": null
        },
        "FD220-1": {
          "runningHours": 15187,
          "loadHours": null
        },
        "FD220-2": {
          "runningHours": 10128,
          "loadHours": null
        }
      },
      "recordedBy": "Import CSV"
    },
    {
      "id": "MNK-LOG-2026-05",
      "month": "2026-05",
      "recordedDate": "2026-05-15",
      "readings": {
        "GA75-1": {
          "runningHours": 2843,
          "loadHours": 2265,
          "oilRemainingH": 6544,
          "airFilterRemainingH": 2580,
          "oilFilterRemainingH": 2754,
          "oilSeparatorRemainingH": 6718
        },
        "GA75-2": {
          "runningHours": 4258,
          "loadHours": 3743,
          "oilRemainingH": 5265,
          "airFilterRemainingH": 1265,
          "oilFilterRemainingH": 1265,
          "oilSeparatorRemainingH": 5265
        },
        "VSD90-1": {
          "runningHours": 11728,
          "loadHours": 11696,
          "oilRemainingH": 7124,
          "airFilterRemainingH": 3124,
          "oilFilterRemainingH": 7124,
          "oilSeparatorRemainingH": 7124
        },
        "VSD90-2": {
          "runningHours": 15227,
          "loadHours": 15088,
          "oilRemainingH": 6983,
          "airFilterRemainingH": -1927,
          "oilFilterRemainingH": 4196,
          "oilSeparatorRemainingH": 4196
        },
        "AD300-1": {
          "runningHours": 20885,
          "loadHours": 8029
        },
        "AD300-2": {
          "runningHours": 19359,
          "loadHours": 12082
        },
        "NPG360-1": {
          "runningHours": 15299,
          "loadHours": null
        },
        "NPG360-2": {
          "runningHours": 14556,
          "loadHours": null
        },
        "FD220-1": {
          "runningHours": 16105,
          "loadHours": null
        },
        "FD220-2": {
          "runningHours": 10419,
          "loadHours": null
        }
      },
      "recordedBy": "Import CSV"
    },
    {
      "id": "MNK-LOG-2026-06",
      "month": "2026-06",
      "recordedDate": "2026-06-15",
      "readings": {
        "GA75-1": {
          "runningHours": 2844,
          "loadHours": 2266,
          "oilRemainingH": 6543,
          "airFilterRemainingH": 2579,
          "oilFilterRemainingH": 2755,
          "oilSeparatorRemainingH": 6719
        },
        "GA75-2": {
          "runningHours": 4267,
          "loadHours": 3751,
          "oilRemainingH": 5256,
          "airFilterRemainingH": 1256,
          "oilFilterRemainingH": 1256,
          "oilSeparatorRemainingH": 5256
        },
        "VSD90-1": {
          "runningHours": 12204,
          "loadHours": 12172,
          "oilRemainingH": 6648,
          "airFilterRemainingH": 2648,
          "oilFilterRemainingH": 6648,
          "oilSeparatorRemainingH": 6648
        },
        "VSD90-2": {
          "runningHours": 15745,
          "loadHours": 15607,
          "oilRemainingH": 6465,
          "airFilterRemainingH": -2445,
          "oilFilterRemainingH": 3678,
          "oilSeparatorRemainingH": 3678
        },
        "AD300-1": {
          "runningHours": 21411,
          "loadHours": 8554
        },
        "AD300-2": {
          "runningHours": 19884,
          "loadHours": 12607
        },
        "NPG360-1": {
          "runningHours": 15783,
          "loadHours": null
        },
        "NPG360-2": {
          "runningHours": 15073,
          "loadHours": null
        },
        "FD220-1": {
          "runningHours": 16630,
          "loadHours": null
        },
        "FD220-2": {
          "runningHours": 10944,
          "loadHours": null
        }
      },
      "recordedBy": "Import CSV"
    },
    {
      "id": "MNK-LOG-2026-07",
      "month": "2026-07",
      "recordedDate": "2026-07-15",
      "readings": {
        "GA75-1": {
          "runningHours": 2932,
          "loadHours": 2351,
          "oilRemainingH": 6455,
          "airFilterRemainingH": 2494,
          "oilFilterRemainingH": 2843,
          "oilSeparatorRemainingH": 6804
        },
        "GA75-2": {
          "runningHours": 4542,
          "loadHours": 4024,
          "oilRemainingH": 4981,
          "airFilterRemainingH": 981,
          "oilFilterRemainingH": 981,
          "oilSeparatorRemainingH": 4981
        },
        "VSD90-1": {
          "runningHours": 12645,
          "loadHours": 12612,
          "oilRemainingH": 6207,
          "airFilterRemainingH": 2207,
          "oilFilterRemainingH": 6207,
          "oilSeparatorRemainingH": 6207
        },
        "VSD90-2": {
          "runningHours": 16561,
          "loadHours": 16422,
          "oilRemainingH": 5649,
          "airFilterRemainingH": -3261,
          "oilFilterRemainingH": 2862,
          "oilSeparatorRemainingH": 2862
        },
        "AD300-1": {
          "runningHours": 22232,
          "loadHours": null
        },
        "AD300-2": {
          "runningHours": 20705,
          "loadHours": 13428
        },
        "NPG360-1": {
          "runningHours": 16604,
          "loadHours": null
        },
        "NPG360-2": {
          "runningHours": 15890,
          "loadHours": null
        },
        "FD220-1": {
          "runningHours": 17465,
          "loadHours": null
        },
        "FD220-2": {
          "runningHours": 17781,
          "loadHours": null
        }
      },
      "recordedBy": "Import CSV"
    },
    {
      "id": "MNK-LOG-2026-08",
      "month": "2026-08",
      "recordedDate": "2026-08-15",
      "readings": {
        "GA75-1": {
          "runningHours": 3003,
          "loadHours": 2382,
          "oilRemainingH": 6384,
          "airFilterRemainingH": 2463,
          "oilFilterRemainingH": 2914,
          "oilSeparatorRemainingH": 6835
        },
        "GA75-2": {
          "runningHours": 5108,
          "loadHours": 4589,
          "oilRemainingH": 4415,
          "airFilterRemainingH": 415,
          "oilFilterRemainingH": 415,
          "oilSeparatorRemainingH": 4415
        },
        "VSD90-1": {
          "runningHours": null,
          "loadHours": null,
          "oilRemainingH": 18852,
          "airFilterRemainingH": 14852,
          "oilFilterRemainingH": 18852,
          "oilSeparatorRemainingH": 18852
        },
        "VSD90-2": {
          "runningHours": 17128,
          "loadHours": 16988,
          "oilRemainingH": 5082,
          "airFilterRemainingH": 8000,
          "oilFilterRemainingH": 2295,
          "oilSeparatorRemainingH": 2295
        },
        "AD300-1": {
          "runningHours": 22804,
          "loadHours": null
        },
        "AD300-2": {
          "runningHours": 21277,
          "loadHours": 14000
        },
        "NPG360-1": {
          "runningHours": 17173,
          "loadHours": null
        },
        "NPG360-2": {
          "runningHours": 16457,
          "loadHours": null
        },
        "FD220-1": {
          "runningHours": null,
          "loadHours": null
        },
        "FD220-2": {
          "runningHours": null,
          "loadHours": null
        }
      },
      "recordedBy": "Import CSV"
    },
    {
      "id": "MNK-LOG-2026-09",
      "month": "2026-09",
      "recordedDate": "2026-09-15",
      "readings": {
        "GA75-1": {
          "runningHours": 3583,
          "loadHours": 2961,
          "oilRemainingH": 5804,
          "airFilterRemainingH": 1884,
          "oilFilterRemainingH": 3494,
          "oilSeparatorRemainingH": 7414
        },
        "GA75-2": {
          "runningHours": 5140,
          "loadHours": 4615,
          "oilRemainingH": 4383,
          "airFilterRemainingH": 383,
          "oilFilterRemainingH": 8000,
          "oilSeparatorRemainingH": 4383
        },
        "VSD90-1": {
          "runningHours": null,
          "loadHours": null,
          "oilRemainingH": 18852,
          "airFilterRemainingH": 14852,
          "oilFilterRemainingH": 18852,
          "oilSeparatorRemainingH": 18852
        },
        "VSD90-2": {
          "runningHours": 17730,
          "loadHours": 17590,
          "oilRemainingH": 4480,
          "airFilterRemainingH": 7398,
          "oilFilterRemainingH": 1693,
          "oilSeparatorRemainingH": 1693
        },
        "AD300-1": {
          "runningHours": 23409,
          "loadHours": null
        },
        "AD300-2": {
          "runningHours": 21882,
          "loadHours": 14000
        },
        "NPG360-1": {
          "runningHours": 17776,
          "loadHours": null
        },
        "NPG360-2": {
          "runningHours": 17059,
          "loadHours": null
        },
        "FD220-1": {
          "runningHours": null,
          "loadHours": null
        },
        "FD220-2": {
          "runningHours": null,
          "loadHours": null
        }
      },
      "recordedBy": "Import CSV"
    },
    {
      "id": "MNK-LOG-2026-10",
      "month": "2026-10",
      "recordedDate": "2026-10-15",
      "readings": {
        "GA75-1": {
          "runningHours": 3940,
          "loadHours": 3300,
          "oilRemainingH": 5447,
          "airFilterRemainingH": 1545,
          "oilFilterRemainingH": 3851,
          "oilSeparatorRemainingH": 7753
        },
        "GA75-2": {
          "runningHours": 5453,
          "loadHours": 4926,
          "oilRemainingH": 4070,
          "airFilterRemainingH": 70,
          "oilFilterRemainingH": 7687,
          "oilSeparatorRemainingH": 4070
        },
        "VSD90-1": {
          "runningHours": null,
          "loadHours": null,
          "oilRemainingH": 18852,
          "airFilterRemainingH": 14852,
          "oilFilterRemainingH": 18852,
          "oilSeparatorRemainingH": 18852
        },
        "VSD90-2": {
          "runningHours": 18289,
          "loadHours": 18148,
          "oilRemainingH": 3921,
          "airFilterRemainingH": 6839,
          "oilFilterRemainingH": 1134,
          "oilSeparatorRemainingH": 1134
        },
        "AD300-1": {
          "runningHours": 23409,
          "loadHours": null
        },
        "AD300-2": {
          "runningHours": 21882,
          "loadHours": 14000
        },
        "NPG360-1": {
          "runningHours": 17776,
          "loadHours": null
        },
        "NPG360-2": {
          "runningHours": 17059,
          "loadHours": null
        },
        "FD220-1": {
          "runningHours": null,
          "loadHours": null
        },
        "FD220-2": {
          "runningHours": null,
          "loadHours": null
        }
      },
      "recordedBy": "Import CSV"
    },
    {
      "id": "MNK-LOG-2026-11",
      "month": "2026-11",
      "recordedDate": "2026-11-15",
      "readings": {
        "GA75-1": {
          "runningHours": 3996,
          "loadHours": 3353,
          "oilRemainingH": 5391,
          "airFilterRemainingH": 1492,
          "oilFilterRemainingH": 3907,
          "oilSeparatorRemainingH": 7806
        },
        "GA75-2": {
          "runningHours": 6232,
          "loadHours": 5707,
          "oilRemainingH": 8000,
          "airFilterRemainingH": 4000,
          "oilFilterRemainingH": 6908,
          "oilSeparatorRemainingH": 8000
        },
        "VSD90-1": {
          "runningHours": null,
          "loadHours": null,
          "oilRemainingH": 18852,
          "airFilterRemainingH": 14852,
          "oilFilterRemainingH": 18852,
          "oilSeparatorRemainingH": 18852
        },
        "VSD90-2": {
          "runningHours": 19116,
          "loadHours": 18975,
          "oilRemainingH": 3094,
          "airFilterRemainingH": 6012,
          "oilFilterRemainingH": 307,
          "oilSeparatorRemainingH": 307
        },
        "AD300-1": {
          "runningHours": 24825,
          "loadHours": null
        },
        "AD300-2": {
          "runningHours": 23299,
          "loadHours": 16022
        },
        "NPG360-1": {
          "runningHours": 19168,
          "loadHours": null
        },
        "NPG360-2": {
          "runningHours": 18452,
          "loadHours": null
        },
        "FD220-1": {
          "runningHours": 20062,
          "loadHours": null
        },
        "FD220-2": {
          "runningHours": 11889,
          "loadHours": null
        }
      },
      "recordedBy": "Import CSV"
    }
  ],
  "replacementEvents": [
    {
      "id": "MNK-REP-032",
      "machineKey": "GA75-2",
      "date": "2026-11-18",
      "consumable": "oil",
      "newIntervalH": 8000,
      "note": "18L",
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-033",
      "machineKey": "GA75-2",
      "date": "2026-11-18",
      "consumable": "airFilter",
      "newIntervalH": 4000,
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-034",
      "machineKey": "GA75-2",
      "date": "2026-11-18",
      "consumable": "oilSeparator",
      "newIntervalH": 8000,
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-031",
      "machineKey": "VSD90-2",
      "date": "2026-08-19",
      "consumable": "airFilter",
      "newIntervalH": 4000,
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-030",
      "machineKey": "VSD90-2",
      "date": "2026-07-28",
      "consumable": "oil",
      "newIntervalH": 8000,
      "note": "- 5L mới, 9L rút từ máy 90-1",
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-028",
      "machineKey": "GA75-1",
      "date": "2026-07-22",
      "consumable": "oil",
      "newIntervalH": 8000,
      "note": "18L",
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-029",
      "machineKey": "GA75-1",
      "date": "2026-07-22",
      "consumable": "oilFilter",
      "newIntervalH": 8000,
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-027",
      "machineKey": "VSD90-2",
      "date": "2026-04-23",
      "consumable": "oilFilter",
      "newIntervalH": 8000,
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-023",
      "machineKey": "VSD90-1",
      "date": "2026-03-04",
      "consumable": "oil",
      "newIntervalH": 8000,
      "note": "32L",
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-024",
      "machineKey": "VSD90-1",
      "date": "2026-03-04",
      "consumable": "airFilter",
      "newIntervalH": 4000,
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-025",
      "machineKey": "VSD90-1",
      "date": "2026-03-04",
      "consumable": "oilFilter",
      "newIntervalH": 8000,
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-026",
      "machineKey": "VSD90-1",
      "date": "2026-03-04",
      "consumable": "oilSeparator",
      "newIntervalH": 8000,
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-020",
      "machineKey": "VSD90-2",
      "date": "2025-09-04",
      "consumable": "oil",
      "newIntervalH": 8000,
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-021",
      "machineKey": "VSD90-2",
      "date": "2025-09-04",
      "consumable": "oilFilter",
      "newIntervalH": 8000,
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-022",
      "machineKey": "VSD90-2",
      "date": "2025-09-04",
      "consumable": "oilSeparator",
      "newIntervalH": 8000,
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-019",
      "machineKey": "VSD90-2",
      "date": "2025-06-18",
      "consumable": "oilFilter",
      "newIntervalH": 4000,
      "note": "Loại 4000h",
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-018",
      "machineKey": "VSD90-2",
      "date": "2025-05-06",
      "consumable": "airFilter",
      "newIntervalH": 4000,
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-017",
      "machineKey": "VSD90-1",
      "date": "2025-04-26",
      "consumable": "airFilter",
      "newIntervalH": 4000,
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-005",
      "machineKey": "GA75-2",
      "date": "2024-07-12",
      "consumable": "oil",
      "newIntervalH": 8000,
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-006",
      "machineKey": "GA75-2",
      "date": "2024-07-12",
      "consumable": "airFilter",
      "newIntervalH": 4000,
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-007",
      "machineKey": "GA75-2",
      "date": "2024-07-12",
      "consumable": "oilFilter",
      "newIntervalH": 8000,
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-008",
      "machineKey": "GA75-2",
      "date": "2024-07-12",
      "consumable": "oilSeparator",
      "newIntervalH": 8000,
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-001",
      "machineKey": "GA75-1",
      "date": "2024-07-11",
      "consumable": "oil",
      "newIntervalH": 8000,
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-002",
      "machineKey": "GA75-1",
      "date": "2024-07-11",
      "consumable": "airFilter",
      "newIntervalH": 4000,
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-003",
      "machineKey": "GA75-1",
      "date": "2024-07-11",
      "consumable": "oilFilter",
      "newIntervalH": 8000,
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-004",
      "machineKey": "GA75-1",
      "date": "2024-07-11",
      "consumable": "oilSeparator",
      "newIntervalH": 8000,
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-016",
      "machineKey": "VSD90-2",
      "date": "2024-06-05",
      "consumable": "oilSeparator",
      "newIntervalH": 8000,
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-012",
      "machineKey": "VSD90-1",
      "date": "2024-06-04",
      "consumable": "oilSeparator",
      "newIntervalH": 8000,
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-013",
      "machineKey": "VSD90-2",
      "date": "2024-04-04",
      "consumable": "oil",
      "newIntervalH": 8000,
      "note": "31l",
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-014",
      "machineKey": "VSD90-2",
      "date": "2024-04-04",
      "consumable": "airFilter",
      "newIntervalH": 4000,
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-015",
      "machineKey": "VSD90-2",
      "date": "2024-04-04",
      "consumable": "oilFilter",
      "newIntervalH": 8000,
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-009",
      "machineKey": "VSD90-1",
      "date": "2024-04-03",
      "consumable": "oil",
      "newIntervalH": 8000,
      "note": "32l",
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-010",
      "machineKey": "VSD90-1",
      "date": "2024-04-03",
      "consumable": "airFilter",
      "newIntervalH": 4000,
      "performedBy": "Đội Kỹ thuật Utility"
    },
    {
      "id": "MNK-REP-011",
      "machineKey": "VSD90-1",
      "date": "2024-04-03",
      "consumable": "oilFilter",
      "newIntervalH": 8000,
      "performedBy": "Đội Kỹ thuật Utility"
    }
  ],
  "updatedAt": "2026-11-26T02:28:07.551Z"
};
