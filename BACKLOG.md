# Backlog — Digital Invite Studio

Lista de tarefas identificadas mas ainda não desenvolvidas. Não está por ordem de prioridade — é só um registo para irmos revendo e completando aos poucos, quando pedir para avançar com algum item.

## Antes de vender a sério
- [x] Rever/substituir os depoimentos e números fictícios da homepage (testemunhos, "500+ Casamentos Criados", "12 Países", "98% Satisfação", etc.)
- [x] Rever o conteúdo de `/terms` e `/privacy` para refletir o modelo atual (módulos, pagamentos, expiração de 60 dias após o evento) — rascunho técnico, recomenda-se revisão jurídica antes de assumir como vinculativo
- [x] Definir e publicar uma política de reembolso/cancelamento (14 dias, caso a caso)
- [x] Passar o Stripe para modo real (chaves live + webhook live, confirmar Business Profile) — testado com compra real (Save the Date) + reembolso, tudo a funcionar (desbloqueio, email de confirmação, histórico, revogação por reembolso)

## Comunicação
- [x] Configurar um email profissional para a empresa — hello@digitalinvitestudio.com, via Zoho Mail
- [x] Emails de confirmação de compra (recibo automático depois de um pagamento) — via Resend, disparado no webhook do Stripe
- [ ] Ativar o WhatsApp Business no número da empresa, **+351 927 367 622** — o número já está publicado em `/contact` como contacto telefónico clicável; assim que a conta Business estiver ativa, trocar esse bloco para WhatsApp (`https://wa.me/351927367622` + rótulo `channels.whatsapp`, que já existe nos dicionários) e repor "WhatsApp" na descrição SEO em `app/[locale]/contact/layout.tsx`. Atendimento manual para começar; automático por IA (WhatsApp Business API + Claude API) fica para quando houver volume que o justifique

## Pagamentos
- [x] Lidar com reembolsos no webhook (hoje só trata `checkout.session.completed`; um reembolso no Stripe não revoga o módulo)
- [x] Página no dashboard para o casal ver o histórico das suas compras (a tabela `payments` já existe, falta a interface)
- [x] Preços diferenciados por parceiro/marca (hoje o checkout usa sempre a mesma tabela de preços global, `lib/pricing.ts`)
- [x] Sistema de cupões/códigos promocionais
- [x] Rever o desconto do "Pacote Convite" (ficou muito pequeno, ~5€, depois do preço do Convite subir para 79€) — baixado de 89€ para 75€ (poupança de 19€, ~20%)
- [x] Checkout self-service desligado para eventos de parceiros — casal só vê "contacte o seu parceiro", sem preços; desbloqueio continua manual (super-admin), com opção de registar o valor pago pelo parceiro para a receita ficar correta no painel "Negócio"
- [x] `/pricing` e `/partners` escondidas (redirecionam para a home) em domínios de parceiros white label — esse conteúdo é só da DIS

## Produto
- [x] Onboarding/tour guiado para contas novas
- [x] Painel "Negócio" para super-admin: receita total/mensal, contas ativas e receita por parceiro
- [x] QR code/link de RSVP standalone (`/rsvp/[slug]`) para convites físicos, independente do módulo Convite

## Módulo Wedding Planner (B2B — piloto, ago/2026)
Documento de estratégia: https://claude.ai/code/artifact/af5b0757-a3b7-470e-9b82-48957f6df006
- [x] Fase 0 — área "Gestão" no painel do evento: orçamento (custos por fornecedor, IVA por linha, marcos de pagamento) e tarefas (prazos relativos à data do casamento, privadas ou partilhadas com o casal). Ligado por `brands.planner_plan`, ativado à mão pelo super-admin em Parceiros
- [ ] **Correr `supabase/migrations/0001_planner_module.sql` no Supabase** — sem isto a área de Gestão não funciona
- [ ] Testar com as 2 agências piloto durante um ciclo real (6-8 semanas). A pergunta não é "gostam?", é "deixaram de abrir o Excel?"
- [x] Fase 1a — vista de conjunto "Esta Semana": tarefas e pagamentos vencidos/a 30 dias, de todos os eventos ativos da agência, num só ecrã (`AgencyOverviewView`, botão novo no painel de eventos, só visível a contas com `planner_plan`)
- [x] Prioridade nas tarefas (baixa/normal/alta) e estado do contrato por fornecedor (a orçar/orçamento pedido/em negociação/contratado/cancelado, por linha de custo — não por fornecedor, porque o mesmo fornecedor pode ter estados diferentes em casamentos diferentes) + histórico de notas/reuniões por linha de custo, sempre privado da agência — comparação com um concorrente direto ao casal (WedPal) mostrou que eram expectativa mínima
- [ ] Fase 1b — documentos/contratos por evento e por fornecedor, histórico de preços por fornecedor entre casamentos
- [ ] Fase 2 — linhas de custo por pessoa ligadas aos confirmados ao vivo, resumo de alergias para o catering, cronograma do dia com exportação PDF, link de leitura para fornecedores
- [ ] Fase 3 — subscrições Stripe (não existe nada hoje: todo o checkout é pagamento único), vagas, desbloqueio automático das licenças, templates de checklist, planta do salão
- [ ] Decidir preços antes da primeira conversa com as agências (proposta no documento: Solo 39€, Profissional 89€, Agência 169€/mês, anual com 2 meses grátis)

