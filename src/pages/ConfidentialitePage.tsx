import { Link } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export function ConfidentialitePage() {
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
                <Shield size={28} />
                <h1 className="text-2xl font-bold">Politique de Confidentialité</h1>
              </div>
              <p className="text-white/80 text-sm">
                Dernière mise à jour : Janvier 2025
              </p>
            </div>

            {/* Content */}
            <div className="px-8 py-8 space-y-8">
              {/* Introduction */}
              <section>
                <p className="text-gray-600 leading-relaxed">
                  BUSMOOV SAS (ci-après "nous", "notre" ou "Busmoov") s'engage à protéger la vie privée des utilisateurs de son site web busmoov.com (ci-après le "Site"). Cette politique de confidentialité explique comment nous collectons, utilisons, partageons et protégeons vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.
                </p>
              </section>

              {/* Responsable du traitement */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">1. Responsable du traitement</h2>
                <div className="bg-gray-50 rounded-lg p-6 space-y-2">
                  <p className="text-gray-700"><strong>BUSMOOV SAS</strong></p>
                  <p className="text-gray-700">41 Rue Barrault, 75013 Paris</p>
                  <p className="text-gray-700">SIRET : 853 867 703 00029</p>
                  <p className="text-gray-700">Email : <a href="mailto:infos@busmoov.com" className="text-magenta hover:underline">infos@busmoov.com</a></p>
                </div>
              </section>

              {/* Données collectées */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">2. Données personnelles collectées</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Nous collectons les données personnelles suivantes :
                </p>

                <h3 className="font-semibold text-gray-800 mb-2">Lors d'une demande de devis :</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4 mb-4">
                  <li>Nom et prénom</li>
                  <li>Adresse email</li>
                  <li>Numéro de téléphone</li>
                  <li>Adresse postale (pour la facturation)</li>
                  <li>Informations sur le voyage (dates, lieux, nombre de passagers)</li>
                </ul>

                <h3 className="font-semibold text-gray-800 mb-2">Lors d'une réservation :</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4 mb-4">
                  <li>Données d'identification des passagers</li>
                  <li>Informations de paiement (traitées de manière sécurisée par notre prestataire de paiement)</li>
                  <li>Informations complémentaires sur le voyage (contacts sur place, besoins spécifiques)</li>
                </ul>

                <h3 className="font-semibold text-gray-800 mb-2">Données de navigation :</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                  <li>Adresse IP</li>
                  <li>Type de navigateur et système d'exploitation</li>
                  <li>Pages visitées et temps passé sur le site</li>
                </ul>
              </section>

              {/* Finalités */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">3. Finalités du traitement</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Vos données personnelles sont collectées pour les finalités suivantes :
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li><strong>Gestion des demandes de devis</strong> : traitement de vos demandes et élaboration de propositions commerciales</li>
                  <li><strong>Gestion des réservations</strong> : exécution du contrat de transport, coordination avec les transporteurs</li>
                  <li><strong>Facturation et paiement</strong> : émission de factures, gestion des paiements</li>
                  <li><strong>Service client</strong> : réponse à vos questions, suivi de votre dossier</li>
                  <li><strong>Communication</strong> : envoi d'informations relatives à votre réservation (confirmations, rappels, informations pratiques)</li>
                  <li><strong>Amélioration de nos services</strong> : analyse statistique anonymisée pour améliorer notre site et nos offres</li>
                  <li><strong>Obligations légales</strong> : respect de nos obligations comptables et fiscales</li>
                </ul>
              </section>

              {/* Base légale */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">4. Base légale du traitement</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Le traitement de vos données personnelles repose sur les bases légales suivantes :
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li><strong>Exécution du contrat</strong> : pour la gestion de votre réservation et la fourniture de nos services</li>
                  <li><strong>Consentement</strong> : pour l'envoi de communications marketing (si vous y avez consenti)</li>
                  <li><strong>Intérêt légitime</strong> : pour l'amélioration de nos services et la prévention de la fraude</li>
                  <li><strong>Obligation légale</strong> : pour le respect de nos obligations comptables et fiscales</li>
                </ul>
              </section>

              {/* Destinataires */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">5. Destinataires des données</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Vos données personnelles peuvent être partagées avec :
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li><strong>Nos transporteurs partenaires</strong> : pour l'exécution de votre réservation (nom du contact, coordonnées sur place, informations de voyage)</li>
                  <li><strong>Nos prestataires techniques</strong> : hébergement (Vercel), base de données (Supabase), paiement en ligne (Mollie)</li>
                  <li><strong>Autorités compétentes</strong> : si la loi nous y oblige</li>
                </ul>
                <p className="text-gray-600 leading-relaxed mt-4">
                  Nous ne vendons jamais vos données personnelles à des tiers.
                </p>
              </section>

              {/* Durée de conservation */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">6. Durée de conservation</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Vos données personnelles sont conservées pendant les durées suivantes :
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li><strong>Données de réservation</strong> : 10 ans après la fin du contrat (obligations comptables)</li>
                  <li><strong>Demandes de devis non converties</strong> : 3 ans après le dernier contact</li>
                  <li><strong>Données de navigation</strong> : 13 mois maximum</li>
                </ul>
              </section>

              {/* Vos droits */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">7. Vos droits</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Conformément au RGPD, vous disposez des droits suivants :
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li><strong>Droit d'accès</strong> : obtenir la confirmation que vos données sont traitées et en recevoir une copie</li>
                  <li><strong>Droit de rectification</strong> : faire corriger vos données inexactes ou incomplètes</li>
                  <li><strong>Droit à l'effacement</strong> : demander la suppression de vos données dans certains cas</li>
                  <li><strong>Droit à la limitation</strong> : demander la suspension du traitement dans certains cas</li>
                  <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
                  <li><strong>Droit d'opposition</strong> : vous opposer au traitement pour des raisons tenant à votre situation particulière</li>
                  <li><strong>Droit de retirer votre consentement</strong> : à tout moment, pour les traitements basés sur le consentement</li>
                </ul>
                <p className="text-gray-600 leading-relaxed mt-4">
                  Pour exercer ces droits, contactez-nous à{' '}
                  <a href="mailto:infos@busmoov.com" className="text-magenta hover:underline">infos@busmoov.com</a>.
                </p>
                <p className="text-gray-600 leading-relaxed mt-4">
                  Vous avez également le droit d'introduire une réclamation auprès de la CNIL :{' '}
                  <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-magenta hover:underline">www.cnil.fr</a>
                </p>
              </section>

              {/* Sécurité */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">8. Sécurité des données</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, modification, divulgation ou destruction :
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>Chiffrement des données en transit (HTTPS/TLS)</li>
                  <li>Chiffrement des données au repos</li>
                  <li>Accès restreint aux données sur la base du besoin d'en connaître</li>
                  <li>Authentification sécurisée</li>
                  <li>Sauvegardes régulières</li>
                </ul>
              </section>

              {/* Cookies */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">9. Cookies</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Notre site utilise des cookies pour améliorer votre expérience de navigation. Les cookies sont de petits fichiers texte stockés sur votre appareil.
                </p>

                <h3 className="font-semibold text-gray-800 mb-2">Types de cookies utilisés :</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li><strong>Cookies essentiels</strong> : nécessaires au fonctionnement du site (session, authentification)</li>
                  <li><strong>Cookies analytiques</strong> : pour comprendre comment les visiteurs utilisent le site (statistiques anonymisées)</li>
                </ul>
                <p className="text-gray-600 leading-relaxed mt-4">
                  Vous pouvez configurer votre navigateur pour refuser les cookies ou être alerté lorsqu'un cookie est envoyé. Cependant, certaines fonctionnalités du site pourraient ne pas fonctionner correctement.
                </p>
              </section>

              {/* Transferts internationaux */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">10. Transferts internationaux</h2>
                <p className="text-gray-600 leading-relaxed">
                  Certains de nos prestataires techniques (hébergement, services cloud) peuvent être situés hors de l'Union européenne. Dans ce cas, nous nous assurons que des garanties appropriées sont mises en place (clauses contractuelles types, certification Privacy Shield, etc.) pour assurer un niveau de protection adéquat de vos données.
                </p>
              </section>

              {/* Modifications */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">11. Modifications de la politique</h2>
                <p className="text-gray-600 leading-relaxed">
                  Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. En cas de modification substantielle, nous vous en informerons par email ou via une notification sur le site. La date de dernière mise à jour est indiquée en haut de cette page.
                </p>
              </section>

              {/* Contact */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">12. Contact</h2>
                <p className="text-gray-600 leading-relaxed">
                  Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits, contactez-nous :
                </p>
                <ul className="mt-4 space-y-2 text-gray-600">
                  <li><strong>Par email :</strong> <a href="mailto:infos@busmoov.com" className="text-magenta hover:underline">infos@busmoov.com</a></li>
                  <li><strong>Par téléphone :</strong> 01 76 31 12 83</li>
                  <li><strong>Par courrier :</strong> BUSMOOV SAS - Protection des données, 41 Rue Barrault, 75013 Paris</li>
                </ul>
              </section>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 text-center">
                Voir aussi nos{' '}
                <Link to="/mentions-legales" className="text-magenta hover:underline">
                  Mentions légales
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
