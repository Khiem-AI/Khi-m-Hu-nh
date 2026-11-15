import csv
import json
import re
from datetime import datetime, timedelta

def parse_date(d_str):
    if not d_str:
        return ''
    d_str = d_str.strip()
    parts = d_str.split('/')
    if len(parts) == 3:
        day, month, year = parts
        return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
    return d_str

def parse_downtime(dt_str):
    dt_str = dt_str.strip().lower()
    if not dt_str:
        return 0
    if 'day' in dt_str or 'ngày' in dt_str:
        num = ''.join(c for c in dt_str if c.isdigit() or c=='.')
        return int(float(num) * 24 * 60) if num else 1440
    if 'h' in dt_str or 'giờ' in dt_str or 'gio' in dt_str:
        num = ''.join(c for c in dt_str if c.isdigit() or c=='.')
        return int(float(num) * 60) if num else 60
    if 'p' in dt_str or 'phút' in dt_str:
        num = ''.join(c for c in dt_str if c.isdigit())
        return int(num) if num else 30
    try:
        return int(float(dt_str))
    except:
        return 60

# 1. Parse Equipment from f617a209
equipments = []
with open('public/assets/aistudio/Qu_n_l__b_o_tr__1111_f617a209', mode='r', encoding='utf-8') as f:
    reader = csv.reader(f)
    next(reader)
    seen_codes = set()
    for r in reader:
        if not any(r): continue
        code = r[0].strip()
        if not code or code == 'Mã thiết bị': continue
        if code in seen_codes: continue
        seen_codes.add(code)
        
        name = r[1].strip()
        specs = r[2].strip() if len(r)>2 else ''
        system = r[3].strip() if len(r)>3 else 'Hệ thống chung'
        location = r[4].strip() if len(r)>4 else 'Factory'
        risk = r[5].strip() if len(r)>5 else 'Medium'
        if risk not in ['High', 'Medium', 'Low']:
            risk = 'Medium'
        status = r[6].strip() if len(r)>6 else 'Hoạt động'
        if status not in ['Hoạt động', 'Đang sửa chữa', 'Bảo trì', 'Tạm dừng']:
            status = 'Hoạt động'
        freq = r[7].strip() if len(r)>7 else 'Monthly'
        if freq not in ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']:
            freq = 'Monthly'
        manager = r[8].strip() if len(r)>8 and r[8].strip() else 'Khiêm Huỳnh'
        email = r[9].strip() if len(r)>9 and r[9].strip() else 'khiemhuynhggs@gmail.com'
        qr = r[10].strip() if len(r)>10 and r[10].strip() else f"https://api.qrserver.com/v1/create-qr-code/?size=250x250&data={code}"
        img = r[12].strip() if len(r)>12 and r[12].strip() else ''
        if not img:
            img = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80"

        equipments.append({
            "maThietBi": code,
            "tenThietBi": name,
            "thongSoKyThuat": specs,
            "heThong": system,
            "viTri": location,
            "mucDoRuiRo": risk,
            "trangThai": status,
            "tanSuat": freq,
            "hanBaoTriTiepTheo": "2026-11-20",
            "nguoiPhuTrach": manager,
            "email": email,
            "qrCode": qr,
            "hinhAnh": img
        })

print(f"Loaded {len(equipments)} distinct equipments from f617a209")
eq_map = {e["maThietBi"]: e for e in equipments}

# 2. Parse 115 records from Lich_su_bao_tri_e275a309.csv
history_records = []
with open('public/assets/aistudio/Lich_su_bao_tri_e275a309.csv', mode='r', encoding='utf-8') as f:
    reader = csv.reader(f)
    next(reader)
    for idx, r in enumerate(reader):
        if not any(r): continue
        code = r[0].strip() if len(r)>0 else ''
        name = r[1].strip() if len(r)>1 else ''
        date_raw = r[2].strip() if len(r)>2 else ''
        tech = r[3].strip() if len(r)>3 else ''
        desc = r[4].strip() if len(r)>4 else ''
        dt_raw = r[5].strip() if len(r)>5 else ''
        res = r[6].strip() if len(r)>6 else 'Hoàn thành'
        img = r[7].strip() if len(r)>7 else ''
        reporter = r[8].strip() if len(r)>8 else ''
        
        if not code and not name and not date_raw:
            continue
            
        if not code:
            if 'PAU' in desc:
                code = 'HVAC-PAU-01'
                name = 'PAU 01'
            else:
                continue
                
        if code in eq_map and not name:
            name = eq_map[code]["tenThietBi"]
            
        iso_date = parse_date(date_raw)
        dt_mins = parse_downtime(dt_raw)
        
        if not img and code in eq_map:
            img = eq_map[code]["hinhAnh"]
            
        history_records.append({
            "id": f"HIST-2026-{idx+1:03d}",
            "maThietBi": code,
            "tenThietBi": name,
            "ngayThucHien": iso_date,
            "nguoiThucHien": tech,
            "moTaCongViec": desc,
            "thoiGianDungMay": dt_mins,
            "ketQua": res if res else "Hoàn thành",
            "hinhAnh": img,
            "nguoiLapBaoCao": reporter if reporter else "Đoàn Quang Hùng",
            "chiPhiUocTinh": 500000 if dt_mins < 120 else (1500000 if dt_mins < 360 else 3500000)
        })

history_records.sort(key=lambda x: x["ngayThucHien"], reverse=True)
print(f"Loaded {len(history_records)} maintenance history records")

# 3. Synchronize Plans
def calc_next_date(base_date_str, freq):
    dt = datetime.strptime(base_date_str, '%Y-%m-%d')
    f = (freq or 'Monthly').lower()
    if 'daily' in f:
        dt = dt + timedelta(days=1)
    elif 'weekly' in f:
        dt = dt + timedelta(days=7)
    elif 'quarterly' in f or 'quý' in f:
        dt = dt + timedelta(days=90)
    elif 'yearly' in f or 'năm' in f:
        dt = dt + timedelta(days=365)
    else: # monthly
        dt = dt + timedelta(days=30)
    return dt.strftime('%Y-%m-%d')

def get_status(next_str, today_str='2026-11-10'):
    if next_str < today_str:
        return 'Quá hạn'
    elif next_str == today_str:
        return 'Tới hạn'
    else:
        d_next = datetime.strptime(next_str, '%Y-%m-%d')
        d_today = datetime.strptime(today_str, '%Y-%m-%d')
        diff = (d_next - d_today).days
        if diff <= 7:
            return 'Sắp tới'
        return 'Đúng hạn'

latest_hist_by_code = {}
for h in history_records:
    c = h["maThietBi"]
    if c not in latest_hist_by_code:
        latest_hist_by_code[c] = h

