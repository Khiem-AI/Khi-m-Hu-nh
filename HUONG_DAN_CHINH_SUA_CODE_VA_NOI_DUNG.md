# HƯỚNG DẪN CHỈNH SỬA CODE & NỘI DUNG HIỂN THỊ (FACILITY SYSTEM MANAGEMENT)

Tài liệu này hướng dẫn cách chỉnh sửa giao diện chữ, dữ liệu khởi tạo, biểu giá năng lượng, quy tắc phân quyền, công thức dự báo chi phí, mẫu xuất Excel và quy trình thêm tính năng mới có **tự động cập nhật tài liệu**.

> **Cơ chế tự động cập nhật**: Khi thêm phân hệ mới, component mới hoặc chạy `npm run sync-docs` / `npm run build`, cây thư mục mã nguồn và bảng ánh xạ tính năng dưới đây sẽ tự động cập nhật theo file thực tế trong dự án.

---

## 1. Cấu Trúc Thư Mục Mã Nguồn (Tự Động Đồng Bộ)

<!-- AUTO-SYNC:REPO-TREE:START -->
#### Tệp gốc & Cấu hình
- `index.html`: Tiêu đề trang web (<title>), thẻ meta SEO & font chữ hệ thống
- `metadata.json`: Tên, mô tả và quyền truy cập thiết bị (camera)
- `package.json`: Danh sách thư viện & lệnh build/dev/lint/sync-docs
- `vite.config.ts`: Cấu hình Vite, React, Tailwind v4 & cổng dev server 3000

#### Cấu hình UI (`src/config`)
- `src/config/uiTexts.ts`: [QUAN TRỌNG] Toàn bộ nội dung chữ, tên menu & nhãn form giao diện

#### Kiểu dữ liệu (`src/types`)
- `src/types/cmms.ts`: Định nghĩa kiểu dữ liệu (Interface), APP_VIEW_OPTIONS & hằng số điện/nước

#### Dữ liệu mẫu (`src/data`)
- `src/data/equipment_parsed.json`: Dữ liệu danh sách thiết bị gốc đã chuẩn hóa JSON
- `src/data/initialData.ts`: Dữ liệu mẫu ban đầu (Thiết bị, Nhân viên, Vật tư, Dự án, Kiểm định, Dụng cụ...)

#### State & Context (`src/context`)
- `src/context/CMMSContext.tsx`: State trung tâm, LocalStorage, đăng nhập, phân quyền, Email & Sao lưu

#### Nghiệp vụ & Tính toán (`src/utils`)
- `src/utils/cmmsLogic.test.ts`: Unit test kiểm tra logic nghiệp vụ CMMS
- `src/utils/cmmsLogic.ts`: Nghiệp vụ chu kỳ bảo trì/kiểm định, tách người thực hiện, phân quyền & tiến độ dự án
- `src/utils/costForecasting.ts`: Mô hình dự báo chi phí bảo trì 6 tháng & hồi quy tuyến tính (OLS)
- `src/utils/excelExport.ts`: Xuất Excel (.xlsx) đa Sheet định dạng đẹp kèm khung ký duyệt
- `src/utils/imageUtils.tsx`: Xử lý ảnh Google Drive, nén ảnh chụp và ảnh dự phòng

