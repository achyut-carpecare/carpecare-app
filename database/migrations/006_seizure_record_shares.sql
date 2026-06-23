-- +goose Up
CREATE TABLE seizure_record_shares (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    seizure_record_id uuid REFERENCES seizure_records (id),
    shared_by uuid REFERENCES auth.users (id),
    recipient_email varchar,
    expires_at timestamp
);

-- +goose Down
DROP TABLE seizure_record_shares;
