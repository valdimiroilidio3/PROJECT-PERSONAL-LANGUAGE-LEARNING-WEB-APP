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
  'js-debug': {
    name: 'Dev Ruiz',
    role: 'a tua colega sénior de programação',
    backstory: 'a senior engineer pair-programming on a tricky JavaScript bug; asks leading questions about types and coercion instead of handing over answers',
    emoji: '👩‍💻',
  },
  'py-debug': {
    name: 'Dev Ruiz',
    role: 'a tua colega sénior de programação',
    backstory: 'a senior engineer pair-programming on a tricky Python error; asks leading questions about types and conversions instead of handing over answers',
    emoji: '👩‍💻',
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
