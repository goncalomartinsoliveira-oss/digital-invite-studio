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

## Marketing / Crescimento
- [x] Melhorar SEO das páginas de marketing — `sitemap.xml` e `robots.txt` dinâmicos (adaptados ao domínio, PT+EN, com as páginas privadas/dashboard bloqueadas), `metadataBase`, e título+descrição próprios por página (home, preços, parceiros, contacto, termos, privacidade, cookies, e cada uma das 5 páginas de funcionalidades)
- [x] Configurar Google Analytics e Google Search Console
- [ ] Sistema de marketing de afiliados para parcerias com associações de wedding planners — decidir entre sistema próprio (reaproveitar a lógica de cupões: código + % de comissão, sem portal nem pagamentos automáticos) ou ferramenta externa (ex.: Rewardful, FirstPromoter — feitas para checkout Stripe, dão portal ao afiliado e pagamento automático via PayPal, mas têm custo mensal)

## Posicionamento & copy (feedback externo, jul/2026)
Prioridade alta — barato, é copy, não código:
- [x] Reposicionar a homepage: comunicar a plataforma toda (site + RSVP + convidados/mesas + fotos + guestbook + canal para wedding planners), não só "convites digitais" — hero reescrito (tag, título e descrição) com o "antes/depois" (conversas dispersas e Excel → tudo num só lugar), sem prometer nada que não existe
- [x] Storytelling "antes/depois" na homepage — secção nova com 5 pares (mensagens dispersas → um link, perguntas repetidas → RSVP, Excel → painel único, fotos espalhadas → galeria automática, recados perdidos → Guestbook)
- [ ] Antes de dar destaque tipo "galeria" aos templates (ver `/deixado para mais tarde`), garantir que há templates suficientes para não parecer pobre — hoje só há 4 de convite e 2 de Save the Date

Para depois do lançamento — direção certa, mas timing errado agora:
- [ ] Funis de marketing separados para casais vs. wedding planners (landing page, copy e CTA próprios cada um — já existe o início disto com `/partners`); vídeos e produção mais pesada ficam para quando já houver tração real
- [ ] Expandir SEO com dezenas de páginas de conteúdo direcionadas a termos específicos (Wedding RSVP, Wedding Seating Chart, Wedding Guest List, Digital Wedding Invitation, etc.) + um centro de recursos/blog — começar por 10–15 páginas bem feitas nos termos mais próximos dos módulos reais, não "centenas" de uma vez (risco de conteúdo fraco penalizado pelo Google)

## Operacional / QA
- [x] Confirmar consistência entre `www.` e domínio sem `www` em todos os links internos (já apanhámos um erro 307 no webhook por causa disto) — auditado; só havia 2 links fixos ao domínio (nos PDFs exportados de convidados/mesas), corrigidos para `www.` diretamente. O resto (checkout, partilha, QR codes) já usa sempre o domínio real de onde o pedido vem, nunca fixo
- [ ] Teste de fumo ponta-a-ponta com uma conta 100% nova, antes de abrir a clientes reais — o fluxo de pagamento (checkout, desbloqueio, email, reembolso) já foi validado em modo real; falta o resto (registo, criação de evento, páginas de convidados)

## Deixado para mais tarde (decisão já tomada, sem urgência)
- [ ] Forma de prolongar um evento além dos 60 dias (pagamento extra para estender o prazo) — a aguardar uso real: ainda não há noção do volume/capacidade do sistema para decidir se vale a pena guardar dados por mais tempo
- [ ] Novos templates de Save the Date
- [ ] Novos templates para os websites de casamento (convite)
- [ ] Save the Date em PDF vetorial (fase 2 — hoje é uma captura raster via html2canvas, a 3x, já com boa qualidade)
- [ ] Eliminação de dados pesados (fotos/guestbook) depois da expiração — a configurar no futuro
- [ ] Fechar mais a RLS das tabelas de convidados ao nível da linha (mover operações sensíveis para funções RPC)
- [ ] Um único link "hub" com todas as ferramentas ativas do evento (photo sharing, guestbook, seating plan, etc.) para os noivos partilharem um só link em vez de vários
- [ ] Menu digital (módulo novo)
