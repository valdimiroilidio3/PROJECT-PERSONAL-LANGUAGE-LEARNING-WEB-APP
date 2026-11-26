import { getScenario } from '@/lib/content/scenarios';
import { evaluateScenarioAnswer } from '@/lib/practice';
import type { GrammarCorrection, LearnerLevel } from '@/lib/types';

export interface TutorReply {
  text: string;
  translation: string;
  alternatives: string[];
  corrections: GrammarCorrection[];
}

export type Personality = 'friendly' | 'patient' | 'formal';
export type TutorMode = 'offline' | 'ollama' | 'openai-compatible';

interface OfflineInput {
  scenarioId: string;
  personality: Personality;
  difficulty: LearnerLevel;
  userText: string;
  turn: number;
}

const scripts: Record<string, { lines: string[]; translations: string[]; followUps: string[] }> = {
  'introduce-yourself': {
    lines: ['Hi! I’m Nori. What’s your name?', 'Nice to meet you. Where are you from?', 'That’s lovely. What do you like doing in your free time?', 'Great! Tell me one thing you want to practise in English.'],
    translations: ['Olá! Sou o Nori. Como te chamas?', 'Prazer em conhecer-te. De onde és?', 'Que bem! O que gostas de fazer no tempo livre?', 'Ótimo! Diz-me uma coisa que queres praticar em inglês.'],
    followUps: ['My name is …', 'I’m from Portugal.', 'I like reading and walking.', 'I want to practise speaking.'],
  },
  'order-food': {
    lines: ['Welcome! What would you like to eat?', 'Good choice. Would you like a drink with that?', 'Of course. Anything else?', 'Here is your food. Enjoy your meal!'],
    translations: ['Bem-vindo! O que gostaria de comer?', 'Boa escolha. Quer uma bebida com isso?', 'Claro. Mais alguma coisa?', 'Aqui está a sua comida. Bom apetite!'],
    followUps: ['I would like a sandwich, please.', 'I’ll have some water.', 'No, thank you.', 'Can I have the bill?'],
  },
  shopping: {
    lines: ['Hello! Can I help you?', 'Of course. What size are you looking for?', 'We have that in blue and black. Which do you prefer?', 'It is 25 euros. Would you like to try it on?'],
    translations: ['Olá! Posso ajudar?', 'Claro. Que tamanho procura?', 'Temos em azul e preto. Qual prefere?', 'Custa 25 euros. Quer experimentar?'],
    followUps: ['I’m looking for a shirt.', 'A medium, please.', 'I prefer the blue one.', 'Yes, please.'],
  },
  directions: {
    lines: ['Hello, how can I help you?', 'The station is near the park. Do you want to walk or take a bus?', 'Go straight and turn left at the corner.', 'You’re welcome! Have a nice day.'],
    translations: ['Olá, como posso ajudar?', 'A estação fica perto do parque. Quer ir a pé ou de autocarro?', 'Siga em frente e vire à esquerda na esquina.', 'De nada! Tenha um bom dia.'],
    followUps: ['Where is the station?', 'I want to walk.', 'Thank you very much.', 'Is it far from here?'],
  },
  airport: {
    lines: ['Good morning. Can I see your booking?', 'Where are you flying today?', 'Do you have any luggage to check in?', 'Your gate is B12. Have a good flight!'],
    translations: ['Bom dia. Posso ver a sua reserva?', 'Para onde vai hoje?', 'Tem bagagem para despachar?', 'A sua porta é B12. Boa viagem!'],
    followUps: ['Yes, here it is.', 'I’m flying to London.', 'Just one suitcase.', 'Which gate is it?'],
  },
  colleagues: {
    lines: ['Hi! How was your weekend?', 'That sounds good. Are you ready for the meeting?', 'I know the week is busy. Let’s keep it simple.', 'Good idea. Let’s talk after lunch.'],
    translations: ['Olá! Como foi o teu fim de semana?', 'Parece bem. Estás pronto para a reunião?', 'Sei que a semana está ocupada. Vamos manter tudo simples.', 'Boa ideia. Vamos falar depois do almoço.'],
    followUps: ['It was great, thanks.', 'Yes, I have my notes.', 'I’m a bit busy today.', 'Let’s catch up later.'],
  },
  'job-interview': {
    lines: ['Good morning. Tell me a little about yourself.', 'Why are you interested in this position?', 'Can you give me an example of a difficult project?', 'Do you have any questions for me?'],
    translations: ['Bom dia. Fale-me um pouco sobre si.', 'Porque está interessado nesta posição?', 'Pode dar-me um exemplo de um projeto difícil?', 'Tem alguma pergunta para mim?'],
    followUps: ['I have three years of experience in support.', 'I enjoy solving problems for people.', 'Yes, I coordinated a team project.', 'What happens next?'],
  },
  everyday: {
    lines: ['Hey! How are you doing?', 'Would you like to meet this weekend?', 'How about Saturday morning at the café?', 'Perfect. I’ll see you there!'],
    translations: ['Olá! Como estás?', 'Queres encontrar-te este fim de semana?', 'Que tal sábado de manhã no café?', 'Perfeito. Vejo-te lá!'],
    followUps: ['I’m fine, thanks.', 'Yes, I’d love to.', 'Saturday morning works for me.', 'See you then!'],
  },
};

