-- 011_puppies_variety.sql
-- Adds variety column to puppies (for mixed-variety litters)

ALTER TABLE puppies ADD COLUMN variety TEXT;