plans = []
for eq in equipments:
    code = eq["maThietBi"]
    freq = eq["tanSuat"]
    if code in latest_hist_by_code:
        last_hist = latest_hist_by_code[code]
        prev_date = last_hist["ngayThucHien"]
        next_date = calc_next_date(prev_date, freq)
    else:
        prev_date = "2026-10-15"
        next_date = calc_next_date(prev_date, freq)
        
    status = get_status(next_date)
    eq["hanBaoTriTiepTheo"] = next_date
    
    plans.append({
        "id": f"PLAN-{code}",
        "maThietBi": code,
        "tenThietBi": eq["tenThietBi"],
        "loaiBaoTri": "Định kỳ",
        "tanSuat": freq,
        "ngayBaoTriGanNhat": prev_date,
        "nguoiPhuTrach": eq["nguoiPhuTrach"],
        "ngayBaoTriTiepTheo": next_date,
        "trangThai": status
    })

# 4. Sheet 10: Nhan_vien - Authentic 7 employees with username, password, rules
employees = [
    {
        "maNhanVien": "ID1460",
        "tenNhanVien": "Khiêm Huỳnh",
        "date": "2026-11-10",
        "chucVu": "Admin",
        "ngayVao": "2020-03-15",
        "soDienThoai": "0908 123 456",
        "email": "khiemhuynhggs@gmail.com",
        "username": "ID1460",
        "password": "1460@cmms",
        "quyenHan": [
            "ALL",
            "SYSTEM_ADMIN",
            "MANAGE_EQUIPMENT",
            "MANAGE_PLANS",
            "MANAGE_HISTORY",
            "MANAGE_TICKETS",
            "MANAGE_SPARE_PARTS",
            "MANAGE_WAREHOUSE",
            "MANAGE_ENERGY",
            "MANAGE_COSTS",
            "MANAGE_EMPLOYEES",
            "EXPORT_DATA",
            "APPROVE_MAINTENANCE"
        ],
        "anhDaiDien": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
    },
    {
        "maNhanVien": "ID1486",
        "tenNhanVien": "Đoàn Quang Hùng",
        "date": "2026-11-10",
        "chucVu": "Kỹ sư thiết bị",
        "ngayVao": "2021-05-10",
        "soDienThoai": "0912 345 678",
        "email": "doanquanghung@factory.com",
        "username": "ID1486",
        "password": "1486@cmms",
        "quyenHan": [
            "MANAGE_EQUIPMENT",
            "MANAGE_PLANS",
            "MANAGE_HISTORY",
            "MANAGE_TICKETS",
            "MANAGE_SPARE_PARTS",
            "MANAGE_WAREHOUSE",
            "MANAGE_ENERGY",
            "MANAGE_COSTS",
            "EXPORT_DATA"
        ],
        "anhDaiDien": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
    },
    {
        "maNhanVien": "ID1665",
        "tenNhanVien": "Trương Quang Sơn",
        "date": "2026-11-10",
        "chucVu": "Kỹ thuật viên",
        "ngayVao": "2021-08-01",
        "soDienThoai": "0987 654 321",
        "email": "truongquangson@factory.com",
        "username": "ID1665",
        "password": "1665@cmms",
        "quyenHan": [
            "VIEW_EQUIPMENT",
            "EXECUTE_PLANS",
            "CREATE_HISTORY",
            "PROCESS_TICKETS",
            "REQUEST_SPARE_PARTS",
            "LOG_ENERGY"
        ],
        "anhDaiDien": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"
    },
    {
        "maNhanVien": "ID1690",
        "tenNhanVien": "Lê Văn Thắng",
        "date": "2026-11-10",
        "chucVu": "Kỹ thuật viên",
        "ngayVao": "2022-02-15",
        "soDienThoai": "0976 543 210",
        "email": "levanthang@factory.com",
        "username": "ID1690",
        "password": "1690@cmms",
        "quyenHan": [
            "VIEW_EQUIPMENT",
            "EXECUTE_PLANS",
            "CREATE_HISTORY",
            "PROCESS_TICKETS",
            "REQUEST_SPARE_PARTS",
            "LOG_ENERGY"
        ],
        "anhDaiDien": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80"
    },
    {
        "maNhanVien": "ID1798",
        "tenNhanVien": "Đỗ Hữu Thịnh",
        "date": "2026-11-10",
        "chucVu": "Kỹ thuật viên",
        "ngayVao": "2022-04-20",
        "soDienThoai": "0965 432 109",
        "email": "dohuuthinh@factory.com",
        "username": "ID1798",
        "password": "1798@cmms",
        "quyenHan": [
            "VIEW_EQUIPMENT",
            "EXECUTE_PLANS",
            "CREATE_HISTORY",
            "PROCESS_TICKETS",
            "REQUEST_SPARE_PARTS",
            "LOG_ENERGY"
        ],
        "anhDaiDien": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80"
    },
    {
        "maNhanVien": "ID1679",
        "tenNhanVien": "Nguyễn Xuân Tuyến",
        "date": "2026-11-10",
        "chucVu": "Kỹ thuật viên",
        "ngayVao": "2022-07-10",
        "soDienThoai": "0943 210 987",
        "email": "nguyenxuantuyen@factory.com",
        "username": "ID1679",
        "password": "1679@cmms",
        "quyenHan": [
            "VIEW_EQUIPMENT",
            "EXECUTE_PLANS",
            "CREATE_HISTORY",
            "PROCESS_TICKETS",
            "REQUEST_SPARE_PARTS",
            "LOG_ENERGY"
        ],
        "anhDaiDien": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80"
    },
    {
        "maNhanVien": "ID1570",
        "tenNhanVien": "Nguyễn Quang Toàn",
        "date": "2026-11-10",
        "chucVu": "Kỹ thuật viên",
        "ngayVao": "2023-01-05",
        "soDienThoai": "0932 109 876",
        "email": "nguyenquangtoan@factory.com",
        "username": "ID1570",
        "password": "1570@cmms",
        "quyenHan": [
            "VIEW_EQUIPMENT",
            "EXECUTE_PLANS",
            "CREATE_HISTORY",
            "PROCESS_TICKETS",
            "REQUEST_SPARE_PARTS",
            "LOG_ENERGY"
        ],
        "anhDaiDien": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80"
    }
]

# 5. Sheet 4: Tickets - Parse all 42 tickets from Tickets_492da1a9.csv
tickets_list = []
seen_tickets = {}

