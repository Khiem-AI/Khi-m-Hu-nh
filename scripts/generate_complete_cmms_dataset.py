import csv
import json
import os
from datetime import datetime, timedelta

CSV_PATH = 'public/assets/aistudio/Qu_n_l__b_o_tr__1111_f617a209'

with open(CSV_PATH, 'r', encoding='utf-8', errors='replace') as f:
    raw_rows = list(csv.reader(f))[1:]

print(f"Read {len(raw_rows)} rows from {CSV_PATH}")

def normalize_system(sys_str):
    s = sys_str.strip()
    if s == 'Hệ thống lạnh':
        return 'Hệ Thống Lạnh'
    if s == 'Sản xuât nước DI- Drinking':
        return 'Sản xuất nước DI - Drinking'
    if not s:
        return 'Nhà Xưởng'
    return s

def normalize_person(p_str, system):
    p = p_str.strip()
    if p in ['Khiem Huynh', 'Huỳnh Khiêm', 'Khiêm Huỳnh']:
        return 'Khiêm Huỳnh', 'khiemhuynhggs@gmail.com'
    if 'Điện' in system or 'solar' in system.lower():
        return 'Phạm Đức Cường', 'cuong.pham@factory.com'
    if 'nước' in system.lower() or 'cháy' in system.lower():
        return 'Trần Minh Tuấn', 'tuan.tran@factory.com'
    if 'bếp' in system.lower() or 'xưởng' in system.lower():
        return 'Nguyễn Văn Hùng', 'hung.nguyen@factory.com'
    return 'Khiêm Huỳnh', 'khiemhuynhggs@gmail.com'

def determine_risk(code, name, system, current_risk):
    if current_risk in ['High', 'Medium', 'Low']:
        return current_risk
    code_upper = code.upper()
    if any(k in code_upper for k in ['CH-01', 'CH-02', 'CH-03', 'GA90', 'GA75', 'NPG', 'ELC-MV', 'ELC-MSB', 'ELC-GE', 'SOLAR', 'FFA-FA', 'FFA-PUMP', 'FFA-F200', 'WAT-WW']):
        return 'High'
    if any(k in code_upper for k in ['PAU', 'AHU', 'FCU', 'CLWP', 'CHWP', 'CT-', 'AD300', 'FD220', 'VACUM', 'AIR-T', 'WAT-PUM', 'CCTV', 'FLP', 'OVE', 'FRE', 'EPL', 'EWA', 'ECT']):
        return 'Medium'
    return 'Low'

def determine_freq(code, system, current_freq):
    if current_freq in ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']:
        return current_freq
    code_upper = code.upper()
    if 'WAT-WW' in code_upper:
        return 'Daily'
    if 'FFA-PUMP' in code_upper:
        return 'Weekly'
    if any(k in code_upper for k in ['ELC-MV', 'ELC-MSB', 'ELC-GE', 'AIR-T', 'FFA-F200', 'INLIG', 'OULIG', 'OFLIG', 'PAL1', 'PAL2']):
        return 'Quarterly'
    return 'Monthly'

def determine_status(code, current_status):
    if current_status in ['Hoạt động', 'Đang sửa chữa', 'Bảo trì', 'Tạm dừng']:
        return current_status
    if 'GA90-02' in code:
        return 'Đang sửa chữa'
    return 'Hoạt động'

def generate_dates(idx, freq):
    # Reference date: 2026-11-10
    if idx == 3: # HVAC-PAU-01
        last_d = '2026-10-05'
        next_d = '2026-11-05'
    elif idx == 109: # INF-FLP Bơm chống ngập
        last_d = '2026-10-01'
        next_d = '2026-11-01'
    elif idx == 13: # HVAC-WAH-02
        last_d = '2026-10-08'
        next_d = '2026-11-08'
    elif idx == 0: # HVAC-CH-01
        last_d = '2026-11-04'
        next_d = '2026-12-04'
    elif idx == 1: # HVAC-CH-02
        last_d = '2026-10-20'
        next_d = '2026-11-20'
    elif idx == 2: # HVAC-CH-03
        last_d = '2026-10-12'
        next_d = '2026-11-12'
    elif idx == 5: # HVAC-AHU-01
        last_d = '2026-10-14'
        next_d = '2026-11-14'
    elif idx == 6: # HVAC-AHU-02
        last_d = '2026-10-15'
        next_d = '2026-11-15'
    elif idx == 7: # HVAC-AHU-03
        last_d = '2026-10-16'
        next_d = '2026-11-16'
    elif idx == 8: # HVAC-AHU-04
        last_d = '2026-10-18'
        next_d = '2026-11-18'
    elif idx == 9: # HVAC-AHU-05
        last_d = '2026-10-22'
        next_d = '2026-11-22'
    elif idx == 10: # HVAC-AHU-06
        last_d = '2026-10-11'
        next_d = '2026-11-11'
    elif idx == 43: # CMP-GA90-01
        last_d = '2026-10-13'
        next_d = '2026-11-13'
    elif idx == 44: # CMP-GA90-02
        last_d = '2026-10-10'
        next_d = '2026-11-10'
    elif idx == 73: # FFA-FA
        last_d = '2026-10-10'
        next_d = '2026-11-10'
    else:
        day_offset = (idx * 3) % 35 + 1
        ref = datetime(2026, 11, 10) + timedelta(days=day_offset)
        next_d = ref.strftime('%Y-%m-%d')
        if freq == 'Daily':
            last_d = (ref - timedelta(days=1)).strftime('%Y-%m-%d')
        elif freq == 'Weekly':
            last_d = (ref - timedelta(days=7)).strftime('%Y-%m-%d')
        elif freq == 'Quarterly':
            last_d = (ref - timedelta(days=90)).strftime('%Y-%m-%d')
        elif freq == 'Yearly':
            last_d = (ref - timedelta(days=365)).strftime('%Y-%m-%d')
        else: # Monthly
            last_d = (ref - timedelta(days=30)).strftime('%Y-%m-%d')

    return last_d, next_d

def get_plan_status(next_d_str, ref_str='2026-11-10'):
    d_next = datetime.strptime(next_d_str, '%Y-%m-%d')
    d_ref = datetime.strptime(ref_str, '%Y-%m-%d')
    diff = (d_next - d_ref).days
    if diff < 0:
        return 'Quá hạn'
    if diff <= 2:
        return 'Tới hạn'
    if diff <= 7:
        return 'Sắp tới'
    return 'Đúng hạn'

def get_technical_maintenance_desc(code, name, specs, system):
    code_up = code.upper()
    name_up = name.upper()
    sys_up = system.upper()

    if 'CH-01' in code_up or 'CH-02' in code_up or 'CH-03' in code_up:
        return f"Bảo dưỡng định kỳ {name}: Vệ sinh giàn ngưng tụ Condenser bằng hóa chất sinh học tẩy cặn, đo điện trở cách điện máy nén ly tâm Megger > 50MΩ, kiểm tra áp suất dầu bôi trơn 4.2 bar, cân chỉnh van tiết lưu điện tử EXV. Châm thêm dầu York Oil K."
    if 'PAU' in code_up or 'AHU' in code_up or 'FCU' in code_up:
        return f"Bảo dưỡng định kỳ {name}: Vệ sinh dàn coil làm lạnh, kiểm tra bẫy nước ngưng U-trap, giặt rửa lưới lọc sơ cấp G4 và thay lọc túi F8, cân chỉnh độ căng dây đai curoa và bôi trơn gối đỡ quạt."
    if 'CLWP' in code_up or 'CHWP' in code_up or 'BƠM' in name_up or 'PUMP' in code_up:
        if 'FFA' in code_up:
            return f"Chạy thử tải định kỳ {name}: Khởi động tự động bơm Diesel áp lực 9.5 bar đạt yêu cầu, kiểm tra bình ắc quy đề 24VDC, xả nước thử nghiệm van tràn deluge valve."
        return f"Bảo dưỡng định kỳ {name}: Đo độ rung động cơ và bạc đạn, kiểm tra phốt cơ khí Mechanical Seal không rò rỉ, siết chặt bulong mặt bích và chân đế cao su chống rung."
    if 'CT-' in code_up or 'THÁP GIẢI NHIỆT' in name_up:
        return f"Bảo dưỡng định kỳ {name}: Vệ sinh đáy bể tháp, tẩy rong rêu cáu cặn, kiểm tra béc phun nước phân phối, tra mỡ chịu nước gối đỡ quạt tháp giải nhiệt."
    if 'GA90' in code_up or 'GA75' in code_up or 'MÁY NÉN KHÍ' in name_up:
        return f"Bảo dưỡng định kỳ {name}: Thay lọc gió, lọc dầu và dầu tổng hợp Atlas Copco Roto Inject Fluid. Vệ sinh két làm mát dầu, kiểm tra van điện từ nạp tải và van áp suất tối thiểu."
    if 'NPG' in code_up or 'NITO' in name_up or 'NITƠ' in name_up:
        return f"Bảo dưỡng định kỳ {name}: Kiểm tra van đảo chiều tháp hấp phụ Carbon Molecular Sieve, đo độ tinh khiết khí Nitơ đạt 99.99%, kiểm tra áp suất bình chứa đạt 6.8 bar."
    if 'AD300' in code_up or 'FD220' in code_up or 'SẤY' in name_up:
        return f"Bảo dưỡng định kỳ {name}: Kiểm tra điểm sương Dewpoint đạt chuẩn, xả nước ngưng tự động qua van timer drain, kiểm tra hạt hút ẩm Alumina và quạt giải nhiệt."
    if 'AIR-T' in code_up or 'BÌNH TÍCH' in name_up:
        return f"Kiểm tra định kỳ {name}: Xả đáy bồn tách nước ngưng, kiểm tra van an toàn áp lực và đồng hồ áp suất, kiểm định độ dày thân bồn bằng siêu âm."
    if 'MV' in code_up or 'TRUNG THẾ' in name_up or 'BIẾN ÁP' in name_up:
        return f"Bảo dưỡng định kỳ {name}: Thí nghiệm đo điện trở cách điện cuộn dây máy biến áp 22/0.4kV, thử nghiệm dầu cách điện độ bền điện môi 58kV, vệ sinh đầu cáp ngầm trung thế."
    if 'MSB' in code_up or 'TỦ ĐIỆN' in name_up:
        return f"Bảo dưỡng định kỳ {name}: Hút bụi buồng dập hồ quang máy cắt không khí ACB, quét camera nhiệt FLIR thanh cái đồng Busbar (nhiệt độ an toàn), kiểm tra bộ điều khiển tụ bù cosφ."
    if 'GE' in code_up or 'MÁY PHÁT' in name_up:
        return f"Chạy thử tải định kỳ {name}: Khởi động tự động ATS chuyển đổi nguồn trong 8 giây, đo điện áp phát 380V tần số 50Hz, kiểm tra mức dầu bôi trơn và ắc quy đề 24VDC."
    if 'SOLAR' in code_up or 'SOLAR' in name_up:
        return f"Bảo dưỡng định kỳ {name}: Kiểm tra dàn Inverter, siết ốc cầu đấu DC MC4, vệ sinh bề mặt tấm pin năng lượng mặt trời, đo điện trở cách điện giàn pin."
    if 'FA' in code_up or 'BÁO CHÁY' in name_up:
        return f"Kiểm tra định kỳ {name}: Thử nghiệm các đầu báo khói loop 1-6, kiểm tra chuông còi báo động, đo điện áp nguồn dự phòng ắc quy 24VDC đạt 27.2V Float Charge."
    if 'FM200' in code_up or 'F200' in code_up or 'CHỮA CHÁY KHÍ' in name_up:
        return f"Kiểm tra định kỳ {name}: Đo áp kế bình đạt 42 bar (vạch xanh an toàn), kiểm tra công tắc xả khí khẩn cấp Manual Release và cuộn kích hoạt van Solenoid."
    if 'WW' in code_up or 'NƯỚC THẢI' in name_up:
        return f"Bảo dưỡng định kỳ {name}: Kiểm tra bơm định lượng PAC/Polymer, đo nồng độ DO bể hiếu khí 2.8 mg/L, vệ sinh đầu dò pH/COD/TSS và kiểm tra máy ép bùn."
    if 'DI' in code_up or 'DRINKING' in name_up or 'NƯỚC DI' in name_up:
        return f"Bảo dưỡng định kỳ {name}: Hoàn nguyên hạt nhựa trao đổi ion Mixed Bed Purolite, súc rửa màng RO Dow Filmtec bằng hóa chất tẩy cặn, đo điện trở suất nước đạt chuẩn."
    if 'INLIG' in code_up or 'OULIG' in code_up or 'CHIẾU SÁNG' in name_up or 'ĐÈN' in name_up:
        return f"Kiểm tra định kỳ {name}: Đo độ rọi quang thông, kiểm tra nguồn LED Driver, thay thế bóng đèn hư hỏng, siết chặt các hộp đấu dây điện chiếu sáng."
    if 'FLP' in code_up or 'NGẬP' in name_up:
        return f"Bảo dưỡng định kỳ {name}: Kéo bơm chìm vệ sinh cánh khuấy rác, kiểm tra phao cảm biến mức nước tự động bật/tắt, đo dòng động cơ khi bơm hoạt động."
    if 'CCTV' in code_up or 'CAMERA' in name_up:
        return f"Bảo dưỡng định kỳ {name}: Lau sạch ống kính camera quan sát, kiểm tra kết nối Switch PoE, kiểm tra dung lượng ổ cứng đầu ghi NVR 32 kênh."
    
    return f"Kiểm tra & bảo dưỡng định kỳ {name} ({code}): Vệ sinh thiết bị, bôi trơn các cơ cấu truyền động, siết chặt bu lông và kiểm tra an toàn điện vận hành O&M."

