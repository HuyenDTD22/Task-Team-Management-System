package com.taskmanager.domain.comment.mapper;

import com.taskmanager.domain.comment.dto.CommentResponse;
import com.taskmanager.domain.comment.entity.Comment;
import com.taskmanager.domain.user.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface CommentMapper {

    @Mapping(target = "id",            source = "comment.id")
    @Mapping(target = "taskId",        source = "comment.taskId")
    @Mapping(target = "parentId",      source = "comment.parentId")
    @Mapping(target = "userId",        source = "comment.userId")
    @Mapping(target = "userName",      source = "user.fullName")
    @Mapping(target = "userAvatarUrl", source = "user.avatarUrl")
    @Mapping(target = "content",       source = "comment.content")
    @Mapping(target = "edited",        source = "comment.edited")
    @Mapping(target = "createdAt",     source = "comment.createdAt")
    @Mapping(target = "updatedAt",     source = "comment.updatedAt")
    CommentResponse toResponse(Comment comment, User user);
}
