import time
import re

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

TIPO_BOT = "BOT_2"

TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH

CARACTERES = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


# =========================================================
# SESSÃO DO BOT
# =========================================================

sessao_id = (
    "BOT-2-" +
    str(int(time.time() * 1000))
)


# =========================================================
# CONFIGURAR CHROME
# =========================================================

opcoes = Options()

opcoes.add_argument("--start-maximized")

driver = webdriver.Chrome(
    options=opcoes
)


# =========================================================
# ABRIR CAPTCHA
# =========================================================

print()
print("=" * 60)
print("BOT 2 - OCR AVANÇADO")
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
        "BOT_2"
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
# PREPARAR IMAGEM
# =========================================================

def preparar_imagem(imagem):

    cinza = cv2.cvtColor(
        imagem,
        cv2.COLOR_BGR2GRAY
    )

    ampliada = cv2.resize(
        cinza,
        None,
        fx=5,
        fy=5,
        interpolation=cv2.INTER_CUBIC
    )

    suavizada = cv2.GaussianBlur(
        ampliada,
        (3, 3),
        0
    )

    _, binaria = cv2.threshold(
        suavizada,
        170,
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
# LIMPAR TEXTO
# =========================================================

def limpar_texto(texto):

    texto = texto.upper()

    texto = re.sub(
        r"[^A-Z2-9]",
        "",
        texto
    )

    return texto


# =========================================================
# OCR COMPLETO
# =========================================================

def ocr_completo(imagem):

    configuracoes = [
        "--psm 7",
        "--psm 8",
        "--psm 13"
    ]

    resultados = []

    for configuracao in configuracoes:

        texto = pytesseract.image_to_string(
            imagem,
            config=(
                configuracao +
                " -c tessedit_char_whitelist=" +
                CARACTERES
            )
        )

        texto = limpar_texto(
            texto
        )

        if texto:

            resultados.append(
                texto[:6]
            )

    return resultados


# =========================================================
# OCR POR CARACTERE
# =========================================================

def ocr_por_caractere(imagem):

    altura, largura = imagem.shape

    resultados = []

    largura_caractere = (
        largura / 6
    )

    for i in range(6):

        inicio = int(
            i * largura_caractere
        )

        fim = int(
            (i + 1) *
            largura_caractere
        )

        recorte = imagem[
            :,
            inicio:fim
        ]

        recorte = cv2.copyMakeBorder(
            recorte,
            20,
            20,
            20,
            20,
            cv2.BORDER_CONSTANT,
            value=255
        )

        melhor = ""

        for psm in [
            10,
            8,
            13
        ]:

            texto = pytesseract.image_to_string(
                recorte,
                config=(
                    f"--psm {psm} "
                    "-c tessedit_char_whitelist=" +
                    CARACTERES
                )
            )

            texto = limpar_texto(
                texto
            )

            if texto:

                melhor = texto[0]

                break

        resultados.append(
            melhor
        )

    return "".join(
        resultados
    )


# =========================================================
# RECONHECER CAPTCHA
# =========================================================

def reconhecer_captcha(imagem):

    print(
        "    Processando imagem..."
    )

    imagem_processada = (
        preparar_imagem(imagem)
    )


    # =====================================================
    # OCR COMPLETO
    # =====================================================

    candidatos = ocr_completo(
        imagem_processada
    )

    print(
        f"    OCR completo: {candidatos}"
    )


    # =====================================================
    # OCR INDIVIDUAL
    # =====================================================

    individual = ocr_por_caractere(
        imagem_processada
    )

    print(
        f"    OCR individual: '{individual}'"
    )


    # =====================================================
    # ESCOLHER PALPITE
    # =====================================================

    palpite = ""


    # Procurar candidato com 6 caracteres

    for candidato in candidatos:

        if len(candidato) == 6:

            palpite = candidato

            break


    # Se não encontrou, usar OCR individual

    if not palpite:

        if len(individual) == 6:

            palpite = individual


    # Se ainda não encontrou,
    # usar primeiro resultado

    if not palpite:

        if candidatos:

            palpite = candidatos[0]


    print()

    print(
        "    --------------------------------"
    )

    if palpite:

        print(
            f"    PALPITE DO BOT 2: {palpite}"
        )

    else:

        print(
            "    PALPITE DO BOT 2: [NENHUM]"
        )

    print(
        "    --------------------------------"
    )

    return palpite


# =========================================================
# TESTES
# =========================================================

sucessos = 0

erros = 0

nao_reconhecidos = 0


print("=" * 60)
print("INICIANDO TESTES DO BOT 2")
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


        # =================================================
        # NÃO RECONHECEU
        # =================================================

        if not codigo:

            print(
                "    ✕ BOT 2 NÃO RECONHECEU"
            )

            nao_reconhecidos += 1

            erros += 1

            time.sleep(1)

            continue


        # =================================================
        # LIMITAR A 6 CARACTERES
        # =================================================

        codigo = codigo[:6]


        print(
            f"    Enviando palpite: {codigo}"
        )


        # =================================================
        # CAMPO
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
        # ESPERAR PRÓXIMO CAPTCHA
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
print("RESULTADO FINAL - BOT 2")
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
    f"Não reconhecidos: {nao_reconhecidos}"
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