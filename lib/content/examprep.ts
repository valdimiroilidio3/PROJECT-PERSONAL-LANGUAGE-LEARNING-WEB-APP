/**
 * Lições de preparação para exames — leitura, audição e registo formal.
 * Continuam o percurso de cada pacote (nível A2, ou L3 para código) e usam
 * o formato dos exames (textos, anúncios, previsão de código) sem copiar
 * perguntas de exames oficiais.
 */
import { createLesson, fill, listen, match, mc, read, translate, v, word } from './builders';

export const enExamLessons = [
  createLesson(
    {
      id: 'en-formal-email',
      title: 'Exame A2: emails formais',
      subtitle: 'Leia e compreenda um email de serviço, como num exame',
      objective: 'Compreender um email formal de agendamento: data, hora, instruções e fecho.',
      level: 'A2',
      category: 'Exames',
      minutes: 8,
      xp: 25,
      vocabulary: [
        v('dear', 'caro(a) / exmo.(a)', 'Dear Ms Duarte,', 'Saudação formal de abertura.'),
        v('enquiry', 'pedido de informação', 'Thank you for your enquiry.', 'Formal; em inglês americano escreve-se inquiry.'),
        v('appointment', 'marcação / consulta', 'I would like to confirm my appointment.', 'Contexto de serviços (clínica, banco).'),
        v('enclosed', 'em anexo', 'Please find the form enclosed.', 'Usado em anexos de email formal.'),
        v('regarding', 'em relação a', 'Regarding your enquiry of 12 March…', 'Preposição formal.'),
        v('yours sincerely', 'com os melhores cumprimentos', 'Yours sincerely,', 'Fecho formal quando sabes o nome.'),
      ],
    },
    [
      read('Dear Ms Duarte,\nThank you for your enquiry of 12 March. We confirm your appointment for Tuesday at 10:30.\nPlease find the enclosed form. If you need to change the time, contact us at least 48 hours before.\nYours sincerely,\nThe Lumio Clinic', 'Quando é a consulta?', ['Terça-feira às 10:30', 'Terça-feira às 14:00', 'Quinta-feira às 10:30'], 0, 'O email diz “your appointment for Tuesday at 10:30”.'),
      read('Dear Ms Duarte,\nThank you for your enquiry of 12 March. We confirm your appointment for Tuesday at 10:30.\nPlease find the enclosed form. If you need to change the time, contact us at least 48 hours before.\nYours sincerely,\nThe Lumio Clinic', 'O que deve fazer quem precisa de mudar a hora?', ['Contactar a clínica pelo menos 48 horas antes', 'Aparecer outro dia sem avisar', 'Enviar um email no próprio dia'], 0, '“Contact us at least 48 hours before.”'),
      mc('Qual destas frases é um fecho adequado para um email formal?', ['See you soon!', 'Yours sincerely,', 'Cheers,'], 1, '“Yours sincerely” é o fecho formal padrão quando conheces o nome do destinatário.', 'Com os melhores cumprimentos,'),
      fill('Please find the form ____.', ['enclosed'], '“Enclosed” indica que o documento vai em anexo ao email.', 'Em anexo segue o formulário.'),
      translate('Traduza: “Obrigado pelo seu pedido de informação.”', ['Thank you for your enquiry', 'Thanks for your enquiry'], '“Thank you for your enquiry” é a fórmula formal completa.'),
      match(
        [
          { term: 'enquiry', translation: 'pedido de informação' },
          { term: 'appointment', translation: 'marcação / consulta' },
          { term: 'regarding', translation: 'em relação a' },
          { term: 'enclosed', translation: 'em anexo' },
        ],
        'Vocabulário formal típico de emails de serviços — aparece com frequência em exames A2.',
      ),
      listen('Your appointment is confirmed for Tuesday at ten thirty.', 'O que confirma a mensagem?', ['A consulta de terça-feira às 10:30', 'A consulta de quarta-feira às 10:30', 'A consulta de terça-feira às 13:00'], 0, '“Tuesday at ten thirty” = terça-feira às 10:30.'),
    ],
    'en',
  ),
];

