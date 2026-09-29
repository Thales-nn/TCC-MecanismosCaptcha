# Especificação de Requisitos do Projeto

**Título:** Avaliação Experimental da Efetividade de Mecanismos CAPTCHA na Mitigação de Ataques Automatizados em Aplicações Web Métricas

**Autores:** Gabriel da Silva Oliveira, Thales Nogueira Nanuci

**Orientador:** Prof. Me. Claudio Luis Roveri Vieira

**Instituição:** Instituto Federal de Educação, Ciência e Tecnologia de São Paulo – Campus Salto

**Curso:** Ciência da Computação

---

## 1. Visão Geral do Projeto

O projeto consiste em uma aplicação web experimental que implementa dois tipos de mecanismos CAPTCHA — textual e deslizante — com o objetivo de avaliar, de forma quantitativa e comportamental, a efetividade de cada mecanismo na mitigação de ataques automatizados (bots). A aplicação permite que usuários humanos e bots automatizados interajam com os desafios CAPTCHA, coleta métricas de desempenho e comportamentais, e apresenta os resultados em um dashboard interativo com gráficos e tabelas detalhadas.

### 1.1 Objetivos

- Implementar dois mecanismos de CAPTCHA distintos (textual e deslizante) em uma aplicação web
- Desenvolver bots automatizados com diferentes níveis de sofisticação para simular ataques
- Coletar métricas de desempenho e comportamentais durante as tentativas de resolução
- Comparar a efetividade dos mecanismos contra bots e a usabilidade para humanos
- Apresentar os resultados em um dashboard interativo

### 1.3 Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Backend | Java 21, Spring Boot 4.1.0 |
| Persistência | MySQL 8.0, Hibernate/JPA |
| Templates | Thymeleaf |
| Frontend | JavaScript ES6, HTML5, CSS3, Chart.js |
| Bots | Python 3.12, Selenium WebDriver, Tesseract OCR, OpenCV |

---

## 2. Requisitos Funcionais

### RF-01 — Autenticação de Usuários

A aplicação deve possuir uma tela de login que autentica usuários com as credenciais `admin` / `1234`. Em caso de credenciais inválidas, deve exibir a mensagem "Usuário ou senha incorretos!". Após autenticação bem-sucedida, o usuário deve ser redirecionado para a página de seleção de CAPTCHA. O logout deve invalidar a sessão HTTP e redirecionar de volta para a tela de login.

**Endpoints:**
- `GET /` — Exibe tela de login
- `POST /login` — Valida credenciais e redireciona
- `POST /logout` — Invalida sessão e redireciona para login

---

### RF-02 — Geração de CAPTCHA Textual

A aplicação deve gerar CAPTCHAS textuais com as seguintes características:

- Código de **6 caracteres** selecionados aleatoriamente do charset `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (sem caracteres ambíguos como `0`, `O`, `1`, `I`)
- Renderização em **canvas HTML5** com dimensões de **320×100 pixels**
- Aplicação de ruído visual:
  - 8 linhas aleatórias com opacidade de 30%
  - 100 pontos aleatórios com opacidade de 25%
  - Fundo cinza claro (`#eeeeee`)
- Cada caractere deve ter:
  - Fonte `bold 42px Arial`
  - Cor `#222222`
  - Rotação aleatória de até ±0.25 radianos
  - Espaçamento horizontal de 48 pixels a partir de x=30, y=65

---

### RF-03 — Validação de CAPTCHA Textual

A validação do CAPTCHA textual deve:

- Comparar a resposta do usuário com o código gerado, **case-insensitive** (ambos convertidos para maiúsculas)
- Remover espaços em branco (`trim`) antes da comparação
- Exibir mensagem de sucesso ("✓ CAPTCHA correto!") ou erro ("✕ CAPTCHA incorreto!")
- Registrar o resultado (sucesso/erro) com o tempo de resolução em milissegundos
- Gerar automaticamente um novo CAPTCHA após cada tentativa (com intervalo de 500ms)
- Permitir ao usuário solicitar um novo CAPTCHA manualmente (botão de refresh)

---

### RF-04 — Geração de CAPTCHA Deslizante

