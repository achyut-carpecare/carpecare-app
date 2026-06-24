-- Carpe Care — Seed data matching existing care homes and users
-- Run with: psql $DATABASE_URL -f seed.sql
-- or via supabase sql editor

-- NOTE: This script does NOT truncate user_profiles or care_home.
-- It truncates and re-seeds patients, seizure records, shares and files only.

BEGIN;

TRUNCATE TABLE seizure_record_shares CASCADE;
TRUNCATE TABLE seizure_records CASCADE;
TRUNCATE TABLE patients CASCADE;
TRUNCATE TABLE files CASCADE;

-- ---------------------------------------------------------------------------
-- Care homes from your database:
--   Sunrise Home Care: e007303b-7458-4ab5-a294-b78ba82073ba
--   Test Care Home 2:  84753deb-4bca-4ea5-b53e-88719dda7c5a
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Patients
-- ---------------------------------------------------------------------------

INSERT INTO patients (id, care_home_id, first_name, last_name, date_of_birth, nhs_number, created_at, updated_at) VALUES
  -- Sunrise Home Care
  ('11111111-0001-4000-8000-000000000001', 'e007303b-7458-4ab5-a294-b78ba82073ba', 'James', 'Wilson', '1952-08-14', '123 456 7890', NOW(), NOW()),
  ('11111111-0001-4000-8000-000000000002', 'e007303b-7458-4ab5-a294-b78ba82073ba', 'Maria', 'Gomez', '1968-05-03', '234 567 8901', NOW(), NOW()),
  ('11111111-0001-4000-8000-000000000003', 'e007303b-7458-4ab5-a294-b78ba82073ba', 'Arthur', 'Chen', '1949-11-21', '345 678 9012', NOW(), NOW()),
  ('11111111-0001-4000-8000-000000000004', 'e007303b-7458-4ab5-a294-b78ba82073ba', 'Dorothy', 'Brown', '1939-02-28', '456 789 0123', NOW(), NOW()),
  ('11111111-0001-4000-8000-000000000005', 'e007303b-7458-4ab5-a294-b78ba82073ba', 'Henry', 'Davis', '1955-07-11', '567 890 1234', NOW(), NOW()),
  ('11111111-0001-4000-8000-000000000006', 'e007303b-7458-4ab5-a294-b78ba82073ba', 'Eileen', 'Foster', '1942-12-05', '678 901 2345', NOW(), NOW()),
  ('11111111-0001-4000-8000-000000000007', 'e007303b-7458-4ab5-a294-b78ba82073ba', 'Robert', 'Anderson', '1950-09-19', '789 012 3456', NOW(), NOW()),
  ('11111111-0001-4000-8000-000000000008', 'e007303b-7458-4ab5-a294-b78ba82073ba', 'Lillian', 'Taylor', '1947-04-22', '890 123 4567', NOW(), NOW()),
  ('11111111-0001-4000-8000-000000000009', 'e007303b-7458-4ab5-a294-b78ba82073ba', 'Thomas', 'Moore', '1958-01-30', '901 234 5678', NOW(), NOW()),
  ('11111111-0001-4000-8000-000000000010', 'e007303b-7458-4ab5-a294-b78ba82073ba', 'Margaret', 'Jackson', '1944-06-16', '012 345 6789', NOW(), NOW()),
  ('11111111-0001-4000-8000-000000000011', 'e007303b-7458-4ab5-a294-b78ba82073ba', 'Albert', 'White', '1953-10-08', '111 222 3333', NOW(), NOW()),
  ('11111111-0001-4000-8000-000000000012', 'e007303b-7458-4ab5-a294-b78ba82073ba', 'Catherine', 'Harris', '1940-03-25', '222 333 4444', NOW(), NOW()),

  -- Test Care Home 2
  ('22222222-0002-4000-8000-000000000001', '84753deb-4bca-4ea5-b53e-88719dda7c5a', 'William', 'Martin', '1948-08-09', '333 444 5555', NOW(), NOW()),
  ('22222222-0002-4000-8000-000000000002', '84753deb-4bca-4ea5-b53e-88719dda7c5a', 'Patricia', 'Thompson', '1956-12-13', '444 555 6666', NOW(), NOW()),
  ('22222222-0002-4000-8000-000000000003', '84753deb-4bca-4ea5-b53e-88719dda7c5a', 'George', 'Garcia', '1951-05-17', '555 666 7777', NOW(), NOW()),
  ('22222222-0002-4000-8000-000000000004', '84753deb-4bca-4ea5-b53e-88719dda7c5a', 'Barbara', 'Robinson', '1946-02-02', '666 777 8888', NOW(), NOW()),
  ('22222222-0002-4000-8000-000000000005', '84753deb-4bca-4ea5-b53e-88719dda7c5a', 'Richard', 'Clark', '1959-07-29', '777 888 9999', NOW(), NOW()),
  ('22222222-0002-4000-8000-000000000006', '84753deb-4bca-4ea5-b53e-88719dda7c5a', 'Susan', 'Rodriguez', '1943-11-06', '888 999 0000', NOW(), NOW()),
  ('22222222-0002-4000-8000-000000000007', '84753deb-4bca-4ea5-b53e-88719dda7c5a', 'Joseph', 'Lewis', '1954-04-14', '999 000 1111', NOW(), NOW()),
  ('22222222-0002-4000-8000-000000000008', '84753deb-4bca-4ea5-b53e-88719dda7c5a', 'Jessica', 'Lee', '1962-09-23', '000 111 2222', NOW(), NOW());

