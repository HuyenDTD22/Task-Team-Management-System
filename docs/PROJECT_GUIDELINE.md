# Project Guideline — Task & Team Management System

> Version: 1.0 | Last updated: 2026-05-12
> Đây là chuẩn làm việc cho toàn bộ project. Đọc kỹ trước khi bắt đầu code.

---

## 1. Coding Conventions — Java

### 1.1 Naming

```java
// Classes: PascalCase
public class TaskService { }
public class WorkspaceMemberRepository { }

// Methods & variables: camelCase
public TaskResponse createTask(CreateTaskRequest request) { }
private UUID projectId;

// Constants: UPPER_SNAKE_CASE
public static final int MAX_WORKSPACE_NAME_LENGTH = 100;
private static final String TOKEN_PREFIX = "Bearer ";

// Packages: lowercase, no underscore
com.taskmanager.domain.task
com.taskmanager.common.response

// Enums
public enum TaskStatus {
    TODO, IN_PROGRESS, IN_REVIEW, DONE
}
```

### 1.2 Class Structure Order

```java
public class TaskService {
    // 1. Static constants
    // 2. Instance fields (inject via constructor)
    // 3. Constructors
    // 4. Public methods
    // 5. Private helper methods
}
```

### 1.3 Constructor Injection (bắt buộc)

```java
// ĐÚNG — Constructor injection
@Service
@RequiredArgsConstructor  // Lombok tạo constructor
public class TaskService {
    private final TaskRepository taskRepository;
    private final SecurityUtil securityUtil;
}

// SAI — Field injection (không testable, không dùng)
@Service
public class TaskService {
    @Autowired
    private TaskRepository taskRepository;  // ❌
}
```

### 1.4 No Business Logic in Controller

```java
// ĐÚNG
@PostMapping
public ResponseEntity<ApiResponse<TaskResponse>> createTask(
        @Valid @RequestBody CreateTaskRequest request,
        @PathVariable UUID projectId) {
    TaskResponse response = taskService.createTask(projectId, request);
    return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(response, "Task created"));
}

// SAI — business logic trong controller
@PostMapping
public ResponseEntity<?> createTask(...) {
    if (task.getStatus() == null) task.setStatus("TODO"); // ❌
    taskRepository.save(task); // ❌ gọi repo trực tiếp
    return ResponseEntity.ok(task);
}
```

### 1.5 Transactional Rules

```java
// Service methods mặc định: @Transactional
@Transactional
public TaskResponse createTask(...) { }

// Read-only queries: thêm readOnly = true (performance optimization)
@Transactional(readOnly = true)
public List<TaskResponse> getTasksByProject(UUID projectId) { }

// KHÔNG đặt @Transactional trên Controller
```

---

## 2. Architecture Conventions (DDD Lite Rules)

### 2.1 Layer Boundaries — Quy tắc bất biến

```
Controller → chỉ gọi Service (không gọi Repository, không gọi entity methods)
Service    → gọi Repository, gọi domain logic, throw exceptions
Repository → chỉ query DB
Entity     → chỉ chứa mapping và simple domain logic (không gọi service/repo)
```

### 2.2 DTO vs Entity

```java
// ĐÚNG — Controller nhận DTO, trả DTO
@PostMapping
public ResponseEntity<ApiResponse<TaskResponse>> createTask(
        @RequestBody CreateTaskRequest request) {  // DTO vào
    return ResponseEntity.ok(ApiResponse.success(
        taskService.createTask(request)             // DTO ra
    ));
}

// SAI — Expose entity trực tiếp
@GetMapping("/{id}")
public Task getTask(@PathVariable UUID id) {  // ❌ Entity exposed
    return taskRepository.findById(id).get();
}
```

### 2.3 DTO Naming Convention

| Type | Naming | Ví dụ |
|------|--------|-------|
| Request (create) | `Create{Entity}Request` | `CreateTaskRequest` |
| Request (update) | `Update{Entity}Request` | `UpdateTaskRequest` |
| Response | `{Entity}Response` | `TaskResponse` |
| Response (summary) | `{Entity}Summary` | `TaskSummary` (cho danh sách) |

