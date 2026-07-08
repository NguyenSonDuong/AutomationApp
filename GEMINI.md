# HƯỚNG DẪN DỰ ÁN & QUY TẮC PHÁT TRIỂN (GEMINI.md)

Chào mừng Gemini! Đây là tài liệu hướng dẫn và cấu hình hệ thống quy tắc phát triển dự án tích hợp Nodejs Express, Socket.io, ReactJS (Vite) và Electron. Tài liệu này đóng vai trò là **System Prompt** cho các tác vụ AI CLI trong tương lai để luôn đảm bảo tính đồng bộ, kiến trúc sạch và chất lượng code.

---

## 📌 Cấu Trúc Tổng Quan Dự Án
Dự án được phân chia thành 3 thư mục độc lập để quản lý rõ ràng vai trò:
1. `/server`: Backend Express + Socket.io sử dụng TypeScript và kiến trúc Clean Architecture. Lưu trữ dữ liệu với SQLite.
2. `/frontend`: Frontend ReactJS sử dụng TypeScript và build bằng Vite. Giao diện thiết kế theo phong cách hiện đại (Premium, Glassmorphism, Dark mode).
3. `/desktop`: Electron app làm vỏ bọc ngoài cho ReactJS, tích hợp preload script an toàn.

---

## 🏗️ Quy Tắc Kiến Trúc Sạch (Clean Architecture) cho `/server`

Mọi tệp tin trong thư mục `/server` bắt buộc phải tuân theo sơ đồ phân tầng Clean Architecture. Quy tắc cốt lõi: **Sự phụ thuộc chỉ đi từ ngoài vào trong, các tầng bên trong tuyệt đối không phụ thuộc vào tầng bên ngoài.**

Sơ đồ phân tầng từ trong ra ngoài:
```
[ Domain (Trong cùng) ] <--- [ Use Cases ] <--- [ Adapters ] <--- [ Infrastructure (Ngoài cùng) ]
```

### 1. Tầng Domain (Domain Layer) - `src/domain/`
*   **Mô tả**: Chứa thực thể kinh doanh (Entities) và định nghĩa giao diện (Interfaces/Contracts) cho Repositories.
*   **Quy tắc**:
    *   Tuyệt đối **không import** bất kỳ thư viện bên ngoài hoặc framework nào (không Express, không SQLite, v.v.).
    *   Chỉ chứa định nghĩa kiểu dữ liệu (Types/Interfaces/Classes) đại diện cho nghiệp vụ và các hàm logic nghiệp vụ thuần túy.
*   *Ví dụ*: `src/domain/entities/Task.ts`, `src/domain/repositories/ITaskRepository.ts`

### 2. Tầng Use Cases (Use Cases Layer) - `src/use-cases/`
*   **Mô tả**: Chứa các kịch bản nghiệp vụ (Business logic/Application rules) của dự án.
*   **Quy tắc**:
    *   Mỗi Use Case chỉ thực hiện **một nhiệm vụ duy nhất** (Ví dụ: `CreateTask`, `GetTasks`).
    *   Chỉ tương tác với Repository thông qua Interface ở tầng Domain.
    *   Không phụ thuộc vào Express (HTTP) hay Socket.io hay Database cụ thể.
*   *Ví dụ*: `src/use-cases/CreateTask.ts`, `src/use-cases/GetTasks.ts`

### 3. Tầng Adapters (Interface Adapters Layer) - `src/adapters/`
*   **Mô tả**: Cầu nối giữa thế giới bên ngoài (HTTP, WebSockets) và các Use Cases của ứng dụng.
*   **Quy tắc**:
    *   Chứa các **Controllers** nhận request (từ HTTP, Socket.io), chuyển đổi dữ liệu đầu vào và gọi Use Case tương ứng.
    *   Chuyển đổi dữ liệu trả về từ Use Case thành định dạng phản hồi phù hợp.
*   *Ví dụ*: `src/adapters/controllers/TaskController.ts`, `src/adapters/controllers/TaskSocketController.ts`

### 4. Tầng Infrastructure (Infrastructure Layer) - `src/infrastructure/`
*   **Mô tả**: Chứa các chi tiết kỹ thuật thực tế (Express Web server, Socket.io Server, kết nối SQLite, Implement các Repositories).
*   **Quy tắc**:
    *   Đây là nơi duy nhất khai báo Express Router, thư viện sqlite, socket.io server.
    *   Lớp Repository cụ thể sẽ triển khai Interface được định nghĩa trong tầng Domain.
*   *Ví dụ*: `src/infrastructure/database/sqlite.ts`, `src/infrastructure/repositories/SqliteTaskRepository.ts`, `src/infrastructure/webserver/express.ts`

---

