# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG FACILITY SYSTEM MANAGEMENT (CMMS)

Tài liệu này hướng dẫn chi tiết cách vận hành toàn bộ phân hệ quản lý bảo trì thiết bị, kiểm định an toàn, dụng cụ đồ nghề, dự án kỹ thuật, sự cố, vật tư, năng lượng và dự báo chi phí trên **FACILITY SYSTEM MANAGEMENT**.

> **Cơ chế tự động cập nhật**: Các bảng danh mục phân hệ và số liệu hệ thống trong tài liệu này được đồng bộ tự động từ mã nguồn mỗi khi chạy `npm run sync-docs` hoặc `npm run build`.

---

## Thông Tin Hệ Thống Hiện Hành (Tự Động Đồng Bộ)

<!-- AUTO-SYNC:SYSTEM-SNAPSHOT:START -->
- **Phiên bản dữ liệu (`CMMS_DATA_VERSION`)**: `v18_calendar_dnd_inspection_tools`
- **Số liệu mẫu tích hợp sẵn**: 131 thiết bị · 131 kế hoạch bảo trì · 115 biên bản lịch sử · 8 hồ sơ kiểm định/hiệu chuẩn · 8 bộ dụng cụ & đồ nghề · 4 dự án kỹ thuật · 56 mã phụ tùng · 6 tài liệu SOP/Checklist · 8 nhân sự.
- **Tài khoản quản lý & quản trị mẫu**: `ID1460` (Khiêm Huỳnh — Admin), `ID0344` (Tuấn Lê — Người quản lý).
<!-- AUTO-SYNC:SYSTEM-SNAPSHOT:END -->

### Danh Mục Toàn Bộ Phân Hệ (Tự Động Đồng Bộ)

<!-- AUTO-SYNC:MENU-CATALOG:START -->
> *Bảng này được script `scripts/syncDocs.ts` tự động sinh từ `APP_VIEW_OPTIONS` & `UI_TEXTS` (17 phân hệ đang hoạt động).*

| STT | Mã View (`id`) | Tên Menu Hiển Thị | Chức Năng Chính | Phạm Vi Truy Cập | Component |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | `dashboard` | **Tổng Quan O&M** | Bảng điều hành nhà máy | Tất cả nhân sự (tùy chỉnh theo View) | `DashboardTab` |
| 2 | `admin_dashboard` | **Dashboard Admin** | OEE, MTBF, MTTR & KPI vận hành | Chỉ Admin / Owner (`ID1460`) | `AdminDashboardTab` |
| 3 | `my_tasks` | **Việc Được Giao** | Nhiệm vụ của tôi | Tất cả nhân sự (tùy chỉnh theo View) | `MyTasksTab` |
| 4 | `equipment` | **Danh Sách Thiết Bị** | Máy móc & Mã QR | Tất cả nhân sự (tùy chỉnh theo View) | `EquipmentTab` |
| 5 | `maintenance` | **Kế Hoạch & Lịch Sử** | Bảo trì định kỳ | Tất cả nhân sự (tùy chỉnh theo View) | `MaintenanceTab` |
| 6 | `inspection_calibration` | **Kiểm Định & Hiệu Chuẩn** | An toàn, hiệu chuẩn & nhắc hạn | Tất cả nhân sự (tùy chỉnh theo View) | `SafetyInspectionTab` |
| 7 | `tools` | **Dụng Cụ & Đồ Nghề** | Cấp phát, mượn trả & kiểm kê | Tất cả nhân sự (tùy chỉnh theo View) | `ToolsManagementTab` |
| 8 | `tickets` | **Quản Lý Tickets** | Yêu cầu & sự cố | Tất cả nhân sự (tùy chỉnh theo View) | `TicketsTab` |
| 9 | `projects` | **Quản Lý Dự Án** | Tiến độ, WBS, Kanban & Ngân sách | Tất cả nhân sự (tùy chỉnh theo View) | `ProjectsTab` |
| 10 | `spare_parts` | **Kho Phụ Tùng** | Xuất nhập tồn kho | Tất cả nhân sự (tùy chỉnh theo View) | `SparePartsTab` |
| 11 | `documents` | **Tra Cứu Tài Liệu** | SOP & Checklist | Tất cả nhân sự (tùy chỉnh theo View) | `DocumentsTab` |
| 12 | `energy` | **Năng Lượng Điện - Nước** | EVN, Solar & Đồng hồ | Tất cả nhân sự (tùy chỉnh theo View) | `EnergyTab` |
| 13 | `costs` | **Quản Lý Chi Phí** | Mua sắm & Sửa chữa | Quản lý / Kỹ sư / Admin (hoặc cấp quyền View) | `CostTab` |
| 14 | `employees` | **Nhân Viên & Phân Quyền** | Tài khoản & Chức vụ | Quản lý / Kỹ sư / Admin (hoặc cấp quyền View) | `EmployeesTab` |
| 15 | `employee_performance` | **Đánh Giá Hiệu Quả NV** | Khối lượng & hiệu suất (Admin) | Chỉ Admin / Owner (`ID1460`) | `EmployeePerformanceTab` |
| 16 | `logs` | **Nhật Ký Hệ Thống** | Lịch sử thao tác | Quản lý / Kỹ sư / Admin (hoặc cấp quyền View) | `AuditLogTab` |
| 17 | `email_alerts` | **Thông Báo Email** | Cấu hình thông báo | Quản lý / Kỹ sư / Admin (hoặc cấp quyền View) | `EmailAlertsTab` |
<!-- AUTO-SYNC:MENU-CATALOG:END -->

