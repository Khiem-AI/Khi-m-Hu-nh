# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG FACILITY SYSTEM MANAGEMENT (CMMS)

Tài liệu này hướng dẫn chi tiết cách vận hành toàn bộ các phân hệ quản lý bảo trì thiết bị, công việc đầu ngày theo khu vực, kiểm định an toàn, dụng cụ đồ nghề, dự án kỹ thuật, sự cố, vật tư, năng lượng, chi phí, phân quyền nhân sự và cảnh báo Web/Email trên **FACILITY SYSTEM MANAGEMENT**.

> **Cơ chế tự động cập nhật**: Các bảng danh mục phân hệ và số liệu hệ thống trong tài liệu này được đồng bộ tự động từ mã nguồn mỗi khi chạy `npm run sync-docs` hoặc `npm run build`.

---

## Thông Tin Hệ Thống Hiện Hành (Tự Động Đồng Bộ)

<!-- AUTO-SYNC:SYSTEM-SNAPSHOT:START -->
- **Phiên bản dữ liệu (`CMMS_DATA_VERSION`)**: `v18_calendar_dnd_inspection_tools`
- **Số liệu mẫu tích hợp sẵn**: 131 thiết bị · 131 kế hoạch bảo trì · 115 biên bản lịch sử · 8 hồ sơ kiểm định/hiệu chuẩn · 8 bộ dụng cụ & đồ nghề · 4 dự án kỹ thuật · 56 mã phụ tùng · 6 tài liệu SOP/Checklist · 3 phiếu công việc đầu ngày · 8 nhân sự.
- **Tài khoản quản lý & quản trị mẫu**: `ID1460` (Khiem Huynh — Admin).
<!-- AUTO-SYNC:SYSTEM-SNAPSHOT:END -->

### Danh Mục Toàn Bộ Phân Hệ (Tự Động Đồng Bộ)

<!-- AUTO-SYNC:MENU-CATALOG:START -->
> *Bảng này được script `scripts/syncDocs.ts` tự động sinh từ `APP_VIEW_OPTIONS` & `UI_TEXTS` (19 phân hệ đang hoạt động).*

| STT | Mã View (`id`) | Tên Menu Hiển Thị | Chức Năng Chính | Phạm Vi Truy Cập | Component |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | `dashboard` | **Tổng Quan O&M** | Bảng điều hành nhà máy | Tất cả nhân sự (tùy chỉnh theo View) | `DashboardTab` |
| 2 | `admin_dashboard` | **Dashboard Admin** | OEE, MTBF, MTTR & KPI vận hành | Chỉ Admin / Owner (`ID1460`) | `AdminDashboardTab` |
| 3 | `my_tasks` | **Việc Được Giao** | Nhiệm vụ của tôi | Tất cả nhân sự (tùy chỉnh theo View) | `MyTasksTab` |
| 4 | `morning_checks` | **Công Việc Đầu Ngày** | Kiểm tra Vòng trong, Vòng Ngoài & Phòng Utility | Tất cả nhân sự (tùy chỉnh theo View) | `MorningChecksTab` |
| 5 | `profile` | **Hồ Sơ Cá Nhân** | Thông tin & Phép năm | Tất cả nhân sự (tự xem/sửa hồ sơ cá nhân; Admin xem toàn bộ) | `ProfileTab` |
| 6 | `equipment` | **Danh Sách Thiết Bị** | Máy móc & Mã QR | Tất cả nhân sự (tùy chỉnh theo View) | `EquipmentTab` |
| 7 | `maintenance` | **Kế Hoạch & Lịch Sử** | Bảo trì định kỳ | Tất cả nhân sự (tùy chỉnh theo View) | `MaintenanceTab` |
| 8 | `inspection_calibration` | **Kiểm Định & Hiệu Chuẩn** | An toàn, hiệu chuẩn & nhắc hạn | Tất cả nhân sự (tùy chỉnh theo View) | `SafetyInspectionTab` |
| 9 | `tools` | **Dụng Cụ & Đồ Nghề** | Cấp phát, mượn trả & kiểm kê | Tất cả nhân sự (tùy chỉnh theo View) | `ToolsManagementTab` |
| 10 | `tickets` | **Quản Lý Tickets** | Yêu cầu & sự cố | Tất cả nhân sự (tùy chỉnh theo View) | `TicketsTab` |
| 11 | `projects` | **Quản Lý Dự Án** | Tiến độ, WBS, Kanban & Ngân sách | Tất cả nhân sự (tùy chỉnh theo View) | `ProjectsTab` |
| 12 | `spare_parts` | **Kho Phụ Tùng** | Xuất nhập tồn kho | Tất cả nhân sự (tùy chỉnh theo View) | `SparePartsTab` |
| 13 | `documents` | **Tra Cứu Tài Liệu** | SOP & Checklist | Tất cả nhân sự (tùy chỉnh theo View) | `DocumentsTab` |
| 14 | `energy` | **Năng Lượng Điện - Nước** | EVN, Solar & Đồng hồ | Tất cả nhân sự (tùy chỉnh theo View) | `EnergyTab` |
| 15 | `costs` | **Quản Lý Chi Phí** | Mua sắm & Sửa chữa | Quản lý / Kỹ sư / Admin (ẩn với Kỹ thuật viên & NV vận hành) | `CostTab` |
| 16 | `employees` | **Nhân Viên & Phân Quyền** | Tài khoản & Chức vụ | Quản lý / Kỹ sư / Admin (hoặc cấp quyền View) | `EmployeesTab` |
| 17 | `employee_performance` | **Đánh Giá Hiệu Quả NV** | Khối lượng & hiệu suất (Admin) | Chỉ Admin / Owner (`ID1460`) | `EmployeePerformanceTab` |
| 18 | `logs` | **Nhật Ký Hệ Thống** | Lịch sử thao tác | Quản lý / Kỹ sư / Admin (hoặc cấp quyền View) | `AuditLogTab` |
| 19 | `email_alerts` | **Thông Báo Email** | Cấu hình thông báo | Quản lý / Kỹ sư / Admin (hoặc cấp quyền View) | `EmailAlertsTab` |
<!-- AUTO-SYNC:MENU-CATALOG:END -->

