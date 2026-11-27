import type { LanguageId } from './types';

/**
 * Simulados inspirados no formato de exames de proficiência (leitura, audição
 * e vocabulário). Todas as perguntas são originais e baseadas no conteúdo do
 * percurso. Não são um exame oficial, não emitem certificado e não substituem
 * uma avaliação certificada — o resultado é indicativo.
 *
 * Cobertura: A1 para as seis línguas naturais; A2 para inglês e espanhol.
 */
export type ExamSection = 'reading' | 'listening' | 'vocabulary';

export interface ExamQuestion {
  id: string;
  section: ExamSection;
  /** Passagem partilhada na secção de leitura. */
  passage?: string;
  /** Texto para o botão de áudio na secção de audição. */
  audioText?: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface SampleExam {
  id: string;
  languageId: LanguageId;
  level: 'A1' | 'A2';
  title: string;
  description: string;
  durationMinutes: number;
  passPercent: number;
  questions: ExamQuestion[];
}

export interface ExamScore {
  correct: number;
  total: number;
  percent: number;
  perSection: Record<ExamSection, { correct: number; total: number; percent: number }>;
  passed: boolean;
  xp: number;
}

const sectionTotals = (exam: SampleExam) =>
  exam.questions.reduce<Record<ExamSection, { correct: number; total: number; percent: number }>>(
    (acc, question) => {
      acc[question.section].total += 1;
      return acc;
    },
    {
      reading: { correct: 0, total: 0, percent: 0 },
      listening: { correct: 0, total: 0, percent: 0 },
      vocabulary: { correct: 0, total: 0, percent: 0 },
    },
  );

/** Pontuação honesta: 1 XP por acerto + 10 XP de bónus se atingires aprovação. */
export function scoreExam(exam: SampleExam, answers: Record<string, number>): ExamScore {
  const perSection = sectionTotals(exam);
  let correct = 0;
  for (const question of exam.questions) {
    if (answers[question.id] === question.correctIndex) {
      correct += 1;
      perSection[question.section].correct += 1;
    }
  }
  for (const key of Object.keys(perSection) as ExamSection[]) {
    const section = perSection[key];
    section.percent = section.total > 0 ? Math.round((section.correct / section.total) * 100) : 0;
  }
  const percent = exam.questions.length > 0 ? Math.round((correct / exam.questions.length) * 100) : 0;
  const passed = percent >= exam.passPercent;
  return {
    correct,
    total: exam.questions.length,
    percent,
    perSection,
    passed,
    xp: correct + (passed ? 10 : 0),
  };
}

export const EXAMS: SampleExam[] = [
  /* ------------------------------ English A1 ------------------------------ */
  {
    id: 'en-a1',
    languageId: 'en',
    level: 'A1',
    title: 'Simulado A1 · Inglês',
    description: 'Leitura, audição e vocabulário — o essencial do nível A1.',
    durationMinutes: 10,
    passPercent: 60,
    questions: [
      {
        id: 'en-a1-r1', section: 'reading', passage: 'Hi! My name is Tom. I’m from Manchester. I work in a café near the station. On Saturdays I usually visit my grandmother or play football with friends. My favourite food is pasta and my favourite colour is green.',
        question: 'Where is Tom from?', options: ['London', 'Manchester', 'Leeds'], correctIndex: 1, explanation: 'O texto diz “I’m from Manchester”.',
      },
      {
        id: 'en-a1-r2', section: 'reading', passage: 'Hi! My name is Tom. I’m from Manchester. I work in a café near the station. On Saturdays I usually visit my grandmother or play football with friends. My favourite food is pasta and my favourite colour is green.',
        question: 'Where does Tom work?', options: ['In a bank', 'In a school', 'In a café'], correctIndex: 2, explanation: 'O texto diz “I work in a café”.',
      },
      {
        id: 'en-a1-r3', section: 'reading', passage: 'Hi! My name is Tom. I’m from Manchester. I work in a café near the station. On Saturdays I usually visit my grandmother or play football with friends. My favourite food is pasta and my favourite colour is green.',
        question: 'What does Tom do on Saturdays?', options: ['Visits family or plays football', 'Goes shopping', 'Watches films'], correctIndex: 0, explanation: 'O texto diz “I visit my grandmother or play football”.',
      },
      {
        id: 'en-a1-r4', section: 'reading', passage: 'Hi! My name is Tom. I’m from Manchester. I work in a café near the station. On Saturdays I usually visit my grandmother or play football with friends. My favourite food is pasta and my favourite colour is green.',
        question: 'What is Tom’s favourite colour?', options: ['Blue', 'Green', 'Red'], correctIndex: 1, explanation: 'O texto diz “My favourite colour is green”.',
      },
      {
        id: 'en-a1-a1', section: 'listening', audioText: 'Please sit down. The train leaves at half past nine.',
        question: 'What time does the train leave?', options: ['Nine o’clock', 'Half past nine', 'Half past ten'], correctIndex: 1, explanation: '“Half past nine” = 9:30.',
      },
      {
        id: 'en-a1-a2', section: 'listening', audioText: 'I would like a coffee and a cheese sandwich, please.',
        question: 'What does the customer order?', options: ['Tea and cake', 'Coffee and a sandwich', 'Juice and fruit'], correctIndex: 1, explanation: 'Ouviu-se “a coffee and a cheese sandwich”.',
      },
      {
        id: 'en-a1-a3', section: 'listening', audioText: 'The museum opens at ten o’clock and closes at six.',
        question: 'When does the museum close?', options: ['At six o’clock', 'At ten o’clock', 'At nine o’clock'], correctIndex: 0, explanation: '“Closes at six” = fecha às seis.',
      },
      {
        id: 'en-a1-v1', section: 'vocabulary', question: 'Which word means “obrigatório”?', options: ['optional', 'required', 'free'], correctIndex: 1, explanation: '“Required” significa obrigatório.',
      },
      {
        id: 'en-a1-v2', section: 'vocabulary', question: 'Choose the correct question: “_____ is your name?”', options: ['Who', 'What', 'Where'], correctIndex: 1, explanation: '“What is your name?”',
      },
      {
        id: 'en-a1-v3', section: 'vocabulary', question: 'Which place can you buy stamps?', options: ['At the pharmacy', 'At the post office', 'At the library'], correctIndex: 1, explanation: 'Selos compram-se nos correios (post office).',
      },
    ],
  },
  /* ------------------------------ Spanish A1 ------------------------------ */
  {
    id: 'es-a1',
    languageId: 'es',
    level: 'A1',
    title: 'Simulado A1 · Español',
    description: 'Comprensión lectora, auditiva y vocabulario — nivel A1.',
    durationMinutes: 10,
    passPercent: 60,
    questions: [
      {
        id: 'es-a1-r1', section: 'reading', passage: 'Hola. Me llamo Carmen. Soy de Valencia. Trabajo en un hotel cerca de la playa. Los domingos como en casa de mis padres. Mi comida favorita es la paella.',
        question: '¿De dónde es Carmen?', options: ['Madrid', 'Valencia', 'Sevilla'], correctIndex: 1, explanation: 'O texto diz “Soy de Valencia”.',
      },
      {
        id: 'es-a1-r2', section: 'reading', passage: 'Hola. Me llamo Carmen. Soy de Valencia. Trabajo en un hotel cerca de la playa. Los domingos como en casa de mis padres. Mi comida favorita es la paella.',
        question: '¿Dónde trabaja Carmen?', options: ['En un supermercado', 'En un hotel', 'En un restaurante'], correctIndex: 1, explanation: 'O texto diz “Trabajo en un hotel”.',
      },
      {
        id: 'es-a1-r3', section: 'reading', passage: 'Hola. Me llamo Carmen. Soy de Valencia. Trabajo en un hotel cerca de la playa. Los domingos como en casa de mis padres. Mi comida favorita es la paella.',
        question: '¿Qué hace los domingos?', options: ['Come con sus padres', 'Viaja al mar', 'Hace deporte'], correctIndex: 0, explanation: 'O texto diz “Los domingos como en casa de mis padres”.',
      },
      {
        id: 'es-a1-r4', section: 'reading', passage: 'Hola. Me llamo Carmen. Soy de Valencia. Trabajo en un hotel cerca de la playa. Los domingos como en casa de mis padres. Mi comida favorita es la paella.',
        question: '¿Cuál es su comida favorita?', options: ['La pizza', 'La paella', 'La ensalada'], correctIndex: 1, explanation: 'O texto diz “Mi comida favorita es la paella”.',
      },
      {
        id: 'es-a1-a1', section: 'listening', audioText: 'Por favor, pase por la puerta B12.',
        question: '¿Qué debe hacer el pasajero?', options: ['Esperar en la puerta B12', 'Ir a la puerta A5', 'Salir del aeropuerto'], correctIndex: 0, explanation: '“Pase por la puerta B12”.',
      },
      {
        id: 'es-a1-a2', section: 'listening', audioText: 'Dos cafés y una tostada, por favor.',
        question: '¿Qué pide el cliente?', options: ['Un café y un bocadillo', 'Dos cafés y una tostada', 'Un té y una tostada'], correctIndex: 1, explanation: 'Ouviu-se “dos cafés y una tostada”.',
      },
      {
        id: 'es-a1-a3', section: 'listening', audioText: 'El médico no trabaja los lunes.',
        question: '¿Qué día no trabaja el médico?', options: ['El lunes', 'El viernes', 'El sábado'], correctIndex: 0, explanation: '“No trabaja los lunes”.',
      },
      {
        id: 'es-a1-v1', section: 'vocabulary', question: '¿Qué palabra significa “obrigado / obrigada”?', options: ['de nada', 'gracias', 'por favor'], correctIndex: 1, explanation: '“Gracias” = obrigado.',
      },
      {
        id: 'es-a1-v2', section: 'vocabulary', question: 'Elige la pregunta correcta: “¿_____ te llamas?”', options: ['Cómo', 'Quién', 'Dónde'], correctIndex: 0, explanation: '“¿Cómo te llamas?” = Como te chamas?',
      },
      {
        id: 'es-a1-v3', section: 'vocabulary', question: '¿Dónde compras pan?', options: ['En la panadería', 'En la farmacia', 'En el banco'], correctIndex: 0, explanation: 'O pão compra-se na padaria.',
      },
    ],
  },
  /* ------------------------------- Dutch A1 ------------------------------- */
  {
    id: 'nl-a1',
    languageId: 'nl',
    level: 'A1',
    title: 'Simulado A1 · Nederlands',
    description: 'Lezen, luisteren en woordenschat — niveau A1.',
    durationMinutes: 10,
    passPercent: 60,
    questions: [
      {
        id: 'nl-a1-r1', section: 'reading', passage: 'Hoi. Ik ben Sam. Ik kom uit Utrecht. Ik werk in een boekwinkel. Op zaterdag ga ik vaak naar het strand of naar de markt. Ik hou van kaas en brood.',
        question: 'Waar komt Sam vandaan?', options: ['Amsterdam', 'Utrecht', 'Rotterdam'], correctIndex: 1, explanation: 'O texto diz “Ik kom uit Utrecht”.',
      },
      {
        id: 'nl-a1-r2', section: 'reading', passage: 'Hoi. Ik ben Sam. Ik kom uit Utrecht. Ik werk in een boekwinkel. Op zaterdag ga ik vaak naar het strand of naar de markt. Ik hou van kaas en brood.',
        question: 'Waar werkt Sam?', options: ['In een boekwinkel', 'In een supermarkt', 'In een café'], correctIndex: 0, explanation: 'O texto diz “Ik werk in een boekwinkel”.',
      },
      {
        id: 'nl-a1-r3', section: 'reading', passage: 'Hoi. Ik ben Sam. Ik kom uit Utrecht. Ik werk in een boekwinkel. Op zaterdag ga ik vaak naar het strand of naar de markt. Ik hou van kaas en brood.',
        question: 'Wat doet Sam op zaterdag?', options: ['Sporten', 'Naar het strand of de markt gaan', 'Naar de film gaan'], correctIndex: 1, explanation: 'O texto diz “Op zaterdag ga ik vaak naar het strand of naar de markt”.',
      },
      {
        id: 'nl-a1-r4', section: 'reading', passage: 'Hoi. Ik ben Sam. Ik kom uit Utrecht. Ik werk in een boekwinkel. Op zaterdag ga ik vaak naar het strand of naar de markt. Ik hou van kaas en brood.',
        question: 'Waarvan houdt Sam?', options: ['Kaas en brood', 'Vis en vlees', 'Groente'], correctIndex: 0, explanation: 'O texto diz “Ik hou van kaas en brood”.',
      },
      {
        id: 'nl-a1-a1', section: 'listening', audioText: 'De vergadering begint om half drie.',
        question: 'Hoe laat begint de vergadering?', options: ['Om drie uur', 'Om half drie', 'Om twee uur'], correctIndex: 1, explanation: '“Om half drie” = às duas e meia.',
      },
      {
        id: 'nl-a1-a2', section: 'listening', audioText: 'Ik wil graag een koffie met melk.',
        question: 'Wat bestelt de klant?', options: ['Koffie met melk', 'Thee', 'Espresso'], correctIndex: 0, explanation: 'Ouviu-se “een koffie met melk”.',
      },
      {
        id: 'nl-a1-a3', section: 'listening', audioText: 'De bibliotheek sluit om zes uur.',
        question: 'Hoe laat sluit de bibliotheek?', options: ['Om vijf uur', 'Om zes uur', 'Om zeven uur'], correctIndex: 1, explanation: '“Om zes uur” = às seis.',
      },
      {
        id: 'nl-a1-v1', section: 'vocabulary', question: 'Welk woord betekent “obrigado”?', options: ['alsjeblieft', 'bedankt', 'graag'], correctIndex: 1, explanation: '“Bedankt” = obrigado.',
      },
      {
        id: 'nl-a1-v2', section: 'vocabulary', question: 'Kies de juiste vraag: “_____ heet je?”', options: ['Waarom', 'Hoe', 'Wanneer'], correctIndex: 1, explanation: '“Hoe heet je?” = Como te chamas?',
      },
      {
        id: 'nl-a1-v3', section: 'vocabulary', question: 'Waar koop je een boek?', options: ['Bij de slager', 'In de boekhandel', 'Bij de bakker'], correctIndex: 1, explanation: 'Livros compram-se na livraria (boekhandel).',
      },
    ],
  },
  /* ------------------------------ French A1 ------------------------------- */
  {
    id: 'fr-a1',
    languageId: 'fr',
    level: 'A1',
    title: 'Simulado A1 · Français',
    description: 'Lecture, écoute et vocabulaire — niveau A1.',
    durationMinutes: 10,
    passPercent: 60,
    questions: [
      {
        id: 'fr-a1-r1', section: 'reading', passage: 'Bonjour. Je m’appelle Léa. Je viens de Lyon. Je travaille dans une boulangerie près du marché. Le dimanche, je vais chez mes grands-parents. J’aime beaucoup la musique et le théâtre.',
        question: 'D’où vient Léa ?', options: ['Paris', 'Lyon', 'Marseille'], correctIndex: 1, explanation: 'O texto diz “Je viens de Lyon”.',
      },
      {
        id: 'fr-a1-r2', section: 'reading', passage: 'Bonjour. Je m’appelle Léa. Je viens de Lyon. Je travaille dans une boulangerie près du marché. Le dimanche, je vais chez mes grands-parents. J’aime beaucoup la musique et le théâtre.',
        question: 'Où travaille Léa ?', options: ['Dans une école', 'Dans une boulangerie', 'Dans un hôpital'], correctIndex: 1, explanation: 'O texto diz “Je travaille dans une boulangerie”.',
      },
      {
        id: 'fr-a1-r3', section: 'reading', passage: 'Bonjour. Je m’appelle Léa. Je viens de Lyon. Je travaille dans une boulangerie près du marché. Le dimanche, je vais chez mes grands-parents. J’aime beaucoup la musique et le théâtre.',
        question: 'Que fait Léa le dimanche ?', options: ['Elle va au cinéma', 'Elle visite ses grands-parents', 'Elle travaille'], correctIndex: 1, explanation: 'O texto diz “Le dimanche, je vais chez mes grands-parents”.',
      },
      {
        id: 'fr-a1-r4', section: 'reading', passage: 'Bonjour. Je m’appelle Léa. Je viens de Lyon. Je travaille dans une boulangerie près du marché. Le dimanche, je vais chez mes grands-parents. J’aime beaucoup la musique et le théâtre.',
        question: 'Qu’est-ce que Léa aime ?', options: ['La musique et le théâtre', 'Le sport', 'La cuisine'], correctIndex: 0, explanation: 'O texto diz “J’aime beaucoup la musique et le théâtre”.',
      },
      {
        id: 'fr-a1-a1', section: 'listening', audioText: 'Le train part à dix heures moins le quart.',
        question: 'À quelle heure part le train ?', options: ['10h15', '9h45', '10h00'], correctIndex: 1, explanation: '“Dix heures moins le quart” = 9h45.',
      },
      {
        id: 'fr-a1-a2', section: 'listening', audioText: 'Je voudrais un jus d’orange, s’il vous plaît.',
        question: 'Que commande le client ?', options: ['Un café', 'Un jus d’orange', 'Un thé'], correctIndex: 1, explanation: 'Ouviu-se “un jus d’orange”.',
      },
      {
        id: 'fr-a1-a3', section: 'listening', audioText: 'La pharmacie est fermée le lundi matin.',
        question: 'Quand la pharmacie est-elle fermée ?', options: ['Le lundi matin', 'Le dimanche après-midi', 'Le samedi soir'], correctIndex: 0, explanation: '“Fermée le lundi matin”.',
      },
      {
        id: 'fr-a1-v1', section: 'vocabulary', question: 'Quel mot veut dire “obrigado” ?', options: ['merci', 'bonjour', 'au revoir'], correctIndex: 0, explanation: '“Merci” = obrigado.',
      },
      {
        id: 'fr-a1-v2', section: 'vocabulary', question: 'Choisis la bonne question : “_____ t’appelles-tu ?”', options: ['Comment', 'Qui', 'Où'], correctIndex: 0, explanation: '“Comment t’appelles-tu ?” = Como te chamas?',
      },
      {
        id: 'fr-a1-v3', section: 'vocabulary', question: 'Où achète-t-on du pain ?', options: ['À la boucherie', 'À la boulangerie', 'À la pharmacie'], correctIndex: 1, explanation: 'O pão compra-se na padeharia.',
      },
    ],
  },
  /* ------------------------------ German A1 ------------------------------- */
  {
    id: 'de-a1',
    languageId: 'de',
    level: 'A1',
    title: 'Simulado A1 · Deutsch',
    description: 'Lesen, Hören und Wortschatz — Niveau A1.',
    durationMinutes: 10,
    passPercent: 60,
    questions: [
      {
        id: 'de-a1-r1', section: 'reading', passage: 'Hallo. Ich heiße Jonas. Ich komme aus Hamburg. Ich arbeite bei einer Bank am Hafen. Am Wochenende gehe ich oft ins Kino oder schwimme im Hallenbad. Ich esse gern Fisch und Kartoffeln.',
        question: 'Woher kommt Jonas?', options: ['Berlin', 'Hamburg', 'München'], correctIndex: 1, explanation: 'O texto diz “Ich komme aus Hamburg”.',
      },
      {
        id: 'de-a1-r2', section: 'reading', passage: 'Hallo. Ich heiße Jonas. Ich komme aus Hamburg. Ich arbeite bei einer Bank am Hafen. Am Wochenende gehe ich oft ins Kino oder schwimme im Hallenbad. Ich esse gern Fisch und Kartoffeln.',
        question: 'Wo arbeitet Jonas?', options: ['Im Krankenhaus', 'Bei einer Bank', 'In einer Schule'], correctIndex: 1, explanation: 'O texto diz “Ich arbeite bei einer Bank”.',
      },
      {
        id: 'de-a1-r3', section: 'reading', passage: 'Hallo. Ich heiße Jonas. Ich komme aus Hamburg. Ich arbeite bei einer Bank am Hafen. Am Wochenende gehe ich oft ins Kino oder schwimme im Hallenbad. Ich esse gern Fisch und Kartoffeln.',
        question: 'Was macht Jonas am Wochenende?', options: ['Kino oder Schwimmen', 'Wandern', 'Lesen'], correctIndex: 0, explanation: 'O texto diz “gehe ich oft ins Kino oder schwimme”.',
      },
      {
        id: 'de-a1-r4', section: 'reading', passage: 'Hallo. Ich heiße Jonas. Ich komme aus Hamburg. Ich arbeite bei einer Bank am Hafen. Am Wochenende gehe ich oft ins Kino oder schwimme im Hallenbad. Ich esse gern Fisch und Kartoffeln.',
        question: 'Was isst Jonas gern?', options: ['Pizza', 'Fisch und Kartoffeln', 'Salat'], correctIndex: 1, explanation: 'O texto diz “Ich esse gern Fisch und Kartoffeln”.',
      },
      {
        id: 'de-a1-a1', section: 'listening', audioText: 'Der Zug nach Frankfurt fährt um vierzehn Uhr fünfzehn ab.',
        question: 'Um wie viel Uhr fährt der Zug?', options: ['14.15 Uhr', '15.15 Uhr', '13.45 Uhr'], correctIndex: 0, explanation: '“Vierzehn Uhr fünfzehn” = 14.15.',
      },
      {
        id: 'de-a1-a2', section: 'listening', audioText: 'Ich hätte gern ein Wasser ohne Kohlensäure.',
        question: 'Was bestellt der Gast?', options: ['Einen Kaffee', 'Ein Wasser', 'Ein Bier'], correctIndex: 1, explanation: 'Ouviu-se “ein Wasser ohne Kohlensäure”.',
      },
      {
        id: 'de-a1-a3', section: 'listening', audioText: 'Das Museum ist montags geschlossen.',
        question: 'Wann ist das Museum geschlossen?', options: ['Montags', 'Samstags', 'Sonntags'], correctIndex: 0, explanation: '“Montags geschlossen” = fechado às segundas.',
      },
      {
        id: 'de-a1-v1', section: 'vocabulary', question: 'Welches Wort bedeutet “obrigado”?', options: ['bitte', 'danke', 'Hallo'], correctIndex: 1, explanation: '“Danke” = obrigado.',
      },
      {
        id: 'de-a1-v2', section: 'vocabulary', question: 'Wähle die richtige Frage: “_____ heißt du?”', options: ['Wie', 'Wo', 'Was'], correctIndex: 0, explanation: '“Wie heißt du?” = Como te chamas?',
      },
      {
        id: 'de-a1-v3', section: 'vocabulary', question: 'Wo kauft man Briefmarken?', options: ['Beim Bäcker', 'Bei der Post', 'Im Kino'], correctIndex: 1, explanation: 'Selos compram-se nos correios (die Post).',
      },
    ],
  },
  /* ------------------------------ Italian A1 ------------------------------ */
  {
    id: 'it-a1',
    languageId: 'it',
    level: 'A1',
    title: 'Simulado A1 · Italiano',
    description: 'Lettura, ascolto e lessico — livello A1.',
    durationMinutes: 10,
    passPercent: 60,
    questions: [
      {
        id: 'it-a1-r1', section: 'reading', passage: 'Ciao. Mi chiamo Giulia. Vengo da Firenze. Lavoro in un negozio di scarpe vicino alla stazione. La domenica vado al mercato con mia madre. Il mio cibo preferito è la pizza margherita.',
        question: 'Da dove viene Giulia?', options: ['Roma', 'Firenze', 'Milano'], correctIndex: 1, explanation: 'O texto diz “Vengo da Firenze”.',
      },
      {
        id: 'it-a1-r2', section: 'reading', passage: 'Ciao. Mi chiamo Giulia. Vengo da Firenze. Lavoro in un negozio di scarpe vicino alla stazione. La domenica vado al mercato con mia madre. Il mio cibo preferito è la pizza margherita.',
        question: 'Dove lavora Giulia?', options: ['In un ristorante', 'In un negozio di scarpe', 'In una banca'], correctIndex: 1, explanation: 'O texto diz “Lavoro in un negozio di scarpe”.',
      },
      {
        id: 'it-a1-r3', section: 'reading', passage: 'Ciao. Mi chiamo Giulia. Vengo da Firenze. Lavoro in un negozio di scarpe vicino alla stazione. La domenica vado al mercato con mia madre. Il mio cibo preferito è la pizza margherita.',
        question: 'Cosa fa Giulia la domenica?', options: ['Va al mercato', 'Va in palestra', 'Studia'], correctIndex: 0, explanation: 'O texto diz “La domenica vado al mercato con mia madre”.',
      },
      {
        id: 'it-a1-r4', section: 'reading', passage: 'Ciao. Mi chiamo Giulia. Vengo da Firenze. Lavoro in un negozio di scarpe vicino alla stazione. La domenica vado al mercato con mia madre. Il mio cibo preferito è la pizza margherita.',
        question: 'Qual è il cibo preferito di Giulia?', options: ['La pasta', 'La pizza margherita', 'Il risotto'], correctIndex: 1, explanation: 'O texto diz “Il mio cibo preferito è la pizza margherita”.',
      },
      {
        id: 'it-a1-a1', section: 'listening', audioText: 'Il treno per Napoli parte alle nove e mezza.',
        question: 'A che ora parte il treno?', options: ['Alle nove e un quarto', 'Alle nove e mezza', 'Alle dieci e mezza'], correctIndex: 1, explanation: '“Nove e mezza” = 9:30.',
      },
      {
        id: 'it-a1-a2', section: 'listening', audioText: 'Vorrei un espresso, per favore.',
        question: 'Cosa ordina il cliente?', options: ['Un espresso', 'Un cappuccino', 'Un tè'], correctIndex: 0, explanation: 'Ouviu-se “un espresso”.',
      },
      {
        id: 'it-a1-a3', section: 'listening', audioText: 'La biblioteca chiude alle otto di sera.',
        question: 'A che ora chiude la biblioteca?', options: ['Alle sei', 'Alle sette', 'Alle otto'], correctIndex: 2, explanation: '“Chiude alle otto di sera”.',
      },
      {
        id: 'it-a1-v1', section: 'vocabulary', question: 'Quale parola significa “obrigado”?', options: ['prego', 'grazie', 'ciao'], correctIndex: 1, explanation: '“Grazie” = obrigado.',
      },
      {
        id: 'it-a1-v2', section: 'vocabulary', question: 'Scegli la domanda giusta: “_____ ti chiami?”', options: ['Come', 'Dove', 'Perché'], correctIndex: 0, explanation: '“Come ti chiami?” = Como te chamas?',
      },
      {
        id: 'it-a1-v3', section: 'vocabulary', question: 'Dove compri la frutta?', options: ['Al mercato', 'Al bar', 'In farmacia'], correctIndex: 0, explanation: 'A fruta compra-se no mercado.',
      },
    ],
  },
  /* ------------------------------ English A2 ------------------------------ */
  {
    id: 'en-a2',
    languageId: 'en',
    level: 'A2',
    title: 'Simulado A2 · Inglês',
    description: 'Leitura, audição e vocabulário — o essencial do nível A2 (passado, planos, saúde, opinião).',
    durationMinutes: 15,
    passPercent: 60,
    questions: [
      {
        id: 'en-a2-r1', section: 'reading', passage: 'Hi Sam,\nIt’s Maria. Thanks for your message about Saturday. I’m working in the morning, but I finish at one.\nIn the afternoon we can meet at the new Italian restaurant near the station — let’s say two o’clock. We should book a table because it’s usually busy.\nIf you can’t come, call me before ten. See you!',
        question: 'What does Maria do on Saturday morning?', options: ['She works', 'She studies', 'She travels to London'], correctIndex: 0, explanation: '“I’m working in the morning, but I finish at one.”',
      },
      {
        id: 'en-a2-r2', section: 'reading', passage: 'Hi Sam,\nIt’s Maria. Thanks for your message about Saturday. I’m working in the morning, but I finish at one.\nIn the afternoon we can meet at the new Italian restaurant near the station — let’s say two o’clock. We should book a table because it’s usually busy.\nIf you can’t come, call me before ten. See you!',
        question: 'What time can they meet?', options: ['At one o’clock', 'At two o’clock', 'At ten o’clock'], correctIndex: 1, explanation: '“Let’s say two o’clock.”',
      },
      {
        id: 'en-a2-r3', section: 'reading', passage: 'Hi Sam,\nIt’s Maria. Thanks for your message about Saturday. I’m working in the morning, but I finish at one.\nIn the afternoon we can meet at the new Italian restaurant near the station — let’s say two o’clock. We should book a table because it’s usually busy.\nIf you can’t come, call me before ten. See you!',
        question: 'Where does Maria suggest meeting?', options: ['At her office', 'At the station', 'At the Italian restaurant near the station'], correctIndex: 2, explanation: '“We can meet at the new Italian restaurant near the station.”',
      },
      {
        id: 'en-a2-r4', section: 'reading', passage: 'Hi Sam,\nIt’s Maria. Thanks for your message about Saturday. I’m working in the morning, but I finish at one.\nIn the afternoon we can meet at the new Italian restaurant near the station — let’s say two o’clock. We should book a table because it’s usually busy.\nIf you can’t come, call me before ten. See you!',
        question: 'Why does Maria suggest booking a table?', options: ['Because the restaurant is usually busy', 'Because it is expensive', 'Because it closes early'], correctIndex: 0, explanation: '“We should book a table because it’s usually busy.”',
      },
      {
        id: 'en-a2-r5', section: 'reading', passage: 'Hi Sam,\nIt’s Maria. Thanks for your message about Saturday. I’m working in the morning, but I finish at one.\nIn the afternoon we can meet at the new Italian restaurant near the station — let’s say two o’clock. We should book a table because it’s usually busy.\nIf you can’t come, call me before ten. See you!',
        question: 'What should Sam do if he can’t come?', options: ['Send an email on Sunday', 'Call Maria before ten', 'Book a table for three'], correctIndex: 1, explanation: '“If you can’t come, call me before ten.”',
      },
      {
        id: 'en-a2-r6', section: 'reading', passage: 'Hi Sam,\nIt’s Maria. Thanks for your message about Saturday. I’m working in the morning, but I finish at one.\nIn the afternoon we can meet at the new Italian restaurant near the station — let’s say two o’clock. We should book a table because it’s usually busy.\nIf you can’t come, call me before ten. See you!',
        question: 'Who writes the message?', options: ['Sam', 'Maria’s mother', 'Maria'], correctIndex: 2, explanation: 'A mensagem começa com “It’s Maria.”',
      },
      {
        id: 'en-a2-a1', section: 'listening', audioText: 'Excuse me, could you tell me where the nearest pharmacy is? It’s on the corner of King Street, next to the bank.',
        question: 'Where is the pharmacy?', options: ['Next to the bank, on King Street', 'Behind the station', 'Inside the library'], correctIndex: 0, explanation: '“On the corner of King Street, next to the bank.”',
      },
      {
        id: 'en-a2-a2', section: 'listening', audioText: 'The library will be closed next Monday because of a holiday. It opens again on Tuesday at nine.',
        question: 'When does the library reopen?', options: ['On Monday at nine', 'On Tuesday at nine', 'On Sunday at ten'], correctIndex: 1, explanation: '“It opens again on Tuesday at nine.”',
      },
      {
        id: 'en-a2-a3', section: 'listening', audioText: 'I usually go jogging in the park before breakfast, but today it’s raining, so I’ll stay home.',
        question: 'Why will the speaker stay home today?', options: ['Because she is tired', 'Because the park is closed', 'Because it is raining'], correctIndex: 2, explanation: '“Today it’s raining, so I’ll stay home.”',
      },
      {
        id: 'en-a2-a4', section: 'listening', audioText: 'Our neighbourhood gym has a swimming pool. Membership is twenty-five euros a month and includes all classes.',
        question: 'How much is the membership?', options: ['Fifteen euros a month', 'Twenty-five euros a month', 'Fifty euros a month'], correctIndex: 1, explanation: '“Membership is twenty-five euros a month.”',
      },
      {
        id: 'en-a2-a5', section: 'listening', audioText: 'Could you turn the music down, please? I’m trying to study for my exam and I can’t concentrate.',
        question: 'What does the speaker want?', options: ['The music to be turned down', 'To borrow some notes', 'To study together'], correctIndex: 0, explanation: '“Could you turn the music down, please?”',
      },
      {
        id: 'en-a2-v1', section: 'vocabulary', question: 'Which word means “marcação”?', options: ['deadline', 'budget', 'appointment'], correctIndex: 2, explanation: '“Appointment” = marcação / compromisso marcado.',
      },
      {
        id: 'en-a2-v2', section: 'vocabulary', question: 'Choose the correct question: “_____ did you finish work yesterday?”', options: ['Why', 'When', 'Who'], correctIndex: 1, explanation: 'Pergunta sobre tempo: “When did you finish work?”',
      },
      {
        id: 'en-a2-v3', section: 'vocabulary', question: 'Which word is the opposite of “expensive”?', options: ['cheap', 'big', 'slow'], correctIndex: 0, explanation: '“Cheap” = barato — oposto de caro.',
      },
      {
        id: 'en-a2-v4', section: 'vocabulary', question: 'Where can you exercise and use a swimming pool?', options: ['At the bakery', 'At the library', 'At the gym'], correctIndex: 2, explanation: 'Ginásio (gym) com piscina (swimming pool).',
      },
    ],
  },
  /* ------------------------------ Spanish A2 ------------------------------ */
  {
    id: 'es-a2',
    languageId: 'es',
    level: 'A2',
    title: 'Simulado A2 · Español',
    description: 'Comprensión lectora, auditiva y vocabulario — nivel A2 (pasado, planes, salud, opinión).',
    durationMinutes: 15,
    passPercent: 60,
    questions: [
      {
        id: 'es-a2-r1', section: 'reading', passage: 'Hola, Marta:\nGracias por tu mensaje sobre el sábado. Por la mañana trabajo, pero termino a la una.\nPor la tarde podemos vernos en el restaurante italiano que hay cerca de la estación — digamos a las dos. Deberíamos reservar mesa porque suele estar lleno.\nSi no puedes venir, llámame antes de las diez. ¡Hasta pronto!',
        question: '¿Qué hace la persona que escribe por la mañana?', options: ['Trabaja', 'Estudia', 'Viaja a Madrid'], correctIndex: 0, explanation: '“Por la mañana trabajo, pero termino a la una.”',
      },
      {
        id: 'es-a2-r2', section: 'reading', passage: 'Hola, Marta:\nGracias por tu mensaje sobre el sábado. Por la mañana trabajo, pero termino a la una.\nPor la tarde podemos vernos en el restaurante italiano que hay cerca de la estación — digamos a las dos. Deberíamos reservar mesa porque suele estar lleno.\nSi no puedes venir, llámame antes de las diez. ¡Hasta pronto!',
        question: '¿A qué hora pueden verse?', options: ['A la una', 'A las dos', 'A las diez'], correctIndex: 1, explanation: '“Digamos a las dos.”',
      },
      {
        id: 'es-a2-r3', section: 'reading', passage: 'Hola, Marta:\nGracias por tu mensaje sobre el sábado. Por la mañana trabajo, pero termino a la una.\nPor la tarde podemos vernos en el restaurante italiano que hay cerca de la estación — digamos a las dos. Deberíamos reservar mesa porque suele estar lleno.\nSi no puedes venir, llámame antes de las diez. ¡Hasta pronto!',
        question: '¿Dónde sugiere verse?', options: ['En su oficina', 'En la estación', 'En el restaurante italiano cerca de la estación'], correctIndex: 2, explanation: '“Podemos vernos en el restaurante italiano que hay cerca de la estación.”',
      },
      {
        id: 'es-a2-r4', section: 'reading', passage: 'Hola, Marta:\nGracias por tu mensaje sobre el sábado. Por la mañana trabajo, pero termino a la una.\nPor la tarde podemos vernos en el restaurante italiano que hay cerca de la estación — digamos a las dos. Deberíamos reservar mesa porque suele estar lleno.\nSi no puedes venir, llámame antes de las diez. ¡Hasta pronto!',
        question: '¿Por qué sugiere reservar mesa?', options: ['Porque suele estar lleno', 'Porque es caro', 'Porque cierra pronto'], correctIndex: 0, explanation: '“Deberíamos reservar mesa porque suele estar lleno.”',
      },
      {
        id: 'es-a2-r5', section: 'reading', passage: 'Hola, Marta:\nGracias por tu mensaje sobre el sábado. Por la mañana trabajo, pero termino a la una.\nPor la tarde podemos vernos en el restaurante italiano que hay cerca de la estación — digamos a las dos. Deberíamos reservar mesa porque suele estar lleno.\nSi no puedes venir, llámame antes de las diez. ¡Hasta pronto!',
        question: '¿Qué debe hacer Marta si no puede venir?', options: ['Enviar un email el domingo', 'Llamar antes de las diez', 'Reservar mesa para tres'], correctIndex: 1, explanation: '“Si no puedes venir, llámame antes de las diez.”',
      },
      {
        id: 'es-a2-r6', section: 'reading', passage: 'Hola, Marta:\nGracias por tu mensaje sobre el sábado. Por la mañana trabajo, pero termino a la una.\nPor la tarde podemos vernos en el restaurante italiano que hay cerca de la estación — digamos a las dos. Deberíamos reservar mesa porque suele estar lleno.\nSi no puedes venir, llámame antes de las diez. ¡Hasta pronto!',
        question: '¿Quién escribe el mensaje?', options: ['Marta', 'La madre de Marta', 'Una amiga que trabaja por la mañana'], correctIndex: 2, explanation: 'Quem escreve trabalha de manhã e termina à uma — não é a Marta, que recebe a mensagem.',
      },
      {
        id: 'es-a2-a1', section: 'listening', audioText: 'Perdone, ¿dónde está la farmacia más cercana? Está en la esquina de la calle Mayor, al lado del banco.',
        question: '¿Dónde está la farmacia?', options: ['En la esquina de la calle Mayor, al lado del banco', 'Detrás de la estación', 'Dentro de la biblioteca'], correctIndex: 0, explanation: '“Está en la esquina de la calle Mayor, al lado del banco.”',
      },
      {
        id: 'es-a2-a2', section: 'listening', audioText: 'La biblioteca estará cerrada el lunes que viene por fiesta. Vuelve a abrir el martes a las nueve.',
        question: '¿Cuándo vuelve a abrir la biblioteca?', options: ['El lunes a las nueve', 'El martes a las nueve', 'El domingo a las diez'], correctIndex: 1, explanation: '“Vuelve a abrir el martes a las nueve.”',
      },
      {
        id: 'es-a2-a3', section: 'listening', audioText: 'Normalmente corro por el parque antes de desayunar, pero hoy llueve y me quedo en casa.',
        question: '¿Por qué se queda en casa hoy?', options: ['Porque está cansada', 'Porque el parque está cerrado', 'Porque llueve'], correctIndex: 2, explanation: '“Hoy llueve y me quedo en casa.”',
      },
      {
        id: 'es-a2-a4', section: 'listening', audioText: 'Nuestro gimnasio del barrio tiene piscina. La cuota es de veinticinco euros al mes e incluye todas las clases.',
        question: '¿Cuánto cuesta la cuota?', options: ['Quince euros al mes', 'Veinticinco euros al mes', 'Cincuenta euros al mes'], correctIndex: 1, explanation: '“La cuota es de veinticinco euros al mes.”',
      },
      {
        id: 'es-a2-a5', section: 'listening', audioText: '¿Puedes bajar la música, por favor? Estoy estudiando para el examen y no me puedo concentrar.',
        question: '¿Qué quiere la persona?', options: ['Que bajen la música', 'Pedir prestados unos apuntes', 'Estudiar juntos'], correctIndex: 0, explanation: '“¿Puedes bajar la música, por favor?”',
      },
      {
        id: 'es-a2-v1', section: 'vocabulary', question: '¿Qué palabra significa “marcação / cita”?', options: ['plazo', 'presupuesto', 'cita'], correctIndex: 2, explanation: '“Cita” = marcação / compromisso (cita médica = consulta marcada).',
      },
      {
        id: 'es-a2-v2', section: 'vocabulary', question: 'Elige la pregunta correcta: “¿_____ terminaste el trabajo ayer?”', options: ['Por qué', 'Cuándo', 'Quién'], correctIndex: 1, explanation: 'Pergunta sobre tempo: “¿Cuándo terminaste el trabajo?”',
      },
      {
        id: 'es-a2-v3', section: 'vocabulary', question: '¿Cuál es el contrario de “caro”?', options: ['barato', 'grande', 'lento'], correctIndex: 0, explanation: '“Barato” = barato — oposto de caro.',
      },
      {
        id: 'es-a2-v4', section: 'vocabulary', question: '¿Dónde puedes hacer ejercicio y nadar?', options: ['En la panadería', 'En la librería', 'En el gimnasio'], correctIndex: 2, explanation: 'Ginásio (gimnasio) com piscina (piscina).',
      },
    ],
  },
];

/** Todos os simulados disponíveis para a língua (A1 primeiro; A2 quando existe). */
export function examsFor(languageId: LanguageId): SampleExam[] {
  return EXAMS.filter((exam) => exam.languageId === languageId);
}

/** Simulado de um nível específico; por omissão devolve o A1 (compatibilidade). */
export function examFor(languageId: LanguageId, level: SampleExam['level'] = 'A1'): SampleExam | undefined {
  return EXAMS.find((exam) => exam.languageId === languageId && exam.level === level);
}

/** Lê um "N/M" guardado nas tentativas do simulado — devolve null se não for esse formato. */
export function parseExamScore(userAnswer: string | undefined): { correct: number; total: number } | null {
  if (!userAnswer) return null;
  const match = userAnswer.match(/^(\d+)\/(\d+)$/);
  if (!match) return null;
  return { correct: Number(match[1]), total: Number(match[2]) };
}