def get_downtime_minutes(code, name):
    code_up = code.upper()
    if any(k in code_up for k in ['CH-01', 'CH-02', 'ELC-MV', 'GA90']):
        return 180
    if any(k in code_up for k in ['GA75', 'MSB', 'PAU', 'CT-', 'WW', 'DI']):
        return 90
    if any(k in code_up for k in ['AHU', 'CLWP', 'CHWP', 'AD300', 'GE']):
        return 60
    if any(k in code_up for k in ['FFA-PUMP', 'NPG', 'FD220']):
        return 30
    return 0

def get_estimated_cost(code, name):
    code_up = code.upper()
    if 'ELC-MV' in code_up:
        return 15000000
    if 'CMP-GA90' in code_up:
        return 10500000
    if 'HVAC-CH-01' in code_up:
        return 8200000
    if 'ELC-MSB' in code_up:
        return 6500000
    if 'WAT-DI' in code_up:
        return 4200000
    if 'HVAC-AHU-CT' in code_up:
        return 3600000
    if 'WAT-WW' in code_up:
        return 3200000
    if 'ELC-GE' in code_up:
        return 2800000
    if 'HVAC-CH-02' in code_up:
        return 2500000
    if 'CMP-NPG' in code_up:
        return 2100000
    if 'HVAC-CH-03' in code_up:
        return 1800000
    if 'HVAC-AHU' in code_up:
        return 1500000
    if 'HVAC-PAU' in code_up:
        return 1450000
    if 'HVAC-CLWP' in code_up or 'HVAC-CHWP' in code_up:
        return 1200000
    if 'FFA' in code_up:
        return 1500000
    if 'LIG' in code_up:
        return 1200000
    return 800000

equipment_list = []
maintenance_history = []
plans_list = []

for idx, r in enumerate(raw_rows):
    code = r[0].strip()
    name = r[1].strip()
    specs = r[2].strip()
    raw_sys = r[3].strip() if len(r) > 3 else ''
    raw_loc = r[4].strip() if len(r) > 4 else ''
    raw_risk = r[5].strip() if len(r) > 5 else ''
    raw_status = r[6].strip() if len(r) > 6 else ''
    raw_freq = r[7].strip() if len(r) > 7 else ''
    raw_person = r[8].strip() if len(r) > 8 else ''
    raw_email = r[9].strip() if len(r) > 9 else ''
    raw_qr = r[10].strip() if len(r) > 10 else ''
    raw_img = r[12].strip() if len(r) > 12 else ''

    system = normalize_system(raw_sys)
    location = raw_loc if raw_loc else ('Utility House' if 'Lạnh' in system or 'nén' in system else 'Factory')
    risk = determine_risk(code, name, system, raw_risk)
    freq = determine_freq(code, system, raw_freq)
    status = determine_status(code, raw_status)
    person, email = normalize_person(raw_person, system)
    if raw_email and '@' in raw_email:
        email = raw_email

    last_date, next_date = generate_dates(idx, freq)
    plan_status = get_plan_status(next_date)

    install_year = 2021 + (idx % 4)
    install_month = (idx % 12) + 1
    ngay_lap_dat = f"{install_year}-{install_month:02d}-15"

    qr_code = raw_qr if (raw_qr and raw_qr.startswith('http')) else f"https://api.qrserver.com/v1/create-qr-code/?size=250x250&data={code}"

    equip_obj = {
        "maThietBi": code,
        "tenThietBi": name,
        "heThong": system,
        "viTri": location,
        "mucDoRuiRo": risk,
        "trangThai": status,
        "tanSuat": freq,
        "hanBaoTriTiepTheo": next_date,
        "nguoiPhuTrach": person,
        "email": email,
        "thongSoKyThuat": specs,
        "hinhAnh": raw_img if raw_img else "",
        "qrCode": qr_code,
        "ngayLapDat": ngay_lap_dat
    }
    equipment_list.append(equip_obj)

    # 1. Create maintenance history record for THIS machine
    # ID format: HIS-YYYYMMDD-CODE
    clean_code = code.replace('-', '')
    clean_date = last_date.replace('-', '')
    hist_id = f"HIS-{clean_date}-{clean_code}"
    
    desc = get_technical_maintenance_desc(code, name, specs, system)
    downtime = get_downtime_minutes(code, name)
    cost = get_estimated_cost(code, name)
    result = "Cần theo dõi" if 'GA90-02' in code else "Đạt"

    hist_obj = {
        "id": hist_id,
        "maThietBi": code,
        "tenThietBi": name,
        "ngayThucHien": last_date,
        "nguoiThucHien": person,
        "moTaCongViec": desc,
        "thoiGianDungMay": downtime,
        "ketQua": result,
        "hinhAnh": raw_img if raw_img else "",
        "nguoiLapBaoCao": person,
        "chiPhiUocTinh": cost
    }
    maintenance_history.append(hist_obj)

    # 2. Create plan record - DERIVED DIRECTLY FROM HISTORY
    plan_obj = {
        "id": f"PLAN-{idx+1:03d}",
        "maThietBi": code,
        "tenThietBi": name,
        "loaiBaoTri": "Định kỳ",
        "tanSuat": freq,
        "ngayBaoTriGanNhat": last_date, # Exactly matches maintenance_history!
        "ngayBaoTriTiepTheo": next_date, # Calculated from last_date + freq!
        "nguoiPhuTrach": person,
        "trangThai": plan_status,
        "ghiChu": f"Kiểm tra và bảo trì định kỳ O&M tiêu chuẩn cho {name} ({code})"
    }
    plans_list.append(plan_obj)

