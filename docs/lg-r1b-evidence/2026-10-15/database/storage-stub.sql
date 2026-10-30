-- SYNTHETIC API operation context, not real Supabase Storage implementation.
CREATE FUNCTION storage.allow_any_operation(text[]) RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT COALESCE(current_setting('request.storage_operation',true)=ANY($1),false) $$; GRANT EXECUTE ON FUNCTION storage.allow_any_operation(text[]) TO anon,authenticated;
