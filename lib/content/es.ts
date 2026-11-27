import { createLesson, dialogue, fill, listen, match, mc, read, sentence, translate, v, word } from './builders';

export const esLessons = [
  createLesson(
    {
      id: 'es-saludos',
      title: 'Saudações e apresentações',
      subtitle: 'Começa uma conversa em espanhol',
      objective: 'Saudar, dizer o nome e perguntar como a outra pessoa está.',
      level: 'A1',
      category: 'Conversação',
      minutes: 6,
      xp: 20,
      vocabulary: [
        v('hola', 'olá', '¡Hola! Me llamo Ana.', 'Saudação informal.'),
        v('buenos días', 'bom dia', 'Buenos días, ¿cómo estás?', 'Usado de manhã.'),
        v('¿Cómo estás?', 'Como estás?', 'Hola, ¿cómo estás?', 'Pergunta sobre o estado.'),
        v('muy bien', 'muito bem', 'Muy bien, gracias.', 'Resposta positiva.'),
        v('gracias', 'obrigado', 'Muchas gracias.', 'Agradecimento.'),
        v('me llamo', 'chamo-me', 'Me llamo Ana.', 'Apresentação do nome.'),
      ],
    },
    [
      mc('Escolhe a saudação adequada às 8 da manhã.', '____, ¿cómo estás?', ['Buenas noches', 'Buenos días', 'Buenas tardes'], 1, '“Buenos días” usa-se de manhã.', 'Bom dia, como estás?'),
      translate('Traduz: “O meu nome é Ana.”', ['Mi nombre es Ana', 'Me llamo Ana'], '“Me llamo” e “Mi nombre es” são ambos naturais.'),
      word(['me', 'llamo', 'Ana'], 'Me llamo Ana', 'Em espanhol, “me llamo” vem antes do nome.'),
      match([
        { term: 'hola', translation: 'olá' },
        { term: 'gracias', translation: 'obrigado' },
        { term: 'adiós', translation: 'adeus' },
      ], 'Associa a palavra espanhola ao significado em português.'),
      dialogue(['¡Hola! Me llamo Sam.', '____', 'Mucho gusto, Ana.'], ['Mucho gusto, me llamo Ana.', 'Estoy cansado.', 'Buenas noches.'], 0, 'Ao conhecer alguém, responde com “mucho gusto”.'),
      listen('Hola, buenos días. ¿Cómo estás?', 'O que ouviste?', ['Hola, buenos días. ¿Cómo estás?', 'Hola, buenas noches. ¿Cómo estás?', 'Adiós, hasta mañana.'], 0, 'A frase começa com “hola, buenos días”.'),
    ],
    'es',
  ),

  createLesson(
    {
      id: 'es-numeros',
      title: 'Números e horas',
      subtitle: 'Conta e pergunta as horas em espanhol',
      objective: 'Usar números básicos e perguntar as horas.',
      level: 'A1',
      category: 'Numerais',
      minutes: 6,
      xp: 20,
      vocabulary: [
        v('uno', 'um', 'Tengo uno.', 'Número um.'),
        v('dos', 'dois', 'Son dos.', 'Número dois.'),
        v('tres', 'três', 'Tres personas.', 'Número três.'),
        v('¿Qué hora es?', 'Que horas são?', 'Perdón, ¿qué hora es?', 'Pergunta sobre a hora.'),
        v('la una', 'uma hora', 'Es la una.', 'Hora exata.'),
      ],
    },
    [
      mc('Como se diz “três” em espanhol?', ['uno', 'tres', 'dos'], 1, '“Tres” significa três.'),
      fill('Hola, tengo ____ libros.', ['dos'], '“Dos” é o número dois.', 'Olá, tenho dois livros.'),
      word(['es', 'la', 'una'], 'Es la una', 'A ordem é “es la una” para uma hora.'),
      match([
        { term: 'uno', translation: 'um' },
        { term: 'dos', translation: 'dois' },
        { term: 'tres', translation: 'três' },
      ], 'Associa cada número ao seu valor.'),
      translate('Traduz: “São duas horas.”', ['Son las dos'], 'Com horas depois da uma, usa-se “son las”.'),
      read('Hola, me llamo Luis. Tengo tres hermanos y dos hermanas. Es la una.', 'Quantos irmãos tem o Luis?', ['Cinco', 'Três', 'Dois'], 0, 'O texto diz três irmãos e duas irmãs — cinco no total.'),
    ],
    'es',
  ),

  createLesson(
    {
      id: 'es-comida',
      title: 'Comida e bebidas',
      subtitle: 'Pede algo para comer em espanhol',
      objective: 'Pedir comida e bebida com frases educadas.',
      level: 'A1',
      category: 'Comida',
      minutes: 7,
      xp: 20,
      vocabulary: [
        v('pan', 'pão', 'Quiero pan, por favor.', 'Alimento básico.'),
        v('agua', 'água', 'Un vaso de agua, por favor.', 'Bebida.'),
        v('café', 'café', 'Un café, por favor.', 'Bebida comum.'),
        v('queso', 'queijo', 'Me gusta el queso.', 'Alimento.'),
        v('por favor', 'por favor', 'Un café, por favor.', 'Forma educada de pedir.'),
      ],
    },
    [
      mc('O que significa “quiero”?', ['quero', 'como', 'tenho'], 0, '“Quiero” é a forma de “quero”.'),
      listen('Quiero un café y un pan, por favor.', 'O que a pessoa pediu?', ['Café e pão', 'Chá e queijo', 'Água e maçã'], 0, 'Ouviu-se “un café y un pan”.'),
      translate('Traduz: “Eu quero água, por favor.”', ['Quiero agua, por favor', 'Quiero un agua, por favor'], '“Quiero agua, por favor” é a forma mais simples.'),
      word(['quiero', 'un', 'café'], 'Quiero un café', 'O verbo vem antes do artigo.'),
      match([
        { term: 'pan', translation: 'pão' },
        { term: 'agua', translation: 'água' },
        { term: 'café', translation: 'café' },
      ], 'Associa o alimento ao significado.'),
      sentence('Escreve um pedido educado para pedir água.', 'Começa com “Quiero…”', ['Quiero agua, por favor', 'Quiero un vaso de agua'], 'Usar “por favor” torna o pedido educado.'),
    ],
    'es',
  ),

  createLesson(
    {
      id: 'es-familia',
      title: 'La familia y los amigos',
      subtitle: 'Fala da tua família em espanhol',
      objective: 'Apresentar membros da família e um amigo.',
      level: 'A1',
      category: 'Família',
      minutes: 6,
      xp: 20,
      vocabulary: [
        v('la madre', 'a mãe', 'Mi madre se llama Elena.', 'Parente.'),
        v('el padre', 'o pai', 'Mi padre trabaja hoy.', 'Parente.'),
        v('el hermano', 'o irmão', 'Tengo un hermano.', 'Parente.'),
        v('la hermana', 'a irmã', 'Mi hermana es mayor.', 'Parente.'),
        v('la familia', 'a família', 'Mi familia vive en Porto.', 'Grupo.'),
        v('el amigo', 'o amigo', 'Mi amigo vive cerca.', 'Amizade.'),
      ],
    },
    [
      mc('Como se diz “mãe” em espanhol?', ['el padre', 'la madre', 'el hermano'], 1, '“La madre” significa mãe.'),
      fill('Mi ____ se llama Elena.', ['madre'], 'Substitua pelo parente certo: la madre = mãe.', 'A minha mãe chama-se Elena.'),
      word(['madre', 'mi', 'se', 'llama', 'Elena'], 'Mi madre se llama Elena', 'Sujeito antes do verbo; “se llama” apresenta o nome.'),
      match([
        { term: 'la madre', translation: 'a mãe' },
        { term: 'el padre', translation: 'o pai' },
        { term: 'el amigo', translation: 'o amigo' },
      ], 'Associa o parente espanhol ao significado.'),
      dialogue(['¿Quién es?', '____', 'Encantado.'], ['Es mi amigo Luis.', 'Buenos días.', 'Hasta mañana.'], 0, 'Apresenta a pessoa: “Es mi amigo Luis.”'),
      read('Hola, me llamo Ana. Mi madre se llama Elena y mi padre se llama Carlos. Tengo una hermana.', 'Como se chama a mãe da Ana?', ['Carlos', 'Elena', 'Ana'], 1, 'O texto diz “mi madre se llama Elena”.'),
      translate('Traduz: “Tenho um irmão.”', ['Tengo un hermano'], '“Tengo un hermano” é a forma direta.'),
    ],
    'es',
  ),
];
