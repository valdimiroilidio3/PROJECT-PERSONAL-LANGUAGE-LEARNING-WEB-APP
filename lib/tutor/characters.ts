/**
 * Personagens das situações do tutor por voz.
 * Os tutores interpretam a outra pessoa da cena (como num roleplay real).
 * Os nomes são os mesmos em todas as línguas — cada língua mantém as suas linhas.
 */

export interface ScenarioCharacter {
  name: string;
  /** Quem é, na cena — mostrado na interface (português). */
  role: string;
  /** Contexto curto para o modelo de IA manter a personagem. */
  backstory: string;
  emoji: string;
}

const introduce = {
  name: 'Nori',
  role: 'a mascote do Lumio, que quer conhecer-te',
  backstory: 'the Lumio mascot making warm small talk to help the learner practise introductions',
  emoji: '🤖',
};

const CHARACTERS: Record<string, ScenarioCharacter> = {
  'introduce-yourself': introduce,
  'es-presentarse': introduce,
  'nl-introductie': introduce,
  'fr-se-presenter': introduce,
  'de-vorstellen': introduce,
  'it-presentarti': introduce,
  'order-food': {
    name: 'Maya',
  role: 'a espera do restaurante La Mesa',
    backstory: 'a waiter at the busy family restaurant La Mesa; friendly, organised, knows the menu by heart and handles the bill at the end',
    emoji: '🍽️',
  },
  shopping: {
    name: 'Tomás',
    role: 'o empregado da loja',
    backstory: 'a clothing-store assistant; asks sizes and colours, suggests items and handles the till',
    emoji: '👕',
  },
  directions: {
    name: 'Rui',
    role: 'o morador que conhece a zona',
    backstory: 'a local resident on an evening walk; explains how to reach the station, the park and nearby cafés, on foot or by bus',
    emoji: '🗺️',
  },
  airport: {
    name: 'Sofia',
    role: 'a agente de check-in no balcão',
    backstory: 'a check-in agent at a busy airport; verifies booking and luggage, assigns baggage allowance and announces the gate',
    emoji: '✈️',
  },
  colleagues: {
    name: 'Leo',
    role: 'o teu colega de equipa',
    backstory: 'a teammate catching up before the weekly meeting; informal, direct, good humoured, mostly interested in getting through the agenda',
    emoji: '💼',
  },
  'job-interview': {
    name: 'Dr.ª Campos',
    role: 'a recrutadora',
    backstory: 'an HR recruiter interviewing for a customer-support role; professional, fair, asks one opening question at a time and references concrete examples',
    emoji: '🗂️',
  },
  everyday: {
    name: 'Ana',
    role: 'a tua amiga',
    backstory: 'a close friend planning the weekend; casual tone, short sentences, warm and direct',
    emoji: '☕',
  },
  'es-cafe': {
    name: 'Lucía',
    role: 'a empregada do café La Esquina',
    backstory: 'the barista at the neighbourhood café La Esquina; takes orders, suggests the toast special and chats about the morning rush',
    emoji: '☕',
  },
  'nl-winkel': {
    name: 'Sanne',
    role: 'a vendedora da loja',
    backstory: 'the shop assistant in a clothing shop in Amsterdam; helps with sizes and colours and points to the till',
    emoji: '🛍️',
  },
  'fr-restaurant': {
    name: 'Théo',
    role: 'o empregado do bistrô Chez Théo',
    backstory: 'a waiter at the family bistro Chez Théo; seats guests, recommends the fish of the day and handles the bill at the end',
    emoji: '🍽️',
  },
  'de-bahnhof': {
    name: 'Jonas',
    role: 'o funcionário da bilheteira',
    backstory: 'the ticket clerk at a small German train station; helps with destinations, seat classes, prices and platform announcements',
    emoji: '🚉',
  },
  'it-mercato': {
    name: 'Giulia',
    role: 'a vendedora do mercado',
    backstory: 'a market vendor selling fresh produce; mentions what is fresh today, weighs the tomatoes and quotes the price per kilo',
    emoji: '🍅',
  },
  'js-debug': {
    name: 'Dev Ruiz',
    role: 'a tua colega sénior de programação',
    backstory: 'a senior engineer pair-programming on a tricky JavaScript bug; asks leading questions about types and coercion instead of handing over answers',
    emoji: '👩‍💻',
  },
  'js-arrays': {
    name: 'Dev Ruiz',
    role: 'a tua colega sénior de programação',
    backstory: 'a senior engineer pair-programming on JavaScript array methods; asks what map and filter return instead of handing over answers',
    emoji: '👩‍💻',
  },
  'py-ciclos': {
    name: 'Dev Ruiz',
    role: 'a tua colega sénior de programação',
    backstory: 'a senior engineer pair-programming on Python loops; asks leading questions about range and iteration instead of handing over answers',
    emoji: '👩‍💻',
  },
  'py-debug': {
    name: 'Dev Ruiz',
    role: 'a tua colega sénior de programação',
    backstory: 'a senior engineer pair-programming on a tricky Python error; asks leading questions about types and conversions instead of handing over answers',
    emoji: '👩‍💻',
  },
  'en-networking': {
    name: 'Priya',
    role: 'a gestora de talentos na feira de emprego',
    backstory: 'a talent manager at a busy career fair; chats with candidates, asks what they do and exchanges contact details for follow-up',
    emoji: '🤝',
  },
  'es-entrevista': {
    name: 'Elena Ruiz',
    role: 'a recrutadora da empresa',
    backstory: 'an HR recruiter interviewing for a customer-support role; professional, warm, asks one opening question at a time and references concrete experience',
    emoji: '🗂️',
  },
  'nl-sollicitatie': {
    name: 'Mark',
    role: 'de recruiter bij het bedrijf',
    backstory: 'an HR recruiter for a Dutch logistics company; professional and concise, asks about experience and motivation',
    emoji: '🗂️',
  },
  'fr-entretien': {
    name: 'Chloé',
    role: 'la recruteuse de l’entreprise',
    backstory: 'an HR recruiter for a French retail company; formal, precise, asks about background and motivation',
    emoji: '🗂️',
  },
  'de-vorstellungsgespraech': {
    name: 'Hannah',
    role: 'die Recruiterin des Unternehmens',
    backstory: 'an HR recruiter for a German engineering firm; formal, structured, asks about experience and goals',
    emoji: '🗂️',
  },
  'it-colloquio': {
    name: 'Marco',
    role: 'il selezionatore dell’azienda',
    backstory: 'an HR recruiter for an Italian design studio; professional and encouraging, asks about portfolio and experience',
    emoji: '🗂️',
  },
};

/** Personagem da situação — com recurso a um par de conversa genérico para ids desconhecidos. */
export function characterFor(scenarioId: string): ScenarioCharacter {
  return (
    CHARACTERS[scenarioId] ?? {
      name: 'Alex',
      role: 'a pessoa com quem praticas',
      backstory: 'a patient conversation partner in a realistic everyday situation',
      emoji: '💬',
    }
  );
}

/** Nomes únicos de personagens (útil para testes e documentação). */
export function characterIds(): string[] {
  return Object.keys(CHARACTERS);
}
