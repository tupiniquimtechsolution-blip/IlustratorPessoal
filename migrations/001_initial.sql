CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  profile_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_opened_at TEXT NOT NULL,
  canvas_state TEXT NOT NULL DEFAULT '{}',
  default_export_preset_id TEXT
);

CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('original','revision','reference','mask')),
  original_name TEXT NOT NULL,
  managed_path TEXT NOT NULL UNIQUE,
  thumbnail_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  file_size INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  has_alpha INTEGER NOT NULL DEFAULT 0,
  color_space TEXT NOT NULL DEFAULT 'srgb',
  created_at TEXT NOT NULL
);

CREATE TABLE revisions (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL REFERENCES assets(id),
  parent_revision_id TEXT REFERENCES revisions(id),
  operation TEXT NOT NULL,
  prompt TEXT NOT NULL DEFAULT '',
  preserve_instructions TEXT NOT NULL DEFAULT '',
  parameters_json TEXT NOT NULL DEFAULT '{}',
  provider_id TEXT,
  model_id TEXT,
  mask_asset_id TEXT REFERENCES assets(id),
  output_asset_id TEXT NOT NULL REFERENCES assets(id),
  is_favorite INTEGER NOT NULL DEFAULT 0,
  label TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE project_references (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  priority TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  UNIQUE(project_id, asset_id)
);

CREATE TABLE illustrator_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  schema_version INTEGER NOT NULL DEFAULT 1,
  content_json TEXT NOT NULL,
  is_strict INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE style_presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  content_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE prompt_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  sections_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE generation_jobs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  input_json TEXT NOT NULL,
  output_json TEXT NOT NULL DEFAULT '{}',
  model_id TEXT NOT NULL DEFAULT '',
  error_code TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT
);

CREATE TABLE provider_configurations (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0,
  endpoint TEXT NOT NULL,
  default_model TEXT NOT NULL,
  configuration_json TEXT NOT NULL DEFAULT '{}',
  secret_reference TEXT
);

CREATE TABLE export_presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  format TEXT NOT NULL,
  quality INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  resize_mode TEXT NOT NULL,
  preserve_alpha INTEGER NOT NULL DEFAULT 1,
  strip_metadata INTEGER NOT NULL DEFAULT 1,
  filename_pattern TEXT NOT NULL
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_projects_last_opened ON projects(last_opened_at DESC);
CREATE INDEX idx_assets_project_created ON assets(project_id, created_at DESC);
CREATE INDEX idx_assets_hash ON assets(sha256);
CREATE INDEX idx_revisions_asset_created ON revisions(asset_id, created_at DESC);
CREATE INDEX idx_revisions_output ON revisions(output_asset_id);
CREATE INDEX idx_references_project_order ON project_references(project_id, order_index);
CREATE INDEX idx_jobs_project_created ON generation_jobs(project_id, created_at DESC);
CREATE INDEX idx_jobs_status ON generation_jobs(status);
