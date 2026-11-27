import { createLesson, dialogue, fill, listen, match, mc, read, translate, v, word } from './builders';

export const itLessons = [
  createLesson(
    {
      id: 'it-saluti',
      title: 'Saluti e presentazione',
      subtitle: 'Inizia una conversazione in italiano',
      objective: 'Salutare, dire il proprio nome e chiedere come sta l’altra persona.',
      level: 'A1',
      category: 'Conversazione',
      minutes: 6,
      xp: 20,
      vocabulary: [
        v('ciao', 'olá', 'Ciao, mi chiamo Ana.', 'Saudação informal.'),
        v('buongiorno', 'bom dia', 'Buongiorno, come stai?', 'Usado de manhã.'),
        v('come stai?', 'como estás?', 'Ciao, come stai?', 'Pergunta informal.'),
        v('bene', 'bem', 'Bene, grazie.', 'Resposta curta.'),
        v('grazie', 'obrigado', 'Grazie mille.', 'Agradecimento.'),
        v('mi chiamo', 'chamo-me', 'Mi chiamo Ana.', 'Apresentação do nome.'),
      ],
    },
    [
      mc('Escolhe a saudação adequada às 8 da manhã.', ['Buonanotte', 'Buongiorno', 'Buonasera'], 1, '“Buongiorno” significa bom dia.', 'Bom dia!'),
      translate('Traduz: “O meu nome é Ana.”', ['Mi chiamo Ana', 'Il mio nome è Ana'], '“Mi chiamo” é a forma mais natural.'),
      word(['chiamo', 'mi', 'Ana'], 'Mi chiamo Ana', 'O pronome “mi” vem antes do verbo.'),
      match([
        { term: 'ciao', translation: 'olá' },
        { term: 'grazie', translation: 'obrigado' },
        { term: 'arrivederci', translation: 'adeus' },
      ], 'Associa a expressão italiana ao significado.'),
      dialogue(['Ciao, mi chiamo Sam.', '____', 'Piacere, Ana.'], ['Piacere, mi chiamo Ana.', 'Sono stanco.', 'Buonanotte.'], 0, 'Ao conhecer alguém, diz “piacere”.'),
      listen('Ciao, buongiorno. Come stai?', 'O que ouviste?', ['Ciao, buongiorno. Come stai?', 'Ciao, buonasera. Come stai?', 'Arrivederci, a domani.'], 0, 'A frase começa com “ciao, buongiorno”.'),
    ],
    'it',
  ),

  createLesson(
    {
      id: 'it-numeri',
      title: 'Numeri e ore',
      subtitle: 'Conta e pergunta as horas em italiano',
      objective: 'Usar números básicos e perguntar as horas.',
      level: 'A1',
      category: 'Numerais',
      minutes: 6,
      xp: 20,
      vocabulary: [
        v('uno', 'um', 'Ho uno.', 'Número um.'),
        v('due', 'dois', 'Due persone.', 'Número dois.'),
        v('tre', 'três', 'Tre libri.', 'Número três.'),
        v('che ore sono?', 'que horas são?', 'Scusa, che ore sono?', 'Pergunta sobre a hora.'),
        v('è l’una', 'é uma hora', 'È l’una.', 'Hora exata.'),
      ],
    },
    [
      mc('Como se diz “três” em italiano?', ['uno', 'tre', 'due'], 1, '“Tre” significa três.'),
      fill('Ho ____ fratelli.', ['due'], '“Due” é o número dois.', 'Tenho dois irmãos.'),
      word(['l’una', 'è'], 'È l’una', 'Em italiano, a uma hora usa-se “è l’una”.'),
      match([
        { term: 'uno', translation: 'um' },
        { term: 'due', translation: 'dois' },
        { term: 'tre', translation: 'três' },
      ], 'Associa cada número ao seu valor.'),
      translate('Traduz: “São duas horas.”', ['Sono le due'], 'Depois da uma hora, usa-se “sono le”.'),
      read('Ciao, mi chiamo Mia. Ho due fratelli e una sorella. È l’una.', 'Quantos irmãos tem a Mia?', ['Tre', 'Due', 'Uno'], 1, 'O texto diz “due fratelli”.'),
    ],
    'it',
  ),

  createLesson(
    {
      id: 'it-ristorante',
      title: 'Al ristorante',
      subtitle: 'Pede uma comida num restaurante em italiano',
      objective: 'Pedir uma mesa, encomendar um prato e pedir a conta.',
      level: 'A1',
      category: 'Comida',
      minutes: 6,
      xp: 20,
      vocabulary: [
        v('il menù', 'o menu', 'Ecco il menù.', 'Lista de pratos.'),
        v('un tavolo', 'uma mesa', 'Un tavolo per due, per favore.', 'Pedido de mesa.'),
        v('l’ordinazione', 'o pedido', 'Vorrei fare un’ordinazione.', 'Encomenda.'),
        v('il conto', 'a conta', 'Il conto, per favore.', 'Pedido da conta.'),
        v('il piatto del giorno', 'o prato do dia', 'Qual è il piatto del giorno?', 'Prato do dia.'),
        v('per favore', 'por favor', 'Un caffè, per favore.', 'Forma educada.'),
      ],
    },
    [
      mc('O que significa “il conto”?', ['o menu', 'a conta', 'o prato'], 1, '“Il conto” é a conta do restaurante.'),
      fill('Un tavolo per ____, per favore.', ['due'], '“Due” significa dois.', 'Uma mesa para dois, por favor.'),
      word(['ordinare', 'vorrei'], 'Vorrei ordinare', '“Vorrei” é o condicional de “volere” (queria).'),
      match([
        { term: 'il menù', translation: 'o menu' },
        { term: 'un tavolo', translation: 'uma mesa' },
        { term: 'il conto', translation: 'a conta' },
      ], 'Associa o termo italiano ao significado.'),
      dialogue(['Buonasera, un tavolo per favore?', '____', 'Perfetto, seguitemi.'], ['Un tavolo per due, per favore.', 'Il conto, per favore.', 'Vorrei il menù.'], 0, 'Ao entrar, pede-se a mesa.'),
      read('Giulia: Buonasera. Ecco il menù. Oggi abbiamo pesce e insalata. Cliente: Prendo il pesce, per favore.', 'O que o cliente escolheu?', ['O peixe', 'A salada', 'O café'], 0, 'O cliente diz “Prendo il pesce”.'),
      translate('Traduz: “A conta, por favor.”', ['Il conto, per favore'], 'Forma educada de pedir a conta.'),
    ],
    'it',
  ),
];