# Add 12 earlier multi-cycle historical records for primary critical equipment
multi_cycle_history = [
    {
        "id": "HIS-20260904-HVACCH01",
        "maThietBi": "HVAC-CH-01",
        "tenThietBi": "Chiller 01",
        "ngayThucHien": "2026-09-04",
        "nguoiThucHien": "Khiêm Huỳnh",
        "moTaCongViec": "Bảo dưỡng định kỳ tháng 9: Kiểm tra van bypass khí nóng, đo dòng khởi động máy nén ly tâm 420A qua biến tần, kiểm tra áp suất bay hơi 3.1 bar, vệ sinh cảm biến nhiệt độ nước lạnh vào/ra.",
        "thoiGianDungMay": 120,
        "ketQua": "Đạt",
        "hinhAnh": "https://drive.google.com/thumbnail?id=1BClKVnAj1bd9yvWVJMuYSamLlPSCt-nj&sz=w1000",
        "nguoiLapBaoCao": "Khiêm Huỳnh",
        "chiPhiUocTinh": 2500000
    },
    {
        "id": "HIS-20260920-HVACCH02",
        "maThietBi": "HVAC-CH-02",
        "tenThietBi": "Chiller 02",
        "ngayThucHien": "2026-09-20",
        "nguoiThucHien": "Khiêm Huỳnh",
        "moTaCongViec": "Bảo dưỡng định kỳ tháng 9: Vệ sinh bộ lọc đường hút môi chất lạnh, kiểm tra hiển thị màn hình OptiView Control Center, thử nghiệm bảo vệ chống đông giàn bay hơi Freezestat.",
        "thoiGianDungMay": 90,
        "ketQua": "Đạt",
        "hinhAnh": "https://drive.google.com/thumbnail?id=1LgEHWiRpQBJy7UZ41E1TtowYr-cGdiR7&sz=w1000",
        "nguoiLapBaoCao": "Khiêm Huỳnh",
        "chiPhiUocTinh": 2200000
    },
    {
        "id": "HIS-20260913-CMPGA9001",
        "maThietBi": "CMP-GA90-01",
        "tenThietBi": "Máy nén khí GA90-1",
        "ngayThucHien": "2026-09-13",
        "nguoiThucHien": "Nguyễn Văn Hùng",
        "moTaCongViec": "Kiểm tra định kỳ tháng 9: Đo nhiệt độ đầu nén 86°C, kiểm tra độ chênh áp lọc tách dầu 0.2 bar (bình thường), siết lại các giắc cắm cảm biến nhiệt áp suất Elektronikon.",
        "thoiGianDungMay": 45,
        "ketQua": "Đạt",
        "hinhAnh": "https://drive.google.com/thumbnail?id=14-nlmxcsATcUYB1kCQW6e-Z4E6v-9y9c&sz=w1000",
        "nguoiLapBaoCao": "Nguyễn Văn Hùng",
        "chiPhiUocTinh": 1200000
    },
    {
        "id": "HIS-20260914-CMPGA7501",
        "maThietBi": "CMP-GA75-01",
        "tenThietBi": "Máy nén khí GA75-1",
        "ngayThucHien": "2026-09-14",
        "nguoiThucHien": "Nguyễn Văn Hùng",
        "moTaCongViec": "Bảo dưỡng định kỳ tháng 9: Vệ sinh két làm mát giải nhiệt gió bằng súng xịt khí nén, kiểm tra van xả nước ngưng điện tử, bôi trơn bạc đạn động cơ 75kW.",
        "thoiGianDungMay": 60,
        "ketQua": "Đạt",
        "hinhAnh": "https://drive.google.com/thumbnail?id=17npHMfMCe4OaDO-S_tx43hI52kYp0iM4&sz=w1000",
        "nguoiLapBaoCao": "Nguyễn Văn Hùng",
        "chiPhiUocTinh": 1100000
    },
    {
        "id": "HIS-20260925-ELCMV01",
        "maThietBi": "ELC-MV-01",
        "tenThietBi": "Trạm trung thế 1",
        "ngayThucHien": "2026-07-25",
        "nguoiThucHien": "Phạm Đức Cường",
        "moTaCongViec": "Thí nghiệm định kỳ quý 3: Kiểm tra hành trình đóng cắt máy cắt chân không VCB 24kV, đo tỷ số biến áp và tổ đấu dây Dyn11, kiểm tra điện trở nối đất tiếp địa trạm Rđ < 4Ω.",
        "thoiGianDungMay": 240,
        "ketQua": "Đạt",
        "hinhAnh": "",
        "nguoiLapBaoCao": "Phạm Đức Cường",
        "chiPhiUocTinh": 12000000
    },
    {
        "id": "HIS-20260926-ELCMSB01",
        "maThietBi": "ELC-MSB-01",
        "tenThietBi": "Tủ điện MSB 01",
        "ngayThucHien": "2026-09-26",
        "nguoiThucHien": "Phạm Đức Cường",
        "moTaCongViec": "Kiểm tra định kỳ tháng 9: Siết lại các đầu cosse lực cáp động lực, kiểm tra hoạt động đóng ngắt rơle bảo vệ dòng cực đại quá tải và chạm đất Sepam Schneider.",
        "thoiGianDungMay": 60,
        "ketQua": "Đạt",
        "hinhAnh": "",
        "nguoiLapBaoCao": "Phạm Đức Cường",
        "chiPhiUocTinh": 2500000
    },
    {
        "id": "HIS-20261005-ELCGE01",
        "maThietBi": "ELC-GE-01",
        "tenThietBi": "Máy phát điện",
        "ngayThucHien": "2026-10-05",
        "nguoiThucHien": "Phạm Đức Cường",
        "moTaCongViec": "Chạy thử tải định kỳ tháng 10: Vận hành không tải 20 phút, kiểm tra áp lực dầu bôi trơn 5.2 bar, nhiệt độ nước làm mát 82°C, sạc bổ sung bình ắc quy đề 24VDC.",
        "thoiGianDungMay": 30,
        "ketQua": "Đạt",
        "hinhAnh": "",
        "nguoiLapBaoCao": "Phạm Đức Cường",
        "chiPhiUocTinh": 1500000
    },
    {
        "id": "HIS-20261002-WATWW",
        "maThietBi": "WAT-WW",
        "tenThietBi": "Hệ thống xử lý nước thải",
        "ngayThucHien": "2026-10-02",
        "nguoiThucHien": "Trần Minh Tuấn",
        "moTaCongViec": "Bảo dưỡng định kỳ tháng 10: Vệ sinh máy sục khí chìm bể điều hòa, hiệu chuẩn sensor đo lưu lượng siêu âm kênh hở Parshall Flume, châm bổ sung men vi sinh bể Aerotank.",
        "thoiGianDungMay": 60,
        "ketQua": "Đạt",
        "hinhAnh": "",
        "nguoiLapBaoCao": "Trần Minh Tuấn",
        "chiPhiUocTinh": 2800000
    },
    {
        "id": "HIS-20261003-WATDI",
        "maThietBi": "WAT-DI",
        "tenThietBi": "Hệ thống nước DI",
        "ngayThucHien": "2026-10-03",
        "nguoiThucHien": "Trần Minh Tuấn",
        "moTaCongViec": "Bảo dưỡng định kỳ tháng 10: Rửa ngược cột lọc cát thạch anh và than hoạt tính, châm muối NaCl tái sinh cột làm mềm Cation, kiểm tra áp suất bơm trục đứng Grundfos.",
        "thoiGianDungMay": 90,
        "ketQua": "Đạt",
        "hinhAnh": "",
        "nguoiLapBaoCao": "Trần Minh Tuấn",
        "chiPhiUocTinh": 3100000
    },
    {
        "id": "HIS-20260910-FFAFA",
        "maThietBi": "FFA-FA",
        "tenThietBi": "Hệ thống báo cháy trung tâm",
        "ngayThucHien": "2026-09-10",
        "nguoiThucHien": "Trần Minh Tuấn",
        "moTaCongViec": "Kiểm tra định kỳ tháng 9: Thử nghiệm 10 nút ấn báo cháy khẩn cấp Manual Call Point, kiểm tra module điều khiển liên động ngắt quạt hút khói và đóng cửa chống cháy.",
        "thoiGianDungMay": 0,
        "ketQua": "Đạt",
        "hinhAnh": "https://drive.google.com/thumbnail?id=1WMqj-YnjqklnhokI2Tsa21l1M40h815s&sz=w1000",
        "nguoiLapBaoCao": "Trần Minh Tuấn",
        "chiPhiUocTinh": 1400000
    },
    {
        "id": "HIS-20261023-FFAPUMP",
        "maThietBi": "FFA-PUMP",
        "tenThietBi": "Trạm bơm nước chữa cháy",
        "ngayThucHien": "2026-10-23",
        "nguoiThucHien": "Trần Minh Tuấn",
        "moTaCongViec": "Chạy thử tuần 4 tháng 10: Thử nghiệm bơm điện 132kW khởi động sao tam giác ổn định, kiểm tra tiếp điểm công tắc áp suất Pressure Switch và van xả áp suất hồi lưu.",
        "thoiGianDungMay": 20,
        "ketQua": "Đạt",
        "hinhAnh": "",
        "nguoiLapBaoCao": "Trần Minh Tuấn",
        "chiPhiUocTinh": 800000
    },
    {
        "id": "HIS-20260920-INFINLIG",
        "maThietBi": "INF-INLIG",
        "tenThietBi": "Hệ thống đèn chiếu sáng bên trong xưởng",
        "ngayThucHien": "2026-08-20",
        "nguoiThucHien": "Phạm Đức Cường",
        "moTaCongViec": "Bảo dưỡng định kỳ quý 3: Vệ sinh chao đèn chống bụi line A và B, đo kiểm điện áp cấp tủ chiếu sáng 220V ổn định, thay 2 bộ chấn lưu nguồn LED Philips.",
        "thoiGianDungMay": 0,
        "ketQua": "Đạt",
        "hinhAnh": "",
        "nguoiLapBaoCao": "Phạm Đức Cường",
        "chiPhiUocTinh": 2400000
    }
]

# Append multi-cycle history
maintenance_history.extend(multi_cycle_history)

# Sort maintenance history by ngayThucHien descending so latest entries come first
maintenance_history.sort(key=lambda x: x["ngayThucHien"], reverse=True)