### 2.4 MapStruct Mapper Conventions

Project dùng **MapStruct** cho tất cả Entity ↔ DTO mapping. Không mapping thủ công bằng static factory method.

#### Package structure

Mỗi domain có `mapper/` package riêng:
```
domain/user/mapper/UserMapper.java       # User → UserResponse
domain/auth/mapper/AuthMapper.java       # RegisterRequest → User
domain/task/mapper/TaskMapper.java       # Task → TaskResponse, etc.
```

#### Quy tắc bắt buộc

```java
// ĐÚNG — Mapper chỉ mapping, không chứa business logic
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UserMapper {
    UserResponse toResponse(User user);
}

// ĐÚNG — Normalize dữ liệu bằng expression (thuần data transform)
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface AuthMapper {
    @Mapping(target = "email",    expression = "java(request.getEmail().toLowerCase().trim())")
    @Mapping(target = "fullName", expression = "java(request.getFullName().trim())")
    @Mapping(target = "passwordHash", ignore = true)  // Service handles BCrypt
    User toEntity(RegisterRequest request);
}

// SAI — Password encoding trong mapper ❌
@Mapping(target = "passwordHash",
         expression = "java(passwordEncoder.encode(request.getPassword()))")
User toEntity(RegisterRequest request);

// SAI — Token generation trong mapper ❌
// SAI — Gọi service từ mapper ❌
// SAI — Static factory method trong DTO ❌ (e.g., UserResponse.from(user))
```

#### Khi nào dùng `expression`?

Chỉ dùng `expression` cho **data transformation thuần túy** (không có side effects):
- `.toLowerCase().trim()` — normalize string
- `String.valueOf(x)` — type conversion
- `Collections.emptyList()` — default value

Không dùng `expression` cho: BCrypt, JWT, DB query, external API call.

#### Annotation processor ordering (pom.xml)

Khi dùng Lombok + MapStruct cùng nhau, thứ tự processor bắt buộc là:
```xml
<annotationProcessorPaths>
    <path>lombok</path>                  <!-- 1. Generate getters/setters/builders -->
    <path>lombok-mapstruct-binding</path> <!-- 2. Bind Lombok ↔ MapStruct -->
    <path>mapstruct-processor</path>      <!-- 3. Generate mapper implementations -->
</annotationProcessorPaths>
```
Sai thứ tự → MapStruct không thấy Lombok-generated methods → compile error.

---

### 2.5 File Upload Conventions (Cloudinary)

Project dùng **Cloudinary** cho tất cả image uploads. Không lưu file local, không lưu base64 trong DB.

#### Responsibility phân chia

| Layer | Trách nhiệm |
|-------|------------|
| `CloudinaryService` (common/upload) | Validate file (MIME, size), gọi Cloudinary API, best-effort delete |
| `UserService` (domain service) | Quyết định folder, xử lý business logic (update user record, delete old avatar) |
| `UserController` | Nhận `MultipartFile`, trả `UserResponse` |

#### Rules

```java
// ĐÚNG — CloudinaryService chỉ lo upload/delete, không biết "avatar" là gì
CloudinaryUploadResult result = cloudinaryService.uploadImage(file, "avatars");
user.setAvatarUrl(result.url());
user.setAvatarPublicId(result.publicId());  // Lưu cả publicId để delete sau

// SAI — Business logic trong CloudinaryService ❌
// cloudinaryService.updateUserAvatar(userId, file);

// ĐÚNG — Delete old image best-effort, sau khi DB đã commit
if (previousPublicId != null) {
    cloudinaryService.deleteImage(previousPublicId);  // Không throw nếu thất bại
}

// SAI — Client tự gửi avatar URL lên ❌
// @RequestBody UpdateProfileRequest { String avatarUrl; }  // Không cho phép
```

#### Config

Credentials đặt trong environment variables, không hardcode:
```yaml
cloudinary:
  cloud-name: ${CLOUDINARY_CLOUD_NAME}
  api-key: ${CLOUDINARY_API_KEY}
  api-secret: ${CLOUDINARY_API_SECRET}
  max-file-size: 5MB
```