## 🎨 Quy Tắc Giao Diện và Thiết Kế `/frontend`
*   **Mỹ thuật (Aesthetics)**: Thiết kế theo ngôn ngữ **Flat Design** tối giản hiện đại. Sử dụng các đường nét dứt khoát, màu sắc đơn sắc rõ ràng, kiểu chữ sắc nét (Outfit, Inter) và hạn chế đổ bóng/gradient không cần thiết.
*   **Bảng màu (Warm Light Theme)**: Bắt buộc sử dụng hệ màu ấm mặc định:
    *   Màu nền chính: Cream Beige (`#faf6f0`)
    *   Màu nền phụ: Warm Beige (`#f4eae1`)
    *   Màu nền card: Trắng (`#ffffff`)
    *   Màu viền: Soft Clay (`#e5d5c5`)
    *   Màu chữ chính: Dark Brown (`#3d3228`)
    *   Màu nhấn: Amber/Orange (`#d97706` / `#b45309`)
*   **CSS**: Sử dụng **Vanilla CSS** thuần túy phối hợp với các biến CSS `:root` để thiết lập Design System đồng nhất. Tạo các hiệu ứng phát sáng mượt mà (`glow-node-active`, `glow-node-success`, `glow-node-failed`) phục vụ cho các trạng thái hoạt động thực tế.
*   **Trực quan hóa kịch bản**: Sử dụng thư viện **React Flow** để thiết kế sơ đồ kéo thả kịch bản tự động hóa trực quan (phần tử node tùy biến, đường kết nối vuông góc, nút chuyển hướng waypoint).
*   **Tương tác thực tế**: Giao tiếp qua HTTP API (Port 3000) để lấy dữ liệu tĩnh ban đầu và kết nối Socket.io để cập nhật real-time trạng thái chạy đa luồng lập tức mà không cần reload.

---

## 🖥️ Quy Tắc Cấu Hình Electron `/desktop`
*   **Khởi chạy**: Đọc địa chỉ từ ứng dụng ReactJS (môi trường Dev sẽ load URL `http://localhost:5173`).
*   **Security**: Bật `contextIsolation` và sử dụng `preload.js` để giao tiếp một cách an toàn giữa ứng dụng React và Electron nếu cần thiết.
*   **Quản lý cửa sổ**: Thiết kế kích thước cửa sổ phù hợp và ẩn menu mặc định không cần thiết để tạo trải nghiệm ứng dụng Desktop thực thụ.

---

## ⚙️ Quy Tắc Code & Quản Lý File Chung (dành cho Gemini CLI)
1.  **TypeScript**: Sử dụng kiểu dữ liệu tường minh (Strict Type checking), hạn chế dùng `any`.
2.  **Cú pháp**: Luôn sử dụng cú pháp ES Modules (`import/export`) cho toàn bộ mã nguồn của Server và Frontend.
3.  **Tổ chức tệp**:
    *   Tên thư mục viết thường, phân cách bằng dấu gạch ngang (kebab-case) nếu cần.
    *   Tên lớp/thành phần viết hoa chữ cái đầu (PascalCase), ví dụ: `CreateTaskUseCase.ts`, `TaskController.ts`.
4.  **Đặt tên file**: File implement interface nên kết thúc bằng tên của interface đó (Ví dụ: `SqliteTaskRepository.ts` triển khai `ITaskRepository.ts`).
5.  **Khởi động**: Chỉ cần chạy lệnh `yarn start` tại thư mục gốc, hệ thống sẽ tự động khởi động đồng thời cả 3 phần thông qua công cụ `concurrently` và `wait-on`.

---

## 💾 Quy Tắc DTO & Di Cư Cơ Sở Dữ Liệu (Migrations) cho Server

1.  **Quy tắc DTO**: Tất cả các hàm tại tầng Repository và Use Cases (Service) khi trả về dữ liệu ra ngoài **bắt buộc phải trả về một DTO** hoặc danh sách các DTO (ví dụ: `ChromeProfileDto`). Tuyệt đối không trả về Model database trực tiếp hoặc Object thô để tránh lỗi tuần tự hóa dữ liệu và giữ tính độc lập của tầng Domain.
2.  **Quy tắc Kế thừa DTO**: Mọi lớp DTO mới tạo phải kế thừa từ lớp trừu tượng `BaseDto` định nghĩa ở [BaseDto.ts](file:///i:/Project/ReacJS/ElectronAutomation/server/src/domain/dto/BaseDto.ts) đệ quy phục vụ cho việc chuyển đổi thành JSON ở các route API.
3.  **Quy tắc Migration**: Khi thay đổi cấu trúc bảng hoặc thêm bảng mới, tuyệt đối không được xóa tệp SQLite hoặc khởi tạo lại DB thủ công. Hãy định nghĩa một Migration mới và đăng ký vào danh sách `migrations` trong [migrations.ts](file:///i:/Project/ReacJS/ElectronAutomation/server/src/infrastructure/database/migrations.ts) để hệ thống tự động chạy di cư dữ liệu an toàn.
4.  **Môi trường ảo Python (.venv)**: Mọi thao tác kiểm tra, chạy thử nghiệm cú pháp code liên quan đến Python (nếu có trong dự án) bắt buộc phải thực thi thông qua Python Interpreter nằm trong môi trường ảo `.venv/` cục bộ.
