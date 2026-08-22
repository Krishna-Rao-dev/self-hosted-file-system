CREATE TABLE IF NOT EXISTS files (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
	original_name TEXT NOT NULL,
	s3_key TEXT NOT NULL UNIQUE,
	mime_type TEXT NOT NULL,
	size BIGINT NOT NULL CHECK (size >= 0),
	checksum TEXT,
	completed BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS files_user_id_idx ON files (user_id);
CREATE INDEX IF NOT EXISTS files_folder_id_idx ON files (folder_id);
CREATE INDEX IF NOT EXISTS files_user_folder_idx ON files (user_id, folder_id);
