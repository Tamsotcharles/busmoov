import { Link } from 'react-router-dom'
import { ArrowLeft, Scale } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header showAdminLink={false} />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-magenta mb-8 transition-colors"
          >
            <ArrowLeft size={18} />
            Retour à l'accueil
          </Link>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple to-magenta px-8 py-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Scale size={28} />
                <h1 className="text-2xl font-bold">Mentions Légales</h1>
              </div>
              <p className="text-white/80 text-sm">
                Dernière mise à jour : Janvier 2025
              </p>
            </div>

            {/* Content */}
            <div className="px-8 py-8 space-y-8">
              {/* Editeur du site */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">1. Éditeur du site</h2>
                <div className="bg-gray-50 rounded-lg p-6 space-y-2">
                  <p className="text-gray-700"><strong>Raison sociale :</strong> BUSMOOV SAS</p>
                  <p className="text-gray-700"><strong>Marque du groupe :</strong> Centrale Autocar</p>
                  <p className="text-gray-700"><strong>Forme juridique :</strong> Société par Actions Simplifiée (SAS)</p>
                  <p className="text-gray-700"><strong>Capital social :</strong> 2 500 €</p>
                  <p className="text-gray-700"><strong>Siège social :</strong> 41 Rue Barrault, 75013 Paris, France</p>
                  <p className="text-gray-700"><strong>SIRET :</strong> 853 867 703 00029</p>
                  <p className="text-gray-700"><strong>RCS :</strong> Paris 853 867 703</p>
                  <p className="text-gray-700"><strong>Code APE :</strong> 4939B - Autres transports routiers de voyageurs n.c.a.</p>
                  <p className="text-gray-700"><strong>N° TVA Intracommunautaire :</strong> FR58853867703</p>
                  <p className="text-gray-700"><strong>Téléphone :</strong> 01 76 31 12 83</p>
                  <p className="text-gray-700"><strong>Email :</strong> <a href="mailto:infos@busmoov.com" className="text-magenta hover:underline">infos@busmoov.com</a></p>
                </div>
              </section>

              {/* Directeur de publication */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">2. Directeur de la publication</h2>
                <p className="text-gray-600 leading-relaxed">
                  Le directeur de la publication est le représentant légal de la société BUSMOOV SAS.
                </p>
              </section>

              {/* Hébergement */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">3. Hébergement</h2>
                <div className="bg-gray-50 rounded-lg p-6 space-y-2">
                  <p className="text-gray-700"><strong>Hébergeur :</strong> Vercel Inc.</p>
                  <p className="text-gray-700"><strong>Adresse :</strong> 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</p>
                  <p className="text-gray-700"><strong>Site web :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-magenta hover:underline">vercel.com</a></p>
                </div>
              </section>

              {/* Propriété intellectuelle */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">4. Propriété intellectuelle</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  L'ensemble du contenu de ce site (textes, images, vidéos, logos, graphismes, icônes, etc.) est la propriété exclusive de BUSMOOV SAS ou de ses partenaires, et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.
                </p>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de BUSMOOV SAS.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Toute exploitation non autorisée du site ou de son contenu sera considérée comme constitutive d'une contrefaçon et poursuivie conformément aux dispositions des articles L.335-2 et suivants du Code de la Propriété Intellectuelle.
                </p>
              </section>

              {/* Responsabilité */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">5. Responsabilité</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  BUSMOOV SAS s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur ce site. Toutefois, BUSMOOV SAS ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à disposition sur ce site.
                </p>
                <p className="text-gray-600 leading-relaxed mb-4">
                  BUSMOOV SAS décline toute responsabilité :
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>Pour toute interruption du site</li>
                  <li>Pour toute survenance de bogues</li>
                  <li>Pour toute inexactitude ou omission portant sur des informations disponibles sur le site</li>
                  <li>Pour tout dommage résultant d'une intrusion frauduleuse d'un tiers</li>
                  <li>Pour tout dommage causé à un utilisateur ou à un tiers du fait de l'utilisation du site</li>
                </ul>
              </section>

              {/* Liens hypertextes */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">6. Liens hypertextes</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Le site peut contenir des liens hypertextes vers d'autres sites. BUSMOOV SAS n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu ou aux produits et services qu'ils proposent.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  La création de liens hypertextes vers le site busmoov.com est soumise à l'accord préalable de BUSMOOV SAS.
                </p>
              </section>

              {/* Droit applicable */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">7. Droit applicable et juridiction</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Les présentes mentions légales sont régies par le droit français. En cas de litige, et à défaut de résolution amiable, les tribunaux français seront seuls compétents.
                </p>
              </section>

              {/* Contact */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">8. Contact</h2>
                <p className="text-gray-600 leading-relaxed">
                  Pour toute question relative aux présentes mentions légales ou pour exercer vos droits, vous pouvez nous contacter :
                </p>
                <ul className="mt-4 space-y-2 text-gray-600">
                  <li><strong>Par email :</strong> <a href="mailto:infos@busmoov.com" className="text-magenta hover:underline">infos@busmoov.com</a></li>
                  <li><strong>Par téléphone :</strong> 01 76 31 12 83</li>
                  <li><strong>Par courrier :</strong> BUSMOOV SAS, 41 Rue Barrault, 75013 Paris</li>
                </ul>
              </section>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 text-center">
                Voir aussi notre{' '}
                <Link to="/confidentialite" className="text-magenta hover:underline">
                  Politique de confidentialité
                </Link>
                {' '}et nos{' '}
                <Link to="/cgv" className="text-magenta hover:underline">
                  Conditions Générales de Vente
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
