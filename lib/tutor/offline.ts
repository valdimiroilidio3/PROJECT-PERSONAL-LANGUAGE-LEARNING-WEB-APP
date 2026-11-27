import { getScenario } from '@/lib/content';
import { evaluateScenarioAnswer } from '@/lib/practice';
import type { GrammarCorrection, LanguageId, LearnerLevel } from '@/lib/types';
import type { SupportLocale } from './validation';

export interface TutorReply {
  text: string;
  translation: string;
  alternatives: string[];
  corrections: GrammarCorrection[];
}

export type Personality = 'friendly' | 'patient' | 'formal';
export type TutorMode = 'offline' | 'ollama' | 'openai-compatible';

interface OfflineInput {
  languageId?: LanguageId;
  scenarioId: string;
  personality: Personality;
  difficulty: LearnerLevel;
  userText: string;
  turn: number;
  supportLocale?: SupportLocale;
}

/** Lightweight variant adaptation for the built-in scripted replies. */
export function localizePortuguese(text: string, locale: SupportLocale = 'pt-PT'): string {
  if (locale === 'pt-PT') return text;
  return text
    .replace(/conhecer-te/gi, 'conhecer você')
    .replace(/encontrar-te/gi, 'encontrar você')
    .replace(/gostas/gi, 'gosta')
    .replace(/o teu/gi, 'o seu')
    .replace(/a tua/gi, 'a sua')
    .replace(/os teus/gi, 'os seus');
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


const extraScripts: Record<string, { lines: string[]; translations: string[]; followUps: string[] }> = {
  'es-presentarse': {
    lines: ['¡Hola! Soy Nori. ¿Cómo te llamas?', 'Mucho gusto. ¿De dónde eres?', 'Qué bien. ¿Qué te gusta hacer?', 'Genial. Dime algo que quieras practicar.'],
    translations: ['Olá! Sou o Nori. Como te chamas?', 'Prazer em conhecer-te. De onde és?', 'Que bem! O que gostas de fazer?', 'Ótimo! Diz-me algo que queiras praticar.'],
    followUps: ['Me llamo Ana.', 'Soy de Portugal.', 'Me gusta leer.', 'Quiero practicar español.'],
  },
  'nl-introductie': {
    lines: ['Hallo, ik ben Nori. Hoe heet je?', 'Leuk je te ontmoeten. Waar kom je vandaan?', 'Wat leuk! Wat doe je graag?', 'Goed. Waar wil je mee oefenen?'],
    translations: ['Olá, sou o Nori. Como te chamas?', 'Prazer em conhecer-te. De onde és?', 'Que bem! O que gostas de fazer?', 'Ótimo! O que queres praticar?'],
    followUps: ['Ik heet Ana.', 'Ik kom uit Portugal.', 'Ik lees graag.', 'Ik wil Nederlands oefenen.'],
  },
  'fr-se-presenter': {
    lines: ['Bonjour, je suis Nori. Comment tu t’appelles ?', 'Enchanté. D’où viens-tu ?', 'Super. Qu’est-ce que tu aimes faire ?', 'Très bien. Qu’est-ce que tu veux pratiquer ?'],
    translations: ['Olá, sou o Nori. Como te chamas?', 'Prazer em conhecer-te. De onde és?', 'Ótimo! O que gostas de fazer?', 'Muito bem! O que queres praticar?'],
    followUps: ['Je m’appelle Ana.', 'Je viens du Portugal.', 'J’aime lire.', 'Je veux pratiquer le français.'],
  },
  'de-vorstellen': {
    lines: ['Hallo, ich bin Nori. Wie heißt du?', 'Freut mich. Woher kommst du?', 'Schön. Was machst du gern?', 'Gut. Was möchtest du üben?'],
    translations: ['Olá, sou o Nori. Como te chamas?', 'Prazer em conhecer-te. De onde és?', 'Ótimo! O que gostas de fazer?', 'Bem! O que queres praticar?'],
    followUps: ['Ich heiße Ana.', 'Ich komme aus Portugal.', 'Ich lese gern.', 'Ich möchte Deutsch üben.'],
  },
  'it-presentarti': {
    lines: ['Ciao, sono Nori. Come ti chiami?', 'Piacere. Da dove vieni?', 'Bene. Cosa ti piace fare?', 'Ottimo. Cosa vuoi praticare?'],
    translations: ['Olá, sou o Nori. Como te chamas?', 'Prazer em conhecer-te. De onde és?', 'Ótimo! O que gostas de fazer?', 'Ótimo! O que queres praticar?'],
    followUps: ['Mi chiamo Ana.', 'Vengo dal Portogallo.', 'Mi piace leggere.', 'Voglio praticare italiano.'],
  },
  'js-debug': {
    lines: ['Vamos ver esse código.', 'Qual é o tipo da variável depois dessa operação?', 'Boa observação. E se usarmos Number()?', 'Perfeito. Testa agora com console.log().'],
    translations: ['Vamos ver esse código.', 'Qual é o tipo da variável depois dessa operação?', 'Boa observação. E se usarmos Number()?', 'Perfeito. Testa agora com console.log().'],
    followUps: ['O resultado é "23".', 'Porque o + concatena texto.', 'const total = 2 + Number("3");', 'console.log(total);'],
  },
  'py-debug': {
    lines: ['Vamos ver esse código.', 'Que tipo de erro aparece?', 'Boa! Como podes converter o valor?', 'Perfeito. Testa com print().'],
    translations: ['Vamos ver esse código.', 'Que tipo de erro aparece?', 'Boa! Como podes converter o valor?', 'Perfeito. Testa com print().'],
    followUps: ['Aparece um TypeError.', 'Não se pode somar int com str.', 'print(str(5) + "3")', 'print("53")'],
  },
  'es-cafe': {
    lines: ['¡Hola! Bienvenida. ¿Qué te pongo?', 'Perfecto. ¿Quieres algo de comer?', '¿Algo más?', 'Aquí tiene. ¡Que aproveche!'],
    translations: ['Olá! Bem-vinda. O que te sirvo?', 'Perfeito. Queres algo de comer?', 'Mais alguma coisa?', 'Aqui tem. Bom apetite!'],
    followUps: ['Un café, por favor.', 'Quiero una tostada.', 'Nada más, gracias.', '¿Cuánto es?'],
  },
  'nl-winkel': {
    lines: ['Hallo! Waarmee kan ik je helpen?', 'Welke maat zoek je?', 'Welke kleur wil je?', 'Kom mee naar de kassa!'],
    translations: ['Olá! Em que posso ajudar-te?', 'Que tamanho procuras?', 'Que cor queres?', 'Vem comigo à caixa!'],
    followUps: ['Ik zoek maat M.', 'Medium.', 'Ik wil blauw.', 'Wat kost het?'],
  },
  'fr-restaurant': {
    lines: ['Bonsoir ! Bienvenue. Une table ?', 'Voici le menu. Je peux vous conseiller ?', 'Excellent choix. Et comme boisson ?', 'Voici. Bon appétit !'],
    translations: ['Boa noite! Bem-vindo. Uma mesa?', 'Aqui está o menu. Posso aconselhar?', 'Excelente escolha. E para beber?', 'Aqui tem. Bom apetite!'],
    followUps: ['Une table pour deux, s’il vous plaît.', 'Je prends le poisson.', 'Un verre d’eau.', 'L’addition, s’il vous plaît.'],
  },
  'de-bahnhof': {
    lines: ['Guten Tag! Wohin fahren Sie?', 'Einfach oder hin und zurück?', 'Ein Moment… hier ist Ihr Ticket.', 'Gute Fahrt!'],
    translations: ['Bom dia! Para onde vai?', 'Ida ou ida e volta?', 'Um momento… aqui está o seu bilhete.', 'Boa viagem!'],
    followUps: ['Ich fahre nach Lissabon.', 'Einfach, bitte.', 'Was kostet das?', 'Danke schön!'],
  },
  'it-mercato': {
    lines: ['Buongiorno! Cosa desidera?', 'Questi pomodori sono freschi.', 'Sono due euro al chilo.', 'Arrivederci!'],
    translations: ['Bom dia! O que deseja?', 'Estes tomates são frescos.', 'São dois euros por quilo.', 'Até logo!'],
    followUps: ['Vorrei due pomodori.', 'Allora un chilo, per favore.', 'Quanto costa?', 'Grazie, arrivederci.'],
  },
  'js-arrays': {
    lines: ['Vamos olhar esses arrays.', 'O que o map devolve?', 'Certo. E quando é que o filter deixa passar um elemento?', 'Excelente. Escreve o filtro dos pares.'],
    translations: ['Vamos olhar esses arrays.', 'O que o map devolve?', 'Certo. E quando é que o filter deixa passar um elemento?', 'Excelente. Escreve o filtro dos pares.'],
    followUps: ['Devolve [2, 4, 6].', 'map devolve um novo array.', 'Só entram os que passam no teste.', 'nums.filter(n => n % 2 === 0)'],
  },
  'py-ciclos': {
    lines: ['Vamos ver esse ciclo.', 'Quantas vezes o corpo corre?', 'Exato. E o que faz o range?', 'Ótimo. Escreve um for que soma 1 até 10.'],
    translations: ['Vamos ver esse ciclo.', 'Quantas vezes o corpo corre?', 'Exato. E o que faz o range?', 'Ótimo. Escreve um for que soma 1 até 10.'],
    followUps: ['Corre uma vez por elemento.', 'range(3) dá 0, 1, 2.', 'O for repete para cada item.', 'soma = 0\nfor i in range(1, 11):\n    soma += i'],
  },
};

const openersByLanguage: Record<LanguageId, Record<Personality, string>> = {
  en: { friendly: 'Great! ', patient: 'No problem — take your time. ', formal: 'Thank you. ' },
  es: { friendly: '¡Genial! ', patient: 'Tranquilo, tienes tiempo. ', formal: 'Gracias. ' },
  nl: { friendly: 'Goed! ', patient: 'Rustig, neem je tijd. ', formal: 'Dank je. ' },
  fr: { friendly: 'Super ! ', patient: 'Prends ton temps. ', formal: 'Merci. ' },
  de: { friendly: 'Super! ', patient: 'Kein Problem, nimm dir Zeit. ', formal: 'Danke. ' },
  it: { friendly: 'Ottimo! ', patient: 'Tranquillo, prenditi il tuo tempo. ', formal: 'Grazie. ' },
  javascript: { friendly: 'Bom trabalho! ', patient: 'Sem pressa — vamos passo a passo. ', formal: 'Obrigado. ' },
  python: { friendly: 'Bom trabalho! ', patient: 'Sem pressa — vamos passo a passo. ', formal: 'Obrigado. ' },
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

/** Abertura da personagem — a primeira fala da cena, usada quando o aluno entra pela primeira vez. */
export function scenarioOpening(
  scenarioId: string,
  supportLocale: SupportLocale = 'pt-PT',
): TutorReply {
  const script = scripts[scenarioId] ?? extraScripts[scenarioId] ?? scripts.everyday;
  return {
    text: script.lines[0],
    translation: localizePortuguese(script.translations[0], supportLocale),
    alternatives: [],
    corrections: [],
  };
}

export function offlineReply({ languageId = 'en', scenarioId, personality, difficulty, userText, turn, supportLocale = 'pt-PT' }: OfflineInput): TutorReply {
  const scenario = getScenario(scenarioId, languageId);
  const script = scripts[scenarioId] ?? extraScripts[scenarioId] ?? scripts.everyday;
  const index = Math.min(turn, script.lines.length - 1);
  const goodAnswer = scenario ? evaluateScenarioAnswer(userText, scenario.keywords[Math.min(turn, scenario.keywords.length - 1)]) : userText.trim().length > 3;
  const openers = openersByLanguage[languageId] ?? openersByLanguage.en;
  const retryHint: Record<LanguageId, string> = {
    en: 'Let’s try a slightly different way. ',
    es: 'Probemos de otra forma. ',
    nl: 'Laten we het anders proberen. ',
    fr: 'Essayons autrement. ',
    de: 'Versuchen wir es anders. ',
    it: 'Proviamo in un altro modo. ',
    javascript: 'Vamos tentar outra abordagem. ',
    python: 'Vamos tentar outra abordagem. ',
  };
  const encouragement = goodAnswer ? openers[personality] : openers[personality] + (retryHint[languageId] ?? retryHint.en);
  const text = `${encouragement}${script.lines[index]}`;
  const alternatives = [script.followUps[index % script.followUps.length], script.followUps[(index + 1) % script.followUps.length]];
  if (difficulty === 'beginner' && scenario) alternatives.unshift(scenario.modelAnswers[Math.min(turn, scenario.modelAnswers.length - 1)]);

  return {
    text,
    translation: localizePortuguese(script.translations[index], supportLocale),
    alternatives: [...new Set(alternatives)].slice(0, 3),
    corrections: languageId === 'en' ? findCorrections(userText) : [],
  };
}
