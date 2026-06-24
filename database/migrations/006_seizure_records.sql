-- +goose Up
CREATE TABLE seizure_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid REFERENCES patients (id),
    recorded_by uuid REFERENCES user_profiles (id),
    video_id uuid REFERENCES files (id),
    recorded_at timestamp,
    duration_seconds integer,
    seizure_type varchar,
    notes text,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- +goose Down
DROP TABLE seizure_records;
