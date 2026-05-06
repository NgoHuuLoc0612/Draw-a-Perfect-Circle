CREATE TABLE scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  score numeric(6,2) NOT NULL,
  grade text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous reads" ON scores FOR SELECT USING (true);
CREATE POLICY "Allow anonymous inserts" ON scores FOR INSERT WITH CHECK (true);