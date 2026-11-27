# Validação em browser real e publicação — 26 nov 2026

## Ambiente

- Browser real: Chromium 158 (headless) controlado por Puppeteer, com `IndexedDB` e `speechSynthesis` disponíveis.
- Viewports testados: desktop 1280×900 e telemóvel 390×844 com touch.
- Código validado: commit `8cdd9c6` no branch `arena/3a5be4ee-project-personal-language-lear`.

## Fluxo `greetings → recarregar → progresso`

1. `/lesson/greetings` abriu com o título, objetivo e 7 exercícios.
2. Lição concluída no browser: escolha múltipla, tradução, ordem de palavras, associação, diálogo, listening e preenchimento.
3. Resumo apresentou **25 XP**, **100% de acerto** e mensagem de que os resultados ficaram guardados neste browser.
4. Recarregamento da página: a lição voltou ao intro, como esperado; o progresso não se perdeu.
5. `/progress` mostrou **1 lição concluída**, histórico com `Saudações e apresentações`, 8 respostas registadas e XP do dia.
6. A lição foi reaberta e concluída uma segunda vez: **0 XP** e aviso explícito “Esta lição já tinha sido concluída, por isso não atribui XP duplicado.”

Evidência: `validation/lesson-summary.png`, `validation/browser-validation.log`.

## Áudio dos exercícios de listening

- No exercício listening de `greetings`, o controlo de áudio estava presente (`Ouvir a frase em inglês`) juntamente com a ajuda “Ouve quantas vezes quiseres”.
- O browser chamou a Web Speech API com `Good morning! How are you?` em `en-US`, primeiro a velocidade `1` e depois a velocidade lenta `0.65` (botão `0.75×`, `aria-pressed=true`).
- Uma resposta errada foi submetida de propósito: o feedback mostrou corretamente a resposta e a linha **“Transcrição: Good morning! How are you?”**. O botão `Tentar novamente` voltou ao exercício e aceitou a resposta correta.
- Limitação honesta: o Chromium headless deste ambiente não tem vozes instaladas nem dispositivo de som, pelo que foi possível verificar as chamadas de síntese feitas pelo browser, mas não escutar a saída física.

## Navegação móvel

- Viewport 390×844: navegação inferior `grid`, sidebar `none`, largura do documento `390px` (sem overflow horizontal).
- Botões da barra inferior: `Início`, `Aprender`, `Praticar`, `Tutor`, `Progresso`, todos com 71 px de altura.
- Navegação por toque verificada para `/`, `/learn`, `/tutor` e `/progress`; cada rota abriu o conteúdo esperado sem erros de consola.
- Evidência: `validation/mobile-progress.png`, `validation/mobile-home.png`.

## Offline-first

- Com a rede do browser desligada **depois de carregar a aplicação**, a lição `greetings` foi concluída normalmente e não foi feito qualquer pedido a hosts externos.
- Ao voltar a ligar a rede, `/progress` mostrou a lição guardada — a persistência em `IndexedDB` funciona na prática.
- `/api/tutor` reporta `{"modes":[]}` e a interface mostra “Sem modelo configurado. O modo offline funciona sempre.” O tutor offline respondeu em inglês com tradução em português europeu e sugestões, sem chamadas externas. Evidência: `validation/tutor-offline.png`.
- Limitação: não existe service worker; um recarregamento **a frio sem rede** ainda depende dos ficheiros já descarregados. O modo offline-first verificado cobre o uso da aplicação já carregada e a persistência local, não uma PWA instalável.

## Publicação na Vercel

- Projeto criado: `lumio-english` (`prj_3JsZDWYxlVxVWmMxZlMRIQvluiAZ`), equipa `ORBITA`.
- Deploy de produção: `dpl_6E4qNpSRt9AiAAXYL3oJoweNMJL5`, commit `8cdd9c6`, estado `READY`.
- URL pública: **https://lumio-english.vercel.app**
- Variáveis de ambiente do projeto: **nenhuma** (`envs: []`). O build usou apenas variáveis automáticas da plataforma.
- Verificação em produção: `GET /api/tutor` devolveu `modes: []` com os limites habituais; `/`, `/learn`, `/lesson/greetings` e `/progress` renderizaram corretamente, com métricas reais zeradas para um visitante novo.
- Não foi possível controlar a Vercel com o browser deste sandbox (saída bloqueada para `*.vercel.app`); as páginas de produção foram verificadas por fetch HTTP, e a interação em browser foi feita na build idêntica em `localhost`.

