-- Add example_text column to radio_requests table
-- Migration: 0007_add_example_text

ALTER TABLE radio_requests ADD COLUMN example_text TEXT;