# Tickets - 8 Realistic Factory Requests
tickets_list = [
    {
        "maTicket": "TK-2026-1101",
        "tieuDe": "Máy nén khí GA90-2 rung giật và báo nhiệt độ đầu nén cao > 105°C",
        "trangThai": "Đang xử lý",
        "ngayTao": "2026-11-08",
        "moTaChiTiet": "Máy nén khí Atlas Copco GA90-2 tại Utility House đang bị lỗi quá nhiệt đầu nén (Element Temp High > 105°C), quạt làm mát dầu giải nhiệt kém và có tiếng kêu rung lạ. Đã cho tạm dừng máy chuyển tải sang máy GA90-1 để kiểm tra cụm két làm mát dầu và van bypass nhiệt.",
        "nguoiPhuTrach": "Khiêm Huỳnh",
        "nguoiLap": "Nguyễn Văn Hùng (Bộ phận Vận hành)",
        "mucDoUuTien": "Khẩn cấp",
        "maThietBi": "CMP-GA90-02",
        "anhTruocXuLy": "https://drive.google.com/thumbnail?id=1F6D-TYiTewws-oQ_v1t6-hFkZzW2T72c&sz=w1000",
        "anhSauXuLy": ""
    },
    {
        "maTicket": "TK-2026-1102",
        "tieuDe": "Rò rỉ nước tại mặt bích bơm nước giải nhiệt CLWP-01",
        "trangThai": "Mới tiếp nhận",
        "ngayTao": "2026-11-09",
        "moTaChiTiet": "Phát hiện nhỏ giọt nước làm mát tại gioăng cao su mặt bích DN200 đầu đẩy bơm nước giải nhiệt CLWP-01, áp lực đường ống giảm nhẹ 0.3 bar. Cần thay thế ron cao su chịu nhiệt EPDM và siết lại bulong inox.",
        "nguoiPhuTrach": "Trần Minh Tuấn",
        "nguoiLap": "Phạm Đức Cường",
        "mucDoUuTien": "Cao",
        "maThietBi": "HVAC-CLWP-01",
        "anhTruocXuLy": "https://drive.google.com/thumbnail?id=1dG8cTl71rql1og-awoHRaT1cZ4Y2ZtX6&sz=w1000",
        "anhSauXuLy": ""
    },
    {
        "maTicket": "TK-2026-1103",
        "tieuDe": "FCU phòng họp Cobollaration tầng trệt bị tắc đường ống nước ngưng",
        "trangThai": "Mới tiếp nhận",
        "ngayTao": "2026-11-10",
        "moTaChiTiet": "FCU văn phòng tràn nước ngưng ra tấm thạch cao trần phòng họp Cobollaration. Cần thông tắc bẫy nước ngưng P-trap và súc rửa máng hứng nước ngưng.",
        "nguoiPhuTrach": "Khiêm Huỳnh",
        "nguoiLap": "Trần Thị Mai (Hành chính văn phòng)",
        "mucDoUuTien": "Trung bình",
        "maThietBi": "HVAC-FCU-FL1",
        "anhTruocXuLy": "",
        "anhSauXuLy": ""
    },
    {
        "maTicket": "TK-2026-1104",
        "tieuDe": "Bơm chống ngập INF-FLP kẹt phao tự động báo mức tại hố thu",
        "trangThai": "Đang xử lý",
        "ngayTao": "2026-11-07",
        "moTaChiTiet": "Hệ thống bơm chìm chống ngập tầng hầm không tự ngắt khi cạn nước do kẹt rác tại quả phao cảm biến mức nước. Cần vệ sinh hố bơm và thay phao chống nghẹt.",
        "nguoiPhuTrach": "Phạm Đức Cường",
        "nguoiLap": "Hoàng Văn Nam",
        "mucDoUuTien": "Cao",
        "maThietBi": "INF-FLP",
        "anhTruocXuLy": "",
        "anhSauXuLy": ""
    },
    {
        "maTicket": "TK-2026-1105",
        "tieuDe": "Áp suất đường ống khí nén khu vực đóng gói giảm nhẹ dưới 5.8 bar",
        "trangThai": "Đang xử lý",
        "ngayTao": "2026-11-10",
        "moTaChiTiet": "Tổ trưởng line đóng gói phản ánh áp suất khí nén tụt nhẹ giờ cao điểm. Kiểm tra van điều áp và bộ lọc khí đầu nguồn line sản xuất số 3.",
        "nguoiPhuTrach": "Nguyễn Văn Hùng",
        "nguoiLap": "Vũ Văn Thắng (Xưởng Sản Xuất)",
        "mucDoUuTien": "Trung bình",
        "maThietBi": "CMP-AIR-T",
        "anhTruocXuLy": "",
        "anhSauXuLy": ""
    },
    {
        "maTicket": "TK-2026-1106",
        "tieuDe": "Đèn High Bay khu vực bốc dỡ hàng xuất kho chập chờn",
        "trangThai": "Hoàn thành",
        "ngayTao": "2026-11-05",
        "moTaChiTiet": "Đèn Highbay vị trí cửa cuốn số 2 nhấp nháy liên tục ảnh hưởng ca làm việc đêm xe nâng bốc dỡ.",
        "nguoiPhuTrach": "Phạm Đức Cường",
        "nguoiLap": "Lê Thanh Tùng",
        "ngayHoanThanh": "2026-11-06",
        "ketQua": "Đã thay mới bộ đèn LED Philips High Bay 150W, hệ thống chiếu sáng hoạt động ổn định.",
        "mucDoUuTien": "Thấp",
        "maThietBi": "INF-INLIG",
        "anhTruocXuLy": "",
        "anhSauXuLy": ""
    },
    {
        "maTicket": "TK-2026-1088",
        "tieuDe": "Bảo dưỡng buồng khử ẩm và vệ sinh túi lọc AHU Coating",
        "trangThai": "Hoàn thành",
        "ngayTao": "2026-10-28",
        "moTaChiTiet": "Bảo dưỡng định kỳ hệ thống AHU phòng phủ Coating: Thay thế tấm lọc tinh F8 và kiểm tra cảm biến chênh áp phòng sạch theo tiêu chuẩn ISO Class 7.",
        "nguoiPhuTrach": "Khiêm Huỳnh",
        "nguoiLap": "Khiêm Huỳnh",
        "ngayHoanThanh": "2026-10-30",
        "ketQua": "Đã hoàn thành thay mới 6 tấm lọc F8, chênh áp phòng sạch ổn định ở mức +25Pa.",
        "mucDoUuTien": "Cao",
        "maThietBi": "HVAC-AHU-CT",
        "anhTruocXuLy": "https://drive.google.com/thumbnail?id=1JKINS3upC9A_Ai22f6TOaqB937f1X_kF&sz=w1000",
        "anhSauXuLy": "https://drive.google.com/thumbnail?id=1JKINS3upC9A_Ai22f6TOaqB937f1X_kF&sz=w1000"
    },
    {
        "maTicket": "TK-2026-1075",
        "tieuDe": "Kiểm tra đầu phun chữa cháy Spinkler tầng lửng kho rác thải",
        "trangThai": "Hoàn thành",
        "ngayTao": "2026-10-18",
        "moTaChiTiet": "Kiểm tra và siết lại van nhánh phòng cháy chữa cháy khu vực kho rác nguy hại.",
        "nguoiPhuTrach": "Trần Minh Tuấn",
        "nguoiLap": "Nguyễn Văn Hùng",
        "ngayHoanThanh": "2026-10-19",
        "ketQua": "Hoàn tất kiểm tra, hệ thống Spinkler kín khí áp suất 8.5 bar không rò rỉ.",
        "mucDoUuTien": "Trung bình",
        "maThietBi": "FFA-FF",
        "anhTruocXuLy": "",
        "anhSauXuLy": ""
    }
]

