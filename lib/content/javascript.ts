import { createLesson, fill, match, mc, read, sentence, translate, v, word } from './builders';

export const javascriptLessons = [
  createLesson(
    {
      id: 'js-variaveis',
      title: 'Variáveis e tipos',
      subtitle: 'Declara valores em JavaScript',
      objective: 'Usar const e let, reconhecer texto e números e mostrar valores.',
      level: 'L1',
      category: 'Sintaxe',
      minutes: 7,
      xp: 20,
      vocabulary: [
        v('const', 'constante', 'const nome = "Ana";', 'Declara um valor que não deve mudar.'),
        v('let', 'variável', 'let idade = 20;', 'Declara um valor que pode mudar.'),
        v('string', 'texto', '"Olá"', 'Sequência de caracteres.'),
        v('number', 'número', '42', 'Valor numérico.'),
        v('console.log', 'mostrar no terminal', 'console.log(nome);', 'Escreve um valor na consola.'),
      ],
    },
    [
      mc('Qual palavra declara um valor que não deve mudar?', ['let', 'const', 'var'], 1, '“const” declara uma constante.'),
      fill('Complete: const nome = ____;', ['"Ana"'], 'O valor é um texto, por isso usa aspas.', 'const nome = "Ana";'),
      word(['Ana', 'const', 'nome'], 'const nome = "Ana"', 'A declaração começa com a palavra “const”.'),
      match([
        { term: 'const', translation: 'valor fixo' },
        { term: 'let', translation: 'valor que muda' },
        { term: 'string', translation: 'texto' },
      ], 'Associa a palavra-chave ao seu significado.'),
      translate('Traduz a ideia: “mostrar o nome na consola”', ['console.log(nome)', 'console.log(nome);'], 'A função “console.log” mostra o valor.'),
      read('const nome = "Ana";\nconst total = 2 + "3";\nconsole.log(total);', 'O que aparece na consola?', ['5', '23', 'Erro de sintaxe'], 1, 'Como "3" é texto, o operador + concatena: "23".'),
    ],
    'javascript',
  ),

  createLesson(
    {
      id: 'js-funcoes',
      title: 'Funções e retorno',
      subtitle: 'Cria funções simples em JavaScript',
      objective: 'Declarar uma função, receber parâmetros e devolver um valor.',
      level: 'L2',
      category: 'Funções',
      minutes: 8,
      xp: 25,
      vocabulary: [
        v('function', 'função', 'function saudacao() {}', 'Bloco de código reutilizável.'),
        v('return', 'retorno', 'return nome;', 'Devolve um valor de uma função.'),
        v('parâmetro', 'parâmetro', 'function dobro(n) {}', 'Valor recebido pela função.'),
        v('=>', 'função seta', 'const dobro = n => n * 2;', 'Forma curta de escrever uma função.'),
        v('chamar', 'invocar', 'dobro(4);', 'Executar uma função.'),
      ],
    },
    [
      mc('O que faz a palavra “return”?', ['Cria uma variável', 'Devolve um valor', 'Apaga o código'], 1, '“return” devolve o resultado da função.'),
      fill('Uma função recebe valores através de ____.', ['parâmetros', 'parametros'], 'Os parâmetros são os valores de entrada.', 'Uma função recebe valores através de parâmetros.'),
      word(['return', 'n', '2'], 'return n * 2', 'O retorno vem antes da expressão.'),
      match([
        { term: 'function', translation: 'declara uma função' },
        { term: 'return', translation: 'devolve um valor' },
        { term: 'parâmetro', translation: 'valor de entrada' },
      ], 'Associa cada conceito à sua explicação.'),
      sentence('Escreve uma função que recebe “nome” e devolve “Olá, nome”.', 'Usa function e return', ['function ola(nome) { return "Olá, " + nome; }', 'function ola(nome){return "Olá, " + nome;}'], 'A função devolve o texto com o nome recebido.'),
      read('function dobro(n) {\n  return n * 2;\n}\nconsole.log(dobro(4));', 'Que valor aparece na consola?', ['4', '8', '6'], 1, 'A função devolve 4 multiplicado por 2, ou seja, 8.'),
    ],
    'javascript',
  ),
];
