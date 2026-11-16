CREATE TABLE IF NOT EXISTS slots (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  hint TEXT NOT NULL,
  count INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS rooms (
  name TEXT PRIMARY KEY,
  grp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  r2_key TEXT NOT NULL,
  media_type TEXT DEFAULT 'image',
  slot TEXT,
  idx INTEGER,
  room TEXT,
  project TEXT,
  title TEXT,
  created INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp INTEGER DEFAULT 1,
  location TEXT,
  service TEXT,
  created INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_faqs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT NOT NULL,
  keywords TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS chat_sessions (
  session_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created INTEGER NOT NULL,
  updated INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  message TEXT NOT NULL,
  created INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_images_slot ON images(slot, idx);
CREATE INDEX IF NOT EXISTS idx_images_room ON images(room);
CREATE INDEX IF NOT EXISTS idx_images_project ON images(project);
CREATE INDEX IF NOT EXISTS idx_chat_msg_session ON chat_messages(session_id, id);

INSERT OR REPLACE INTO slots (key, label, hint, count) VALUES
  ('logo', 'Logo', 'Square emblem – header & footer', 1),
  ('hero', 'Top Hero Banner (Image or Video)', 'Upload MP4/WebM videos or wide 16:9 images (up to 100MB)', 4),
  ('services', 'Services cards', 'Space Planning · Color & Material · Modular Kitchen · Styled Interiors · Turnkey', 5),
  ('about', 'About section image', 'Wide interior photo', 1),
  ('vision', 'Vision collage', '1 wide + 2 smaller', 3),
  ('mission', 'Mission image', 'Portrait or square', 1),
  ('why', 'Why choose us collage', '1 wide + 2 smaller', 3),
  ('latest', 'Latest projects', 'Living Room · Bedroom · Kitchen · TV Unit', 4),
  ('reviews', 'Client review photos', 'One per review', 3),
  ('banner', 'Estimator banner', 'Very wide strip', 1),
  ('contact', 'Contact page collage', '1 wide + 2 smaller', 3),
  ('promo', 'Consultation form side image', 'Portrait', 1);

INSERT OR IGNORE INTO rooms (name, grp) VALUES
  ('Living Room', 'Living & Entrance'),
  ('TV Unit', 'Living & Entrance'),
  ('Entrance', 'Living & Entrance'),
  ('Bar & Balcony', 'Living & Entrance'),
  ('Kitchen', 'Kitchen & Dining'),
  ('Dining & Crockery', 'Kitchen & Dining'),
  ('Utility', 'Kitchen & Dining'),
  ('Pooja Room', 'Kitchen & Dining'),
  ('Master Bedroom', 'Bedrooms'),
  ('Kids Bedroom', 'Bedrooms'),
  ('Guest Bedroom', 'Bedrooms'),
  ('Study Room', 'Bedrooms'),
  ('Vanity & Wardrobe', 'Storage & Lighting'),
  ('Ceiling & Lighting', 'Storage & Lighting');

INSERT OR IGNORE INTO projects (id, name) VALUES
  ('villa', '3BHK Villa'),
  ('komp', 'Kompally'),
  ('hitec', 'Hitech City · Hamilton'),
  ('hyt', 'Hayathnagar'),
  ('blr', 'Bangalore'),
  ('pat', 'Patancheru · 5th Floor');

INSERT OR IGNORE INTO chat_faqs (id, question, keywords, answer, sort_order) VALUES
  (1, 'What services do you offer?', 'service,offer,do you,kitchen,turnkey,planning', 'We offer Space Planning, Colour & Material Consultation, Modular Kitchen Design & Execution, Styled Interiors & Furnishings, and Turnkey Project Execution.', 1),
  (2, 'What is your contact number?', 'phone,call,number,contact,mobile', 'Call us directly on +91 9705096205 or +91 7396397824.', 2),
  (3, 'Which locations do you serve?', 'where,address,location,city,hyderabad,andhra,telangana', 'We serve residential and commercial interior projects across all of Telangana & Andhra Pradesh.', 3),
  (4, 'How much do home interiors cost?', 'price,cost,budget,estimate,rate,bhk', '2BHK full home interiors start around ₹5.6L and 3BHK around ₹8.4L depending on finishes. Use our Price Estimator on the site for an instant quote!', 4);