A aplicação deve gerar desafios de CAPTCHA deslizante com as seguintes características:

- Posição alvo **aleatória entre 30% e 90%** da largura da trilha
- Zona alvo visível com **tolerância de ±3%** em relação à posição central
- Handle (controle deslizante) iniciando na posição 0%
- Barra de progresso que acompanha o handle
- Suporte a interação por **mouse** (mousedown, mousemove, mouseup) e **touch** (touchstart, touchmove, touchend) para compatibilidade mobile

---

### RF-05 — Validação de CAPTCHA Deslizante

A validação do CAPTCHA deslizante deve:

- Calcular a posição final do handle como percentual da largura da trilha
- Comparar a posição final com a posição alvo
- Considerar **acerto** quando a diferença absoluta entre a posição final e a posição alvo for **≤ 3%** (tolerância)
- Exibir mensagem de sucesso ("✓ Posição correta!") ou erro ("✕ Posição incorreta! Tente novamente.")
- Aplicar classes CSS visuais de sucesso/erro no handle
- Gerar automaticamente um novo desafio após cada tentativa (com intervalo de 1500ms)
- Permitir ao usuário solicitar um novo desafio manualmente (botão de refresh)

---

### RF-06 — Coleta de Métricas Comportamentais

A aplicação deve coletar métricas comportamentais durante a interação com o CAPTCHA deslizante:

| Métrica | Descrição |
|---|---|
| `velocidadeMedia` | Velocidade média do movimento do handle (%/ms) |
| `velocidadeMaxima` | Velocidade máxima instantânea registrada (%/ms) |
| `tempoTotal` | Tempo total da tentativa (ms) |
| `mudancasDirecao` | Número de vezes que o usuário mudou a direção do movimento |
| `trajetoria` | Array de pontos `{ t: ms, x: percentual }` registrados durante o arrasto |

**Cálculo de velocidade:** Para cada par consecutivo de pontos na trajetória, a velocidade instantânea é calculada como `|Δx| / Δt` (em %/ms).

**Detecção de mudança de direção:** Quando a direção do movimento (esquerda/direita) muda em relação à última direção não-nula registrada.

Para o CAPTCHA textual, a métrica comportamental coletada é o **tempo de resolução** em milissegundos (diferença entre o momento de geração do CAPTCHA e o momento de envio da resposta).

---

### RF-07 — Armazenamento de Resultados

A aplicação deve persistir cada tentativa de CAPTCHA no banco de dados com os seguintes campos:

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | Integer (auto-incremento) | Identificador único do registro |
| `tipoCaptcha` | String | `CAPTCHA_TEXTO` ou `CAPTCHA_DESLIZANTE` |
| `tentativa` | Integer | Número da tentativa na sessão |
| `resultado` | String | `SUCESSO` ou `ERRO` |
| `tempoMs` | Long | Tempo de resolução em milissegundos |
| `tipoUsuario` | String | `HUMANO`, `BOT_1`, `BOT_2`, `BOT_SLIDER_1`, `BOT_SLIDER_2` |
| `sessaoId` | String | Identificador único da sessão |
| `metricasComportamentais` | String (JSON) | Métricas comportamentais serializadas em JSON (apenas para CAPTCHA deslizante) |

**Tabela:** `resultados`

---

### RF-08 — Dashboard de Resultados

A aplicação deve fornecer um dashboard acessível em `GET /resultados` que exiba:

- **Cards de resumo** com:
  - Total de tentativas
  - Número de sucessos
  - Número de erros
  - Taxa de sucesso (%)
  - Tempo médio de resolução (ms)

- **Gráfico de rosca (doughnut)** mostrando a proporção entre sucessos e erros

- **Gráfico de linha** mostrando o tempo de cada tentativa individual

- **Tabela detalhada** com as colunas:
  - Número da tentativa
  - Resultado (com badge visual colorido: verde para sucesso, vermelho para erro)
  - Tempo (ms)
  - Tipo de usuário

O dashboard deve utilizar a biblioteca **Chart.js** para renderização dos gráficos.

---

### RF-09 — Filtros no Dashboard

O dashboard deve permitir filtrar os resultados exibidos por:

