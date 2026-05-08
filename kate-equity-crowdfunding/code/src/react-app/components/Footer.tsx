import { Link } from "react-router";
import { Mail, Phone, MapPin, Linkedin, Instagram } from "lucide-react";

const KATE_LOGO_URL = "https://019c104a-6f56-7035-a238-879c29552414.mochausercontent.com/Kate-Equity-Crowdfunding.png";
const CVM_LOGO_URL = "https://019c104a-6f56-7035-a238-879c29552414.mochausercontent.com/cvm2-300x188-1.png";

export default function Footer() {
  return (
    <footer className="bg-navy-deep text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <img
                src={KATE_LOGO_URL}
                alt="Kate Equity Crowdfunding"
                className="h-12 w-auto"
              />
            </Link>
            <p className="text-white/60 text-sm mb-4">
              Conectando investidores a oportunidades reais de equity crowdfunding.
            </p>
            <div className="flex gap-3">
              <a href="https://www.linkedin.com/showcase/kate-equity-crowdfunding/about/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/10 hover:bg-gold/20 rounded-lg flex items-center justify-center transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://www.instagram.com/katecapital.oficial/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/10 hover:bg-gold/20 rounded-lg flex items-center justify-center transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Investidores */}
          <div>
            <h4 className="font-semibold text-white mb-4">Investidores</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/oportunidades" className="text-white/60 hover:text-gold text-sm transition-colors">
                  Oportunidades
                </Link>
              </li>
              <li>
                <Link to="/como-funciona" className="text-white/60 hover:text-gold text-sm transition-colors">
                  Como funciona
                </Link>
              </li>
              <li>
                <Link to="/riscos" className="text-white/60 hover:text-gold text-sm transition-colors">
                  Riscos
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-white/60 hover:text-gold text-sm transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Emissores */}
          <div>
            <h4 className="font-semibold text-white mb-4">Emissores</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/submeter-projeto" className="text-white/60 hover:text-gold text-sm transition-colors">
                  Submeter projeto
                </Link>
              </li>
              <li>
                <Link to="/criterios" className="text-white/60 hover:text-gold text-sm transition-colors">
                  Critérios de seleção
                </Link>
              </li>
              <li>
                <Link to="/taxas" className="text-white/60 hover:text-gold text-sm transition-colors">
                  Taxas e custos
                </Link>
              </li>
              <li>
                <Link to="/contato" className="text-white/60 hover:text-gold text-sm transition-colors">
                  Fale conosco
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contato</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-white/60 text-sm">
                <Mail className="w-4 h-4 text-gold" />
                <a href="mailto:contato@kate.capital" className="hover:text-gold transition-colors">contato@kate.capital</a>
              </li>
              <li className="flex items-center gap-2 text-white/60 text-sm">
                <Phone className="w-4 h-4 text-gold" />
                <a href="tel:+5521987667852" className="hover:text-gold transition-colors">+55 21 98766-7852</a>
              </li>
              <li className="flex items-start gap-2 text-white/60 text-sm">
                <MapPin className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                <span>Rua Visconde de Inhaúma, 134<br />Sala 2001 Parte, Centro<br />Rio de Janeiro - RJ<br />CEP: 20091-901</span>
              </li>
            </ul>
          </div>
        </div>

        {/* CVM Section */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="flex-shrink-0">
              <img
                src={CVM_LOGO_URL}
                alt="CVM - Comissão de Valores Mobiliários"
                className="h-16 w-auto bg-white rounded-lg p-2"
              />
            </div>
            <div className="flex-1">
              <p className="text-white/60 text-xs leading-relaxed">
                As sociedades empresárias de pequeno porte e as ofertas apresentadas nesta plataforma estão automaticamente dispensadas de registro pela Comissão de Valores Mobiliários – CVM.
              </p>
              <p className="text-white/60 text-xs leading-relaxed mt-2">
                A CVM não analisa previamente as ofertas. As ofertas realizadas não implicam por parte da CVM a garantia da veracidade das informações prestadas, de adequação à legislação vigente ou julgamento sobre a qualidade da sociedade empresária de pequeno porte. Antes de aceitar uma oferta leia com atenção as informações essenciais da oferta, em especial a seção de alertas sobre riscos.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-white/40">
              <Link to="/termos" className="hover:text-white/60 transition-colors">
                Termos de uso
              </Link>
              <Link to="/privacidade" className="hover:text-white/60 transition-colors">
                Política de privacidade
              </Link>
              <Link to="/regulamento" className="hover:text-white/60 transition-colors">
                Regulamento CVM
              </Link>
            </div>
            <p className="text-sm text-white/40 text-center md:text-right">
              © {new Date().getFullYear()} Kate. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