---

## 1. Đăng Nhập, Đổi Mật Khẩu, Giao Diện & Cảnh Báo Nhanh

1. **Đăng nhập**:
   - Nhập **Mã nhân viên** (hoặc tên đăng nhập / email) và **Mật khẩu** để vào hệ thống.
   - Hệ thống hỗ trợ các cấp phân quyền: `Owner`, `Admin`, `Quản trị viên`, `Người quản lý` (ví dụ `ID0344` — Tuấn Lê), `Trưởng phòng Kỹ thuật`, `Kỹ sư thiết bị`, `Kỹ thuật viên`, `Nhân viên vận hành`.
2. **Đổi mật khẩu**:
   - Bấm vào tên tài khoản ở góc trên bên phải thanh Header → chọn **Đổi Mật Khẩu Tài Khoản**.
   - Nhập mật khẩu hiện tại, mật khẩu mới (tối thiểu 4 ký tự) và xác nhận mật khẩu mới.
3. **Chuyển đổi Nền Tối / Nền Sáng**:
   - Bấm nút **Nền Sáng / Nền Tối** trên thanh Header để thay đổi giao diện phù hợp môi trường làm việc.
4. **Chuông Cảnh Báo Vận Hành & Quét Mã QR**:
   - **Chuông thông báo**: Tự động tổng hợp 4 nhóm cảnh báo thời gian thực: thiết bị **quá hạn bảo trì**, thiết bị **kiểm định an toàn / hiệu chuẩn quá hạn hoặc sắp đến hạn**, phụ tùng **tồn kho dưới mức tối thiểu** và **Ticket khẩn cấp**. Nhấp vào từng cảnh báo để mở thẳng phân hệ xử lý.
   - **Nút Quét QR**: Mở camera thiết bị (hoặc nhập tay mã thiết bị) để tra cứu hồ sơ máy, ghi nhận bảo trì/sửa chữa hoặc tạo Ticket ngay tại hiện trường.
5. **Giao diện tối ưu di động (Card View thu gọn)**:
   - Trên màn hình điện thoại và tablet nhỏ, các bảng công việc, lịch sử bảo trì, kiểm định an toàn và dụng cụ đồ nghề tự động chuyển sang **Card view thu gọn** giúp thao tác chạm và đọc nhanh không cần cuộn ngang nhiều cột.

---

## 2. Công Việc Được Giao (`Việc Được Giao`)

