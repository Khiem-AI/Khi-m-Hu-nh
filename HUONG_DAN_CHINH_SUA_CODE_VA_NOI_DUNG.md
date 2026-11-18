# HƯỚNG DẪN CHỈNH SỬA CODE & NỘI DUNG HIỂN THỊ (FACILITY SYSTEM MANAGEMENT)

Tài liệu này hướng dẫn chi tiết cấu trúc mã nguồn mới nhất, cách chỉnh sửa giao diện chữ, dữ liệu khởi tạo, biểu giá năng lượng, ma trận phân quyền RBAC, công việc đầu ngày, hệ thống gửi Email HTML / thông báo Web, đồng bộ Firebase Firestore, công thức dự báo chi phí, mẫu xuất Excel và quy trình thêm tính năng mới có **tự động cập nhật tài liệu**.

> **Cơ chế tự động cập nhật**: Khi thêm phân hệ mới, component mới hoặc chạy `npm run sync-docs` / `npm run build`, cây thư mục mã nguồn và bảng ánh xạ tính năng dưới đây sẽ tự động cập nhật theo file thực tế trong dự án.

---

## 1. Cấu Trúc Thư Mục Mã Nguồn (Tự Động Đồng Bộ)

<!-- AUTO-SYNC:REPO-TREE:START -->
#### Tệp gốc & Cấu hình
- `index.html`: Tiêu đề trang web (<title>), thẻ meta SEO & font chữ hệ thống
- `metadata.json`: Tên, mô tả và quyền truy cập thiết bị (camera)
- `package.json`: Danh sách thư viện & lệnh build/dev/start/lint/sync-docs
- `vite.config.ts`: Cấu hình Vite, React, Tailwind v4 & cổng dev server 3000
- `server.ts`: Express server tích hợp Vite dev middleware, API gửi Email (/api/send-email) & chống gửi trùng trong ngày
- `firestore.rules`: Quy tắc bảo mật Cloud Firestore theo RBAC & schema validation
- `firebase-blueprint.json`: Bản thiết kế schema toàn bộ collection Firestore
- `.env.example`: Mẫu biến môi trường (NODE_ENV, SMTP, RESEND_API_KEY, EMAIL_WEBHOOK_URL...)

#### Cấu hình UI (`src/config`)
- `src/config/uiTexts.ts`: [QUAN TRỌNG] Toàn bộ nội dung chữ, tên menu & nhãn form giao diện

#### Kiểu dữ liệu (`src/types`)
- `src/types/cmms.ts`: Định nghĩa kiểu dữ liệu (Interface), APP_VIEW_OPTIONS, DailyAreaCheck & hằng số điện/nước

#### Dữ liệu mẫu (`src/data`)
- `src/data/equipment_parsed.json`: Dữ liệu danh sách thiết bị gốc đã chuẩn hóa JSON
- `src/data/initialData.ts`: Dữ liệu mẫu ban đầu (Thiết bị, Nhân viên, Vật tư, Dự án, Kiểm định, Dụng cụ, Công việc đầu ngày...)

#### State & Context (`src/context`)
- `src/context/CMMSContext.tsx`: State trung tâm, LocalStorage, Firestore sync, đăng nhập, phân quyền, Email/Web Notification & Sao lưu

