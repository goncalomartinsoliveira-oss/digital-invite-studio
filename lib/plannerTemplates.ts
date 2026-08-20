import type { CostPricingMode, TaskPriority, TaskResponsible } from "@/lib/planner";

// Pontos de partida para um casamento novo.
//
// Sem isto, cada evento começa numa folha em branco e a agência reescreve a
// mesma checklist e as mesmas rubricas de orçamento em cada casamento — que é
// exactamente o trabalho que o Excel já fazia. Os modelos são um ponto de
// partida para editar, não uma imposição: aplicam-se uma vez, num evento
// vazio, e depois é tudo linha a linha como sempre.

export type TaskTemplateItem = {
  title: string;
  /** Dias antes do casamento. Convertido em data por dueDateFromOffset(). */
  offsetDays: number;
  priority: TaskPriority;
  responsible: TaskResponsible;
};

// Prazos tirados do calendário real de um casamento em Portugal: o espaço e o
// catering fecham-se com mais de um ano de antecedência, e as últimas duas
// semanas são quase só confirmações. O responsável segue a regra simples de
// quem decide, não de quem eventualmente trata da logística: uma escolha
// pessoal (vestido, alianças) é do casal mesmo que a agência agende a prova.
export const WEDDING_TASK_TEMPLATE: TaskTemplateItem[] = [
  { title: "Definir orçamento e número aproximado de convidados", offsetDays: 365, priority: "alta", responsible: "both" },
  { title: "Visitar e reservar o espaço", offsetDays: 330, priority: "alta", responsible: "both" },
  { title: "Reservar fotógrafo e vídeo", offsetDays: 300, priority: "alta", responsible: "both" },
  { title: "Reservar catering", offsetDays: 300, priority: "alta", responsible: "both" },
  { title: "Tratar da documentação civil ou religiosa", offsetDays: 270, priority: "alta", responsible: "couple" },
  { title: "Reservar música — DJ ou banda", offsetDays: 270, priority: "normal", responsible: "both" },
  { title: "Escolher o vestido", offsetDays: 240, priority: "normal", responsible: "couple" },
  { title: "Reservar decoração e flores", offsetDays: 210, priority: "normal", responsible: "agency" },
  { title: "Enviar Save the Date", offsetDays: 200, priority: "normal", responsible: "agency" },
  { title: "Escolher fatos do noivo e padrinhos", offsetDays: 180, priority: "normal", responsible: "couple" },
  { title: "Prova de menu com o catering", offsetDays: 150, priority: "normal", responsible: "both" },
  { title: "Escolher alianças", offsetDays: 150, priority: "normal", responsible: "couple" },
  { title: "Enviar convites", offsetDays: 120, priority: "alta", responsible: "agency" },
  { title: "Reservar transporte dos noivos", offsetDays: 120, priority: "baixa", responsible: "agency" },
  { title: "Marcar ensaio de cabelo e maquilhagem", offsetDays: 90, priority: "normal", responsible: "couple" },
  { title: "Tratar da lua de mel e documentos de viagem", offsetDays: 90, priority: "baixa", responsible: "couple" },
  { title: "Fechar a lista de convidados", offsetDays: 60, priority: "alta", responsible: "couple" },
  { title: "Prova final do vestido", offsetDays: 45, priority: "normal", responsible: "couple" },
  { title: "Confirmar cronograma do dia com todos os fornecedores", offsetDays: 30, priority: "alta", responsible: "agency" },
  { title: "Fechar o plano de mesas", offsetDays: 21, priority: "normal", responsible: "both" },
  { title: "Dar o número final de confirmados ao catering", offsetDays: 14, priority: "alta", responsible: "agency" },
  { title: "Preparar os pagamentos finais aos fornecedores", offsetDays: 7, priority: "alta", responsible: "agency" },
  { title: "Entregar alianças e documentos ao padrinho", offsetDays: 2, priority: "normal", responsible: "couple" },
];

export type CostTemplateItem = {
  category: string;
  description: string;
  pricingMode: CostPricingMode;
};

// As rubricas que praticamente todos os casamentos têm, a zeros — servem de
// esqueleto para preencher, não de estimativa. Catering e bebidas nascem em
// "por pessoa" porque é assim que são orçamentados na prática, e é aí que a
// ligação aos confirmados ao vivo se paga.
export const WEDDING_COST_TEMPLATE: CostTemplateItem[] = [
  { category: "espaco", description: "Espaço e aluguer", pricingMode: "fixed" },
  { category: "catering", description: "Catering", pricingMode: "per_person" },
  { category: "bebidas", description: "Bebidas e bar", pricingMode: "per_person" },
  { category: "decoracao", description: "Decoração", pricingMode: "fixed" },
  { category: "flores", description: "Flores", pricingMode: "fixed" },
  { category: "fotografia", description: "Fotografia", pricingMode: "fixed" },
  { category: "video", description: "Vídeo", pricingMode: "fixed" },
  { category: "musica", description: "Música — DJ ou banda", pricingMode: "fixed" },
  { category: "bolo", description: "Bolo", pricingMode: "fixed" },
  { category: "convites", description: "Convites e papelaria", pricingMode: "fixed" },
  { category: "beleza", description: "Cabelo e maquilhagem", pricingMode: "fixed" },
  { category: "vestuario", description: "Vestido e fato", pricingMode: "fixed" },
  { category: "transporte", description: "Transporte", pricingMode: "fixed" },
  { category: "honorarios", description: "Honorários de planeamento", pricingMode: "fixed" },
];
