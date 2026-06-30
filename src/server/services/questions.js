import { validateQuestionPack } from '../../../server/lib/questionValidator.js';

export const quizThemes = [
  {
    id: 'neon',
    name: 'Néon Pop',
    label: 'Rose électrique + cyan',
    className: 'theme-neon',
    icon: '/season-1/icons/theme-neon.svg',
    colors: ['#ff4f79', '#39d5ff'],
    motion: 'float',
    badge: 'Live'
  },
  {
    id: 'candy',
    name: 'Candy Rush',
    label: 'Corail + miel',
    className: 'theme-candy',
    icon: '/season-1/icons/theme-candy.svg',
    colors: ['#ff5a5f', '#ffd54a'],
    motion: 'bounce',
    badge: 'Fun'
  },
  {
    id: 'arcade',
    name: 'Arcade Volt',
    label: 'Vert laser + bleu',
    className: 'theme-arcade',
    icon: '/season-1/icons/theme-arcade.svg',
    colors: ['#36d27c', '#39d5ff'],
    motion: 'glitch',
    badge: 'Boost'
  },
  {
    id: 'studio',
    name: 'Studio Dark',
    label: 'Graphite + rouge',
    className: 'theme-studio',
    icon: '/season-1/icons/theme-studio.svg',
    colors: ['#e6e8ef', '#e53935'],
    motion: 'pulse',
    badge: 'Focus'
  }
];

export const categories = ['culture', 'science', 'web', 'cinéma', 'sport'];

const categoryMediaAssets = {
  anime: mediaImage('https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80', 'Illustration anime depuis Unsplash', '/assets/quiz/images/categories/anime.svg'),
  blindtest: mediaImage('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80', 'Guitare et ambiance musicale depuis Unsplash', '/assets/quiz/images/categories/musique.svg'),
  cinema: mediaImage('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80', 'Salle de cinéma depuis Unsplash', '/assets/quiz/images/categories/cinema.svg'),
  'cinéma': mediaImage('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80', 'Salle de cinéma depuis Unsplash', '/assets/quiz/images/categories/cinema.svg'),
  drapeaux: mediaImage('https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1200&q=80', 'Carte et repères de voyage depuis Unsplash', '/assets/quiz/images/categories/drapeaux.svg'),
  gaming: mediaImage('https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80', 'Manette de jeu vidéo depuis Unsplash', '/assets/quiz/images/categories/gaming.svg'),
  geographie: mediaImage('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80', 'Carte du monde depuis Unsplash', '/assets/quiz/images/categories/geographie.svg'),
  'géographie': mediaImage('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80', 'Carte du monde depuis Unsplash', '/assets/quiz/images/categories/geographie.svg'),
  histoire: mediaImage('https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1200&q=80', 'Livres et archives depuis Unsplash', '/assets/quiz/images/categories/histoire.svg'),
  internet: mediaImage('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80', 'Circuit électronique depuis Unsplash', '/assets/quiz/images/categories/internet.svg'),
  logos: mediaImage('https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80', 'Travail de design graphique depuis Unsplash', '/assets/quiz/images/categories/logos.svg'),
  musique: mediaImage('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80', 'Guitare et ambiance musicale depuis Unsplash', '/assets/quiz/images/categories/musique.svg'),
  rap_fr: mediaImage('https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80', 'Micro de concert depuis Unsplash', '/assets/quiz/images/categories/musique.svg'),
  rap_us: mediaImage('https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80', 'Micro de concert depuis Unsplash', '/assets/quiz/images/categories/musique.svg'),
  science: mediaImage('https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80', 'Laboratoire scientifique depuis Unsplash', '/assets/quiz/images/categories/science.svg'),
  sport: mediaImage('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80', 'Stade de football depuis Unsplash', '/assets/quiz/images/categories/sport.svg'),
  'world-cup-2026': mediaImage('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80', 'Stade de football depuis Unsplash', '/assets/quiz/images/categories/sport.svg'),
  web: mediaImage('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80', 'Circuit électronique depuis Unsplash', '/assets/quiz/images/categories/internet.svg')
};