Multipart limit trong `application.yml` phải ≤ 8MB (Sonar S5693):
```yaml
spring.servlet.multipart.max-file-size: 5MB
spring.servlet.multipart.max-request-size: 6MB
```

---

## 3. API Conventions

### 3.1 REST Endpoints

```
# Resource naming: plural, lowercase, hyphen-separated
GET    /api/v1/workspaces                     # List workspaces
POST   /api/v1/workspaces                     # Create workspace
GET    /api/v1/workspaces/{id}                # Get workspace
PUT    /api/v1/workspaces/{id}                # Full update
PATCH  /api/v1/workspaces/{id}                # Partial update
DELETE /api/v1/workspaces/{id}                # Delete

# Nested resources
GET    /api/v1/workspaces/{id}/members        # List members
POST   /api/v1/workspaces/{id}/members        # Add member
DELETE /api/v1/workspaces/{id}/members/{userId} # Remove member

GET    /api/v1/projects/{id}/tasks            # Tasks of project
GET    /api/v1/sprints/{id}/tasks             # Tasks in sprint

# Actions (không phải CRUD thuần)
POST   /api/v1/sprints/{id}/start            # Start sprint
POST   /api/v1/sprints/{id}/complete         # Complete sprint
POST   /api/v1/auth/refresh                  # Refresh token
POST   /api/v1/auth/logout                   # Logout
```

### 3.2 HTTP Status Codes

| Situation | Status Code |
|-----------|------------|
| Thành công, có data | 200 OK |
| Tạo resource thành công | 201 Created |
| Thành công, không có data | 204 No Content |
| Request không hợp lệ (validation) | 400 Bad Request |
| Chưa đăng nhập | 401 Unauthorized |
| Không có quyền | 403 Forbidden |
| Không tìm thấy resource | 404 Not Found |
| Conflict (duplicate) | 409 Conflict |
| Lỗi server | 500 Internal Server Error |

### 3.3 Query Parameters for Filtering

```
GET /api/v1/projects/{id}/tasks
    ?status=IN_PROGRESS
    &assigneeId={uuid}
    &priority=HIGH
    &sprintId={uuid}
    &search=login+feature
    &page=0
    &size=20
    &sortBy=createdAt
    &sortDir=desc
```

---

## 4. Response Format Conventions

### 4.1 Standard Response Wrapper

```java
// ApiResponse.java
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private String timestamp;

    public static <T> ApiResponse<T> success(T data) { ... }
    public static <T> ApiResponse<T> success(T data, String message) { ... }
    public static <T> ApiResponse<T> error(String message) { ... }
}
```

```json
// Success response
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Implement login feature",
    "status": "TODO",
    "priority": "HIGH",
    "createdAt": "2026-05-12T10:00:00Z"
  },
  "timestamp": "2026-05-12T10:00:00Z"
}
```

### 4.2 Paginated Response

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "content": [...],
    "page": 0,
    "size": 20,
    "totalElements": 87,
    "totalPages": 5,
    "first": true,
    "last": false
  },
  "timestamp": "2026-05-12T10:00:00Z"
}
```

### 4.3 Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    { "field": "title", "message": "Title is required" },
    { "field": "priority", "message": "Invalid priority value" }
  ],
  "timestamp": "2026-05-12T10:00:00Z"
}
```

---

## 5. Exception Handling Conventions

### 5.1 Exception Hierarchy

```java
// Base exception (abstract)
public abstract class BusinessException extends RuntimeException {
    private final ErrorCode errorCode;
    private final HttpStatus httpStatus;
}

// Concrete exceptions
public class ResourceNotFoundException extends BusinessException {
    public ResourceNotFoundException(String resource, UUID id) {
        super(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND,
              resource + " not found with id: " + id);
    }
}

public class AccessDeniedException extends BusinessException { ... }
public class ConflictException extends BusinessException { ... }
public class ValidationException extends BusinessException { ... }
```

