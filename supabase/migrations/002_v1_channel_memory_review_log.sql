-- V1 persistence tables for channel memory + conservative change review log.
-- Note: Backend also uses SQLAlchemy `create_all` for local SQLite.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS channel_memory (
  id VARCHAR(36) PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  channel_id VARCHAR(50) NOT NULL,
  memory_version INTEGER NOT NULL,
  built_at TIMESTAMPTZ NOT NULL,
  provenance JSONB NOT NULL,
  title_baseline JSONB NOT NULL,
  description_baseline JSONB NOT NULL,
  format_signatures JSONB NOT NULL DEFAULT '[]'::jsonb,
  channel_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_channel_memory_channel_version UNIQUE (channel_id, memory_version)
);

CREATE INDEX IF NOT EXISTS ix_channel_memory_channel_id ON channel_memory(channel_id);
CREATE INDEX IF NOT EXISTS ix_channel_memory_channel_built_at ON channel_memory(channel_id, built_at);

CREATE TABLE IF NOT EXISTS change_reviews (
  id VARCHAR(36) PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  channel_id VARCHAR(50) NOT NULL,
  video_id VARCHAR(50) NOT NULL,
  current_title VARCHAR(500) NOT NULL,
  current_description TEXT NOT NULL DEFAULT '',
  proposed_title VARCHAR(500) NOT NULL,
  proposed_description TEXT NOT NULL DEFAULT '',
  verdict TEXT NOT NULL CHECK (verdict IN ('approve', 'warn', 'block')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  confidence TEXT NOT NULL CHECK (confidence IN ('low', 'medium', 'high')),
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  conservative_title_suggestion VARCHAR(500),
  conservative_description_suggestion TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_change_reviews_channel_id ON change_reviews(channel_id);
CREATE INDEX IF NOT EXISTS ix_change_reviews_video_id ON change_reviews(video_id);
CREATE INDEX IF NOT EXISTS ix_change_reviews_channel_video_created ON change_reviews(channel_id, video_id, created_at);

CREATE TABLE IF NOT EXISTS review_outcomes (
  review_id VARCHAR(36) PRIMARY KEY REFERENCES change_reviews(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('unknown', 'positive', 'neutral', 'negative')),
  evaluated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_review_outcomes_status_evaluated ON review_outcomes(status, evaluated_at);