---

## 1. Đăng Nhập, Phân Quyền Theo Vai Trò, Giao Diện & Cảnh Báo Nhanh

1. **Đăng nhập**:
   - Nhập **Mã nhân viên** (hoặc tên đăng nhập / email) và **Mật khẩu** để vào hệ thống.
   - Có thể kết nối thêm tài khoản **Google (Cloud Sync)** trong giao diện hệ thống để đồng bộ dữ liệu thời gian thực lên **Firebase Firestore** giữa nhiều thiết bị.
   - Hệ thống hỗ trợ các cấp chức vụ: `Owner`, `Admin`, `Quản trị viên`, `Người quản lý`, `Trưởng phòng Kỹ thuật`, `Kỹ sư thiết bị`, `Kỹ thuật viên`, `Nhân viên vận hành`.
2. **Ma trận phân quyền cốt lõi (RBAC)**:
   - **Admin / Owner (`ID1460`)**: Toàn quyền trên tất cả 19 phân hệ, bao gồm `Dashboard Admin`, `Đánh Giá Hiệu Quả NV`, `Trung Tâm Sao Lưu & Khôi Phục`, xóa bản ghi và đồng bộ Cloud.
   - **Quản lý / Trưởng phòng Kỹ thuật / Kỹ sư thiết bị**: Được xem chi phí, giao việc, tạo/sửa/dời lịch kế hoạch bảo trì, cấu hình công việc đầu ngày, xuất báo cáo CSV/Excel và xóa bản ghi trên giao diện (lưu ý: xóa dữ liệu trên Cloud Firestore vẫn ưu tiên bảo vệ theo quyền Admin).
   - **Kỹ thuật viên & Nhân viên vận hành** *(áp dụng chặt chẽ trên cả giao diện lẫn hàm kiểm tra nghiệp vụ)*:
     - **Ẩn hoàn toàn thông tin chi phí**: Không truy cập được mục **Quản Lý Chi Phí**; ẩn toàn bộ đơn giá, giá trị tồn kho, chi phí ước tính, ngân sách và khoản chi ở *Tổng Quan O&M*, *Kế Hoạch & Lịch Sử*, *Kho Phụ Tùng* và *Quản Lý Dự Án*.
     - **Chỉ được chỉnh sửa, không được xóa**: Được phép thêm/cập nhật nhưng **ẩn toàn bộ nút xóa** tại *Danh Sách Thiết Bị*, *Quản Lý Tickets*, *Dụng Cụ & Đồ Nghề*, *Kho Phụ Tùng*, *Lịch Sử Bảo Trì*, *Tra Cứu Tài Liệu*, *Quản Lý Dự Án* (dự án, đầu việc WBS, cột mốc, rủi ro, khoản chi) và *Công Việc Đầu Ngày*.
     - **Kế hoạch bảo trì chỉ xem**: Trong mục *Kế Hoạch & Lịch Sử*, Kỹ thuật viên chỉ được xem kế hoạch bảo trì (không sửa, không dời lịch kéo thả, không giao việc, không xóa kế hoạch); vẫn thực hiện được nghiệp vụ *Ghi nhận hoàn tất bảo trì / sửa chữa* vào lịch sử.
     - **Ẩn nút `Download CSV`** trên màn hình **Tổng Quan O&M**.
