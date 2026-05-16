package com.taskmanager.domain.user.entity;

import com.taskmanager.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@SQLRestriction("deleted_at IS NULL")
@SQLDelete(sql = "UPDATE users SET deleted_at = NOW() WHERE id = ?")
public class User extends BaseEntity {

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    // Cloudinary public ID — used to delete/replace the old image on update
    @Column(name = "avatar_public_id", length = 255)
    private String avatarPublicId;

    // ROLE_USER | ROLE_ADMIN — matches Spring Security GrantedAuthority naming
    @Column(name = "system_role", nullable = false, length = 20)
    private String systemRole = "ROLE_USER";

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
