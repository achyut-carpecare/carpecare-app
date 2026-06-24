-- +goose Up
CREATE TABLE patients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    care_home_id uuid REFERENCES care_home (id),
    first_name varchar,
    last_name varchar,
    date_of_birth date,
    nhs_number varchar,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- +goose Down
DROP TABLE patients;