#### Layout & Modals (`src/components`)
- `src/components/BackupDataModal.tsx`: Trung tâm Sao lưu JSON/Excel/Google Drive & Khôi phục (ID1460 / Owner)
- `src/components/CostModal.tsx`: Ghi nhận / Sửa chứng từ chi phí
- `src/components/CostPredictiveAnalysis.tsx`: Phân tích & biểu đồ D3 xu hướng dự báo chi phí 6 tháng tới
- `src/components/EquipmentDetailModal.tsx`: Xem chi tiết thông số kỹ thuật & lịch sử thiết bị
- `src/components/EquipmentModal.tsx`: Thêm / Sửa thiết bị và chụp ảnh
- `src/components/Header.tsx`: Thanh Header, Quét QR, Nền Sáng/Tối, Chuông cảnh báo, Sao lưu & Tài khoản
- `src/components/LoginPage.tsx`: Màn hình đăng nhập & quy tắc xác thực
- `src/components/MaintenanceExecutionModal.tsx`: Biên bản hoàn tất bảo trì/sửa chữa, chụp ảnh trước/sau & tự tạo kỳ tiếp
- `src/components/MeterReadingModal.tsx`: Chốt chỉ số đồng hồ Điện - Nước hàng ngày
- `src/components/Navigation.tsx`: Sidebar điều hướng trái, lọc theo phân quyền & huy hiệu đếm thời gian thực
- `src/components/QRModal.tsx`: Xem & In tem mã QR thiết bị
- `src/components/QRScannerModal.tsx`: Quét mã QR bằng camera hoặc nhập tay mã thiết bị
- `src/components/SparePartModal.tsx`: Thêm / Sửa danh mục phụ tùng kho
- `src/components/StockTransactionModal.tsx`: Phiếu Nhập kho / Xuất kho sử dụng / Hoàn kho
- `src/components/TicketModal.tsx`: Tạo / Cập nhật phiếu sự cố (chọn nhiều người & ảnh trước/sau)

#### Component dùng chung (`src/components/common`)
- `src/components/common/CameraCaptureInput.tsx`: Component chụp ảnh camera hoặc tải tệp ảnh
- `src/components/common/MultiAssigneePicker.tsx`: Bộ chọn nhiều nhân viên thực hiện cùng lúc
- `src/components/common/NumericInput.tsx`: Ô nhập số định dạng chuẩn
- `src/components/common/SmartHorizontalScroll.tsx`: Thanh cuộn ngang đồng bộ đầu/cuối bảng dữ liệu lớn
- `src/components/common/WorkAssignmentModal.tsx`: Form Giao việc nhiều người & gửi Email thông báo

#### Biểu đồ Dashboard (`src/components/dashboard`)
- `src/components/dashboard/MaintenanceD3Summary.tsx`: Biểu đồ D3 phân tích quá hạn & lịch trọng điểm trên Dashboard

#### Phân hệ Năng lượng (`src/components/energy`)
- `src/components/energy/DailyPowerModal.tsx`: Nhập liệu chỉ số điện hàng ngày
- `src/components/energy/DailyReadingsWithAlerts.tsx`: Bảng chỉ số điện/nước hàng ngày & cảnh báo vượt ngưỡng
- `src/components/energy/EnergyCompareDashboard.tsx`: Dashboard phân tích & so sánh tiêu thụ điện EVN / Solar theo khung giờ
- `src/components/energy/Power10DaysModal.tsx`: Nhập liệu điện chu kỳ 10 ngày
- `src/components/energy/TariffConfigModal.tsx`: Cấu hình đơn giá điện EVN, Solar, Nước & tỷ giá USD
- `src/components/energy/WaterRecordingModal.tsx`: Nhập liệu chỉ số nước tháng