- **Tipo de CAPTCHA** (`CAPTCHA_TEXTO` ou `CAPTCHA_DESLIZANTE`)
- **Tipo de usuário** (`HUMANO`, `BOT_1`, `BOT_2`, `BOT_SLIDER_1`, `BOT_SLIDER_2`)

Os filtros devem atualizar dinamicamente os cards, gráficos e tabela.

---

### RF-10 — Cards Comparativos entre Tipos de CAPTCHA

O dashboard deve apresentar cards comparativos entre os dois tipos de CAPTCHA, exibindo para cada tipo:

- **Taxa de bloqueio de bots:** porcentagem de tentativas de bots que resultaram em erro
- **Taxa de sucesso humano:** porcentagem de tentativas humanas que resultaram em sucesso
- **Taxa de erro humano:** porcentagem de tentativas humanas que resultaram em erro
- **Tempo médio de resolução:** tempo médio em milissegundos

---

### RF-11 — Gráfico Comparativo de Bloqueio de Bots

O dashboard deve incluir um gráfico comparativo de **taxa de bloqueio de bots** entre os dois tipos de CAPTCHA, permitindo visualização da efetividade relativa de cada mecanismo.

---

### RF-12 — API REST para Resultados

A aplicação deve expor uma API REST em `/api/resultados` com os seguintes endpoints:

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/resultados` | Lista todos os resultados. Aceita parâmetro opcional `sessaoId` para filtrar por sessão. |
| `POST` | `/api/resultados` | Salva um novo resultado. Recebe JSON no corpo da requisição. |
| `GET` | `/api/resultados/agrupados` | Retorna resultados agrupados por `tipoCaptcha` e `tipoUsuario`, com totais, sucessos, erros e tempo médio calculados. |
| `DELETE` | `/api/resultados` | Remove todos os resultados armazenados. |

**Resposta do endpoint agrupado:**

```json
{
  "grupos": [
    {
      "tipoCaptcha": "CAPTCHA_TEXTO",
      "tipoUsuario": "BOT_1",
      "total": 50,
      "sucessos": 15,
      "erros": 35,
      "tempoMedio": 1200.5
    }
  ],
  "totalRegistros": 200
}
```

---

### RF-13 — Sessões de Teste

A aplicação deve gerenciar sessões de teste com as seguintes características:

- Cada sessão possui um **identificador único** no formato `SESSAO-{timestamp}-{random}` (para humanos) ou `BOT-{tipo}-{timestamp}` (para bots)
- O identificador de sessão é armazenado em `sessionStorage` do navegador
- Todas as tentativas dentro de uma mesma sessão compartilham o mesmo `sessaoId`
- O endpoint `GET /api/resultados` permite filtrar resultados por `sessaoId`
- O tipo de usuário (`HUMANO`, `BOT_1`, etc.) também é armazenado em `sessionStorage`

---

### RF-14 — Navegação entre os Dois Tipos de CAPTCHA

A aplicação deve permitir a navegação entre os dois tipos de CAPTCHA através das rotas:

| Rota | Descrição |
|---|---|
| `GET /captcha` | Página com CAPTCHA textual |
| `GET /captcha-slider` | Página com CAPTCHA deslizante |

Ambas as páginas devem estar acessíveis após autenticação e devem possuir links de navegação entre si e para o dashboard de resultados.

---

### RF-15 — Limpar Resultados

A aplicação deve permitir limpar todos os resultados armazenados para reiniciar os testes. Esta funcionalidade é provida pelo endpoint `DELETE /api/resultados`, que remove todos os registros da tabela `resultados`.

---

## 3. Requisitos Não Funcionais

### RNF-01 — Linguagem e Framework Backend

A aplicação backend deve ser desenvolvida em **Java 21** com **Spring Boot 4.1.0**, utilizando as dependências de Spring Web, Spring Data JPA, Thymeleaf e MySQL Connector.

### RNF-02 — Banco de Dados

A persistência deve utilizar **MySQL 8.0** com as seguintes configurações:

- URL de conexão: `jdbc:mysql://localhost:3306/captcha`
- Dialeto Hibernate: `org.hibernate.dialect.MySQLDialect`
- Estratégia de DDL: `update` (criação/atualização automática de tabelas)
- Exibição de SQL: habilitada

