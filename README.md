# TCC - Mecanismos CAPTCHA

Avaliacao Experimental da Efetividade de Mecanismos CAPTCHA na Mitigacao de Ataques Automatizados em Aplicacoes Web

## Autores

- Gabriel da Silva Oliveira
- Thales Nogueira Nanuci

## Orientador

Prof. Me. Claudio Luis Roveri Vieira

## Instituicao

Instituto Federal de Educacao, Ciencia e Tecnologia de Sao Paulo - Campus Salto

---

## Estrutura do Projeto

```
TCC-MecanismosCaptcha/
├── captcha/                    # Aplicacao web (Spring Boot 4.1 / Java 21)
│   └── src/main/java/captcha/
│       ├── config/             # Configuracao (auth, interceptor, inicializacao)
│       ├── controller/         # Controladores (home, auth, captchas, dashboard, API)
│       ├── model/              # Entidades JPA (Resultado, Usuario, enums)
│       ├── repository/         # Repositorios Spring Data JPA
│       └── service/            # Servicos (geracao CAPTCHA, validacao, metricas)
├── bot/                        # Bots automatizados (Python 3.12 / Selenium / Tesseract)
│   ├── config.py               # Configuracao centralizada
│   ├── bot.py                  # BOT_1 - OCR basico
│   ├── bot_paddleocr.py        # BOT_2 - OCR avancado
│   ├── bot_slider_simples.py   # BOT_SLIDER_1 - Deteccao direta
│   └── bot_slider_avancado.py  # BOT_SLIDER_2 - Simulacao humana
└── README.md
```

## Pre-requisitos

| Componente       | Versao Minima |
|------------------|---------------|
| Java (JDK)       | 21+           |
| Maven            | 3.9+          |
| MySQL            | 8.0+          |
| Python           | 3.12+         |
| Tesseract OCR    | 5+            |
| Google Chrome    | Recente       |
| ChromeDriver     | Compativel    |

---

## Configuracao e Instalacao

### 1. Banco de Dados MySQL

```sql
CREATE DATABASE IF NOT EXISTS captcha CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configurar Credenciais do Banco

As credenciais sao configuradas via variaveis de ambiente ou no arquivo `application.properties`.

**Opcao A - Variaveis de ambiente (recomendado):**

```bash
export DB_URL=jdbc:mysql://localhost:3306/captcha
export DB_USERNAME=root
export DB_PASSWORD=suaSenha
```

**Opcao B - Editar application.properties:**

```
captcha/src/main/resources/application.properties
```

### 3. Instalar Dependencias dos Bots

```bash
cd bot
pip install -r requirements.txt
```

### 4. Configurar Tesseract OCR

**Linux:**
```bash
sudo apt install tesseract-ocr
```

**Windows (via WSL):**
Instalar o Tesseract no Windows e configurar o caminho em `bot/config.py`:
```python
TESSERACT_WIN_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
```

---

## Execucao

### Aplicacao Web

```bash
cd captcha
mvn spring-boot:run
```

Acesse: http://localhost:8080

A aplicacao cria automaticamente o usuario `admin` com senha `1234` (hash BCrypt) na primeira execucao.

### Credenciais de Login

| Campo   | Valor  |
|---------|--------|
| Usuario | admin  |
| Senha   | 1234   |

As credenciais podem ser alteradas via variaveis de ambiente:
```bash
export AUTH_USERNAME=meuUsuario
export AUTH_PASSWORD=minhaSenha
```

---

## Fluxo da Plataforma

### Pagina Inicial (`/`)
Selecione o tipo de experimento: CAPTCHA Textual ou CAPTCHA Deslizante.

### CAPTCHA Textual (`/login/texto` -> `/captcha/texto`)
1. Login com credenciais
2. Imagem CAPTCHA gerada no servidor (Java2D)
3. Digitar o codigo de 6 caracteres
4. Validacao no servidor (o codigo NUNCA e exposto ao cliente)

### CAPTCHA Deslizante (`/login/slider` -> `/captcha/slider`)
1. Login com credenciais
2. Arrastar o controle azul ate a zona verde
3. Evitar a zona vermelha (armadilha honeypot)
4. Aguardar 2 segundos na zona verde para validacao
5. Metricas comportamentais coletadas automaticamente

### Dashboards (`/dashboard/texto` e `//dashboard/slider`)
Visualizacao de metricas e resultados, acessiveis sem login:
- Taxa de bloqueio, evasao, sucesso/erro humano
- Tempo medio e desvio padrao
- Comparativo entre bots
- Metricas comportamentais do slider
- Graficos Chart.js interativos

---

## Executando os Bots

### Configuracao dos Bots

Editar `bot/config.py` para ajustar:
- `NUMERO_TESTES`: quantidade de tentativas por bot (padrao: 30)
- `SESSAO_EXPERIMENTAL`: identificador da rodada (ex: "RODADA-1")
- `CHROME_WIN_PATH`: caminho do Chrome (para WSL)

### Bots de CAPTCHA Textual

**BOT_1 - OCR Basico:**
```bash
cd bot
python3 bot.py
```
Estrategia: Captura screenshot da imagem, preprocessamento (escala cinza, redimensionar 3x, blur, threshold 150, morfologia), Tesseract PSM 7.