#### Các Tab chức năng (`src/components/tabs`)
- `src/components/tabs/AdminDashboardTab.tsx`: Dashboard Admin D3: OEE, MTBF, MTTR & tỷ lệ PM/CM (Chỉ Admin)
- `src/components/tabs/AuditLogTab.tsx`: Nhật ký tác động toàn hệ thống
- `src/components/tabs/CostTab.tsx`: Quản lý chi phí & Phân tích dự báo ngân sách 6 tháng tới
- `src/components/tabs/DashboardTab.tsx`: Tổng quan O&M, KPI, công việc của tôi & lịch 30 ngày
- `src/components/tabs/DocumentsTab.tsx`: Tra cứu tài liệu SOP, File & Checklist tương tác
- `src/components/tabs/EmailAlertsTab.tsx`: Cấu hình sự kiện gửi Email & nhật ký Email đã gửi
- `src/components/tabs/EmployeePerformanceTab.tsx`: Đánh giá hiệu quả nhân viên & biểu đồ D3 (Chỉ Admin)
- `src/components/tabs/EmployeesTab.tsx`: Quản lý nhân sự & phân quyền View theo tài khoản
- `src/components/tabs/EnergyTab.tsx`: Giám sát & phân tích năng lượng Điện - Nước
- `src/components/tabs/EquipmentTab.tsx`: Danh mục máy móc thiết bị & QR Code
- `src/components/tabs/MaintenanceTab.tsx`: Kế hoạch định kỳ, Lịch sử (Bảo trì vs Sửa chữa), Lịch kéo thả & Xuất Excel
- `src/components/tabs/MyTasksTab.tsx`: Danh sách công việc được giao cho tài khoản đang đăng nhập
- `src/components/tabs/ProjectsTab.tsx`: Quản lý Dự án kỹ thuật (WBS, Kanban, Cột mốc, Rủi ro, Ngân sách)
- `src/components/tabs/SafetyInspectionTab.tsx`: Quản lý Kiểm định an toàn & Hiệu chuẩn có nhắc lịch & gửi mail tự động
- `src/components/tabs/SparePartsTab.tsx`: Kho phụ tùng & Nhật ký xuất nhập kho
- `src/components/tabs/TicketsTab.tsx`: Quản lý Tickets sự cố & sửa chữa
- `src/components/tabs/ToolsManagementTab.tsx`: Quản lý Dụng cụ & Đồ nghề, sổ Mượn/Trả & hạn hiệu chuẩn

#### Scripts tự động hóa (`scripts`)
- `scripts/build_real_cmms_data.py`: Script Python tạo dữ liệu thiết bị & lịch sử thực tế từ CSV
- `scripts/generate_cmms_dataset.py`: Script Python sinh bộ dữ liệu mẫu CMMS
- `scripts/generate_complete_cmms_dataset.py`: Script Python tổng hợp dữ liệu CMMS đầy đủ
- `scripts/generate_full_cmms.py`: Script Python khởi tạo dữ liệu nhà máy đầy đủ
- `scripts/parseEquipment.cjs`: Script Node.js phân tích dữ liệu thiết bị từ bảng CSV
- `scripts/seedData.cjs`: Script Node.js nạp dữ liệu khởi tạo
- `scripts/syncDocs.ts`: Script tự động đồng bộ tài liệu hướng dẫn khi mã nguồn thay đổi
- `scripts/update_dataset.py`: Script Python cập nhật bộ dữ liệu CMMS
- `scripts/updateInitialData.cjs`: Script Node.js cập nhật src/data/initialData.ts
<!-- AUTO-SYNC:REPO-TREE:END -->

---

## 2. Bản Đồ Phân Hệ & Cấu Hình Hiện Hành (Tự Động Đồng Bộ)

<!-- AUTO-SYNC:FEATURE-MATRIX:START -->
- **`CMMS_DATA_VERSION` hiện hành**: `v18_calendar_dnd_inspection_tools`
- **`ADMIN_ONLY_VIEWS` hiện hành**: `admin_dashboard`, `employee_performance`
- **Biểu giá điện/nước mặc định (`DEFAULT_ENERGY_TARIFF_CONFIG`)**: EVN BT `1738` đ · CĐ `3171` đ · TĐ `1133` đ · Nước `15000` đ/m³ · Nước thải `7500` đ/m³ · Tỷ giá `25400` đ/USD

