-- +goose Up
ALTER TABLE user_profiles
    ADD COLUMN mfa_enabled boolean NOT NULL DEFAULT true;

-- +goose Down
ALTER TABLE user_profiles
    DROP COLUMN mfa_enabled;
