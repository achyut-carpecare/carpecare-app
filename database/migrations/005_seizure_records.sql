-- +goose Up
CREATE TABLE seizure_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid REFERENCES patients (id),
    recorded_by uuid REFERENCES auth.users (id),
    video_id uuid REFERENCES files (id),
    recorded_at timestamp,
    duration_seconds integer,
    seizure_type varchar,
    notes text
);

-- +goose Down
DROP TABLE seizure_records;