### RNF-03 — Templates

A camada de visualização deve utilizar **Thymeleaf** para renderização de templates HTML no lado do servidor.

### RNF-04 — Responsividade

O frontend deve ser **responsivo**, funcionando corretamente em dispositivos desktop e mobile. O CAPTCHA deslizante deve suportar eventos de toque (touch events) para uso em dispositivos móveis.

### RNF-05 — Frontend sem Frameworks Externos

O frontend deve ser desenvolvido em **JavaScript ES6** puro (vanilla), sem o uso de frameworks externos. A única exceção é a biblioteca **Chart.js** para renderização de gráficos no dashboard.

### RNF-06 — Bots em Python

Os bots automatizados devem ser desenvolvidos em **Python 3.12** utilizando **Selenium WebDriver** (com ChromeDriver) para automação do navegador.

### RNF-07 — Tesseract OCR

O reconhecimento de texto dos CAPTCHAs textuais pelos bots deve utilizar o **Tesseract OCR**, com pré-processamento de imagens via **OpenCV** (escala de cinza, redimensionamento, suavização, binarização e operações morfológicas).

### RNF-08 — Tempo de Resposta

O tempo de resposta da aplicação web (para carregamento de páginas e operações da API) deve ser **inferior a 2 segundos** em condições normais de operação.

### RNF-09 — Código Limpo

O código deve seguir padrões de **code clean**, sem comentários no código-fonte. A indentação e formatação devem ser consistentes em todo o projeto.

---

## 4. Requisitos dos Bots

Os bots automatizados simulam ataques à aplicação web para avaliar a efetividade dos mecanismos CAPTCHA. Cada bot executa **50 tentativas** e possui um **identificador de sessão próprio**.

### BOT_1 — OCR Básico

| Característica | Descrição |
|---|---|
| **Arquivo** | `bot/bot.py` |
| **Tipo de usuário** | `BOT_1` |
| **Alvo** | CAPTCHA textual (`/captcha`) |
| **Tecnologia** | Tesseract OCR com OpenCV |
| **Estratégia** | Pré-processamento simples: escala de cinza, redimensionamento 3x, suavização Gaussiana, binarização (threshold 150) e limpeza morfológica |
| **Configuração Tesseract** | `--psm 7` com whitelist de caracteres |
| **Pós-processamento** | Remoção de caracteres não alfanuméricos, limite de 6 caracteres |
| **Sessão** | `BOT-1-{timestamp_ms}` |

### BOT_2 — OCR Avançado

| Característica | Descrição |
|---|---|
| **Arquivo** | `bot/bot_paddleocr.py` |
| **Tipo de usuário** | `BOT_2` |
| **Alvo** | CAPTCHA textual (`/captcha`) |
| **Tecnologia** | Tesseract OCR com OpenCV |
| **Estratégia** | Pré-processamento avançado: escala de cinza, redimensionamento 5x, suavização Gaussiana, binarização (threshold 170) e limpeza morfológica |
| **Configurações Tesseract** | Múltiplas configurações PSM (7, 8, 13) para OCR completo |
| **OCR por caractere** | Recorte individual de cada caractere com borda branca (20px) e tentativas com PSM 10, 8 e 13 |
| **Seleção de palpite** | Prioriza candidatos de 6 caracteres do OCR completo; em seguida, usa OCR individual; por fim, primeiro resultado disponível |
| **Sessão** | `BOT-2-{timestamp_ms}` |

### BOT_SLIDER_1 — Slider Simples

| Característica | Descrição |
|---|---|
| **Arquivo** | `bot/bot_slider_simples.py` |
| **Tipo de usuário** | `BOT_SLIDER_1` |
| **Alvo** | CAPTCHA deslizante (`/captcha-slider`) |
| **Tecnologia** | Selenium WebDriver, ActionChains |
| **Estratégia** | Detecta a zona alvo via propriedades CSS (`left` e `width` do elemento `sliderZonaAlvo`), calcula o centro da zona e arrasta o handle diretamente para a posição calculada |
| **Fallback** | Posição fixa de 60% caso não consiga detectar a zona alvo |
| **Movimento** | `click_and_hold` → `move_by_offset` → `release` (movimento direto, sem simulação humana) |
| **Sessão** | `BOT-SLIDER-1-{timestamp_ms}` |