with open('public/assets/aistudio/Tickets_492da1a9.csv', mode='r', encoding='utf-8') as f:
    reader = csv.reader(f)
    next(reader)
    for r in reader:
        if not any(r): continue
        raw_code = r[0].replace('\ufeff', '').strip()
        if not raw_code: continue
        
        # Ensure unique key if duplicate code in source CSV
        if raw_code in seen_tickets:
            seen_tickets[raw_code] += 1
            code = f"{raw_code}-{seen_tickets[raw_code]}"
        else:
            seen_tickets[raw_code] = 1
            code = raw_code

        title = r[1].strip()
        raw_status = r[2].strip() or 'Chờ xử lý'
        # Map status to valid TicketStatus
        if raw_status in ['Hoàn thành', 'Chờ xử lý', 'Đang thực hiện', 'Đang xử lý', 'Mới tiếp nhận', 'Hủy']:
            status = raw_status
        elif 'hoàn thành' in raw_status.lower() or 'xong' in raw_status.lower():
            status = 'Hoàn thành'
        elif 'đang' in raw_status.lower():
            status = 'Đang thực hiện'
        else:
            status = 'Chờ xử lý'
            
        created = parse_date(r[3])
        desc = r[4].strip() if len(r) > 4 else ''
        assignee = r[5].strip() if len(r) > 5 and r[5].strip() else 'Khiêm Huỳnh'
        completed = parse_date(r[6]) if len(r) > 6 and r[6].strip() else ''
        result = r[7].strip() if len(r) > 7 else ''
        creator = r[8].strip() if len(r) > 8 and r[8].strip() else 'Đoàn Quang Hùng'
        raw_prio = r[9].strip() if len(r) > 9 and r[9].strip() else 'Bình thường'
        if raw_prio not in ['Khẩn cấp', 'Cao', 'Trung bình', 'Bình thường', 'Thấp']:
            raw_prio = 'Bình thường'
            
        img_pre = r[10].strip() if len(r) > 10 and r[10].strip() else ''
        img_post = r[11].strip() if len(r) > 11 and r[11].strip() else ''
        
        # Provide clean realistic placeholder image if none in CSV
        if not img_pre and ('Sửa' in title or 'Lắp' in title or 'Kiểm tra' in title):
            img_pre = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80"
        if not img_post and status == 'Hoàn thành':
            img_post = "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80"

        # Try to identify equipment code if mentioned in title or description
        eq_matched = None
        for eq_code in eq_map:
            if eq_code in title or eq_code in desc:
                eq_matched = eq_code
                break
        if not eq_matched:
            if 'GA90' in title or 'GA90' in desc:
                eq_matched = 'CMP-GA90-01'
            elif 'FCU' in title or 'FCU' in desc:
                eq_matched = 'HVAC-FCU-CHEM'
            elif 'PAU' in title or 'PAU' in desc:
                eq_matched = 'HVAC-PAU-01'
            elif 'Wave' in title:
                eq_matched = 'HVAC-EXH-WAVE01'

        tickets_list.append({
            "maTicket": code,
            "tieuDe": title,
            "trangThai": status,
            "ngayTao": created,
            "moTaChiTiet": desc,
            "nguoiPhuTrach": assignee,
            "ngayHoanThanh": completed,
            "ketQua": result,
            "nguoiLap": creator,
            "mucDoUuTien": raw_prio,
            "anhTruocXuLy": img_pre,
            "anhSauXuLy": img_post,
            "maThietBi": eq_matched or ""
        })

print(f"Loaded {len(tickets_list)} tickets from Tickets_492da1a9.csv")

