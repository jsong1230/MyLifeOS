-- handle_new_user(): auth.users 신규 삽입 시 public.users 자동 생성
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, created_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- 트리거 등록
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
