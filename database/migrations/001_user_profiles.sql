-- +goose Up
CREATE TABLE user_profiles (
    id uuid PRIMARY KEY,
    first_name varchar,
    last_name varchar
);

-- +goose Down
DROP TABLE user_profiles;