3. **Đổi mật khẩu & Hồ sơ cá nhân**:
   - Bấm vào tên tài khoản ở góc trên bên phải thanh Header → chọn **Đổi Mật Khẩu Tài Khoản**, hoặc mở menu **Hồ Sơ Cá Nhân**.
   - Nhập mật khẩu hiện tại, mật khẩu mới (tối thiểu 4 ký tự) và xác nhận mật khẩu mới.
4. **Chuyển đổi Nền Tối / Nền Sáng**:
   - Bấm nút **Nền Sáng / Nền Tối** trên thanh Header để thay đổi giao diện phù hợp môi trường làm việc ngoài xưởng hoặc văn phòng.
5. **Chuông Cảnh Báo Vận Hành & Quét Mã QR**:
   - **Chuông thông báo**: Tự động tổng hợp các nhóm cảnh báo thời gian thực: thiết bị **quá hạn bảo trì**, thiết bị **kiểm định an toàn / hiệu chuẩn quá hạn hoặc sắp đến hạn**, phụ tùng **tồn kho dưới mức tối thiểu** và **Ticket khẩn cấp**. Nhấp vào từng cảnh báo để mở thẳng phân hệ xử lý.
   - **Nút Quét QR**: Mở camera thiết bị (hoặc nhập tay mã thiết bị) để tra cứu hồ sơ máy, ghi nhận bảo trì/sửa chữa hoặc tạo Ticket ngay tại hiện trường.
6. **Giao diện tối ưu di động (Card View thu gọn)**:
   - Trên màn hình điện thoại và tablet nhỏ, các bảng công việc, lịch sử bảo trì, kiểm định an toàn, dụng cụ đồ nghề và công việc đầu ngày tự động chuyển sang **Card view thu gọn** giúp thao tác chạm và đọc nhanh.

---

## 2. Công Việc Được Giao (`Việc Được Giao`)

Ngay sau khi đăng nhập thành công:
- Trên màn hình **Tổng Quan O&M**, khối **Công Việc Được Giao** hiển thị số lượng kế hoạch bảo trì (quá hạn / tới hạn / sắp tới) và Tickets đang giao cho chính bạn kèm nút thao tác nhanh.
- Trong menu **Việc Được Giao** (hiển thị huy hiệu tổng số đầu việc cần xử lý):
  - **Cần Xử Lý**: Lọc tự động các Ticket đang mở và lịch bảo trì sắp/quá hạn của bạn.
  - **Bảo Trì**: Toàn bộ kế hoạch bảo trì bạn phụ trách. Bấm **Thực Hiện Bảo Trì** để mở biểu mẫu nghiệm thu.
  - **Tickets**: Các phiếu sự cố giao cho bạn (bao gồm công việc giao nhiều người). Có thể bấm **Bắt Đầu Làm**, **Cập Nhật / Ảnh** (chụp ảnh trước/sau), hoặc **Hoàn Thành** để hệ thống gửi thông báo Web/Email về Admin và Kỹ sư thiết bị.
  - **Thiết Bị / Đã Làm**: Tra cứu máy móc phụ trách và lịch sử công việc bạn đã hoàn thành.

---

## 3. Công Việc Đầu Ngày (`Công Việc Đầu Ngày` — Kiểm Tra 3 Khu Vực)

Phân hệ mới giúp phân quyền kỹ thuật viên đi kiểm tra đầu ca tại 3 khu vực trọng yếu và ghi nhận báo cáo thực tế ngay tại hiện trường:

1. **3 Khu Vực Cố Định**:
   - **Vòng trong**: Xưởng sản xuất, kho nguyên liệu, phòng sạch, văn phòng, AHU/FCU, lối thoát hiểm.
   - **Vòng Ngoài**: Khuôn viên ngoài xưởng, trạm bơm nước sinh hoạt, trạm xử lý nước thải, cổng bảo vệ, kho hóa chất.
   - **Phòng Utility**: Chiller 01/02, Mini Chiller, bơm CHWP/CLWP, Cooling Tower, máy nén khí, máy sấy khí, tủ điện MSB, máy phát điện & hệ nước DI.