function mediaImage(image, imageAlt, imageFallback) {
  return { image, imageAlt, imageFallback };
}

export const gameModes = [
  {
    id: 'classic',
    name: 'Quiz classique',
    label: 'Quiz net, rapide, efficace',
    questionCount: 8,
    timePerQuestion: 30,
    bonusTimer: true,
    scoreMultiplier: 1,
    categories: null,
    shuffleAnswers: false
  },
  {
    id: 'chaos',
    name: 'Mode chaos',
    label: 'Questions pièges et rythme nerveux',
    questionCount: 12,
    timePerQuestion: 15,
    bonusTimer: true,
    scoreMultiplier: 1.15,
    categories: ['chaos'],
    shuffleAnswers: true
  },
  {
    id: 'world-cup-2026',
    name: 'Coupe du monde 2026',
    label: 'Format 48 équipes, villes hôtes et grands repères',
    questionCount: 10,
    timePerQuestion: 25,
    bonusTimer: true,
    scoreMultiplier: 1.2,
    categories: ['world-cup-2026'],
    shuffleAnswers: false
  },
  {
    id: 'blindtest',
    name: 'Blindtest',
    label: 'Classiques, artistes et refrains cultes',
    questionCount: 8,
    timePerQuestion: 20,
    bonusTimer: true,
    scoreMultiplier: 1.1,
    categories: ['blindtest'],
    shuffleAnswers: true
  },
  {
    id: 'duel',
    name: 'Duel',
    label: 'Face-à-face express',
    questionCount: 7,
    timePerQuestion: 18,
    bonusTimer: true,
    scoreMultiplier: 1.25,
    categories: ['duel'],
    shuffleAnswers: false
  }
];

function q(id, category, text, answers, correctIndex, difficulty = 'medium') {
  return { id, category, text, answers, correctIndex, difficulty };
}

