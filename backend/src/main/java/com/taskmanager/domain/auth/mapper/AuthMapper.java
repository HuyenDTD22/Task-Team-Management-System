package com.taskmanager.domain.auth.mapper;

import com.taskmanager.domain.auth.dto.RegisterRequest;
import com.taskmanager.domain.user.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

/**
 * Maps auth-related DTOs to domain entities.
 *
 * <p>Rules:
 * <ul>
 *   <li>Password encoding belongs in {@code AuthService}, NOT here.</li>
 *   <li>Default values (systemRole, active) are set by entity field initializers.</li>
 *   <li>Audit fields (id, createdAt, ...) are managed by JPA/Hibernate — ignored.</li>
 * </ul>
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface AuthMapper {

    @Mapping(target = "email",    expression = "java(request.getEmail().toLowerCase().trim())")
    @Mapping(target = "fullName", expression = "java(request.getFullName().trim())")
    @Mapping(target = "passwordHash", ignore = true)
    User toEntity(RegisterRequest request);
}