2. **Mô Tả Công Việc Cho Mỗi Khu Vực & Phân Quyền Giao Việc** *(Quản trị viên / Quản lý / Kỹ sư)*:
   - Trên đầu trang có **3 thẻ tổng quan khu vực** hiển thị tiến độ và mô tả công việc gần nhất.
   - Bấm **Giao Việc Khu Vực** (hoặc biểu tượng sửa trên từng phiếu) để chọn khu vực, ngày kiểm tra, ca làm việc (`Ca Sáng`, `Ca Chiều`, `Ca Đêm`), hạn hoàn thành, tùy chỉnh nội dung **Mô tả công việc** (có nút nạp lại mẫu chuẩn theo từng khu vực) và chọn nhiều kỹ thuật viên phụ trách qua `MultiAssigneePicker`.
   - Bấm **Giao Ca Nhanh (3 Khu Vực)** để tạo đồng loạt cả 3 phiếu (`Vòng trong`, `Vòng Ngoài`, `Phòng Utility`) cho ca làm việc mới chỉ trong 1 lần bấm.
3. **Ghi Nhận Báo Cáo Từ Người Được Giao Việc** *(Kỹ thuật viên / Người phụ trách)*:
   - Kỹ thuật viên có thể bật bộ lọc **Việc Được Giao Cho Tôi** (tự động bật mặc định với tài khoản kỹ thuật viên) hoặc lọc theo khu vực, trạng thái, ngày kiểm tra.
   - Bấm **Ghi Nhận Báo Cáo** trên phiếu được giao để:
     - Chọn trạng thái (`Chờ kiểm tra`, `Đang kiểm tra`, `Đã hoàn thành`).
     - Chọn kết quả kiểm tra (`Chưa đánh giá`, `Bình thường`, `Cần theo dõi`, `Có sự cố`).
     - Nhập **Nội dung báo cáo thực tế** tại hiện trường và chụp/tải **Ảnh hiện trường** (tùy chọn).
   - Khi lưu, hệ thống tự động ghi nhận **Người báo cáo**, **Thời gian báo cáo**, lưu vào **Nhật ký hệ thống**, và tự động gửi thông báo cảnh báo nếu kết quả là `Có sự cố` hoặc `Cần theo dõi`.

---

## 4. Hồ Sơ Cá Nhân (`Hồ Sơ Cá Nhân`)

- Mọi nhân sự đều có quyền xem hồ sơ của chính mình: mã nhân viên, chức vụ, phòng ban, chuyên môn, loại hợp đồng, ca làm việc, số ngày nghỉ phép năm / đã dùng / còn lại, thông tin liên hệ và ảnh đại diện.
- Nhân viên có thể tự cập nhật thông tin liên hệ cá nhân, ảnh đại diện hoặc bấm **Đổi Mật Khẩu** trực tiếp trong trang.
- Tài khoản cấp **Admin / Owner** có bộ chọn danh sách để xem và chỉnh sửa hồ sơ cho toàn bộ nhân viên.

---

## 5. Tổng Quan O&M (`Dashboard`)

- **Thẻ KPI tổng hợp**: Theo dõi tình trạng thiết bị đang chạy/sửa chữa, bảo trì quá hạn/tới hạn, Tickets đang mở, vật tư tồn kho thấp, sản lượng điện EVN/Solar và tổng chi phí vận hành *(thẻ/số liệu chi phí tự động ẩn với Kỹ thuật viên & Nhân viên vận hành)*.
- **Phân Tích Bảo Trì Quá Hạn & Lịch Trọng Điểm (Biểu đồ D3)**: Nhấp vào từng trạng thái trên biểu đồ hoặc nhóm hệ thống để lọc nhanh danh sách thiết bị cần ưu tiên.
- **Lịch Bảo Trì Phòng Ngừa 30 Ngày Tới**: Xem lịch dự kiến trong tháng và nhấp vào từng ngày để xem danh sách thiết bị cần bảo trì.
- **Nút `Download CSV`**: Xuất file CSV tổng hợp tình hình kế hoạch bảo trì và trạng thái Tickets theo tháng đang xem trên lịch *(chỉ hiển thị cho Admin, Quản lý, Kỹ sư; ẩn hoàn toàn đối với Kỹ thuật viên & Nhân viên vận hành)*.

---

## 6. Dashboard Admin — Phân Tích KPI Vận Hành (`Dashboard Admin` — Chỉ Admin/Owner)