export const esExamLessons = [
  createLesson(
    {
      id: 'es-exam-avisos',
      title: 'Examen A2: avisos y anuncios',
      subtitle: 'Comprende avisos públicos, como en el examen',
      objective: 'Leer y comprender avisos de transporte y espacios públicos en español.',
      level: 'A2',
      category: 'Exámenes',
      minutes: 8,
      xp: 25,
      vocabulary: [
        v('se informa', 'informa-se', 'Se informa que el servicio será normal.', 'Fórmula impessoal de avisos públicos.'),
        v('horario', 'horário', 'El horario de apertura es de 9 a 19 h.', 'Contexto de serviços e transportes.'),
        v('cerrado', 'fechado', 'El museo está cerrado los lunes.', 'Estado de espaços públicos.'),
        v('a partir de', 'a partir de', 'A partir del lunes el servicio será normal.', 'Indica o início de uma mudança.'),
        v('se ruega', 'solicita-se', 'Se ruega disculpar las molestias.', 'Registo formal de pedidos públicos.'),
        v('gratis', 'grátis', 'La entrada es gratis los domingos.', 'Indica ausência de custo.'),
      ],
    },
    [
      read('Se informa a los pasajeros: el autobús de la línea 4 no circulará el domingo por obras. A partir del lunes, el servicio será normal. Se ruega disculpar las molestias.', '¿Qué pasa el domingo?', ['El autobús de la línea 4 no circula', 'El autobús llega con diez minutos de retraso', 'El autobús es gratis'], 0, '“El autobús de la línea 4 no circulará el domingo por obras.”'),
      read('Se informa a los pasajeros: el autobús de la línea 4 no circulará el domingo por obras. A partir del lunes, el servicio será normal. Se ruega disculpar las molestias.', '¿Desde cuándo vuelve el servicio normal?', ['A partir del lunes', 'A partir del domingo', 'A partir del sábado'], 0, '“A partir del lunes, el servicio será normal.”'),
      mc('¿Qué significa “Se ruega disculpar las molestias”?', ['Pede-se desculpa pelo incómodo', 'É proibido reclamar', 'Pode fumar neste espaço'], 0, '“Se ruega” é a fórmula formal de pedido; “molestias” são incómodos.'),
      fill('El museo está ____ los lunes.', ['cerrado'], '“Cerrado” indica que o museu está fechado.', 'O museu está fechado às segundas.'),
      translate('Traduza: “A entrada é grátis.”', ['La entrada es gratis'], '“Gratis” é invariável em espanhol.'),
      match(
        [
          { term: 'se informa', translation: 'informa-se' },
          { term: 'horario', translation: 'horário' },
          { term: 'cerrado', translation: 'fechado' },
          { term: 'a partir de', translation: 'a partir de' },
        ],
        'Vocabulário de avisos públicos — o formato de leitura dos exames A2.',
      ),
      listen('Atención, el tren con destino a Madrid sale de la vía dos.', 'De que via sai o comboio?', ['Da via 2', 'Da via 3', 'Da via 12'], 0, '“De la vía dos” = da via 2.'),
    ],
    'es',
  ),
];

