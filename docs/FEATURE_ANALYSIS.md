# Feature Analysis — Task & Team Management System

> Version: 1.0 | Last updated: 2026-05-12
> Author: Architecture & Planning Phase

---

## 1. Business Problem Statement

### Vấn đề thực tế
Trong các nhóm phát triển phần mềm, việc quản lý công việc thủ công (qua Google Sheets, email, chat) dẫn đến:
- Không rõ ai đang làm gì, deadline là khi nào
- Task bị mất, bị quên, không có lịch sử thay đổi
- Không có cái nhìn tổng quan về tiến độ sprint/project
- Khó phân quyền — ai được xem/sửa/xóa gì

### Giải pháp
Hệ thống quản lý task và team theo mô hình **workspace → project → sprint → task**, cho phép:
- Tạo và phân công task với priority, deadline, status rõ ràng
- Quản lý team theo workspace và project với phân quyền chi tiết
- Theo dõi tiến độ sprint theo board view (Kanban)
- Lưu lịch sử thay đổi, comment, hoạt động

### Target Users
- Nhóm phát triển phần mềm nhỏ (5–50 người)
- Sinh viên học cách quản lý project theo Agile/Scrum
- Startup cần công cụ quản lý task nhanh, nhẹ

---

## 2. User Roles & Permissions

### 2.1 System Level

| Role | Mô tả |
|------|-------|
| `ROLE_ADMIN` | Quản trị viên hệ thống — quản lý users, có thể truy cập mọi workspace |
| `ROLE_USER` | Người dùng thông thường — tạo workspace, tham gia project |

### 2.2 Workspace Level

| Role | Mô tả | Khả năng |
|------|-------|----------|
| `OWNER` | Người tạo workspace | Toàn quyền: xóa workspace, quản lý thành viên, tạo project |
| `ADMIN` | Quản trị viên workspace | Quản lý thành viên, tạo/sửa project, không xóa workspace |
| `MEMBER` | Thành viên thường | Xem workspace, tham gia project được invite |

### 2.3 Project Level

| Role | Mô tả | Khả năng |
|------|-------|----------|
| `MANAGER` | Quản lý project | Toàn quyền trong project: tạo sprint, quản lý task, quản lý members |
| `DEVELOPER` | Thành viên phát triển | Tạo/sửa task, chuyển trạng thái, comment, không thể xóa project |
| `VIEWER` | Người xem | Chỉ xem task, comment — không sửa được gì |

### 2.4 Phân cấp quyền thực tế

```
System Admin
  └── có thể truy cập mọi thứ

Workspace Owner/Admin
  └── quản lý workspace và projects bên trong

Project Manager
  └── quản lý toàn bộ project (sprints, tasks, members)

Developer
  └── làm việc với tasks được assign

Viewer
  └── theo dõi tiến độ
```

---

## 3. Permission Matrix

### 3.1 Workspace Permissions

| Action | SYSTEM_ADMIN | OWNER | ADMIN | MEMBER |
|--------|:---:|:---:|:---:|:---:|
| Xem workspace | ✅ | ✅ | ✅ | ✅ |
| Sửa workspace info | ✅ | ✅ | ✅ | ❌ |
| Xóa workspace | ✅ | ✅ | ❌ | ❌ |
| Mời thành viên | ✅ | ✅ | ✅ | ❌ |
| Xóa thành viên | ✅ | ✅ | ✅ | ❌ |
| Thay đổi role thành viên | ✅ | ✅ | ✅ | ❌ |
| Tạo project | ✅ | ✅ | ✅ | ❌ |
| Xem danh sách projects | ✅ | ✅ | ✅ | ✅ |

### 3.2 Project Permissions

| Action | MANAGER | DEVELOPER | VIEWER |
|--------|:---:|:---:|:---:|
| Xem project | ✅ | ✅ | ✅ |
| Sửa project info | ✅ | ❌ | ❌ |
| Xóa project | ✅ | ❌ | ❌ |
| Mời thành viên vào project | ✅ | ❌ | ❌ |
| Tạo sprint | ✅ | ❌ | ❌ |
| Sửa/xóa sprint | ✅ | ❌ | ❌ |
| Tạo task | ✅ | ✅ | ❌ |
| Sửa task bất kỳ | ✅ | ❌ | ❌ |
| Sửa task của mình | ✅ | ✅ | ❌ |
| Xóa task | ✅ | ❌ | ❌ |
| Chuyển trạng thái task | ✅ | ✅ | ❌ |
| Comment | ✅ | ✅ | ✅ |
| Xóa comment của mình | ✅ | ✅ | ✅ |
| Xóa comment bất kỳ | ✅ | ❌ | ❌ |

---

## 4. Main Modules

### Module 1: Authentication & Authorization
**Responsibility**: Xác thực danh tính người dùng và kiểm soát quyền truy cập.

