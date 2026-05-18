package com.taskmanager.domain.user.controller;

import com.taskmanager.common.constants.ApiPaths;
import com.taskmanager.common.response.ApiResponse;
import com.taskmanager.domain.user.dto.ChangePasswordRequest;
import com.taskmanager.domain.user.dto.UpdateProfileRequest;
import com.taskmanager.domain.user.dto.UserResponse;
import com.taskmanager.domain.user.dto.UserStatsResponse;
import com.taskmanager.domain.user.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Validated
@RestController
@RequestMapping(ApiPaths.USERS)
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<UserResponse>> searchByEmail(
            @RequestParam @Email(message = "Must be a valid email") String email) {
        return ResponseEntity.ok(ApiResponse.success(userService.findByEmail(email)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMe() {
        return ResponseEntity.ok(ApiResponse.success(userService.getCurrentUserProfile()));
    }

    @GetMapping("/me/stats")
    public ResponseEntity<ApiResponse<UserStatsResponse>> getMyStats() {
        return ResponseEntity.ok(ApiResponse.success(userService.getMyStats()));
    }

    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateMe(
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.success(userService.updateProfile(request)));
    }

    @PatchMapping("/me/avatar")
    public ResponseEntity<ApiResponse<UserResponse>> updateAvatar(
            @RequestParam MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success(userService.updateAvatar(file)));
    }

    @PatchMapping("/me/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
    }
}