#### Nghiệp vụ & Tính toán (`src/utils`)
- `src/utils/cmmsLogic.test.ts`: Unit test kiểm tra logic nghiệp vụ CMMS
- `src/utils/cmmsLogic.ts`: Nghiệp vụ chu kỳ bảo trì/kiểm định, tách người thực hiện, phân quyền RBAC (chi phí/xóa/CSV/kế hoạch) & tiến độ dự án
- `src/utils/codeExport.ts`: Tiện ích xuất/tải mã nguồn hoặc cấu hình
- `src/utils/costForecasting.ts`: Mô hình dự báo chi phí bảo trì 6 tháng & hồi quy tuyến tính (OLS)
- `src/utils/emailTemplates.ts`: Trình dựng mẫu Email HTML chuyên nghiệp chuẩn màu sắc theo loại cảnh báo
- `src/utils/excelExport.ts`: Xuất Excel (.xlsx) đa Sheet định dạng đẹp kèm khung ký duyệt
- `src/utils/firebaseClient.ts`: Khởi tạo Firebase App, Firestore & Google Auth từ cấu hình dự án
- `src/utils/firestoreSync.ts`: Sanitizer payload, đồng bộ snapshot & real-time listener với Cloud Firestore
- `src/utils/gmailAuth.ts`: Xác thực OAuth phía client để gửi email qua Gmail API
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
- `src/components/common/EmailDispatchModal.tsx`: Hộp thoại xem trước nội dung Email HTML và chọn kênh gửi
- `src/components/common/GoogleSignInButton.tsx`: Nút đăng nhập / kết nối tài khoản Google đồng bộ Cloud
- `src/components/common/MultiAssigneePicker.tsx`: Bộ chọn nhiều nhân viên thực hiện cùng lúc
- `src/components/common/NumericInput.tsx`: Ô nhập số định dạng chuẩn
- `src/components/common/SmartHorizontalScroll.tsx`: Thanh cuộn ngang đồng bộ đầu/cuối bảng dữ liệu lớn
- `src/components/common/WebNotificationToast.tsx`: Hiển thị thông báo nổi trực tiếp trên Web (miễn phí)
- `src/components/common/WorkAssignmentModal.tsx`: Form Giao việc nhiều người & gửi Email thông báo

#### Biểu đồ Dashboard (`src/components/dashboard`)
- `src/components/dashboard/MaintenanceD3Summary.tsx`: Biểu đồ D3 phân tích quá hạn & lịch trọng điểm trên Dashboard

#### Phân hệ Năng lượng (`src/components/energy`)
- `src/components/energy/DailyPowerModal.tsx`: Nhập liệu chỉ số điện hàng ngày
- `src/components/energy/DailyReadingsWithAlerts.tsx`: Bảng chỉ số điện/nước hàng ngày & cảnh báo vượt ngưỡng
- `src/components/energy/EnergyCompareDashboard.tsx`: Dashboard phân tích & so sánh tiêu thụ điện EVN / Solar theo khung giờ
- `src/components/energy/MeterReadingEditModal.tsx`: Chỉnh sửa bản ghi chỉ số đồng hồ điện/nước đã chốt
- `src/components/energy/MonthlyEnergyTrendChart.tsx`: Biểu đồ xu hướng tiêu thụ điện năng theo tháng
- `src/components/energy/Power10DaysModal.tsx`: Nhập liệu điện chu kỳ 10 ngày
- `src/components/energy/TariffConfigModal.tsx`: Cấu hình đơn giá điện EVN, Solar, Nước & tỷ giá USD
- `src/components/energy/WaterCompareDashboard.tsx`: Dashboard phân tích & so sánh tiêu thụ nước theo kỳ
- `src/components/energy/WaterRecordingModal.tsx`: Nhập liệu chỉ số nước tháng

