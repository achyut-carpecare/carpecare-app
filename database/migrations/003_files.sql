-- +goose Up
CREATE TABLE files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    s3_key varchar,
    mime_type varchar,
    size_bytes bigint,
    uploaded_at timestamp
);

-- +goose Down
DROP TABLE files;
