/**
 * ============================================================================
 * CẤU HÌNH NỘI DUNG HIỂN THỊ GIAO DIỆN (UI TEXTS)
 * ============================================================================
 * Bạn có thể chỉnh sửa trực tiếp các dòng chữ trong cặp dấu nháy '...' dưới đây
 * để thay đổi tên hệ thống, tiêu đề các màn hình, tên menu hoặc nhãn biểu mẫu.
 * Nếu muốn ẩn một chú thích/mô tả nào đó, chỉ cần để chuỗi rỗng ''.
 * ============================================================================
 */

export const UI_TEXTS = {
  // 1. Tiêu đề chính trên thanh Header & trang Đăng nhập
  brand: {
    appName: 'FACILITY SYSTEM MANAGEMENT',
    subtitle: '', // Để trống nếu không cần dòng mô tả dưới tên hệ thống
  },

  // 2. Danh sách Menu bên trái (Sidebar)
  navigation: {
    sectionTitle: 'Phân Hệ Quản Lý',
    items: {
      dashboard: { label: 'Tổng Quan O&M', desc: '' },
      admin_dashboard: { label: 'Dashboard Admin', desc: '' },
      my_tasks: { label: 'Việc Được Giao', desc: '' },
      profile: { label: 'Hồ Sơ Cá Nhân', desc: '' },
      equipment: { label: 'Danh Sách Thiết Bị', desc: '' },
      maintenance: { label: 'Kế Hoạch & Lịch Sử', desc: '' },
      inspection_calibration: { label: 'Kiểm Định & Hiệu Chuẩn', desc: '' },
      tools: { label: 'Dụng Cụ & Đồ Nghề', desc: '' },
      tickets: { label: 'Quản Lý Tickets', desc: '' },
      projects: { label: 'Quản Lý Dự Án', desc: '' },
      spare_parts: { label: 'Kho Phụ Tùng', desc: '' },
      documents: { label: 'Tra Cứu Tài Liệu', desc: '' },
      energy: { label: 'Năng Lượng Điện - Nước', desc: '' },
      costs: { label: 'Quản Lý Chi Phí', desc: '' },
      employees: { label: 'Nhân Viên & Phân Quyền', desc: '' },
      employee_performance: { label: 'Đánh Giá Hiệu Quả NV', desc: '' },
      logs: { label: 'Nhật Ký Hệ Thống', desc: '' },
      email_alerts: { label: 'Thông Báo Email', desc: '' },
    },
  },

  // 3. Màn hình Tổng Quan (Dashboard)
  dashboard: {
    heroTitle: 'Trung Tâm Điều Hành Bảo Trì & Năng Lượng',
    heroDescription: '', // Để trống để ẩn đoạn mô tả dài
    d3SummaryTitle: 'Phân Tích Bảo Trì Quá Hạn & Lịch Trọng Điểm',
    calendarTitle: 'Lịch Bảo Trì Phòng Ngừa 30 Ngày Tới',
    auditSectionTitle: 'Nhật Ký Tác Động Hệ Thống Gần Nhất',
  },

  // 4. Tiêu đề các phân hệ (Tabs)
  tabs: {
    myTasks: {
      badge: 'Công Việc Của Tôi',
      title: 'Danh Sách Công Việc Được Giao',
    },
    equipment: {
      title: 'Danh Mục Quản Lý Máy Móc & Thiết Bị',
    },
    maintenance: {
      historyBadge: 'Lịch Sử Bảo Trì',
      calendarBadge: 'Lịch Bảo Trì',
      plansBadge: 'Kế Hoạch Định Kỳ',
      historyTitle: 'Lịch Sử Bảo Trì Máy Móc',
      calendarTitle: 'Lịch Bảo Trì Định Kỳ (Kéo Thả Sắp Xếp Lịch)',
      plansTitle: 'Kế Hoạch Bảo Trì Định Kỳ',
    },
    inspectionCalibration: {
      badge: 'An Toàn & Đo Lường',
      title: 'Kiểm Định An Toàn & Hiệu Chuẩn Thiết Bị',
    },
    tools: {
      badge: 'Dụng Cụ Kỹ Thuật',
      title: 'Quản Lý Dụng Cụ & Đồ Nghề Bảo Trì',
    },
    tickets: {
      title: 'Quản Lý Tickets Yêu Cầu & Sự Cố',
    },
    projects: {
      badge: 'Quản Lý Dự Án',
      title: 'Quản Lý Dự Án Kỹ Thuật & Hạ Tầng',
    },
    spareParts: {
      title: 'Quản Lý Kho Vật Tư & Xuất Nhập Phụ Tùng',
    },
    documents: {
      badge: 'Tài Liệu & SOP',
      title: 'Tra Cứu Tài Liệu, Checklist & Hướng Dẫn Công Việc (SOP)',
    },
    energy: {
      title: 'Giám Sát & Phân Tích Năng Lượng Điện - Nước',
    },
    costs: {
      title: 'Quản Lý Chi Phí Bảo Trì & Mua Sắm Nhà Máy',
    },
    employees: {
      badge: 'Nhân Sự & Phân Quyền',
      title: 'Quản Lý Nhân Viên & Phân Quyền Giao Diện',
    },
    profile: {
      badge: 'Hồ Sơ Nhân Viên',
      title: 'Hồ Sơ Cá Nhân & Chế Độ Nghỉ Phép',
    },
    adminDashboard: {
      badge: 'Chỉ Dành Cho Admin',
      title: 'Dashboard Admin — Phân Tích KPI Vận Hành (OEE · MTBF · MTTR)',
    },
    employeePerformance: {
      badge: 'Chỉ Dành Cho Admin',
      title: 'Đánh Giá Hiệu Quả Công Việc & Khối Lượng Nhân Sự',
    },
    logs: {
      title: 'Nhật Ký Tác Động Toàn Hệ Thống',
    },
    emailAlerts: {
      badge: 'Thông Báo Email',
      title: 'Cấu Hình & Nhật Ký Gửi Email Thông Báo',
    },
  },

  // 5. Form Giao Việc & Gửi Email Thông Báo
  workAssignment: {
    titlePrefix: 'Giao Việc & Gửi Email Thông Báo',
    assigneeLabel: 'Người Thực Hiện',
    assignerLabel: 'Người Giao Việc',
    assignerPlaceholder: '-- Chọn người giao việc --',
    noteLabel: 'Nội Dung Chỉ Đạo / Yêu Cầu Thực Hiện',
    sendEmailLabel: 'Gửi email thông báo cho người thực hiện',
    submitEmailButton: 'Xác Nhận Giao Việc & Gửi Mail',
    submitSaveButton: 'Lưu Phân Công',
  },
} as const;
