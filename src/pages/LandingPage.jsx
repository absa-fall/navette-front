import { useNavigate } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, EffectFade } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/effect-fade'
import { Bus, QrCode, Calendar, MapPin, Shield, Clock, ArrowRight, Phone, Mail, CheckCircle } from 'lucide-react'

const slides = [
    {
        image: '/rectorat-uadb.png',
        titre: 'Université Alioune Diop de Bambey',
        sous_titre: 'Excellence académique et innovation depuis sa création',
    },
    {
        image: '/bus1.png',
        titre: 'Votre navette universitaire',
        sous_titre: 'Réservez votre place en quelques secondes',
    },
    {
        image: '/bus2.png',
        titre: 'Ensemble, on avance',
        sous_titre: 'La navette de l\'Université Alioune Diop de Bambey',
    },
    {
        image: '/bus3.png',
        titre: 'Voyagez en toute sérénité',
        sous_titre: 'Un service dédié aux enseignants et au personnel',
    },
    {
        image: '/bus4.png',
        titre: 'La navette de votre université',
        sous_titre: 'Bambey · Dakar · Thiès · Ngouniane',
    },
    {
        image: '/bus5.png',
        titre: 'Simple, rapide, fiable',
        sous_titre: 'Réservez, scannez, montez — c\'est tout',
    },

]
const trajets = [
    { depart: 'Bambey',    arrivee: 'Dakar'      },
    { depart: 'Dakar',     arrivee: 'Bambey'     },
    { depart: 'Bambey',    arrivee: 'Thiès'      },
    { depart: 'Thiès',     arrivee: 'Bambey'     },
    { depart: 'Bambey',    arrivee: 'Ngouniane'  },
    { depart: 'Ngouniane', arrivee: 'Bambey'     },
    { depart: 'Thiès',     arrivee: 'Ngouniane'  },
    { depart: 'Ngouniane', arrivee: 'Thiès'      },
]

const etapes = [
    { num: '01', titre: 'Connectez-vous',     desc: 'Accédez à votre espace personnel avec vos identifiants UADB.',      icon: Shield },
    { num: '02', titre: 'Réservez',           desc: 'Choisissez votre trajet, la date et l\'heure qui vous conviennent.',  icon: Calendar },
    { num: '03', titre: 'Attendez la confirmation', desc: 'Le chauffeur confirme votre place. Vous êtes notifié instantanément.', icon: Clock },
    { num: '04', titre: 'Scannez et montez',  desc: 'Montrez votre QR code au chauffeur et profitez du trajet.',           icon: QrCode },
]

