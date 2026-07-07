-- +goose Up
CREATE TABLE platform_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invited_email varchar NOT NULL,
    invited_by uuid REFERENCES user_profiles (id) ON DELETE SET NULL,
    status invitation_status NOT NULL DEFAULT 'pending',
    link_token_hash text,
    accepted_at timestamp,
    accepted_by uuid REFERENCES user_profiles (id) ON DELETE SET NULL,
    expires_at timestamp,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX idx_platform_invitations_pending_email
ON platform_invitations (invited_email)
WHERE status = 'pending';

-- +goose Down
DROP TABLE platform_invitations;
