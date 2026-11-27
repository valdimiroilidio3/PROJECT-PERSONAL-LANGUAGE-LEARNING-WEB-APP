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
