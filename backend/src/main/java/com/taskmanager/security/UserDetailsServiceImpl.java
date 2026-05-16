package com.taskmanager.security;

import com.taskmanager.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Used exclusively by DaoAuthenticationProvider during the login flow
 * (AuthService.login → authenticationManager.authenticate).
 *
 * JWT-protected endpoints no longer call this — JwtToPrincipalConverter
 * builds the principal directly from token claims, keeping auth stateless.
 */
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .map(user -> UserPrincipal.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .password(user.getPasswordHash())
                        .systemRole(user.getSystemRole())
                        .build())
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }
}
