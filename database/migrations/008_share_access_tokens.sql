-- +goose Up
ALTER TABLE seizure_record_shares
    ADD COLUMN link_token_hash text,
    ADD COLUMN otp_hash text,
    ADD COLUMN otp_attempts integer DEFAULT 0,
    ADD COLUMN last_otp_sent_at timestamp,
    ADD COLUMN accessed_at timestamp;

-- +goose Down
ALTER TABLE seizure_record_shares
    DROP COLUMN link_token_hash,
    DROP COLUMN otp_hash,
    DROP COLUMN otp_attempts,
    DROP COLUMN last_otp_sent_at,
    DROP COLUMN accessed_at;
