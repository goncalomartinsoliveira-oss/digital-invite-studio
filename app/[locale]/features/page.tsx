"use client";
import { motion } from "framer-motion";
import { 
  Smartphone, 
  Sparkles, 
  ClipboardCheck, 
  Map, 
  QrCode, 
  Camera, 
  BookHeart, 
  FileText,
  ArrowRight
} from "lucide-react";

const features = [
  {
    id: "website",
    title: "Convites e Website Premium",
    description: "A porta de entrada do seu evento. Crie uma primeira impressão inesquecível com tipografias elegantes e layouts modernos. Em vez do papel que se perde, ofereça um espaço digital imersivo que reflete a identidade visual do seu casamento.",
    icon: <Sparkles className="w-6 h-6 text-[#722F37]" />,
    imagePlaceholder: "Previsão do Website no Telemóvel com tipografia elegante",
    reversed: false,
    link: "/features/convites-digitais"
  },
  {
    id: "rsvp",
    title: "Gestão Inteligente & RSVP",
    description: "O cérebro da organização. Esqueça as folhas de cálculo e as mensagens perdidas. Os convidados confirmam presença, indicam restrições alimentares e a sua lista atualiza automaticamente em tempo real, segmentada por idade e origem.",
    icon: <ClipboardCheck className="w-6 h-6 text-[#722F37]" />,
    imagePlaceholder: "Dashboard com Gráficos de Confirmação e Alergias",
    reversed: true,
    link: "/features/gestao-rsvp"
  },
  {
    id: "seating",
    title: "Seating Plan Interativo",
    description: "Planear as mesas nunca foi tão visual. Um quadro digital onde pode desenhar a sala e arrastar os convidados diretamente para os lugares. A plataforma ajusta a geometria das mesas e bloqueia lugares excedentes automaticamente.",
    icon: <Map className="w-6 h-6 text-[#722F37]" />,
    imagePlaceholder: "Interface Drag & Drop de arrastar convidados para as mesas redondas",
    reversed: false,
    link: "/features/seating-plan"
  },
  {
    id: "qrcode",
    title: "A Experiência no Dia (QR Code)",
    description: "Elimine o engarrafamento à entrada da sala. Através de um QR Code elegante impresso no local, o convidado acede à planta digital no seu telemóvel, pesquisa o seu nome e encontra a sua mesa instantaneamente.",
    icon: <QrCode className="w-6 h-6 text-[#722F37]" />,
    imagePlaceholder: "Mockup de um telemóvel a ler um QR Code num expositor floral",
    reversed: true,
    link: "/features/experiencia-qrcode"
  },
  {
    id: "photosharing",
    title: "Partilha de Fotos Colaborativa",
    description: "Os fotógrafos captam o oficial, os seus convidados captam o espontâneo. Um álbum digital partilhado onde todos os presentes podem carregar fotos e vídeos em direto, acessível num único lugar para guardar para sempre.",
    icon: <Camera className="w-6 h-6 text-[#722F37]" />,
    imagePlaceholder: "Galeria estilo mural cheia de fotografias divertidas de convidados",
    reversed: false,
    link: "/features/photo-sharing"
  },
  {
    id: "guestbook",
    title: "Livro de Honras Digital",
    description: "Uma reinvenção emotiva do tradicional livro de assinaturas. Os convidados utilizam os seus telemóveis para deixar dedicatórias de texto, mensagens de voz e votos de felicidade. Um arquivo de amor que nunca se irá perder.",
    icon: <BookHeart className="w-6 h-6 text-[#722F37]" />,
    imagePlaceholder: "Ecrã com mensagens bonitas e notas de voz a tocar",
    reversed: true,
    link: "/features/livro-honras"
  },
  {
    id: "reports",
    title: "Exportações Premium para Staff",
    description: "A comunicação com o Catering e o Wedding Planner tem de ser impecável. Exporte relatórios em PDF com qualidade de impressão, encabeçados pelo vosso logotipo, incluindo a planta exata da sala e listagem rigorosa por mesa.",
    icon: <FileText className="w-6 h-6 text-[#722F37]" />,
    imagePlaceholder: "Documento PDF elegante com a planta da sala e o logotipo da marca",
    reversed: false,
    link: "/features/exportacoes-staff"
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
          O sistema operativo para <br className="hidden md:block"/> o seu <span className="text-[#722F37] italic">casamento de luxo</span>.
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed"
        >
          Desde o primeiro convite enviado até à última fotografia partilhada na pista de dança. 
          Desenhámos cada ferramenta para eliminar o stress da organização e elevar a experiência dos seus convidados.
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
              
              {/* Link Preparado para o Futuro */}
              <div className="pt-2">
                <a 
                  href={feature.link} 
                  className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#722F37] hover:text-black transition-colors group"
                >
                  Descobrir mais 
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>

            {/* Imagem / Mockup Placeholder */}
            <div className="flex-1 w-full">
              <div className="relative aspect-[4/3] rounded-[2.5rem] bg-gradient-to-tr from-gray-100 to-white border-2 border-gray-50 shadow-2xl overflow-hidden flex items-center justify-center group">
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
        <h2 className="text-3xl font-serif text-[#722F37] mb-6">Pronto para elevar o seu evento?</h2>
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