# Comprehensive Spare Parts Inventory - 22 Items
spare_parts = [
    {
        "maVatTu": "SP-OIL-CHILLER",
        "tenVatTu": "Dầu máy nén Chiller York K Oil",
        "thongSo": "York Oil K Part 011-00533-000 | Can 5 Gallon (18.9L)",
        "maThietBi": "HVAC-CH-01",
        "tenThietBiSuDung": "Chiller 01 & Chiller 02",
        "tonToiThieu": 2,
        "tonThucTe": 4,
        "donViTinh": "Can",
        "viTriLuu": "Kệ A2 - Kho Dầu Lạnh Utility",
        "ghiChu": "Chuyên dùng cho máy nén ly tâm York YK môi chất R134a",
        "donGia": 7600000
    },
    {
        "maVatTu": "SP-GAS-R134A",
        "tenVatTu": "Gas lạnh Chemours Suva R134a",
        "thongSo": "Bình 13.62 kg | Độ tinh khiết 99.98% chính hãng USA",
        "maThietBi": "HVAC-CH-01",
        "tenThietBiSuDung": "Chiller 01, Chiller 02, Mini Chiller, Máy sấy khí",
        "tonToiThieu": 5,
        "tonThucTe": 8,
        "donViTinh": "Bình",
        "viTriLuu": "Khu Gas Lạnh - Kho Vật Tư",
        "ghiChu": "Có chứng nhận CO/CQ từ nhà sản xuất",
        "donGia": 2850000
    },
    {
        "maVatTu": "SP-OIL-GA90",
        "tenVatTu": "Dầu máy nén khí Atlas Copco Roto Inject Fluid",
        "thongSo": "Can 20L | Dầu gốc tổng hợp chuyên dụng cho GA90/GA75",
        "maThietBi": "CMP-GA90-01",
        "tenThietBiSuDung": "Máy nén khí GA90-1 & GA90-2, GA75-1, GA75-2",
        "tonToiThieu": 4,
        "tonThucTe": 3,
        "donViTinh": "Can 20L",
        "viTriLuu": "Kệ A1 - Kho Dầu Utility",
        "ghiChu": "Đang dưới mức tồn tối thiểu! Cần đặt hàng đợt bảo dưỡng 8000h",
        "donGia": 3850000
    },
    {
        "maVatTu": "SP-FILT-AIR-GA90",
        "tenVatTu": "Lọc gió máy nén khí Atlas Copco",
        "thongSo": "Part No: 1622185501 | Cấp lọc 99.9% hạt bụi 3 micron",
        "maThietBi": "CMP-GA90-01",
        "tenThietBiSuDung": "Máy nén khí GA90-1 & GA90-2",
        "tonToiThieu": 4,
        "tonThucTe": 6,
        "donViTinh": "Cái",
        "viTriLuu": "Kệ B2 - Kho Phụ Tùng",
        "ghiChu": "Chính hãng Atlas Copco",
        "donGia": 2450000
    },
    {
        "maVatTu": "SP-FILT-SEP-GA90",
        "tenVatTu": "Lọc tách dầu máy nén khí Atlas Copco",
        "thongSo": "Part No: 1622569300 | Giữ dầu dưới 3 ppm trong khí nén",
        "maThietBi": "CMP-GA90-01",
        "tenThietBiSuDung": "Máy nén khí GA90-1 & GA90-2",
        "tonToiThieu": 2,
        "tonThucTe": 2,
        "donViTinh": "Cái",
        "viTriLuu": "Kệ B2 - Kho Phụ Tùng",
        "ghiChu": "Thay định kỳ mỗi 4000 giờ chạy máy",
        "donGia": 4650000
    },
    {
        "maVatTu": "SP-DESICCANT-AD300",
        "tenVatTu": "Hạt hút ẩm Alumina hoạt tính Activated Alumina",
        "thongSo": "Bao 25 kg | Kích thước hạt 3-5mm, điểm sương -40°C",
        "maThietBi": "CMP-AD300-01",
        "tenThietBiSuDung": "Máy sấy khí hấp thụ AD300-1 & AD300-2",
        "tonToiThieu": 6,
        "tonThucTe": 10,
        "donViTinh": "Bao 25kg",
        "viTriLuu": "Kệ C1 - Kho Hóa Chất Khô",
        "ghiChu": "Thay thế hạt ẩm sau 2 năm vận hành",
        "donGia": 1650000
    },
    {
        "maVatTu": "SP-BELT-SPC2360",
        "tenVatTu": "Dây curoa quạt AHU Optibelt SPC 2360",
        "thongSo": "Bản rộng 22mm, chiều cao 18mm, chiều dài 2360mm",
        "maThietBi": "HVAC-AHU-01",
        "tenThietBiSuDung": "AHU 01 đến AHU 06",
        "tonToiThieu": 6,
        "tonThucTe": 4,
        "donViTinh": "Sợi",
        "viTriLuu": "Kệ D1 - Kho Phụ Tùng Cơ Điện",
        "ghiChu": "Dưới mức tồn an toàn (4/6 sợi)",
        "donGia": 580000
    },
    {
        "maVatTu": "SP-FILT-G4-AHU",
        "tenVatTu": "Tấm lọc sơ cấp Pre-filter G4 khung nhôm",
        "thongSo": "Kích thước 595x595x46mm | Hiệu suất lọc EN779 G4 90%",
        "maThietBi": "HVAC-AHU-01",
        "tenThietBiSuDung": "AHU 01 - AHU 06, PAU 01 - PAU 02",
        "tonToiThieu": 20,
        "tonThucTe": 35,
        "donViTinh": "Tấm",
        "viTriLuu": "Kệ E1 - Kho Lọc Phòng Sạch",
        "ghiChu": "Vệ sinh xịt khí nén 2 lần trước khi thay mới",
        "donGia": 185000
    },
    {
        "maVatTu": "SP-FILT-F8-AHU",
        "tenVatTu": "Túi lọc tinh Medium Filter F8 sợi tổng hợp",
        "thongSo": "Kích thước 595x595x600mm 6 túi | Tiêu chuẩn EN779 F8",
        "maThietBi": "HVAC-AHU-CT",
        "tenThietBiSuDung": "AHU Coating, AHU IQC, AHU FIN",
        "tonToiThieu": 10,
        "tonThucTe": 14,
        "donViTinh": "Cái",
        "viTriLuu": "Kệ E1 - Kho Lọc Phòng Sạch",
        "ghiChu": "Dùng cho khu vực phòng sạch yêu cầu cao",
        "donGia": 520000
    },
    {
        "maVatTu": "SP-SEAL-PUMP-DN200",
        "tenVatTu": "Phốt cơ khí máy bơm nước Ebara Mechanical Seal",
        "thongSo": "Trục Ø65mm | Vật liệu SiC/SiC/Viton chịu nhiệt 120°C",
        "maThietBi": "HVAC-CLWP-01",
        "tenThietBiSuDung": "Bơm giải nhiệt CLWP 01-03, Bơm nước lạnh CHWP 01-03",
        "tonToiThieu": 3,
        "tonThucTe": 2,
        "donViTinh": "Bộ",
        "viTriLuu": "Tủ linh kiện chính xác P1",
        "ghiChu": "Đang dưới mức tồn tối thiểu (2/3 bộ)",
        "donGia": 3200000
    },
    {
        "maVatTu": "SP-BEARING-SKF-6316",
        "tenVatTu": "Bạc đạn cầu SKF Explorer 6316-2Z/C3",
        "thongSo": "Đường kính trong 80mm, ngoài 170mm, dày 39mm, nắp chặn sắt",
        "maThietBi": "HVAC-CLWP-01",
        "tenThietBiSuDung": "Động cơ máy bơm và quạt công nghiệp",
        "tonToiThieu": 4,
        "tonThucTe": 6,
        "donViTinh": "Cái",
        "viTriLuu": "Kệ D2 - Kho Vòng Bi Bạc Đạn",
        "ghiChu": "Chính hãng SKF Thụy Điển",
        "donGia": 1850000
    },
    {
        "maVatTu": "SP-LED-HIGHBAY-150W",
        "tenVatTu": "Đèn LED High Bay 150W Philips IP65",
        "thongSo": "Ánh sáng trắng 6500K | Quang thông 21.000 lm | Điện áp 220V",
        "maThietBi": "INF-INLIG",
        "tenThietBiSuDung": "Hệ thống đèn chiếu sáng bên trong xưởng",
        "tonToiThieu": 10,
        "tonThucTe": 18,
        "donViTinh": "Bộ",
        "viTriLuu": "Kệ F2 - Kho Thiết Bị Chiếu Sáng",
        "ghiChu": "Bảo hành 3 năm chính hãng",
        "donGia": 1150000
    },
    {
        "maVatTu": "SP-SMOKE-HOCHIKI",
        "tenVatTu": "Đầu báo khói quang địa chỉ Hochiki ALN-V",
        "thongSo": "Giao thức số Hochiki DCP | Tiêu chuẩn UL/FM",
        "maThietBi": "FFA-FA",
        "tenThietBiSuDung": "Tủ báo cháy trung tâm Hochiki FireNetLatitude",
        "tonToiThieu": 5,
        "tonThucTe": 9,
        "donViTinh": "Cái",
        "viTriLuu": "Tủ PCCC - Kho Thiết Bị An Toàn",
        "ghiChu": "Kèm đế cắm YBN-NSA-4",
        "donGia": 780000
    },
    {
        "maVatTu": "SP-FM200-GAS",
        "tenVatTu": "Khí chữa cháy sạch FM200 (HFC-227ea)",
        "thongSo": "Nạp bình chữa cháy khí phòng IT Server",
        "maThietBi": "FFA-F200-1",
        "tenThietBiSuDung": "Chữa cháy khí FM200 IT",
        "tonToiThieu": 1,
        "tonThucTe": 1,
        "donViTinh": "Bình 180L",
        "viTriLuu": "Phòng IT Server",
        "ghiChu": "Kiểm tra áp suất đồng hồ mỗi tháng",
        "donGia": 42000000
    },
    {
        "maVatTu": "SP-VALVE-BELIMO",
        "tenVatTu": "Van điều khiển nước lạnh 2 ngả Belimo DN65",
        "thongSo": "Kèm Actuator 24VDC tín hiệu điều khiển 0-10V, PN16",
        "maThietBi": "HVAC-AHU-01",
        "tenThietBiSuDung": "Hệ thống van tiết lưu nước lạnh AHU / PAU",
        "tonToiThieu": 2,
        "tonThucTe": 3,
        "donViTinh": "Bộ",
        "viTriLuu": "Kệ C2 - Kho Van & Thiết Bị Đo",
        "ghiChu": "Thụy Sĩ sản xuất",
        "donGia": 8900000
    },
    {
        "maVatTu": "SP-CHEM-PAC",
        "tenVatTu": "Hóa chất keo tụ PAC 30% xử lý nước thải",
        "thongSo": "Poly Aluminium Chloride bột vàng mịn bao 25kg",
        "maThietBi": "WAT-WW",
        "tenThietBiSuDung": "Trạm xử lý nước thải WAT-WW",
        "tonToiThieu": 20,
        "tonThucTe": 28,
        "donViTinh": "Bao 25kg",
        "viTriLuu": "Kho Hóa Chất Trạm Nước Thải",
        "ghiChu": "Pha dung dịch nồng độ 5% vào bồn định lượng",
        "donGia": 380000
    },
    {
        "maVatTu": "SP-RO-MEMBRANE",
        "tenVatTu": "Màng lọc thẩm thấu ngược RO Dow Filmtec BW30-400",
        "thongSo": "Kích thước 8x40 inch | Diện tích bề mặt 400 sq.ft | USA",
        "maThietBi": "WAT-DI-01",
        "tenThietBiSuDung": "Hệ thống sản xuất nước DI - Drinking",
        "tonToiThieu": 2,
        "tonThucTe": 4,
        "donViTinh": "Cây",
        "viTriLuu": "Kệ E2 - Kho Thiết Bị Nước DI",
        "ghiChu": "Bảo quản nơi khô ráo, tránh ánh sáng trực tiếp",
        "donGia": 8500000
    },
    {
        "maVatTu": "SP-ACB-SCHNEIDER",
        "tenVatTu": "Cuộn cắt Shunt Trip MX 220VAC Schneider",
        "thongSo": "Dùng cho máy cắt không khí ACB Masterpact NW 3200A",
        "maThietBi": "ELC-MSB-01",
        "tenThietBiSuDung": "Tủ điện phân phối chính MSB 01 & MSB 02",
        "tonToiThieu": 2,
        "tonThucTe": 3,
        "donViTinh": "Cái",
        "viTriLuu": "Tủ thiết bị điện P2",
        "ghiChu": "Chính hãng Schneider Electric",
        "donGia": 4200000
    },
    {
        "maVatTu": "SP-BAT-12V100AH",
        "tenVatTu": "Bình ắc quy kín khí Vision 12V-100Ah 6FM100-X",
        "thongSo": "Ắc quy AGM VRLA 12V 100Ah dùng cho UPS, ATS và đề máy phát",
        "maThietBi": "ELC-GE-01",
        "tenThietBiSuDung": "Máy phát điện Cummins & Tủ báo cháy",
        "tonToiThieu": 4,
        "tonThucTe": 6,
        "donViTinh": "Bình",
        "viTriLuu": "Khu Ắc Quy - Kho Điện O&M",
        "ghiChu": "Tuổi thọ thiết kế 10 năm",
        "donGia": 3450000
    },
    {
        "maVatTu": "SP-DI-RESIN-MIX",
        "tenVatTu": "Hạt nhựa trao đổi ion Mixed Bed Purolite MB400",
        "thongSo": "Hạt nhựa hỗn hợp Cation/Anion tinh khiết cao bao 25L",
        "maThietBi": "WAT-DI-01",
        "tenThietBiSuDung": "Cột lọc tinh nước DI siêu sạch",
        "tonToiThieu": 4,
        "tonThucTe": 5,
        "donViTinh": "Bao 25L",
        "viTriLuu": "Kho Hóa Chất Trạm Nước DI",
        "ghiChu": "Duy trì điện trở suất nước DI > 15 MΩ.cm",
        "donGia": 2650000
    },
    {
        "maVatTu": "SP-VALVE-DN150",
        "tenVatTu": "Van bướm tay gạt tín hiệu điện PCCC DN150 PN16",
        "thongSo": "Thân gang dẻo cánh inox kèm công tắc giám sát vị trí đóng/mở",
        "maThietBi": "FFA-PUMP",
        "tenThietBiSuDung": "Hệ thống đường ống cứu hỏa nhà xưởng",
        "tonToiThieu": 2,
        "tonThucTe": 4,
        "donViTinh": "Bộ",
        "viTriLuu": "Kệ PCCC - Kho Cơ",
        "ghiChu": "Chứng chỉ UL/FM phòng cháy chữa cháy",
        "donGia": 4850000
    },
    {
        "maVatTu": "SP-INV-FUSE-30A",
        "tenVatTu": "Cầu chì DC 1500V 30A chuyên dụng Solar Mersen",
        "thongSo": "Kích thước 10x85mm | Cấp điện áp 1500VDC dòng cắt 30A",
        "maThietBi": "ELC-SOLAR-01",
        "tenThietBiSuDung": "Inverter Solar Rooftop 01 & 02",
        "tonToiThieu": 20,
        "tonThucTe": 32,
        "donViTinh": "Cái",
        "viTriLuu": "Hộp linh kiện Solar P3",
        "ghiChu": "Bảo vệ chuỗi PV Strings trên mái xưởng",
        "donGia": 165000
    }
]

