// ======================================================
// ELEMENTOS
// ======================================================

const trilha = document.getElementById("sliderTrilha");
const handle = document.getElementById("sliderHandle");
const zonaAlvo = document.getElementById("sliderZonaAlvo");
const progresso = document.getElementById("sliderProgresso");
const mensagem = document.getElementById("mensagem");
const refresh = document.getElementById("refreshSlider");

const metricasPreview = document.getElementById("metricasPreview");
const velMediaEl = document.getElementById("velMedia");
const velMaxEl = document.getElementById("velMax");
const tempoTotalEl = document.getElementById("tempoTotal");
const mudancasDirEl = document.getElementById("mudancasDir");


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
// VARIÁVEIS DO DESAFIO
// ======================================================

let posicaoAlvo = 0;       // percentual (0–100)
const tolerancia = 3;       // ±3%

let arrastando = false;
let numeroTentativa = 1;
let inicioDesafio = 0;

// coleta comportamental
let trajetoria = [];       // [{ t: ms, x: percentual }]
let velocidades = [];
let mudancasDirecao = 0;
let ultimaDirecao = 0;     // 1 = direita, -1 = esquerda, 0 = parado


// ======================================================
// GERAR NOVO DESAFIO
// ======================================================

function gerarDesafio() {

    // alvo entre 30% e 90%
    posicaoAlvo =
        30 + Math.random() * 60;

    // posicionar zona alvo
    zonaAlvo.style.left =
        (posicaoAlvo - tolerancia) + "%";

    zonaAlvo.style.width =
        (tolerancia * 2) + "%";

    zonaAlvo.classList.remove("validando");

    // resetar handle
    handle.style.left = "0%";
    handle.classList.remove("sucesso", "erro");

    // resetar progresso
    progresso.style.width = "0%";

    // resetar variáveis
    arrastando = false;
    trajetoria = [];
    velocidades = [];
    mudancasDirecao = 0;
    ultimaDirecao = 0;

    inicioDesafio = Date.now();

    // limpar mensagem
    mensagem.textContent = "";
    mensagem.className = "mensagem";

    // esconder métricas
    metricasPreview.style.display = "none";
}


// ======================================================
// OBTER POSIÇÃO X (percentual)
// ======================================================

function obterPosicaoX(clientX) {

    const ret = trilha.getBoundingClientRect();

    let x = clientX - ret.left;

    let percentual =
        (x / ret.width) * 100;

    // limitar entre 0 e 100
    if (percentual < 0) percentual = 0;
    if (percentual > 100) percentual = 100;

    return percentual;
}


// ======================================================
// INÍCIO DO ARRASTO
// ======================================================

function iniciarArrasto(clientX) {

    arrastando = true;

    handle.classList.add("arrastando");

    moverHandle(clientX);
}


// ======================================================
// MOVER HANDLE
// ======================================================

function moverHandle(clientX) {

    if (!arrastando) return;

    const percentual = obterPosicaoX(clientX);

    // atualizar handle
    handle.style.left = percentual + "%";

    // atualizar progresso
    progresso.style.width = percentual + "%";

    // registrar trajetória
    const agora = Date.now() - inicioDesafio;

    trajetoria.push({
        t: agora,
        x: percentual
    });

    // detectar mudança de direção
    if (trajetoria.length >= 2) {

        const anterior =
            trajetoria[trajetoria.length - 2].x;

        const atual = percentual;

        let direcaoAtual = 0;

        if (atual > anterior) {
            direcaoAtual = 1;
        } else if (atual < anterior) {
            direcaoAtual = -1;
        }

        if (
            direcaoAtual !== 0 &&
            ultimaDirecao !== 0 &&
            direcaoAtual !== ultimaDirecao
        ) {
            mudancasDirecao++;
        }

        if (direcaoAtual !== 0) {
            ultimaDirecao = direcaoAtual;
        }
    }
}


// ======================================================
// FIM DO ARRASTO
// ======================================================

function finalizarArrasto() {

    if (!arrastando) return;

    arrastando = false;

    handle.classList.remove("arrastando");

    // calcular métricas
    const metricas = calcularMetricas();

    // verificar acerto
    const posicaoFinal =
        parseFloat(handle.style.left) || 0;

    const diferenca =
        Math.abs(posicaoFinal - posicaoAlvo);

    const acertou = diferenca <= tolerancia;

    const tempoTotal =
        Date.now() - inicioDesafio;


    if (acertou) {

        mensagem.textContent =
            "✓ Posição correta!";

        mensagem.className =
            "mensagem sucesso";

        handle.classList.add("sucesso");

    } else {

        mensagem.textContent =
            "✕ Posição incorreta! Tente novamente.";

        mensagem.className =
            "mensagem erro";

        handle.classList.add("erro");
    }

    // mostrar métricas
    exibirMetricas(metricas);

    // registrar resultado
    registrarResultado(
        acertou ? "SUCESSO" : "ERRO",
        tempoTotal,
        metricas
    );

    numeroTentativa++;

    // gerar novo desafio
    setTimeout(
        function() {
            gerarDesafio();
        },
        1500
    );
}


