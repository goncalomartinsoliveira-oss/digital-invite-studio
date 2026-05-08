"use client";
import { motion } from "framer-motion";

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-32 pb-20 px-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto bg-white p-10 md:p-16 rounded-[2.5rem] border border-gray-100 shadow-sm"
      >
        <div className="mb-12 border-b border-gray-100 pb-8">
          <h1 className="text-3xl md:text-4xl font-serif text-[#722F37] mb-4">Termos e Condições</h1>
          <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Última atualização: 8 de Maio de 2026</p>
        </div>

        <div className="text-gray-600 leading-relaxed">
          
          <p className="mb-8 font-medium italic">Bem-vindo ao Digital Invite Studio. Ao utilizar a nossa plataforma, concorda com os seguintes termos. Por favor, leia-os atentamente.</p>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">1. Objeto do Serviço</h2>
          <p className="mb-8">O Digital Invite Studio fornece uma plataforma SaaS (Software as a Service) para a criação de websites de casamento, gestão de convidados (RSVP), planeamento de mesas (Seating Plan) e partilha de conteúdos multimédia (Live Wall e Guestbook).</p>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">2. Pagamentos e Reembolsos</h2>
          <p className="mb-4">O acesso às funcionalidades premium requer um pagamento único, de acordo com o pacote selecionado:</p>
          <ul className="list-disc pl-6 space-y-3 mb-4 marker:text-[#722F37]">
            <li>Os preços são apresentados em Euros e incluem as taxas legais em vigor.</li>
            <li>Devido à natureza digital e personalizada do serviço, <strong>não são efetuados reembolsos após a ativação ou publicação do convite</strong>.</li>
            <li>O utilizador pode testar as ferramentas gratuitamente antes de efetuar o pagamento.</li>
          </ul>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">3. Responsabilidade do Utilizador</h2>
          <p className="mb-8">O utilizador é o único responsável pelo conteúdo (textos, imagens e vídeos) carregado na plataforma. É proibido o uso da plataforma para partilha de conteúdo ilegal, ofensivo ou que viole direitos de autor de terceiros.</p>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">4. Limitação de Responsabilidade</h2>
          <p className="mb-8">Embora nos esforcemos para garantir 99.9% de disponibilidade, o Digital Invite Studio não pode ser responsabilizado por falhas de ligação à internet no local do evento, erros em dispositivos de convidados ou interrupções de serviço alheias ao nosso controlo técnico.</p>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">5. Propriedade Intelectual</h2>
          <p className="mb-8">Todos os templates, códigos, motores de design (como o Seating Plan Editor) e elementos visuais da plataforma são propriedade exclusiva do Digital Invite Studio. A compra de uma licença de evento dá direito ao uso, não à reprodução ou revenda do software.</p>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">6. Validade do Evento</h2>
          <p className="mb-8">Salvo indicação em contrário num pacote específico, todos os dados do evento (website, lista de convidados e fotos) permanecem ativos até <strong>6 meses após a data do casamento</strong> inserida no sistema. Após este período, os dados serão eliminados permanentemente para garantir a privacidade dos utilizadores.</p>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">7. Lei Aplicável</h2>
          <p className="mb-8">Estes termos são regidos pela lei portuguesa. Para a resolução de qualquer litígio, as partes submetem-se ao foro da comarca de Lisboa.</p>

          <div className="mt-16 p-8 bg-gray-50 rounded-2xl border border-gray-100">
            <h3 className="font-serif text-xl text-gray-800 mb-2">Dúvidas?</h3>
            <p className="text-sm">Se tiver alguma questão sobre estes termos, contacte-nos através de <a href="mailto:legal@digitalinvite.studio" className="text-[#722F37] font-bold hover:underline">legal@digitalinvite.studio</a>.</p>
          </div>
          
        </div>
      </motion.div>
    </div>
  );
}