# 6. Sheet 5: Spare parts - Comprehensive factory inventory (28 parts)
spare_parts_list = [
    # HVAC & Chiller
    {
        "maVatTu": "SP-HVAC-BELT-SPC",
        "tenVatTu": "Dây đai truyền động quạt AHU",
        "thongSo": "SPC 2360 - Optibelt Red Power chịu nhiệt",
        "maThietBi": "HVAC-AHU-03",
        "tenThietBiSuDung": "AHU 03",
        "tonToiThieu": 4,
        "tonThucTe": 8,
        "donViTinh": "Sợi",
        "viTriLuu": "Kệ A-01-02",
        "ghiChu": "Dùng chung cho AHU 01 - AHU 06",
        "donGia": 450000
    },
    {
        "maVatTu": "SP-HVAC-OIL-134",
        "tenVatTu": "Dầu bôi trơn máy nén lạnh York",
        "thongSo": "York Oil K - Can 20L",
        "maThietBi": "HVAC-CH-01",
        "tenThietBiSuDung": "Chiller 01",
        "tonToiThieu": 2,
        "tonThucTe": 5,
        "donViTinh": "Can",
        "viTriLuu": "Kho dầu bôi trơn C-01",
        "ghiChu": "Dầu chính hãng Johnson Controls cho York YK",
        "donGia": 6800000
    },
    {
        "maVatTu": "SP-HVAC-FILT-G4",
        "tenVatTu": "Tấm lọc thô sơ cấp G4",
        "thongSo": "592 x 592 x 46 mm - Khung nhôm sợi tổng hợp",
        "maThietBi": "HVAC-PAU-01",
        "tenThietBiSuDung": "PAU 01",
        "tonToiThieu": 16,
        "tonThucTe": 32,
        "donViTinh": "Tấm",
        "viTriLuu": "Kho lọc tầng 2 - Dãy L1",
        "ghiChu": "Dùng cho lọc gió tươi đầu vào PAU & AHU",
        "donGia": 185000
    },
    {
        "maVatTu": "SP-HVAC-FILT-F8",
        "tenVatTu": "Tấm lọc túi F8 cho AHU/PAU",
        "thongSo": "592 x 592 x 535 mm - 6 túi sợi tổng hợp tiêu chuẩn EN779",
        "maThietBi": "HVAC-PAU-01",
        "tenThietBiSuDung": "PAU 01",
        "tonToiThieu": 12,
        "tonThucTe": 24,
        "donViTinh": "Tấm",
        "viTriLuu": "Kho lọc tầng 2 - Dãy L2",
        "ghiChu": "Thay định kỳ 3 tháng/lần cho phòng sạch",
        "donGia": 380000
    },
    {
        "maVatTu": "SP-HVAC-HEPA-H14",
        "tenVatTu": "Phin lọc tinh vi sinh HEPA H14",
        "thongSo": "610 x 610 x 69 mm - Hiệu suất 99.995% @0.3um",
        "maThietBi": "HVAC-AHU-01",
        "tenThietBiSuDung": "AHU 01",
        "tonToiThieu": 6,
        "tonThucTe": 4,
        "donViTinh": "Tấm",
        "viTriLuu": "Kho phòng sạch - Tủ bảo quản",
        "ghiChu": "Cảnh báo dưới mức tồn tối thiểu!",
        "donGia": 2450000
    },
    {
        "maVatTu": "SP-HVAC-SEAL-PUMP",
        "tenVatTu": "Phốt cơ khí bơm giải nhiệt Chiller",
        "thongSo": "Burgmann MG1/50-G6 - Silicon/Carbon/FKM",
        "maThietBi": "PUMP-CHWP-01",
        "tenThietBiSuDung": "Bơm nước lạnh 01",
        "tonToiThieu": 2,
        "tonThucTe": 3,
        "donViTinh": "Bộ",
        "viTriLuu": "Kệ B-01-03",
        "ghiChu": "Dùng cho bơm Grundfos / Ebara",
        "donGia": 1650000
    },
    {
        "maVatTu": "SP-HVAC-SENS-PT100",
        "tenVatTu": "Cảm biến nhiệt độ Pt100 đường ống nước",
        "thongSo": "Pt100 RTD Class A, phi 6x100mm ren G1/2",
        "maThietBi": "HVAC-CH-01",
        "tenThietBiSuDung": "Chiller 01",
        "tonToiThieu": 3,
        "tonThucTe": 7,
        "donViTinh": "Cái",
        "viTriLuu": "Tủ linh kiện điện tử",
        "ghiChu": "Đo nhiệt độ nước cấp & hồi Chiller",
        "donGia": 520000
    },

    # Khí nén & N2
    {
        "maVatTu": "SP-CMP-OIL-ROTO",
        "tenVatTu": "Dầu máy nén khí Roto Inject Fluid",
        "thongSo": "Atlas Copco Roto-Xtend 2901052200 - Thùng 20L",
        "maThietBi": "CMP-GA75-01",
        "tenThietBiSuDung": "Máy nén khí GA75-1",
        "tonToiThieu": 4,
        "tonThucTe": 2,
        "donViTinh": "Thùng",
        "viTriLuu": "Kho hóa chất C-03",
        "ghiChu": "Cảnh báo dưới tồn tối thiểu, cần đặt mua bổ sung!",
        "donGia": 5400000
    },
    {
        "maVatTu": "SP-CMP-SEP-GA90",
        "tenVatTu": "Lọc tách dầu máy nén khí GA90",
        "thongSo": "Code: 1625703600 Atlas Copco chính hãng",
        "maThietBi": "CMP-GA90-02",
        "tenThietBiSuDung": "Máy nén khí GA90-2",
        "tonToiThieu": 2,
        "tonThucTe": 1,
        "donViTinh": "Cái",
        "viTriLuu": "Kệ B-02-01",
        "ghiChu": "Dành riêng cho máy nén GA90",
        "donGia": 8200000
    },
    {
        "maVatTu": "SP-CMP-AIRF-GA75",
        "tenVatTu": "Lõi lọc gió đầu vào máy nén khí",
        "thongSo": "Atlas Copco 1613872000 chính hãng",
        "maThietBi": "CMP-GA75-01",
        "tenThietBiSuDung": "Máy nén khí GA75-1",
        "tonToiThieu": 3,
        "tonThucTe": 6,
        "donViTinh": "Cái",
        "viTriLuu": "Kệ B-02-02",
        "ghiChu": "Thay thế định kỳ 2000 giờ chạy máy",
        "donGia": 1950000
    },
    {
        "maVatTu": "SP-CMP-OILF-GA",
        "tenVatTu": "Lõi lọc dầu động cơ máy nén khí",
        "thongSo": "Atlas Copco 1625752500",
        "maThietBi": "CMP-GA90-01",
        "tenThietBiSuDung": "Máy nén khí GA90-1",
        "tonToiThieu": 4,
        "tonThucTe": 8,
        "donViTinh": "Cái",
        "viTriLuu": "Kệ B-02-03",
        "ghiChu": "Thay kèm mỗi lần thay dầu định kỳ",
        "donGia": 1250000
    },
    {
        "maVatTu": "SP-CMP-DRAIN-BEKO",
        "tenVatTu": "Van xả nước tự động điện tử",
        "thongSo": "Bekomat 31 - 230VAC 0.8-16 bar",
        "maThietBi": "CMP-DRY-01",
        "tenThietBiSuDung": "Máy sấy khí 01",
        "tonToiThieu": 2,
        "tonThucTe": 4,
        "donViTinh": "Bộ",
        "viTriLuu": "Kệ B-03-01",
        "ghiChu": "Xả ngưng tự động không hao hụt khí nén",
        "donGia": 3400000
    },
    {
        "maVatTu": "SP-CMP-PRESS-TX",
        "tenVatTu": "Cảm biến áp suất khí nén 0-16 bar",
        "thongSo": "Danfoss MBS3000 - 4-20mA, ren G1/4",
        "maThietBi": "CMP-GA90-01",
        "tenThietBiSuDung": "Máy nén khí GA90-1",
        "tonToiThieu": 2,
        "tonThucTe": 5,
        "donViTinh": "Cái",
        "viTriLuu": "Tủ linh kiện điện tử",
        "ghiChu": "Đo áp suất đầu ra bình tích khí",
        "donGia": 1850000
    },

    # Nước DI & Xử lý nước thải
    {
        "maVatTu": "SP-WAT-RO-8040",
        "tenVatTu": "Màng lọc nước thẩm thấu ngược RO",
        "thongSo": "Filmtec BW30-400 (DOW/DuPont) size 8040",
        "maThietBi": "WAT-DI",
        "tenThietBiSuDung": "Hệ thống nước DI",
        "tonToiThieu": 3,
        "tonThucTe": 6,
        "donViTinh": "Cây",
        "viTriLuu": "Kệ W-01",
        "ghiChu": "Bảo quản nơi khô ráo, nhiệt độ < 35C",
        "donGia": 9500000
    },
    {
        "maVatTu": "SP-WAT-RESIN-MB",
        "tenVatTu": "Hạt nhựa trao đổi ion Mixed Bed siêu sạch",
        "thongSo": "Purolite MB400 - Bao 25L",
        "maThietBi": "WAT-DI",
        "tenThietBiSuDung": "Hệ thống nước DI",
        "tonToiThieu": 4,
        "tonThucTe": 10,
        "donViTinh": "Bao",
        "viTriLuu": "Kho hóa chất W-02",
        "ghiChu": "Đảm bảo điện trở suất nước DI > 18.2 MOhm",
        "donGia": 2800000
    },
    {
        "maVatTu": "SP-WAT-CARTRIDGE-5U",
        "tenVatTu": "Lõi lọc thô sợi bông nén 5 micron",
        "thongSo": "PP Spun 20 inch x 2.5 inch Big Blue",
        "maThietBi": "WAT-RO-PRE",
        "tenThietBiSuDung": "Cụm tiền xử lý RO",
        "tonToiThieu": 20,
        "tonThucTe": 50,
        "donViTinh": "Lõi",
        "viTriLuu": "Kệ W-03",
        "ghiChu": "Thay 2 tuần/lần bảo vệ màng RO",
        "donGia": 95000
    },
    {
        "maVatTu": "SP-WAT-PH-PROBE",
        "tenVatTu": "Điện cực đo pH nước thải công nghiệp",
        "thongSo": "Mettler Toledo InPro 4260i/PT100/120",
        "maThietBi": "WAT-WW",
        "tenThietBiSuDung": "Hệ thống xử lý nước thải",
        "tonToiThieu": 2,
        "tonThucTe": 3,
        "donViTinh": "Cái",
        "viTriLuu": "Tủ đo lường W-04",
        "ghiChu": "Kèm nắp bảo quản chứa dung dịch KCl 3M",
        "donGia": 4200000
    },
    {
        "maVatTu": "SP-WAT-PUMP-DOS",
        "tenVatTu": "Bơm định lượng châm hóa chất PAC/NaOH",
        "thongSo": "Prominent Concept Plus 0708 PVT - 7.1 L/h @ 7 bar",
        "maThietBi": "WAT-WW",
        "tenThietBiSuDung": "Hệ thống xử lý nước thải",
        "tonToiThieu": 1,
        "tonThucTe": 2,
        "donViTinh": "Bộ",
        "viTriLuu": "Kệ W-05",
        "ghiChu": "Dự phòng sự cố bơm keo tụ nước thải",
        "donGia": 8600000
    },

    # Điện & Solar & Trạm biến áp
    {
        "maVatTu": "SP-ELC-ACB-COIL",
        "tenVatTu": "Cuộn đóng shunt trip máy cắt ACB 3200A",
        "thongSo": "Schneider 220VAC cho Masterpact NW",
        "maThietBi": "ELC-MSB-01",
        "tenThietBiSuDung": "Tủ điện MSB 01",
        "tonToiThieu": 1,
        "tonThucTe": 3,
        "donViTinh": "Bộ",
        "viTriLuu": "Tủ linh kiện điện E-01",
        "ghiChu": "Vật tư dự phòng sự cố tủ phân phối chính",
        "donGia": 3200000
    },
    {
        "maVatTu": "SP-INV-FUSE-30A",
        "tenVatTu": "Cầu chì DC 1000V cho Inverter Solar",
        "thongSo": "10x38mm 30A 1000VDC gPV - Bussmann",
        "maThietBi": "ELC-DB-Solar-01",
        "tenThietBiSuDung": "Trạm điện solar - 1",
        "tonToiThieu": 20,
        "tonThucTe": 45,
        "donViTinh": "Cái",
        "viTriLuu": "Hộp vật tư Solar S-01",
        "ghiChu": "Bảo vệ các string tấm pin năng lượng mặt trời",
        "donGia": 85000
    },
    {
        "maVatTu": "SP-ELC-MCB-3P63",
        "tenVatTu": "Aptomat tép MCB 3P 63A",
        "thongSo": "Schneider iC60N 3P 63A 6kA Curve C",
        "maThietBi": "ELC-DB-OFFICE",
        "tenThietBiSuDung": "Tủ điện văn phòng",
        "tonToiThieu": 5,
        "tonThucTe": 12,
        "donViTinh": "Cái",
        "viTriLuu": "Kệ E-02",
        "ghiChu": "Dùng chung cho các tủ điện nhánh xưởng",
        "donGia": 310000
    },
    {
        "maVatTu": "SP-ELC-SPD-T2",
        "tenVatTu": "Bộ chống sét lan truyền 3P+N Type 2",
        "thongSo": "Phoenix Contact VAL-MS 320/3+1 - Imax 40kA",
        "maThietBi": "ELC-MSB-02",
        "tenThietBiSuDung": "Tủ điện MSB 02",
        "tonToiThieu": 2,
        "tonThucTe": 4,
        "donViTinh": "Bộ",
        "viTriLuu": "Kệ E-03",
        "ghiChu": "Bảo vệ chống sét hạ thế tủ chính",
        "donGia": 2650000
    },
    {
        "maVatTu": "SP-ELC-CAP-CTRL",
        "tenVatTu": "Bộ điều khiển bù công suất phản kháng 12 cấp",
        "thongSo": "Mikro PFR120 - 220VAC",
        "maThietBi": "ELC-CAP-01",
        "tenThietBiSuDung": "Tủ tụ bù 1",
        "tonToiThieu": 1,
        "tonThucTe": 2,
        "donViTinh": "Bộ",
        "viTriLuu": "Kệ E-04",
        "ghiChu": "Duy trì hệ số cos phi > 0.95 tránh phạt EVN",
        "donGia": 4500000
    },

    # PCCC & Nhà xưởng
    {
        "maVatTu": "SP-FP-DET-SMOKE",
        "tenVatTu": "Đầu báo khói quang điện địa chỉ",
        "thongSo": "Notifier FSP-951 Intelligent Photoelectric",
        "maThietBi": "FP-PUMP",
        "tenThietBiSuDung": "Hệ thống PCCC",
        "tonToiThieu": 8,
        "tonThucTe": 15,
        "donViTinh": "Cái",
        "viTriLuu": "Kho PCCC F-01",
        "ghiChu": "Tương thích tủ trung tâm Notifier AFP-3030",
        "donGia": 780000
    },
    {
        "maVatTu": "SP-FP-EXT-CO2",
        "tenVatTu": "Bình chữa cháy khí CO2 5kg",
        "thongSo": "MT5 - Đầy đủ tem kiểm định PCCC",
        "maThietBi": "FP-PUMP",
        "tenThietBiSuDung": "Hệ thống PCCC",
        "tonToiThieu": 5,
        "tonThucTe": 10,
        "donViTinh": "Bình",
        "viTriLuu": "Kho PCCC F-02",
        "ghiChu": "Bố trí tại phòng điện và phòng máy chủ",
        "donGia": 620000
    },
    {
        "maVatTu": "SP-FP-LIGHT-EMG",
        "tenVatTu": "Đèn chiếu sáng khẩn cấp sự cố 2 bóng",
        "thongSo": "Kentom KT-2200EL - Pin 2 giờ",
        "maThietBi": "FP-PUMP",
        "tenThietBiSuDung": "Hệ thống PCCC",
        "tonToiThieu": 6,
        "tonThucTe": 14,
        "donViTinh": "Bộ",
        "viTriLuu": "Kệ E-05",
        "ghiChu": "Lắp đặt tại lối thoát hiểm và cầu thang",
        "donGia": 290000
    },

    # Phụ trợ cơ điện
    {
        "maVatTu": "SP-MEC-BEARING-6308",
        "tenVatTu": "Vòng bi cầu đỡ trục động cơ quạt",
        "thongSo": "SKF 6308-2Z/C3 Explorer chịu tốc độ cao",
        "maThietBi": "HVAC-AHU-02",
        "tenThietBiSuDung": "AHU 02",
        "tonToiThieu": 4,
        "tonThucTe": 10,
        "donViTinh": "Cái",
        "viTriLuu": "Kệ M-01",
        "ghiChu": "Dùng cho động cơ 15kW - 22kW",
        "donGia": 380000
    },
    {
        "maVatTu": "SP-MEC-GAUGE-10BAR",
        "tenVatTu": "Đồng hồ đo áp suất chân đồng chân đứng",
        "thongSo": "Wise P252 - Thang đo 0-10 bar, mặt 100mm, ren G1/2",
        "maThietBi": "PUMP-CHWP-02",
        "tenThietBiSuDung": "Bơm nước lạnh 02",
        "tonToiThieu": 3,
        "tonThucTe": 8,
        "donViTinh": "Cái",
        "viTriLuu": "Kệ M-02",
        "ghiChu": "Đo áp suất nước lạnh Chiller và khí nén",
        "donGia": 420000
    }
]