const rawQuestions = [
  q('culture-001', 'culture', 'Quelle ville est surnommée la Ville Lumière ?', ['Lyon', 'Paris', 'Bruxelles', 'Genève'], 1, 'easy'),
  q('culture-002', 'culture', 'Dans quel pays se trouve Kyoto ?', ['Chine', 'Corée du Sud', 'Japon', 'Thaïlande'], 2, 'easy'),
  q('culture-003', 'culture', 'Quel instrument reste le plus associé à Miles Davis ?', ['Trompette', 'Piano', 'Batterie', 'Saxophone'], 0, 'medium'),
  q('culture-004', 'culture', 'Quel musée parisien expose La Joconde ?', ['Orsay', 'Le Louvre', 'Centre Pompidou', 'Quai Branly'], 1, 'easy'),
  q('culture-005', 'culture', 'Quel roman commence avec le personnage de Winston Smith ?', ['1984', 'Dune', 'Fahrenheit 451', 'Le Meilleur des mondes'], 0, 'medium'),
  q('culture-006', 'culture', 'Quelle langue est parlée majoritairement au Brésil ?', ['Espagnol', 'Portugais', 'Italien', 'Français'], 1, 'easy'),
  q('culture-007', 'culture', 'Qui a peint Guernica ?', ['Pablo Picasso', 'Salvador Dalí', 'Joan Miró', 'Frida Kahlo'], 0, 'medium'),
  q('culture-008', 'culture', 'Quelle capitale européenne est traversée par le Danube et le Buda côté colline ?', ['Prague', 'Budapest', 'Vienne', 'Belgrade'], 1, 'medium'),
  q('science-001', 'science', 'Quelle planète est la plus proche du Soleil ?', ['Vénus', 'Mars', 'Mercure', 'Jupiter'], 2, 'easy'),
  q('science-002', 'science', 'Quelle unité mesure la résistance électrique ?', ['Volt', 'Watt', 'Ohm', 'Ampère'], 2, 'medium'),
  q('science-003', 'science', 'Quel gaz est le plus présent dans l’air que nous respirons ?', ['Oxygène', 'Azote', 'Dioxyde de carbone', 'Argon'], 1, 'medium'),
  q('science-004', 'science', 'Quel organe filtre le sang et produit l’urine ?', ['Foie', 'Rein', 'Poumon', 'Pancréas'], 1, 'easy'),
  q('science-005', 'science', 'Que mesure l’échelle de Richter ?', ['La force du vent', 'La magnitude d’un séisme', 'La salinité de l’eau', 'La pression atmosphérique'], 1, 'easy'),
  q('science-006', 'science', 'Quel élément chimique a le symbole Fe ?', ['Fluor', 'Fer', 'Francium', 'Fermium'], 1, 'medium'),
  q('science-007', 'science', 'Dans une cellule, quel organite produit l’essentiel de l’énergie utilisable ?', ['Le noyau', 'Le ribosome', 'La mitochondrie', 'Le lysosome'], 2, 'medium'),
  q('science-008', 'science', 'Quelle force maintient les planètes en orbite autour du Soleil ?', ['La gravité', 'Le magnétisme', 'La friction', 'La poussée'], 0, 'easy'),
  q('web-001', 'web', 'Quel protocole sécurise les connexions web modernes ?', ['FTP', 'HTTPS', 'SMTP', 'DNS'], 1, 'easy'),
  q('web-002', 'web', 'Que signifie CSS ?', ['Creative Style System', 'Cascading Style Sheets', 'Computer Style Script', 'Client Server Sheet'], 1, 'easy'),
  q('web-003', 'web', 'Quel outil sert au build local dans cette app SvelteKit ?', ['Webpack', 'Vite', 'Parcel', 'Rollup CLI'], 1, 'medium'),
  q('web-004', 'web', 'Quel format est le plus courant pour échanger des données entre une API web et un front ?', ['JSON', 'MP3', 'PSD', 'AVI'], 0, 'easy'),
  q('web-005', 'web', 'Dans une URL, que désigne souvent le nom placé avant “.com” ou “.fr” ?', ['Le domaine', 'Le port USB', 'Le mot de passe', 'Le cache'], 0, 'easy'),
  q('web-006', 'web', 'Quel langage s’exécute nativement dans tous les navigateurs modernes ?', ['PHP', 'JavaScript', 'Swift', 'Ruby'], 1, 'easy'),
  q('web-007', 'web', 'Quel code HTTP annonce qu’une page est introuvable ?', ['200', '301', '404', '500'], 2, 'easy'),
  q('web-008', 'web', 'À quoi sert un cookie HTTP dans la plupart des apps ?', ['Stocker un petit état côté navigateur', 'Compresser une image', 'Changer la carte graphique', 'Lancer un antivirus'], 0, 'medium'),
  q('cinema-001', 'cinéma', 'Qui a réalisé Jurassic Park ?', ['James Cameron', 'Steven Spielberg', 'Ridley Scott', 'Sofia Coppola'], 1, 'easy'),
  q('cinema-002', 'cinéma', 'Quel film met en scène le personnage de Neo ?', ['Inception', 'The Matrix', 'Tron', 'Blade Runner'], 1, 'easy'),
  q('cinema-003', 'cinéma', 'Dans quel film entend-on souvent parler du “précieux” ?', ['Le Seigneur des anneaux', 'Harry Potter', 'Avatar', 'Gladiator'], 0, 'easy'),
  q('cinema-004', 'cinéma', 'Quel réalisateur est derrière Pulp Fiction ?', ['Quentin Tarantino', 'Martin Scorsese', 'David Fincher', 'Christopher Nolan'], 0, 'medium'),
  q('cinema-005', 'cinéma', 'Quelle saga commence avec une pilule rouge et une pilule bleue ?', ['Matrix', 'Mission: Impossible', 'John Wick', 'Mad Max'], 0, 'easy'),
  q('cinema-006', 'cinéma', 'Quel film de 1997 met en scène Jack et Rose sur un paquebot ?', ['Pearl Harbor', 'Titanic', 'The Abyss', 'Cast Away'], 1, 'easy'),
  q('cinema-007', 'cinéma', 'Quel acteur joue Tony Stark dans le MCU ?', ['Chris Evans', 'Robert Downey Jr.', 'Mark Ruffalo', 'Benedict Cumberbatch'], 1, 'easy'),
  q('cinema-008', 'cinéma', 'Quel film d’animation Pixar suit un robot nommé WALL-E ?', ['Là-haut', 'WALL-E', 'Cars', 'Ratatouille'], 1, 'easy'),
  q('sport-001', 'sport', 'Combien de joueurs une équipe de football aligne-t-elle au coup d’envoi ?', ['9', '10', '11', '12'], 2, 'easy'),
  q('sport-002', 'sport', 'Quel tournoi de tennis se joue sur gazon à Londres ?', ['Roland-Garros', 'US Open', 'Wimbledon', 'Open d’Australie'], 2, 'easy'),
  q('sport-003', 'sport', 'En basket NBA, combien de points vaut un tir marqué derrière l’arc ?', ['1', '2', '3', '4'], 2, 'easy'),
  q('sport-004', 'sport', 'Quel pays a remporté la Coupe du monde masculine de football 2022 ?', ['France', 'Argentine', 'Croatie', 'Brésil'], 1, 'easy'),
  q('sport-005', 'sport', 'Combien de sets faut-il gagner pour remporter un match classique en volley-ball ?', ['2', '3', '4', '5'], 1, 'medium'),
  q('sport-006', 'sport', 'Dans quel sport parle-t-on de birdie, eagle et par ?', ['Golf', 'Rugby', 'Boxe', 'Handball'], 0, 'easy'),
  q('sport-007', 'sport', 'Quel maillot distingue le leader du Tour de France ?', ['Vert', 'Jaune', 'Blanc', 'À pois'], 1, 'easy'),
  q('sport-008', 'sport', 'Combien de minutes dure une mi-temps de football professionnel ?', ['30', '35', '40', '45'], 3, 'easy'),
  q('worldcup-001', 'world-cup-2026', 'Quels sont les trois pays hôtes de la Coupe du monde 2026 ?', ['Canada, Mexique, États-Unis', 'Brésil, Argentine, Uruguay', 'Espagne, Portugal, Maroc', 'France, Allemagne, Belgique'], 0, 'easy'),
  q('worldcup-002', 'world-cup-2026', 'Combien d’équipes participent à la Coupe du monde 2026 ?', ['32', '40', '48', '64'], 2, 'easy'),
  q('worldcup-003', 'world-cup-2026', 'Combien de matchs sont prévus dans le format 2026 ?', ['64', '80', '96', '104'], 3, 'medium'),
  q('worldcup-004', 'world-cup-2026', 'Dans quelle ville se joue le match d’ouverture du Mondial 2026 ?', ['Toronto', 'Mexico', 'Los Angeles', 'Miami'], 1, 'medium'),
  q('worldcup-005', 'world-cup-2026', 'Quel stade accueille le coup d’envoi du tournoi 2026 ?', ['Estadio Azteca', 'Rose Bowl', 'BC Place', 'MetLife Stadium'], 0, 'medium'),
  q('worldcup-006', 'world-cup-2026', 'La finale 2026 est programmée dans quelle zone hôte ?', ['New York New Jersey', 'Dallas', 'Vancouver', 'Guadalajara'], 0, 'medium'),
  q('worldcup-007', 'world-cup-2026', 'Combien de villes hôtes accueillent des matchs en 2026 ?', ['12', '14', '16', '18'], 2, 'easy'),
  q('worldcup-008', 'world-cup-2026', 'Quel pays hôte a déjà remporté la Coupe du monde masculine ?', ['Canada', 'Mexique', 'États-Unis', 'Aucun des trois'], 3, 'medium'),
  q('worldcup-009', 'world-cup-2026', 'Quelle ville canadienne fait partie des villes hôtes 2026 ?', ['Montréal', 'Toronto', 'Ottawa', 'Calgary'], 1, 'easy'),
  q('worldcup-010', 'world-cup-2026', 'Quelle ville mexicaine fait partie des villes hôtes 2026 ?', ['Puebla', 'Tijuana', 'Guadalajara', 'Mérida'], 2, 'easy'),
  q('worldcup-011', 'world-cup-2026', 'Quelle ville américaine fait partie des villes hôtes 2026 ?', ['Chicago', 'Seattle', 'Phoenix', 'Las Vegas'], 1, 'easy'),
  q('worldcup-012', 'world-cup-2026', 'Quel tour à élimination directe apparaît avec l’élargissement à 48 équipes ?', ['Seizièmes de finale', 'Finale à quatre', 'Match de barrage final', 'Deuxième phase de groupes'], 0, 'medium'),
  q('worldcup-013', 'world-cup-2026', 'Combien de groupes de quatre équipes compose le format 2026 ?', ['8', '10', '12', '16'], 2, 'medium'),
  q('worldcup-014', 'world-cup-2026', 'Quelle sélection est qualifiée automatiquement comme pays hôte ?', ['Canada', 'Italie', 'Norvège', 'Colombie'], 0, 'easy'),
  q('worldcup-015', 'world-cup-2026', 'Quelle confédération regroupe les trois pays hôtes 2026 ?', ['UEFA', 'CONMEBOL', 'CONCACAF', 'AFC'], 2, 'medium'),
  q('worldcup-016', 'world-cup-2026', 'Quel pays accueille trois villes hôtes: Guadalajara, Mexico et Monterrey ?', ['Canada', 'Mexique', 'États-Unis', 'Costa Rica'], 1, 'easy'),
  q('chaos-001', 'chaos', 'Piège rapide: combien de mois ont 28 jours ?', ['1', '2', '6', '12'], 3, 'easy'),
  q('chaos-002', 'chaos', 'Si tu dépasses le deuxième d’une course, tu deviens...', ['Premier', 'Deuxième', 'Troisième', 'Dernier'], 1, 'easy'),
  q('chaos-003', 'chaos', 'Quel mot est mal orthographié dans presque tous les dictionnaires ?', ['Dictionnaire', 'Mal', 'Orthographié', 'Presque'], 1, 'medium'),
  q('chaos-004', 'chaos', 'Un avion électrique tombe en panne. Où enterre-t-on les survivants ?', ['Dans le pays du crash', 'Dans leur pays', 'Nulle part', 'Au plus proche aéroport'], 2, 'easy'),
  q('chaos-005', 'chaos', 'Combien de fois peut-on soustraire 10 de 100 ?', ['Une fois', 'Cinq fois', 'Dix fois', 'Autant qu’on veut'], 0, 'medium'),
  q('chaos-006', 'chaos', 'Quel est le plus lourd: un kilo de plumes ou un kilo de plomb ?', ['Les plumes', 'Le plomb', 'Même poids', 'Ça dépend du vent'], 2, 'easy'),
  q('chaos-007', 'chaos', 'Avant l’Everest, quelle était la plus haute montagne du monde ?', ['K2', 'Kangchenjunga', 'Everest', 'Mont Blanc'], 2, 'medium'),
  q('chaos-008', 'chaos', 'Quel nombre vient juste après 999 ?', ['100', '1000', '9999', '998'], 1, 'easy'),
  q('chaos-009', 'chaos', 'Dans une pièce noire, tu as une bougie, une lampe et une cheminée. Qu’allumes-tu d’abord ?', ['La bougie', 'La lampe', 'La cheminée', 'Une allumette'], 3, 'easy'),
  q('chaos-010', 'chaos', 'Combien d’animaux de chaque espèce Moïse a-t-il emmenés dans l’arche ?', ['Deux', 'Sept', 'Aucun', 'Un couple et les oiseaux'], 2, 'medium'),
  q('chaos-011', 'chaos', 'Quelle question peut-on répondre par “non” sans mentir ?', ['Tu dors ?', 'Tu es vivant ?', 'Tu lis ceci ?', 'Tu as déjà respiré ?'], 0, 'hard'),
  q('chaos-012', 'chaos', 'Si un médecin te donne trois cachets à prendre toutes les 30 minutes, combien de temps dure la prise ?', ['30 minutes', '60 minutes', '90 minutes', '120 minutes'], 1, 'medium'),
  q('chaos-013', 'chaos', 'Un coq pond un œuf sur un toit pointu. De quel côté roule l’œuf ?', ['Gauche', 'Droite', 'Il ne roule pas', 'Côté nord'], 2, 'easy'),
  q('chaos-014', 'chaos', 'Quel jour vient avant dimanche dans le dictionnaire français ?', ['Samedi', 'Lundi', 'Mardi', 'Jeudi'], 3, 'hard'),
  q('blindtest-001', 'blindtest', 'Quel artiste a sorti l’album Thriller ?', ['Prince', 'Michael Jackson', 'Stevie Wonder', 'Lionel Richie'], 1, 'easy'),
  q('blindtest-002', 'blindtest', 'Dans “Bohemian Rhapsody”, quel groupe chante “Galileo” ?', ['Queen', 'The Beatles', 'Oasis', 'Muse'], 0, 'easy'),
  q('blindtest-003', 'blindtest', 'Quel duo français est associé aux casques de robots et à “Get Lucky” ?', ['Justice', 'Daft Punk', 'Air', 'Cassius'], 1, 'easy'),
  q('blindtest-004', 'blindtest', 'Quel artiste belge a popularisé “Alors on danse” ?', ['Damso', 'Stromae', 'Angèle', 'Lous and The Yakuza'], 1, 'easy'),
  q('blindtest-005', 'blindtest', 'Quel groupe chante “Smells Like Teen Spirit” ?', ['Nirvana', 'Pearl Jam', 'Radiohead', 'Green Day'], 0, 'easy'),
  q('blindtest-006', 'blindtest', 'Quel instrument ouvre souvent “Seven Nation Army” dans les stades ?', ['Riff de guitare', 'Solo de flûte', 'Batterie seule', 'Piano classique'], 0, 'easy'),
  q('blindtest-007', 'blindtest', 'Quel rappeur français a sorti l’album Deux frères avec son groupe ?', ['Nekfeu', 'Orelsan', 'Ninho', 'PNL'], 3, 'medium'),
  q('blindtest-008', 'blindtest', 'Quel titre de Pharrell Williams est devenu un hymne feel-good en 2013 ?', ['Happy', 'Sugar', 'Stay', 'Royals'], 0, 'easy'),
  q('blindtest-009', 'blindtest', 'Quel artiste chante “Blinding Lights” ?', ['Drake', 'The Weeknd', 'Post Malone', 'Bruno Mars'], 1, 'easy'),
  q('blindtest-010', 'blindtest', 'Quel style musical est historiquement lié à Bob Marley ?', ['Reggae', 'Techno', 'Metal', 'Disco'], 0, 'easy'),
  q('blindtest-011', 'blindtest', 'Quel groupe britannique a sorti l’album OK Computer ?', ['Coldplay', 'Radiohead', 'Blur', 'The Cure'], 1, 'medium'),
  q('blindtest-012', 'blindtest', 'Quel morceau commence par “Is this the real life?”', ['Imagine', 'Bohemian Rhapsody', 'Hey Jude', 'Wonderwall'], 1, 'easy'),
  q('duel-001', 'duel', 'Duel: capitale de l’Australie ?', ['Sydney', 'Melbourne', 'Canberra', 'Perth'], 2, 'medium'),
  q('duel-002', 'duel', 'Duel: combien de côtés a un hexagone ?', ['5', '6', '7', '8'], 1, 'easy'),
  q('duel-003', 'duel', 'Duel: qui a écrit Le Petit Prince ?', ['Victor Hugo', 'Antoine de Saint-Exupéry', 'Jules Verne', 'Albert Camus'], 1, 'easy'),
  q('duel-004', 'duel', 'Duel: quel pays utilise le yen ?', ['Chine', 'Japon', 'Corée du Sud', 'Vietnam'], 1, 'easy'),
  q('duel-005', 'duel', 'Duel: quel métal est liquide à température ambiante ?', ['Mercure', 'Cuivre', 'Aluminium', 'Nickel'], 0, 'medium'),
  q('duel-006', 'duel', 'Duel: quel réseau social a popularisé les Reels ?', ['Instagram', 'LinkedIn', 'Reddit', 'Twitch'], 0, 'easy'),
  q('duel-007', 'duel', 'Duel: dans Mario Kart, quel objet rend invincible ?', ['Banane', 'Carapace verte', 'Étoile', 'Champignon'], 2, 'easy'),
  q('duel-008', 'duel', 'Duel: quel océan borde la côte ouest des États-Unis ?', ['Atlantique', 'Pacifique', 'Indien', 'Arctique'], 1, 'easy'),
  q('duel-009', 'duel', 'Duel: combien vaut le carré de 12 ?', ['124', '132', '144', '156'], 2, 'medium'),
  q('duel-010', 'duel', 'Duel: quel club joue ses matchs au Camp Nou ?', ['Real Madrid', 'FC Barcelone', 'Atlético Madrid', 'Valence CF'], 1, 'easy'),
  q('duel-011', 'duel', 'Duel: quel animal est sur le logo de Ferrari ?', ['Taureau', 'Cheval cabré', 'Aigle', 'Lion'], 1, 'easy'),
  q('duel-012', 'duel', 'Duel: quel est le symbole chimique de l’eau ?', ['CO2', 'H2O', 'O2', 'NaCl'], 1, 'easy')
];

