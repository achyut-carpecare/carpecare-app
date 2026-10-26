-- +goose Up
ALTER TYPE care_home_role ADD VALUE 'it_admin';

CREATE TYPE care_home_kind AS ENUM ('family', 'domiciliary', 'residential');

CREATE TABLE organisations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;

CREATE TABLE organisation_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES user_profiles (id) ON DELETE CASCADE,
    organisation_id uuid NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    UNIQUE (user_id, organisation_id)
);
ALTER TABLE organisation_members ENABLE ROW LEVEL SECURITY;

ALTER TABLE care_home
    ADD COLUMN organisation_id uuid REFERENCES organisations (id) ON DELETE SET NULL,
    ADD COLUMN kind care_home_kind NOT NULL DEFAULT 'residential';

CREATE TABLE patient_access_grants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES user_profiles (id) ON DELETE CASCADE,
    patient_id uuid NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
    care_home_id uuid NOT NULL REFERENCES care_home (id) ON DELETE CASCADE,
    created_at timestamp DEFAULT now() NOT NULL,
    UNIQUE (user_id, patient_id)
);
ALTER TABLE patient_access_grants ENABLE ROW LEVEL SECURITY;

-- +goose Down
DROP TABLE patient_access_grants;
ALTER TABLE care_home DROP COLUMN kind;
ALTER TABLE care_home DROP COLUMN organisation_id;
DROP TABLE organisation_members;
DROP TABLE organisations;
DROP TYPE care_home_kind;
-- care_home_role's added 'it_admin' value is not removed here - Postgres
-- can't drop a single enum value without recreating the type, and nothing
-- in this migration assigns it to existing rows, so leaving it is harmless.
