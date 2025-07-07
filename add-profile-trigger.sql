-- Add trigger to automatically create a profile when a user signs up

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'client')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to execute the function after a new user is created
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Verify the trigger was created
select * from pg_triggers where tgname = 'on_auth_user_created';

-- Note: Run this script in the Supabase SQL Editor to add the trigger
-- This will ensure that profiles are automatically created when users sign up