### 5.2 Global Exception Handler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleNotFound(ResourceNotFoundException ex) {
        // log, return 404
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleValidation(MethodArgumentNotValidException ex) {
        // collect field errors, return 400
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleGeneral(Exception ex) {
        // log ERROR, return 500 (KHÔNG expose stack trace)
    }
}
```

### 5.3 Error Codes

```java
public enum ErrorCode {
    // Auth
    INVALID_CREDENTIALS,
    TOKEN_EXPIRED,
    TOKEN_INVALID,
    // Resource
    RESOURCE_NOT_FOUND,
    // Business
    WORKSPACE_MEMBER_ALREADY_EXISTS,
    SPRINT_ALREADY_ACTIVE,
    VALIDATION_ERROR,
    // Server
    INTERNAL_SERVER_ERROR
}
```

**QUAN TRỌNG**: Không bao giờ return stack trace hoặc internal error message cho client trong production.

---

## 6. Validation Conventions

### 6.1 Bean Validation (Request DTOs)

```java
public class CreateTaskRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 1, max = 500, message = "Title must be between 1 and 500 characters")
    private String title;

    @Size(max = 5000, message = "Description cannot exceed 5000 characters")
    private String description;

    @NotNull(message = "Priority is required")
    private TaskPriority priority;

    @FutureOrPresent(message = "Due date cannot be in the past")
    private LocalDate dueDate;

    @NotNull(message = "Project ID is required")
    private UUID projectId;
}
```

### 6.2 Custom Validator

```java
// Khi cần logic phức tạp hơn
@Target({ FIELD })
@Retention(RUNTIME)
@Constraint(validatedBy = ValidSlugValidator.class)
public @interface ValidSlug {
    String message() default "Slug must contain only lowercase letters, numbers, and hyphens";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
```

### 6.3 Business Validation trong Service

```java
@Transactional
public SprintResponse startSprint(UUID sprintId) {
    Sprint sprint = findSprintOrThrow(sprintId);

    // Business rule validation
    boolean hasActiveSprint = sprintRepository
        .existsByProjectIdAndStatus(sprint.getProject().getId(), SprintStatus.ACTIVE);

    if (hasActiveSprint) {
        throw new ConflictException("Project already has an active sprint");
    }

    // proceed...
}
```

**Rule**: Bean Validation cho format/structure. Business validation trong Service.

---

## 7. Logging Conventions

### 7.1 Log Levels

| Level | Khi nào dùng |
|-------|-------------|
| `ERROR` | Lỗi không mong đợi, cần fix ngay. System có thể bị ảnh hưởng |
| `WARN` | Điều gì đó sai nhưng system vẫn hoạt động. Cần theo dõi |
| `INFO` | Business events quan trọng: user login, entity created/deleted |
| `DEBUG` | Thông tin chi tiết cho debugging (disable ở production) |

### 7.2 Logging Format

```java
// Dùng SLF4J + Logback (Spring Boot default)
@Slf4j  // Lombok
public class AuthService {

    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail()); // INFO: business event

        try {
            // ...
            log.info("Login successful for userId: {}", user.getId()); // INFO: success
            return response;
        } catch (BadCredentialsException e) {
            log.warn("Failed login attempt for email: {}", request.getEmail()); // WARN: security
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }
    }
}
```

### 7.3 Logging Best Practices

```java
// ĐÚNG — dùng parameterized logging (lazy evaluation)
log.debug("Processing task with id: {} and status: {}", taskId, status);

// SAI — String concatenation (luôn evaluate, dù không cần)
log.debug("Processing task with id: " + taskId + " and status: " + status); // ❌

// KHÔNG BAO GIỜ log sensitive data
log.info("User login: email={}, password={}", email, password); // ❌ NEVER
log.info("Token generated: {}", accessToken); // ❌ NEVER
```

### 7.4 application.yml Logging Config

```yaml
logging:
  level:
    root: INFO
    com.taskmanager: DEBUG    # dev: DEBUG, prod: INFO
    org.hibernate.SQL: DEBUG  # dev: bật để xem SQL queries
    org.springframework.security: DEBUG  # dev only
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
```

---

## 8. Security Conventions

### 8.1 Password Security

```java
// ĐÚNG
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12); // cost factor 12
}