Ngay sau khi đăng nhập thành công:
- Trên màn hình **Tổng Quan O&M**, khối **Công Việc Được Giao** hiển thị số lượng kế hoạch bảo trì (quá hạn / tới hạn / sắp tới) và Tickets đang giao cho chính bạn kèm nút thao tác nhanh.
- Trong menu **Việc Được Giao** (hiển thị huy hiệu tổng số đầu việc cần xử lý):
  - **Cần Xử Lý**: Lọc tự động các Ticket đang mở và lịch bảo trì sắp/quá hạn của bạn.
  - **Bảo Trì**: Toàn bộ kế hoạch bảo trì bạn phụ trách. Bấm **Thực Hiện Bảo Trì** để mở biểu mẫu nghiệm thu.
  - **Tickets**: Các phiếu sự cố giao cho bạn (bao gồm công việc giao nhiều người). Có thể bấm **Bắt Đầu Làm**, **Cập Nhật / Ảnh** (chụp ảnh trước/sau), hoặc **Hoàn Thành** để hệ thống tự động gửi email báo cáo về Admin và Kỹ sư thiết bị.
  - **Thiết Bị / Đã Làm**: Tra cứu máy móc phụ trách và lịch sử công việc bạn đã hoàn thành.

---

## 3. Tổng Quan O&M (`Dashboard`)

- **Thẻ KPI tổng hợp**: Theo dõi tình trạng thiết bị đang chạy/sửa chữa, bảo trì quá hạn/tới hạn, Tickets đang mở, vật tư tồn kho thấp, sản lượng điện EVN/Solar và tổng chi phí vận hành.
- **Phân Tích Bảo Trì Quá Hạn & Lịch Trọng Điểm (Biểu đồ D3)**: Nhấp vào từng trạng thái trên biểu đồ hoặc nhóm hệ thống để lọc nhanh danh sách thiết bị cần ưu tiên.
- **Lịch Bảo Trì Phòng Ngừa 30 Ngày Tới**: Xem lịch dự kiến trong tháng và nhấp vào từng ngày để xem danh sách thiết bị cần bảo trì.

---

## 4. Dashboard Admin — Phân Tích KPI Vận Hành (`Dashboard Admin` — Chỉ Admin/Owner)

- Menu này **chỉ hiển thị với cấp `Owner`, `Admin`, `Quản trị viên` và `ID1460`**.
- Lọc dữ liệu theo khoảng thời gian (`30D`, `90D`, `180D`, `ALL`), hệ thống thiết bị và số giờ vận hành/ngày (1 ca = 8h, 2 ca = 16h, 3 ca = 24h):
  - **OEE (Hiệu suất thiết bị tổng thể = Availability × Performance × Quality)** hiển thị trên biểu đồ đồng hồ D3 kèm mốc chuẩn 85%.
  - **MTBF (Thời gian trung bình giữa các lần hỏng hóc)** và **MTTR (Thời gian trung bình để sửa chữa)**.
  - **Tỷ lệ Bảo trì phòng ngừa (PM) / Sửa chữa khắc phục (CM)**.
  - Biểu đồ D3 xu hướng OEE & thời gian dừng máy theo tháng, biểu đồ phân bổ theo hệ thống và bảng xếp hạng độ tin cậy từng thiết bị (có nút **Xuất CSV**).

---

## 5. Danh Sách Thiết Bị & Mã QR (`Danh Sách Thiết Bị`)

- **Tìm kiếm & lọc**: Theo mã máy, tên thiết bị, hệ thống (`Hệ Thống Lạnh`, `HVAC/ACMV`, `Electrical`, `Compressor`, `Pump`, `Fire Protection`...), trạng thái và mức độ rủi ro.
- **Thêm / Sửa thiết bị**: Nhập thông số kỹ thuật, chụp ảnh trực tiếp bằng camera hoặc tải ảnh từ máy.
- **Tạo & In Mã QR**: Bấm biểu tượng **QR** để xem hoặc in tem QR dán tại hiện trường.
- **Giao Việc**: Bấm **Giao Việc** để chọn một hoặc nhiều người phụ trách (`MultiAssigneePicker`), chọn **Người Giao Việc** và tùy chọn gửi Email thông báo trực tiếp.

---

## 6. Kế Hoạch Bảo Trì, Lịch Sử, Phân Biệt Loại Công Việc, Lịch Kéo Thả & Xuất Excel

Phân hệ gồm 3 chế độ xem chuyển đổi ở góc trên:

