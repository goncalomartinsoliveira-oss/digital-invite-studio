"use client";
import { motion } from "framer-motion";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-32 pb-20 px-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto bg-white p-10 md:p-16 rounded-[2.5rem] border border-gray-100 shadow-sm"
      >
        <div className="mb-12 border-b border-gray-100 pb-8">
          <h1 className="text-3xl md:text-4xl font-serif text-[#722F37] mb-4">Política de Privacidade</h1>
          <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Última atualização: 8 de Maio de 2026</p>
        </div>

        {/* Texto formatado manualmente à prova de falhas */}
        <div className="text-gray-600 leading-relaxed">
          
          <p className="mb-8">A sua privacidade é fundamental para o Digital Invite Studio. Esta Política de Privacidade descreve como recolhemos, usamos, processamos e protegemos as suas informações pessoais e as dos seus convidados ao utilizar a nossa plataforma.</p>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">1. Informações que Recolhemos</h2>
          <p className="mb-4">Ao utilizar os nossos serviços, podemos recolher as seguintes informações:</p>
          <ul className="list-disc pl-6 space-y-3 mb-8 marker:text-[#722F37]">
            <li><strong>Dados de Conta:</strong> Nome, endereço de email e dados de faturação dos organizadores/noivos.</li>
            <li><strong>Dados de Convidados:</strong> Nomes, emails, números de telefone e <strong className="text-gray-800">restrições alimentares</strong> inseridas no sistema de RSVP.</li>
            <li><strong>Conteúdo Multimédia:</strong> Fotografias, vídeos e mensagens carregadas através das funcionalidades de Guestbook e Live Wall.</li>
          </ul>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">2. Como Utilizamos os seus Dados</h2>
          <p className="mb-8">Utilizamos as informações recolhidas exclusivamente para fornecer e melhorar os nossos serviços. Não vendemos, alugamos ou partilhamos os seus dados pessoais ou a sua lista de convidados com terceiros para fins de marketing.</p>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">3. Retenção e Eliminação de Dados</h2>
          <p className="mb-8">Entendemos que os dados de um casamento são temporários. Os sites de eventos, listas de convidados e galerias multimédia são armazenados nos nossos servidores protegidos e são <strong className="text-gray-800">automaticamente eliminados 6 meses após a data do evento</strong>, a menos que adquira o pacote de "Arquivo Digital Vitalício".</p>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">4. Direitos dos Titulares dos Dados (RGPD)</h2>
          <p className="mb-8">De acordo com o Regulamento Geral sobre a Proteção de Dados (RGPD), tem o direito de aceder, retificar ou solicitar a eliminação total dos seus dados a qualquer momento antes do prazo estipulado. Para exercer estes direitos, contacte-nos através do nosso formulário de suporte.</p>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">5. Contacto</h2>
          <p className="mb-8">Para qualquer questão relacionada com a sua privacidade e proteção de dados, por favor contacte a nossa equipa através de <a href="mailto:privacy@digitalinvite.studio" className="text-[#722F37] font-bold hover:underline">privacy@digitalinvite.studio</a>.</p>
          
        </div>
      </motion.div>
    </div>
  );
}