export default function LandingPage() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-white font-sans">

            {/* ===== NAVBAR ===== */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
    <img src="/logo-uadb.png" alt="UADB" className="w-10 h-10 object-contain" />
    <div>
        <p className="font-bold text-gray-900 text-sm leading-tight">UADB Mobilité</p>
        <p className="text-xs text-gray-500 leading-tight">Navette universitaire</p>
    </div>
</div>
                    <div className="flex items-center gap-3">
                        <a href="#trajets" className="hidden md:block text-sm text-gray-600 hover:text-blue-700 font-medium transition">Trajets</a>
                        <a href="#comment" className="hidden md:block text-sm text-gray-600 hover:text-blue-700 font-medium transition">Comment ça marche</a>
                        <a href="#contact" className="hidden md:block text-sm text-gray-600 hover:text-blue-700 font-medium transition">Contact</a>
                       <button
    onClick={() => navigate('/inscription')}
    className="border border-blue-700 text-blue-700 hover:bg-blue-50 text-sm font-semibold px-5 py-2.5 rounded-xl transition"
>
    Nous rejoindre
</button>
<button
    onClick={() => navigate('/login')}
    className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
>
    Se connecter
</button>
                    </div>
                </div>
            </nav>

            {/* ===== HERO SLIDER ===== */}
            <section className="relative h-screen pt-16">
                <Swiper
                    modules={[Autoplay, Pagination, EffectFade]}
                    effect="fade"
                    autoplay={{ delay: 5000, disableOnInteraction: false }}
                    pagination={{ clickable: true }}
                    loop={true}
                    className="h-full"
                >
                    {slides.map((slide, i) => (
                        <SwiperSlide key={i}>
                            <div className="relative h-full">
                                {/* Image */}
                                <img
                                    src={slide.image}
                                    alt={slide.titre}
                                    className="w-full h-full object-cover"
                                />
                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-blue-900/50 to-transparent" />

                                {/* Texte */}
                                <div className="absolute inset-0 flex items-center">
                                    <div className="max-w-6xl mx-auto px-6 w-full">
                                        <div className="max-w-xl">
                                            <span className="inline-block bg-blue-500/30 border border-blue-400/50 text-blue-100 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 backdrop-blur-sm">
                                                Université Alioune Diop de Bambey
                                            </span>
                                            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
                                                {slide.titre}
                                            </h1>
                                            <p className="text-lg text-blue-100 mb-8">
                                                {slide.sous_titre}
                                            </p>
                                            <div className="flex gap-3 flex-wrap">
                                                <button
                                                    onClick={() => navigate('/login')}
                                                    className="flex items-center gap-2 bg-white text-blue-700 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition shadow-lg"
                                                >
                                                    Réserver ma navette
                                                    <ArrowRight size={18} />
                                                </button>
                                                <a href="#comment"
                                                    className="flex items-center gap-2 border-2 border-white/50 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition backdrop-blur-sm"
                                                >
                                                    Comment ça marche
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>

                {/* Stats flottantes */}
                <div className="absolute bottom-12 left-0 right-0 z-10">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="grid grid-cols-3 gap-4 max-w-lg">
                            {[
                                { val: '4', label: 'Villes desservies' },
                                { val: 'QR', label: 'Validation rapide' },
                                { val: '24h', label: 'Réservation en ligne' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center">
                                    <p className="text-2xl font-bold text-white">{stat.val}</p>
                                    <p className="text-xs text-blue-100 mt-0.5">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== TRAJETS ===== */}
            <section id="trajets" className="py-20 bg-gray-50">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <span className="text-blue-700 font-semibold text-sm uppercase tracking-wide">Nos liaisons</span>
                        <h2 className="text-3xl font-bold text-gray-900 mt-2">Trajets disponibles</h2>
                        <p className="text-gray-500 mt-3 max-w-md mx-auto">Consultez les tarifs et les durées estimées pour chaque trajet</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {trajets.map((t, i) => (
    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-blue-100 transition group">
        <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2.5 rounded-xl group-hover:bg-blue-100 transition">
                <MapPin size={18} className="text-blue-700" />
            </div>
            <div className="flex items-center gap-2 font-semibold text-gray-800">
                <span>{t.depart}</span>
                <ArrowRight size={14} className="text-blue-500" />
                <span>{t.arrivee}</span>
            </div>
        </div>
    </div>
))}
                    </div>

                    
                </div>
            </section>

{/* ===== VOYAGES D'ÉTUDES ===== */}
<section className="py-20 bg-white">
    <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Texte */}
            <div>
                <span className="text-blue-700 font-semibold text-sm uppercase tracking-wide">Pour les enseignants permanents</span>
                <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-4">Voyages d'études à l'international</h2>
                <p className="text-gray-500 leading-relaxed mb-6">
                    L'Université Alioune Diop de Bambey accompagne ses enseignants permanents dans leurs projets de mobilité internationale. 
                    Gérez votre dossier de voyage d'études entièrement en ligne, de la soumission des justificatifs jusqu'à l'obtention de votre autorisation d'absence.
                </p>
                <ul className="space-y-3 mb-8">
                    {[
                        'Soumission de justificatifs en ligne',
                        'Circuit de validation multi-niveaux',
                        'Autorisation d\'absence officielle générée automatiquement',
                        'Suivi en temps réel de votre dossier',
                    ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-gray-700 text-sm">
                            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <CheckCircle size={12} className="text-green-600" />
                            </div>
                            {item}
                        </li>
                    ))}
                </ul>
                <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-blue-200"
                >
                    Accéder à mon espace
                    <ArrowRight size={16} />
                </button>
            </div>

            {/* Carte visuelle */}
            <div className="space-y-4">
                {[
                    { etape: '01', titre: 'Sélection par le Vice-Recteur', desc: 'Vous êtes notifié si vous figurez sur la liste des bénéficiaires.' },
                    { etape: '02', titre: 'Soumission du dossier', desc: 'Déposez vos justificatifs auprès de votre Chef de Département.' },
                    { etape: '03', titre: 'Validation du circuit', desc: 'Votre dossier est examiné par la commission et le Vice-Recteur.' },
                    { etape: '04', titre: 'Autorisation signée', desc: 'Le Recteur signe l\'arrêté et votre autorisation d\'absence vous est transmise.' },
                ].map((s, i) => (
                    <div key={i} className="flex items-start gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {s.etape}
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800 text-sm">{s.titre}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
</section>
            {/* ===== COMMENT CA MARCHE ===== */}
            <section id="comment" className="py-20 bg-white">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <span className="text-blue-700 font-semibold text-sm uppercase tracking-wide">Simple et rapide</span>
                        <h2 className="text-3xl font-bold text-gray-900 mt-2">Comment ça marche ?</h2>
                        <p className="text-gray-500 mt-3 max-w-md mx-auto">Réservez votre navette en 4 étapes simples</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {etapes.map((e, i) => {
                            const Icon = e.icon
                            return (
                                <div key={i} className="relative">
                                    {i < etapes.length - 1 && (
                                        <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-blue-100 z-0" style={{ width: 'calc(100% - 3rem)', left: '3rem' }} />
                                    )}
                                    <div className="relative z-10 text-center">
                                        <div className="w-16 h-16 bg-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                                            <Icon size={24} className="text-white" />
                                        </div>
                                        <span className="text-xs font-bold text-blue-400 tracking-widest">{e.num}</span>
                                        <h3 className="font-bold text-gray-800 mt-1 mb-2">{e.titre}</h3>
                                        <p className="text-sm text-gray-500 leading-relaxed">{e.desc}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="text-center mt-12">
                        <button
                            onClick={() => navigate('/login')}
                            className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold px-8 py-4 rounded-xl transition shadow-lg shadow-blue-200"
                        >
                            Commencer maintenant
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </section>

            {/* ===== BANNIÈRE CTA ===== */}
            <section className="py-16 bg-blue-700">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Prêt à réserver votre navette ?
                    </h2>
                    <p className="text-blue-200 text-lg mb-8 max-w-xl mx-auto">
                        Connectez-vous avec vos identifiants UADB et réservez votre place en quelques secondes.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition shadow-lg"
                    >
                        Se connecter
                        <ArrowRight size={18} />
                    </button>
                </div>
            </section>
{/* ===== NOUS REJOINDRE ===== */}
<section className="py-20 bg-gray-50">
    <div className="max-w-4xl mx-auto px-6 text-center">
        <span className="text-blue-700 font-semibold text-sm uppercase tracking-wide">Communauté UADB</span>
        <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-4">Nous rejoindre</h2>
        <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto">
            Vous faites partie du personnel ou des enseignants de l'Université Alioune Diop de Bambey ? Créez votre compte et accédez au service de navette universitaire.
        </p>
        <button
            onClick={() => navigate('/inscription')}
            className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold px-8 py-4 rounded-xl transition shadow-lg shadow-blue-200"
        >
            Créer mon compte
            <ArrowRight size={18} />
        </button>
        <p className="text-sm text-gray-400 mt-4">
            Déjà inscrit ? <span onClick={() => navigate('/login')} className="text-blue-700 font-semibold cursor-pointer hover:underline">Se connecter</span>
        </p>
    </div>
</section>
            {/* ===== FOOTER ===== */}
            <footer id="contact" className="bg-gray-900 text-gray-400 py-12">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="bg-blue-700 p-2 rounded-xl">
                                    <Bus size={18} className="text-white" />
                                </div>
                                <p className="font-bold text-white">UADB Mobilité</p>
                            </div>
                            <p className="text-sm leading-relaxed">
                                Service de navette universitaire de l'Université Alioune Diop de Bambey.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-3">Trajets</h4>
                            <ul className="space-y-1.5 text-sm">
                                <li>Bambey ↔ Dakar</li>
                                <li>Bambey ↔ Thiès</li>
                                <li>Bambey ↔ Ngouniane</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-3">Contact</h4>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-center gap-2">
                                    <Phone size={14} className="text-blue-400" />
                                    (221) 33 973 30 86
                                </li>
                                <li className="flex items-center gap-2">
                                    <Mail size={14} className="text-blue-400" />
                                    contact@uadb.edu.sn
                                </li>
                                <li className="flex items-center gap-2">
                                    <MapPin size={14} className="text-blue-400" />
                                    Bambey, Sénégal
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-6 text-center text-xs">
                        <p>© {new Date().getFullYear()} UADB Mobilité — Université Alioune Diop de Bambey</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}