export const nlExamLessons = [
  createLesson(
    {
      id: 'nl-exam-omroepen',
      title: 'Examen A2: omroepen',
      subtitle: 'Begrijp omroepen op het station, zoals op het examen',
      objective: 'Aankondigingen van treinen en bussen begrijpen en beantwoorden.',
      level: 'A2',
      category: 'Examens',
      minutes: 8,
      xp: 25,
      vocabulary: [
        v('aandacht', 'atenção', 'Aandacht, een mededeling.', 'Abertura de anúncios públicos.'),
        v('vertrek', 'partida', 'Het vertrek is om 10:30.', 'Contexto de transportes.'),
        v('spoor', 'via', 'De trein vertrekt van spoor 5.', 'Número da via no comboio.'),
        v('vertraagd', 'atrasado', 'De trein is tien minuten vertraagd.', 'Estado de um serviço atrasado.'),
        v('geachte', 'prezado(a)', 'Geachte reiziger,', 'Saudação formal de anúncios.'),
        v('gratis', 'grátis', 'De toegang is gratis.', 'Indica ausência de custo.'),
      ],
    },
    [
      listen('Let op: de trein naar Amsterdam vertrekt vandaag vanaf spoor vijf.', 'De que via parte o comboio?', ['Da via 5', 'Da via 15', 'Da via 50'], 0, '“Vanaf spoor vijf” = da via 5.'),
      read('Geachte reiziger,\nwegens werkzaamheden rijdt bus 7 dit weekend niet. Vanaf maandag rijdt de bus weer volgens de normale dienstregeling. Onze excuses voor het ongemak.', 'Wat is er dit weekend?', ['Bus 7 rijdt niet', 'Bus 7 rijdt gratis', 'Bus 7 komt tien minuten te laat'], 0, '“Bus 7 dit weekend niet” — o autocarro 7 não circula.'),
      read('Geachte reiziger,\nwegens werkzaamheden rijdt bus 7 dit weekend niet. Vanaf maandag rijdt de bus weer volgens de normale dienstregeling. Onze excuses voor het ongemak.', 'Vanaf wanneer rijdt de bus weer normaal?', ['Vanaf maandag', 'Vanaf zondag', 'Vanaf zaterdag'], 0, '“Vanaf maandag rijdt de bus weer volgens de normale dienstregeling.”'),
      mc('Wat betekent “vertraagd”?', ['Atrasado', 'Cancelado', 'Grátis'], 0, '“Vertraagd” significa atrasado (ex.: treinvertraging = atraso do comboio).'),
      fill('De trein is tien minuten ____.', ['vertraagd'], '“Vertraagd” descreve um serviço com atraso.', 'O comboio está dez minutos atrasado.'),
      match(
        [
          { term: 'vertrek', translation: 'partida' },
          { term: 'spoor', translation: 'via' },
          { term: 'vertraagd', translation: 'atrasado' },
          { term: 'geachte', translation: 'prezado(a)' },
        ],
        'Vocabulário de estações e transportes — leitura e audição de exame A2.',
      ),
      word(['spoor', 'vanaf', 'vijf', 'vertrekt', 'de', 'trein'], 'De trein vertrekt vanaf spoor vijf', 'A ordem normal: sujeito + verbo + “vanaf spoor vijf”.'),
    ],
    'nl',
  ),
];

export const frExamLessons = [
  createLesson(
    {
      id: 'fr-exam-annonces',
      title: 'Examen A2 : annonces publiques',
      subtitle: 'Comprendre les annonces comme dans une salle d’examen',
      objective: 'Comprendre des annonces de musée, d’aéroport et de transport.',
      level: 'A2',
      category: 'Examens',
      minutes: 8,
      xp: 25,
      vocabulary: [
        v('annonce', 'anúncio / aviso', 'Les annonces sont en français et en anglais.', 'Contexto de transportes e espaços públicos.'),
        v('gratuit', 'grátis', 'L’entrée est gratuite le dimanche.', 'Femenino: gratuite.'),
        v('fermé', 'fechado', 'Le musée est fermé le lundi.', 'Estado de espaços públicos.'),
        v('horaires', 'horários', 'Consultez les horaires à l’accueil.', 'Contexto de serviços.'),
        v('à partir de', 'a partir de', 'À partir du 1er juin, l’entrée est gratuite.', 'Indica o início de uma mudança.'),
        v('veuillez', 'queira(m) / por favor', 'Veuillez patienter.', 'Imperativo formal de pedidos públicos.'),
      ],
    },
    [
      listen('Votre attention, s’il vous plaît : le vol pour Paris est retardé de deux heures.', 'De quanto é o atraso do voo?', ['Duas horas', 'Vinte minutos', 'Quatro horas'], 0, '“Retardé de deux heures” = atrasado em duas horas.'),
      read('Chers visiteurs,\nle musée est fermé tous les lundis. À partir du 1er juin, l’entrée sera gratuite le premier dimanche du mois. Veuillez consulter les horaires à l’accueil.', 'Quand le musée est-il fermé ?', ['Às segundas-feiras', 'Aos domingos', 'Aos sábados'], 0, '“Le musée est fermé tous les lundis.”'),
      read('Chers visiteurs,\nle musée est fermé tous les lundis. À partir du 1er juin, l’entrée sera gratuite le premier dimanche du mois. Veuillez consulter les horaires à l’accueil.', 'À partir de quand l’entrée est-elle gratuite le premier dimanche ?', ['A partir de 1 de junho', 'A partir de 1 de julho', 'A partir de agora'], 0, '“À partir du 1er juin, l’entrée sera gratuite le premier dimanche du mois.”'),
      mc('Que signifie « veuillez » ?', ['Por favor / queira(m)', 'É proibido', 'Obrigado'], 0, '« Veuillez patienter » = “tenha(m) paciência” / “por favor, aguarde(m)”.'),
      fill('Le musée est ____ le lundi.', ['fermé'], '“Fermé” indica que o espaço está fechado.', 'O museu está fechado à segunda.'),
      match(
        [
          { term: 'annonce', translation: 'anúncio / aviso' },
          { term: 'horaires', translation: 'horários' },
          { term: 'fermé', translation: 'fechado' },
          { term: 'gratuit', translation: 'grátis' },
        ],
        'Vocabulário de espaços públicos — formato de compreensão do exame A2.',
      ),
      word(['fermé', 'musée', 'le', 'est', 'lundi', 'le'], 'Le musée est fermé le lundi', 'A ordem é: sujeito + verbo + adjetivo + complemento.'),
    ],
    'fr',
  ),
];