# 7. Sheet 6: Stock transactions
stock_list = [
    {
        "transId": "TRX-20261105-01",
        "ngay": "2026-11-05",
        "loaiGD": "Xuất kho sử dụng",
        "maVatTu": "SP-HVAC-FILT-F8",
        "thietBiSuDung": "HVAC-PAU-01",
        "soLuong": 4,
        "nguoiThucHien": "Lê Văn Thắng",
        "ghiChu": "Xuất thay phin lọc túi định kỳ cho PAU 01"
    },
    {
        "transId": "TRX-20261102-01",
        "ngay": "2026-11-02",
        "loaiGD": "Nhập kho",
        "maVatTu": "SP-HVAC-BELT-SPC",
        "thietBiSuDung": "Kho kỹ thuật",
        "soLuong": 10,
        "nguoiThucHien": "Đoàn Quang Hùng",
        "ghiChu": "Nhập kho theo PO-2026-10-88 từ nhà cung cấp Bando"
    },
    {
        "transId": "TRX-20261028-02",
        "ngay": "2026-10-28",
        "loaiGD": "Xuất kho sử dụng",
        "maVatTu": "SP-CMP-OIL-ROTO",
        "thietBiSuDung": "CMP-GA90-02",
        "soLuong": 2,
        "nguoiThucHien": "Trương Quang Sơn",
        "ghiChu": "Xuất châm dầu máy nén GA90-2 kiểm tra xử lý sự cố nóng máy"
    },
    {
        "transId": "TRX-20261020-01",
        "ngay": "2026-10-20",
        "loaiGD": "Nhập kho",
        "maVatTu": "SP-WAT-RO-8040",
        "thietBiSuDung": "Kho kỹ thuật",
        "soLuong": 6,
        "nguoiThucHien": "Đoàn Quang Hùng",
        "ghiChu": "Nhập đợt màng RO mới từ nhà phân phối DuPont"
    },
    {
        "transId": "TRX-20261015-01",
        "ngay": "2026-10-15",
        "loaiGD": "Xuất kho sử dụng",
        "maVatTu": "SP-INV-FUSE-30A",
        "thietBiSuDung": "ELC-DB-Solar-01",
        "soLuong": 5,
        "nguoiThucHien": "Khiêm Huỳnh",
        "ghiChu": "Thay cầu chì chuỗi string 4 và 7 bị quá dòng sau cơn giông"
    }
]

