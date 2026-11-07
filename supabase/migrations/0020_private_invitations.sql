-- ═══════════════════════════════════════════════════════════════════════════
-- Privacidade: a tabela invitations deixa de ser pública
--
-- Correr no Supabase: SQL Editor → colar → Run. É seguro correr mais do que
-- uma vez. Assume 0018 aplicada (usa dis_reads_event) e o deploy do código que
-- acompanha esta migração (api/public-event, api/slug-available e a página do
-- convite a ler pelo servidor): sem ele, as páginas públicas deixam de
-- encontrar o evento.
--
-- Antes havia três regras que deixavam qualquer pessoa, só com a chave pública
-- do site, ler TODOS os eventos com TODAS as colunas: e-mail dos noivos,
-- conteúdo de convites por publicar ou com código de acesso, orçamento, quem
-- paga, parceiro que recomendou.
--
-- Agora: só a equipa de cada evento lê o seu registo (dono, colaboradores,
-- agência, super admin). As páginas públicas pedem ao servidor só o que
-- precisam (lib/publicEvent.ts). As regras de escrita não mudam.
-- ═══════════════════════════════════════════════════════════════════════════

drop policy if exists "Convites são públicos para leitura" on public.invitations;
drop policy if exists "Permitir leitura pública de convites" on public.invitations;
drop policy if exists inv_select on public.invitations;

drop policy if exists inv_team_select on public.invitations;
create policy inv_team_select on public.invitations
  for select to authenticated
  using (public.dis_reads_event(id));

-- As funções antigas usadas pelas regras de outras tabelas (fim de prazo,
-- módulos, gestão) leem invitations. Se corressem com as permissões de quem
-- chama, um convidado anónimo deixaria de ver o evento e, por exemplo, não
-- conseguiria enviar fotos nem mensagens. Passam a correr com as permissões
-- do dono da função (como se a tabela ainda fosse legível para elas).
do $$
declare f text;
begin
  foreach f in array array[
    'public.is_invitation_active(text)',
    'public.is_module_unlocked(text, text)',
    'public.is_invitation_manager(text)',
    'public.is_super_admin()'
  ] loop
    if to_regprocedure(f) is not null then
      execute format('alter function %s security definer set search_path = public', f);
    end if;
  end loop;
end $$;
