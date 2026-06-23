-- +goose Up
CREATE TYPE app_role AS ENUM ('system_admin', 'care_home_user');
CREATE TYPE care_home_role AS ENUM ('admin', 'member');

ALTER TABLE user_profiles
    ADD COLUMN role app_role NOT NULL DEFAULT 'care_home_user';

ALTER TABLE care_home_members
    ADD COLUMN role care_home_role NOT NULL DEFAULT 'member';

-- +goose Down
ALTER TABLE care_home_members DROP COLUMN IF EXISTS role;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS role;
DROP TYPE IF EXISTS care_home_role;
DROP TYPE IF EXISTS app_role;
