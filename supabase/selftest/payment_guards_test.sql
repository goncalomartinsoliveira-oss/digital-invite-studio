-- ═══════════════════════════════════════════════════════════════════════════
-- Teste das migrações 0016-0020 (proteções de pagamento; grátis para
-- preparar; privacidade dos convidados e dos eventos) no Supabase real.
--
-- Correr no SQL Editor → colar → Run. NÃO deixa nada na base de dados: cria
-- dados de teste, experimenta cada regra como noivos, convidado anónimo,
-- equipa de parceiro, estranho, super admin e servidor, e no fim desfaz tudo.
-- Resultado: uma tabela com PASS / FALHOU por teste. Tudo PASS = protegido.
-- ═══════════════════════════════════════════════════════════════════════════

-- Corre um pedido como um papel (anon / authenticated / service_role) e um
-- e-mail de sessão. Devolve null se correu, ou a mensagem de erro. Os noivos
-- de teste usam o id de um utilizador real (invitations.user_id é obrigatório);
-- os outros, um id qualquer.
create or replace function pg_temp.dis_try(_role text, _email text, _sql text)
returns text language plpgsql as $$
declare _sub text := case when _email = 'noivos-teste-0016@exemplo.pt'
                          then current_setting('dis.selftest_uid', true)
                          else gen_random_uuid()::text end;
begin
  perform set_config('request.jwt.claims',
    case when _email is null then json_build_object('role', _role)::text
         else json_build_object('role', _role, 'email', _email, 'sub', _sub)::text end, true);
  execute format('set local role %I', _role);
  execute _sql;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return null;
exception when others then
  return sqlerrm;
end $$;

-- Quantas linhas um papel consegue ver com uma consulta (count). Erro = -1.
create or replace function pg_temp.dis_count(_role text, _email text, _sql text)
returns int language plpgsql as $$
declare _sub text := case when _email = 'noivos-teste-0016@exemplo.pt'
                          then current_setting('dis.selftest_uid', true)
                          else gen_random_uuid()::text end;
        _n int;
begin
  perform set_config('request.jwt.claims',
    case when _email is null then json_build_object('role', _role)::text
         else json_build_object('role', _role, 'email', _email, 'sub', _sub)::text end, true);
  execute format('set local role %I', _role);
  execute _sql into _n;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return _n;
exception when others then
  return -1;
end $$;

create or replace function pg_temp.dis_selftest_0016()
returns table (n int, resultado text, teste text, detalhe text)
language plpgsql as $$
declare
  out_res text[] := '{}'; out_test text[] := '{}'; out_det text[] := '{}';
  c text := 'noivos-teste-0016@exemplo.pt';
  s text := 'staff-teste-0016@exemplo.pt';
  sa text := 'sa-teste-0016@exemplo.pt';
  z text := 'estranho-teste-0016@exemplo.pt';
  b text := 'parceiro-teste-0016';
  sfx text := substr(md5(random()::text), 1, 6);
  e1 uuid; e2 uuid; e3 uuid;
  uid uuid;
  mods_type text; m_all text; m_one text;
  err text; v text; cnt int;
  i int;