## Observação

- O cartão da lição `greetings` indica `20 XP` como recompensa máxima, mas a regra atual de XP atribui 25 XP numa execução perfeita. Não alterei a regra de pontuação sem aprovação, para não mudar critérios de avaliação já existentes.

---

# Expansão multilingual — 26 nov 2026 (segunda validação)

## Pacotes adicionados

O catálogo passou a ter oito percursos independentes: inglês (16 lições), espanhol (3), holandês (2), francês (2), alemão (2), italiano (2), JavaScript (2) e Python (2) — 31 lições e 15 cenários de prática. Cada pacote tem vocabulário, exercícios validados, diagnóstico retirado do conteúdo real e um cenário de tutor offline. Os percursos de código usam `L1/L2/L3` e não mostram controlos de áudio nem rótulos CEFR inventados.

## Browser real (Chromium 158)

- Configuração inicial: as oito opções apareceram; escolhi espanhol, percorri as 4 etapas e o mini-diagnóstico gerado a partir das perguntas reais da lição `es-saludos`; o plano final abriu `/learn` com “Aprender espanhol”.
- Lição `es-saludos`: concluída com 100% de acerto e 25 XP; resumo e `/progress` mostraram a lição guardada após recarregamento. Evidência: `validation/spanish-summary.png`.
- Troca para holandês: `/learn` mostrou “0 de 2 lições”, confirmando que o progresso de espanhol não contamina o novo percurso. Evidência: `validation/dutch-learn.png`.
- Troca para JavaScript: rótulos “Iniciação”, nenhum botão de áudio enganoso, campo com placeholder “Escreve o código…”. A lição `js-variaveis` foi concluída com acerto, incluindo exercício de código. Evidência: `validation/javascript-summary.png`.
- Regresso a espanhol: a lição concluída e as estatísticas continuavam presentes.
- Mobile 390×844: seletor de língua visível na barra superior, sem overflow horizontal; troca para Python atualizou a página e mostrou as duas lições do percurso. Evidência: `validation/mobile-python.png`.
- Nenhum erro de consola ou de página foi registado.

## Automações

`npm run typecheck`, `npm run lint`, `npm test` e `npm run build` terminaram com código 0. A suíte ficou com 13 ficheiros e 40 testes, incluindo isolamento de progresso entre inglês, espanhol e JavaScript e validação do catálogo completo.

### Publicação da versão multilingual

- Deploy de produção: `dpl_Bzxyji8bg97Qhtcma8NmPb1piZ9Z`, commit `f77ab59`, estado `READY`, alias **https://lumio-english.vercel.app**.
- Variáveis de ambiente: nenhuma (`envs: []`). `GET /api/tutor` em produção continuou a devolver `modes: []`.
- Verificação em produção: `/` e `/onboarding` renderizam as oito opções de aprendizagem e o título genérico “Lumio — Aprende todos os dias”.

---

# Gamificação profissional — 26 nov 2026 (terceira validação)

Inspirado nos padrões de produto de Duolingo e Tooter, mas com identidade, componentes e conteúdo originais e sem copiar ecrãs ou personagens.

## Implementado

- **Missões de hoje**: quatro cartões com progresso real — concluir uma lição, responder 10 vezes, ganhar o XP alvo e rever 3 palavras. Contagens vêm apenas de `completions`, `attempts`, XP atribuído e vocabulário guardado.
- **Ligas pessoais**: Bronze, Prata, Ouro, Safira e Diamante, com limiares explícitos e barra até ao próximo nível. Não existem rivais fictícios nem XP inventado.
- **Revisão da sessão**: no fim de cada lição, precisão por tipo de exercício, pontos guardados para revisão e atalho para o caderno.
- **Selo de liga** no cabeçalho móvel, derivado do XP total guardado.