#### Các Tab chức năng (`src/components/tabs`)
- `src/components/tabs/AdminDashboardTab.tsx`: Dashboard Admin D3: OEE, MTBF, MTTR & tỷ lệ PM/CM (Chỉ Admin)
- `src/components/tabs/AuditLogTab.tsx`: Nhật ký tác động toàn hệ thống (hiển thị chính xác ID & tên tài khoản, xuất CSV)
- `src/components/tabs/CostTab.tsx`: Quản lý chi phí & Phân tích dự báo ngân sách 6 tháng tới (ẩn với KTV)
- `src/components/tabs/DashboardTab.tsx`: Tổng quan O&M, KPI, công việc của tôi, lịch 30 ngày & nút Download CSV (ẩn với Kỹ thuật viên)
- `src/components/tabs/DocumentsTab.tsx`: Tra cứu tài liệu SOP, File & Checklist tương tác (ẩn xóa với KTV)
- `src/components/tabs/EmailAlertsTab.tsx`: Cấu hình thông báo Web miễn phí & Email tự động, mẫu HTML & nhật ký gửi
- `src/components/tabs/EmployeePerformanceTab.tsx`: Đánh giá hiệu quả nhân viên & biểu đồ D3 (Chỉ Admin)
- `src/components/tabs/EmployeesTab.tsx`: Quản lý nhân sự & phân quyền View theo tài khoản
- `src/components/tabs/EnergyTab.tsx`: Giám sát & phân tích năng lượng Điện - Nước
- `src/components/tabs/EquipmentTab.tsx`: Danh mục máy móc thiết bị & QR Code (Kỹ thuật viên chỉ sửa, không xóa)
- `src/components/tabs/MaintenanceTab.tsx`: Kế hoạch định kỳ (KTV chỉ xem), Lịch sử (Bảo trì vs Sửa chữa), Lịch kéo thả & Xuất Excel
- `src/components/tabs/MorningChecksTab.tsx`: Công việc đầu ngày: phân quyền kiểm tra Vòng trong, Vòng Ngoài, Phòng Utility & ghi nhận báo cáo
- `src/components/tabs/MyTasksTab.tsx`: Danh sách công việc được giao cho tài khoản đang đăng nhập
- `src/components/tabs/ProfileTab.tsx`: Hồ sơ cá nhân, phép năm & đổi mật khẩu
- `src/components/tabs/ProjectsTab.tsx`: Quản lý Dự án kỹ thuật (WBS, Kanban, Cột mốc, Rủi ro, Ngân sách — ẩn xóa & chi phí với KTV)
- `src/components/tabs/SafetyInspectionTab.tsx`: Quản lý Kiểm định an toàn & Hiệu chuẩn có nhắc lịch & gửi mail tự động
- `src/components/tabs/SparePartsTab.tsx`: Kho phụ tùng & Nhật ký xuất nhập kho (ẩn giá & xóa với KTV)
- `src/components/tabs/TicketsTab.tsx`: Quản lý Tickets sự cố & sửa chữa (KTV chỉ sửa, không xóa)
- `src/components/tabs/ToolsManagementTab.tsx`: Quản lý Dụng cụ & Đồ nghề, sổ Mượn/Trả & hạn hiệu chuẩn (KTV chỉ sửa, không xóa)

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
| `morning_checks` | Công Việc Đầu Ngày | `MorningChecksTab` | `src/components/tabs/MorningChecksTab.tsx` |
| `profile` | Hồ Sơ Cá Nhân | `ProfileTab` | `src/components/tabs/ProfileTab.tsx` |
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
      morning_checks: { label: 'Công Việc Đầu Ngày', desc: '' },
      inspection_calibration: { label: 'Kiểm Định & Hiệu Chuẩn', desc: '' },
      tools: { label: 'Dụng Cụ & Đồ Nghề', desc: '' },
      // ...
    },
  },
};
```

- **Đổi tên Menu**: Sửa `label` trong `UI_TEXTS.navigation.items.<ma_menu>` và đồng bộ trong `APP_VIEW_OPTIONS` tại **`src/types/cmms.ts`** để tên trong bảng Phân quyền View khớp với Sidebar.
- **Đổi tiêu đề trang / nút form**: Sửa trong `UI_TEXTS.dashboard`, `UI_TEXTS.tabs` (bao gồm `tabs.morningChecks`, `tabs.profile`...), `UI_TEXTS.workAssignment`.
- **Ẩn chú thích**: Đặt giá trị chuỗi rỗng `''`.

---

## 4. Cách Chỉnh Sửa Dữ Liệu Khởi Tạo (`src/data/initialData.ts`)

Các mảng dữ liệu mẫu chính trong **`src/data/initialData.ts`**:
- `INITIAL_EQUIPMENT`: Danh sách thiết bị và mã QR.
- `INITIAL_MAINTENANCE_PLANS` & `INITIAL_MAINTENANCE_HISTORY`: Kế hoạch & lịch sử bảo trì/sửa chữa.
- `INITIAL_SAFETY_INSPECTIONS`: Danh sách thiết bị kiểm định an toàn / hiệu chuẩn.
- `INITIAL_TOOLS` & `INITIAL_TOOL_LOGS`: Dụng cụ đồ nghề & nhật ký mượn/trả.
- `INITIAL_DAILY_AREA_CHECKS`: Mẫu công việc đầu ngày cho 3 khu vực (`Vòng trong`, `Vòng Ngoài`, `Phòng Utility`).
- `INITIAL_PROJECTS`: Danh sách dự án kỹ thuật (WBS, cột mốc, rủi ro, chi phí).
- `INITIAL_TICKETS`, `INITIAL_SPARE_PARTS`, `INITIAL_STOCK_TRANSACTIONS`, `INITIAL_COST_RECORDS`, `INITIAL_DOCUMENTS`.
- `INITIAL_EMPLOYEES`: Tài khoản nhân sự (bao gồm `ID1460` Khiem Huynh — Admin, `ID0344` Tuấn Lê — Người quản lý, cùng các kỹ thuật viên).
- `INITIAL_POWER_10DAYS` & `INITIAL_WATER_MONTHLY`: Dữ liệu điện 10 ngày và nước tháng.

> **Lưu ý về bộ nhớ trình duyệt (`localStorage`)**:
> Trình duyệt lưu dữ liệu đang dùng theo khóa phiên bản `CMMS_DATA_VERSION` trong **`src/context/CMMSContext.tsx`**.
> Sau khi sửa dữ liệu mẫu trong `initialData.ts`, hãy **đổi tên chuỗi `CMMS_DATA_VERSION`** để trình duyệt tự nạp lại bộ dữ liệu mẫu mới.

---

## 5. Cách Điều Chỉnh Phân Quyền, Nghiệp Vụ & Công Thức Tính Toán

### A. Hệ Thống Phân Quyền RBAC (`src/utils/cmmsLogic.ts` & `src/components/tabs/EmployeesTab.tsx`)
Toàn bộ logic phân quyền theo chức vụ tập trung tại **`src/utils/cmmsLogic.ts`**:
- `isAdminLevel(user)`: Trả về `true` cho `Owner`, `Admin`, `Quản trị viên` hoặc mã nhân viên/username `ID1460`.
- `canAccessBackup(user)`: Giới hạn Trung tâm Sao lưu / Khôi phục cho `ID1460` và `Owner`.
- `ADMIN_ONLY_VIEWS`: Hiện khóa riêng `admin_dashboard` và `employee_performance` cho cấp Admin/Owner.
- `COST_RESTRICTED_VIEWS` & `canViewCosts(user)`: Trả về `false` cho `Kỹ thuật viên` và `Nhân viên vận hành` → ẩn tab `costs` và toàn bộ dữ liệu đơn giá/chi phí/ngân sách trong `DashboardTab`, `EquipmentTab`, `MaintenanceTab`, `SparePartsTab`, `ProjectsTab`.
- `canDeleteRecords(user)`: Trả về `false` cho `Kỹ thuật viên` và `Nhân viên vận hành` → ẩn nút xóa và chặn xóa trong `CMMSContext` đối với Thiết bị, Tickets, Dụng cụ đồ nghề, Kho phụ tùng, Lịch sử bảo trì, Tài liệu SOP (`DocumentsTab`), Dự án (`ProjectsTab`) và Công việc đầu ngày (`MorningChecksTab`).
- `canManageMaintenancePlans(user)`: Trả về `false` cho `Kỹ thuật viên` và `Nhân viên vận hành` → chỉ được xem Kế hoạch bảo trì (không sửa, dời lịch kéo thả, giao việc hay xóa kế hoạch). Cũng dùng để giới hạn quyền tạo/sửa mẫu phân công trong `MorningChecksTab`.
- `canExportCSV(user)`: Trả về `false` cho `Kỹ thuật viên` và `Nhân viên vận hành` → ẩn nút **Download CSV** trong `DashboardTab.tsx`.
- `getEffectiveAllowedViews(user)` và `getDefaultViewsForRole(...)` trong `EmployeesTab.tsx`: Quy định danh sách View mặc định khi tạo nhân viên mới hoặc chưa tùy chỉnh `allowedViews`.

### B. Chu Kỳ Bảo Trì & Kiểm Định (`src/utils/cmmsLogic.ts`)
- `calculateNextMaintenanceDate`, `getMaintenanceStatus`, `syncPlansWithHistory`.
- `getHistoryWorkType`: Phân loại `'Bảo trì theo kế hoạch'` vs `'Sửa chữa'` (nếu là sửa chữa sẽ không đẩy lịch kỳ bảo trì tiếp theo).
- `getInspectionStatus`, `getInspectionDaysRemaining`, `calculateNextInspectionDate`: Tính hạn kiểm định và số ngày nhắc trước (`nhacTruocNgay`).

### C. Phân Hệ Công Việc Đầu Ngày (`src/components/tabs/MorningChecksTab.tsx`)
- Định nghĩa dữ liệu trong **`src/types/cmms.ts`**: `DailyInspectionArea` (`'Vòng trong' | 'Vòng Ngoài' | 'Phòng Utility'`), `DailyAreaCheckShift`, `DailyAreaCheckStatus`, `DailyAreaCheckResult`, `DailyAreaCheck`.
- Mẫu mô tả công việc chuẩn cho 3 khu vực nằm trong hằng số `AREA_META` ở đầu **`src/components/tabs/MorningChecksTab.tsx`**.
- Actions trong **`src/context/CMMSContext.tsx`**: `addDailyAreaCheck`, `updateDailyAreaCheck`, `submitDailyAreaCheckReport`, `deleteDailyAreaCheck` (đã gắn guard `canDeleteRecords`, đồng bộ Firestore `daily_area_checks` và ghi `AuditLog`).

### D. Mô Hình Dự Báo Chi Phí Bảo Trì 6 Tháng (`src/utils/costForecasting.ts` & `src/components/CostPredictiveAnalysis.tsx`)
- Hàm `buildSixMonthCostForecast` tổng hợp dữ liệu thực tế từ `costRecords`, `stockTransactions` (`Xuất kho sử dụng` × `donGia`) và `maintenanceHistory` theo cửa sổ `lookbackMonths` (`3` hoặc `6` tháng), kết hợp làm mượt trung bình/trung vị (`0.55 * mean + 0.45 * median`).
- Chi phí bảo trì tương lai được tính bằng cách duyệt chu kỳ từng `MaintenancePlan` + lịch `safetyInspections` qua 6 tháng tới, cộng với đường hồi quy tuyến tính OLS (`computeLinearRegression`) và biên độ tin cậy mở rộng dần (`10%` → `22%`).
- Để chỉnh chi phí định mức mặc định khi thiết bị chưa có lịch sử chi phí, sửa hàm `getDefaultCycleUnitCost` trong **`src/utils/costForecasting.ts`**.

### E. KPI Dashboard Admin OEE / MTBF / MTTR (`src/components/tabs/AdminDashboardTab.tsx`)
- Công thức Availability, Performance, Quality (`OEE = A × P × Q`), MTBF (giờ) và MTTR (phút) nằm trong khối `useMemo` chính của `AdminDashboardTab.tsx`.
- Ngưỡng chuẩn thế giới (World-Class OEE `85%`) được vẽ trên biểu đồ đồng hồ D3 trong cùng file.

### F. Biểu Giá Điện EVN, Solar, Nước (`src/types/cmms.ts` & `src/components/energy/`)
- Đơn giá mặc định: `DEFAULT_ENERGY_TARIFF_CONFIG` trong **`src/types/cmms.ts`**.
- Danh sách đồng hồ: `EVN_DAILY_PANEL_METERS`, `SOLAR_DAILY_PANEL_METERS`, `WATER_DAILY_METERS` trong **`src/types/cmms.ts`**.
- Logic tính chi phí điện 3 khung giờ & so sánh kỳ: **`src/components/energy/EnergyCompareDashboard.tsx`**, **`src/components/energy/WaterCompareDashboard.tsx`**, **`src/components/tabs/EnergyTab.tsx`** và **`src/components/energy/TariffConfigModal.tsx`**.

### G. Lịch Bảo Trì Kéo Thả, Nhật Ký Đăng Nhập & Xuất Excel
- Hàm `rescheduleMaintenancePlan(planId, newDate)` trong **`src/context/CMMSContext.tsx`** xử lý kéo thả đổi lịch trong `MaintenanceTab.tsx` và đồng bộ `equipment.hanBaoTriTiepTheo`.
- **Nhật ký đăng nhập/đăng xuất**: Trong **`src/context/CMMSContext.tsx`** (`loginWithCredentials`, `logout`) sử dụng `actorOverride` đúng tài khoản vừa đăng nhập/đăng xuất (tránh đọc nhầm `currentUserRef` cũ khi chuyển user), đồng thời **`src/components/tabs/AuditLogTab.tsx`** tách riêng ID nhân viên và tên người thao tác khi hiển thị và xuất CSV.
- **Điểm hiệu quả nhân viên**: chỉnh trọng số tại **`src/components/tabs/EmployeePerformanceTab.tsx`** (`50% Hoàn thành + 30% Đạt chuẩn + 20% Kỷ luật đúng hạn`).
- **Mẫu Excel (`.xlsx`)**: chỉnh tiêu đề cột, tên Sheet và khung ký duyệt in ấn trong **`src/utils/excelExport.ts`**.

---

## 6. Hệ Thống Email HTML, Thông Báo Web & Backend (`server.ts`)

### A. Máy Chủ Express & Vite (`server.ts`)
- Chạy cổng `3000` (`PORT` trong env), gắn `vite.middlewares` khi dev (`NODE_ENV !== 'production'`) và serve `dist/` khi production (`NODE_ENV=production`).
- Cung cấp endpoint:
  - `GET /api/email-status`: Kiểm tra trạng thái cấu hình SMTP / Resend / Webhook trên server.
  - `POST /api/send-email`: Nhận payload `{ to, cc, subject, body, htmlBody, sender, type, relatedId }`, ưu tiên gửi theo thứ tự **Google Apps Script Webhook** (nếu được cấu hình hợp lệ) → **Resend API** (`RESEND_API_KEY`) → **SMTP Nodemailer** (`SMTP_USER`, `SMTP_PASS`, timeout cấu hình gọn tránh treo kết nối).
- **Chống gửi Email trùng lặp trong ngày**:
  - `server.ts` dùng `sentEmailDailyCache` (theo ngày Việt Nam `Asia/Ho_Chi_Minh`) + `inFlightEmailMap` và khóa `buildEmailDedupKey(...)` để chặn việc gửi lặp cùng nội dung tới cùng người nhận nhiều lần trong ngày.
  - Phía client trong `CMMSContext.tsx` cũng có lớp chống trùng ngày (`AUTO-EMAIL-DEDUP`, `AUTO-INSPECTION-REMINDER`) trước khi gọi API.

### B. Giao Diện Email HTML & Thông Báo Web Miễn Phí
- **Mẫu Email HTML (`src/utils/emailTemplates.ts`)**: Hàm `buildProfessionalEmailHtml` sinh email HTML chuẩn bảng màu công nghiệp theo loại thông báo (khẩn cấp, quá hạn, kiểm định, hoàn tất công việc...).
- **Thông báo Web (`src/components/common/WebNotificationToast.tsx` & `CMMSContext.tsx`)**: Hỗ trợ `NotificationDeliveryMode` (`'web' | 'email' | 'both'`). Chế độ `'web'` dùng In-App Toast + Browser `Notification` API hoàn toàn miễn phí.

### C. Biến Môi Trường (`.env.example`)
- Các biến cấu hình gồm: `NODE_ENV`, `PORT`, `APP_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `RESEND_API_KEY`, `RESEND_FROM`, `EMAIL_WEBHOOK_URL`. Không lưu secret trực tiếp trong mã nguồn.

