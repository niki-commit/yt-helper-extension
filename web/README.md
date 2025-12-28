# Prisma commands to setup schema in supabase DB

```bash
npx prisma generate
npx prisma db push
```

or in local development

```bash
npx prisma generate
npx prisma migrate dev --name init
```

# SQL to sync auth.users to profiles which should be run in sql editor of supabase

-- Create a function for smart synchronization (handles inserts and updates)
create or replace function public.handle_user_sync()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
insert into public.profiles (id, email, full_name, avatar_url)
values (
new.id,
new.email,
new.raw_user_meta_data->>'full_name',
new.raw_user_meta_data->>'avatar_url'
)
on conflict (id) do update
set
email = excluded.email,
full_name = excluded.full_name,
avatar_url = excluded.avatar_url;
return new;
end;

$$
;

-- Trigger the function every time a user is created OR updated
create or replace trigger on_auth_user_sync
  after insert or update on auth.users
  for each row execute procedure public.handle_user_sync();
$$