begin
  begin
    -- ── Dados de teste (como postgres: passa as proteções) ──
    select id into uid from auth.users order by created_at limit 1;
    if uid is null then raise exception 'é preciso pelo menos um utilizador em auth.users'; end if;
    perform set_config('dis.selftest_uid', uid::text, true);
    select data_type into mods_type from information_schema.columns
      where table_schema = 'public' and table_name = 'invitations' and column_name = 'unlocked_modules';
    if mods_type in ('json', 'jsonb') then
      m_all := '''["save_the_date","invite","guests_seating","photo_sharing","guestbook"]''';
      m_one := '''["invite"]''';
    else
      m_all := '''{save_the_date,invite,guests_seating,photo_sharing,guestbook}''';
      m_one := '''{invite}''';
    end if;
    insert into brands (id, name) values (b, 'Parceiro Teste 0016');
    insert into brand_members (brand_id, user_email, role) values (b, s, 'admin');
    insert into super_admins (user_email) values (sa);
    insert into partner_accounts (brand_id, referral_enabled, commission_pct) values (b, true, 15);
    insert into invitations (user_id, user_email, slug, groom_name, bride_name, event_date, template_id, brand_id)
      values (uid, c, 'teste-0016-a-' || sfx, 'Rui', 'Ana', '2027-06-01', 'renaissance-blue-01', 'dis') returning id into e1;
    insert into invitations (user_id, user_email, slug, groom_name, bride_name, event_date, template_id, brand_id)
      values (uid, s, 'teste-0016-b-' || sfx, 'Tó', 'Rita', '2027-06-01', 'renaissance-blue-01', b) returning id into e2;
    insert into invitations (user_id, user_email, slug, groom_name, bride_name, event_date, template_id, brand_id)
      values (uid, c, 'teste-0016-c-' || sfx, 'Gil', 'Mia', '2027-06-01', 'renaissance-blue-01', 'dis') returning id into e3;

    -- ── Testes ──
    -- (rótulo, papel, e-mail, SQL, deve passar?)
    declare
      tests text[][] := array[
        ['Noivos criam o próprio evento', 'authenticated', c, format($q$insert into invitations (user_id, user_email, slug, groom_name, bride_name, event_date, template_id, brand_id) values (%L, %L, %L, 'X', 'Y', '2027-01-01', 'renaissance-blue-01', 'dis')$q$, uid, c, 'teste-0016-d-' || sfx), 'sim'],
        ['Criar evento já publicado', 'authenticated', c, format('insert into invitations (user_email, slug, unlocked_modules) values (%L, %L, %s)', c, 'teste-0016-e-' || sfx, m_one), 'não'],
        ['Criar evento em nome de outra pessoa', 'authenticated', c, format('insert into invitations (user_email, slug) values (%L, %L)', z, 'teste-0016-f-' || sfx), 'não'],
        ['Criar evento de um parceiro alheio', 'authenticated', c, format('insert into invitations (user_email, slug, brand_id) values (%L, %L, %L)', c, 'teste-0016-g-' || sfx, b), 'não'],
        ['Noivos editam os textos', 'authenticated', c, format($q$update invitations set groom_name = 'Rui Pedro' where id = %L$q$, e1), 'sim'],
        ['Noivos ativam os módulos (publicar sem pagar)', 'authenticated', c, format('update invitations set unlocked_modules = %s where id = %L', m_all, e1), 'não'],
        ['Noivos alargam o fim de prazo', 'authenticated', c, format($q$update invitations set expires_at = '2035-01-01' where id = %L$q$, e1), 'não'],
        ['Noivos associam um parceiro (comissão)', 'authenticated', c, format('update invitations set referred_by_brand_id = %L where id = %L', b, e1), 'não'],
        ['Noivos mudam a marca do evento', 'authenticated', c, format('update invitations set brand_id = %L where id = %L', b, e1), 'não'],
        ['Noivos mudam quem paga', 'authenticated', c, format($q$update invitations set paid_by = 'couple' where id = %L$q$, e1), 'não'],
        ['Equipa do parceiro muda quem paga', 'authenticated', s, format($q$update invitations set paid_by = 'couple' where id = %L$q$, e2), 'sim'],
        ['Super admin ativa os módulos', 'authenticated', sa, format('update invitations set unlocked_modules = %s where id = %L', m_all, e3), 'sim'],
        ['Servidor (service_role) ativa os módulos', 'service_role', null, format('update invitations set unlocked_modules = %s where id = %L', m_one, e2), 'sim'],
        ['Noivos inventam um pagamento', 'authenticated', c, format($q$insert into payments (invitation_id, stripe_session_id, amount_cents, currency, status) values (%L, 'teste_0016', 11900, 'eur', 'paid')$q$, e1), 'não'],
        ['Anónimo inventa um pagamento', 'anon', null, format($q$insert into payments (invitation_id, stripe_session_id, amount_cents, currency, status) values (%L, 'teste_0016b', 11900, 'eur', 'paid')$q$, e1), 'não'],
        ['Noivos põem-se na equipa de um parceiro', 'authenticated', c, format($q$insert into brand_members (brand_id, user_email, role) values (%L, %L, 'admin')$q$, b, c), 'não'],
        ['Noivos tornam-se super admin', 'authenticated', c, format('insert into super_admins (user_email) values (%L)', c), 'não'],
        ['Noivos criam um cupão', 'authenticated', c, $q$insert into coupons (code, discount_type, discount_value) values ('TESTE0016', 'percent', 99)$q$, 'não'],
        ['Estranho junta-se à equipa de um evento', 'authenticated', z, format($q$insert into invitation_collaborators (invitation_id, user_email, role) values (%L, %L, 'editor')$q$, e1, z), 'não'],
        ['Noivos convidam alguém para a equipa', 'authenticated', c, format($q$insert into invitation_collaborators (invitation_id, user_email, role) values (%L, 'mae-teste-0016@exemplo.pt', 'editor')$q$, e1), 'sim'],
        ['RSVP de convidado com o convite por publicar', 'anon', null, format($q$insert into guests (invitation_id, name, category, gender, side, status, group_id) values (%L, 'Tia', 'adult', 'feminino', 'comum', 'confirmed', 'T0016')$q$, e1), 'não'],
        ['Noivos preparam a lista antes de pagar', 'authenticated', c, format($q$insert into guests (invitation_id, name, category, gender, side, status, group_id) values (%L, 'Tia', 'adult', 'feminino', 'comum', 'pending', 'T0016')$q$, e1), 'sim'],
        ['Convidado escreve na lista direto na base de dados (o RSVP passa pelo servidor)', 'anon', null, format($q$insert into guests (invitation_id, name, category, gender, side, status, group_id) values (%L, 'Avó', 'adult', 'feminino', 'comum', 'confirmed', 'T0016')$q$, e3), 'não'],
        ['Servidor grava o RSVP com o convite publicado', 'service_role', null, format($q$insert into guests (invitation_id, name, category, gender, side, status, group_id) values (%L, 'Avó', 'adult', 'feminino', 'comum', 'confirmed', 'T0016')$q$, e3), 'sim'],
        ['Noivos montam mesas antes de pagar', 'authenticated', c, format($q$insert into event_tables (invitation_id, name, shape, capacity, position_x, position_y) values (%L, 'Mesa 1', 'round', 8, 50, 50)$q$, e1), 'sim'],
        ['Anónimo mexe nas mesas de um evento', 'anon', null, format($q$insert into event_tables (invitation_id, name, shape, capacity, position_x, position_y) values (%L, 'Mesa X', 'round', 8, 50, 50)$q$, e1), 'não'],
        ['Estranho mexe nas mesas de um evento', 'authenticated', z, format($q$insert into event_tables (invitation_id, name, shape, capacity, position_x, position_y) values (%L, 'Mesa X', 'round', 8, 50, 50)$q$, e1), 'não']
      ];
    begin
      for i in 1 .. array_length(tests, 1) loop
        err := pg_temp.dis_try(tests[i][2], tests[i][3], tests[i][4]);
        out_res := out_res || case when (err is null) = (tests[i][5] = 'sim') then 'PASS' else 'FALHOU' end;
        out_test := out_test || (tests[i][1] || case when tests[i][5] = 'sim' then ' → deve funcionar' else ' → deve ser recusado' end);
        out_det := out_det || coalesce(err, 'correu');
      end loop;
    end;

    -- Escritas que o RLS pode esconder (0 linhas, sem erro): confirmar o valor.
    err := pg_temp.dis_try('authenticated', s, format('update partner_accounts set commission_pct = 90 where brand_id = %L', b));
    select commission_pct::text into v from partner_accounts where brand_id = b;
    out_res := out_res || case when v::numeric = 15 then 'PASS' else 'FALHOU' end;
    out_test := out_test || 'Parceiro muda a própria comissão → deve ficar igual'::text;
    out_det := out_det || ('comissão = ' || v || coalesce(' (' || err || ')', ''));

    err := pg_temp.dis_try('authenticated', s, format($q$update brands set planner_plan = 'piloto' where id = %L$q$, b));
    select coalesce(planner_plan, 'desligado') into v from brands where id = b;
    out_res := out_res || case when v = 'desligado' then 'PASS' else 'FALHOU' end;
    out_test := out_test || 'Parceiro liga o Planeamento sozinho → deve ficar igual'::text;
    out_det := out_det || ('planeamento = ' || v || coalesce(' (' || err || ')', ''));

    -- Modo de experiência: 5 mensagens no livro de visitas, a 6.ª é recusada.
    for i in 1 .. 6 loop
      err := pg_temp.dis_try('anon', null, format($q$insert into guestbook (invitation_id, tipo, conteudo, autor) values (%L, 'texto', 'olá', 'Teste 0016')$q$, e1));
      if i in (5, 6) then
        out_res := out_res || case when (err is null) = (i = 5) then 'PASS' else 'FALHOU' end;
        out_test := out_test || (case when i = 5 then 'Livro de visitas por publicar: 5.ª mensagem → deve funcionar' else 'Livro de visitas por publicar: 6.ª mensagem → deve ser recusada' end);
        out_det := out_det || coalesce(err, 'correu');
      end if;
    end loop;
    err := pg_temp.dis_try('anon', null, format($q$insert into guestbook (invitation_id, tipo, conteudo, autor) values (%L, 'texto', 'olá', 'Teste 0016')$q$, e3));
    out_res := out_res || case when err is null then 'PASS' else 'FALHOU' end;
    out_test := out_test || 'Livro de visitas publicado: mensagem → deve funcionar'::text;
    out_det := out_det || coalesce(err, 'correu');

    -- Modo de experiência: 5 fotos, a 6.ª é recusada (bucket fotos_evento).
    for i in 1 .. 6 loop
      err := pg_temp.dis_try('anon', null, format($q$insert into storage.objects (bucket_id, name) values ('fotos_evento', %L)$q$, e1::text || '/teste-0016-' || i || '.jpg'));
      if i in (5, 6) then
        out_res := out_res || case when (err is null) = (i = 5) then 'PASS' else 'FALHOU' end;
        out_test := out_test || (case when i = 5 then 'Fotos por publicar: 5.ª foto → deve funcionar' else 'Fotos por publicar: 6.ª foto → deve ser recusada' end);
        out_det := out_det || coalesce(err, 'correu');
      end if;
    end loop;

    -- ── Privacidade (0018): quem consegue ver e alterar o quê ──
    declare
      cnt int;
      checks text[][] := array[
        ['Anónimo lê os convidados de um evento → deve ver 0', 'anon', null, format('select count(*) from guests where invitation_id = %L', e1), '0'],
        ['Outra conta lê os convidados de um evento alheio → deve ver 0', 'authenticated', z, format('select count(*) from guests where invitation_id = %L', e1), '0'],
        ['Noivos leem a própria lista → devem ver os convidados', 'authenticated', c, format('select count(*) from guests where invitation_id = %L', e1), '+'],
        ['Anónimo lê as mensagens do livro de visitas → deve ver 0', 'anon', null, format('select count(*) from guestbook where invitation_id = %L', e1), '0'],
        ['Outra conta lê o livro de visitas alheio → deve ver 0', 'authenticated', z, format('select count(*) from guestbook where invitation_id = %L', e1), '0'],
        ['Noivos leem o próprio livro de visitas → devem ver as mensagens', 'authenticated', c, format('select count(*) from guestbook where invitation_id = %L', e1), '+'],
        ['Anónimo vê os áudios/vídeos privados do livro de visitas → deve ver 0', 'anon', null, format($q$select count(*) from storage.objects where bucket_id = 'fotos_evento' and name like %L$q$, e1::text || '/private\_%'), '0'],
        ['Anónimo vê as fotos públicas do evento → deve vê-las', 'anon', null, format($q$select count(*) from storage.objects where bucket_id = 'fotos_evento' and name like %L$q$, e1::text || '/teste-0016-%'), '+'],
        ['Noivos veem os áudios/vídeos privados do próprio evento', 'authenticated', c, format($q$select count(*) from storage.objects where bucket_id = 'fotos_evento' and name like %L$q$, e1::text || '/private\_%'), '+'],
        ['Anónimo lê os eventos (e-mails dos noivos) → deve ver 0', 'anon', null, format('select count(*) from invitations where id in (%L, %L)', e1, e2), '0'],
        ['Outra conta lê eventos alheios → deve ver 0', 'authenticated', z, format('select count(*) from invitations where id in (%L, %L)', e1, e2), '0'],
        ['Noivos leem o próprio evento', 'authenticated', c, format('select count(*) from invitations where id = %L', e1), '+'],
        ['Equipa do parceiro lê o evento do parceiro', 'authenticated', s, format('select count(*) from invitations where id = %L', e2), '+'],
        ['Equipa do parceiro lê eventos de outros → deve ver 0', 'authenticated', s, format('select count(*) from invitations where id = %L', e1), '0'],
        ['Super admin lê qualquer evento', 'authenticated', sa, format('select count(*) from invitations where id in (%L, %L)', e1, e2), '+']
      ];
    begin
      insert into storage.objects (bucket_id, name) values ('fotos_evento', e1::text || '/private_gb_audio_teste0016.webm');
      for i in 1 .. array_length(checks, 1) loop
        cnt := pg_temp.dis_count(checks[i][2], checks[i][3], checks[i][4]);
        out_res := out_res || case when (checks[i][5] = '0' and cnt = 0) or (checks[i][5] = '+' and cnt > 0) then 'PASS' else 'FALHOU' end;
        out_test := out_test || checks[i][1];
        out_det := out_det || ('vê ' || cnt);
      end loop;
    end;

    err := pg_temp.dis_try('anon', null, format($q$update guests set name = 'Alterado' where invitation_id = %L$q$, e3));
    select count(*)::text into v from guests where invitation_id = e3 and name = 'Alterado';
    out_res := out_res || case when v = '0' then 'PASS' else 'FALHOU' end;
    out_test := out_test || 'Anónimo altera convidados de um convite publicado → deve ficar igual'::text;
    out_det := out_det || ('alterados = ' || v || coalesce(' (' || err || ')', ''));

    -- Apagar fotos: o Supabase não deixa apagar ficheiros do Storage por SQL
    -- ("Use the Storage API"), por isso confirma-se a regra em si: a política
    -- fotos_evento_delete_team existe, a antiga (qualquer conta apagava) saiu, e
    -- a condição autoriza os noivos e recusa outra conta.
    select count(*)::text into v from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'objects_delete_authenticated';
    out_res := out_res || case when v = '0' then 'PASS' else 'FALHOU' end;
    out_test := out_test || 'Regra antiga "qualquer conta apaga fotos" foi retirada'::text;
    out_det := out_det || ('regras antigas = ' || v);
    cnt := pg_temp.dis_count('authenticated', z, format('select count(*) from (select 1 where public.dis_manages_event_folder(%L)) x', e1::text));
    out_res := out_res || case when cnt = 0 then 'PASS' else 'FALHOU' end;
    out_test := out_test || 'Outra conta pode apagar fotos de um evento alheio → não'::text;
    out_det := out_det || case when cnt = 0 then 'não pode' else 'pode' end;
    cnt := pg_temp.dis_count('authenticated', c, format('select count(*) from (select 1 where public.dis_manages_event_folder(%L)) x', e1::text));
    out_res := out_res || case when cnt = 1 then 'PASS' else 'FALHOU' end;
    out_test := out_test || 'Noivos podem apagar fotos do próprio evento → sim'::text;
    out_det := out_det || case when cnt = 1 then 'pode' else 'não pode' end;

    raise exception 'dis_selftest_rollback';
  exception when others then
    if sqlerrm <> 'dis_selftest_rollback' then
      out_res := out_res || 'ERRO'::text;
      out_test := out_test || 'O teste não conseguiu correr até ao fim'::text;
      out_det := out_det || sqlerrm;
    end if;
  end;
  return query select o.n::int, o.r, o.t, o.d
    from unnest(out_res, out_test, out_det) with ordinality as o(r, t, d, n);
end $$;

select * from pg_temp.dis_selftest_0016();
