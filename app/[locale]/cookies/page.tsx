"use client";
import { motion } from "framer-motion";

export default function CookiesPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-32 pb-20 px-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto bg-white p-10 md:p-16 rounded-[2.5rem] border border-gray-100 shadow-sm"
      >
        <div className="mb-12 border-b border-gray-100 pb-8">
          <h1 className="text-3xl md:text-4xl font-serif text-[#722F37] mb-4">Política de Cookies</h1>
          <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Última atualização: 8 de Maio de 2026</p>
        </div>

        <div className="text-gray-600 leading-relaxed">
          
          <p className="mb-8 font-medium">Esta Política de Cookies explica o que são cookies, como o Digital Invite Studio os utiliza e quais as suas opções de gestão ao navegar na nossa plataforma e nos websites de eventos por nós alojados.</p>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">1. O que são Cookies?</h2>
          <p className="mb-8">Cookies são pequenos ficheiros de texto guardados no seu navegador ou dispositivo quando visita um site. Eles permitem que a plataforma "se lembre" das suas ações e preferências (como o login ou a língua escolhida) durante um certo período de tempo, proporcionando uma experiência de navegação mais fluida.</p>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">2. Que tipos de Cookies utilizamos?</h2>
          <p className="mb-4">Dividimos os nossos cookies em três categorias principais:</p>
          <ul className="list-disc pl-6 space-y-4 mb-8 marker:text-[#722F37]">
            <li>
              <strong className="text-gray-800">Cookies Estritamente Necessários:</strong> São essenciais para o funcionamento da plataforma. Incluem cookies que permitem aos organizadores fazer login de forma segura no Dashboard, guardar o progresso do planeamento de mesas (Seating Plan) e processar pagamentos de forma segura.
            </li>
            <li>
              <strong className="text-gray-800">Cookies Funcionais:</strong> Usados para reconhecer as suas preferências quando regressa à plataforma, como a personalização do seu painel de controlo ou as definições de idioma.
            </li>
            <li>
              <strong className="text-gray-800">Cookies Analíticos (Opcionais):</strong> Ajudam-nos a entender como os utilizadores interagem com o nosso site, medindo estatísticas de visitas e erros. Estes dados são sempre recolhidos de forma anónima e agregada.
            </li>
          </ul>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">3. Cookies de Terceiros</h2>
          <p className="mb-8">Em alguns casos específicos, utilizamos parceiros de confiança que também podem colocar cookies no seu dispositivo. Por exemplo, utilizamos serviços de processamento de pagamento seguros (como o Stripe) que exigem cookies essenciais para prevenir fraudes durante o processo de compra do seu pacote.</p>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">4. Os Cookies nos Sites dos Convidados</h2>
          <p className="mb-8">É importante notar que <strong>os sites e convites digitais criados pelos noivos e partilhados com os convidados estão isentos de cookies de rastreamento publicitário</strong>. A nossa prioridade é a privacidade dos seus convidados. Os únicos cookies utilizados nessas páginas servem propósitos técnicos (como guardar a sessão ao fazer o RSVP ou proteger a password do evento).</p>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">5. Como Gerir os Cookies?</h2>
          <p className="mb-8">Pode gerir as suas preferências de cookies diretamente através das definições do seu navegador. Pode optar por bloquear ou eliminar cookies; contudo, tenha em atenção que ao desativar os "Cookies Estritamente Necessários", partes fundamentais do Dashboard de gestão do evento poderão deixar de funcionar corretamente.</p>

          <div className="mt-16 p-8 bg-gray-50 rounded-2xl border border-gray-100">
            <h3 className="font-serif text-xl text-gray-800 mb-2">Dúvidas sobre a Privacidade?</h3>
            <p className="text-sm">Se tiver alguma questão adicional sobre o tratamento dos seus dados ou sobre o uso de cookies, não hesite em contactar-nos através de <a href="mailto:privacy@digitalinvite.studio" className="text-[#722F37] font-bold hover:underline">privacy@digitalinvite.studio</a>.</p>
          </div>
          
        </div>
      </motion.div>
    </div>
  );
}