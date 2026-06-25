const categories = ["culture", "science", "web", "cinema", "sport"];
const questions = [
  {
    id: "q1",
    category: "culture",
    text: "Quelle ville est surnommee la Ville Lumiere ?",
    answers: ["Lyon", "Paris", "Bruxelles", "Geneve"],
    correctIndex: 1
  },
  {
    id: "q2",
    category: "science",
    text: "Quelle planete est la plus proche du Soleil ?",
    answers: ["Venus", "Mars", "Mercure", "Jupiter"],
    correctIndex: 2
  },
  {
    id: "q3",
    category: "web",
    text: "Quel protocole securise les connexions web modernes ?",
    answers: ["FTP", "HTTPS", "SMTP", "DNS"],
    correctIndex: 1
  },
  {
    id: "q4",
    category: "cinema",
    text: "Qui a realise Jurassic Park ?",
    answers: ["James Cameron", "Steven Spielberg", "Ridley Scott", "Sofia Coppola"],
    correctIndex: 1
  },
  {
    id: "q5",
    category: "sport",
    text: "Combien de joueurs une equipe de football aligne-t-elle au coup d envoi ?",
    answers: ["9", "10", "11", "12"],
    correctIndex: 2
  },
  {
    id: "q6",
    category: "science",
    text: "Quelle unite mesure la resistance electrique ?",
    answers: ["Volt", "Watt", "Ohm", "Ampere"],
    correctIndex: 2
  },
  {
    id: "q7",
    category: "web",
    text: "Quel outil est utilise par SvelteKit pour le build local ?",
    answers: ["Webpack", "Vite", "Parcel", "Rollup CLI"],
    correctIndex: 1
  },
  {
    id: "q8",
    category: "culture",
    text: "Dans quel pays se trouve Kyoto ?",
    answers: ["Chine", "Coree du Sud", "Japon", "Thailande"],
    correctIndex: 2
  }
];
function pickQuestions(selectedCategories = categories, count = 10) {
  const pool = questions.filter((question) => selectedCategories.includes(question.category));
  const source = pool.length ? pool : questions;
  return [...source].sort(() => Math.random() - 0.5).slice(0, Math.max(1, Math.min(count, source.length)));
}

export { categories as c, pickQuestions as p };
//# sourceMappingURL=questions-036w9Ron.js.map