- Menu này **chỉ hiển thị với cấp `Owner`, `Admin`, `Quản trị viên` và `ID1460`**.
- Lọc dữ liệu theo khoảng thời gian (`30D`, `90D`, `180D`, `ALL`), hệ thống thiết bị và số giờ vận hành/ngày (1 ca = 8h, 2 ca = 16h, 3 ca = 24h):
  - **OEE (Hiệu suất thiết bị tổng thể = Availability × Performance × Quality)** hiển thị trên biểu đồ đồng hồ D3 kèm mốc chuẩn 85%.
  - **MTBF (Thời gian trung bình giữa các lần hỏng hóc)** và **MTTR (Thời gian trung bình để sửa chữa)**.
  - **Tỷ lệ Bảo trì phòng ngừa (PM) / Sửa chữa khắc phục (CM)**.
  - Biểu đồ D3 xu hướng OEE & thời gian dừng máy theo tháng, biểu đồ phân bổ theo hệ thống và bảng xếp hạng độ tin cậy từng thiết bị (có nút **Xuất CSV**).

---

## 7. Danh Sách Thiết Bị & Mã QR (`Danh Sách Thiết Bị`)

- **Tìm kiếm & lọc**: Theo mã máy, tên thiết bị, hệ thống (`Hệ Thống Lạnh`, `HVAC/ACMV`, `Electrical`, `Compressor`, `Pump`, `Fire Protection`...), trạng thái và mức độ rủi ro.
- **Thêm / Sửa thiết bị**: Nhập thông số kỹ thuật, chụp ảnh trực tiếp bằng camera hoặc tải ảnh từ máy *(Kỹ thuật viên chỉ được thêm/sửa, không có quyền xóa thiết bị)*.
- **Tạo & In Mã QR**: Bấm biểu tượng **QR** để xem hoặc in tem QR dán tại hiện trường.
- **Giao Việc**: Bấm **Giao Việc** để chọn một hoặc nhiều người phụ trách (`MultiAssigneePicker`), chọn **Người Giao Việc** và tùy chọn gửi thông báo.

---

## 8. Kế Hoạch Bảo Trì, Lịch Sử, Phân Biệt Loại Công Việc, Lịch Kéo Thả & Xuất Excel

Phân hệ gồm 3 chế độ xem chuyển đổi ở góc trên:

1. **Lịch Sử Bảo Trì**:
   - Hỗ trợ chuyển đổi **Dạng Bảng** / **Dạng Thẻ** (trên mobile tự động dùng Card view thu gọn).
   - **Phân biệt rõ 2 loại công việc** trong mục **Ghi Nhận Hoàn Tất Bảo Trì / Sửa Chữa**:
     - **Bảo trì theo kế hoạch**: Lưu biên bản vào lịch sử, đồng thời **tự động tính ngày & tạo/cập nhật kế hoạch bảo trì kỳ tiếp theo** dựa theo tần suất (`Daily`, `Weekly`, `Monthly`, `Quarterly`, `Yearly`).
     - **Sửa chữa**: Chỉ ghi nhận lịch sử sửa chữa vào hồ sơ thiết bị và thống kê MTBF/MTTR, **không làm dịch chuyển lịch bảo trì định kỳ** sẵn có.
   - Hỗ trợ chọn **nhiều Người Thực Hiện** cùng lúc, chụp **Ảnh Trước** và **Ảnh Sau**, gửi báo cáo hoàn thành.
   - *Phân quyền*: Kỹ thuật viên chỉ được chỉnh sửa biên bản lịch sử, không được xóa và không thấy cột chi phí ước tính.
2. **Kế Hoạch Bảo Trì**:
   - Theo dõi ngày bảo trì gần nhất, ngày kế tiếp, trạng thái (`Quá hạn`, `Tới hạn`, `Sắp tới`, `Đúng hạn`), giao việc nhiều người và gửi cảnh báo thiết bị đến hạn.
   - *Phân quyền*: Kỹ thuật viên chỉ có quyền **xem** kế hoạch bảo trì (ẩn các nút Thêm/Sửa/Xóa/Giao việc).
3. **Lịch Bảo Trì (Calendar View — Kéo Thả Sắp Xếp Lịch)**:
   - Hiển thị 4 thẻ tổng hợp trong tháng, lưới lịch tháng trực quan và danh sách **Việc Chưa Thực Hiện Cần Sắp Xếp**.
   - **Kéo thả đổi lịch** *(dành cho Quản lý / Kỹ sư / Admin)*: Kéo thẻ công việc bảo trì chưa hoàn thành (`Quá hạn`, `Tới hạn`, `Sắp tới`) thả vào ô ngày mong muốn trong tháng để dời lịch; trên thiết bị cảm ứng có thể chọn ngày trong khung chi tiết. Hệ thống tự động đồng bộ `hanBaoTriTiepTheo` và hỗ trợ nút **Hoàn tác**.
