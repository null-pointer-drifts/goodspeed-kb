-- Enable RLS on documents table
alter table documents enable row level security;

-- Enable RLS on document_chunks table
alter table document_chunks enable row level security;

-- Documents: users can only see/modify their own documents
create policy "Users can select their own documents"
  on documents for select
  using (user_id = auth.uid()::text);

create policy "Users can insert their own documents"
  on documents for insert
  with check (user_id = auth.uid()::text);

create policy "Users can update their own documents"
  on documents for update
  using (user_id = auth.uid()::text);

create policy "Users can delete their own documents"
  on documents for delete
  using (user_id = auth.uid()::text);

-- Document chunks: inherit access from parent document
create policy "Users can select chunks of their own documents"
  on document_chunks for select
  using (
    exists (
      select 1 from documents d
      where d.id = document_chunks.document_id
        and d.user_id = auth.uid()::text
    )
  );

create policy "Users can insert chunks for their own documents"
  on document_chunks for insert
  with check (
    exists (
      select 1 from documents d
      where d.id = document_chunks.document_id
        and d.user_id = auth.uid()::text
    )
  );

create policy "Users can delete chunks of their own documents"
  on document_chunks for delete
  using (
    exists (
      select 1 from documents d
      where d.id = document_chunks.document_id
        and d.user_id = auth.uid()::text
    )
  );

-- Service role bypasses RLS by default — no changes needed for backend operations
