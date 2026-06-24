-- +goose Up
CREATE TABLE seizure_record_shares (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    seizure_record_id uuid REFERENCES seizure_records (id),
    shared_by uuid REFERENCES user_profiles (id),
    recipient_email varchar,
    expires_at timestamp,
    link_token_hash text,
    otp_hash text,
    otp_attempts integer DEFAULT 0,
    last_otp_sent_at timestamp,
    accessed_at timestamp,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- +goose Down
DROP TABLE seizure_record_shares;