### BOT_SLIDER_2 — Slider Avançado

| Característica | Descrição |
|---|---|
| **Arquivo** | `bot/bot_slider_avancado.py` |
| **Tipo de usuário** | `BOT_SLIDER_2` |
| **Alvo** | CAPTCHA deslizante (`/captcha-slider`) |
| **Tecnologia** | Selenium WebDriver, ActionChains |
| **Estratégia primária** | Busca binária para encontrar a posição alvo (5% a 95%, precisão mínima de 1%) |
| **Estratégia de fallback** | Varredura incremental de 10% a 90% em passos de 5% |
| **Simulação humana** | Movimento dividido em 5-10 etapas com curva de aceleração/desaceleração (lento no início e fim, rápido no meio), pausas aleatórias (20-80ms) entre etapas, micro-ajustes e tremor final (±2 pixels) |
| **Sessão** | `BOT-SLIDER-2-{timestamp_ms}` |

---

## 5. Métricas Coletadas

### 5.1 Métricas de Efetividade

| Métrica | Descrição | Cálculo |
|---|---|---|
| Taxa de bloqueio de bots | Porcentagem de tentativas de bots que foram rejeitadas pelo CAPTCHA | (Erros de bots / Total de tentativas de bots) × 100 |
| Taxa de evasão | Porcentagem de tentativas de bots que contornaram o CAPTCHA com sucesso | (Sucessos de bots / Total de tentativas de bots) × 100 |
| Taxa de sucesso humano | Porcentagem de tentativas humanas que resolveram o CAPTCHA com sucesso | (Sucessos humanos / Total de tentativas humanas) × 100 |
| Taxa de erro humano | Porcentagem de tentativas humanas que falharam ao resolver o CAPTCHA | (Erros humanos / Total de tentativas humanas) × 100 |
| Tempo médio de resolução | Tempo médio gasto para resolver o CAPTCHA, por tipo de usuário | Σ(tempoMs) / total de tentativas |

### 5.2 Métricas Comportamentais (CAPTCHA Deslizante)

| Métrica | Descrição | Unidade |
|---|---|---|
| `velocidadeMedia` | Velocidade média do movimento do handle durante o arrasto | %/ms |
| `velocidadeMaxima` | Maior velocidade instantânea registrada durante o arrasto | %/ms |
| `mudancasDirecao` | Número de inversões de direção (esquerda ↔ direita) durante o arrasto | contagem |
| `trajetoria` | Sequência de pontos `{ t, x }` registrados durante o arrasto | array de pontos |

### 5.3 Métricas do Endpoint Agrupado

O endpoint `GET /api/resultados/agrupados` retorna, para cada combinação de `tipoCaptcha` e `tipoUsuario`:

| Campo | Descrição |
|---|---|
| `total` | Número total de tentativas |
| `sucessos` | Número de tentativas bem-sucedidas |
| `erros` | Número de tentativas com falha |
| `tempoMedio` | Tempo médio de resolução em milissegundos |

---

## 6. Casos de Uso

### UC-01 — Usuário Humano Faz Login

**Ator:** Usuário humano

**Fluxo principal:**
1. O usuário acessa a aplicação (`GET /`)
2. A aplicação exibe a tela de login
3. O usuário insere as credenciais `admin` / `1234`
4. O usuário submete o formulário (`POST /login`)
5. A aplicação valida as credenciais
6. A aplicação redireciona o usuário para a página de CAPTCHA (`GET /captcha`)

**Fluxo alternativo — Credenciais inválidas:**
1. O usuário insere credenciais incorretas
2. A aplicação exibe a mensagem "Usuário ou senha incorretos!"
3. O usuário permanece na tela de login

---

### UC-02 — Usuário Humano Resolve CAPTCHA Textual

**Ator:** Usuário humano