**BOT_2 - OCR Avancado:**
```bash
cd bot
python3 bot_paddleocr.py
```
Estrategia: Preprocessamento avancado (redimensionar 5x, threshold 170), multiplos modos PSM (7, 8, 13), reconhecimento por caractere individual.

### Bots de CAPTCHA Deslizante

**BOT_SLIDER_1 - Deteccao Direta:**
```bash
cd bot
python3 bot_slider_simples.py
```
Estrategia: Le a posicao da zona verde via CSS, detecta armadilha, arrasta direto ao centro da zona, aguarda 2 segundos.

**BOT_SLIDER_2 - Simulacao Humana:**
```bash
cd bot
python3 bot_slider_avancado.py
```
Estrategia: Detecta zona verde e armadilha, simula movimento humano (aceleracao/desaceleracao, pausas aleatorias, micro-ajustes, tremor), variacao +-2%, aguarda 2 segundos.

### Ordem Recomendada de Execucao

1. Iniciar a aplicacao web (`mvn spring-boot:run`)
2. Executar testes humanos manualmente (30 tentativas por tipo)
3. Executar `bot.py` (BOT_1)
4. Executar `bot_paddleocr.py` (BOT_2)
5. Executar `bot_slider_simples.py` (BOT_SLIDER_1)
6. Executar `bot_slider_avancado.py` (BOT_SLIDER_2)
7. Consultar dashboards para analise

---

## Testes Automatizados

```bash
cd captcha
mvn test
```

Testes unitarios incluidos:
- `CaptchaTextoServiceTest` - 12 testes (geracao, validacao, expiracao, anti-replay)
- `CaptchaSliderServiceTest` - 14 testes (zona alvo, armadilha, tempo minimo, anti-replay)

---

## Arquitetura de Seguranca

| Mecanismo                    | Implementacao                                      |
|------------------------------|-----------------------------------------------------|
| Senhas                       | Hash BCrypt (spring-security-crypto)                |
| Codigo CAPTCHA textual       | Gerado e validado no servidor; nunca exposto ao JS  |
| Estado do desafio            | ConcurrentHashMap no servidor com UUID unico        |
| Anti-replay                  | Desafio marcado como "usado" apos primeira validacao|
| Expiracao                    | Desafios expiram apos 5 minutos                     |
| Armadilha honeypot (slider)  | Zona vermelha no final da trilha (95-100%)          |
| Regra dos 2 segundos         | Verificacao server-side do tempo na zona verde      |
| Autenticacao                 | Sessao HTTP com HandlerInterceptor                  |
| Credenciais                  | Externalizadas via variaveis de ambiente             |

---

## Metricas Experimentais

### Formulas (conforme monografia)

| Metrica             | Formula                                              |
|----------------------|------------------------------------------------------|
| Taxa de bloqueio     | (Bots bloqueados / Total bots) x 100%               |
| Taxa de evasao       | (Bots que passaram / Total bots) x 100%             |
| Sucesso humano       | (Humanos aprovados / Total humanos) x 100%          |
| Erro humano          | (Humanos com erro / Total humanos) x 100%           |
| Tempo medio          | Soma tempos / N                                      |
| Desvio padrao        | sqrt(soma((ti - media)^2) / (N-1))                  |

### Metricas do Slider (adicionais)

- Velocidade media do movimento (%/ms)
- Velocidade maxima
- Mudancas de direcao
- Microajustes (movimentos < 1%)
- Frequencia de acionamento da armadilha
- Distribuicao dos motivos de rejeicao

---

## API REST

| Metodo | Endpoint                                 | Descricao                         |
|--------|------------------------------------------|-----------------------------------|
| GET    | `/captcha/texto/api/novo`                | Gerar novo desafio textual        |
| GET    | `/captcha/texto/api/imagem/{id}`         | Obter imagem PNG do desafio       |
| POST   | `/captcha/texto/api/validar`             | Validar resposta textual          |
| GET    | `/captcha/slider/api/novo`               | Gerar novo desafio deslizante     |
| POST   | `/captcha/slider/api/entrada-zona`       | Registrar entrada na zona verde   |
| POST   | `/captcha/slider/api/validar`            | Validar tentativa deslizante      |
| GET    | `/api/resultados`                        | Listar resultados (com filtros)   |
| GET    | `/api/resultados/metricas`               | Metricas agregadas                |
| GET    | `/api/resultados/sessoes-experimentais`  | Listar sessoes experimentais      |
| DELETE | `/api/resultados`                        | Limpar todos os resultados        |

---

## Stack Tecnologico

- **Backend:** Java 21, Spring Boot 4.1.0, Spring Data JPA, Thymeleaf
- **Banco de Dados:** MySQL 8.0
- **Frontend:** HTML5, CSS3, JavaScript (ES5), Chart.js 4.4.4
- **Seguranca:** BCrypt (spring-security-crypto)
- **Bots:** Python 3.12, Selenium WebDriver, Tesseract OCR, OpenCV, NumPy
- **Build:** Maven 3.9+