1. **Lịch Sử Bảo Trì**:
   - Hỗ trợ chuyển đổi **Dạng Bảng** / **Dạng Thẻ** (trên mobile tự động dùng Card view thu gọn).
   - **Phân biệt rõ 2 loại công việc** trong mục **Ghi Nhận Hoàn Tất Bảo Trì / Sửa Chữa**:
     - **Bảo trì theo kế hoạch**: Lưu biên bản vào lịch sử, đồng thời **tự động tính ngày & tạo/cập nhật kế hoạch bảo trì kỳ tiếp theo** dựa theo tần suất (`Daily`, `Weekly`, `Monthly`, `Quarterly`, `Yearly`).
     - **Sửa chữa**: Chỉ ghi nhận lịch sử sửa chữa vào hồ sơ thiết bị và thống kê MTBF/MTTR, **không làm dịch chuyển lịch bảo trì định kỳ** sẵn có.
   - Hỗ trợ chọn **nhiều Người Thực Hiện** cùng lúc, chụp **Ảnh Trước** và **Ảnh Sau**, tự động gửi Email báo cáo hoàn thành.
2. **Kế Hoạch Bảo Trì**:
   - Theo dõi ngày bảo trì gần nhất, ngày kế tiếp, trạng thái (`Quá hạn`, `Tới hạn`, `Sắp tới`, `Đúng hạn`), giao việc nhiều người và gửi email cảnh báo thiết bị đến hạn.
3. **Lịch Bảo Trì (Calendar View — Kéo Thả Sắp Xếp Lịch)**:
   - Hiển thị 4 thẻ tổng hợp trong tháng, lưới lịch tháng trực quan và danh sách **Việc Chưa Thực Hiện Cần Sắp Xếp**.
   - **Kéo thả đổi lịch**: Kéo thẻ công việc bảo trì chưa hoàn thành (`Quá hạn`, `Tới hạn`, `Sắp tới`) thả vào ô ngày mong muốn trong tháng để dời lịch; trên thiết bị cảm ứng hoặc bàn phím có thể dùng bộ chọn ngày nhanh ở khung chi tiết ngày.
   - Khi đổi lịch, hệ thống tự động đồng bộ lại `hanBaoTriTiepTheo` của thiết bị, ghi nhật ký tác động và hiển thị nút **Hoàn tác** ngay trên thông báo nếu cần quay lại ngày cũ.
4. **Xuất Dữ Liệu Excel (`.xlsx`) & CSV**:
   - Xuất báo cáo tổng hợp **4 Sheets** (`Tong_Hop_KPI`, `Lich_Su_Bao_Tri`, `Ke_Hoach_Bao_Tri`, `Sua_Chua_Tickets`) hoặc từng phân hệ riêng lẻ kèm khung ký duyệt in ấn cho bộ phận kỹ thuật.

---

## 7. Kiểm Định An Toàn & Hiệu Chuẩn (`Kiểm Định & Hiệu Chuẩn`)

- Quản lý thiết bị áp lực, nâng hạ, đo lường và PCCC/môi trường theo 3 nhóm: `Kiểm định an toàn`, `Hiệu chuẩn đo lường`, `Kiểm tra PCCC / Môi trường`.
- **Trạng thái tự động theo hạn**: Hệ thống tự động tính số ngày còn lại để gắn trạng thái `Quá hạn`, `Sắp đến hạn` (trong ngưỡng `nhacTruocNgay`, mặc định 30 ngày), `Còn hạn` hoặc `Đang kiểm định`.
- **Nhắc lịch tự động**:
  - Hiển thị banner cảnh báo ngay đầu phân hệ, huy hiệu số hồ sơ tới/quá hạn trên Sidebar và hiển thị trực tiếp trong chuông **Cảnh Báo Vận Hành** trên Header.
  - Tự động gửi email nhắc lịch mỗi ngày (`KIEM_DINH_DEN_HAN`) khi có hồ sơ tới/quá hạn (có công tắc bật/tắt tự động và nút **Gửi Nhắc Lịch Ngay** thủ công).
- **Nghiệm thu & Gia hạn kỳ mới**: Bấm **Cập Nhật Kiểm Định** để nhập số tem/giấy chứng nhận mới, đơn vị thực hiện và kết quả; hệ thống tự cộng chu kỳ (`3/6/12/24/36 tháng`) ra ngày hết hạn tiếp theo và lưu lịch sử từng lần kiểm định. Hỗ trợ xuất CSV.

---

## 8. Quản Lý Dụng Cụ & Đồ Nghề (`Dụng Cụ & Đồ Nghề`)