**Fluxo principal:**
1. O usuário acessa a página de CAPTCHA textual (`GET /captcha`)
2. A aplicação gera e exibe um CAPTCHA textual no canvas (6 caracteres com ruído visual)
3. O usuário digita o código no campo de texto
4. O usuário submete o formulário
5. A aplicação compara a resposta com o código gerado (case-insensitive)
6. A aplicação exibe mensagem de sucesso
7. A aplicação registra o resultado na API (`POST /api/resultados`) com `tipoUsuario = "HUMANO"`
8. A aplicação gera um novo CAPTCHA após 500ms

**Fluxo alternativo — Resposta incorreta:**
1. A aplicação exibe mensagem de erro
2. A aplicação registra o resultado como erro
3. A aplicação gera um novo CAPTCHA após 500ms

---

### UC-03 — Usuário Humano Resolve CAPTCHA Deslizante

**Ator:** Usuário humano

**Fluxo principal:**
1. O usuário acessa a página de CAPTCHA deslizante (`GET /captcha-slider`)
2. A aplicação gera um desafio com zona alvo aleatória (30%-90%) e tolerância ±3%
3. O usuário arrasta o handle até a zona alvo (usando mouse ou toque)
4. A aplicação coleta métricas comportamentais durante o arrasto (trajetória, velocidades, mudanças de direção)
5. O usuário solta o handle
6. A aplicação verifica se a posição final está dentro da tolerância
7. A aplicação exibe mensagem de sucesso
8. A aplicação exibe as métricas comportamentais coletadas
9. A aplicação registra o resultado na API (`POST /api/resultados`) com `tipoUsuario = "HUMANO"` e `metricasComportamentais` em JSON
10. A aplicação gera um novo desafio após 1500ms

**Fluxo alternativo — Posição incorreta:**
1. A aplicação exibe mensagem de erro
2. A aplicação registra o resultado como erro (com métricas comportamentais)
3. A aplicação gera um novo desafio após 1500ms

---

### UC-04 — Usuário Visualiza Dashboard de Resultados

**Ator:** Usuário humano

**Fluxo principal:**
1. O usuário acessa a página de resultados (`GET /resultados`)
2. A aplicação carrega os resultados da API (`GET /api/resultados`)
3. A aplicação exibe cards de resumo (total, sucessos, erros, taxa de sucesso, tempo médio)
4. A aplicação renderiza gráfico de rosca (sucessos vs. erros) com Chart.js
5. A aplicação renderiza gráfico de linha (tempo por tentativa) com Chart.js
6. A aplicação exibe tabela detalhada com todas as tentativas

---

### UC-05 — Usuário Filtra Resultados

**Ator:** Usuário humano

**Fluxo principal:**
1. O usuário acessa o dashboard de resultados
2. O usuário seleciona filtros por tipo de CAPTCHA e/ou tipo de usuário
3. A aplicação atualiza dinamicamente os cards, gráficos e tabela com base nos filtros selecionados

---

### UC-06 — Bot Tenta Resolver CAPTCHA Textual

**Ator:** Bot (BOT_1 ou BOT_2)

**Fluxo principal:**
1. O bot abre o navegador (Selenium WebDriver) e acessa a página de CAPTCHA textual
2. O bot define `tipoUsuario` e `sessaoId` em `sessionStorage` via JavaScript injection
3. O bot captura a imagem do canvas como screenshot PNG
4. O bot pré-processa a imagem (escala de cinza, redimensionamento, suavização, binarização, limpeza morfológica)
5. O bot executa Tesseract OCR para reconhecer o texto
6. O bot preenche o campo de texto com o código reconhecido
7. O bot submete o formulário
8. A aplicação valida a resposta e registra o resultado na API com `tipoUsuario` correspondente ao bot
9. O bot aguarda e repete o processo por 50 tentativas

**Fluxo alternativo — OCR não reconhece texto:**
1. O bot registra erro e avança para a próxima tentativa

---

### UC-07 — Bot Tenta Resolver CAPTCHA Deslizante

**Ator:** Bot (BOT_SLIDER_1 ou BOT_SLIDER_2)

