package com.taskmanager.common.upload;

import com.cloudinary.Cloudinary;
import com.taskmanager.config.CloudinaryProperties;
import com.taskmanager.exception.BusinessException;
import com.taskmanager.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

/**
 * Infrastructure service for Cloudinary file operations.
 * Owns upload validation and communicates with the Cloudinary API.
 * Business logic (who can upload, which folder, etc.) stays in the domain service.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"
    );

    private final Cloudinary cloudinary;
    private final CloudinaryProperties properties;

    /**
     * Uploads an image file to the given Cloudinary folder.
     *
     * @param file   the multipart file to upload
     * @param folder logical folder path in Cloudinary (e.g. "avatars")
     * @return the secure URL and public ID of the uploaded image
     * @throws BusinessException if the file is empty, has an unsupported type,
     *                           exceeds the size limit, or the upload fails
     */
    public CloudinaryUploadResult uploadImage(MultipartFile file, String folder) {
        validateFile(file);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = (Map<String, Object>) cloudinary.uploader().upload(
                    file.getBytes(),
                    Map.of(
                            "folder",        folder,
                            "resource_type", "image",
                            "overwrite",     false
                    )
            );

            String url      = (String) result.get("secure_url");
            String publicId = (String) result.get("public_id");

            log.info("Cloudinary upload successful: publicId={}", publicId);
            return new CloudinaryUploadResult(url, publicId);

        } catch (IOException e) {
            log.error("Cloudinary upload failed for folder '{}': {}", folder, e.getMessage());
            throw new BusinessException(ErrorCode.UPLOAD_FAILED);
        }
    }

    /**
     * Deletes an image from Cloudinary by its public ID.
     * Failure is best-effort: a warning is logged but no exception is thrown,
     * so the caller's transaction is not rolled back.
     *
     * @param publicId the Cloudinary public ID (stored in {@code avatar_public_id} column)
     */
    public void deleteImage(String publicId) {
        if (publicId == null || publicId.isBlank()) return;

        try {
            cloudinary.uploader().destroy(publicId, Map.of("resource_type", "image"));
            log.info("Cloudinary image deleted: publicId={}", publicId);
        } catch (Exception e) {
            log.warn("Failed to delete Cloudinary image '{}': {}", publicId, e.getMessage());
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.UPLOAD_FILE_EMPTY);
        }

        String contentType = file.getContentType();

        log.info("Uploaded file content type: {}", contentType);
        
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType)) {
            throw new BusinessException(ErrorCode.UPLOAD_FILE_TYPE_INVALID);
        }

        if (file.getSize() > properties.getMaxFileSize().toBytes()) {
            throw new BusinessException(ErrorCode.UPLOAD_FILE_TOO_LARGE);
        }
    }
}