## Browser real (Chromium 158)

- Painel inicial com 0/4 missões e liga Bronze antes de qualquer atividade.
- Lição `greetings` concluída com 100%: a revisão da sessão mostrou 7 categorias, todas 1/1, e 0 pontos guardados para revisão (respostas corretas). Evidência: `validation/session-review.png`.
- Regresso ao painel: 2/4 missões concluídas, `7 / 10 respostas`, `20 / 20 XP`, 8 palavras com revisão pendente e `75 XP até Prata`. Evidência: `validation/gamified-dashboard.png`.
- Mobile 390×844: missões e liga visíveis, `scrollWidth = innerWidth = 390`, sem overflow. Evidência: `validation/gamified-mobile.png`.
- Nenhum erro de consola.

## Automações

`typecheck`, `lint`, `test` e `build` terminaram com código 0. A suíte ficou com 14 ficheiros e 44 testes, incluindo limiares de liga e cálculo de missões a partir de atividade guardada.

### Publicação da gamificação

- Deploy de produção: `dpl_EVDBC6CiGhtdhysr1CetChopS3JJ`, commit `8c29a3c`, estado `READY`, alias **https://lumio-english.vercel.app**.
- Verificação em produção: as quatro missões, os limiares das ligas e a explicação “Não há rivais inventados” apareceram no painel inicial com dados zerados para um visitante novo.

---

# Rotinas semanais — 26 nov 2026 (quarta validação)

## Implementado

- **Quinta missão rotativa**: um de quatro desafios muda de forma determinística com o dia local (cenário de prática, respostas corretas, segunda lição ou minutos de estudo). O progresso vem apenas de eventos guardados nesse dia.
- **Desafios da semana**: três de quatro objetivos rotativos (XP semanal, dias ativos, respostas ou revisões), sempre dentro de uma janela de segunda a domingo. Nenhum valor é inventado.
- **Jardim de hábitos**: 28 dias reais com atividade guardada. Dias vazios não retiram XP, liga ou conquistas.
- Correção de layout: `min-w-0` nos cartões das grelhas do painel evita que conteúdos longos em 390 px expandam a página.

## Browser real (Chromium 158)

- Painel novo: 5 missões, quinta missão “Estuda 10 minutos”, 0 de 5 concluídas; desafios da semana `23/11 – 29/11` todos a zero; jardim com `0 dias com atividade`. Evidência: `validation/weekly-before.png`.
- Lição `greetings` concluída com 100% de acerto.
- Regresso ao painel: 2 de 5 missões concluídas, `7 / 10 respostas`, `20 / 20 XP`; desafios da semana com `25 / 150 XP`, `1 / 3 dias` e `7 / 40 respostas`; jardim com `1 dia com atividade` e `25 XP no período`. Evidência: `validation/weekly-after.png`.
- Mobile 390×844: desafios e jardim visíveis, `scrollWidth = innerWidth = 390`, sem overflow. Evidência: `validation/weekly-mobile.png`.
- `ERRORS []`: nenhum erro de consola ou de página.

## Automações

`npm run typecheck`, `npm run lint`, `npm test` e `npm run build` terminaram com código 0. A suíte ficou com 14 ficheiros e 49 testes, cobrindo rotação diária, janela semanal, contagens por dia ativo e o facto de dias vazios não subtraírem progresso. O build gerou 12 rotas.

### Publicação das rotinas semanais

- Deploy de produção: `dpl_ESqu474PXuNJMm4qZjV2kz5af93C`, commit `8efff13`, estado `READY` com `readySubstate PROMOTED`, alias **https://lumio-english.vercel.app**.
- Verificação em produção: painel com 5 missões (a quinta “Estuda 10 minutos”), desafios na janela `23/11 – 29/11` e jardim com `0 dias com atividade` para um visitante novo. Nenhuma variável de IA foi adicionada; `GET /api/tutor` continua a devolver `modes: []`.

---

# Mais vida no Lumio — 26 nov 2026 (quinta validação)

Pedido: mais imagens, animações de acerto/erro, mais vozes para ditar as frases e mais missões/tarefas. Tudo 100% local e derivado de atividade guardada.

