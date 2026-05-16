package com.taskmanager.common.upload;

/**
 * Immutable result returned by Cloudinary after a successful upload.
 * {@code url} is always HTTPS (secure: true). {@code publicId} is needed
 * to update or delete the file later.
 */
public record CloudinaryUploadResult(String url, String publicId) {
}
