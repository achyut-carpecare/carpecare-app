-- +goose Up

-- Add the new boolean admin flag alongside the existing enum column.
ALTER TABLE user_profiles
    ADD COLUMN is_system_admin boolean NOT NULL DEFAULT false;

-- Migrate existing system administrators to the new flag.
UPDATE user_profiles
SET is_system_admin = true
WHERE role = 'system_admin';

-- Remove the old role column and its enum type.
ALTER TABLE user_profiles
    DROP COLUMN role;

DROP TYPE IF EXISTS app_role;

-- Recreate the auth user trigger to populate is_system_admin from app metadata.
-- +goose StatementBegin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    first_name,
    last_name,
    is_system_admin,
    created_at,
    updated_at
  ) VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce((new.raw_app_meta_data->>'is_system_admin')::boolean, false),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    is_system_admin = EXCLUDED.is_system_admin,
    updated_at = now();
  RETURN new;
END;
$$;
-- +goose StatementEnd

-- +goose Down

-- Restore the enum-based role column.
CREATE TYPE app_role AS ENUM ('system_admin', 'care_home_user');

ALTER TABLE user_profiles
    ADD COLUMN role app_role NOT NULL DEFAULT 'care_home_user';

UPDATE user_profiles
SET role = 'system_admin'
WHERE is_system_admin = true;

ALTER TABLE user_profiles
    DROP COLUMN is_system_admin;

-- Restore the original trigger body.
-- +goose StatementBegin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, first_name, last_name, role, created_at, updated_at)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'care_home_user'::public.app_role),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    updated_at = now();
  RETURN new;
END;
$$;
-- +goose StatementEnd
