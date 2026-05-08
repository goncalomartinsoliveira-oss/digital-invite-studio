"use client";
import { motion } from "framer-motion";
import { Globe, Users, Map, Camera, Lock, Smartphone } from "lucide-react";

const features = [
  {
    id: "website",
    title: "Website de Casamento de Luxo",
    description: "Crie uma primeira impressão inesquecível. Escolha entre modelos desenhados à mão, personalize com a sua paleta de cores e adicione a sua história de amor. O site adapta-se perfeitamente a qualquer telemóvel.",
    icon: <Globe className="w-6 h-6 text-[#722F37]" />,
    imagePlaceholder: "Previsão do Website no Telemóvel e Computador",
    reversed: false,
  },
  {
    id: "rsvp",
    title: "Smart RSVP Integrado",
    description: "Diga adeus às mensagens de WhatsApp perdidas e aos ficheiros de Excel confusos. Os seus convidados confirmam a presença online, indicam alergias ou restrições alimentares, e a sua lista de convidados atualiza automaticamente em tempo real.",
    icon: <Users className="w-6 h-6 text-[#722F37]" />,
    imagePlaceholder: "Dashboard com Gráficos de Confirmação e Alergias",
    reversed: true,
  },
  {
    id: "seating",
    title: "Seating Plan Visual (Drag & Drop)",
    description: "Planear as mesas nunca foi tão relaxante. Crie a planta da sua sala, defina o número de lugares por mesa e simplesmente arraste os convidados confirmados para os seus lugares. Partilhe depois a planta digital com a quinta num clique.",
    icon: <Map className="w-6 h-6 text-[#722F37]" />,
    imagePlaceholder: "Interface interativa de arrastar e largar convidados",
    reversed: false,
  },
  {
    id: "livewall",
    title: "Live Wall & Guestbook",
    description: "Transforme os seus convidados nos fotógrafos não oficiais. Através de um QR Code nas mesas, eles partilham fotos e vídeos que aparecem em direto num ecrã do evento. Podem também deixar mensagens de voz e texto privadas para os noivos.",
    icon: <Camera className="w-6 h-6 text-[#722F37]" />,
    imagePlaceholder: "Visualização do Ecrã Live Wall cheio de fotos de convidados",
    reversed: true,
  },
  {
    id: "agencies",
    title: "Portal para Organizadores (White Label)",
    description: "Um espaço seguro e privado onde os noivos podem partilhar as listas finais de convidados, restrições e plantas de sala diretamente com o Wedding Planner ou o Catering, sem lhes dar acesso total à edição do convite.",
    icon: <Lock className="w-6 h-6 text-[#722F37]" />,
    imagePlaceholder: "Página de visualização de dados para fornecedores",
    reversed: false,
  }
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-32 pb-20 font-sans overflow-hidden">
      
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 text-center mb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-xs font-bold uppercase tracking-widest text-[#722F37] mb-6 shadow-sm"
        >
          <Smartphone size={14} />
          <span>Tudo num só lugar</span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-serif text-gray-900 mb-6 leading-tight"
        >
          O sistema operativo para <br className="hidden md:block"/> o seu <span className="text-[#722F37] italic">casamento de sonho</span>.
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed"
        >
          Desde o primeiro convite enviado até à última fotografia partilhada na pista de dança. 
          Desenhámos cada ferramenta para eliminar o stress da organização.
        </motion.p>
      </div>

      {/* Funcionalidades (Zig-Zag Layout) */}
      <div className="max-w-7xl mx-auto px-6 space-y-32">
        {features.map((feature, index) => (
          <motion.div 
            key={feature.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className={`flex flex-col gap-12 lg:gap-24 items-center ${
              feature.reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'
            }`}
          >
            {/* Texto */}
            <div className="flex-1 space-y-6 text-center lg:text-left">
              <div className={`w-14 h-14 rounded-2xl bg-white shadow-md border border-gray-100 flex items-center justify-center mx-auto lg:mx-0`}>
                {feature.icon}
              </div>
              <h2 className="text-3xl md:text-4xl font-serif text-gray-900">
                {feature.title}
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>

            {/* Imagem / Mockup Placeholder */}
            <div className="flex-1 w-full">
              <div className="relative aspect-[4/3] rounded-[2.5rem] bg-gradient-to-tr from-gray-100 to-white border-2 border-gray-50 shadow-2xl overflow-hidden flex items-center justify-center group">
                {/* Aqui entrarão as imagens dos vossos ecrãs no futuro */}
                <div className="absolute inset-0 bg-[#722F37]/5 group-hover:bg-[#722F37]/10 transition-colors duration-500"></div>
                <p className="text-gray-400 font-medium text-sm text-center px-8 border-2 border-dashed border-gray-300 py-12 rounded-xl">
                  [ Imagem/Mockup do Ecrã: <br/> <strong className="text-gray-600">{feature.imagePlaceholder}</strong> ]
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Call to Action Final */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto mt-40 text-center px-6"
      >
        <h2 className="text-3xl font-serif text-[#722F37] mb-6">Pronto para começar a planear?</h2>
        <a 
          href="/pricing" 
          className="inline-flex h-14 items-center justify-center px-8 rounded-full bg-[#722F37] text-white text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-[#5a252b] hover:scale-105 transition-all"
        >
          Ver Pacotes e Preços
        </a>
      </motion.div>

    </div>
  );
}