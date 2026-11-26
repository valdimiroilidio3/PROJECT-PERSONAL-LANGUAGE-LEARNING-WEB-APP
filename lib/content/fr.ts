import { createLesson, dialogue, fill, listen, match, mc, read, translate, v, word } from './builders';

export const frLessons = [
  createLesson(
    {
      id: 'fr-salutations',
      title: 'Salutations et présentation',
      subtitle: 'Commence une conversation en français',
      objective: 'Saluer, dire son nom et demander comment va l’autre personne.',
      level: 'A1',
      category: 'Conversation',
      minutes: 6,
      xp: 20,
      vocabulary: [
        v('bonjour', 'bom dia / olá', 'Bonjour, je m’appelle Ana.', 'Saudação durante o dia.'),
        v('bonsoir', 'boa noite', 'Bonsoir, comment ça va ?', 'Saudação ao fim do dia.'),
        v('comment ça va ?', 'como estás?', 'Salut, comment ça va ?', 'Pergunta informal.'),
        v('très bien', 'muito bem', 'Très bien, merci.', 'Resposta positiva.'),
        v('merci', 'obrigado', 'Merci beaucoup.', 'Agradecimento.'),
        v('je m’appelle', 'chamo-me', 'Je m’appelle Ana.', 'Apresentação do nome.'),
      ],
    },
    [
      mc('Escolhe a saudação adequada às 8 da manhã.', ['Bonsoir', 'Bonjour', 'Bonne nuit'], 1, '“Bonjour” é usado durante o dia.', 'Bom dia!'),
      translate('Traduz: “O meu nome é Ana.”', ['Je m’appelle Ana', 'Mon nom est Ana'], '“Je m’appelle” é a forma mais natural.'),
      word(['je', 'm’appelle', 'Ana'], 'Je m’appelle Ana', 'Em francês, o pronome reflexivo vem antes do verbo.'),
      match([
        { term: 'bonjour', translation: 'bom dia' },
        { term: 'merci', translation: 'obrigado' },
        { term: 'au revoir', translation: 'adeus' },
      ], 'Associa a expressão francesa ao significado.'),
      dialogue(['Bonjour, je m’appelle Sam.', '____', 'Enchanté, Ana.'], ['Enchanté, je m’appelle Ana.', 'Je suis fatigué.', 'Bonne nuit.'], 0, 'Ao conhecer alguém, responde com “enchanté”.'),
      listen('Bonjour, comment ça va ?', 'O que ouviste?', ['Bonjour, comment ça va ?', 'Bonsoir, comment ça va ?', 'Au revoir, à demain.'], 0, 'A frase começa com “bonjour”.'),
    ],
    'fr',
  ),

  createLesson(
    {
      id: 'fr-nombres',
      title: 'Nombres et heures',
      subtitle: 'Conta e pergunta as horas em francês',
      objective: 'Usar números básicos e perguntar as horas.',
      level: 'A1',
      category: 'Numerais',
      minutes: 6,
      xp: 20,
      vocabulary: [
        v('un', 'um', 'J’ai un livre.', 'Número um.'),
        v('deux', 'dois', 'Il y a deux personnes.', 'Número dois.'),
        v('trois', 'três', 'J’ai trois sœurs.', 'Número três.'),
        v('quelle heure est-il ?', 'que horas são?', 'Excusez-moi, quelle heure est-il ?', 'Pergunta sobre a hora.'),
        v('il est une heure', 'é uma hora', 'Il est une heure.', 'Hora exata.'),
      ],
    },
    [
      mc('Como se diz “três” em francês?', ['un', 'trois', 'deux'], 1, '“Trois” significa três.'),
      fill('J’ai ____ frères.', ['deux'], '“Deux” é o número dois.', 'Tenho dois irmãos.'),
      word(['est', 'il', 'une', 'heure'], 'Il est une heure', 'A ordem é “il est une heure”.'),
      match([
        { term: 'un', translation: 'um' },
        { term: 'deux', translation: 'dois' },
        { term: 'trois', translation: 'três' },
      ], 'Associa cada número ao seu valor.'),
      translate('Traduz: “São duas horas.”', ['Il est deux heures'], 'Depois da uma hora, usa-se “heures” no plural.'),
      read('Bonjour, je m’appelle Léa. J’ai deux frères et une sœur. Il est une heure.', 'Quantos irmãos tem a Léa?', ['Três', 'Dois', 'Um'], 1, 'O texto diz “deux frères et une sœur” — dois irmãos.'),
    ],
    'fr',
  ),
];
