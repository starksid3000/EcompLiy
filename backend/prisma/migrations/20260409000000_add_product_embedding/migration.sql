-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to products table
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "embedding" vector(768);