export const deExamLessons = [
  createLesson(
    {
      id: 'de-exam-durchsagen',
      title: 'Prüfung A2: Durchsagen',
      subtitle: 'Durchsagen verstehen, wie in der Prüfung',
      objective: 'Ansagen am Bahnhof und im Museum verstehen und beantworten.',
      level: 'A2',
      category: 'Prüfungen',
      minutes: 8,
      xp: 25,
      vocabulary: [
        v('Durchsage', 'anúncio / chamada', 'Achtung, eine Durchsage.', 'Abertura de anúncios públicos.'),
        v('verspätet', 'atrasado', 'Der Zug nach Berlin verspätet sich.', 'Estado de um serviço atrasado.'),
        v('Gleis', 'via', 'Der Zug fährt von Gleis 3.', 'Número da via no comboio.'),
        v('kostenlos', 'grátis', 'Der Eintritt ist kostenlos.', 'Sinónimo formal de gratis.'),
        v('geschlossen', 'fechado', 'Das Museum ist am Montag geschlossen.', 'Estado de espaços públicos.'),
        v('ab', 'a partir de', 'Ab Montag gilt der normale Fahrplan.', 'Indica o início de uma mudança.'),
      ],
    },
    [
      listen('Achtung, eine Durchsage: Der Zug nach Berlin verspätet sich um zwanzig Minuten.', 'Quanto atrasa o comboio?', ['Vinte minutos', 'Dois minutos', 'Meio hora'], 0, '“Um zwanzig Minuten” = em vinte minutos.'),
      read('Sehr geehrte Fahrgäste,\nwegen Bauarbeiten fährt der Bus 7 dieses Wochenende nicht. Ab Montag gilt wieder der normale Fahrplan. Wir bitten um Entschuldigung.', 'Was ist dieses Wochenende?', ['O autocarro 7 não circula', 'O autocarro 7 é grátis', 'O autocarro 7 tem atraso de 10 minutos'], 0, '“Der Bus 7 dieses Wochenende nicht” — o autocarro não circula.'),
      read('Sehr geehrte Fahrgäste,\nwegen Bauarbeiten fährt der Bus 7 dieses Wochenende nicht. Ab Montag gilt wieder der normale Fahrplan. Wir bitten um Entschuldigung.', 'Ab wann gilt wieder der normale Fahrplan?', ['A partir de segunda-feira', 'A partir de domingo', 'A partir de sábado'], 0, '“Ab Montag gilt wieder der normale Fahrplan.”'),
      mc('Was bedeutet „kostenlos“?', ['Grátis', 'Atrasado', 'Fechado'], 0, '“Kostenlos” = sem custo (Kosten = custos, -los = sem).'),
      fill('Das Museum ist am Montag ____.', ['geschlossen'], '“Geschlossen” indica que o museu está fechado.', 'O museu está fechado à segunda-feira.'),
      match(
        [
          { term: 'Durchsage', translation: 'anúncio / chamada' },
          { term: 'Gleis', translation: 'via' },
          { term: 'verspätet', translation: 'atrasado' },
          { term: 'ab', translation: 'a partir de' },
        ],
        'Vocabulário de estações e museus — leitura e audição de exame A2.',
      ),
      word(['Gleis', 'von', 'fährt', 'drei', 'der', 'Zug'], 'Der Zug fährt von Gleis drei', 'A ordem é: sujeito + verbo + “von Gleis …”.'),
    ],
    'de',
  ),
];

