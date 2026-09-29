import time
import re
import platform

import cv2
import numpy as np
import pytesseract

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options


# =========================================================
# CONFIGURAÇÕES
# =========================================================

URL = "http://localhost:8080/captcha"

NUMERO_TESTES = 50

TIPO_BOT = "BOT_1"

if platform.system() == "Windows":
    pytesseract.pytesseract.tesseract_cmd = (
        r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    )


# =========================================================
# SESSÃO DO BOT
# =========================================================

sessao_id = (
    "BOT-1-" +
    str(int(time.time() * 1000))
)


# =========================================================
# CONFIGURAR CHROME
# =========================================================

opcoes = Options()

opcoes.add_argument("--start-maximized")

import os

chrome_win = "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"

if os.path.exists(chrome_win):

    opcoes.binary_location = chrome_win

driver = webdriver.Chrome(
    options=opcoes
)


# =========================================================
# ABRIR CAPTCHA
# =========================================================

print()
print("=" * 60)
print("BOT 1 - OCR")
print("=" * 60)

print()
print("Abrindo CAPTCHA...")

driver.get(URL)

time.sleep(1)


# =========================================================
# DEFINIR BOT E SESSÃO
# =========================================================

driver.execute_script(
    """
    sessionStorage.setItem(
        "tipoUsuario",
        "BOT_1"
    );

    sessionStorage.setItem(
        "sessaoCaptcha",
        arguments[0]
    );
    """,
    sessao_id
)

driver.refresh()

time.sleep(1)


print("CAPTCHA aberto!")
print()
print("Sessão:", sessao_id)
print("Testes:", NUMERO_TESTES)
print()


# =========================================================
# CAPTURAR CAPTCHA
# =========================================================

def capturar_captcha():

    canvas = driver.find_element(
        By.ID,
        "captchaCanvas"
    )

    imagem_png = canvas.screenshot_as_png

    array = np.frombuffer(
        imagem_png,
        dtype=np.uint8
    )

    imagem = cv2.imdecode(
        array,
        cv2.IMREAD_COLOR
    )

    if imagem is None:

        raise Exception(
            "Erro ao capturar CAPTCHA."
        )

    return imagem


# =========================================================
# PROCESSAR IMAGEM
# =========================================================

def processar_imagem(imagem):

    cinza = cv2.cvtColor(
        imagem,
        cv2.COLOR_BGR2GRAY
    )

    ampliada = cv2.resize(
        cinza,
        None,
        fx=3,
        fy=3,
        interpolation=cv2.INTER_CUBIC
    )

    suavizada = cv2.GaussianBlur(
        ampliada,
        (3, 3),
        0
    )

    _, binaria = cv2.threshold(
        suavizada,
        150,
        255,
        cv2.THRESH_BINARY
    )

    kernel = np.ones(
        (2, 2),
        np.uint8
    )

    limpa = cv2.morphologyEx(
        binaria,
        cv2.MORPH_OPEN,
        kernel
    )

    return limpa


# =========================================================
# OCR
# =========================================================

def reconhecer_captcha(imagem):

    processada = processar_imagem(
        imagem
    )

    configuracao = (
        "--psm 7 "
        "-c tessedit_char_whitelist="
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    )

    texto = pytesseract.image_to_string(
        processada,
        config=configuracao
    )

    texto = texto.upper()

    texto = re.sub(
        r"[^A-Z2-9]",
        "",
        texto
    )

    return texto[:6]


# =========================================================
# TESTES
# =========================================================

sucessos = 0

erros = 0


print("=" * 60)
print("INICIANDO TESTES DO BOT 1")
print("=" * 60)
print()


for tentativa in range(
    1,
    NUMERO_TESTES + 1
):

    print(
        f"[{tentativa}/{NUMERO_TESTES}] "
        "Lendo CAPTCHA..."
    )

    inicio = time.time()

    try:

        # =================================================
        # CAPTURAR
        # =================================================

        imagem = capturar_captcha()


        # =================================================
        # OCR
        # =================================================

        codigo = reconhecer_captcha(
            imagem
        )

        print(
            f"    OCR: {codigo}"
        )


        # =================================================
        # VERIFICAR SE OCR ENCONTROU CÓDIGO
        # =================================================

        if not codigo:

            print(
                "    ✕ OCR não reconheceu o CAPTCHA."
            )

            erros += 1

            time.sleep(1)

            continue


        # =================================================
        # PREENCHER CAMPO
        # =================================================

        campo = driver.find_element(
            By.ID,
            "codigo"
        )

        campo.clear()

        campo.send_keys(
            codigo
        )


        # =================================================
        # ENVIAR
        # =================================================

        campo.send_keys(
            Keys.ENTER
        )


        # =================================================
        # ESPERAR RESPOSTA
        # =================================================

        time.sleep(0.8)


        # =================================================
        # LER MENSAGEM
        # =================================================

        mensagem = driver.find_element(
            By.ID,
            "mensagem"
        ).text


        tempo = (
            time.time() -
            inicio
        )


        # =================================================
        # RESULTADO
        # =================================================

        if "correto" in mensagem.lower():

            sucessos += 1

            print(
                "    ✓ SUCESSO"
            )

        else:

            erros += 1

            print(
                "    ✕ ERRO"
            )


        print(
            f"    Tempo: {tempo:.2f}s"
        )

        print(
            "    Resultado será salvo pelo captcha.js."
        )

        print()


        # =================================================
        # AGUARDAR NOVO CAPTCHA
        # =================================================

        if tentativa < NUMERO_TESTES:

            time.sleep(1)


    except Exception as erro:

        erros += 1

        print(
            "    ✕ ERRO NO TESTE"
        )

        print(
            f"    {erro}"
        )

        print()

        time.sleep(1)


# =========================================================
# RESULTADO FINAL
# =========================================================

taxa = (
    sucessos /
    NUMERO_TESTES
) * 100


print()
print("=" * 60)
print("RESULTADO FINAL - BOT 1")
print("=" * 60)

print(
    f"Testes: {NUMERO_TESTES}"
)

print(
    f"Sucessos: {sucessos}"
)

print(
    f"Erros: {erros}"
)

print(
    f"Taxa de sucesso: {taxa:.2f}%"
)

print(
    f"Sessão: {sessao_id}"
)

print("=" * 60)


input(
    "\nPressione ENTER para fechar..."
)


driver.quit()