-- Run ONLY against a disposable local Supabase database. Everything rolls back.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id,email) values ('a0000000-0000-4000-8000-000000000001','owner-test@example.invalid'),('a0000000-0000-4000-8000-000000000002','outsider-test@example.invalid');
insert into public.invitations(id,owner_id,config) values('b0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','{"version":1,"timezone":"Asia/Dhaka","messageMaxLength":1000,"minDate":null,"maxDate":null,"timeSlots":[{"id":"evening","time":"19:00","label":"Evening"}],"questions":[]}');
insert into public.admin_memberships values('a0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001');
insert into public.invitation_versions(invitation_id,version,config) select id,version,config from public.invitations where id='b0000000-0000-4000-8000-000000000001';
insert into public.recipient_invites(id,invitation_id,token_hash) values('c0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001',repeat('a',64));
set local role anon;
do $$begin
 begin perform * from public.responses; raise exception 'FAIL: anonymous response read allowed'; exception when insufficient_privilege then null; end;
 begin perform public.save_invitation_response('c0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001',1,gen_random_uuid(),repeat('f',64),'no',null,null,'','[]'); raise exception 'FAIL: anonymous save RPC allowed'; exception when insufficient_privilege then null; end;
end$$;
reset role;
set local request.jwt.claim.sub='a0000000-0000-4000-8000-000000000002';
set local role authenticated;
do $$begin
 if exists(select 1 from public.invitations where id='b0000000-0000-4000-8000-000000000001') then raise exception 'FAIL: outsider invitation read';end if;
 if exists(select 1 from public.admin_memberships where invitation_id='b0000000-0000-4000-8000-000000000001') then raise exception 'FAIL: outsider membership read';end if;
 begin perform public.publish_invitation_config('b0000000-0000-4000-8000-000000000001',1,'{}','a0000000-0000-4000-8000-000000000001');raise exception 'FAIL: direct publish RPC';exception when insufficient_privilege then null;end;
 begin insert into public.admin_memberships values('a0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000001'); raise exception 'FAIL: self promotion'; exception when insufficient_privilege then null;end;
 begin perform public.save_invitation_response('c0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001',1,gen_random_uuid(),repeat('f',64),'no',null,null,'','[]'); raise exception 'FAIL: authenticated save RPC allowed'; exception when insufficient_privilege then null;end;
end$$;
reset role;
set local role service_role;
do $$begin
 begin perform public.publish_invitation_config('b0000000-0000-4000-8000-000000000001',1,'{}','a0000000-0000-4000-8000-000000000002');raise exception 'FAIL: outsider service publication';exception when raise_exception then if sqlerrm<>'FORBIDDEN' then raise;end if;end;
 begin perform public.save_invitation_response('c0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001',2,gen_random_uuid(),repeat('f',64),'no',null,null,'','[]');raise exception 'FAIL: stale configuration';exception when raise_exception then if sqlerrm<>'CONFIG_CHANGED' then raise;end if;end;
 begin perform public.save_invitation_response('c0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001',1,gen_random_uuid(),repeat('f',64),'yes','2000-01-01','19:00','','[]');raise exception 'FAIL: past date';exception when raise_exception then if sqlerrm<>'INVALID_INPUT' then raise;end if;end;
 if exists(select 1 from public.responses where recipient_id='c0000000-0000-4000-8000-000000000001') or (select completed_at from public.recipient_invites where id='c0000000-0000-4000-8000-000000000001') is not null then raise exception 'FAIL: invalid submission partially persisted';end if;
end$$;
select public.save_invitation_response('c0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001',1,'d0000000-0000-4000-8000-000000000001',repeat('f',64),'no',null,null,'hello','[]');
-- Same content, different device/key: one receipt only.
select public.save_invitation_response('c0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001',1,'d0000000-0000-4000-8000-000000000002',repeat('f',64),'no',null,null,'hello','[]');
do $$begin
 if (select count(*) from public.responses where recipient_id='c0000000-0000-4000-8000-000000000001')<>1 then raise exception 'FAIL: duplicate responses';end if;
 begin perform public.save_invitation_response('c0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001',1,gen_random_uuid(),repeat('e',64),'no',null,null,'different','[]');raise exception 'FAIL: changed retry';exception when raise_exception then if sqlerrm<>'ALREADY_SUBMITTED' then raise;end if;end;
 if not public.consume_rate_limit(repeat('c',64),1,900) then raise exception 'FAIL: first limit call';end if;
 if public.consume_rate_limit(repeat('c',64),1,900) then raise exception 'FAIL: rate limit bypass';end if;
end$$;
reset role;
set local request.jwt.claim.sub='a0000000-0000-4000-8000-000000000002';
set local role authenticated;
do $$begin
 if exists(select 1 from public.responses) then raise exception 'FAIL: outsider response read';end if;
 delete from public.responses where recipient_id='c0000000-0000-4000-8000-000000000001';
end$$;
reset role;
set local request.jwt.claim.sub='a0000000-0000-4000-8000-000000000001';
set local role authenticated;
do $$begin
 if (select count(*) from public.responses where recipient_id='c0000000-0000-4000-8000-000000000001')<>1 then raise exception 'FAIL: owner read or outsider delete';end if;
 delete from public.responses where recipient_id='c0000000-0000-4000-8000-000000000001';
end$$;
reset role;
set local role service_role;
do $$begin
 if (select completed_at from public.recipient_invites where id='c0000000-0000-4000-8000-000000000001') is null then raise exception 'FAIL: deletion reopened recipient';end if;
 begin perform public.save_invitation_response('c0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001',1,gen_random_uuid(),repeat('f',64),'no',null,null,'hello','[]');raise exception 'FAIL: deleted invitation reopened';exception when raise_exception then if sqlerrm<>'CLOSED' then raise;end if;end;
end$$;
reset role;
rollback;