export const itExamLessons = [
  createLesson(
    {
      id: 'it-exam-annunci',
      title: 'Esame A2: annunci',
      subtitle: 'Capire gli annunci come nell’esame',
      objective: 'Comprendere annunci di treni, autobus e musei in italiano.',
      level: 'A2',
      category: 'Esami',
      minutes: 8,
      xp: 25,
      vocabulary: [
        v('annuncio', 'anúncio', 'Attenzione, annuncio importante.', 'Abertura de avisos públicos.'),
        v('in ritardo', 'atrasado', 'Il treno è in ritardo di 20 minuti.', 'Estado de um serviço atrasado.'),
        v('binario', 'via', 'Il treno parte dal binario 3.', 'Número da via no comboio.'),
        v('gratis', 'grátis', 'L’ingresso è gratis la domenica.', 'Indica ausência de custo.'),
        v('chiuso', 'fechado', 'Il museo è chiuso il lunedì.', 'Estado de espaços públicos.'),
        v('a partire da', 'a partir de', 'A partire da lunedì il servizio sarà regolare.', 'Indica o início de uma mudança.'),
      ],
    },
    [
      listen('Attenzione, annuncio: il treno per Roma è in ritardo di trenta minuti.', 'Quanto atrasa o comboio?', ['Trinta minutos', 'Dez minutos', 'Uma hora'], 0, '“In ritardo di trenta minuti” = trinta minutos de atraso.'),
      read('Gentili passeggeri,\na causa di lavori, l’autobus 7 non circola questo weekend. A partire da lunedì il servizio sarà regolare. Ci scusiamo per il disagio.', 'Che cosa succede questo weekend?', ['O autocarro 7 não circula', 'O autocarro 7 é grátis', 'O autocarro 7 tem dez minutos de atraso'], 0, '“L’autobus 7 non circola questo weekend.”'),
      read('Gentili passeggeri,\na causa di lavori, l’autobus 7 non circola questo weekend. A partire da lunedì il servizio sarà regolare. Ci scusiamo per il disagio.', 'A partire da quando il servizio sarà regolare?', ['A partir de segunda-feira', 'A partir de domingo', 'A partir de sábado'], 0, '“A partire da lunedì il servizio sarà regolare.”'),
      mc('Che cosa significa „chiuso“?', ['Fechado', 'Atrasado', 'Grátis'], 0, '“Chiuso” indica que o espaço está fechado.'),
      fill('Il museo è ____ il lunedì.', ['chiuso'], '“Chiuso” descreve o museu quando está fechado.', 'O museu está fechado à segunda-feira.'),
      match(
        [
          { term: 'annuncio', translation: 'anúncio' },
          { term: 'binario', translation: 'via' },
          { term: 'in ritardo', translation: 'atrasado' },
          { term: 'a partire da', translation: 'a partir de' },
        ],
        'Vocabulário de transportes — leitura e audição do exame A2.',
      ),
      word(['binario', 'dal', 'parte', 'tre', 'treno', 'il'], 'Il treno parte dal binario tre', 'A ordem é: sujeito + verbo + “dal binario …”.'),
    ],
    'it',
  ),
];