# Sheet 7: Power 10 Days - Parse all 102 records from Dien_10_Ngay_9607e8bf.csv
power_10days_list = []
with open('public/assets/aistudio/Dien_10_Ngay_9607e8bf.csv', mode='r', encoding='utf-8') as f:
    reader = csv.reader(f)
    next(reader)
    for idx, r in enumerate(reader):
        if not any(r): continue
        ck = r[1].strip()
        m_y, days = ck.split('-')[0], '-'.join(ck.split('-')[1:])
        m, y = m_y.split('/')
        d_parts = days.split('-')
        d1, d2 = d_parts[0], d_parts[1]
        tu = f'{y}-{m.zfill(2)}-{d1.zfill(2)}'
        den = f'{y}-{m.zfill(2)}-{d2.zfill(2)}'
        
        record = {
            'id': f'PWR-{y}{m.zfill(2)}-D{d1.zfill(2)}',
            'thoiGianLuu': r[0].replace('\ufeff', '').strip(),
            'chuKy': ck,
            'tuNgay': tu,
            'denNgay': den,
            'ngayLamViec': int(float(r[4].strip() or 0)),
            'loaiCa': f'Ca {r[5].strip()}' if r[5].strip() else 'Ca 2',
            'tbNgayKwh': round(float(r[6].strip() or 0), 1),
            'evnBT': round(float(r[7].strip() or 0), 1),
            'evnCD': round(float(r[8].strip() or 0), 1),
            'evnTD': round(float(r[9].strip() or 0), 1),
            'solarBT': round(float(r[10].strip() or 0), 1),
            'solarCD': round(float(r[11].strip() or 0), 1),
            'pLighting': round(float(r[12].strip() or 0), 1),
            'pAcmv': round(float(r[13].strip() or 0), 1),
            'pEquipment': round(float(r[14].strip() or 0), 1),
            'uChiller': round(float(r[15].strip() or 0), 1),
            'uMChiller': round(float(r[16].strip() or 0), 1),
            'uComp': round(float(r[17].strip() or 0), 1),
            'uPump': round(float(r[18].strip() or 0), 1),
            'uCooling': round(float(r[19].strip() or 0), 1),
            'uOther': round(float(r[20].strip() or 0), 1),
            'oAcmv': round(float(r[21].strip() or 0), 1),
            'oSocket': round(float(r[22].strip() or 0), 1),
            'oKit': round(float(r[23].strip() or 0), 1),
            'oServer': round(float(r[24].strip() or 0), 1),
            'oLighting': round(float(r[25].strip() or 0), 1),
            'nguoiChot': r[26].strip() if len(r) > 26 and r[26].strip() else 'Khiêm Huỳnh'
        }
        power_10days_list.append(record)

# Sort by denNgay descending so latest period is first
power_10days_list.sort(key=lambda x: x['denNgay'], reverse=True)
print(f"Loaded {len(power_10days_list)} records from Dien_10_Ngay_9607e8bf.csv")

