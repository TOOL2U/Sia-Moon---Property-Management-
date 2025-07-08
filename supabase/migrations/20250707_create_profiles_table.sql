create table if not exists profiles (
  id uuid primary key references auth.users(id),
  email text,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table profiles enable row level security;

create policy "Allow authenticated access" on profiles
  for all
  using (auth.uid() = id);