**Chức năng**:
- Đăng ký tài khoản (email + password)
- Đăng nhập → trả về access token + refresh token
- Refresh access token bằng refresh token
- Đăng xuất (revoke refresh token)
- Đổi mật khẩu
- (Advanced) Quên mật khẩu qua email

**Business rules**:
- Password phải hash bằng BCrypt
- Access token expire sau 30 phút
- Refresh token expire sau 7 ngày và bị revoke ngay khi dùng (rotation)
- Một user có thể có nhiều refresh token (multi-device)

---

### Module 2: User Management
**Responsibility**: Quản lý thông tin cá nhân người dùng.

**Chức năng**:
- Xem và cập nhật profile
- Upload avatar
- Xem danh sách workspaces đã tham gia
- (Admin) Xem/ban/unban users

---

### Module 3: Workspace Management
**Responsibility**: Quản lý không gian làm việc — container lớn nhất trong hệ thống.

**Chức năng**:
- Tạo workspace (tự động trở thành OWNER)
- Mời thành viên qua email hoặc username
- Quản lý role thành viên
- Xem danh sách projects trong workspace
- Xóa workspace (xóa cascade tất cả projects/tasks)

**Business rules**:
- Mỗi user có thể tạo tối đa N workspaces (MVP: không giới hạn)
- Workspace phải có ít nhất 1 OWNER
- OWNER không thể bị xóa khỏi workspace (phải transfer ownership trước)

---

### Module 4: Project Management
**Responsibility**: Quản lý từng project trong workspace.

**Chức năng**:
- Tạo project trong workspace
- Mời thành viên vào project (từ workspace members)
- Thiết lập cấu hình project (status columns tùy chỉnh)
- Xem board view (Kanban) và list view
- Archive/restore project

**Business rules**:
- Project phải thuộc về một workspace
- Chỉ workspace OWNER/ADMIN mới tạo được project
- Project MANAGER phải là thành viên của workspace

---

### Module 5: Sprint Management
**Responsibility**: Quản lý vòng lặp phát triển theo Scrum/Agile.

**Chức năng**:
- Tạo sprint với tên, ngày bắt đầu, ngày kết thúc
- Thêm task vào sprint (từ backlog)
- Start sprint (chỉ 1 sprint active tại một thời điểm)
- Complete sprint (chuyển task chưa done về backlog hoặc sprint tiếp theo)
- Xem sprint history

**Business rules**:
- Mỗi project chỉ có 1 sprint đang active (status = ACTIVE) tại một thời điểm
- Sprint status flow: `PLANNED → ACTIVE → COMPLETED`
- Khi complete sprint, task chưa DONE phải chọn: về backlog hoặc sang sprint khác

---

### Module 6: Task Management
**Responsibility**: Core module — quản lý từng đơn vị công việc.

**Chức năng**:
- Tạo task với: title, description, status, priority, assignee, due date, sprint
- Cập nhật các trường của task
- Chuyển trạng thái (drag-drop trên board)
- Assign/unassign task
- Add subtask (optional MVP)
- Add labels/tags
- Upload attachment

**Business rules**:
- Task status mặc định: `TODO, IN_PROGRESS, IN_REVIEW, DONE`
- Task priority: `LOW, MEDIUM, HIGH, CRITICAL`
- Task phải thuộc 1 project
- Task có thể không thuộc sprint nào (backlog)
- Task ở backlog có thể được add vào sprint

**Task Status Flow**:
```
TODO → IN_PROGRESS → IN_REVIEW → DONE
  ↑_________________________________|   (có thể reopen)
```

---

### Module 7: Comment & Activity
**Responsibility**: Giao tiếp trong context của task.

**Chức năng**:
- Thêm comment vào task
- Sửa/xóa comment của mình
- (Advanced) Mention user trong comment
- (Advanced) Activity log — lịch sử mọi thay đổi trên task

---

### Module 8: Notification (Advanced)
**Responsibility**: Thông báo real-time hoặc email cho các sự kiện quan trọng.

**Sự kiện kích hoạt notification**:
- Task được assign cho bạn
- Có comment mới trên task bạn đang theo dõi
- Sprint được bắt đầu/kết thúc
- Bạn được mời vào workspace/project
- Task sắp tới deadline

---

## 5. Business Workflows

### 5.1 User Registration & Login Flow

```
── REGISTER ──────────────────────────────────────────────────────────
[User] → POST /api/v1/auth/register
          → Validate input (email format, password length, fullName)
          → Check email uniqueness → 409 if duplicate
          → Hash password (BCrypt)
          → Save user (status: ACTIVE)
          → Return 201 Created { id, email, fullName, ... }
          ← Frontend redirects to /login (NO token issued)

Design rationale: register chỉ tạo tài khoản, không log in tự động.
Tách biệt 2 actions giúp flow rõ ràng hơn, dễ test hơn, và phù hợp
với các hệ thống có email verification sau này.

── LOGIN ──────────────────────────────────────────────────────────────
[User] → POST /api/v1/auth/login
          → Validate credentials (email + password)
          → Verify BCrypt hash
          → Generate Access Token (JWT, 30 min)
          → Generate Refresh Token (UUID, 7 days)
          → Save Refresh Token to DB
          → Return: { accessToken } + Set-Cookie: refreshToken (HttpOnly)
```

