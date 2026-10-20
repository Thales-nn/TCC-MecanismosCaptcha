(function () {
    'use strict';

    var desafioId = null;
    var tentativa = 0;
    var sessaoId = gerarSessaoId();
    var sessaoExperimental = obterSessaoExperimental();

    var arrastando = false;
    var tempoInicio = null;
    var trajetoria = [];
    var mudancasDirecao = 0;
    var microAjustes = 0;
    var direcaoAnterior = null;
    var posAnterior = null;
    var armadilhaAtivada = false;
    var dentroZonaAlvo = false;
    var countdownInterval = null;
    var countdownTimeout = null;
    var zonaAlvoLeft = 0;
    var zonaAlvoWidth = 0;
    var armadilhaInicio = 0;
    var armadilhaLargura = 8;

    var trilha = document.getElementById('sliderTrilha');
    var handle = document.getElementById('sliderHandle');
    var progresso = document.getElementById('sliderProgresso');
    var zonaAlvo = document.getElementById('sliderZonaAlvo');
    var zonaArmadilha = document.getElementById('sliderArmadilha');
    var instrucao = document.getElementById('sliderInstrucao');
    var divCountdown = document.getElementById('sliderCountdown');
    var barraCountdown = document.getElementById('countdownBarra');
    var textoCountdown = document.getElementById('countdownTexto');
    var btnRefresh = document.getElementById('refreshSlider');
    var divMensagem = document.getElementById('mensagem');

    var velMediaEl = document.getElementById('velMedia');
    var velMaxEl = document.getElementById('velMax');
    var tempoTotalEl = document.getElementById('tempoTotal');
    var mudancasDirEl = document.getElementById('mudancasDir');
    var microAjustesEl = document.getElementById('microAjustes');
    var armadilhaStatusEl = document.getElementById('armadilhaStatus');
    var metricasPreview = document.getElementById('metricasPreview');

    function gerarSessaoId() {
        try {
            var stored = sessionStorage.getItem('sessaoCaptcha');
            if (stored) return stored;
        } catch (e) {}
        return 'S' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    }

    function obterSessaoExperimental() {
        var params = new URLSearchParams(window.location.search);
        var val = params.get('sessaoExperimental');
        if (val) return val;
        try { return sessionStorage.getItem('sessaoExperimental') || ''; } catch (e) { return ''; }
    }

    function obterTipoUsuario() {
        try {
            return sessionStorage.getItem('tipoUsuario') || 'HUMANO';
        } catch (e) {
            return 'HUMANO';
        }
    }

    function resetarEstado() {
        arrastando = false;
        trajetoria = [];
        mudancasDirecao = 0;
        microAjustes = 0;
        direcaoAnterior = null;
        posAnterior = null;
        armadilhaAtivada = false;
        dentroZonaAlvo = false;
        tempoInicio = null;

        if (countdownInterval) clearInterval(countdownInterval);
        if (countdownTimeout) clearTimeout(countdownTimeout);
        countdownInterval = null;
        countdownTimeout = null;

        handle.style.left = '0%';
        progresso.style.width = '0%';
        divCountdown.style.display = 'none';
        divMensagem.textContent = '';
        divMensagem.className = 'mensagem';
        metricasPreview.style.display = 'none';

        velMediaEl.textContent = '—';
        velMaxEl.textContent = '—';
        tempoTotalEl.textContent = '—';
        mudancasDirEl.textContent = '—';
        microAjustesEl.textContent = '—';
        armadilhaStatusEl.textContent = '—';
    }

    function carregarDesafio() {
        resetarEstado();
        instrucao.innerHTML = '<span>Carregando desafio...</span>';

        fetch('/captcha/slider/api/novo')
            .then(function (resp) {
                if (!resp.ok) throw new Error('Erro ao gerar desafio');
                return resp.json();
            })
            .then(function (dados) {
                desafioId = dados.desafioId;
                zonaAlvoLeft = dados.zonaAlvoLeft;
                zonaAlvoWidth = dados.zonaAlvoWidth;
                armadilhaInicio = dados.armadilhaInicio;
                armadilhaLargura = dados.armadilhaLargura || 8;

                zonaAlvo.style.left = zonaAlvoLeft + '%';
                zonaAlvo.style.width = zonaAlvoWidth + '%';

                zonaArmadilha.style.left = armadilhaInicio + '%';
                zonaArmadilha.style.width = armadilhaLargura + '%';

                instrucao.innerHTML = '<span>Arraste o controle ate a area verde. Evite a zona vermelha.</span>';
            })
            .catch(function (err) {
                instrucao.innerHTML = '<span>Erro ao carregar desafio. Tente novamente.</span>';
                divMensagem.textContent = 'Erro de conexao com o servidor.';
                divMensagem.className = 'mensagem erro';
            });
    }

    function obterPosicaoPercentual(clientX) {
        var rect = trilha.getBoundingClientRect();
        var x = clientX - rect.left;
        var pct = (x / rect.width) * 100;
        if (pct < 0) pct = 0;
        if (pct > 100) pct = 100;
        return pct;
    }

    function atualizarHandle(pct) {
        handle.style.left = pct + '%';
        progresso.style.width = pct + '%';
    }

    function registrarTrajetoria(pct) {
        var agora = Date.now();
        trajetoria.push({ posicao: pct, tempo: agora });

        if (posAnterior !== null) {
            var delta = pct - posAnterior;
            var direcao = delta > 0 ? 1 : (delta < 0 ? -1 : 0);

            if (direcao !== 0 && direcaoAnterior !== null && direcao !== direcaoAnterior) {
                mudancasDirecao++;
            }
            if (direcao !== 0) {
                direcaoAnterior = direcao;
            }

            if (Math.abs(delta) < 1 && Math.abs(delta) > 0) {
                microAjustes++;
            }
        }
        posAnterior = pct;
    }

    function verificarArmadilha(pct) {
        var fim = armadilhaInicio + armadilhaLargura;
        if (pct >= armadilhaInicio && pct <= fim) {
            armadilhaAtivada = true;
        }
    }

    function verificarZonaAlvo(pct) {
        var fim = zonaAlvoLeft + zonaAlvoWidth;
        return pct >= zonaAlvoLeft && pct <= fim;
    }

    function calcularMetricas() {
        if (trajetoria.length < 2) {
            return { velMedia: 0, velMax: 0, tempoTotal: 0 };
        }

        var velocidades = [];
        var tempoTotal = trajetoria[trajetoria.length - 1].tempo - trajetoria[0].tempo;

        for (var i = 1; i < trajetoria.length; i++) {
            var dt = trajetoria[i].tempo - trajetoria[i - 1].tempo;
            if (dt > 0) {
                var dp = Math.abs(trajetoria[i].posicao - trajetoria[i - 1].posicao);
                velocidades.push(dp / dt);
            }
        }

        var velMedia = 0;
        var velMax = 0;
        if (velocidades.length > 0) {
            var soma = 0;
            for (var j = 0; j < velocidades.length; j++) {
                soma += velocidades[j];
                if (velocidades[j] > velMax) velMax = velocidades[j];
            }
            velMedia = soma / velocidades.length;
        }

        return {
            velMedia: velMedia,
            velMax: velMax,
            tempoTotal: tempoTotal
        };
    }

    function exibirMetricas(m) {
        metricasPreview.style.display = 'block';
        velMediaEl.textContent = m.velMedia.toFixed(4) + ' %/ms';
        velMaxEl.textContent = m.velMax.toFixed(4) + ' %/ms';
        tempoTotalEl.textContent = m.tempoTotal + ' ms';
        mudancasDirEl.textContent = mudancasDirecao;
        microAjustesEl.textContent = microAjustes;
        armadilhaStatusEl.textContent = armadilhaAtivada ? 'Ativada' : 'Nao ativada';
        armadilhaStatusEl.style.color = armadilhaAtivada ? '#e74c3c' : '#27ae60';
    }

    function iniciarCountdown(pctFinal) {
        divCountdown.style.display = 'flex';
        barraCountdown.style.width = '0%';
        textoCountdown.textContent = 'Aguardando validacao... 2s';

        var inicio = Date.now();
        var duracao = 2000;

        countdownInterval = setInterval(function () {
            var elapsed = Date.now() - inicio;
            var progPct = Math.min((elapsed / duracao) * 100, 100);
            barraCountdown.style.width = progPct + '%';

            var restante = Math.max(0, Math.ceil((duracao - elapsed) / 1000));
            textoCountdown.textContent = 'Aguardando validacao... ' + restante + 's';
        }, 50);

        countdownTimeout = setTimeout(function () {
            clearInterval(countdownInterval);
            barraCountdown.style.width = '100%';
            textoCountdown.textContent = 'Validando...';
            enviarValidacao(pctFinal);
        }, duracao);
    }

    function notificarEntradaZona(pct) {
        if (!desafioId) return;

        fetch('/captcha/slider/api/entrada-zona', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                desafioId: desafioId,
                posicao: pct
            })
        }).catch(function () {});
    }

    function enviarValidacao(pctFinal) {
        tentativa++;
        var metricas = calcularMetricas();
        var tempoMs = metricas.tempoTotal;

        var payload = {
            desafioId: desafioId,
            posicaoFinal: pctFinal,
            tipoUsuario: obterTipoUsuario(),
            sessaoId: sessaoId,
            tentativa: tentativa,
            sessaoExperimental: sessaoExperimental,
            tempoMs: tempoMs,
            metricasComportamentais: {
                trajetoria: trajetoria,
                velocidadeMedia: metricas.velMedia,
                velocidadeMaxima: metricas.velMax,
                mudancasDirecao: mudancasDirecao,
                microAjustes: microAjustes,
                armadilhaAtivada: armadilhaAtivada,
                totalPontos: trajetoria.length
            }
        };

        fetch('/captcha/slider/api/validar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(function (resp) {
                if (!resp.ok) throw new Error('Erro na validacao');
                return resp.json();
            })
            .then(function (dados) {
                exibirMetricas(metricas);

                if (dados.sucesso) {
                    divMensagem.textContent = dados.mensagem || 'CAPTCHA verificado com sucesso!';
                    divMensagem.className = 'mensagem sucesso';
                } else {
                    divMensagem.textContent = dados.mensagem || 'Verificacao falhou. Tente novamente.';
                    divMensagem.className = 'mensagem erro';
                }

                setTimeout(function () {
                    carregarDesafio();
                }, 3000);
            })
            .catch(function (err) {
                divMensagem.textContent = 'Erro de comunicacao com o servidor.';
                divMensagem.className = 'mensagem erro';
                divCountdown.style.display = 'none';
            });
    }

    function onPointerDown(e) {
        if (!desafioId) return;
        e.preventDefault();
        arrastando = true;
        tempoInicio = Date.now();
        trajetoria = [];
        mudancasDirecao = 0;
        microAjustes = 0;
        direcaoAnterior = null;
        posAnterior = null;
        armadilhaAtivada = false;
        dentroZonaAlvo = false;

        if (countdownInterval) clearInterval(countdownInterval);
        if (countdownTimeout) clearTimeout(countdownTimeout);
        divCountdown.style.display = 'none';

        handle.classList.add('ativo');

        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        var pct = obterPosicaoPercentual(clientX);
        atualizarHandle(pct);
        registrarTrajetoria(pct);
    }

    function onPointerMove(e) {
        if (!arrastando) return;
        e.preventDefault();

        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        var pct = obterPosicaoPercentual(clientX);
        atualizarHandle(pct);
        registrarTrajetoria(pct);
        verificarArmadilha(pct);

        if (armadilhaAtivada) {
            arrastando = false;
            handle.classList.remove('ativo');
            divMensagem.textContent = 'Voce tocou na zona vermelha! Tente novamente.';
            divMensagem.className = 'mensagem erro';
            enviarValidacao(pct);
            return;
        }

        var estaNoAlvo = verificarZonaAlvo(pct);
        if (estaNoAlvo && !dentroZonaAlvo) {
            dentroZonaAlvo = true;
            notificarEntradaZona(pct);
            handle.classList.add('na-zona');
        } else if (!estaNoAlvo && dentroZonaAlvo) {
            dentroZonaAlvo = false;
            handle.classList.remove('na-zona');
        }
    }

    function onPointerUp(e) {
        if (!arrastando) return;
        arrastando = false;
        handle.classList.remove('ativo');

        var clientX;
        if (e.changedTouches) {
            clientX = e.changedTouches[0].clientX;
        } else {
            clientX = e.clientX;
        }

        var pctFinal = obterPosicaoPercentual(clientX);
        registrarTrajetoria(pctFinal);

        if (verificarZonaAlvo(pctFinal)) {
            iniciarCountdown(pctFinal);
        } else {
            divMensagem.textContent = 'Solte o controle dentro da area verde.';
            divMensagem.className = 'mensagem erro';
            enviarValidacao(pctFinal);
        }
    }

    handle.addEventListener('mousedown', onPointerDown);
    document.addEventListener('mousemove', onPointerMove);
    document.addEventListener('mouseup', onPointerUp);

    handle.addEventListener('touchstart', onPointerDown, { passive: false });
    document.addEventListener('touchmove', onPointerMove, { passive: false });
    document.addEventListener('touchend', onPointerUp);

    btnRefresh.addEventListener('click', function () {
        carregarDesafio();
    });

    carregarDesafio();
})();
