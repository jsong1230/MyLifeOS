CREATE TABLE health_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('blood_pressure', 'blood_sugar', 'body_temp')),
  value NUMERIC NOT NULL,          -- 혈압: 수축기(mmHg), 혈당: mg/dL, 체온: °C
  value2 NUMERIC,                   -- 혈압 이완기(mmHg)만 사용
  unit TEXT NOT NULL,              -- 'mmHg', 'mg/dL', '°C'
  measured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_health_measurements_user_type ON health_measurements(user_id, type);
CREATE INDEX idx_health_measurements_measured_at ON health_measurements(user_id, measured_at DESC);

ALTER TABLE health_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own health_measurements"
  ON health_measurements FOR ALL USING (auth.uid() = user_id);