-- ---------------------------------------------------------------------------
-- Seizure records
-- ---------------------------------------------------------------------------

INSERT INTO seizure_records (id, patient_id, recorded_by, video_id, recorded_at, duration_seconds, seizure_type, notes, created_at, updated_at) VALUES
  -- James Wilson (Sunrise)
  ('11111111-1001-4000-8000-000000000001', '11111111-0001-4000-8000-000000000001', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', NULL, NOW() - INTERVAL '4 hours', 83, 'Tonic-clonic', 'Patient was sitting in the lounge. Seizure started suddenly with loss of consciousness and rhythmic jerking of arms and legs. No visible injury. Recovered fully after 5 minutes.', NOW(), NOW()),
  ('11111111-1001-4000-8000-000000000002', '11111111-0001-4000-8000-000000000001', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', NULL, NOW() - INTERVAL '1 day 4 hours', 45, 'Focal', 'Recorded by staff. James remained conscious throughout. Lasted around 45 seconds.', NOW(), NOW()),
  ('11111111-1001-4000-8000-000000000003', '11111111-0001-4000-8000-000000000001', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', NULL, NOW() - INTERVAL '3 days 2 hours', 30, 'Tonic-clonic', 'Quick recovery. No injuries noted.', NOW(), NOW()),
  ('11111111-1001-4000-8000-000000000004', '11111111-0001-4000-8000-000000000001', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', NULL, NOW() - INTERVAL '5 days 8 hours', 60, 'Tonic-clonic', 'Morning episode. Staff stayed with him until fully recovered.', NOW(), NOW()),
  ('11111111-1001-4000-8000-000000000005', '11111111-0001-4000-8000-000000000001', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', NULL, NOW() - INTERVAL '8 days 1 hour', 55, 'Focal', 'Observed during afternoon tea. Patient aware of surroundings.', NOW(), NOW()),
  ('11111111-1001-4000-8000-000000000006', '11111111-0001-4000-8000-000000000001', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', NULL, NOW() - INTERVAL '11 days 5 hours', 40, 'Tonic-clonic', 'Brief episode late evening. Monitored until bedtime.', NOW(), NOW()),
  ('11111111-1001-4000-8000-000000000007', '11111111-0001-4000-8000-000000000001', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', NULL, NOW() - INTERVAL '16 days 3 hours', 90, 'Tonic-clonic', 'Longer episode than usual. Medication review suggested.', NOW(), NOW()),

  -- Maria Gomez (Sunrise)
  ('11111111-1002-4000-8000-000000000001', '11111111-0001-4000-8000-000000000002', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', NULL, NOW() - INTERVAL '3 days 6 hours', 45, 'Focal', 'Patient was reading when episode started. Fully recovered.', NOW(), NOW()),
  ('11111111-1002-4000-8000-000000000002', '11111111-0001-4000-8000-000000000002', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', NULL, NOW() - INTERVAL '9 days 2 hours', 35, 'Focal', 'Short episode during breakfast.', NOW(), NOW()),
  ('11111111-1002-4000-8000-000000000003', '11111111-0001-4000-8000-000000000002', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', NULL, NOW() - INTERVAL '14 days 4 hours', 50, 'Tonic-clonic', 'Evening episode. Staff noted good recovery.', NOW(), NOW()),

  -- Arthur Chen (Sunrise)
  ('11111111-1003-4000-8000-000000000001', '11111111-0001-4000-8000-000000000003', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', NULL, NOW() - INTERVAL '6 days 5 hours', 30, 'Tonic-clonic', 'Quiet morning. No other residents disturbed.', NOW(), NOW()),
  ('11111111-1003-4000-8000-000000000002', '11111111-0001-4000-8000-000000000003', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', NULL, NOW() - INTERVAL '12 days 1 hour', 25, 'Focal', 'Brief and self-limiting.', NOW(), NOW()),

  -- Dorothy Brown (Sunrise)
  ('11111111-1004-4000-8000-000000000001', '11111111-0001-4000-8000-000000000004', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', NULL, NOW() - INTERVAL '2 days 3 hours', 70, 'Tonic-clonic', 'Staff member present throughout. Patient calm afterwards.', NOW(), NOW()),
  ('11111111-1004-4000-8000-000000000002', '11111111-0001-4000-8000-000000000004', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', NULL, NOW() - INTERVAL '7 days 6 hours', 40, 'Focal', 'Observed during TV time.', NOW(), NOW()),

  -- Henry Davis (Sunrise)
  ('11111111-1005-4000-8000-000000000001', '11111111-0001-4000-8000-000000000005', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', NULL, NOW() - INTERVAL '20 days 2 hours', 20, 'Focal', 'Very brief. No intervention needed.', NOW(), NOW()),

  -- William Martin (Test Care Home 2)
  ('22222222-2001-4000-8000-000000000001', '22222222-0002-4000-8000-000000000001', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', NULL, NOW() - INTERVAL '1 day 7 hours', 55, 'Tonic-clonic', 'Recorded by admin. Full recovery after 6 minutes.', NOW(), NOW()),
  ('22222222-2001-4000-8000-000000000002', '22222222-0002-4000-8000-000000000001', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', NULL, NOW() - INTERVAL '4 days 4 hours', 35, 'Focal', 'Patient was in garden. Brought inside and observed.', NOW(), NOW()),
  ('22222222-2001-4000-8000-000000000003', '22222222-0002-4000-8000-000000000001', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', NULL, NOW() - INTERVAL '10 days 3 hours', 60, 'Tonic-clonic', 'Medication given as per PRN protocol.', NOW(), NOW()),

  -- Patricia Thompson (Test Care Home 2)
  ('22222222-2002-4000-8000-000000000001', '22222222-0002-4000-8000-000000000002', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', NULL, NOW() - INTERVAL '5 days 1 hour', 40, 'Focal', 'Calm episode in bedroom.', NOW(), NOW()),
  ('22222222-2002-4000-8000-000000000002', '22222222-0002-4000-8000-000000000002', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', NULL, NOW() - INTERVAL '13 days 5 hours', 50, 'Tonic-clonic', 'Staff stayed until patient was fully alert.', NOW(), NOW()),

  -- George Garcia (Test Care Home 2)
  ('22222222-2003-4000-8000-000000000001', '22222222-0002-4000-8000-000000000003', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', NULL, NOW() - INTERVAL '6 days 2 hours', 35, 'Focal', 'Episode during morning walk. Recovered quickly.', NOW(), NOW()),

  -- Barbara Robinson (Test Care Home 2)
  ('22222222-2004-4000-8000-000000000001', '22222222-0002-4000-8000-000000000004', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', NULL, NOW() - INTERVAL '2 days 5 hours', 65, 'Tonic-clonic', 'Evening episode. Family called and updated.', NOW(), NOW()),

  -- Richard Clark (Test Care Home 2)
  ('22222222-2005-4000-8000-000000000001', '22222222-0002-4000-8000-000000000005', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', NULL, NOW() - INTERVAL '18 days 3 hours', 25, 'Focal', 'Short episode after lunch. No follow-up needed.', NOW(), NOW());

-- ---------------------------------------------------------------------------
-- Seizure record shares
-- ---------------------------------------------------------------------------

INSERT INTO seizure_record_shares (id, seizure_record_id, shared_by, recipient_email, expires_at, created_at, updated_at) VALUES
  (gen_random_uuid(), '11111111-1001-4000-8000-000000000001', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', 'dr.rivera@example.com', NOW() + INTERVAL '7 days', NOW(), NOW()),
  (gen_random_uuid(), '11111111-1001-4000-8000-000000000001', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', 'medic@neurology.example.com', NOW() + INTERVAL '14 days', NOW(), NOW()),
  (gen_random_uuid(), '11111111-1002-4000-8000-000000000001', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', 'nurse.lewis@example.com', NOW() + INTERVAL '5 days', NOW(), NOW()),
  (gen_random_uuid(), '11111111-1003-4000-8000-000000000001', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', 'dr.adams@example.com', NOW() + INTERVAL '10 days', NOW(), NOW()),
  (gen_random_uuid(), '22222222-2001-4000-8000-000000000001', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', 'dr.kim@example.com', NOW() + INTERVAL '3 days', NOW(), NOW()),
  (gen_random_uuid(), '22222222-2002-4000-8000-000000000002', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', 'consultant@example.com', NOW() + INTERVAL '21 days', NOW(), NOW()),
  (gen_random_uuid(), '22222222-2004-4000-8000-000000000001', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', 'gp.willows@example.com', NOW() + INTERVAL '6 days', NOW(), NOW()),
  (gen_random_uuid(), '11111111-1004-4000-8000-000000000001', '2e8941bf-9c7a-4d2e-a4b5-75739c555463', 'medic@example.com', NOW() + INTERVAL '8 days', NOW(), NOW());

-- ---------------------------------------------------------------------------
-- Files (no actual uploads, just placeholders)
-- ---------------------------------------------------------------------------

INSERT INTO files (id, s3_key, mime_type, size_bytes, uploaded_at) VALUES
  ('f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'videos/sunrise/james-morning.mp4', 'video/mp4', 12400000, NOW() - INTERVAL '4 hours'),
  ('f2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d', 'videos/sunrise/james-focal.mp4', 'video/mp4', 8900000, NOW() - INTERVAL '1 day'),
  ('f3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'videos/sunrise/maria-breakfast.mp4', 'video/mp4', 7600000, NOW() - INTERVAL '3 days'),
  ('f4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e8f', 'videos/test2/william-garden.mp4', 'video/mp4', 11200000, NOW() - INTERVAL '1 day'),
  ('f5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f9a', 'videos/test2/barbara-evening.mp4', 'video/mp4', 9800000, NOW() - INTERVAL '2 days');

UPDATE seizure_records SET video_id = 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c' WHERE id = '11111111-1001-4000-8000-000000000001';
UPDATE seizure_records SET video_id = 'f2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d' WHERE id = '11111111-1001-4000-8000-000000000002';
UPDATE seizure_records SET video_id = 'f3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e' WHERE id = '11111111-1002-4000-8000-000000000001';
UPDATE seizure_records SET video_id = 'f4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e8f' WHERE id = '22222222-2001-4000-8000-000000000001';
UPDATE seizure_records SET video_id = 'f5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f9a' WHERE id = '22222222-2004-4000-8000-000000000001';

COMMIT;
