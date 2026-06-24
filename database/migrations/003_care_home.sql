-- +goose Up
CREATE TABLE care_home (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- +goose Down
DROP TABLE care_home;
