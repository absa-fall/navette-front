// Utilitaire partagé entre le formulaire de rédaction (enseignant) et
// le document officiel (affichage). Ne pas mettre ce fichier dans un
// dossier "pages/xxx" pour éviter les imports fragiles entre rôles.

export const SECTIONS_RAPPORT = [
    {
        key: 'objectifs',
        label: 'Objectifs de la mission',
        placeholder: "Rappelez le but du voyage : conférence, formation, recherche, partenariat...",
        rows: 3,
    },
    {
        key: 'deroulement',
        label: 'Déroulement du voyage',
        placeholder: "Décrivez le programme suivi jour par jour ou par grandes étapes : activités, rencontres, visites...",
        rows: 5,
    },
    {
        key: 'resultats',
        label: 'Résultats et apprentissages',
        placeholder: "Qu'avez-vous obtenu ou appris ? Connaissances acquises, contacts établis, documents rapportés...",
        rows: 5,
    },
    {
        key: 'recommandations',
        label: 'Recommandations',
        placeholder: "Suggestions pour l'université : opportunités à saisir, suites à donner, points de vigilance...",
        rows: 3,
    },
]

// Relit un `contenu` existant (JSON structuré ou ancien texte libre)
export function parseContenu(contenuBrut) {
    const vide = { objectifs: '', deroulement: '', resultats: '', recommandations: '' }
    if (!contenuBrut) return vide

    try {
        const parsed = JSON.parse(contenuBrut)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return { ...vide, ...parsed }
        }
    } catch {
        // Pas du JSON : ancien rapport en texte libre, on le place dans "Déroulement"
        // pour ne rien perdre.
    }
    return { ...vide, deroulement: contenuBrut }
}

// Sérialise les sections pour l'envoi au backend (champ `contenu` en string, inchangé)
export function serialiserSections(sections) {
    return JSON.stringify(sections)
}