# Stock Transactions - 14 Records
stock_transactions = [
    {
        "transId": "TR-2026-1001",
        "ngay": "2026-10-10",
        "loaiGD": "Xuất kho sử dụng",
        "maVatTu": "SP-OIL-GA90",
        "thietBiSuDung": "CMP-GA90-01",
        "soLuong": 2,
        "nguoiThucHien": "Nguyễn Văn Hùng",
        "ghiChu": "Xuất thay dầu định kỳ mốc 4000h máy nén khí GA90-1",
        "donGiaSnapshot": 3850000
    },
    {
        "transId": "TR-2026-1002",
        "ngay": "2026-10-12",
        "loaiGD": "Xuất kho sử dụng",
        "maVatTu": "SP-FILT-AIR-GA90",
        "thietBiSuDung": "CMP-GA90-01",
        "soLuong": 1,
        "nguoiThucHien": "Nguyễn Văn Hùng",
        "ghiChu": "Xuất thay lọc gió máy nén khí GA90-1",
        "donGiaSnapshot": 2450000
    },
    {
        "transId": "TR-2026-1015",
        "ngay": "2026-10-15",
        "loaiGD": "Nhập kho",
        "maVatTu": "SP-OIL-CHILLER",
        "thietBiSuDung": "HVAC-CH-01",
        "soLuong": 4,
        "nguoiThucHien": "Lê Thanh Tùng",
        "ghiChu": "Nhập kho lô dầu York Oil K chính hãng từ NPP Johnson Controls",
        "donGiaSnapshot": 7600000
    },
    {
        "transId": "TR-2026-1020",
        "ngay": "2026-10-20",
        "loaiGD": "Xuất kho sử dụng",
        "maVatTu": "SP-GAS-R134A",
        "thietBiSuDung": "HVAC-CH-02",
        "soLuong": 1,
        "nguoiThucHien": "Khiêm Huỳnh",
        "ghiChu": "Xuất 1 bình gas R134a châm bổ sung hệ thống Chiller 02",
        "donGiaSnapshot": 2850000
    },
    {
        "transId": "TR-2026-1025",
        "ngay": "2026-10-25",
        "loaiGD": "Nhập kho",
        "maVatTu": "SP-FILT-G4-AHU",
        "thietBiSuDung": "HVAC-AHU-01",
        "soLuong": 40,
        "nguoiThucHien": "Lê Thanh Tùng",
        "ghiChu": "Nhập kho 40 tấm lọc thô G4 khung nhôm phục vụ thay thế quý 4",
        "donGiaSnapshot": 185000
    },
    {
        "transId": "TR-2026-1028",
        "ngay": "2026-10-28",
        "loaiGD": "Xuất kho sử dụng",
        "maVatTu": "SP-FILT-F8-AHU",
        "thietBiSuDung": "HVAC-AHU-CT",
        "soLuong": 6,
        "nguoiThucHien": "Khiêm Huỳnh",
        "ghiChu": "Xuất thay 6 tấm lọc tinh F8 phòng sạch AHU Coating",
        "donGiaSnapshot": 520000
    },
    {
        "transId": "TR-2026-1102",
        "ngay": "2026-11-02",
        "loaiGD": "Xuất kho sử dụng",
        "maVatTu": "SP-CHEM-PAC",
        "thietBiSuDung": "WAT-WW",
        "soLuong": 5,
        "nguoiThucHien": "Trần Minh Tuấn",
        "ghiChu": "Xuất 5 bao PAC hòa tan bồn phản ứng keo tụ trạm xử lý nước thải",
        "donGiaSnapshot": 380000
    },
    {
        "transId": "TR-2026-1103",
        "ngay": "2026-11-03",
        "loaiGD": "Xuất kho sử dụng",
        "maVatTu": "SP-DI-RESIN-MIX",
        "thietBiSuDung": "WAT-DI-01",
        "soLuong": 1,
        "nguoiThucHien": "Trần Minh Tuấn",
        "ghiChu": "Xuất 1 bao Hạt nhựa trao đổi ion Purolite MB400 hoàn nguyên cột lọc DI",
        "donGiaSnapshot": 2650000
    },
    {
        "transId": "TR-2026-1104",
        "ngay": "2026-11-04",
        "loaiGD": "Xuất kho sử dụng",
        "maVatTu": "SP-OIL-CHILLER",
        "thietBiSuDung": "HVAC-CH-01",
        "soLuong": 1,
        "nguoiThucHien": "Khiêm Huỳnh",
        "ghiChu": "Xuất 1 Can dầu York Oil K bổ sung mức dầu Chiller 01",
        "donGiaSnapshot": 7600000
    },
    {
        "transId": "TR-2026-1105",
        "ngay": "2026-11-05",
        "loaiGD": "Xuất kho sử dụng",
        "maVatTu": "SP-BAT-12V100AH",
        "thietBiSuDung": "ELC-GE-01",
        "soLuong": 2,
        "nguoiThucHien": "Phạm Đức Cường",
        "ghiChu": "Xuất 2 bình ắc quy Vision 12V 100Ah thay thế cho máy phát điện Cummins",
        "donGiaSnapshot": 3450000
    },
    {
        "transId": "TR-2026-1106",
        "ngay": "2026-11-06",
        "loaiGD": "Xuất kho sử dụng",
        "maVatTu": "SP-LED-HIGHBAY-150W",
        "thietBiSuDung": "INF-INLIG",
        "soLuong": 4,
        "nguoiThucHien": "Phạm Đức Cường",
        "ghiChu": "Xuất thay 4 bộ đèn LED High Bay 150W line C xưởng sản xuất",
        "donGiaSnapshot": 1150000
    },
    {
        "transId": "TR-2026-1108",
        "ngay": "2026-11-08",
        "loaiGD": "Nhập kho",
        "maVatTu": "SP-BEARING-SKF-6316",
        "thietBiSuDung": "HVAC-CLWP-01",
        "soLuong": 4,
        "nguoiThucHien": "Lê Thanh Tùng",
        "ghiChu": "Nhập 4 vòng bi SKF 6316 dự phòng cho hệ bơm giải nhiệt",
        "donGiaSnapshot": 1850000
    },
    {
        "transId": "TR-2026-1109",
        "ngay": "2026-11-09",
        "loaiGD": "Nhập kho",
        "maVatTu": "SP-INV-FUSE-30A",
        "thietBiSuDung": "ELC-SOLAR-01",
        "soLuong": 20,
        "nguoiThucHien": "Lê Thanh Tùng",
        "ghiChu": "Nhập 20 cầu chì DC Mersen 1500V 30A cho trạm Solar rooftop",
        "donGiaSnapshot": 165000
    },
    {
        "transId": "TR-2026-1110",
        "ngay": "2026-11-10",
        "loaiGD": "Xuất kho sử dụng",
        "maVatTu": "SP-FILT-G4-AHU",
        "thietBiSuDung": "HVAC-PAU-01",
        "soLuong": 4,
        "nguoiThucHien": "Khiêm Huỳnh",
        "ghiChu": "Xuất 4 tấm lọc thô G4 thay thế cho PAU 01 định kỳ",
        "donGiaSnapshot": 185000
    }
]

# Power 10 Days
power_10days = [
    {
        "id": "POW-2026-11-1",
        "thoiGianLuu": "2026-11-10 18:00",
        "chuKy": "Chu kỳ 1 (01-10/11/2026)",
        "tuNgay": "2026-11-01",
        "denNgay": "2026-11-10",
        "ngayLamViec": 10,
        "loaiCa": "3 Ca liên tục",
        "tbNgayKwh": 18620,
        "evnBT": 83900,
        "evnCD": 43200,
        "evnTD": 31800,
        "solarBT": 19100,
        "solarCD": 8200,
        "pLighting": 9350,
        "pAcmv": 25100,
        "pEquipment": 46200,
        "uChiller": 49800,
        "uMChiller": 6300,
        "uComp": 28400,
        "uPump": 7850,
        "uCooling": 6100,
        "uOther": 2300,
        "oAcmv": 2150,
        "oSocket": 1650,
        "oKit": 850,
        "oServer": 4850,
        "oLighting": 900,
        "nguoiChot": "Phạm Đức Cường"
    },
    {
        "id": "POW-2026-10-3",
        "thoiGianLuu": "2026-10-31 18:00",
        "chuKy": "Chu kỳ 3 (21-31/10/2026)",
        "tuNgay": "2026-10-21",
        "denNgay": "2026-10-31",
        "ngayLamViec": 11,
        "loaiCa": "3 Ca liên tục",
        "tbNgayKwh": 19140,
        "evnBT": 92400,
        "evnCD": 48100,
        "evnTD": 34900,
        "solarBT": 24200,
        "solarCD": 10900,
        "pLighting": 10250,
        "pAcmv": 27800,
        "pEquipment": 51400,
        "uChiller": 54200,
        "uMChiller": 7100,
        "uComp": 31200,
        "uPump": 8600,
        "uCooling": 6800,
        "uOther": 2600,
        "oAcmv": 2380,
        "oSocket": 1820,
        "oKit": 920,
        "oServer": 5350,
        "oLighting": 980,
        "nguoiChot": "Phạm Đức Cường"
    },
    {
        "id": "POW-2026-10-2",
        "thoiGianLuu": "2026-10-20 18:00",
        "chuKy": "Chu kỳ 2 (11-20/10/2026)",
        "tuNgay": "2026-10-11",
        "denNgay": "2026-10-20",
        "ngayLamViec": 10,
        "loaiCa": "3 Ca liên tục",
        "tbNgayKwh": 18450,
        "evnBT": 82100,
        "evnCD": 42800,
        "evnTD": 31200,
        "solarBT": 19800,
        "solarCD": 8600,
        "pLighting": 9200,
        "pAcmv": 24800,
        "pEquipment": 45800,
        "uChiller": 49200,
        "uMChiller": 6200,
        "uComp": 28100,
        "uPump": 7750,
        "uCooling": 6050,
        "uOther": 2250,
        "oAcmv": 2100,
        "oSocket": 1620,
        "oKit": 840,
        "oServer": 4820,
        "oLighting": 870,
        "nguoiChot": "Phạm Đức Cường"
    },
    {
        "id": "POW-2026-10-1",
        "thoiGianLuu": "2026-10-10 18:00",
        "chuKy": "Chu kỳ 1 (01-10/10/2026)",
        "tuNgay": "2026-10-01",
        "denNgay": "2026-10-10",
        "ngayLamViec": 10,
        "loaiCa": "3 Ca liên tục",
        "tbNgayKwh": 18200,
        "evnBT": 81500,
        "evnCD": 42100,
        "evnTD": 30800,
        "solarBT": 19200,
        "solarCD": 8400,
        "pLighting": 9100,
        "pAcmv": 24500,
        "pEquipment": 45200,
        "uChiller": 48600,
        "uMChiller": 6100,
        "uComp": 27800,
        "uPump": 7650,
        "uCooling": 5950,
        "uOther": 2200,
        "oAcmv": 2050,
        "oSocket": 1590,
        "oKit": 820,
        "oServer": 4780,
        "oLighting": 860,
        "nguoiChot": "Phạm Đức Cường"
    }
]

