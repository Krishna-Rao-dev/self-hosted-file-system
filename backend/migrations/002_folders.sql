CREATE TABLE IF NOT EXISTS folders (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	parent_folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
	name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 255),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS folders_user_id_idx ON folders (user_id);
CREATE INDEX IF NOT EXISTS folders_parent_folder_id_idx ON folders (parent_folder_id);
