-- +goose Up
ALTER TABLE files
  ADD COLUMN uploaded_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL;

-- +goose Down
ALTER TABLE files
  DROP COLUMN uploaded_by;
