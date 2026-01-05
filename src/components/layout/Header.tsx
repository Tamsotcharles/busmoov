import { Link, useLocation } from 'react-router-dom'
import { Phone, Menu, X, User } from 'lucide-react'
import { useState, useEffect } from 'react'

interface HeaderProps {
  showAdminLink?: boolean
}

export function Header({ showAdminLink = true }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  // Fermer le menu mobile lors d'un changement de route
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const closeMenu = () => {
    setMobileMenuOpen(false)
    // Scroll vers le haut après fermeture du menu
    window.scrollTo(0, 0)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo-icon.svg" alt="Busmoov" className="w-12 h-12" />
          <span className="font-display text-2xl font-bold gradient-text">
            Busmoov
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-gray-600 hover:text-magenta font-medium transition-colors">
            Comment ça marche
          </a>
          <a href="#features" className="text-gray-600 hover:text-magenta font-medium transition-colors">
            Nos services
          </a>
          <a href="#testimonials" className="text-gray-600 hover:text-magenta font-medium transition-colors">
            Avis clients
          </a>
          <a href="tel:+33176311283" className="flex items-center gap-2 text-purple font-semibold">
            <Phone size={18} />
            01 76 31 12 83
          </a>
          <Link to="/espace-client" className="flex items-center gap-2 text-gray-600 hover:text-magenta font-medium transition-colors">
            <User size={18} />
            Espace client
          </Link>
          {showAdminLink && (
            <Link to="/admin" className="btn btn-secondary btn-sm">
              Admin
            </Link>
          )}
          <a href="#quote" className="btn btn-primary">
            Obtenir un devis
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4 space-y-4">
          <a href="#how-it-works" onClick={closeMenu} className="block text-gray-600 hover:text-magenta font-medium">
            Comment ça marche
          </a>
          <a href="#features" onClick={closeMenu} className="block text-gray-600 hover:text-magenta font-medium">
            Nos services
          </a>
          <a href="#testimonials" onClick={closeMenu} className="block text-gray-600 hover:text-magenta font-medium">
            Avis clients
          </a>
          <a href="tel:+33176311283" className="flex items-center gap-2 text-purple font-semibold">
            <Phone size={18} />
            01 76 31 12 83
          </a>
          <Link to="/espace-client" onClick={closeMenu} className="flex items-center gap-2 text-gray-600 hover:text-magenta font-medium">
            <User size={18} />
            Espace client
          </Link>
          {showAdminLink && (
            <Link to="/admin" onClick={closeMenu} className="block btn btn-secondary w-full">
              Admin
            </Link>
          )}
          <a href="#quote" onClick={closeMenu} className="block btn btn-primary w-full text-center">
            Obtenir un devis
          </a>
        </div>
      )}
    </header>
  )
}