4. **Xuất Dữ Liệu Excel (`.xlsx`) & CSV**:
   - Xuất báo cáo tổng hợp **4 Sheets** (`Tong_Hop_KPI`, `Lich_Su_Bao_Tri`, `Ke_Hoach_Bao_Tri`, `Sua_Chua_Tickets`) hoặc từng phân hệ riêng lẻ kèm khung ký duyệt in ấn cho bộ phận kỹ thuật.

---

## 9. Kiểm Định An Toàn & Hiệu Chuẩn (`Kiểm Định & Hiệu Chuẩn`)

- Quản lý thiết bị áp lực, nâng hạ, đo lường và PCCC/môi trường theo 3 nhóm: `Kiểm định an toàn`, `Hiệu chuẩn đo lường`, `Kiểm tra PCCC / Môi trường`.
- **Trạng thái tự động theo hạn**: Hệ thống tự động tính số ngày còn lại để gắn trạng thái `Quá hạn`, `Sắp đến hạn` (trong ngưỡng `nhacTruocNgay`, mặc định 30 ngày), `Còn hạn` hoặc `Đang kiểm định`.
- **Nhắc lịch tự động**:
  - Hiển thị banner cảnh báo ngay đầu phân hệ, huy hiệu số hồ sơ tới/quá hạn trên Sidebar và hiển thị trực tiếp trong chuông **Cảnh Báo Vận Hành** trên Header.
  - Tự động kích hoạt thông báo mỗi ngày (`KIEM_DINH_DEN_HAN`) khi có hồ sơ tới/quá hạn (có công tắc bật/tắt tự động và nút **Gửi Nhắc Lịch Ngay** thủ công).
- **Nghiệm thu & Gia hạn kỳ mới**: Bấm **Cập Nhật Kiểm Định** để nhập số tem/giấy chứng nhận mới, đơn vị thực hiện và kết quả; hệ thống tự cộng chu kỳ (`3/6/12/24/36 tháng`) ra ngày hết hạn tiếp theo và lưu lịch sử từng lần kiểm định. Hỗ trợ xuất CSV.

---

## 10. Quản Lý Dụng Cụ & Đồ Nghề (`Dụng Cụ & Đồ Nghề`)

- **Danh mục Dụng cụ & Đồ nghề**: Theo dõi số lượng tổng, số lượng khả dụng, đang mượn, vị trí lưu, số serial, tình trạng (`Tốt`, `Đang sử dụng`, `Cần bảo dưỡng`, `Hư hỏng`, `Thất lạc`) và **hạn hiệu chuẩn** đối với thiết bị đo kiểm.
- **Sổ Nhật Ký Mượn / Trả / Bảo Dưỡng**:
  - Bấm **Mượn / Trả** trên từng dụng cụ để ghi nhận giao dịch `Mượn`, `Trả`, `Bảo dưỡng` hoặc `Kiểm kê` kèm người mượn, người bàn giao và hạn trả dự kiến.
  - Tự động trừ/cộng số lượng khả dụng – đang mượn, cảnh báo dụng cụ **quá hạn trả** và hỗ trợ lọc, Card view trên mobile cùng xuất CSV.
  - *Phân quyền*: Kỹ thuật viên được phép sửa thông tin dụng cụ và ghi nhận mượn/trả, nhưng **không được xóa** dụng cụ.

---

## 11. Quản Lý Tickets (`Quản Lý Tickets`)

- Chuyển đổi linh hoạt giữa **Dạng Thẻ** và **Dạng Bảng**; lọc theo mức độ ưu tiên (`Khẩn cấp`, `Cao`, `Trung bình`...), trạng thái và người phụ trách.
- Hỗ trợ chọn nhiều người phụ trách, chụp ảnh hiện trạng trước/sau xử lý, gửi thông báo báo cáo khi chuyển sang **Hoàn thành** và xuất Excel (`.xlsx`) / CSV.
- *Phân quyền*: Kỹ thuật viên chỉ được tạo/chỉnh sửa/cập nhật trạng thái Ticket, **không được xóa** Ticket.

---

## 12. Quản Lý Dự Án Kỹ Thuật (`Quản Lý Dự Án`)