## Implementado

- **Ilustrações originais do Nori** (comissionadas para o Lumio, sem material de terceiros): jornada ao nascer do sol (`public/images/nori-journey.jpg`, também OG do site), pódio da liga (`nori-league.jpg`) e jardim de hábitos (`nori-garden.jpg`).
- **Animações com intenção**: explosão de confete no painel de feedback de acerto; abanão curto no cartão e pop no coração ao errar; chuva de confete no ecrã de resultados; XP, acerto e minutos contam a partir de zero até ao valor real (nunca inventado); barras de competências animadas por tipo de exercício; mascote saltita no fim da lição; chama de sequência pulsante no cabeçalho móvel. Tudo respeita `prefers-reduced-motion`.
- **Vozes de leitura (Definições)**: 4 personas (Automática, Nori energético, Mentor calmo, Expresso) que remodelam a voz do sistema (altura/velocidade) + seletor por língua com as vozes que o browser/SO expõe, ordenadas por correspondência (locale exato > prefixo; vozes locais antes de online; motores completos antes de compactos), pré-escuta e estado vazio honesto. A escolha fica em `localStorage` e aplica-se a todos os botões de ouvir frases (lições, prática, revisão, tutor offline). Nada é gravado nem enviado.
- **Mais missões**: 6 missões diárias (4 fixas + 2 rotativas de um conjunto de 7 — cenário, respostas certas, segunda lição, minutos de estudo, escutas, lição sem erros, 2 palavras no caderno); desafios da semana mostram agora 4 de 6 objetivos rotativos (XP, dias ativos, respostas, revisões, 45 minutos, 2 lições sem erros); novo **Desafio do mês** (janela de calendário local: 400 XP / 12 dias / 120 respostas / 8 lições, escolhido pelo mês).
- Metadados OpenGraph com a ilustração da jornada.

## Browser real (Chromium via @sparticuz/chromium)

27/27 verificações PASS, 0 erros de página/consola:

- Painel: 6 missões com contador `0 de 6 concluídas`; Desafio do mês (novembro 2026 → “Responde 120 vezes”); 4 desafios da semana; imagens do pódio e do jardim carregadas; sem overflow horizontal em 390 px. Evidência: `validation/life-dashboard.png`, `validation/life-mobile.png`.
- Onboarding: banner da jornada renderizado (`naturalWidth > 0`). Evidência: `validation/life-onboarding.png`.
- Lição `greetings` completa por automação: acerto detetado → confete detetado no painel (`validation/life-feedback-correct.png`); erro → abanão detetado e resposta correta revelada (`validation/life-feedback-wrong.png`); “Tentar novamente” acertou; resumo com `XP recebido` contado até 23 após 1 erro em 7 (`validation/life-summary.png`).
- Definições: secção “Vozes de leitura”, 4 personas com pré-escuta, estado vazio honesto para vozes (Chromium headless não expõe vozes). Evidência: `validation/life-settings-voices.png`.
- Lições do Chromium headless não têm vozes do sistema; em Chrome/Edge real aparecem no seletor. O estado vazio não bloqueia nada.

## Automações

`npm ci` (node_modules não vem no snapshot), `npm run typecheck`, `npm run lint`, `npm test` (15 ficheiros, 60 testes) e `npm run build` (12 rotas) — todos com código 0. Novos testes: rotação de 7 variantes de missão em 2 slots, 6 objetivos semanais com novas contagens (minutos, lições perfeitas), janela e contagens do Desafio do mês, ranking/seleção de vozes e personas.

## Publicação

Ainda não publicado em produção — aguarda integração em `main` e deploy.

# Tutor com personagens e conversa por voz — 27 nov 2026 (sexta validação)

## O que foi implementado

