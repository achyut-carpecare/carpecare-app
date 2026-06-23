-- +goose Up
CREATE TABLE user_profiles (
    id uuid PRIMARY KEY,
    first_name varchar,
    last_name varchar,
    CONSTRAINT id_fk FOREIGN KEY (id) REFERENCES auth.users (id)
);

-- +goose Down
DROP TABLE user_profiles;
