-- Drop existing tables (if they have wrong schema)
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS media CASCADE;
DROP TABLE IF EXISTS softwares CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- contacts table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  service_interest TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- media table
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  alt_text TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- softwares table
CREATE TABLE softwares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  file_url TEXT NOT NULL,
  file_size TEXT,
  downloads_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- admins table
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- services table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT NOT NULL,
  full_description TEXT,
  icon TEXT NOT NULL DEFAULT 'Code2',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE softwares ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Policies for service role (full access)
CREATE POLICY "Service role full access contacts" ON contacts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access media" ON media FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access softwares" ON softwares FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access services" ON services FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access admins" ON admins FOR ALL USING (auth.role() = 'service_role');

-- Public read for softwares
CREATE POLICY "Public read active softwares" ON softwares FOR SELECT USING (is_active = TRUE);

-- Public read for active services
CREATE POLICY "Public read active services" ON services FOR SELECT USING (is_active = TRUE);

-- Public insert for contacts
CREATE POLICY "Public insert contacts" ON contacts FOR INSERT WITH CHECK (TRUE);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', TRUE) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('software', 'software', FALSE) ON CONFLICT DO NOTHING;

-- Storage policies for media bucket (public read)
CREATE POLICY "Public read media" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Service role manage media" ON storage.objects FOR ALL USING (bucket_id = 'media' AND auth.role() = 'service_role');

-- Storage policies for software bucket (private, service role only)
CREATE POLICY "Service role manage software" ON storage.objects FOR ALL USING (bucket_id = 'software' AND auth.role() = 'service_role');