---

## 7. Đồng Bộ Cloud Firestore & Quy Tắc Bảo Mật (`firestore.rules`)

- **Schema chuẩn**: Khai báo trong **`firebase-blueprint.json`**.
- **Sanitizer & Sync**: Quản lý tại **`src/utils/firestoreSync.ts`** (`sanitizeEquipment`, `sanitizeDailyAreaCheck`, `seedOrPushWorkspaceToFirestore`, `subscribeCloudCollection`, `upsertCloudDoc`...). Mọi collection đều giới hạn độ dài chuỗi và kích thước ảnh (`clampDataUrl` <= 440 KB) để an toàn dưới ngưỡng 1 MB/document của Firestore.
- **Quy tắc bảo mật (`firestore.rules`)**:
  - Áp dụng xác thực người dùng (`isSignedIn()`), thành viên workspace (`isMemberOnDoc`), khóa immutable keys, validate schema từng collection (bao gồm `isValidDailyAreaCheck`) và chỉ `isAdmin()` mới được `delete` dữ liệu trên Cloud.
  - Sau mỗi lần chỉnh sửa `firestore.rules`, **bắt buộc** chạy kiểm tra lint bảo mật và triển khai lại rules:
    ```bash
    npx eslint firestore.rules
    ```

---

## 8. Cách Sửa Màu Sắc, Giao Diện Sáng/Tối & Font Chữ

