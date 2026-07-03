-- +goose Up
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');

CREATE TABLE care_home_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    care_home_id uuid NOT NULL REFERENCES care_home (id) ON DELETE CASCADE,
    invited_email varchar NOT NULL,
    role care_home_role NOT NULL DEFAULT 'member',
    invited_by uuid REFERENCES user_profiles (id) ON DELETE SET NULL,
    status invitation_status NOT NULL DEFAULT 'pending',
    link_token_hash text,
    otp_hash text,
    otp_attempts integer DEFAULT 0,
    last_otp_sent_at timestamp,
    accepted_at timestamp,
    accepted_by uuid REFERENCES user_profiles (id) ON DELETE SET NULL,
    expires_at timestamp,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX idx_care_home_invitations_pending_email
ON care_home_invitations (care_home_id, invited_email)
WHERE status = 'pending';


-- +goose Down
DROP TABLE care_home_invitations;
DROP TYPE IF EXISTS invitation_status;
