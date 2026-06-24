-- +goose Up
CREATE TABLE seizure_record_shares (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    seizure_record_id uuid REFERENCES seizure_records (id),
    shared_by uuid REFERENCES user_profiles (id),
    recipient_email varchar,
    expires_at timestamp,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- +goose Down
DROP TABLE seizure_record_shares;
