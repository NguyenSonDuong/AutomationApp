# Electron Automation Dashboard

Ứng dụng quản lý và chạy tự động hóa kịch bản đa luồng tích hợp **Express (Clean Architecture + SQLite + Socket.io)**, **ReactJS (Vite + TypeScript)** và **Electron**.

---

## 📌 Tổng Quan Kiến Trúc Dự Án

Dự án được thiết kế dưới dạng Monorepo chia làm 3 phân hệ độc lập:
1.  **`/server`**: Backend xử lý lưu trữ SQLite (database.sqlite) có cơ chế tự động di cư (automatic migrations) và giao tiếp Socket.io thời gian thực. Viết bằng TypeScript và tổ chức theo kiến trúc sạch (**Clean Architecture**).
2.  **`/frontend`**: Giao diện ứng dụng viết bằng ReactJS (Vite + TypeScript) sử dụng phong cách **Glassmorphism Dark Theme** bóng bẩy, kết nối thời gian thực bằng Socket.io-client.
3.  **`/desktop`**: Lớp vỏ bọc máy tính ứng dụng máy tính (**Electron wrapper**) nạp trực tiếp môi trường giao diện ReactJS.

---

## 📂 Cấu Trúc Thư Mục Chi Tiết

```
ElectronAutomation/
├── package.json          # Root package.json điều phối chạy dự án
├── GEMINI.md             # Bộ quy tắc phát triển dành cho AI (System Prompt)
├── README.md             # Hướng dẫn dự án này
├── database.sqlite       # Cơ sở dữ liệu SQLite cục bộ (Tự động sinh)
│
├── server/               # MODULE SERVER (Express Backend)
│   ├── src/
│   │   ├── domain/       # Các thực thể nghiệp vụ (Entities, DTOs, Repository interfaces)
│   │   │   ├── entities/
│   │   │   ├── dto/
│   │   │   └── repositories/
│   │   ├── use-cases/    # Kịch bản nghiệp vụ độc lập (Ví dụ: CreateProxy, GetProjects)
│   │   ├── adapters/     # Controllers xử lý nhận dữ liệu HTTP/Socket
│   │   └── infrastructure/
│   │       ├── database/ # Kết nối SQLite và bộ chạy Migration tự động
│   │       ├── repositories/ # Cài đặt SQLite Repositories cụ thể
│   │       └── webserver/# Thiết lập định tuyến Router Express chi tiết theo nhóm API
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/             # MODULE FRONTEND (React Client)
│   ├── src/
│   │   ├── assets/       # Tải tài nguyên hình ảnh
│   │   ├── App.tsx       # Logic giao diện Dashboard chính & kết nối WebSocket
│   │   ├── App.css       # Style Glassmorphic và hiệu ứng
│   │   └── index.css     # Định nghĩa các biến CSS Palette
│   ├── package.json
│   └── vite.config.ts    # Cấu hình Vite chạy ở cổng cố định 5182
│
└── desktop/              # MODULE DESKTOP (Electron Wrapper)
    ├── main.js           # Electron Main process tạo cửa sổ
    ├── preload.js        # Electron Bridge bảo mật
    └── package.json
```

---

## 🛠️ Các Thư Viện Sử Dụng

### 1. Root Workspace Orchestrator
*   `concurrently`: Chạy đồng thời máy chủ Server, Frontend và Electron trên một Terminal.
*   `wait-on`: Đợi máy chủ ReactJS khởi động xong trên cổng `5182` mới kích hoạt khởi động Electron.

### 2. Server (Express Backend)
*   `express`: Framework HTTP Server.
*   `socket.io`: Thư viện giao tiếp WebSocket thời gian thực hai chiều.
*   `sqlite` & `sqlite3`: Hệ quản trị cơ sở dữ liệu SQLite siêu nhẹ lưu file trực tiếp.
*   `cors`: Cho phép chia sẻ tài nguyên chéo nguồn (CORS) giữa React và Express.
*   `dotenv`: Quản lý biến môi trường.
*   `typescript` & `ts-node` & `nodemon`: Biên dịch, thông dịch TypeScript trực tiếp và tự động khởi động lại server khi lưu file code.

### 3. Frontend (React JS)
*   `react` & `react-dom`: Thư viện lõi xây dựng giao diện.
*   `socket.io-client`: Lắng nghe sự kiện đồng bộ từ Socket.io Server.
*   `vite`: Công cụ đóng gói ứng dụng ReactJS siêu tốc.

### 4. Desktop (Electron)
*   `electron`: Cung cấp lớp vỏ Chrome-V8 chạy ứng dụng giống như ứng dụng Destop bản xứ.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### 📋 Yêu cầu hệ thống
*   Đã cài đặt **NodeJS** (Khuyến nghị phiên bản LTS từ 18 trở lên).
*   Đã cài đặt **Yarn** (Nếu chưa có, trình cài đặt gốc sẽ tự động sử dụng Yarn cục bộ).

### 1. Cài đặt toàn bộ dependencies
Chạy lệnh duy nhất tại thư mục gốc để tải và cài đặt toàn bộ gói thư viện cho cả 3 module con:
```bash
yarn install:all
# hoặc: npm run install:all
```

### 2. Khởi động dự án
Chạy lệnh khởi động đồng thời cả 3 thành phần (Backend, Frontend và Electron) lên màn hình:
```bash
yarn start
# hoặc: npm run start
```

### 💡 Lưu ý vận hành:
*   Mặc định, hệ thống chạy **Server** trên cổng `3000` và **ReactJS** trên cổng `5182`.
*   Khi bạn **đóng ứng dụng Electron**, toàn bộ hệ thống Express server và ReactJS dev server sẽ tự động được tắt theo để giải phóng cổng mạng của hệ điều hành (nhờ cờ `--kill-others` cấu hình ở script).
*   Mọi thay đổi cấu trúc bảng cơ sở dữ liệu ở server sẽ tự động áp dụng thông qua tệp [migrations.ts](file:///i:/Project/ReacJS/ElectronAutomation/server/src/infrastructure/database/migrations.ts) khi bạn khởi động lại ứng dụng.