// Khi tạo user
user.setPasswordHash(passwordEncoder.encode(rawPassword));

// Khi verify
boolean valid = passwordEncoder.matches(rawPassword, user.getPasswordHash());
```

### 8.2 JWT Security

```yaml
# application.yml
jwt:
  secret: ${JWT_SECRET}          # Minimum 256-bit (32 chars) random string
  access-token-expiry: 1800000   # 30 minutes (milliseconds)
  refresh-token-expiry: 604800000 # 7 days
```

```java
// JWT Claims — chỉ chứa non-sensitive data
Claims claims = Jwts.claims()
    .subject(user.getId().toString())  // userId làm subject
    .add("role", user.getSystemRole())
    .build();
// KHÔNG cho: email, password, sensitive data vào JWT
```

### 8.3 OWASP Top 10 Checklist

| Risk | Cách xử lý trong project này |
|------|------------------------------|
| Injection | JPA parameterized queries (không dùng raw SQL nối chuỗi) |
| Broken Auth | JWT + HttpOnly Cookie + token rotation |
| XSS | React escapes by default; không dùng `dangerouslySetInnerHTML` |
| Broken Access | Service-level authorization check per operation |
| Security Misconfiguration | Environment variables, không commit `.env` |
| Sensitive Data | Không log tokens/passwords, dùng HTTPS |
| Missing Auth | `@SecurityRequirement` trên mọi secured endpoint |
| SSRF | Không cho user input vào URL fetch |

### 8.4 CORS Configuration

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of(frontendUrl)); // Không dùng "*" ở production
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);  // Cần cho HttpOnly cookie
    // ...
}
```

---

## 9. Docker Conventions

### 9.1 Dockerfile — Backend (Multi-stage build)

```dockerfile
# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q    # Cache dependencies layer
COPY src ./src
RUN mvn package -DskipTests -q

# Stage 2: Runtime (minimal image)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
RUN addgroup -S appgroup && adduser -S appuser -G appgroup  # Non-root user
USER appuser
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 9.2 Dockerfile — Frontend (Multi-stage build)

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production    # Faster, reproducible installs
COPY . .
RUN npm run build

# Stage 2: Serve với Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
```

### 9.3 .dockerignore

```
# backend/.dockerignore
target/
*.md
.git
.gitignore
.env*

# frontend/.dockerignore
node_modules/
dist/
.env*
*.md
```

---

## 10. Git Conventions

### 10.1 Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types:**
| Type | Khi nào dùng |
|------|-------------|
| `feat` | Tính năng mới |
| `fix` | Sửa bug |
| `refactor` | Refactor code, không thay đổi behavior |
| `docs` | Cập nhật documentation |
| `test` | Thêm/sửa tests |
| `chore` | Build process, dependencies, configs |
| `style` | Format code, không ảnh hưởng logic |

**Examples:**
```bash
feat(auth): implement JWT refresh token rotation
fix(task): correct status transition validation in sprint completion
feat(workspace): add member invitation via email
refactor(task): extract task permission check to separate method
docs(api): update endpoint documentation for task endpoints
chore(docker): add health check to postgres container
```

### 10.2 Branch Strategy

```
main          ← Production-ready code. Protected branch.
  └── develop ← Integration branch. Merge features here.
        └── feature/auth-refresh-token    ← Feature branches
        └── feature/workspace-management
        └── fix/task-status-bug
        └── hotfix/critical-security-patch
```

**Rules:**
- `main` chỉ nhận merge từ `develop` (hoặc `hotfix/`)
- `develop` chỉ nhận merge từ `feature/` branches
- Feature branches tạo từ `develop`, merge về `develop`
- Hotfix branches tạo từ `main`, merge về cả `main` và `develop`

### 10.3 Branch Naming

```bash
feature/{short-description}        # feature/jwt-authentication
fix/{issue-description}            # fix/task-status-validation
hotfix/{critical-fix}              # hotfix/sql-injection-vulnerability
chore/{task}                       # chore/update-dependencies
docs/{description}                 # docs/api-documentation
```

