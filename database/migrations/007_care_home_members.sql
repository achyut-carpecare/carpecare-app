-- +goose Up
CREATE TABLE care_home_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES user_profiles (id) ON DELETE CASCADE,
    care_home_id uuid NOT NULL REFERENCES care_home (id) ON DELETE CASCADE,
    created_at timestamp DEFAULT now() NOT NULL,
    UNIQUE (user_id, care_home_id)
);

-- +goose Down
DROP TABLE care_home_members;