- **Personagens de roleplay** (`lib/tutor/characters.ts`): cada cenário do tutor é interpretado por uma personagem original e distinta (Nori, Maya, Tomás, Rui, Sofia, Leo, Dr.ª Campos, Ana, Dev Ruiz), com nome, papel na cena, mini-biografia para o modelo remoto e emoji na interface. O botão "Começar com {personagem}" faz a personagem abrir a cena em voz da conversa.
- **Conversa por voz** no `/tutor` (apenas quando o browser suporta reconhecimento e síntese e a língua tem voz): toggle "Conversa por voz" na barra da conversa; ao parar de falar, a transcrição é enviada automaticamente; a resposta da personagem é lida em voz alta no sotaque/persona de voz escolhida em Definições. Nas mensagens ditadas aparece o rótulo "Ditado por voz · N palavras · a transcrição vem do browser e não mede pronúncia".
- **Cartão de fluência local** (`lib/tutor/fluency.ts`, "Como está a tua fluência (texto)"): palavras, variedade lexical, muletas (uh/um/…), tamanho médio/máximo das frases — calculado apenas a partir do texto escrito ou ditado, com sugestões e sugestão de dificuldade com um clique. Nunca avalia pronúncia, sotaque, entoação ou tempos verbais de fala.
- **Tutor remoto em personagem**: o system prompt manda o modelo interpretar a personagem (sem quebrar a quarta parede), responder em no máximo duas frases curtas e, nas correções, incluir apenas dicas de estudo de pronúncia quando aplicável — nunca classificações.
- **Abertura offline em personagem**: a conversa começa pela fala de abertura da personagem (fluxo "Começar com"); o modo offline compensa o turno para não repetir a abertura.
- **Honesto por desenho**: sem gravação, sem rede adicional (quando offline), sem métricas inventadas; o painel declara os limites da análise.

## Verificação

- Chromium (via `@sparticuz/chromium` + `playwright-core`) em desktop e mobile (390 px): toggle de voz ativa e legenda de envio automático visíveis, personagem e abertura renderizadas, correção local de gramática aplicada ("I am agree" → "I agree"), painel de fluência com valores reais a partir do texto ditado/escrito, sem erros de página ou de consola, sem overflow horizontal no mobile. Evidência: `validation/tutor-character.png`, `validation/tutor-mobile.png`.
- Testes novos em `tests/tutor-fluency.test.ts`: fluência (contagem, variedade, muletas, frases), sugestão de dificuldade (subir/consolidar/neutro), cobertura de personagens para todos os pacotes e cenários, abertura por personagem.
- `npm run typecheck`, `npm run lint`, `npm test` (16 ficheiros, 71 testes) — todos com código 0.

## Publicação

Ainda não publicado em produção — aguarda integração em `main` e deploy.

# Vida visual, segunda ronda — 27 nov 2026 (sétima validação)

## O que foi implementado

- **Três novas ilustrações originais** no mesmo estilo de aquarela: `nori-practice.jpg` (Nori atrás do balcão de um café, para a seleção de situações de prática), `nori-review.jpg` (Nori num canto de leitura a jogar com cartões de vocabulário, para o estado vazio da revisão e do caderno e para o fim da sessão de revisão) e `nori-progress.jpg` (Nori no cimo de um monte com bandeira de estrela, no cabeçalho do Progresso).
- **Entra em cena** (`components/effects.tsx`): `Stagger`/`StaggerItem` (entrada em cascata da grelha de situações), `FadeUp` (secções) e componentes que devolvem `<div>` simples quando `prefers-reduced-motion` está ativo.
- **EmptyState com ilustração opcional** (`components/ui.tsx`): estado vazio da revisão e do caderno mostram a ilustração; sem ilustração o comportamento anterior mantém-se.
- **ProgressBar com brilho** (`app/globals.css` + `ui.tsx`): brilho em onda via `::after`, desativado com `prefers-reduced-motion`.
- **Celebrações**: confetti no ecrã de resultado da prática e no fim da sessão de revisão, check-circle da prática com pop elástico, XP ganho na prática com CountUp, conquistas conquistadas no Progresso com pop elástico escalonado.
- Testes novos: `tests/life-visual.test.tsx` (ilustração no EmptyState, cascata/FadeUp, papel progressbar).

## Verificação

