create policy "Admin can insert products"
  on public.products for insert
  with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'om07674@gmail.com'
  );

create policy "Admin can update products"
  on public.products for update
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'om07674@gmail.com'
  )
  with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'om07674@gmail.com'
  );

create policy "Admin can delete products"
  on public.products for delete
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'om07674@gmail.com'
  );