// ======================================================
// CALCULAR MÉTRICAS COMPORTAMENTAIS
// ======================================================

function calcularMetricas() {

    // velocidades instantâneas
    velocidades = [];

    for (
        let i = 1;
        i < trajetoria.length;
        i++
    ) {
        const dt =
            trajetoria[i].t - trajetoria[i - 1].t;

        const dx =
            trajetoria[i].x - trajetoria[i - 1].x;

        if (dt > 0) {

            // velocidade em %/ms
            const v =
                Math.abs(dx) / dt;

            velocidades.push(v);
        }
    }

    let velMedia = 0;
    let velMax = 0;

    if (velocidades.length > 0) {

        const soma =
            velocidades.reduce(
                function(a, b) {
                    return a + b;
                },
                0
            );

        velMedia = soma / velocidades.length;

        velMax =
            Math.max.apply(
                null,
                velocidades
            );
    }

    const tempoTotal =
        Date.now() - inicioDesafio;

    return {
        velocidadeMedia:
            Math.round(velMedia * 1000) / 1000,
        velocidadeMaxima:
            Math.round(velMax * 1000) / 1000,
        tempoTotal: tempoTotal,
        mudancasDirecao: mudancasDirecao,
        trajetoria: trajetoria
    };
}


// ======================================================
// EXIBIR MÉTRICAS
// ======================================================

function exibirMetricas(m) {

    metricasPreview.style.display = "block";

    velMediaEl.textContent =
        m.velocidadeMedia.toFixed(3) + " %/ms";

    velMaxEl.textContent =
        m.velocidadeMaxima.toFixed(3) + " %/ms";

    tempoTotalEl.textContent =
        m.tempoTotal + " ms";

    mudancasDirEl.textContent =
        m.mudancasDirecao;
}


// ======================================================
// SALVAR RESULTADO
// ======================================================

async function registrarResultado(
    resultadoAtual,
    tempo,
    metricas
) {

    // serializar métricas como JSON
    const metricasJSON =
        JSON.stringify({
            velocidadeMedia:
                metricas.velocidadeMedia,
            velocidadeMaxima:
                metricas.velocidadeMaxima,
            tempoTotal:
                metricas.tempoTotal,
            mudancasDirecao:
                metricas.mudancasDirecao,
            trajetoria:
                metricas.trajetoria
        });

    const dados = {

        tipoCaptcha: "CAPTCHA_DESLIZANTE",

        tentativa: numeroTentativa,

        resultado: resultadoAtual,

        tempoMs: tempo,

        tipoUsuario: tipoUsuario,

        sessaoId: sessaoId,

        metricasComportamentais:
            metricasJSON
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
// EVENTOS — MOUSE
// ======================================================

handle.addEventListener(
    "mousedown",
    function(e) {

        e.preventDefault();

        iniciarArrasto(e.clientX);
    }
);


document.addEventListener(
    "mousemove",
    function(e) {

        if (arrastando) {

            moverHandle(e.clientX);
        }
    }
);


document.addEventListener(
    "mouseup",
    function() {

        if (arrastando) {

            finalizarArrasto();
        }
    }
);


// ======================================================
// EVENTOS — TOUCH (CELULAR)
// ======================================================

handle.addEventListener(
    "touchstart",
    function(e) {

        e.preventDefault();

        const toque =
            e.touches[0];

        iniciarArrasto(toque.clientX);
    },
    { passive: false }
);


document.addEventListener(
    "touchmove",
    function(e) {

        if (arrastando) {

            e.preventDefault();

            const toque =
                e.touches[0];

            moverHandle(toque.clientX);
        }
    },
    { passive: false }
);


document.addEventListener(
    "touchend",
    function() {

        if (arrastando) {

            finalizarArrasto();
        }
    }
);


// ======================================================
// BOTÃO NOVO DESAFIO
// ======================================================

refresh.addEventListener(
    "click",
    function() {

        gerarDesafio();
    }
);


// ======================================================
// INICIAR
// ======================================================

gerarDesafio();
