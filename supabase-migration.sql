-- =============================================
-- CFTEC Supabase Migration - Drop & Recreate
-- Run in Supabase Dashboard → SQL Editor
-- =============================================

-- 1. DROP EXISTING TABLES (with CASCADE for foreign keys)
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS softwares CASCADE;
DROP TABLE IF EXISTS media CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- 2. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 3. CREATE TABLES WITH IMPROVED SCHEMA
-- =============================================

-- ADMINS TABLE
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  last_login TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SERVICES TABLE (improved)
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT NOT NULL,
  full_description TEXT,
  icon TEXT NOT NULL DEFAULT 'Code2',
  icon_color TEXT DEFAULT 'blue',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES admins(id),
  updated_by UUID REFERENCES admins(id)
);

-- MEDIA TABLE (improved)
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  alt_text TEXT,
  width INT,
  height INT,
  folder TEXT DEFAULT 'uploads',
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  uploaded_by UUID REFERENCES admins(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SOFTWARES TABLE (improved)
CREATE TABLE softwares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  version TEXT NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'EUR',
  file_url TEXT,
  file_size TEXT,
  file_hash TEXT,
  downloads_count INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  release_date TIMESTAMPTZ,
  changelog TEXT,
  requirements TEXT,
  screenshots TEXT[],
  category TEXT,
  tags TEXT[],
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES admins(id),
  updated_by UUID REFERENCES admins(id)
);

