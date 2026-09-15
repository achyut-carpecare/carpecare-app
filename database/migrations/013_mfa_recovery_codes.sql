-- +goose Up
CREATE TABLE mfa_recovery_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES user_profiles (id) ON DELETE CASCADE,
    code_hash text NOT NULL,
    used_at timestamp,
    created_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX idx_mfa_recovery_codes_user_id ON mfa_recovery_codes (user_id);

ALTER TABLE mfa_recovery_codes ENABLE ROW LEVEL SECURITY;

-- +goose Down
DROP TABLE mfa_recovery_codes;
