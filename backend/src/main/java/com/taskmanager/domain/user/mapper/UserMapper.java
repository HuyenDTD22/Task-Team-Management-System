package com.taskmanager.domain.user.mapper;

import com.taskmanager.domain.user.dto.UserResponse;
import com.taskmanager.domain.user.entity.User;
import org.mapstruct.Mapper;

/**
 * Maps between User entity and UserResponse DTO.
 * All field names match — no explicit @Mapping needed.
 * Business logic (password encoding, token generation) stays in the service layer.
 */
@Mapper(componentModel = "spring")
public interface UserMapper {

    UserResponse toResponse(User user);
}
