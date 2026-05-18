package com.taskmanager.domain.user.service;

import com.taskmanager.common.upload.CloudinaryService;
import com.taskmanager.common.upload.CloudinaryUploadResult;
import com.taskmanager.domain.auth.repository.RefreshTokenRepository;
import com.taskmanager.domain.task.repository.TaskRepository;
import com.taskmanager.domain.user.dto.ChangePasswordRequest;
import com.taskmanager.domain.user.dto.UpdateProfileRequest;
import com.taskmanager.domain.user.dto.UserResponse;
import com.taskmanager.domain.user.dto.UserStatsResponse;
import com.taskmanager.domain.user.entity.User;
import com.taskmanager.domain.user.mapper.UserMapper;
import com.taskmanager.domain.user.repository.UserRepository;
import com.taskmanager.exception.BusinessException;
import com.taskmanager.exception.ErrorCode;
import com.taskmanager.security.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private static final String AVATAR_FOLDER = "avatars";

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final CloudinaryService cloudinaryService;
    private final TaskRepository taskRepository;

    @Transactional(readOnly = true)
    public UserResponse getCurrentUserProfile() {
        return userMapper.toResponse(loadCurrentUser());
    }

    @Transactional
    public UserResponse updateProfile(UpdateProfileRequest request) {
        User user = loadCurrentUser();

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName().trim());
        }

        User saved = userRepository.save(user);
        log.info("Profile updated for user: {}", saved.getId());
        return userMapper.toResponse(saved);
    }

    /**
     * Uploads a new avatar to Cloudinary, updates the user record, and
     * deletes the previous avatar (best-effort) to avoid orphan files.
     */
    @Transactional
    public UserResponse updateAvatar(MultipartFile file) {
        User user = loadCurrentUser();

        CloudinaryUploadResult result = cloudinaryService.uploadImage(file, AVATAR_FOLDER);

        String previousPublicId = user.getAvatarPublicId();

        user.setAvatarUrl(result.url());
        user.setAvatarPublicId(result.publicId());
        User saved = userRepository.save(user);

        // Delete old image after the DB update is committed — best-effort, outside transaction
        if (previousPublicId != null) {
            cloudinaryService.deleteImage(previousPublicId);
        }

        log.info("Avatar updated for user: {}", saved.getId());
        return userMapper.toResponse(saved);
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = loadCurrentUser();

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        refreshTokenRepository.revokeAllByUserId(user.getId(), Instant.now());
        log.info("Password changed for user: {}. All sessions revoked.", user.getId());
    }

    @Transactional(readOnly = true)
    public UserStatsResponse getMyStats() {
        UUID userId = SecurityUtil.getCurrentUserId();
        return UserStatsResponse.builder()
                .activeTaskCount(taskRepository.countActiveTasksForUser(userId))
                .overdueTaskCount(taskRepository.countOverdueTasksForUser(userId))
                .doneTaskCount(taskRepository.countDoneTasksForUser(userId))
                .todoCount(taskRepository.countTodoTasksForUser(userId))
                .inProgressCount(taskRepository.countInProgressTasksForUser(userId))
                .inReviewCount(taskRepository.countInReviewTasksForUser(userId))
                .build();
    }

    @Transactional(readOnly = true)
    public UserResponse findByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return userMapper.toResponse(user);
    }

    private User loadCurrentUser() {
        return userRepository.findById(SecurityUtil.getCurrentUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }
}