- **Danh mục Dụng cụ & Đồ nghề**: Theo dõi số lượng tổng, số lượng khả dụng, đang mượn, vị trí lưu, số serial, tình trạng (`Tốt`, `Đang sử dụng`, `Cần bảo dưỡng`, `Hư hỏng`, `Thất lạc`) và **hạn hiệu chuẩn** đối với thiết bị đo kiểm.
- **Sổ Nhật Ký Mượn / Trả / Bảo Dưỡng**:
  - Bấm **Mượn / Trả** trên từng dụng cụ để ghi nhận giao dịch `Mượn`, `Trả`, `Bảo dưỡng` hoặc `Kiểm kê` kèm người mượn, người bàn giao và hạn trả dự kiến.
  - Tự động trừ/cộng số lượng khả dụng – đang mượn, cảnh báo dụng cụ **quá hạn trả** và hỗ trợ lọc, Card view trên mobile cùng xuất CSV.

---

## 9. Quản Lý Tickets (`Quản Lý Tickets`)

- Chuyển đổi linh hoạt giữa **Dạng Thẻ** và **Dạng Bảng**; lọc theo mức độ ưu tiên (`Khẩn cấp`, `Cao`, `Trung bình`...), trạng thái và người phụ trách.
- Hỗ trợ chọn nhiều người phụ trách, chụp ảnh hiện trạng trước/sau xử lý, tự động gửi email báo cáo khi chuyển sang **Hoàn thành** và xuất Excel (`.xlsx`) / CSV.

---

## 10. Quản Lý Dự Án Kỹ Thuật (`Quản Lý Dự Án`)

- Quản lý các dự án `Nâng cấp hạ tầng`, `Lắp đặt thiết bị mới`, `Tiết kiệm năng lượng`, `An toàn & Môi trường`, `Cải tạo hệ thống`.
- Chuyển đổi chế độ **Dạng Thẻ / Bảng / Kanban**; tự động tính % tiến độ từ danh sách đầu việc **WBS**.
- Mở chi tiết dự án để quản lý **Công việc (Tasks)**, **Cột mốc (Milestones)**, **Rủi ro (Risks)** và **Ngân sách – Khoản chi (Expenses)**.

---

## 11. Kho Phụ Tùng & Xuất Nhập Kho (`Kho Phụ Tùng`)

- Tra cứu danh mục phụ tùng (`Spare_part`), vị trí lưu kho, đơn giá và cảnh báo mặt hàng chạm mức tồn tối thiểu.
- Ghi nhận **Nhập kho**, **Xuất kho sử dụng** (liên kết thiết bị sử dụng) hoặc **Hoàn kho**; số tồn kho tự động cập nhật và làm đầu vào cho mô hình dự báo tiêu hao chi phí.

---

## 12. Tra Cứu Tài Liệu, SOP & Checklist (`Tra Cứu Tài Liệu`)

- Lưu trữ và tra cứu **Hướng dẫn công việc (SOP)**, **Checklist kiểm tra**, **Tài liệu kỹ thuật**, **An toàn & Biểu mẫu**.
- Hỗ trợ 3 loại nguồn: liên kết tài liệu ngoài, tải tệp trực tiếp và **Checklist tương tác từng bước** để kỹ thuật viên tick trực tiếp tại hiện trường.

---

## 13. Năng Lượng Điện - Nước (`Năng Lượng Điện - Nước`)

1. **Bộ Lọc Nhanh Thông Minh**: Chọn theo **Năm**, **Tháng** và **Chu Kỳ 10 Ngày**.
2. **Cách tính tiền điện EVN & Solar**:
   - **Giờ cao điểm**: 17h30–22h30 (Thứ 2–Thứ 7); Chủ nhật không có giờ cao điểm.
   - **Giờ bình thường**: 06h00–17h30 & 22h30–24h00 (Thứ 2–Thứ 7); Chủ nhật 06h00–24h00.
   - **Giờ thấp điểm**: 00h00–06h00 tất cả các ngày trong tuần.
   - **Điện Solar**: Tính chi phí theo đơn giá giờ bình thường/cao điểm tương ứng và tổng hợp vào chi phí năng lượng phân khung giờ.
3. **Phân tích theo giờ & ca làm việc**, **Nước Tháng** và **Chốt chỉ số hàng ngày** (tự lấy tên tài khoản đang đăng nhập và cảnh báo vượt ngưỡng).