# Sheet 8: Cost records
cost_list = [
    {
        "idChiPhi": "COST-2026-089",
        "ngayGhiNhan": "2026-11-05",
        "phanLoai": "Mua vật tư thay thế",
        "thamChieu": "PO-2026-10-88",
        "soTienVND": 4500000,
        "nhaCungCap": "Công ty TNHH Bando Việt Nam",
        "trangThai": "Đã thanh toán",
        "ghiChu": "Mua 10 dây đai SPC 2360 dự phòng kho kỹ thuật"
    },
    {
        "idChiPhi": "COST-2026-088",
        "ngayGhiNhan": "2026-10-30",
        "phanLoai": "Bảo trì định kỳ",
        "thamChieu": "HVAC-CH-01",
        "soTienVND": 18500000,
        "nhaCungCap": "Johnson Controls Vietnam",
        "trangThai": "Đã thanh toán",
        "ghiChu": "Gói bảo dưỡng định kỳ Chiller 01 & kiểm tra dầu lạnh"
    },
    {
        "idChiPhi": "COST-2026-087",
        "ngayGhiNhan": "2026-10-25",
        "phanLoai": "Kiểm định an toàn",
        "thamChieu": "CMP-GA90-01",
        "soTienVND": 6200000,
        "nhaCungCap": "Trung tâm Kiểm định Kỹ thuật An toàn Khu vực II",
        "trangThai": "Đã thanh toán",
        "ghiChu": "Kiểm định định kỳ bình chịu áp lực khí nén 5000L"
    },
    {
        "idChiPhi": "COST-2026-086",
        "ngayGhiNhan": "2026-10-20",
        "phanLoai": "Mua vật tư thay thế",
        "thamChieu": "WAT-DI",
        "soTienVND": 57000000,
        "nhaCungCap": "Đại lý Phân phối DuPont Water Solutions",
        "trangThai": "Đã thanh toán",
        "ghiChu": "Mua 6 màng lọc thẩm thấu ngược Filmtec BW30-400"
    },
    {
        "idChiPhi": "COST-2026-085",
        "ngayGhiNhan": "2026-11-08",
        "phanLoai": "Sửa chữa đột xuất",
        "thamChieu": "TCK-2026-001",
        "soTienVND": 12500000,
        "nhaCungCap": "Atlas Copco Services",
        "trangThai": "Chờ duyệt",
        "ghiChu": "Chi phí kiểm tra tháo cụm van nhiệt và phục hồi sinh hàn GA90-2"
    }
]

# Sheet 9: Water monthly (Full 34 months matching Dien_10_Ngay from 2024-01 to 2026-10)
water_m3_seed = {
    "2026-10": 4820,
    "2026-09": 4650,
    "2026-08": 4910,
    "2026-07": 5120,
    "2026-06": 4980,
    "2026-05": 5240,
    "2026-04": 5080,
    "2026-03": 4790,
    "2026-02": 4350,
    "2026-01": 4620,
    "2025-12": 4850,
    "2025-11": 4710,
    "2025-10": 4890,
    "2025-09": 4600,
    "2025-08": 4950,
    "2025-07": 5180,
    "2025-06": 5020,
    "2025-05": 5150,
    "2025-04": 4970,
    "2025-03": 4720,
    "2025-02": 4280,
    "2025-01": 4550,
    "2024-12": 4780,
    "2024-11": 4660,
    "2024-10": 4750,
    "2024-09": 4520,
    "2024-08": 4870,
    "2024-07": 5060,
    "2024-06": 4910,
    "2024-05": 5050,
    "2024-04": 4890,
    "2024-03": 4630,
    "2024-02": 4210,
    "2024-01": 4480,
}

water_list = []
for m, m3 in water_m3_seed.items():
    vnd = m3 * 15000
    usd = round(vnd / 25000)
    sew_vnd = round(vnd * 0.5)
    sew_usd = round(usd * 0.5)
    water_list.append({
        "month": m,
        "waterM3": m3,
        "waterVND": vnd,
        "waterUSD": usd,
        "sewageVND": sew_vnd,
        "sewageUSD": sew_usd,
    })

# Sheet 11: Meter readings
meters_list = [
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
        "nguoiGhi": "Khiêm Huỳnh"
    },
    {
        "id": "MET-002",
        "timestamp": "2026-11-10 07:30",
        "ngayChot": "2026-11-10",
        "nguon": "EVN",
        "tenDongHo": "Đồng hồ Trạm Trung thế 2 (ELC-MV-02)",
        "chiSoCu": 138400,
        "chiSoMoi": 141080,
        "tieuThu": 2680,
        "donVi": "kWh",
        "nguoiGhi": "Khiêm Huỳnh"
    },
    {
        "id": "MET-003",
        "timestamp": "2026-11-10 07:45",
        "ngayChot": "2026-11-10",
        "nguon": "Solar",
        "tenDongHo": "Tổng Inverter Solar Mái Nhà (ELC-DB-Solar-01)",
        "chiSoCu": 84210,
        "chiSoMoi": 85850,
        "tieuThu": 1640,
        "donVi": "kWh",
        "nguoiGhi": "Khiêm Huỳnh"
    },
    {
        "id": "MET-004",
        "timestamp": "2026-11-10 08:00",
        "ngayChot": "2026-11-10",
        "nguon": "Nước Máy",
        "tenDongHo": "Đồng hồ nước thủy cục vào nhà máy (PUMP-WTANK)",
        "chiSoCu": 28410,
        "chiSoMoi": 28565,
        "tieuThu": 155,
        "donVi": "m3",
        "nguoiGhi": "Khiêm Huỳnh"
    },
    {
        "id": "MET-005",
        "timestamp": "2026-11-10 08:00",
        "ngayChot": "2026-11-10",
        "nguon": "Nước Tái Sử Dụng",
        "tenDongHo": "Lưu lượng kế xả thải tự động (WAT-WW)",
        "chiSoCu": 19520,
        "chiSoMoi": 19648,
        "tieuThu": 128,
        "donVi": "m3",
        "nguoiGhi": "Khiêm Huỳnh"
    }
]

# Sheet 12: Audit logs
audit_list = [
    {
        "id": "LOG-001",
        "thoiGian": "2026-11-10 08:30:15",
        "nguoiThaoTac": "Khiêm Huỳnh",
        "hanhDong": "Đăng nhập",
        "chucNang": "Hệ thống CMMS",
        "doiTuong": "Tài khoản ID1460",
        "chiTietNoiDung": "Đăng nhập thành công với vai trò Admin hệ thống."
    },
    {
        "id": "LOG-002",
        "thoiGian": "2026-11-05 14:20:00",
        "nguoiThaoTac": "Đoàn Quang Hùng",
        "hanhDong": "Hoàn thành",
        "chucNang": "Lịch sử bảo trì",
        "doiTuong": "HVAC-AC-G1",
        "chiTietNoiDung": "Lập báo cáo hoàn thành bảo trì máy lạnh nhóm 1 (Nguyễn Xuân Tuyến, Đỗ Hữu Thịnh thực hiện)."
    },
    {
        "id": "LOG-003",
        "thoiGian": "2026-11-04 16:30:00",
        "nguoiThaoTac": "Đoàn Quang Hùng",
        "hanhDong": "Hoàn thành",
        "chucNang": "Lịch sử bảo trì",
        "doiTuong": "HVAC-CH-01",
        "chiTietNoiDung": "Nghiệm thu bảo trì Chiller 01 định kỳ, tự động tính ngày bảo trì kế tiếp: 2026-12-04."
    },
    {
        "id": "LOG-004",
        "thoiGian": "2026-11-04 15:45:00",
        "nguoiThaoTac": "Huỳnh Thiện Khiêm",
        "hanhDong": "Hoàn thành",
        "chucNang": "Lịch sử bảo trì",
        "doiTuong": "HVAC-CH-02",
        "chiTietNoiDung": "Phê duyệt biên bản bảo trì định kỳ Chiller 02, dừng máy 3h, kết quả Hoàn thành."
    }
]

