import Link from "next/link";

const FOOTER_LINKS = {
  Produit: [
    { label: "Accueil", href: "/" },
    { label: "Fonctionnalités", href: "#features" },
    { label: "Comment ça marche", href: "#how-it-works" },
    { label: "Pourquoi LOCATOMED", href: "#why-us" },
  ],
  Business: [
    { label: "Pour les médecins", href: "/business" },
    { label: "Pour les pharmaciens", href: "/business" },
    { label: "Pour les hôpitaux", href: "/business" },
    { label: "Se connecter", href: "/business" },
  ],
  Légal: [
    { label: "Politique de confidentialité", href: "#" },
    { label: "Conditions d'utilisation", href: "#" },
    { label: "Données médicales", href: "#" },
  ],
  Contact: [
    { label: "Nous contacter", href: "#contact" },
    { label: "Support", href: "#contact" },
    { label: "Partenariats", href: "#contact" },
  ],
};

export function Footer() {
  return (
    <footer id="contact" className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-teal-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-bold text-xl text-white">LOCATOMED</span>
            </div>
            <p className="text-sm leading-relaxed">
              Votre parcours de santé connecté — médicaments, rendez-vous et
              dossiers médicaux en un seul endroit.
            </p>
            <p className="text-xs text-gray-600">Tanger, Maroc 🇲🇦</p>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category} className="space-y-4">
              <h4 className="text-sm font-semibold text-white">{category}</h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    {href.startsWith("/") || href.startsWith("#") ? (
                      href.startsWith("/") ? (
                        <Link
                          href={href}
                          className="text-sm hover:text-white transition-colors"
                        >
                          {label}
                        </Link>
                      ) : (
                        <a
                          href={href}
                          className="text-sm hover:text-white transition-colors"
                        >
                          {label}
                        </a>
                      )
                    ) : (
                      <span className="text-sm">{label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} LOCATOMED. Tous droits réservés.
          </p>
          <p className="text-xs text-gray-600">
            One connected healthcare journey.
          </p>
        </div>
      </div>
    </footer>
  );
}