---

## 14. Quản Lý Chi Phí & Dự Báo Ngân Sách 6 Tháng (`Quản Lý Chi Phí`)

- **Quản lý chứng từ chi phí**: Ghi nhận, chỉnh sửa, duyệt và xuất CSV cho các nhóm `Bảo trì định kỳ`, `Sửa chữa đột xuất`, `Mua vật tư thay thế`, `Kiểm định an toàn`, `Dịch vụ ngoài`.
- **Phân tích & Dự báo Chi Phí Bảo Trì 6 Tháng Tới (`12/2026 – 05/2027`)**:
  - Tự động kết hợp **chi phí tiêu hao lịch sử** (xuất kho phụ tùng × đơn giá, sửa chữa đột xuất, hóa đơn mua sắm) với **lịch bảo trì theo chu kỳ** của toàn bộ thiết bị và **lịch kiểm định an toàn sắp tới hạn**.
  - **Biểu đồ đường xu hướng (D3 Trend-Line)**: Hiển thị song song **Thực tế lịch sử** (đường liền), **Dự báo 6 tháng tới** (đường đứt nét + biên độ tin cậy), cột phân tách *Chu kỳ bảo trì* vs *Tiêu hao & Sửa chữa* và **Đường xu hướng tuyến tính (OLS)**.
  - **Tùy chỉnh kịch bản**: Chuyển chuỗi tham chiếu **3 tháng / 6 tháng gần nhất**, chọn mức dự phòng (**0% / +10% / +20%**), bật/tắt gộp chi phí kiểm định an toàn, nhấp vào từng tháng dự báo để xem **thiết bị/hạng mục phát sinh chi phí cao nhất** và bấm **Xuất Dự Báo CSV**.

---

## 15. Nhân Viên & Phân Quyền View (`Nhân Viên & Phân Quyền`)

- Thêm mới / cập nhật nhân sự, chụp ảnh đại diện trực tiếp.
- Phân quyền **View được phép xem** theo từng tài khoản để ẩn/hiện từng menu tương ứng với vai trò công việc.

---

## 16. Đánh Giá Hiệu Quả NV (`Đánh Giá Hiệu Quả NV` — Chỉ Admin/Owner)

- Chỉ hiển thị với tài khoản cấp **Admin / Owner (`ID1460`)**.
- Thống kê theo khoảng thời gian (`Tất cả`, `30 ngày`, `90 ngày`), tìm kiếm, lọc theo chức vụ: khối lượng bảo trì được giao, số việc quá hạn, tỷ lệ hoàn thành & đạt chuẩn, Tickets xử lý và **Điểm hiệu quả tổng hợp (0–100)** kèm biểu đồ D3 và xuất CSV.

---

## 17. Nhật Ký Hệ Thống & Thông Báo Email

- **Nhật Ký Hệ Thống**: Ghi vết toàn bộ thao tác thêm/sửa/xóa, dời lịch bảo trì, nghiệm thu kiểm định, mượn trả dụng cụ, chốt số điện nước và đăng nhập.
- **Thông Báo Email**: Cấu hình người nhận chính, CC, phương thức gửi (`Webhook` hoặc `mailto`), bật/tắt kích hoạt cho Ticket mới, bảo trì đến/quá hạn và **nhắc lịch kiểm định an toàn (`Nhắc Hạn Kiểm Định`)**.

---

## 18. Trung Tâm Sao Lưu & Khôi Phục Dữ Liệu (Chỉ `ID1460` hoặc `Owner`)

- Tải toàn bộ dữ liệu hệ thống (bao gồm cả Dự án, Kiểm định an toàn, Dụng cụ đồ nghề, Chi phí...) dưới dạng `.json` hoặc xuất Excel `.xlsx` / `.csv`.
- Hỗ trợ đồng bộ Google Drive, lên lịch sao lưu tự động và khôi phục dữ liệu từ file `.json`.

---

<!-- AUTO-SYNC:NEW-FEATURES:START -->
- Trạng thái đồng bộ: Toàn bộ **17 phân hệ** và **17 module Tab** hiện tại đã có hướng dẫn chi tiết ở các mục trên.
<!-- AUTO-SYNC:NEW-FEATURES:END -->
