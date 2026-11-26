import { createLesson, dialogue, fill, listen, match, mc, read, translate, v, word } from './builders';

export const deLessons = [
  createLesson(
    {
      id: 'de-begruessungen',
      title: 'Begrüßungen und Vorstellen',
      subtitle: 'Beginne ein Gespräch auf Deutsch',
      objective: 'Jemanden begrüßen, den Namen sagen und fragen, wie es geht.',
      level: 'A1',
      category: 'Konversation',
      minutes: 6,
      xp: 20,
      vocabulary: [
        v('hallo', 'olá', 'Hallo, ich heiße Ana.', 'Saudação informal.'),
        v('guten Morgen', 'bom dia', 'Guten Morgen, wie geht’s?', 'Usado de manhã.'),
        v('wie geht’s?', 'como estás?', 'Hallo, wie geht’s?', 'Pergunta informal.'),
        v('gut', 'bem', 'Gut, danke.', 'Resposta curta.'),
        v('danke', 'obrigado', 'Danke schön.', 'Agradecimento.'),
        v('ich heiße', 'chamo-me', 'Ich heiße Ana.', 'Apresentação do nome.'),
      ],
    },
    [
      mc('Escolhe a saudação adequada às 8 da manhã.', ['Guten Abend', 'Guten Morgen', 'Gute Nacht'], 1, '“Guten Morgen” significa bom dia.', 'Bom dia!'),
      translate('Traduz: “O meu nome é Ana.”', ['Ich heiße Ana', 'Mein Name ist Ana'], 'Ambas as formas são naturais em alemão.'),
      word(['heiße', 'ich', 'Ana'], 'Ich heiße Ana', 'Em alemão, o verbo vem antes do nome.'),
      match([
        { term: 'hallo', translation: 'olá' },
        { term: 'danke', translation: 'obrigado' },
        { term: 'auf Wiedersehen', translation: 'adeus' },
      ], 'Associa a expressão alemã ao significado.'),
      dialogue(['Hallo, ich heiße Sam.', '____', 'Freut mich, Ana.'], ['Freut mich, ich heiße Ana.', 'Ich bin müde.', 'Gute Nacht.'], 0, 'Ao conhecer alguém, diz “freut mich”.'),
      listen('Hallo, guten Morgen. Wie geht’s?', 'O que ouviste?', ['Hallo, guten Morgen. Wie geht’s?', 'Hallo, guten Abend. Wie geht’s?', 'Auf Wiedersehen, bis morgen.'], 0, 'A frase começa com “hallo, guten Morgen”.'),
    ],
    'de',
  ),

  createLesson(
    {
      id: 'de-zahlen',
      title: 'Zahlen und Uhrzeit',
      subtitle: 'Conta e pergunta as horas em alemão',
      objective: 'Usar números básicos e perguntar as horas.',
      level: 'A1',
      category: 'Numerais',
      minutes: 6,
      xp: 20,
      vocabulary: [
        v('eins', 'um', 'Ich habe eins.', 'Número um.'),
        v('zwei', 'dois', 'Zwei Personen.', 'Número dois.'),
        v('drei', 'três', 'Drei Bücher.', 'Número três.'),
        v('wie spät ist es?', 'que horas são?', 'Entschuldigung, wie spät ist es?', 'Pergunta sobre a hora.'),
        v('es ist eine Uhr', 'é uma hora', 'Es ist eine Uhr.', 'Hora exata.'),
      ],
    },
    [
      mc('Como se diz “três” em alemão?', ['eins', 'drei', 'zwei'], 1, '“Drei” significa três.'),
      fill('Ich habe ____ Brüder.', ['zwei'], '“Zwei” é o número dois.', 'Tenho dois irmãos.'),
      word(['ist', 'es', 'eine', 'Uhr'], 'Es ist eine Uhr', 'A ordem é “es ist eine Uhr”.'),
      match([
        { term: 'eins', translation: 'um' },
        { term: 'zwei', translation: 'dois' },
        { term: 'drei', translation: 'três' },
      ], 'Associa cada número ao seu valor.'),
      translate('Traduz: “São duas horas.”', ['Es ist zwei Uhr'], 'Em alemão, usa-se “es ist” para a hora.'),
      read('Hallo, ich bin Mia. Ich habe zwei Brüder und eine Schwester. Es ist eine Uhr.', 'Quantos irmãos tem a Mia?', ['Drei', 'Zwei', 'Eins'], 1, 'O texto diz “zwei Brüder”.'),
    ],
    'de',
  ),
];
