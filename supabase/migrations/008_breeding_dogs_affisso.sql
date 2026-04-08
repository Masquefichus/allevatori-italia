-- 008_breeding_dogs_affisso.sql
-- Adds affisso column to breeding_dogs for kennel suffix separate from dog name

ALTER TABLE breeding_dogs ADD COLUMN affisso TEXT;