-- CONTACTS TABLE (improved)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  service_interest TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  source TEXT DEFAULT 'website',
  assigned_to UUID REFERENCES admins(id),
  replied_at TIMESTAMPTZ,
  replied_by UUID REFERENCES admins(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SETTINGS TABLE (new)
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AUDIT LOG TABLE (new)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admins(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_is_active ON admins(is_active);

CREATE INDEX idx_services_slug ON services(slug);
CREATE INDEX idx_services_is_active ON services(is_active);
CREATE INDEX idx_services_sort_order ON services(sort_order);

CREATE INDEX idx_media_folder ON media(folder);
CREATE INDEX idx_media_is_public ON media(is_public);
CREATE INDEX idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX idx_media_uploaded_at ON media(uploaded_at DESC);

CREATE INDEX idx_softwares_slug ON softwares(slug);
CREATE INDEX idx_softwares_is_active ON softwares(is_active);
CREATE INDEX idx_softwares_is_featured ON softwares(is_featured);
CREATE INDEX idx_softwares_category ON softwares(category);

CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_assigned_to ON contacts(assigned_to);
CREATE INDEX idx_contacts_created_at ON contacts(created_at DESC);
CREATE INDEX idx_contacts_email ON contacts(email);

CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =============================================
-- TRIGGERS FOR updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON media FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_softwares_updated_at BEFORE UPDATE ON softwares FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE softwares ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admin policies (only authenticated admins can access)
CREATE POLICY "Admins can view all admins" ON admins FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can insert admins" ON admins FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update admins" ON admins FOR UPDATE USING (auth.role() = 'authenticated');

-- Services policies
CREATE POLICY "Public can view active services" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage services" ON services FOR ALL USING (auth.role() = 'authenticated');

-- Media policies
CREATE POLICY "Public can view public media" ON media FOR SELECT USING (is_public = true);
CREATE POLICY "Admins can manage media" ON media FOR ALL USING (auth.role() = 'authenticated');

-- Softwares policies
CREATE POLICY "Public can view active softwares" ON softwares FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage softwares" ON softwares FOR ALL USING (auth.role() = 'authenticated');

-- Contacts policies
CREATE POLICY "Anyone can insert contacts" ON contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all contacts" ON contacts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can update contacts" ON contacts FOR UPDATE USING (auth.role() = 'authenticated');

-- Settings policies
CREATE POLICY "Public can view public settings" ON settings FOR SELECT USING (is_public = true);
CREATE POLICY "Admins can manage settings" ON settings FOR ALL USING (auth.role() = 'authenticated');

-- Audit logs policies
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT USING (auth.role() = 'authenticated');

-- =============================================
-- SEED DATA
-- =============================================

-- Default admin (password: admin123456)
INSERT INTO admins (name, email, password_hash, role)
VALUES (
  'Admin CFTEC',
  'admin@cftec.co',
  '$2b$12$K8LxVhJQb8K4QvQvQvQvQeQvQvQvQvQvQvQvQvQvQvQvQvQvQvQ',
  'super_admin'
) ON CONFLICT (email) DO NOTHING;

-- Default services
INSERT INTO services (title, slug, short_description, full_description, icon, icon_color, is_active, sort_order) VALUES
  ('Desenvolvimento à medida', 'desenvolvimento-a-medida', 
   'Aplicações web robustas para a realidade da sua equipa.', 
   'Produtos digitais pensados para os processos e objectivos específicos do seu negócio.', 
   'Code2', 'blue', true, 1),
  ('Cloud & conectividade', 'cloud-conectividade', 
   'Arquitecturas seguras, escaláveis e sob controlo.', 
   'Infraestrutura preparada para manter os seus dados disponíveis e a sua operação em movimento.', 
   'Server', 'cyan', true, 2),
  ('Dados & automação', 'dados-automacao', 
   'Informação accionável para decidir com confiança.', 
   'Dashboards, integrações e automações que reduzem ruído e desbloqueiam performance.', 
   'BarChart3', 'violet', true, 3),
  ('Suporte especializado', 'suporte-especializado', 
   'Uma equipa técnica próxima para manter tudo a avançar.', 
   'Acompanhamento contínuo, resolução rápida e evolução sustentada da sua tecnologia.', 
   'Headphones', 'green', true, 4)
ON CONFLICT (slug) DO NOTHING;

-- Default softwares
INSERT INTO softwares (name, slug, version, description, price, file_url, file_size, downloads_count, is_active, is_featured, category) VALUES
  ('CFTEC Flow', 'cftec-flow', 'v2.4', 'O centro de comando para pedidos, equipas e tarefas.', 0.00, '/downloads/cftec-flow-trial.zip', '45 MB', 183, true, true, 'gestao'),
  ('CFTEC Insight', 'cftec-insight', 'v1.8', 'Dashboards que transformam dados em próximos passos claros.', 0.00, '/downloads/cftec-insight-trial.zip', '32 MB', 97, true, true, 'analytics'),
  ('CFTEC Desk', 'cftec-desk', 'v3.1', 'Uma experiência simples para organizar suporte e clientes.', 0.00, '/downloads/cftec-desk-trial.zip', '58 MB', 246, true, true, 'suporte')
ON CONFLICT (slug) DO NOTHING;

-- Default settings
INSERT INTO settings (key, value, description, is_public) VALUES
  ('site_name', '"CFTEC"', 'Nome do site', true),
  ('site_description', '"Tecnologia que simplifica. Resultados que ficam."', 'Descrição do site', true),
  ('contact_email', '"hello@cftec.co"', 'Email de contacto', true),
  ('contact_phone', '"+244 923 000 000"', 'Telefone de contacto', true),
  ('maintenance_mode', 'false', 'Modo de manutenção', false),
  ('max_upload_size', '10485760', 'Tamanho máximo de upload (bytes)', false),
  ('allowed_mime_types', '["image/jpeg", "image/png", "image/webp", "image/gif"]', 'Tipos MIME permitidos', false)
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- STORAGE BUCKETS (run in Supabase Dashboard → Storage)
-- =============================================
-- 1. media (Public) - images for gallery
-- 2. software (Private/Public) - software installers
-- 3. documents (Private) - documents, PDFs

-- Run these in Supabase Dashboard → Storage → Policies:
-- CREATE POLICY "Public read" ON storage.objects FOR SELECT USING (bucket_id = 'media');
-- CREATE POLICY "Authenticated upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');
-- CREATE POLICY "Authenticated upload software" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'software' AND auth.role() = 'authenticated');