## Marketing / Crescimento
- [x] Melhorar SEO das páginas de marketing — `sitemap.xml` e `robots.txt` dinâmicos (adaptados ao domínio, PT+EN, com as páginas privadas/dashboard bloqueadas), `metadataBase`, e título+descrição próprios por página (home, preços, parceiros, contacto, termos, privacidade, cookies, e cada uma das 5 páginas de funcionalidades)
- [x] Configurar Google Analytics e Google Search Console
- [ ] Sistema de marketing de afiliados para parcerias com associações de wedding planners — decidir entre sistema próprio (reaproveitar a lógica de cupões: código + % de comissão, sem portal nem pagamentos automáticos) ou ferramenta externa (ex.: Rewardful, FirstPromoter — feitas para checkout Stripe, dão portal ao afiliado e pagamento automático via PayPal, mas têm custo mensal)
- [ ] Instalar o Meta Pixel (hoje só há Google Analytics 4 — GA4 mede, mas não alimenta a otimização de anúncios do Meta). Pré-requisito antes de correr qualquer campanha paga no Instagram/Facebook, incluindo os testes localizados por país referidos abaixo; idealmente com Conversions API também, mais fiável com bloqueadores de anúncios

## Internacionalização (discussão jul/2026)
- [ ] Adicionar espanhol ao site — decisão: **não traduzir a plataforma toda já**. Cada dicionário tem ~1550 linhas e 27 ficheiros assumem hoje exatamente o par pt/en; duplicar para 4 idiomas multiplica o custo de manutenção de qualquer alteração futura (só nesta sessão os dicionários foram editados 6-7 vezes). Faseado: (1) uma única landing page dedicada em espanhol para correr anúncios localizados a Espanha e validar se há procura, (2) só se houver sinal real (CPC viável, gente a chegar ao checkout), traduzir a plataforma toda. Espanha antes de França (proximidade, custos de media, e abre depois LatAm/mercado hispânico dos EUA — francês não abre mais nada além de França)
- [ ] Conteúdo de redes sociais em inglês (não em português) — decisão já tomada: o inglês em Portugal é alto, por isso conteúdo inglês funciona nos dois lados (mercado atual + opção internacional), enquanto conteúdo português não viaja. Distinguir sempre língua de conteúdo (redes: inglês) de língua de conversão (anúncios/apoio dirigidos a Portugal: português)

## Posicionamento & copy (feedback externo, jul/2026)
Prioridade alta — barato, é copy, não código:
- [x] Reposicionar a homepage: comunicar a plataforma toda (site + RSVP + convidados/mesas + fotos + guestbook + canal para wedding planners), não só "convites digitais" — hero reescrito (tag, título e descrição) com o "antes/depois" (conversas dispersas e Excel → tudo num só lugar), sem prometer nada que não existe
- [x] Storytelling "antes/depois" na homepage — secção nova com 5 pares (mensagens dispersas → um link, perguntas repetidas → RSVP, Excel → painel único, fotos espalhadas → galeria automática, recados perdidos → Guestbook)
- [x] Antes de dar destaque tipo "galeria" aos templates, garantir que há templates suficientes para não parecer pobre — resolvido: 6 de convite (Luxury, Minimal, Collage, Clássico, Editorial Noir, Romântico) e 4 de Save the Date (Arco Dourado, Moldura Preta, Linhas Clássicas, Tipográfico Bordô)

Para depois do lançamento — direção certa, mas timing errado agora:
- [ ] Funis de marketing separados para casais vs. wedding planners (landing page, copy e CTA próprios cada um — já existe o início disto com `/partners`); vídeos e produção mais pesada ficam para quando já houver tração real
- [ ] Expandir SEO com dezenas de páginas de conteúdo direcionadas a termos específicos (Wedding RSVP, Wedding Seating Chart, Wedding Guest List, Digital Wedding Invitation, etc.) + um centro de recursos/blog — começar por 10–15 páginas bem feitas nos termos mais próximos dos módulos reais, não "centenas" de uma vez (risco de conteúdo fraco penalizado pelo Google)

## Operacional / QA
- [x] Confirmar consistência entre `www.` e domínio sem `www` em todos os links internos (já apanhámos um erro 307 no webhook por causa disto) — auditado; só havia 2 links fixos ao domínio (nos PDFs exportados de convidados/mesas), corrigidos para `www.` diretamente. O resto (checkout, partilha, QR codes) já usa sempre o domínio real de onde o pedido vem, nunca fixo
- [ ] Teste de fumo ponta-a-ponta com uma conta 100% nova, antes de abrir a clientes reais — o fluxo de pagamento (checkout, desbloqueio, email, reembolso) já foi validado em modo real; falta o resto (registo, criação de evento, páginas de convidados)

## Deixado para mais tarde (decisão já tomada, sem urgência)
- [ ] Forma de prolongar um evento além dos 60 dias (pagamento extra para estender o prazo) — a aguardar uso real: ainda não há noção do volume/capacidade do sistema para decidir se vale a pena guardar dados por mais tempo
- [x] Novos templates de Save the Date — Linhas Clássicas e Tipográfico Bordô, mais reposicionamento/zoom da foto e correção do enquadramento na Moldura Preta e no Arco Dourado
- [x] Novos templates para os websites de casamento (convite) — Clássico, Editorial Noir e Romântico, com seletor de cor de destaque próprio
- [ ] Save the Date em PDF vetorial (fase 2 — hoje é uma captura raster via html2canvas, a 3x, já com boa qualidade)
- [ ] Eliminação de dados pesados (fotos/guestbook) depois da expiração — a configurar no futuro
- [ ] Fechar mais a RLS das tabelas de convidados ao nível da linha (mover operações sensíveis para funções RPC)
- [ ] Um único link "hub" com todas as ferramentas ativas do evento (photo sharing, guestbook, seating plan, etc.) para os noivos partilharem um só link em vez de vários
- [ ] Menu digital (módulo novo)