# Cost Records - 9 Items
cost_records = [
    {
        "idChiPhi": "CP-2026-11-01",
        "ngayGhiNhan": "2026-11-04",
        "phanLoai": "Bảo trì định kỳ",
        "thamChieu": "HVAC-CH-01",
        "soTienVND": 8200000,
        "nhaCungCap": "Công ty TNHH Johnson Controls Việt Nam",
        "trangThai": "Đã thanh toán",
        "ghiChu": "Bảo dưỡng định kỳ tháng 11 Chiller 01 & châm dầu York K"
    },
    {
        "idChiPhi": "CP-2026-10-15",
        "ngayGhiNhan": "2026-10-15",
        "phanLoai": "Mua vật tư thay thế",
        "thamChieu": "SP-OIL-CHILLER",
        "soTienVND": 30400000,
        "nhaCungCap": "Công ty CP Kỹ thuật Lạnh Nam Phú Thái",
        "trangThai": "Đã thanh toán",
        "ghiChu": "Mua 4 can dầu York Oil K (7.600.000đ/can) phục vụ kho O&M"
    },
    {
        "idChiPhi": "CP-2026-10-25",
        "ngayGhiNhan": "2026-10-25",
        "phanLoai": "Kiểm định an toàn",
        "thamChieu": "ELC-MV-01",
        "soTienVND": 15000000,
        "nhaCungCap": "Trung tâm Kiểm định Kỹ thuật An toàn Khu vực 2",
        "trangThai": "Đã thanh toán",
        "ghiChu": "Thí nghiệm định kỳ trạm biến áp trung thế 22kV và máy biến áp 2500kVA"
    },
    {
        "idChiPhi": "CP-2026-11-06",
        "ngayGhiNhan": "2026-11-06",
        "phanLoai": "Mua vật tư thay thế",
        "thamChieu": "INF-INLIG",
        "soTienVND": 4600000,
        "nhaCungCap": "Nhà phân phối thiết bị chiếu sáng Philips Việt Nam",
        "trangThai": "Đã thanh toán",
        "ghiChu": "Mua 4 bộ đèn LED High Bay 150W thay thế cho line sản xuất"
    },
    {
        "idChiPhi": "CP-2026-11-09",
        "ngayGhiNhan": "2026-11-09",
        "phanLoai": "Sửa chữa đột xuất",
        "thamChieu": "TK-2026-1101",
        "soTienVND": 12500000,
        "nhaCungCap": "Công ty TNHH Thiết bị Khí Nén Toàn Cầu",
        "trangThai": "Chờ duyệt",
        "ghiChu": "Báo giá sửa chữa két giải nhiệt và thay van hằng nhiệt máy nén khí GA90-2"
    },
    {
        "idChiPhi": "CP-2026-10-28",
        "ngayGhiNhan": "2026-10-28",
        "phanLoai": "Dịch vụ ngoài",
        "thamChieu": "FFA-FA",
        "soTienVND": 6800000,
        "nhaCungCap": "Công ty CP Kỹ thuật Phòng cháy Chữa cháy Thăng Long",
        "trangThai": "Đã thanh toán",
        "ghiChu": "Hiệu chuẩn và kiểm tra hệ thống điều khiển báo cháy Hochiki 6 Loop"
    },
    {
        "idChiPhi": "CP-2026-10-18",
        "ngayGhiNhan": "2026-10-18",
        "phanLoai": "Mua vật tư thay thế",
        "thamChieu": "SP-GAS-R134A",
        "soTienVND": 14250000,
        "nhaCungCap": "Công ty CP Hóa Chất Khí Lạnh Việt Nam",
        "trangThai": "Đã thanh toán",
        "ghiChu": "Nhập 5 bình gas R134a 13.62kg chính hãng Suva USA"
    },
    {
        "idChiPhi": "CP-2026-11-05",
        "ngayGhiNhan": "2026-11-05",
        "phanLoai": "Mua vật tư thay thế",
        "thamChieu": "SP-BAT-12V100AH",
        "soTienVND": 6900000,
        "nhaCungCap": "Công ty TNHH Năng Lượng Xanh Vision",
        "trangThai": "Đã thanh toán",
        "ghiChu": "Mua 2 bình ắc quy 12V 100Ah đề máy phát điện Cummins"
    },
    {
        "idChiPhi": "CP-2026-11-03",
        "ngayGhiNhan": "2026-11-03",
        "phanLoai": "Bảo trì định kỳ",
        "thamChieu": "WAT-DI-01",
        "soTienVND": 4200000,
        "nhaCungCap": "Công ty Môi Trường & Nước Tinh Khiết Sài Gòn",
        "trangThai": "Đã thanh toán",
        "ghiChu": "Hoàn nguyên hạt nhựa ion và thay lõi lọc vi sinh trạm nước DI"
    }
]

# Water Monthly
water_monthly = [
    {
        "month": "2026-10",
        "waterM3": 2840,
        "waterVND": 36920000,
        "waterUSD": 1476.8,
        "sewageVND": 18460000,
        "sewageUSD": 738.4
    },
    {
        "month": "2026-09",
        "waterM3": 2910,
        "waterVND": 37830000,
        "waterUSD": 1513.2,
        "sewageVND": 18915000,
        "sewageUSD": 756.6
    },
    {
        "month": "2026-08",
        "waterM3": 3120,
        "waterVND": 40560000,
        "waterUSD": 1622.4,
        "sewageVND": 20280000,
        "sewageUSD": 811.2
    },
    {
        "month": "2026-07",
        "waterM3": 3050,
        "waterVND": 39650000,
        "waterUSD": 1586.0,
        "sewageVND": 19825000,
        "sewageUSD": 793.0
    },
    {
        "month": "2026-06",
        "waterM3": 2980,
        "waterVND": 38740000,
        "waterUSD": 1549.6,
        "sewageVND": 19370000,
        "sewageUSD": 774.8
    },
    {
        "month": "2026-05",
        "waterM3": 3150,
        "waterVND": 40950000,
        "waterUSD": 1638.0,
        "sewageVND": 20475000,
        "sewageUSD": 819.0
    }
]

# Employees
employees = [
    {
        "maNhanVien": "NV-ENG-001",
        "tenNhanVien": "Huỳnh Khiêm",
        "date": "2026-11-10",
        "chucVu": "Trưởng phòng Kỹ thuật",
        "ngayVao": "2020-03-15",
        "soDienThoai": "0908 123 456",
        "email": "khiemhuynhggs@gmail.com",
        "anhDaiDien": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
    },
    {
        "maNhanVien": "NV-ENG-002",
        "tenNhanVien": "Phạm Đức Cường",
        "date": "2026-11-10",
        "chucVu": "Kỹ thuật viên",
        "ngayVao": "2021-04-10",
        "soDienThoai": "0918 890 123",
        "email": "cuong.pham@factory.com",
        "anhDaiDien": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
    },
    {
        "maNhanVien": "NV-ENG-003",
        "tenNhanVien": "Trần Minh Tuấn",
        "date": "2026-11-10",
        "chucVu": "Kỹ thuật viên",
        "ngayVao": "2022-01-10",
        "soDienThoai": "0988 765 432",
        "email": "tuan.tran@factory.com",
        "anhDaiDien": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"
    },
    {
        "maNhanVien": "NV-ENG-004",
        "tenNhanVien": "Nguyễn Văn Hùng",
        "date": "2026-11-10",
        "chucVu": "Kỹ thuật viên",
        "ngayVao": "2021-06-01",
        "soDienThoai": "0912 345 678",
        "email": "hung.nguyen@factory.com",
        "anhDaiDien": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80"
    },
    {
        "maNhanVien": "NV-ENG-005",
        "tenNhanVien": "Lê Thanh Tùng",
        "date": "2026-11-10",
        "chucVu": "Nhân viên vận hành",
        "ngayVao": "2022-08-15",
        "soDienThoai": "0933 456 789",
        "email": "tung.le@factory.com",
        "anhDaiDien": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80"
    },
    {
        "maNhanVien": "NV-ENG-006",
        "tenNhanVien": "Hoàng Văn Nam",
        "date": "2026-11-10",
        "chucVu": "Kỹ thuật viên",
        "ngayVao": "2023-02-20",
        "soDienThoai": "0977 654 321",
        "email": "nam.hoang@factory.com",
        "anhDaiDien": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80"
    }
]

# Detailed Meter Readings for Electricity & Water (14 Readings covering 09/11 and 10/11)
meter_readings = [
    {
        "id": "MET-001",
        "timestamp": "2026-11-10 07:30",
        "ngayChot": "2026-11-10",
        "nguon": "EVN",
        "tenDongHo": "Đồng hồ Trạm Trung thế 1 (ELC-MV-01)",
        "chiSoCu": 142350,
        "chiSoMoi": 145120,
        "tieuThu": 2770,
        "donVi": "kWh",
        "nguoiGhi": "Phạm Đức Cường"
    },
    {
        "id": "MET-002",
        "timestamp": "2026-11-10 07:35",
        "ngayChot": "2026-11-10",
        "nguon": "EVN",
        "tenDongHo": "Đồng hồ Trạm Trung thế 2 (ELC-MV-02)",
        "chiSoCu": 138900,
        "chiSoMoi": 141540,
        "tieuThu": 2640,
        "donVi": "kWh",
        "nguoiGhi": "Phạm Đức Cường"
    },
    {
        "id": "MET-003",
        "timestamp": "2026-11-10 07:40",
        "ngayChot": "2026-11-10",
        "nguon": "Solar",
        "tenDongHo": "Inverter Tổng Trạm Solar Mái Nhà 01",
        "chiSoCu": 84200,
        "chiSoMoi": 85150,
        "tieuThu": 950,
        "donVi": "kWh",
        "nguoiGhi": "Phạm Đức Cường"
    },
    {
        "id": "MET-004",
        "timestamp": "2026-11-10 07:42",
        "ngayChot": "2026-11-10",
        "nguon": "Solar",
        "tenDongHo": "Inverter Tổng Trạm Solar Mái Nhà 02",
        "chiSoCu": 79100,
        "chiSoMoi": 79980,
        "tieuThu": 880,
        "donVi": "kWh",
        "nguoiGhi": "Phạm Đức Cường"
    },
    {
        "id": "MET-005",
        "timestamp": "2026-11-10 07:45",
        "ngayChot": "2026-11-10",
        "nguon": "EVN",
        "tenDongHo": "Đồng hồ nhánh Chiller 01 & Chiller 02",
        "chiSoCu": 92450,
        "chiSoMoi": 94250,
        "tieuThu": 1800,
        "donVi": "kWh",
        "nguoiGhi": "Phạm Đức Cường"
    },
    {
        "id": "MET-006",
        "timestamp": "2026-11-10 07:48",
        "ngayChot": "2026-11-10",
        "nguon": "EVN",
        "tenDongHo": "Đồng hồ nhánh Máy nén khí GA90 & GA75",
        "chiSoCu": 65300,
        "chiSoMoi": 66520,
        "tieuThu": 1220,
        "donVi": "kWh",
        "nguoiGhi": "Phạm Đức Cường"
    },
    {
        "id": "MET-007",
        "timestamp": "2026-11-10 07:50",
        "ngayChot": "2026-11-10",
        "nguon": "Nước Máy",
        "tenDongHo": "Đồng hồ cấp nước thủy cục tổng Sawaco",
        "chiSoCu": 14520,
        "chiSoMoi": 14612,
        "tieuThu": 92,
        "donVi": "m³",
        "nguoiGhi": "Trần Minh Tuấn"
    },
    {
        "id": "MET-008",
        "timestamp": "2026-11-10 07:52",
        "ngayChot": "2026-11-10",
        "nguon": "Nước Máy",
        "tenDongHo": "Đồng hồ nước cấp tháp giải nhiệt Cooling Tower",
        "chiSoCu": 6840,
        "chiSoMoi": 6885,
        "tieuThu": 45,
        "donVi": "m³",
        "nguoiGhi": "Trần Minh Tuấn"
    },
    {
        "id": "MET-009",
        "timestamp": "2026-11-10 07:55",
        "ngayChot": "2026-11-10",
        "nguon": "Nước Tái Sử Dụng",
        "tenDongHo": "Đồng hồ nước tưới cây & xả WC sau xử lý",
        "chiSoCu": 8920,
        "chiSoMoi": 8955,
        "tieuThu": 35,
        "donVi": "m³",
        "nguoiGhi": "Trần Minh Tuấn"
    },
    {
        "id": "MET-010",
        "timestamp": "2026-11-10 08:00",
        "ngayChot": "2026-11-10",
        "nguon": "Nước Tái Sử Dụng",
        "tenDongHo": "Đồng hồ lưu lượng xả thải KCN sau xử lý",
        "chiSoCu": 24150,
        "chiSoMoi": 24228,
        "tieuThu": 78,
        "donVi": "m³",
        "nguoiGhi": "Trần Minh Tuấn"
    },
    {
        "id": "MET-011",
        "timestamp": "2026-11-09 07:30",
        "ngayChot": "2026-11-09",
        "nguon": "EVN",
        "tenDongHo": "Đồng hồ Trạm Trung thế 1 (ELC-MV-01)",
        "chiSoCu": 139620,
        "chiSoMoi": 142350,
        "tieuThu": 2730,
        "donVi": "kWh",
        "nguoiGhi": "Phạm Đức Cường"
    },
    {
        "id": "MET-012",
        "timestamp": "2026-11-09 07:35",
        "ngayChot": "2026-11-09",
        "nguon": "EVN",
        "tenDongHo": "Đồng hồ Trạm Trung thế 2 (ELC-MV-02)",
        "chiSoCu": 136280,
        "chiSoMoi": 138900,
        "tieuThu": 2620,
        "donVi": "kWh",
        "nguoiGhi": "Phạm Đức Cường"
    },
    {
        "id": "MET-013",
        "timestamp": "2026-11-09 07:40",
        "ngayChot": "2026-11-09",
        "nguon": "Solar",
        "tenDongHo": "Inverter Tổng Trạm Solar Mái Nhà 01",
        "chiSoCu": 83280,
        "chiSoMoi": 84200,
        "tieuThu": 920,
        "donVi": "kWh",
        "nguoiGhi": "Phạm Đức Cường"
    },
    {
        "id": "MET-014",
        "timestamp": "2026-11-09 07:50",
        "ngayChot": "2026-11-09",
        "nguon": "Nước Máy",
        "tenDongHo": "Đồng hồ cấp nước thủy cục tổng Sawaco",
        "chiSoCu": 14432,
        "chiSoMoi": 14520,
        "tieuThu": 88,
        "donVi": "m³",
        "nguoiGhi": "Trần Minh Tuấn"
    }
]

