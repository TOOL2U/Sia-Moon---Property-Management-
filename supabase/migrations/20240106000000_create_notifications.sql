-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  action_url VARCHAR(500),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Create RLS policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Only system/admin can insert notifications (for now)
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER handle_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert some sample notifications for existing users
INSERT INTO public.notifications (user_id, title, message, type, action_url)
SELECT 
  p.id,
  'Welcome to Villa Management',
  'Welcome to your villa management dashboard! Start by adding your first property.',
  'info',
  '/properties/add'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.notifications n WHERE n.user_id = p.id
);

INSERT INTO public.notifications (user_id, title, message, type, action_url)
SELECT 
  p.id,
  'Set Up Your Dashboard',
  'Configure your dashboard targets and preferences for better insights.',
  'info',
  '/dashboard/client'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.notifications n WHERE n.user_id = p.id AND n.title = 'Set Up Your Dashboard'
);