- Chromium (via `@sparticuz/chromium` + `playwright-core`): hero de prática visível e sem overflow em desktop e 390 px, estados vazios com ilustração, Progresso com ilustração (escondida no mobile por desenho), 0 erros de página/consola. Evidência: `validation/practice-hero.png`, `validation/review-empty.png`, `validation/vocabulary-empty.png`, `validation/progress-life.png`, `validation/life-mobile.png`.
- `npm run typecheck`, `npm run lint`, `npm test` (17 ficheiros, 75 testes) e `npm run build` (12 rotas) — todos com código 0.
- Nota: o servidor de desenvolvimento ("Lumio app") foi reiniciado — o `.next/` tinha sido substituído pelo `npm run build` com o dev server ligado.

## Publicação

Ainda não publicado em produção — aguarda integração em `main` e deploy.

# Vida visual, terceira ronda — 27 nov 2026 (oitava validação)

## O que foi implementado

- **Duas novas ilustrações originais**: `nori-learn.jpg` (Nori com mochila e livro, a caminho da "escola" — hero da página Aprender) e `nori-lesson.jpg` (Nori no quadro a explicar — banner do ecrã de introdução da lição).
- **Aprender**: hero ilustrado, grelha de lições e secção "Como funciona" entram em cascata.
- **Intro da lição**: banner da sala de aula no cartão de abertura.
- **Dashboard**: seis tiles de estatísticas entram em cascata (FadeUp escalonado).
- **Onboarding**: o passo final "Plano pronto" celebra com confetti e pop elástico do mascote.
- `StatTile` preenche a altura do contentor para alinhamento uniforme.

## Verificação

- Chromium em desktop e 390 px: hero de Aprender visível (16 lições em cascata), banner da lição visível, botão "Começar lição" presente, dashboard completo sem overflow, 0 erros de página/consola. Evidência: `validation/learn-hero.png`, `validation/lesson-intro.png`, `validation/dashboard-life.png`, `validation/life2-mobile.png`.
- `npm run typecheck`, `npm run lint`, `npm test` (17 ficheiros, 75 testes) e `npm run build` (12 rotas) — todos com código 0 (uma primeira execução do build falhou transientemente a seguir ao compile e passou à segunda; o dev server foi reiniciado de seguida).
- Rotas confirmadas com HTTP 200 no dev server após reinício.

## Publicação

Ainda não publicado em produção — aguarda integração em `main` e deploy.

# Expansão do catálogo em todos os pacotes — 27 nov 2026 (nona validação)

## O que foi implementado

- **Sete novas lições** (uma por pacote não-inglês), no mesmo formato e validação das existentes: `es-familia` (La familia y los amigos), `nl-winkelen` (Winkelen in de winkel), `fr-restaurant` (Au restaurant), `de-einkauf` (Einkaufen im Supermarkt), `it-ristorante` (Al ristorante), `js-arrays` (Arrays e métodos, L2) e `py-ciclos` (Ciclos for, L2). Cada lição traz vocabulário novo e 6–7 exercícios validados no arranque do módulo.
- **Sete novos cenários de prática** (um por pacote não-inglês): `es-cafe`, `nl-winkel`, `fr-restaurant`, `de-bahnhof`, `it-mercato`, `js-arrays` e `py-ciclos` — palavras-chave, traduções e modelos alinhados com os prompts.
- **Tutor offline em personagem nas novas cenas** (aberturas e guião próprio para cada um dos sete cenários) e **novas personagens**: Lucía (café La Esquina), Sanne (loja de Amesterdão), Théo (bistrô Chez Théo), Jonas (bilheteira na estação), Giulia (mercado) e Dev Ruiz (arrays e ciclos).
- Testes novos: `tests/content-expansion.test.ts` (mínimo de 3 lições e 2 cenários por pacote, consistência prompts/keywords/modelos, personagens e abertura do tutor para os sete cenários novos).

Estado do catálogo: **38 lições e 22 cenários** (inglês 16 lições/8 cenários; espanhol 4/2; os restantes pacotes 3 lições/2 cenários cada).

## Verificação

