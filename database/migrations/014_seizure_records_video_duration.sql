-- +goose Up
ALTER TABLE seizure_records
    ADD COLUMN video_duration_seconds integer;

-- +goose Down
ALTER TABLE seizure_records
    DROP COLUMN video_duration_seconds;
