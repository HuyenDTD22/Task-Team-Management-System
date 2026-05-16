-- Stores the Cloudinary public ID alongside the URL so we can delete/replace
-- the old image when the user uploads a new avatar (avoids orphan files).
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_public_id VARCHAR(255);