| Mã View (`APP_VIEW_OPTIONS`) | Nhãn Menu (`UI_TEXTS`) | Component | File Nguồn |
| :--- | :--- | :--- | :--- |
| `dashboard` | Tổng Quan O&M | `DashboardTab` | `src/components/tabs/DashboardTab.tsx` |
| `admin_dashboard` | Dashboard Admin | `AdminDashboardTab` | `src/components/tabs/AdminDashboardTab.tsx` |
| `my_tasks` | Việc Được Giao | `MyTasksTab` | `src/components/tabs/MyTasksTab.tsx` |
| `equipment` | Danh Sách Thiết Bị | `EquipmentTab` | `src/components/tabs/EquipmentTab.tsx` |
| `maintenance` | Kế Hoạch & Lịch Sử | `MaintenanceTab` | `src/components/tabs/MaintenanceTab.tsx` |
| `inspection_calibration` | Kiểm Định & Hiệu Chuẩn | `SafetyInspectionTab` | `src/components/tabs/SafetyInspectionTab.tsx` |
| `tools` | Dụng Cụ & Đồ Nghề | `ToolsManagementTab` | `src/components/tabs/ToolsManagementTab.tsx` |
| `tickets` | Quản Lý Tickets | `TicketsTab` | `src/components/tabs/TicketsTab.tsx` |
| `projects` | Quản Lý Dự Án | `ProjectsTab` | `src/components/tabs/ProjectsTab.tsx` |
| `spare_parts` | Kho Phụ Tùng | `SparePartsTab` | `src/components/tabs/SparePartsTab.tsx` |
| `documents` | Tra Cứu Tài Liệu | `DocumentsTab` | `src/components/tabs/DocumentsTab.tsx` |
| `energy` | Năng Lượng Điện - Nước | `EnergyTab` | `src/components/tabs/EnergyTab.tsx` |
| `costs` | Quản Lý Chi Phí | `CostTab` | `src/components/tabs/CostTab.tsx` |
| `employees` | Nhân Viên & Phân Quyền | `EmployeesTab` | `src/components/tabs/EmployeesTab.tsx` |
| `employee_performance` | Đánh Giá Hiệu Quả NV | `EmployeePerformanceTab` | `src/components/tabs/EmployeePerformanceTab.tsx` |
| `logs` | Nhật Ký Hệ Thống | `AuditLogTab` | `src/components/tabs/AuditLogTab.tsx` |
| `email_alerts` | Thông Báo Email | `EmailAlertsTab` | `src/components/tabs/EmailAlertsTab.tsx` |
<!-- AUTO-SYNC:FEATURE-MATRIX:END -->

---

## 3. Cách Tự Sửa Nội Dung Hiển Thị Trên Giao Diện

Mở file **`src/config/uiTexts.ts`**. Toàn bộ tên hệ thống, tên menu, tiêu đề từng trang và nhãn form giao việc nằm trong `UI_TEXTS`:

```ts
export const UI_TEXTS = {
  brand: {
    appName: 'FACILITY SYSTEM MANAGEMENT', // Tên trên Header & Login
    subtitle: '',                          // Để '' nếu muốn ẩn mô tả phụ
  },
  navigation: {
    sectionTitle: 'Phân Hệ Quản Lý',
    items: {
      dashboard: { label: 'Tổng Quan O&M', desc: '' },
      inspection_calibration: { label: 'Kiểm Định & Hiệu Chuẩn', desc: '' },
      tools: { label: 'Dụng Cụ & Đồ Nghề', desc: '' },
      // ...
    },
  },
};
```

- **Đổi tên Menu**: Sửa `label` trong `UI_TEXTS.navigation.items.<ma_menu>` và đồng bộ trong `APP_VIEW_OPTIONS` tại **`src/types/cmms.ts`** để tên trong bảng Phân quyền View khớp với Sidebar.
- **Đổi tiêu đề trang / nút form**: Sửa trong `UI_TEXTS.dashboard`, `UI_TEXTS.tabs`, `UI_TEXTS.workAssignment`.
- **Ẩn chú thích**: Đặt giá trị chuỗi rỗng `''`.

---

## 4. Cách Chỉnh Sửa Dữ Liệu Khởi Tạo (`src/data/initialData.ts`)

