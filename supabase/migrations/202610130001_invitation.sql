-- Entire migration is repeatable through the Supabase CLI migration ledger, not manual table edits.
create extension if not exists pgcrypto with schema extensions;
create table public.invitations (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete restrict,
 config jsonb not null check (jsonb_typeof(config)='object'), version integer not null default 1 check(version>0),
 created_at timestamptz not null default now(), check ((config->>'version')::integer=version)
);
create table public.admin_memberships (
 user_id uuid not null references auth.users(id) on delete cascade,
 invitation_id uuid not null references public.invitations(id) on delete cascade,
 primary key(user_id,invitation_id)
);
create index admin_memberships_invitation on public.admin_memberships(invitation_id);
create table public.invitation_versions (
 invitation_id uuid not null references public.invitations(id) on delete cascade,
 version integer not null check(version>0), config jsonb not null,
 published_at timestamptz not null default now(), primary key(invitation_id,version)
);
create table public.recipient_invites (
 id uuid primary key default gen_random_uuid(), invitation_id uuid not null references public.invitations(id) on delete cascade,
 token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'), expires_at timestamptz, revoked_at timestamptz,
 completed_at timestamptz, created_at timestamptz not null default now(), unique(id,invitation_id)
);
create index recipient_invitation on public.recipient_invites(invitation_id);
create table public.responses (
 id uuid primary key default gen_random_uuid(), recipient_id uuid not null unique,
 invitation_id uuid not null, config_version integer not null, idempotency_key uuid not null,
 content_hash text not null check(content_hash ~ '^[0-9a-f]{64}$'), answer text not null check(answer in ('yes','no')),
 chosen_date date, chosen_time time, message text not null check(length(message)<=5000), snapshot jsonb not null,
 submitted_at timestamptz not null default now(),
 foreign key(recipient_id,invitation_id) references public.recipient_invites(id,invitation_id) on delete restrict,
 foreign key(invitation_id,config_version) references public.invitation_versions(invitation_id,version) on delete restrict,
 unique(invitation_id,idempotency_key),
 check((answer='yes' and chosen_date is not null and chosen_time is not null) or (answer='no' and chosen_date is null and chosen_time is null))
);
create index responses_invitation_submitted on public.responses(invitation_id,submitted_at desc);
create table public.rate_limit_counters (
 key text primary key check(length(key)=64), attempts integer not null check(attempts>0), expires_at timestamptz not null
);
create index rate_limit_expiry on public.rate_limit_counters(expires_at);

alter table public.invitations enable row level security;
alter table public.admin_memberships enable row level security;
alter table public.invitation_versions enable row level security;
alter table public.recipient_invites enable row level security;
alter table public.responses enable row level security;
alter table public.rate_limit_counters enable row level security;
-- No anonymous policy and no anonymous grants: all recipient access goes through the server.
revoke all on public.invitations,public.admin_memberships,public.invitation_versions,public.recipient_invites,public.responses,public.rate_limit_counters from anon,authenticated;
grant select on public.admin_memberships,public.invitations,public.invitation_versions,public.recipient_invites,public.responses to authenticated;
grant insert on public.recipient_invites to authenticated;
grant update(revoked_at) on public.recipient_invites to authenticated;
grant delete on public.responses to authenticated;
grant all on public.invitations,public.admin_memberships,public.invitation_versions,public.recipient_invites,public.responses,public.rate_limit_counters to service_role;
create policy membership_self on public.admin_memberships for select to authenticated using(user_id=(select auth.uid()));
create function public.owns_invitation(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.admin_memberships m where m.invitation_id=p_id and m.user_id=(select auth.uid()));
$$;
revoke all on function public.owns_invitation(uuid) from public,anon;
grant execute on function public.owns_invitation(uuid) to authenticated;
create policy invitation_owner_read on public.invitations for select to authenticated using(public.owns_invitation(id));
create policy versions_owner_read on public.invitation_versions for select to authenticated using(public.owns_invitation(invitation_id));
create policy recipient_owner_read on public.recipient_invites for select to authenticated using(public.owns_invitation(invitation_id));
create policy recipient_owner_create on public.recipient_invites for insert to authenticated with check(public.owns_invitation(invitation_id) and completed_at is null and revoked_at is null);
create policy recipient_owner_revoke on public.recipient_invites for update to authenticated using(public.owns_invitation(invitation_id)) with check(public.owns_invitation(invitation_id));
create policy response_owner_read on public.responses for select to authenticated using(public.owns_invitation(invitation_id));
create policy response_owner_delete on public.responses for delete to authenticated using(public.owns_invitation(invitation_id));

