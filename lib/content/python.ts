import { createLesson, fill, match, mc, read, sentence, translate, v, word } from './builders';

export const pythonLessons = [
  createLesson(
    {
      id: 'py-variaveis',
      title: 'Variáveis e tipos',
      subtitle: 'Guarda valores em Python',
      objective: 'Atribuir valores, reconhecer tipos e mostrar resultados com print.',
      level: 'L1',
      category: 'Sintaxe',
      minutes: 7,
      xp: 20,
      vocabulary: [
        v('variável', 'variável', 'nome = "Ana"', 'Nome que guarda um valor.'),
        v('int', 'inteiro', 'idade = 20', 'Número inteiro.'),
        v('str', 'texto', 'nome = "Ana"', 'Sequência de caracteres.'),
        v('print', 'mostrar', 'print(nome)', 'Mostra um valor no ecrã.'),
        v('input', 'ler do utilizador', 'nome = input("Nome: ")', 'Lê texto introduzido.'),
      ],
    },
    [
      mc('Qual função mostra um valor no ecrã?', ['input', 'print', 'len'], 1, '“print” mostra o valor.'),
      fill('Em Python, uma frase é do tipo ____.', ['str', 'string'], 'O tipo de texto em Python é “str”.', 'Em Python, uma frase é do tipo str.'),
      word(['Ana', 'nome'], 'nome = "Ana"', 'O nome da variável vem antes do sinal de atribuição.'),
      match([
        { term: 'int', translation: 'número inteiro' },
        { term: 'str', translation: 'texto' },
        { term: 'print', translation: 'mostrar no ecrã' },
      ], 'Associa cada conceito à sua explicação.'),
      translate('Traduz a ideia: “mostrar o nome”', ['print(nome)', 'print(nome)'], 'A função “print” mostra o valor da variável.'),
      read('nome = "Ana"\nidade = 20\nprint(nome)', 'O que aparece no ecrã?', ['Ana', '20', 'Nome'], 0, 'O programa mostra o valor da variável “nome”.'),
    ],
    'python',
  ),

  createLesson(
    {
      id: 'py-condicoes',
      title: 'Condições',
      subtitle: 'Toma decisões em Python',
      objective: 'Usar if, else e comparações simples.',
      level: 'L2',
      category: 'Controlo',
      minutes: 8,
      xp: 25,
      vocabulary: [
        v('if', 'se', 'if idade >= 18:', 'Introduz uma condição.'),
        v('else', 'senão', 'else:', 'Caminho quando a condição falha.'),
        v('elif', 'senão se', 'elif idade > 12:', 'Verifica outra condição.'),
        v('True', 'verdadeiro', 'aberto = True', 'Valor lógico positivo.'),
        v('False', 'falso', 'aberto = False', 'Valor lógico negativo.'),
      ],
    },
    [
      mc('Qual palavra inicia uma condição em Python?', ['if', 'when', 'check'], 0, 'Python usa “if” para condições.'),
      fill('Se a condição falha, usamos ____.', ['else'], '“else” é o caminho alternativo.', 'Se a condição falha, usamos else.'),
      word(['print', 'maior', 'Ana'], 'print("Ana é maior")', 'A chamada “print” vem antes do texto.'),
      match([
        { term: 'if', translation: 'se' },
        { term: 'else', translation: 'senão' },
        { term: 'elif', translation: 'senão se' },
      ], 'Associa a palavra-chave ao significado.'),
      sentence('Escreve uma condição para verificar se idade é maior que 17.', 'Começa com if', ['if idade > 17:', 'if idade > 17'], 'A condição usa “if” seguido da comparação.'),
      read('idade = 20\nif idade >= 18:\n    print("Adulto")\nelse:\n    print("Menor")', 'O que aparece no ecrã?', ['Adulto', 'Menor', '20'], 0, 'Como 20 é maior ou igual a 18, aparece “Adulto”.'),
    ],
    'python',
  ),
];