- `npm run typecheck`, `npm run lint`, `npm test` (**18 ficheiros, 81 testes**) — todos com código 0. `validateLessons` corre no arranque do módulo e é exercida pelos testes.
- `npm run build` ×2 (12 rotas) — OK nas duas execuções consecutivas.
- Dev server reiniciado após o build; todas as rotas respondem HTTP 200 (incluindo as sete novas lições).
- Nota honesta: o e2e em Chromium headless não pôde correr nesta ronda — o sandbox foi recriado e `libnspr4.so`/`libnss3.so`/`libnssutil3.so` não existem no sistema (sem permissão para instalar). Verificação feita por testes de conteúdo, build e arranque de todas as rotas; a próxima validação com browser deve repetir esta ronda no visual.
- Documentação atualizada (`README.md`: 22 cenários, 81 testes).

## Publicação

Ainda não publicado em produção — aguarda integração em `main` e deploy.

# Simulados, provas e preparação de exames — 27 nov 2026 (décima validação)

## O que foi implementado

- **Simulados A1 (“Simulados”)** em `/exames`: um por língua natural (inglês, espanhol, neerlandês, francês, alemão, italiano), cada um com 10 questões originais de escolha múltipla distribuídas por leitura (passagem partilhada, 4 itens), audição (3 itens, voz do sistema com texto repetível) e vocabulário (3 itens). Perguntas originais baseadas no percurso — não são exames oficiais e não emitem certificado; o resultado é declarado indicativo na interface e no cabeçalho de `lib/exams.ts`.
- **Simulador de exame completo**: cronómetro estrito de 10 minutos com entrega automática a zero, nota por secção e nota global, patamar de aprovação de 60%, ecrã de resultado com confetti (reduzido a zero se preferires menos animação), XP de 1 por acerto mais 10 de bónus por aprovação, e tentativas gravadas no progresso (`practice`). Pacotes de programação mostram um estado vazio honesto em vez de um exame falso de proficiência.
- **Oito novas lições de preparação para exames** (uma por pacote): `en-formal-email` (A2, email formal), `es-exam-avisos`, `nl-exam-omroepen`, `fr-exam-annonces`, `de-exam-durchsagen`, `it-exam-annunci` (A2, leitura/audição de avisos e registo formal), `js-exam-previsao` e `py-exam-previsao` (L3, previsão de código, formato de prova técnica). Catálogo: 46 lições (inglês 17; espanhol 5; neerlandês/francês/alemão/italiano 4 cada; JavaScript/Python 4 cada).
- **Seis novos cenários de prática (A2, credibilidade)**: `en-networking` e cinco entrevistas formais — `es-entrevista`, `nl-sollicitatie`, `fr-entretien`, `de-vorstellungsgespraech`, `it-colloquio` — com tutor offline em personagem (aberturas, guiões, personagens: Priya, Elena Ruiz, Mark, Chloé, Hannah, Marco). Catálogo: 28 cenários (inglês 9; 3 cada nos pacotes naturais restantes; 2 cada nos pacotes de código).
- **Ligação na interface**: item “Simulados” (GraduationCap) na navegação lateral entre Revisão e Progresso; a XP do topo continua a contar completions + tentativas de prática/revisão, incluindo as tentativas de simulado.
- Testes: `tests/exams.test.ts` (estrutura dos 6 simulados, unicidade e validade das questões, pontuação por patamar de 60%, bónus de XP, formato "N/M") e `tests/content-expansion.test.ts` alargado (novas lições e cenários). **19 ficheiros, 89 testes.**
- README atualizado (46 lições, 28 cenários, 89 testes, rota `/exames`, personagens novas).

## Verificação

- `npm run typecheck`, `npm run lint`, `npm test` (19 ficheiros, 89 testes) e `npm run build` (13 rotas, `/exames` estático, 12.7 kB) — todos com código 0.
- Dev server reiniciado após o build; todas as rotas respondem HTTP 200 (`/`, `/learn`, `/practice`, `/tutor`, `/vocabulary`, `/review`, `/exames`, `/progress`, `/settings`, `/onboarding`).
- Nota honesta: o e2e em Chromium headless continua indisponível neste sandbox (faltam `libnspr4.so`/`libnss3.so`/`libnssutil3.so`, sem permissão para instalar). Verificação feita por testes unitários/de conteúdo, build e arranque de todas as rotas; a interação completa do simulado (cronómetro, áudio, entrega automática) deve ser repetida no browser na próxima ronda com ambiente completo.