Các mảng dữ liệu mẫu chính trong **`src/data/initialData.ts`**:
- `INITIAL_EQUIPMENT`: Danh sách thiết bị và mã QR.
- `INITIAL_MAINTENANCE_PLANS` & `INITIAL_MAINTENANCE_HISTORY`: Kế hoạch & lịch sử bảo trì/sửa chữa.
- `INITIAL_SAFETY_INSPECTIONS`: Danh sách thiết bị kiểm định an toàn / hiệu chuẩn.
- `INITIAL_TOOLS` & `INITIAL_TOOL_LOGS`: Dụng cụ đồ nghề & nhật ký mượn/trả.
- `INITIAL_PROJECTS`: Danh sách dự án kỹ thuật (WBS, cột mốc, rủi ro, chi phí).
- `INITIAL_TICKETS`, `INITIAL_SPARE_PARTS`, `INITIAL_STOCK_TRANSACTIONS`, `INITIAL_COST_RECORDS`.
- `INITIAL_EMPLOYEES`: Tài khoản nhân sự (bao gồm `ID1460`, `ID0344` Tuấn Lê — Người quản lý...).
- `INITIAL_POWER_10DAYS` & `INITIAL_WATER_MONTHLY`: Dữ liệu điện 10 ngày và nước tháng.

> **Lưu ý về bộ nhớ trình duyệt (`localStorage`)**:
> Trình duyệt lưu dữ liệu đang dùng theo khóa phiên bản `CMMS_DATA_VERSION` trong **`src/context/CMMSContext.tsx`**.
> Sau khi sửa dữ liệu mẫu trong `initialData.ts`, hãy **đổi tên chuỗi `CMMS_DATA_VERSION`** (ví dụ từ `'v18_...'` sang `'v19_...'`) để trình duyệt tự nạp lại bộ dữ liệu mẫu mới.

---

## 5. Cách Điều Chỉnh Nghiệp Vụ & Công Thức Tính Toán

### A. Phân quyền Admin, Quản lý & Sao lưu (`src/utils/cmmsLogic.ts`)
- **Quyền Sao lưu (`canAccessBackup`)**: Hiện giới hạn cho `ID1460` và chức vụ `Owner`.
- **Quyền cấp Admin (`isAdminLevel` & `ADMIN_ONLY_VIEWS`)**: Mặc định khóa riêng cho Admin/Owner đối với `admin_dashboard` và `employee_performance`.
- **Chu kỳ bảo trì & Kiểm định**:
  - `calculateNextMaintenanceDate`, `getMaintenanceStatus`, `syncPlansWithHistory`.
  - `getHistoryWorkType`: Phân loại `'Bảo trì theo kế hoạch'` vs `'Sửa chữa'` (nếu là sửa chữa sẽ không đẩy lịch kỳ bảo trì tiếp theo).
  - `getInspectionStatus`, `getInspectionDaysRemaining`, `calculateNextInspectionDate`: Tính hạn kiểm định và số ngày nhắc trước (`nhacTruocNgay`).

### B. Mô hình Dự Báo Chi Phí Bảo Trì 6 Tháng (`src/utils/costForecasting.ts` & `src/components/CostPredictiveAnalysis.tsx`)
- Hàm `buildSixMonthCostForecast` tổng hợp dữ liệu thực tế từ `costRecords`, `stockTransactions` (`Xuất kho sử dụng` × `donGia`) và `maintenanceHistory` theo cửa sổ `lookbackMonths` (`3` hoặc `6` tháng), kết hợp làm mượt trung bình/trung vị (`0.55 * mean + 0.45 * median`).
- Chi phí bảo trì tương lai được tính bằng cách duyệt chu kỳ từng `MaintenancePlan` + lịch `safetyInspections` qua 6 tháng tới, cộng với đường hồi quy tuyến tính OLS (`computeLinearRegression`) và biên độ tin cậy mở rộng dần (`10%` → `22%`).
- Để chỉnh chi phí định mức mặc định khi thiết bị chưa có lịch sử chi phí, sửa hàm `getDefaultCycleUnitCost` trong **`src/utils/costForecasting.ts`**.

### C. KPI Dashboard Admin OEE / MTBF / MTTR (`src/components/tabs/AdminDashboardTab.tsx`)
- Công thức Availability, Performance, Quality (`OEE = A × P × Q`), MTBF (giờ) và MTTR (phút) nằm trong khối `useMemo` chính của `AdminDashboardTab.tsx`.
- Ngưỡng chuẩn thế giới (World-Class OEE `85%`) được vẽ trên biểu đồ đồng hồ D3 trong cùng file.