- Toàn bộ giao diện sử dụng **Tailwind CSS v4** trong từng component (`src/components/**`).
- Quy tắc chuyển đổi **Nền Sáng (`html.light`)** và font chữ (`Plus Jakarta Sans`, `JetBrains Mono`) nằm tại **`src/index.css`**.
- Tiêu đề trang trình duyệt (`<title>`) và thẻ `<meta>` nằm tại **`index.html`**.

---

## 9. Quy Trình Thêm Tính Năng Mới & Tự Động Cập Nhật Tài Liệu

Mỗi khi bạn bổ sung một tính năng hoặc phân hệ (Tab) mới vào app:

1. Tạo component Tab mới trong `src/components/tabs/TenTabMoi.tsx`.
2. Đăng ký mã `id` phân hệ vào `APP_VIEW_OPTIONS` trong **`src/types/cmms.ts`** và `UI_TEXTS.navigation.items` trong **`src/config/uiTexts.ts`**.
3. Gắn icon & mục menu trong **`src/components/Navigation.tsx`**, cập nhật quyền mặc định trong `src/utils/cmmsLogic.ts` & `src/components/tabs/EmployeesTab.tsx`, và render tab theo `activeTab` trong **`src/App.tsx`**.
4. Nếu có collection mới trên Cloud: cập nhật **`firebase-blueprint.json`**, **`firestore.rules`**, **`src/utils/firestoreSync.ts`** và kiểm tra `npx eslint firestore.rules`.
5. Chạy lệnh đồng bộ tài liệu (hoặc chạy `npm run build` — script `prebuild` sẽ tự chạy bước này):
   ```bash
   npm run sync-docs
   ```
   Script **`scripts/syncDocs.ts`** sẽ tự động quét mã nguồn và cập nhật ngay lập tức cả **`HUONG_DAN_SU_DUNG_APP.md`** lẫn **`HUONG_DAN_CHINH_SUA_CODE_VA_NOI_DUNG.md`** với phân hệ mới, đường dẫn file mới và thông số cấu hình hiện hành.

---

## 10. Lệnh Kiểm Tra & Đóng Gói

- **Cài đặt thư viện**: `npm install`
- **Chạy môi trường phát triển (cổng 3000)**: `npm run dev`
- **Chạy bản Production**: `NODE_ENV=production npm start`
- **Đồng bộ thủ công tài liệu hướng dẫn**: `npm run sync-docs`
- **Kiểm tra lỗi TypeScript**: `npm run lint`
- **Kiểm tra bảo mật Firestore Rules**: `npx eslint firestore.rules`
- **Biên dịch bản Production (tự đồng bộ docs trước khi build)**: `npm run build`
