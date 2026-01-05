import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo-icon.svg" alt="Busmoov" className="w-10 h-10" />
              <span className="font-display text-xl font-bold gradient-text">
                Busmoov
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              La plateforme de référence pour la location d'autocar avec chauffeur en France.
              Comparez, réservez et voyagez en toute sérénité.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link to="/services/location-autocar" className="hover:text-magenta transition-colors">Location autocar</Link></li>
              <li><Link to="/services/location-minibus" className="hover:text-magenta transition-colors">Location minibus</Link></li>
              <li><Link to="/services/transfert-aeroport" className="hover:text-magenta transition-colors">Transfert aéroport</Link></li>
              <li><Link to="/services/sorties-scolaires" className="hover:text-magenta transition-colors">Sorties scolaires</Link></li>
            </ul>
          </div>

          {/* Entreprise */}
          <div>
            <h4 className="font-semibold mb-4">Entreprise</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link to="/a-propos" className="hover:text-magenta transition-colors">À propos</Link></li>
              <li><Link to="/devenir-partenaire" className="hover:text-magenta transition-colors">Devenir partenaire</Link></li>
              <li><Link to="/contact" className="hover:text-magenta transition-colors">Contact</Link></li>
              <li><Link to="/cgv" className="hover:text-magenta transition-colors">CGV</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="tel:+33187211476" className="hover:text-magenta transition-colors">01 87 21 14 76</a></li>
              <li><a href="mailto:infos@busmoov.com" className="hover:text-magenta transition-colors">infos@busmoov.com</a></li>
              <li>Lun - Sam : 9h - 19h</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© 2025 Busmoov - Une marque du groupe <a href="https://www.centrale-autocar.com" className="text-magenta hover:underline">Centrale Autocar</a>. Tous droits réservés.</p>
          <div className="flex gap-4">
            <Link to="/mentions-legales" className="hover:text-magenta transition-colors">Mentions légales</Link>
            <span>·</span>
            <Link to="/cgv" className="hover:text-magenta transition-colors">CGV</Link>
            <span>·</span>
            <Link to="/confidentialite" className="hover:text-magenta transition-colors">Confidentialité</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
