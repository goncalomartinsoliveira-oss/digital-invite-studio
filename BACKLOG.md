# Backlog — Digital Invite Studio

Lista de tarefas identificadas mas ainda não desenvolvidas. Não está por ordem de prioridade — é só um registo para irmos revendo e completando aos poucos, quando pedir para avançar com algum item.

## Antes de vender a sério
- [x] Rever/substituir os depoimentos e números fictícios da homepage (testemunhos, "500+ Casamentos Criados", "12 Países", "98% Satisfação", etc.)
- [x] Rever o conteúdo de `/terms` e `/privacy` para refletir o modelo atual (módulos, pagamentos, expiração de 60 dias após o evento) — rascunho técnico, recomenda-se revisão jurídica antes de assumir como vinculativo
- [x] Definir e publicar uma política de reembolso/cancelamento (14 dias, caso a caso)
- [ ] Passar o Stripe para modo real (chaves live + webhook live, confirmar Business Profile)

## Comunicação
- [ ] Configurar um email profissional para a empresa
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
- [ ] Forma de prolongar um evento além dos 60 dias (pagamento extra para estender o prazo)
- [x] Onboarding/tour guiado para contas novas
- [x] Painel "Negócio" para super-admin: receita total/mensal, contas ativas e receita por parceiro
- [x] QR code/link de RSVP standalone (`/rsvp/[slug]`) para convites físicos, independente do módulo Convite

## Marketing / Crescimento
- [ ] Melhorar SEO das páginas de marketing (meta tags, sitemap, etc.)
- [ ] Configurar Google Analytics e Google Search Console
- [ ] Sistema de marketing de afiliados para parcerias com associações de wedding planners — decidir entre sistema próprio (reaproveitar a lógica de cupões: código + % de comissão, sem portal nem pagamentos automáticos) ou ferramenta externa (ex.: Rewardful, FirstPromoter — feitas para checkout Stripe, dão portal ao afiliado e pagamento automático via PayPal, mas têm custo mensal)

## Operacional / QA
- [x] Confirmar consistência entre `www.` e domínio sem `www` em todos os links internos (já apanhámos um erro 307 no webhook por causa disto) — auditado; só havia 2 links fixos ao domínio (nos PDFs exportados de convidados/mesas), corrigidos para `www.` diretamente. O resto (checkout, partilha, QR codes) já usa sempre o domínio real de onde o pedido vem, nunca fixo
- [ ] Teste de fumo ponta-a-ponta com uma conta 100% nova, antes de abrir a clientes reais

## Deixado para mais tarde (decisão já tomada, sem urgência)
- [ ] Novos templates de Save the Date
- [ ] Novos templates para os websites de casamento (convite)
- [ ] Save the Date em PDF vetorial (fase 2 — hoje é uma captura raster via html2canvas, a 3x, já com boa qualidade)
- [ ] Eliminação de dados pesados (fotos/guestbook) depois da expiração — a configurar no futuro
- [ ] Fechar mais a RLS das tabelas de convidados ao nível da linha (mover operações sensíveis para funções RPC)