# Audit Logs
audit_logs = [
    {
        "id": "LOG-001",
        "thoiGian": "2026-11-10 15:30:00",
        "nguoiThaoTac": "Khiêm Huỳnh",
        "hanhDong": "Xuất kho",
        "chucNang": "Kho xuất nhập vật tư",
        "doiTuong": "SP-OIL-CHILLER",
        "chiTietNoiDung": "Xuất 1 Can dầu York Oil K bổ sung mức dầu Chiller 01"
    },
    {
        "id": "LOG-002",
        "thoiGian": "2026-11-10 14:10:05",
        "nguoiThaoTac": "Phạm Đức Cường",
        "hanhDong": "Thêm",
        "chucNang": "Tickets sự cố",
        "doiTuong": "TK-2026-1102",
        "chiTietNoiDung": "Tạo ticket mới: Rò rỉ nước tại mặt bích bơm nước giải nhiệt CLWP-01"
    },
    {
        "id": "LOG-003",
        "thoiGian": "2026-11-10 16:45:22",
        "nguoiThaoTac": "Trần Minh Tuấn",
        "hanhDong": "Hoàn thành",
        "chucNang": "Lịch sử bảo trì",
        "doiTuong": "WAT-WW",
        "chiTietNoiDung": "Hoàn tất bảo dưỡng hệ thống xử lý nước thải, kiểm tra DO bể hiếu khí"
    },
    {
        "id": "LOG-004",
        "thoiGian": "2026-11-10 07:30:15",
        "nguoiThaoTac": "Phạm Đức Cường",
        "hanhDong": "Chốt số",
        "chucNang": "Chốt chỉ số Điện - Nước",
        "doiTuong": "ELC-MV-01",
        "chiTietNoiDung": "Ghi nhận chỉ số mới 145120 kWh, tiêu thụ 2770 kWh ca đêm"
    },
    {
        "id": "LOG-005",
        "thoiGian": "2026-11-10 08:00:00",
        "nguoiThaoTac": "Khiêm Huỳnh",
        "hanhDong": "Đăng nhập",
        "chucNang": "Hệ thống CMMS",
        "doiTuong": "Tài khoản",
        "chiTietNoiDung": "Đăng nhập ca làm việc buổi sáng phòng Kỹ thuật O&M"
    },
    {
        "id": "LOG-006",
        "thoiGian": "2026-11-09 16:30:00",
        "nguoiThaoTac": "Lê Thanh Tùng",
        "hanhDong": "Nhập kho",
        "chucNang": "Kho xuất nhập vật tư",
        "doiTuong": "SP-INV-FUSE-30A",
        "chiTietNoiDung": "Nhập kho 20 cầu chì DC Mersen 1500V 30A cho trạm Solar rooftop"
    },
    {
        "id": "LOG-007",
        "thoiGian": "2026-11-08 11:20:00",
        "nguoiThaoTac": "Khiêm Huỳnh",
        "hanhDong": "Hoàn thành",
        "chucNang": "Lịch sử bảo trì",
        "doiTuong": "HVAC-CH-03",
        "chiTietNoiDung": "Hoàn thành đo rung động và kiểm tra dầu bôi trơn Chiller 03"
    },
    {
        "id": "LOG-008",
        "thoiGian": "2026-11-08 09:15:00",
        "nguoiThaoTac": "Nguyễn Văn Hùng",
        "hanhDong": "Thêm",
        "chucNang": "Tickets sự cố",
        "doiTuong": "TK-2026-1101",
        "chiTietNoiDung": "Tạo ticket khẩn cấp: Máy nén khí GA90-2 rung giật và quá nhiệt đầu nén"
    }
]

# Write initialData.ts
ts_content = f'''import {{
  Equipment,
  MaintenancePlan,
  MaintenanceHistory,
  Ticket,
  SparePart,
  StockTransaction,
  Power10Days,
  CostRecord,
  WaterMonthly,
  Employee,
  MeterReading,
  AuditLog,
}} from '../types/cmms';

// Sheet 1: Danh_sach_thiet_bi (Đầy đủ 133 máy móc thiết bị nhà máy)
export const INITIAL_EQUIPMENT: Equipment[] = {json.dumps(equipment_list, ensure_ascii=False, indent=2)};

// Sheet 2: Ke_hoach_bao_tri (Kế hoạch bảo trì đồng bộ 133 máy móc)
export const INITIAL_MAINTENANCE_PLANS: MaintenancePlan[] = {json.dumps(plans_list, ensure_ascii=False, indent=2)};

// Sheet 3: Lich_su_bao_tri (Hồ sơ bảo trì chi tiết đã hoàn thành của toàn bộ thiết bị)
export const INITIAL_MAINTENANCE_HISTORY: MaintenanceHistory[] = {json.dumps(maintenance_history, ensure_ascii=False, indent=2)};

// Sheet 4: Tickets (Yêu cầu xử lý sự cố & liên kết các bộ phận)
export const INITIAL_TICKETS: Ticket[] = {json.dumps(tickets_list, ensure_ascii=False, indent=2)};

// Sheet 5: Spare_part (Danh mục phụ tùng vật tư dự phòng O&M)
export const INITIAL_SPARE_PARTS: SparePart[] = {json.dumps(spare_parts, ensure_ascii=False, indent=2)};

// Sheet 6: Kho_xuat_nhap (Nhật ký giao dịch xuất nhập trừ kho tự động)
export const INITIAL_STOCK_TRANSACTIONS: StockTransaction[] = {json.dumps(stock_transactions, ensure_ascii=False, indent=2)};

// Sheet 7: Dien_10_Ngay (Theo dõi tiêu thụ điện EVN & Solar chu kỳ 10 ngày)
export const INITIAL_POWER_10DAYS: Power10Days[] = {json.dumps(power_10days, ensure_ascii=False, indent=2)};

// Sheet 8: Quan_ly_chi_phi (Thống kê chi phí sửa chữa, vật tư & dịch vụ O&M)
export const INITIAL_COST_RECORDS: CostRecord[] = {json.dumps(cost_records, ensure_ascii=False, indent=2)};

// Sheet 9: Nuoc_month (Tiêu thụ nước cấp thủy cục & nước thải hàng tháng)
export const INITIAL_WATER_MONTHLY: WaterMonthly[] = {json.dumps(water_monthly, ensure_ascii=False, indent=2)};

// Sheet 10: Nhan_vien (Danh sách nhân sự kỹ thuật & phân quyền hệ thống)
export const INITIAL_EMPLOYEES: Employee[] = {json.dumps(employees, ensure_ascii=False, indent=2)};

// Sheet 11: Dien_Nuoc (Nhật ký chốt số đồng hồ điện, solar & nước theo ca)
export const INITIAL_METER_READINGS: MeterReading[] = {json.dumps(meter_readings, ensure_ascii=False, indent=2)};

// Sheet 12: Log_He_thong (Nhật ký audit trail toàn bộ thao tác người dùng)
export const INITIAL_AUDIT_LOGS: AuditLog[] = {json.dumps(audit_logs, ensure_ascii=False, indent=2)};
'''

with open('src/data/initialData.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print(f"Generated src/data/initialData.ts successfully with:")
print(f"- {len(equipment_list)} Equipment")
print(f"- {len(plans_list)} Plans")
print(f"- {len(maintenance_history)} Maintenance History Records")
print(f"- {len(tickets_list)} Tickets")
print(f"- {len(spare_parts)} Spare Parts")
print(f"- {len(stock_transactions)} Stock Transactions")
print(f"- {len(power_10days)} Power Periods")
print(f"- {len(cost_records)} Cost Records")
print(f"- {len(water_monthly)} Water Records")
print(f"- {len(employees)} Employees")
print(f"- {len(meter_readings)} Meter Readings")
print(f"- {len(audit_logs)} Audit Logs")
