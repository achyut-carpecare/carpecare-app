-- +goose Up
CREATE TABLE care_home (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar
);

-- +goose Down
DROP TABLE care_home;
