alter table public.articles
  add column if not exists rating integer not null default 5;

update public.articles
set rating = 5
where rating is null;

alter table public.articles
  drop constraint if exists articles_rating_range;

alter table public.articles
  add constraint articles_rating_range
  check (rating >= 0 and rating <= 10);