- Quản lý các dự án `Nâng cấp hạ tầng`, `Lắp đặt thiết bị mới`, `Tiết kiệm năng lượng`, `An toàn & Môi trường`, `Cải tạo hệ thống`.
- Chuyển đổi chế độ **Dạng Thẻ / Bảng / Kanban**; tự động tính % tiến độ từ danh sách đầu việc **WBS**.
- Mở chi tiết dự án để quản lý **Công việc (Tasks)**, **Cột mốc (Milestones)**, **Rủi ro (Risks)** và **Ngân sách – Khoản chi (Expenses)**.
- *Phân quyền*:
  - Kỹ thuật viên & Nhân viên vận hành **không thấy quyền xóa** (dự án, đầu việc WBS, cột mốc, rủi ro, khoản chi) ở mọi chế độ xem.
  - Các chỉ số **Ngân sách dự kiến, Chi phí thực tế và Khoản chi** cũng tự động ẩn đối với Kỹ thuật viên & Nhân viên vận hành.

---

## 13. Kho Phụ Tùng & Xuất Nhập Kho (`Kho Phụ Tùng`)

- Tra cứu danh mục phụ tùng (`Spare_part`), vị trí lưu kho và cảnh báo mặt hàng chạm mức tồn tối thiểu.
- Ghi nhận **Nhập kho**, **Xuất kho sử dụng** (liên kết thiết bị sử dụng) hoặc **Hoàn kho**; số tồn kho tự động cập nhật.
- *Phân quyền*: Kỹ thuật viên chỉ được chỉnh sửa vật tư / thực hiện xuất nhập kho, **không được xóa** phụ tùng và **không thấy đơn giá / giá trị tồn kho**.

---

## 14. Tra Cứu Tài Liệu, SOP & Checklist (`Tra Cứu Tài Liệu`)

- Lưu trữ và tra cứu **Hướng dẫn công việc (SOP)**, **Checklist kiểm tra**, **Tài liệu kỹ thuật**, **An toàn & Biểu mẫu**.
- Hỗ trợ 3 loại nguồn: liên kết tài liệu ngoài, tải tệp trực tiếp và **Checklist tương tác từng bước** để kỹ thuật viên tick trực tiếp tại hiện trường.
- *Phân quyền*: Kỹ thuật viên được phép tra cứu, thao tác checklist và cập nhật tài liệu, **không có quyền xóa** tài liệu.

---

## 15. Năng Lượng Điện - Nước (`Năng Lượng Điện - Nước`)

1. **Bộ Lọc Nhanh Thông Minh**: Chọn theo **Năm**, **Tháng** và **Chu Kỳ 10 Ngày**.
2. **Cách tính tiền điện EVN & Solar**:
   - **Giờ cao điểm**: 17h30–22h30 (Thứ 2–Thứ 7); Chủ nhật không có giờ cao điểm.
   - **Giờ bình thường**: 06h00–17h30 & 22h30–24h00 (Thứ 2–Thứ 7); Chủ nhật 06h00–24h00.
   - **Giờ thấp điểm**: 00h00–06h00 tất cả các ngày trong tuần.
   - **Điện Solar**: Tính chi phí theo đơn giá giờ bình thường/cao điểm tương ứng và tổng hợp vào chi phí năng lượng phân khung giờ.
3. **Phân tích theo giờ & ca làm việc**, **Nước Tháng** và **Chốt chỉ số hàng ngày** (tự lấy tên tài khoản đang đăng nhập và cảnh báo vượt ngưỡng).

---

## 16. Quản Lý Chi Phí & Dự Báo Ngân Sách 6 Tháng (`Quản Lý Chi Phí`)

> *Phân hệ này tự động ẩn hoàn toàn đối với tài khoản Kỹ thuật viên & Nhân viên vận hành.*

- **Quản lý chứng từ chi phí**: Ghi nhận, chỉnh sửa, duyệt và xuất CSV cho các nhóm `Bảo trì định kỳ`, `Sửa chữa đột xuất`, `Mua vật tư thay thế`, `Kiểm định an toàn`, `Dịch vụ ngoài`.
- **Phân tích & Dự báo Chi Phí Bảo Trì 6 Tháng Tới**:
  - Tự động kết hợp **chi phí tiêu hao lịch sử** (xuất kho phụ tùng × đơn giá, sửa chữa đột xuất, hóa đơn mua sắm) với **lịch bảo trì theo chu kỳ** của toàn bộ thiết bị và **lịch kiểm định an toàn sắp tới hạn**.
  - **Biểu đồ đường xu hướng (D3 Trend-Line)**: Hiển thị song song **Thực tế lịch sử** (đường liền), **Dự báo 6 tháng tới** (đường đứt nét + biên độ tin cậy), cột phân tách *Chu kỳ bảo trì* vs *Tiêu hao & Sửa chữa* và **Đường xu hướng tuyến tính (OLS)**.
  - **Tùy chỉnh kịch bản**: Chuyển chuỗi tham chiếu **3 tháng / 6 tháng gần nhất**, chọn mức dự phòng (**0% / +10% / +20%**), bật/tắt gộp chi phí kiểm định an toàn, nhấp vào từng tháng dự báo để xem **thiết bị/hạng mục phát sinh chi phí cao nhất** và bấm **Xuất Dự Báo CSV**.

