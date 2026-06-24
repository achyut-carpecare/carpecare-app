-- +goose Up
CREATE TYPE care_home_role AS ENUM ('admin', 'member');

CREATE TABLE care_home_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES user_profiles (id) ON DELETE CASCADE,
    care_home_id uuid NOT NULL REFERENCES care_home (id) ON DELETE CASCADE,
    role care_home_role NOT NULL DEFAULT 'member',
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    UNIQUE (user_id, care_home_id)
);

-- +goose Down
DROP TABLE care_home_members;
DROP TYPE IF EXISTS care_home_role;