**Fluxo principal — BOT_SLIDER_1 (simples):**
1. O bot abre o navegador e acessa a página de CAPTCHA deslizante
2. O bot define `tipoUsuario` e `sessaoId` em `sessionStorage`
3. O bot detecta a zona alvo via propriedades CSS do elemento `sliderZonaAlvo`
4. O bot calcula a posição central da zona alvo
5. O bot arrasta o handle diretamente para a posição calculada (movimento direto)
6. A aplicação valida a posição e registra o resultado na API
7. O bot repete o processo por 50 tentativas

**Fluxo principal — BOT_SLIDER_2 (avançado):**
1. O bot abre o navegador e acessa a página de CAPTCHA deslizante
2. O bot define `tipoUsuario` e `sessaoId` em `sessionStorage`
3. O bot executa busca binária para encontrar a posição alvo (5% a 95%)
4. O bot simula movimento humano: divide em etapas com aceleração/desaceleração, pausas aleatórias e micro-ajustes
5. A aplicação valida a posição e registra o resultado na API
6. Se a busca binária falhar, o bot executa varredura incremental (10% a 90%, passos de 5%)
7. O bot repete o processo por 50 tentativas

---

### UC-08 — Usuário Limpa Resultados

**Ator:** Usuário humano

**Fluxo principal:**
1. O usuário solicita a limpeza de resultados (chamada ao endpoint `DELETE /api/resultados`)
2. A aplicação remove todos os registros da tabela `resultados`
3. O dashboard é atualizado e exibe estado vazio (zero tentativas)

---

## 7. Estrutura de Arquivos do Projeto

```
TCC-MecanismosCaptcha/
├── README.md
├── REQUIREMENTS.md
├── captcha/                          # Aplicação web (Spring Boot)
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/captcha/
│   │   │   │   ├── CaptchaApplication.java
│   │   │   │   ├── controller/
│   │   │   │   │   ├── LoginController.java
│   │   │   │   │   └── ResultadoController.java
│   │   │   │   ├── model/
│   │   │   │   │   └── resultado.java
│   │   │   │   └── repository/
│   │   │   │       └── ResultadoRepository.java
│   │   │   └── resources/
│   │   │       ├── application.properties
│   │   │       ├── templates/
│   │   │       │   ├── login.html
│   │   │       │   ├── captcha.html
│   │   │       │   ├── captcha_slider.html
│   │   │       │   └── resultados.html
│   │   │       └── static/
│   │   │           ├── css/
│   │   │           │   ├── login.css
│   │   │           │   ├── captcha.css
│   │   │           │   ├── slider.css
│   │   │           │   └── resultado.css
│   │   │           └── js/
│   │   │               ├── captcha.js
│   │   │               ├── slider.js
│   │   │               └── resultados.js
│   │   └── test/
│   │       └── java/captcha/
│   │           └── CaptchaApplicationTests.java
│   └── pom.xml (ou build.gradle)
└── bot/                              # Bots automatizados (Python)
    ├── bot.py                        # BOT_1 — OCR básico
    ├── bot_paddleocr.py             # BOT_2 — OCR avançado
    ├── bot_slider_simples.py        # BOT_SLIDER_1 — Slider simples
    └── bot_slider_avancado.py      # BOT_SLIDER_2 — Slider avançado
```

---

## 8. Configuração do Ambiente

### 8.1 Aplicação Web

| Item | Valor |
|---|---|
| Porta | 8080 |
| Banco de dados | MySQL na porta 3306, schema `captcha` |
| Credenciais de login | `admin` / `1234` |

### 8.2 Bots

| Item | Requisito |
|---|---|
| Python | 3.12 |
| Tesseract OCR | Instalado e configurado no PATH |
| ChromeDriver | Compatível com a versão do Chrome instalada |
| Bibliotecas Python | `selenium`, `opencv-python`, `pytesseract`, `numpy` |

### 8.3 URLs da Aplicação

| URL | Descrição |
|---|---|
| `http://localhost:8080/` | Tela de login |
| `http://localhost:8080/captcha` | CAPTCHA textual |
| `http://localhost:8080/captcha-slider` | CAPTCHA deslizante |
| `http://localhost:8080/resultados` | Dashboard de resultados |
| `http://localhost:8080/api/resultados` | API REST (GET, POST, DELETE) |
| `http://localhost:8080/api/resultados/agrupados` | API REST (GET agrupado) |