export const javascriptExamLessons = [
  createLesson(
    {
      id: 'js-exam-previsao',
      title: 'Prova L3: previsão de código',
      subtitle: 'Lê o código e prevê o resultado, como numa prova técnica',
      objective: 'Prever o output de código JavaScript com coerção, arrays e funções.',
      level: 'L3',
      category: 'Provas',
      minutes: 9,
      xp: 30,
      vocabulary: [
        v('output', 'saída / resultado', 'console.log(output) imprime o resultado.', 'O que o programa mostra no ecrã.'),
        v('console.log', 'imprimir', 'console.log(2 + 2) imprime 4.', 'Forma mais comum de ver um valor.'),
        v('coerção', 'conversão implícita de tipo', '2 + "3" resulta em "23".', 'JavaScript converte tipos automaticamente.'),
        v('igualdade estrita', 'igualdade sem coerção', '1 === "1" é false.', 'Compara valor e tipo.'),
        v('map', 'transformar cada elemento', '[1, 2].map(n => n * 2) devolve [2, 4].', 'Cria um novo array com os resultados.'),
        v('const', 'declarar constante', 'const total = 10;', 'Não pode ser reatribuída.'),
      ],
    },
    [
      mc('O que imprime `console.log(2 + "3")`?', ['"23"', '5', 'NaN'], 0, 'O + com um operando string concatena: 2 vira "2" e o resultado é "23".'),
      mc('Qual o valor de `[1, 2, 3].map(n => n * 2)`?', ['[2, 4, 6]', '[1, 4, 9]', '6'], 0, 'map aplica a função a cada elemento e cria um novo array.'),
      mc('Qual é o tipo de `1 === "1"` e o seu valor?', ['false', 'true', 'TypeError'], 0, 'A igualdade estrita (===) compara valor e tipo: number ≠ string.'),
      read('function soma(a, b) {\n  return a + b;\n}\nconsole.log(soma(2, 3));', 'O que é impresso?', ['5', '"23"', 'undefined'], 0, 'soma(2, 3) devolve 2 + 3 = 5 e console.log imprime 5.'),
      fill('Complete: `const x = 5; console.log(____)` imprime 5.', ['x'], 'console.log(x) imprime o valor guardado em x.'),
      match(
        [
          { term: 'console.log', translation: 'imprimir um valor' },
          { term: '===', translation: 'igualdade estrita, sem coerção' },
          { term: 'map', translation: 'transformar cada elemento' },
          { term: 'const', translation: 'declarar uma constante' },
        ],
        'Vocabulário técnico essencial para provas de leitura de código.',
      ),
      fill('Complete: `[1, 2].map(n => n * 2)` devolve ____.', ['[2, 4]'], 'map aplica n => n * 2 a cada elemento: 1→2, 2→4.'),
    ],
    'javascript',
  ),
];

export const pythonExamLessons = [
  createLesson(
    {
      id: 'py-exam-previsao',
      title: 'Prova L3: previsão de código',
      subtitle: 'Lê o código e prevê o resultado, como numa prova técnica',
      objective: 'Prever o output de código Python com range, len, funções e erros de tipo.',
      level: 'L3',
      category: 'Provas',
      minutes: 9,
      xp: 30,
      vocabulary: [
        v('print', 'imprimir', 'print("olá") mostra olá no ecrã.', 'Forma mais comum de ver um valor.'),
        v('range', 'sequência de números', 'list(range(3)) devolve [0, 1, 2].', 'range(n) gera de 0 a n-1.'),
        v('len', 'comprimento', 'len("olá") devolve 3.', 'Conta caracteres ou elementos.'),
        v('indentation', 'indentação', 'O corpo da função é indentado.', 'Define os blocos em Python.'),
        v('TypeError', 'erro de tipo', '5 + "3" gera TypeError.', 'Operação inválida entre tipos diferentes.'),
        v('return', 'devolver um valor', 'return soma', 'Devolve o resultado de uma função.'),
      ],
    },
    [
      mc('O que acontece com `print(5 + "3")`?', ['TypeError', '8', '53'], 0, 'Python não soma int com str — levanta TypeError.'),
      mc('O que imprime `print(list(range(3)))`?', ['[0, 1, 2]', '[1, 2, 3]', '3'], 0, 'range(3) gera 0, 1 e 2 — nunca inclui o 3.'),
      mc('Qual é o resultado de `len("olá")`?', ['3', '4', '2'], 0, 'Em Python 3, cada caractere Unicode conta como 1: ó, l, á → 3.'),
      read('def dobro(n):\n    return n * 2\n\nprint(dobro(21))', 'O que é impresso?', ['42', '21', '"21 * 2"'], 0, 'dobro(21) devolve 21 * 2 = 42 e print mostra 42.'),
      fill('Complete: `____("olá")` devolve 3.', ['len'], 'len() devolve o número de caracteres da string.'),
      match(
        [
          { term: 'print', translation: 'imprimir no ecrã' },
          { term: 'len', translation: 'comprimento' },
          { term: 'range', translation: 'sequência de números' },
          { term: 'return', translation: 'devolver um valor' },
        ],
        'Vocabulário técnico essencial para provas de leitura de código.',
      ),
      fill('Complete: `list(range(3))` devolve ____.', ['[0, 1, 2]'], 'range(3) gera 0, 1 e 2; list() transforma-os numa lista.'),
    ],
    'python',
  ),
];

export const examPrepLessons = [
  ...enExamLessons,
  ...esExamLessons,
  ...nlExamLessons,
  ...frExamLessons,
  ...deExamLessons,
  ...itExamLessons,
  ...javascriptExamLessons,
  ...pythonExamLessons,
];