create function public.consume_rate_limit(p_key text,p_limit integer,p_seconds integer) returns boolean language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 if p_limit<1 or p_limit>1000 or p_seconds<1 or p_seconds>86400 or length(p_key)<>64 then raise exception 'INVALID_RATE_POLICY'; end if;
 delete from public.rate_limit_counters where expires_at < now();
 insert into public.rate_limit_counters(key,attempts,expires_at) values(p_key,1,now()+make_interval(secs=>p_seconds))
 on conflict(key) do update set attempts=public.rate_limit_counters.attempts+1 returning attempts into n;
 return n<=p_limit;
end $$;
revoke all on function public.consume_rate_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.consume_rate_limit(text,integer,integer) to service_role;

create function public.publish_invitation_config(p_invitation uuid,p_expected_version integer,p_config jsonb,p_actor uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare current_version integer; next_config jsonb;
begin
 if not exists(select 1 from public.admin_memberships where invitation_id=p_invitation and user_id=p_actor) then raise exception 'FORBIDDEN'; end if;
 select version into current_version from public.invitations where id=p_invitation for update;
 if current_version is null then raise exception 'NOT_FOUND'; end if;
 if current_version<>p_expected_version then raise exception 'CONFIG_CHANGED'; end if;
 if jsonb_typeof(p_config)<>'object' then raise exception 'INVALID_CONFIG'; end if;
 next_config=jsonb_set(p_config,'{version}',to_jsonb(current_version+1));
 insert into public.invitation_versions(invitation_id,version,config) values(p_invitation,current_version+1,next_config);
 update public.invitations set version=current_version+1,config=next_config where id=p_invitation;
 return next_config;
end $$;
revoke all on function public.publish_invitation_config(uuid,integer,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.publish_invitation_config(uuid,integer,jsonb,uuid) to service_role;

create function public.save_invitation_response(p_recipient uuid,p_invitation uuid,p_version integer,p_key uuid,p_hash text,p_answer text,p_date date,p_time time,p_message text,p_selections jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare recipient public.recipient_invites; old_response public.responses; config jsonb; current_version integer; response_id uuid; submitted timestamptz; result jsonb; local_time timestamp;
begin
 -- Lock configuration first, then recipient: consistent order serializes config edits and concurrent saves.
 select i.config,i.version into config,current_version from public.invitations i where id=p_invitation for update;
 select * into recipient from public.recipient_invites where id=p_recipient and invitation_id=p_invitation for update;
 if recipient.id is null or recipient.revoked_at is not null or (recipient.expires_at is not null and recipient.expires_at<=now()) then raise exception 'INVALID_RECIPIENT'; end if;
 select * into old_response from public.responses where recipient_id=p_recipient;
 if old_response.id is not null then
   if old_response.content_hash=p_hash then return old_response.snapshot; else raise exception 'ALREADY_SUBMITTED'; end if;
 end if;
 if recipient.completed_at is not null then raise exception 'CLOSED'; end if;
 if current_version<>p_version then raise exception 'CONFIG_CHANGED'; end if;
 if p_answer not in ('yes','no') or length(p_message)>coalesce((config->>'messageMaxLength')::integer,1000) or jsonb_typeof(p_selections)<>'array' then raise exception 'INVALID_INPUT'; end if;
 if p_answer='no' and (p_date is not null or p_time is not null) then raise exception 'INVALID_INPUT'; end if;
 if p_answer='yes' then
   local_time=now() at time zone (config->>'timezone');
   if p_date is null or p_time is null or p_date+p_time<=local_time or ((config->>'minDate') is not null and p_date<(config->>'minDate')::date) or ((config->>'maxDate') is not null and p_date>(config->>'maxDate')::date) then raise exception 'INVALID_INPUT'; end if;
   if not exists(select 1 from jsonb_array_elements(config->'timeSlots') s where (s->>'time')::time=p_time) then raise exception 'INVALID_INPUT'; end if;
 end if;
 response_id=gen_random_uuid();submitted=now();
 result=jsonb_build_object('id',response_id,'invitationId',p_invitation,'answer',p_answer,'chosenDate',p_date,'chosenTime',case when p_time is null then null else left(p_time::text,5) end,'timezone',config->>'timezone','selections',p_selections,'message',p_message,'submittedAt',submitted,'configVersion',p_version);
 insert into public.responses(id,recipient_id,invitation_id,config_version,idempotency_key,content_hash,answer,chosen_date,chosen_time,message,snapshot,submitted_at) values(response_id,p_recipient,p_invitation,p_version,p_key,p_hash,p_answer,p_date,p_time,p_message,result,submitted);
 update public.recipient_invites set completed_at=submitted where id=p_recipient;
 return result;
end $$;
revoke all on function public.save_invitation_response(uuid,uuid,integer,uuid,text,text,date,time,text,jsonb) from public,anon,authenticated;
grant execute on function public.save_invitation_response(uuid,uuid,integer,uuid,text,text,date,time,text,jsonb) to service_role;