---

## 11. Naming Conventions — Summary

### Java

| Element | Convention | Example |
|---------|-----------|---------|
| Package | lowercase | `com.taskmanager.domain.task` |
| Class | PascalCase | `TaskService`, `WorkspaceMember` |
| Interface | PascalCase | `TaskRepository`, `Pageable` |
| Method | camelCase | `createTask()`, `findByProjectId()` |
| Variable | camelCase | `taskId`, `currentUser` |
| Constant | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE` |
| Enum | UPPER_SNAKE_CASE | `IN_PROGRESS`, `TODO` |

### Database

| Element | Convention | Example |
|---------|-----------|---------|
| Table | snake_case, plural | `workspace_members` |
| Column | snake_case | `created_at`, `project_id` |
| Index | `idx_{table}_{col}` | `idx_tasks_project_id` |
| FK constraint | `fk_{table}_{ref}` | `fk_tasks_projects` |
| Unique constraint | `uq_{table}_{col}` | `uq_users_email` |

### API Endpoints

| Element | Convention | Example |
|---------|-----------|---------|
| Resource | lowercase, plural, hyphen | `/workspace-members` |
| Path param | camelCase | `{workspaceId}` |
| Query param | camelCase | `?sortBy=createdAt&assigneeId=...` |

### Frontend (React/TypeScript)

| Element | Convention | Example |
|---------|-----------|---------|
| Component | PascalCase | `TaskCard`, `KanbanBoard` |
| Hook | camelCase, `use` prefix | `useTaskList`, `useAuth` |
| File (component) | PascalCase | `TaskCard.tsx` |
| File (hook/util) | camelCase | `useTaskList.ts`, `date.util.ts` |
| Type/Interface | PascalCase | `TaskResponse`, `CreateTaskRequest` |
| Constant | UPPER_SNAKE_CASE | `API_BASE_URL` |

---

## 12. Clean Code Rules

1. **Functions làm 1 việc duy nhất** — nếu function làm nhiều việc, tách ra
2. **Đặt tên rõ ràng** — `getUserById` tốt hơn `get`; `isTaskOwner` tốt hơn `check`
3. **Không magic numbers** — `MAX_TOKEN_LENGTH = 512` thay vì `512`
4. **Fail fast** — validate và throw exception sớm, không nest deep `if` blocks
5. **Không duplicate code** — nếu code giống nhau 3 lần, extract thành method
6. **Giới hạn method length** — nếu method > 30 dòng, xem xét tách
7. **Không comment "what"** — code tự nói lên what; comment chỉ cho "why"
8. **Return sớm** — tránh `else` sau `return`
9. **Immutable by default** — `final` cho fields, dùng `List.of()` khi có thể
10. **Không catch Exception chung** — catch exception cụ thể

---

## 13. Common Anti-Patterns to Avoid

### Backend Anti-patterns

```java
// ❌ Returning Entity directly from Controller
@GetMapping("/{id}")
public Task getTask() { return task; }  // Expose internal structure

// ❌ Optional.get() without check
Task task = taskRepository.findById(id).get();  // NullPointerException risk

// ❌ Catching generic Exception without re-throw
try { ... } catch (Exception e) { } // Swallowing exceptions

// ❌ N+1 query problem
tasks.forEach(task -> task.getAssignee().getEmail()); // N+1 queries

// ❌ Hardcoded credentials
String dbPassword = "admin123"; // ❌

// ❌ Mutable static state
private static List<Task> cache = new ArrayList<>(); // Not thread-safe
```

### Frontend Anti-patterns

```typescript
// ❌ Direct API calls in components
function TaskCard() {
  useEffect(() => {
    fetch('/api/tasks').then(...); // ❌ Use React Query instead
  }, []);
}

// ❌ Storing sensitive data in localStorage
localStorage.setItem('accessToken', token); // ❌ XSS vulnerable

// ❌ Prop drilling more than 3 levels
// Dùng Context hoặc Zustand store

// ❌ any type in TypeScript
const data: any = response.data; // ❌ Mất type safety
```