---

## 17. Nhân Viên & Phân Quyền View (`Nhân Viên & Phân Quyền`)

- Thêm mới / cập nhật nhân sự, chụp ảnh đại diện trực tiếp.
- Phân quyền **View được phép xem** theo từng tài khoản để ẩn/hiện từng menu tương ứng với vai trò công việc *(các mục Admin-only và Chi phí vẫn được khóa bảo vệ thêm theo chức vụ)*.

---

## 18. Đánh Giá Hiệu Quả NV (`Đánh Giá Hiệu Quả NV` — Chỉ Admin/Owner)

- Chỉ hiển thị với tài khoản cấp **Admin / Owner (`ID1460`)**.
- Thống kê theo khoảng thời gian (`Tất cả`, `30 ngày`, `90 ngày`), tìm kiếm, lọc theo chức vụ: khối lượng bảo trì được giao, số việc quá hạn, tỷ lệ hoàn thành & đạt chuẩn, Tickets xử lý và **Điểm hiệu quả tổng hợp (0–100)** kèm biểu đồ D3 và xuất CSV.

---

## 19. Nhật Ký Hệ Thống & Thông Báo Web / Email

1. **Nhật Ký Tác Động Toàn Hệ Thống (`Nhật Ký Hệ Thống`)**:
   - Ghi vết toàn bộ thao tác thêm/sửa/xóa, dời lịch bảo trì, nghiệm thu kiểm định, mượn trả dụng cụ, công việc đầu ngày, chốt số điện nước và đăng nhập/đăng xuất.
   - Tự động hiển thị tách biệt chính xác **ID nhân viên** và **Tên người thao tác** (kể cả khi chuyển đổi đăng nhập giữa các tài khoản), hỗ trợ lọc theo hành động, tìm kiếm và **Xuất Nhật Ký CSV**.
2. **Thông Báo Web Miễn Phí & Email Tự Động (`Thông Báo Email`)**:
   - **Chọn phương thức thông báo (không tốn phí khi dùng Web)**:
     - **Chỉ thông báo qua Web (Miễn phí)**: Hiển thị thông báo nổi trực tiếp trong ứng dụng (`In-app Toast`) và **Thông báo trình duyệt (`Browser Web Notification`)** — hoàn toàn miễn phí, không giới hạn lượt gửi.
     - **Chỉ gửi Email**: Chỉ gửi thư điện tử qua kênh cấu hình.
     - **Cả Web & Email**: Kết hợp cảnh báo tức thời trên Web lẫn gửi Email tổng hợp.
   - **Mẫu Email HTML chuyên nghiệp & Chống gửi trùng trong ngày**:
     - Email sử dụng mẫu HTML chuẩn màu sắc trực quan theo từng loại cảnh báo (Ticket khẩn cấp, Bảo trì tới/quá hạn, Kiểm định đến hạn...).
     - Hệ thống tích hợp bộ lọc **chống gửi trùng nội dung trong cùng một ngày** (theo múi giờ Việt Nam `Asia/Ho_Chi_Minh`) cả ở phía trình duyệt lẫn máy chủ (`/api/send-email`), tránh spam hộp thư khi tải lại trang hoặc bấm nhiều lần.
   - **Kênh gửi Email hỗ trợ**: Resend API (`RESEND_API_KEY`), SMTP (`SMTP_USER`/`SMTP_PASS`), Google Apps Script Webhook (`/exec`), Gmail OAuth phía client hoặc `mailto`.

---

## 20. Trung Tâm Sao Lưu, Khôi Phục & Đồng Bộ Cloud (Chỉ `ID1460` hoặc `Owner`)

- Tải toàn bộ dữ liệu hệ thống (bao gồm cả Dự án, Kiểm định an toàn, Dụng cụ đồ nghề, Công việc đầu ngày, Chi phí...) dưới dạng `.json` hoặc xuất Excel `.xlsx` / `.csv`.
- Hỗ trợ đồng bộ **Firebase Firestore**, Google Drive, lên lịch sao lưu tự động và khôi phục dữ liệu từ file `.json`.

---

<!-- AUTO-SYNC:NEW-FEATURES:START -->
- Trạng thái đồng bộ: Toàn bộ **19 phân hệ** và **19 module Tab** hiện tại đã có hướng dẫn chi tiết ở các mục trên.
<!-- AUTO-SYNC:NEW-FEATURES:END -->
