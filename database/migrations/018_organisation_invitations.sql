-- +goose Up
CREATE TABLE organisation_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id uuid NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
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
ALTER TABLE organisation_invitations ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX idx_organisation_invitations_pending_email
    ON organisation_invitations (organisation_id, invited_email)
    WHERE (status = 'pending'::invitation_status);

-- +goose Down
DROP TABLE organisation_invitations;
