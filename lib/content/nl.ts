import { createLesson, dialogue, fill, listen, match, mc, read, sentence, translate, v, word } from './builders';

export const nlLessons = [
  createLesson(
    {
      id: 'nl-begroetingen',
      title: 'Begroetingen en voorstellen',
      subtitle: 'Begin een gesprek in het Nederlands',
      objective: 'Iemand begroeten, je naam zeggen en vragen hoe het gaat.',
      level: 'A1',
      category: 'Conversatie',
      minutes: 6,
      xp: 20,
      vocabulary: [
        v('hallo', 'olá', 'Hallo, ik heet Ana.', 'Saudação informal.'),
        v('goedemorgen', 'bom dia', 'Goedemorgen, hoe gaat het?', 'Usado de manhã.'),
        v('hoe gaat het?', 'como estás?', 'Hoi, hoe gaat het?', 'Pergunta sobre o estado.'),
        v('goed', 'bem', 'Goed, dank je.', 'Resposta curta.'),
        v('dank je', 'obrigado', 'Dank je wel.', 'Agradecimento.'),
        v('ik heet', 'chamo-me', 'Ik heet Ana.', 'Apresentação do nome.'),
      ],
    },
    [
      mc('Escolhe a saudação adequada às 8 da manhã.', ['Goedenavond', 'Goedemorgen', 'Goedenacht'], 1, '“Goedemorgen” significa bom dia.', 'Bom dia!'),
      translate('Traduz: “O meu nome é Ana.”', ['Ik heet Ana', 'Mijn naam is Ana'], '“Ik heet” e “Mijn naam is” são ambos corretos.'),
      word(['heet', 'ik', 'Ana'], 'Ik heet Ana', 'Em neerlandês, o verbo vem antes do nome.'),
      match([
        { term: 'hallo', translation: 'olá' },
        { term: 'dank je', translation: 'obrigado' },
        { term: 'tot ziens', translation: 'adeus' },
      ], 'Associa a expressão neerlandesa ao significado.'),
      dialogue(['Hallo, ik heet Sam.', '____', 'Leuk je te ontmoeten, Ana.'], ['Leuk je te ontmoeten, ik heet Ana.', 'Ik ben moe.', 'Goedenacht.'], 0, 'Ao conhecer alguém, diz “leuk je te ontmoeten”.'),
      listen('Hallo, goedemorgen. Hoe gaat het?', 'O que ouviste?', ['Hallo, goedemorgen. Hoe gaat het?', 'Hallo, goedenavond. Hoe gaat het?', 'Tot ziens, tot morgen.'], 0, 'A frase começa com “hallo, goedemorgen”.'),
    ],
    'nl',
  ),

  createLesson(
    {
      id: 'nl-eten',
      title: 'Eten en drinken',
      subtitle: 'Peça algo para comer em neerlandês',
      objective: 'Pedir comida e bebida com uma frase educada.',
      level: 'A1',
      category: 'Comida',
      minutes: 6,
      xp: 20,
      vocabulary: [
        v('brood', 'pão', 'Ik wil brood, alsjeblieft.', 'Alimento básico.'),
        v('water', 'água', 'Een glas water, alsjeblieft.', 'Bebida.'),
        v('koffie', 'café', 'Een koffie, alsjeblieft.', 'Bebida comum.'),
        v('kaas', 'queijo', 'Ik hou van kaas.', 'Alimento.'),
        v('alsjeblieft', 'por favor', 'Een water, alsjeblieft.', 'Forma educada de pedir.'),
      ],
    },
    [
      mc('O que significa “ik wil”?', ['quero', 'como', 'tenho'], 0, '“Ik wil” significa “quero”.'),
      fill('Een koffie, ____.', ['alsjeblieft'], '“Alsjeblieft” é a forma educada de pedir.', 'Um café, por favor.'),
      word(['wil', 'ik', 'water'], 'Ik wil water', 'O sujeito vem antes do verbo.'),
      match([
        { term: 'brood', translation: 'pão' },
        { term: 'water', translation: 'água' },
        { term: 'kaas', translation: 'queijo' },
      ], 'Associa o alimento ao significado.'),
      translate('Traduz: “Quero pão, por favor.”', ['Ik wil brood, alsjeblieft'], 'Mantém “alsjeblieft” no fim do pedido.'),
      read('Hallo, ik ben Mia. Ik wil een koffie en een brood. Ik hou ook van kaas.', 'O que a Mia pediu?', ['Café e pão', 'Chá e queijo', 'Água e maçã'], 0, 'O texto diz “een koffie en een brood”.'),
      sentence('Escreve um pedido educado para pedir água.', 'Começa com “Ik wil…”', ['Ik wil water, alsjeblieft', 'Een glas water, alsjeblieft'], 'Usar “alsjeblieft” torna o pedido educado.'),
    ],
    'nl',
  ),

  createLesson(
    {
      id: 'nl-winkelen',
      title: 'Winkelen in de winkel',
      subtitle: 'Faz compras numa loja em neerlandês',
      objective: 'Pedir um tamanho, uma cor e o preço numa loja.',
      level: 'A1',
      category: 'Compras',
      minutes: 6,
      xp: 20,
      vocabulary: [
        v('de winkel', 'a loja', 'Ik ga naar de winkel.', 'Sítio de compras.'),
        v('de maat', 'o tamanho', 'Welke maat heeft u?', 'Pergunta na loja.'),
        v('blauw', 'azul', 'Ik wil blauw.', 'Cor.'),
        v('proberen', 'experimentar', 'Kan ik dit proberen?', 'Pedido educado.'),
        v('duur', 'caro', 'Dat is duur.', 'Preço alto.'),
        v('goedkoop', 'barato', 'Dat is goedkoop.', 'Preço baixo.'),
      ],
    },
    [
      mc('O que significa “proberen”?', ['pagar', 'experimentar', 'olhar'], 1, '“Proberen” significa experimentar.'),
      fill('Welke ____ heeft u?', ['maat'], 'Na loja, pergunta-se pelo tamanho: “welke maat”.', 'Que tamanho tem?'),
      word(['blauw', 'ik', 'wil'], 'Ik wil blauw', 'O sujeito vem antes do verbo.'),
      match([
        { term: 'de winkel', translation: 'a loja' },
        { term: 'de maat', translation: 'o tamanho' },
        { term: 'duur', translation: 'caro' },
      ], 'Associa a palavra neerlandesa ao significado.'),
      translate('Traduz: “Quero azul, por favor.”', ['Ik wil blauw, alsjeblieft', 'Ik wil blauw'], 'Mantém “alsjeblieft” para ser educado.'),
      read('Hoi, ik ben Sanne. Ik werk in de winkel. Welke maat heeft u? Wij hebben dit in blauw en zwart.', 'Em que cores está disponível?', ['Vermelho e verde', 'Azul e preto', 'Branco e amarelo'], 1, 'O texto diz “in blauw en zwart”.'),
      sentence('Escreve uma frase a pedir para experimentar a camisa.', 'Começa com “Kan ik…”', ['Kan ik dit proberen?', 'Ik wil dit proberen.'], '“Kan ik dit proberen?” é o pedido educado.'),
    ],
    'nl',
  ),
];
