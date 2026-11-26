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
