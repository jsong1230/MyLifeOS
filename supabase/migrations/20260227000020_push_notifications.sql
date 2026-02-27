-- Push notification subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Notification settings per user
CREATE TABLE public.notification_settings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  enabled BOOLEAN DEFAULT TRUE,
  routine_reminders BOOLEAN DEFAULT TRUE,
  recurring_reminders BOOLEAN DEFAULT TRUE,
  goal_reminders BOOLEAN DEFAULT TRUE,
  reminder_time TIME DEFAULT '09:00:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own subscriptions" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notification settings" ON public.notification_settings FOR ALL USING (auth.uid() = user_id);

-- Index
CREATE INDEX push_subscriptions_user_id_idx ON public.push_subscriptions(user_id);