const correctionRules: Array<{ pattern: RegExp; original: string; corrected: string; explanation: string }> = [
  { pattern: /\bi am agree\b/i, original: 'I am agree', corrected: 'I agree', explanation: '“Agree” é um verbo: não precisa de “am”.' },
  { pattern: /\bi have (\d+) years\b/i, original: 'I have … years', corrected: 'I am … years old', explanation: 'Para idade, use “I am … years old”.' },
  { pattern: /\bhow much costs\b/i, original: 'How much costs', corrected: 'How much does it cost?', explanation: 'Em perguntas com “does”, o verbo principal fica no infinitivo.' },
  { pattern: /\bi no have\b/i, original: 'I no have', corrected: 'I don’t have', explanation: 'A negação usa o auxiliar “do not / don’t”.' },
  { pattern: /\bcan you to\b/i, original: 'Can you to …', corrected: 'Can you …', explanation: 'Depois de “can”, use o verbo sem “to”.' },
  { pattern: /\bi go to .* yesterday\b/i, original: 'I go … yesterday', corrected: 'I went … yesterday', explanation: 'Com “yesterday”, use o passado simples “went”.' },
  { pattern: /\bi am from in\b/i, original: 'I am from in', corrected: 'I am from', explanation: 'Não precisa de “in” depois de “from”.' },
  { pattern: /\bi would like to (coffee|tea|water|sandwich)\b/i, original: 'I would like to …', corrected: 'I would like …', explanation: 'Depois de “would like”, use o substantivo diretamente: “I would like a coffee”.' },
];

export function findCorrections(text: string): GrammarCorrection[] {
  const corrections = correctionRules
    .filter((rule) => rule.pattern.test(text))
    .slice(0, 2)
    .map((rule) => ({ original: rule.original, corrected: rule.corrected, explanation: rule.explanation }));
  const age = text.match(/\bi have (\d+) years\b/i);
  if (age) {
    const index = corrections.findIndex((item) => item.original === 'I have … years');
    if (index >= 0) corrections[index].corrected = `I am ${age[1]} years old`;
  }
  return corrections;
}

const openers: Record<Personality, string> = {
  friendly: 'Great! ',
  patient: 'No problem — take your time. ',
  formal: 'Thank you. ',
};

export function offlineReply({ scenarioId, personality, difficulty, userText, turn }: OfflineInput): TutorReply {
  const scenario = getScenario(scenarioId);
  const script = scripts[scenarioId] ?? scripts.everyday;
  const index = Math.min(turn, script.lines.length - 1);
  const goodAnswer = scenario ? evaluateScenarioAnswer(userText, scenario.keywords[Math.min(turn, scenario.keywords.length - 1)]) : userText.trim().length > 3;
  const encouragement = goodAnswer ? openers[personality] : openers[personality] + 'Let’s try a slightly different way. ';
  const text = `${encouragement}${script.lines[index]}`;
  const alternatives = [script.followUps[index % script.followUps.length], script.followUps[(index + 1) % script.followUps.length]];
  if (difficulty === 'beginner' && scenario) alternatives.unshift(scenario.modelAnswers[Math.min(turn, scenario.modelAnswers.length - 1)]);

  return {
    text,
    translation: script.translations[index],
    alternatives: [...new Set(alternatives)].slice(0, 3),
    corrections: findCorrections(userText),
  };
}