### D. Biểu Giá Điện EVN, Solar, Nước (`src/types/cmms.ts` & `src/components/energy/`)
- Đơn giá mặc định: `DEFAULT_ENERGY_TARIFF_CONFIG` trong **`src/types/cmms.ts`**.
- Danh sách đồng hồ: `EVN_DAILY_PANEL_METERS`, `SOLAR_DAILY_PANEL_METERS`, `WATER_DAILY_METERS` trong **`src/types/cmms.ts`**.
- Logic tính chi phí điện 3 khung giờ & so sánh kỳ: **`src/components/energy/EnergyCompareDashboard.tsx`**, **`src/components/tabs/EnergyTab.tsx`** và **`src/components/energy/TariffConfigModal.tsx`**.

### E. Lịch Bảo Trì Kéo Thả & Nhắc Lịch Kiểm Định Tự Động (`src/context/CMMSContext.tsx`)
- Hàm `rescheduleMaintenancePlan(planId, newDate)` xử lý kéo thả đổi lịch trong `MaintenanceTab.tsx` và đồng bộ `equipment.hanBaoTriTiepTheo`.
- Hàm `triggerInspectionDueAlerts(isAuto)` và `useEffect` theo dõi `AUTO-INSPECTION-REMINDER` chịu trách nhiệm tự động gửi email nhắc lịch kiểm định mỗi ngày.

### F. Chấm Điểm Nhân Viên & Xuất Excel
- **Điểm hiệu quả nhân viên**: chỉnh trọng số tại **`src/components/tabs/EmployeePerformanceTab.tsx`** (`50% Hoàn thành + 30% Đạt chuẩn + 20% Kỷ luật đúng hạn`).
- **Mẫu Excel (`.xlsx`)**: chỉnh tiêu đề cột, tên Sheet và khung ký duyệt in ấn trong **`src/utils/excelExport.ts`**.

---

## 6. Cách Sửa Màu Sắc, Giao Diện Sáng/Tối & Font Chữ

- Toàn bộ giao diện sử dụng **Tailwind CSS v4** trong từng component (`src/components/**`).
- Quy tắc chuyển đổi **Nền Sáng (`html.light`)** và font chữ (`Plus Jakarta Sans`, `JetBrains Mono`) nằm tại **`src/index.css`**.
- Tiêu đề trang trình duyệt (`<title>`) và thẻ `<meta>` nằm tại **`index.html`**.

---

## 7. Quy Trình Thêm Tính Năng Mới & Tự Động Cập Nhật Tài Liệu

Mỗi khi bạn bổ sung một tính năng hoặc phân hệ (Tab) mới vào app:

1. Tạo component Tab mới trong `src/components/tabs/TenTabMoi.tsx`.
2. Đăng ký mã `id` phân hệ vào `APP_VIEW_OPTIONS` trong **`src/types/cmms.ts`** và `UI_TEXTS.navigation.items` trong **`src/config/uiTexts.ts`**.
3. Gắn icon & mục menu trong **`src/components/Navigation.tsx`** và render tab theo `activeTab` trong **`src/App.tsx`**.
4. Chạy lệnh đồng bộ tài liệu (hoặc chạy `npm run build` — script `prebuild` sẽ tự chạy bước này):
   ```bash
   npm run sync-docs
   ```
   Script **`scripts/syncDocs.ts`** sẽ tự động quét mã nguồn và cập nhật ngay lập tức cả **`HUONG_DAN_SU_DUNG_APP.md`** lẫn **`HUONG_DAN_CHINH_SUA_CODE_VA_NOI_DUNG.md`** với phân hệ mới, đường dẫn file mới và thông số cấu hình hiện hành.

---

## 8. Lệnh Kiểm Tra & Đóng Gói

- **Cài đặt thư viện**: `npm install`
- **Chạy môi trường phát triển (cổng 3000)**: `npm run dev`
- **Đồng bộ thủ công tài liệu hướng dẫn**: `npm run sync-docs`
- **Kiểm tra lỗi TypeScript**: `npm run lint`
- **Biên dịch bản Production (tự đồng bộ docs trước khi build)**: `npm run build`
