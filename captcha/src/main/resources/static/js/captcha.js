// ======================================================
// ELEMENTOS
// ======================================================

const canvas = document.getElementById("captchaCanvas");
const ctx = canvas.getContext("2d");

const input = document.getElementById("codigo");
const form = document.getElementById("captchaForm");
const mensagem = document.getElementById("mensagem");
const refresh = document.getElementById("refreshCaptcha");


// ======================================================
// SESSÃO
// ======================================================

let sessaoId = sessionStorage.getItem("sessaoCaptcha");

if (!sessaoId) {

    sessaoId =
        "SESSAO-" +
        Date.now() +
        "-" +
        Math.floor(Math.random() * 10000);

    sessionStorage.setItem(
        "sessaoCaptcha",
        sessaoId
    );
}


// ======================================================
// TIPO DE USUÁRIO
// ======================================================

const tipoUsuario =
    sessionStorage.getItem("tipoUsuario") || "HUMANO";


// ======================================================
// VARIÁVEIS
// ======================================================

let codigoCorreto = "";

let numeroTentativa = 1;

let inicioCaptcha = Date.now();

const caracteres =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";


// ======================================================
// GERAR CAPTCHA
// ======================================================

function gerarCodigo() {

    codigoCorreto = "";

    for (let i = 0; i < 6; i++) {

        const indice =
            Math.floor(
                Math.random() * caracteres.length
            );

        codigoCorreto += caracteres[indice];
    }

    desenharCaptcha();

    inicioCaptcha = Date.now();

    input.value = "";

    mensagem.textContent = "";

    mensagem.className = "mensagem";
}


// ======================================================
// DESENHAR CAPTCHA
// ======================================================

function desenharCaptcha() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // FUNDO

    ctx.fillStyle = "#eeeeee";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // LINHAS

    for (let i = 0; i < 8; i++) {

        ctx.beginPath();

        ctx.moveTo(
            Math.random() * canvas.width,
            Math.random() * canvas.height
        );

        ctx.lineTo(
            Math.random() * canvas.width,
            Math.random() * canvas.height
        );

        ctx.strokeStyle =
            "rgba(0,0,0,0.30)";

        ctx.lineWidth = 1;

        ctx.stroke();
    }


    // PONTOS

    for (let i = 0; i < 100; i++) {

        ctx.beginPath();

        ctx.arc(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            1,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "rgba(0,0,0,0.25)";

        ctx.fill();
    }


    // LETRAS

    for (
        let i = 0;
        i < codigoCorreto.length;
        i++
    ) {

        ctx.save();

        const x = 30 + i * 48;
        const y = 65;

        const rotacao =
            (Math.random() - 0.5) * 0.5;

        ctx.translate(x, y);

        ctx.rotate(rotacao);

        ctx.font =
            "bold 42px Arial";

        ctx.fillStyle =
            "#222222";

        ctx.fillText(
            codigoCorreto[i],
            0,
            0
        );

        ctx.restore();
    }
}


// ======================================================
// SALVAR RESULTADO
// ======================================================

async function registrarResultado(
    resultadoAtual,
    tempo
) {

    const dados = {

        tipoCaptcha: "CAPTCHA_TEXTO",

        tentativa: numeroTentativa,

        resultado: resultadoAtual,

        tempoMs: tempo,

        tipoUsuario: tipoUsuario,

        sessaoId: sessaoId
    };


    try {

        const resposta =
            await fetch(
                "/api/resultados",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(dados)
                }
            );


        if (!resposta.ok) {

            throw new Error(
                "Erro ao salvar resultado"
            );
        }


        console.log(
            "Resultado salvo!"
        );

    } catch (erro) {

        console.error(
            "Erro ao salvar:",
            erro
        );
    }
}


// ======================================================
// VERIFICAR CAPTCHA
// ======================================================

form.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const resposta =
            input.value
                .toUpperCase()
                .trim();


        const tempo =
            Date.now() - inicioCaptcha;


        // CORRETO

        if (resposta === codigoCorreto) {

            mensagem.textContent =
                "✓ CAPTCHA correto!";

            mensagem.className =
                "mensagem sucesso";


            await registrarResultado(
                "SUCESSO",
                tempo
            );

        }


        // ERRADO

        else {

            mensagem.textContent =
                "✕ CAPTCHA incorreto!";

            mensagem.className =
                "mensagem erro";


            await registrarResultado(
                "ERRO",
                tempo
            );
        }


        numeroTentativa++;


        // GERA OUTRO CAPTCHA
        // SEM TROCAR DE PÁGINA

        setTimeout(
            function() {

                gerarCodigo();

            },
            500
        );
    }
);


// ======================================================
// BOTÃO NOVO CAPTCHA
// ======================================================

refresh.addEventListener(
    "click",
    function() {

        gerarCodigo();

    }
);


// ======================================================
// INICIAR
// ======================================================

gerarCodigo();