-- +goose Up
CREATE TYPE care_home_member_access_mode AS ENUM ('home_wide', 'person_scoped');

ALTER TABLE care_home_members
    ADD COLUMN access_mode care_home_member_access_mode NOT NULL DEFAULT 'home_wide';

-- +goose Down
ALTER TABLE care_home_members DROP COLUMN access_mode;
DROP TYPE care_home_member_access_mode;
