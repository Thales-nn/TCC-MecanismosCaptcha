# TCC - Mecanismos CAPTCHA

Avaliação Experimental da Efetividade de Mecanismos CAPTCHA na Mitigação de Ataques Automatizados em Aplicações Web Métricas

## Autores

- Gabriel da Silva Oliveira
- Thales Nogueira Nanuci

## Orientador

Prof. Me. Claudio Luis Roveri Vieira

## Instituição

Instituto Federal de Educação, Ciência e Tecnologia de São Paulo – Campus Salto

## Estrutura

```
TCC-MecanismosCaptcha/
├── captcha/          # Aplicação web (Spring Boot 4.1 / Java 21)
├── bot/              # Bots automatizados (Python 3.12 / Selenium / Tesseract)
└── REQUIREMENTS.md   # Especificação de requisitos
```

## Pré-requisitos

- Java 21+
- Maven 3.9+
- MySQL 8.0+
- Python 3.12+
- Tesseract OCR 5+
- Google Chrome

## Configuração

1. Criar banco de dados MySQL: `CREATE DATABASE captcha;`
2. Configurar credenciais em `captcha/src/main/resources/application.properties`
3. Instalar dependências dos bots: `pip install -r bot/requirements.txt`

## Execução

### Aplicação web

```bash
cd captcha
mvn spring-boot:run
```

Acesse: http://localhost:8080

### Bots

```bash
cd bot
python3 bot.py              # BOT_1 - OCR básico
python3 bot_paddleocr.py     # BOT_2 - OCR avançado
python3 bot_slider_simples.py # BOT_SLIDER_1 - Slider simples
python3 bot_slider_avancado.py # BOT_SLIDER_2 - Slider avançado
```

## Credenciais de login

- Usuário: admin
- Senha: 1234
