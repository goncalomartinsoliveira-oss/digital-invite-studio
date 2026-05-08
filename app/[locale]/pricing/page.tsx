"use client";
import { motion } from "framer-motion";
import { Check } from "lucide-react"; // Certifique-se de ter lucide-react instalado ou use SVGs

const plans = [
  {
    name: "Essencial",
    price: "49€",
    description: "O essencial para começar a sua jornada digital.",
    features: [
      "Website de Casamento Personalizado",
      "Modelos de Convite Base",
      "Smart RSVP (Confirmações)",
      "Gestão de Lista de Convidados",
      "Suporte via Email",
      "Marca de água discreta",
    ],
    buttonText: "Começar Agora",
    highlight: false,
  },
  {
    name: "Premium",
    price: "119€",
    description: "A solução completa para uma organização sem stress.",
    features: [
      "Tudo do Plano Essencial",
      "Editor de Seating Plan Visual",
      "Página de Partilha com Organizadores",
      "Ementa Digital",
      "Remoção total de marca de água",
      "Prioridade no Suporte",
    ],
    buttonText: "Escolher Premium",
    highlight: true, // Plano Bestseller
  },
  {
    name: "Experiência Luxo",
    price: "199€",
    description: "A derradeira experiência digital para o dia do seu evento.",
    features: [
      "Tudo do Plano Premium",
      "Live Wall (Fotos em Direto)",
      "Digital Guestbook (Voz e Vídeo)",
      "Photo Sharing para Convidados",
      "Armazenamento Cloud Extra (5GB)",
      "Modelos de Website Exclusivos",
    ],
    buttonText: "Escolher Luxo",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-32 pb-20 px-6 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Cabeçalho da Página */}
        <div className="text-center mb-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-serif text-[#722F37] mb-6"
          >
            Escolha o Plano Perfeito
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 max-w-2xl mx-auto text-lg"
          >
            Pagamento único por evento. Sem subscrições mensais. Escolha a experiência que melhor se adapta ao seu grande dia.
          </motion.p>
        </div>

        {/* Grelha de Preços */}
        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative flex flex-col p-8 rounded-[2.5rem] transition-all duration-500 ${
                plan.highlight 
                ? "bg-white border-2 border-[#722F37] shadow-2xl scale-105 z-10" 
                : "bg-white border border-gray-100 shadow-lg hover:shadow-xl"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#722F37] text-white text-[10px] font-bold uppercase tracking-widest px-6 py-2 rounded-full shadow-md">
                  Mais Escolhido
                </div>
              )}

              <div className="mb-8">
                <h3 className={`font-serif text-2xl mb-2 ${plan.highlight ? "text-[#722F37]" : "text-gray-800"}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-serif text-gray-900">{plan.price}</span>
                  <span className="text-gray-400 text-sm">/evento</span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <div className="flex-1 space-y-4 mb-10">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className={`mt-1 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${plan.highlight ? "bg-[#722F37] text-white" : "bg-gray-100 text-gray-400"}`}>
                      <Check size={10} strokeWidth={4} />
                    </div>
                    <span className="text-sm text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                className={`w-full py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  plan.highlight
                  ? "bg-[#722F37] text-white shadow-lg hover:bg-[#5a252b] hover:scale-[1.02]"
                  : "bg-gray-50 text-gray-800 hover:bg-gray-100"
                }`}
              >
                {plan.buttonText}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Secção White Label / B2B */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-24 bg-white rounded-[3rem] p-12 border border-gray-100 shadow-sm text-center"
        >
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-3xl text-gray-800 mb-4">É Organizador de Eventos?</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Oferecemos soluções especiais de <strong className="text-[#722F37]">White Label</strong> para Wedding Planners e Agências. Utilize a nossa tecnologia com a sua própria marca e beneficie de preços de revenda.
            </p>
            <a 
              href="/contact" 
              className="inline-block border-b-2 border-[#722F37] pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-800 hover:text-[#722F37] transition-colors"
            >
              Consultar Condições B2B
            </a>
          </div>
        </motion.div>

      </div>
    </div>
  );
}