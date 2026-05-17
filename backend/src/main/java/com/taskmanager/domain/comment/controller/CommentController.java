package com.taskmanager.domain.comment.controller;

import com.taskmanager.common.constants.ApiPaths;
import com.taskmanager.common.response.ApiResponse;
import com.taskmanager.common.response.PageResponse;
import com.taskmanager.domain.comment.dto.*;
import com.taskmanager.domain.comment.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping(ApiPaths.TASKS + "/{taskId}/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(
            @PathVariable UUID taskId,
            @RequestBody @Valid CreateCommentRequest request) {
        CommentResponse response = commentService.addComment(taskId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Comment added successfully"));
    }

    @GetMapping(ApiPaths.TASKS + "/{taskId}/comments")
    public ResponseEntity<ApiResponse<PageResponse<CommentResponse>>> getTaskComments(
            @PathVariable UUID taskId,
            @ModelAttribute @Valid CommentFilterParams params) {
        return ResponseEntity.ok(ApiResponse.success(commentService.getTaskComments(taskId, params)));
    }

    @PutMapping(ApiPaths.COMMENTS + "/{id}")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateCommentRequest request) {
        return ResponseEntity.ok(ApiResponse.success(commentService.updateComment(id, request)));
    }

    @DeleteMapping(ApiPaths.COMMENTS + "/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(@PathVariable UUID id) {
        commentService.deleteComment(id);
        return ResponseEntity.ok(ApiResponse.success("Comment deleted successfully"));
    }
}