function cleanString(value, fallback = '') {
  return String(value ?? fallback).trim();
}

export function normalizeCategory(value) {
  const category = cleanString(value).toLowerCase();
  return category === 'cinema' ? 'cinéma' : category;
}

export function normalizeTheme(themeId) {
  return quizThemes.find((theme) => theme.id === themeId) || quizThemes[0];
}

function enrichQuestionMedia(question) {
  if (question.image || question.audio) return question;
  const media = categoryMediaAssets[normalizeCategory(question.category)];
  return media ? { ...question, ...media } : question;
}

export const { questions } = validateQuestionPack(rawQuestions.map(enrichQuestionMedia), 'builtin');

export function normalizeGameMode(modeId) {
  return gameModes.find((mode) => mode.id === modeId) || gameModes[0];
}

export function normalizeQuestions(input = []) {
  const source = Array.isArray(input) ? input.slice(0, 80) : [];
  const prepared = source.map((item, index) => ({
    ...item,
    id: cleanString(item?.id, `custom-${index + 1}`),
    category: normalizeCategory(item?.category || 'perso')
  }));
  return validateQuestionPack(prepared, 'custom').questions.map((question) => ({
    ...question,
    category: normalizeCategory(question.category)
  }));
}

function withUniqueQuestionIds(items) {
  const seen = new Map();

  return items.map((question, index) => {
    const count = seen.get(question.id) || 0;
    seen.set(question.id, count + 1);

    if (count === 0) return question;
    return { ...question, id: `${question.id}-repeat-${index + 1}` };
  });
}

export function pickQuestions(selectedCategories = categories, count = 10, customQuestions = []) {
  const hasExplicitCategories = Array.isArray(selectedCategories);
  const wanted = hasExplicitCategories ? selectedCategories.map(normalizeCategory).filter(Boolean) : categories;
  const normalizedCustom = normalizeQuestions(customQuestions);
  const standardPool = wanted.length ? questions.filter((question) => wanted.includes(question.category)) : [];
  const source = [...standardPool, ...normalizedCustom];
  const fallback = source.length ? source : questions;
  const customOnly = hasExplicitCategories && wanted.length === 0 && normalizedCustom.length > 0;
  const limit = customOnly ? normalizedCustom.length : Math.max(1, Number(count) || 10);

  if (limit <= fallback.length) {
    return withUniqueQuestionIds([...fallback].sort(() => Math.random() - 0.5).slice(0, limit));
  }

  const picked = [];
  while (picked.length < limit) {
    const cycle = [...fallback].sort(() => Math.random() - 0.5);
    for (const question of cycle) {
      if (picked.length >= limit) break;
      picked.push(question);
    }
  }

  return withUniqueQuestionIds(picked);
}
