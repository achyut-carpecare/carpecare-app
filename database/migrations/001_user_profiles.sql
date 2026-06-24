-- +goose Up
CREATE TYPE app_role AS ENUM ('system_admin', 'care_home_user');

CREATE TABLE user_profiles (
    id uuid PRIMARY KEY,
    first_name varchar,
    last_name varchar,
    role app_role NOT NULL DEFAULT 'care_home_user',
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- +goose Down
DROP TABLE user_profiles;
DROP TYPE IF EXISTS app_role;