## Publicação

Ainda não publicado em produção — aguarda integração em `main` e deploy.

# Simulados A2 para inglês e espanhol — 27 nov 2026 (décima primeira validação)

## O que foi implementado

- **Dois simulados A2 originais** — `en-a2` e `es-a2` em `lib/exams.ts` — com **15 questões de escolha múltipla** (leitura 6 com passagem partilhada sobre planos de fim de semana, audição 5 com voz do sistema, vocabulário 4 de registo de exame), **15 minutos** e aprovação indicativa a partir de 60%. XP mantém a regra: 1 por acerto + 10 de bónus por aprovação (tudo certo = 25 XP).
- **`/exames` com seletor de nível A1/A2** (tabs "A1 · Base" / "A2 · Elementar") visível apenas para inglês e espanhol; os restantes pacotes naturais mantêm só o A1 e os pacotes de código mantêm o estado vazio honesto. `examsFor()` devolve os simulados por língua; `examFor(languageId, level)` continua a devolver o A1 por omissão.
- Perguntas originais baseadas no percurso A2 (planos e fim de semana, pedidos em lojas e transportes, registo formal) — não são exames oficiais e não certificam nada; o resultado é declarado indicativo.
- Testes: `tests/exams.test.ts` alargado — formato dos A2 (15/15 min/60%, secções 6-5-4), `examsFor` por pacote, patamar de 60% no A2 (9/15 aprova), 25 XP com tudo certo. **19 ficheiros, 91 testes.**
- README atualizado (simulados A1+A2, 91 testes).

## Verificação

- `npm run typecheck`, `npm run lint`, `npm test` (19 ficheiros, 91 testes) e `npm run build` (13 rotas, `/exames` estático, 15.7 kB) — todos com código 0.
- Dev server reiniciado após o build; todas as rotas respondem HTTP 200.
- Nota honesta: o e2e em Chromium headless continua indisponível neste sandbox; a interação completa (seletor de nível, cronómetro, áudio, entrega automática) deve ser repetida no browser.

## Publicação

Ainda não publicado em produção — aguarda integração em `main` e deploy.

# Simulados na dashboard e na revisão — 27 nov 2026 (décima segunda validação)

## O que foi implementado

- **Dashboard**: novo cartão “Simulados” na barra lateral (a seguir a “Revisão inteligente”) com dados reais — melhor resultado por simulado (nota, `N/N`, tentativas, XP acumulado, estado “Aprovado”/“Por fazer”), barra de progresso e CTA direto (`/exames`). Para pacotes sem simulados (código), uma linha honesta explica a alternativa de exercícios e projetos.
- **Revisão**: banner compacto com o melhor resultado nos simulados (nível, `N/N`, percentagem) e ligação direta para `/exames`; escondido em pacotes sem simulados.
- **`examAttemptStats()`** em `lib/exams.ts` — derivada exclusivamente das tentativas guardadas (`<examId>-complete`); parse tolerante a formatos estranhos (ignora-os no cálculo do melhor resultado, mas conta-os como tentativas), `passed` só com patamar ≥ passPercent e pelo menos uma tentativa.
- Testes: `examAttemptStats` coberto em `tests/exams.test.ts` (tentativas, melhor resultado, XP, última data, patamar). **19 ficheiros, 92 testes.**

## Verificação

- `npm run typecheck`, `npm run lint`, `npm test` (19 ficheiros, 92 testes) e `npm run build` (13 rotas) — todos com código 0.
- Dev server reiniciado após o build; rotas `/`, `/review`, `/exames` (e restantes) respondem HTTP 200.
- Nota honesta: o e2e em Chromium headless continua indisponível neste sandbox; o cartão e o banner devem ser confirmados no preview.

## Publicação

`main` publica automaticamente no Vercel a cada merge (confirmado: merge do PR #6 → produção `READY`/`PROMOTED` às 20:33 UTC em https://lumio-english.vercel.app).