### 5.2 Task Lifecycle

```
[Developer] Tạo task trong backlog
        ↓
[Manager] Add task vào sprint
        ↓
[Developer] Chuyển task sang IN_PROGRESS (start working)
        ↓
[Developer] Chuyển sang IN_REVIEW (gửi review)
        ↓
[Manager/Reviewer] Approve → chuyển DONE
                  Reject  → chuyển lại IN_PROGRESS
```

### 5.3 Sprint Lifecycle

```
[Manager] Tạo sprint (PLANNED)
        ↓
[Manager] Add tasks từ backlog vào sprint
        ↓
[Manager] Start sprint → status = ACTIVE
        ↓
Team làm việc, cập nhật task status
        ↓
[Manager] Complete sprint → status = COMPLETED
        ↓
Chọn destination cho unfinished tasks:
  ├── Move to backlog
  └── Move to next sprint
```

### 5.4 Workspace Invitation Flow

```
[Owner/Admin] Mời user (bằng email)
        ↓
Tạo invitation record (status: PENDING)
        ↓
(Advanced) Gửi email với invite link
        ↓
[User] Accept invitation
        ↓
Tạo workspace_member record
Xóa/expire invitation
```

---

## 6. MVP Features (Phase 1-4)

Các feature **phải có** để project có giá trị demo:

### Must Have (MVP Core)
- [ ] Đăng ký / Đăng nhập / Đăng xuất
- [ ] JWT Access Token + Refresh Token rotation
- [ ] Tạo và quản lý workspace
- [ ] Mời thành viên vào workspace
- [ ] Tạo và quản lý project
- [ ] Tạo / sửa / xóa task
- [ ] Chuyển trạng thái task
- [ ] Assign task cho thành viên
- [ ] Tạo / start / complete sprint
- [ ] Add task vào sprint
- [ ] Comment trên task
- [ ] Kanban board view
- [ ] Role-based access control (workspace + project level)

### Should Have (MVP+)
- [ ] Phân trang và lọc danh sách tasks
- [ ] Search task
- [ ] Filter task theo assignee, status, priority
- [ ] Task due date với visual indicator (overdue)
- [ ] User profile & avatar

### Could Have (Advanced)
- [ ] Email notification
- [ ] Real-time notification (SSE/WebSocket)
- [ ] File attachment (S3)
- [ ] Activity log / audit trail
- [ ] Labels/tags
- [ ] Subtask
- [ ] Time tracking

---

## 7. Real-World Use Cases

### UC-1: Scrum Team Daily Workflow
```
Morning:
  Developer opens board → xem tasks của mình
  Cập nhật status task đang làm → IN_PROGRESS

During day:
  Hoàn thành task → chuyển sang IN_REVIEW
  Add comment: "Xong, cần review phần auth flow"
  Manager review → approve → DONE

End of sprint:
  Manager complete sprint
  Unfinished tasks → next sprint
  Review velocity
```

### UC-2: Onboarding New Team Member
```
Owner invite email@newmember.com → MEMBER
New member tham gia workspace
Manager invite vào specific project → DEVELOPER
New member xem board, nhận task được assign
```

### UC-3: Project Manager Planning
```
Manager tạo sprint "Sprint 3 - Payment Module"
Manager kéo tasks từ backlog vào sprint
Manager set due date và priority
Manager start sprint
Monitor progress qua board
```

---

## 8. Common Mistakes Sinh Viên Khi Phân Tích Nghiệp Vụ

### Mistake 1: Không phân biệt Authentication vs Authorization
- **Auth** = xác minh BẠN LÀ AI (login, JWT)
- **Authz** = kiểm tra BẠN ĐƯỢC LÀM GÌ (role check, permission)
- Hai thứ hoàn toàn khác nhau, implement riêng biệt

### Mistake 2: Over-engineer ngay từ đầu
- Bắt đầu với microservices thay vì monolith → phức tạp không cần thiết
- Giải pháp: Start monolith, design để có thể tách sau

### Mistake 3: Bỏ qua business rules
- Không xác định: ai được làm gì, trong hoàn cảnh nào
- Dẫn đến security holes và logic bugs

### Mistake 4: Thiếu validation ở đúng layer
- Validate chỉ ở frontend → backend bypass
- Validate ở cả frontend (UX) VÀ backend (security)

### Mistake 5: Hard-code roles thay vì thiết kế flexible
- Không nghĩ đến việc add role mới sau này
- Giải pháp: Store roles trong DB, không hard-code string

### Mistake 6: Không nghĩ đến Soft Delete
- Xóa vĩnh viễn dữ liệu → không restore được
- Giải pháp: `deleted_at` timestamp (NULL = chưa xóa)