# Email Notification Settings
email_config = {
    "enabled": True,
    "notifyOnNewTicket": True,
    "notifyOnMaintenanceDue": True,
    "notifyOnOverdue": True,
    "primaryRecipient": "khiemhuynhggs@gmail.com",
    "ccRecipients": "doanquanghung@factory.com, truongquangson@factory.com",
    "senderName": "Hệ Thống Quản Lý Bảo Trì CMMS PRO",
    "autoDispatchMethod": "direct_service"
}

email_logs = [
    {
        "id": "EML-2026-11-001",
        "timestamp": "2026-11-09 09:15:30",
        "type": "TICKET_MOI",
        "recipient": "khiemhuynhggs@gmail.com",
        "subject": "[CMMS Alert] Phiếu sự cố mới: Kiểm tra FCU kho hoá chất (Bình thường)",
        "bodySnippet": "Hệ thống vừa ghi nhận phiếu sự cố INC2608191030 cho thiết bị HVAC-FCU-CHEM. Mức độ ưu tiên: Bình thường. Người lập: Quản Trị. Người phụ trách: Đoàn Quang Hùng.",
        "fullContent": "Kính gửi Kỹ sư Thiết bị,\n\nHệ thống CMMS vừa ghi nhận phiếu sự cố mới cần xử lý:\n- Mã Ticket: INC2608191030\n- Tiêu đề: Kiểm tra FCU kho hoá chất\n- Mức độ ưu tiên: Bình thường\n- Người lập: Quản Trị\n- Người phụ trách: Đoàn Quang Hùng\n\nVui lòng đăng nhập hệ thống CMMS để theo dõi và cập nhật tiến độ.",
        "status": "Đã gửi",
        "relatedId": "INC2608191030"
    },
    {
        "id": "EML-2026-11-002",
        "timestamp": "2026-11-10 07:00:12",
        "type": "BAO_TRI_DEN_HAN",
        "recipient": "khiemhuynhggs@gmail.com",
        "subject": "[CMMS Kế Hoạch] Cảnh báo thiết bị tới hạn và quá hạn bảo trì định kỳ",
        "bodySnippet": "Hệ thống phát hiện các thiết bị cần bảo dưỡng định kỳ khẩn cấp: PAU 01, PAU 02, Chiller 01, Máy nén khí GA90-2...",
        "fullContent": "Kính gửi Đội ngũ Kỹ thuật & Vận hành,\n\nĐây là thông báo tự động từ hệ thống quản lý bảo trì CMMS PRO về các thiết bị tới hạn hoặc quá hạn bảo trì định kỳ:\n1. Quạt thông gió nhà điện 1 (HVAC-OAFELC1) - Quá hạn\n2. Quạt thông gió nhà điện 2 (HVAC-OAFELC2) - Quá hạn\n3. PAU 01 (HVAC-PAU-01) - Hạn bảo trì tiếp theo: 2026-11-19\n4. PAU 02 (HVAC-PAU-02) - Hạn bảo trì tiếp theo: 2026-11-19\n\nĐề nghị các kỹ sư phụ trách chuẩn bị vật tư thay thế và thực hiện bảo dưỡng theo quy chuẩn.",
        "status": "Đã gửi",
        "relatedId": "MAINT-BATCH-WEEKLY"
    }
]

# Generate TypeScript code
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
  EmailConfig,
  EmailLog,
}} from '../types/cmms';

// Sheet 1: Danh_sach_thiet_bi (131 equipments from official factory master list)
export const INITIAL_EQUIPMENT: Equipment[] = {json.dumps(equipments, ensure_ascii=False, indent=2)};

// Sheet 2: Ke_hoach_bao_tri (Automatically updated from Lich_su_bao_tri)
export const INITIAL_MAINTENANCE_PLANS: MaintenancePlan[] = {json.dumps(plans, ensure_ascii=False, indent=2)};

// Sheet 3: Lich_su_bao_tri (115 authentic records from Lich_su_bao_tri.csv)
export const INITIAL_MAINTENANCE_HISTORY: MaintenanceHistory[] = {json.dumps(history_records, ensure_ascii=False, indent=2)};

// Sheet 4: Tickets (All 42 authentic tickets from Tickets.csv)
export const INITIAL_TICKETS: Ticket[] = {json.dumps(tickets_list, ensure_ascii=False, indent=2)};

// Sheet 5: Spare_part (Full comprehensive 28 factory spare parts catalog)
export const INITIAL_SPARE_PARTS: SparePart[] = {json.dumps(spare_parts_list, ensure_ascii=False, indent=2)};

// Sheet 6: Kho_xuat_nhap
export const INITIAL_STOCK_TRANSACTIONS: StockTransaction[] = {json.dumps(stock_list, ensure_ascii=False, indent=2)};

// Sheet 7: Dien_10_Ngay
export const INITIAL_POWER_10DAYS: Power10Days[] = {json.dumps(power_10days_list, ensure_ascii=False, indent=2)};

// Sheet 8: Quan_ly_chi_phi
export const INITIAL_COST_RECORDS: CostRecord[] = {json.dumps(cost_list, ensure_ascii=False, indent=2)};

// Sheet 9: Nuoc_month
export const INITIAL_WATER_MONTHLY: WaterMonthly[] = {json.dumps(water_list, ensure_ascii=False, indent=2)};

// Sheet 10: Nhan_vien (Authentic factory engineering staff with credentials and rules)
export const INITIAL_EMPLOYEES: Employee[] = {json.dumps(employees, ensure_ascii=False, indent=2)};

// Sheet 11: Dien_Nuoc
export const INITIAL_METER_READINGS: MeterReading[] = {json.dumps(meters_list, ensure_ascii=False, indent=2)};

// Sheet 12: Log_He_thong
export const INITIAL_AUDIT_LOGS: AuditLog[] = {json.dumps(audit_list, ensure_ascii=False, indent=2)};

// Email Notification Settings
export const INITIAL_EMAIL_CONFIG: EmailConfig = {json.dumps(email_config, ensure_ascii=False, indent=2)};

// Initial Outbox / Email Logs
export const INITIAL_EMAIL_LOGS: EmailLog[] = {json.dumps(email_logs, ensure_ascii=False, indent=2)};
'''

with open('src/data/initialData.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print(f"Generated src/data/initialData.ts with {len(equipments)} equipments, {len(plans)} plans, {len(history_records)} history records, {len(tickets_list)} tickets, {len(spare_parts_list)} spare parts, {len(employees)} employees.")
