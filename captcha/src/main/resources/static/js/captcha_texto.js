(function () {
    'use strict';

    var desafioId = null;
    var tentativa = 0;
    var tempoInicio = null;
    var sessaoId = gerarSessaoId();
    var sessaoExperimental = obterSessaoExperimental();

    var imgCaptcha = document.getElementById('captchaImagem');
    var divCarregando = document.getElementById('captchaCarregando');
    var inputCodigo = document.getElementById('codigo');
    var btnVerificar = document.getElementById('btnVerificar');
    var btnRefresh = document.getElementById('refreshCaptcha');
    var divMensagem = document.getElementById('mensagem');
    var form = document.getElementById('captchaForm');

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

    function carregarDesafio() {
        divCarregando.style.display = 'flex';
        imgCaptcha.style.display = 'none';
        divMensagem.textContent = '';
        divMensagem.className = 'mensagem';
        inputCodigo.value = '';
        inputCodigo.disabled = true;
        btnVerificar.disabled = true;

        fetch('/captcha/texto/api/novo')
            .then(function (resp) {
                if (!resp.ok) throw new Error('Erro ao gerar desafio');
                return resp.json();
            })
            .then(function (dados) {
                desafioId = dados.desafioId;
                imgCaptcha.src = '/captcha/texto/api/imagem/' + desafioId + '?t=' + Date.now();
            })
            .catch(function (err) {
                divCarregando.style.display = 'none';
                divMensagem.textContent = 'Erro ao carregar CAPTCHA. Tente novamente.';
                divMensagem.className = 'mensagem erro';
            });
    }

    imgCaptcha.addEventListener('load', function () {
        divCarregando.style.display = 'none';
        imgCaptcha.style.display = 'block';
        inputCodigo.disabled = false;
        btnVerificar.disabled = false;
        inputCodigo.focus();
        tempoInicio = Date.now();
    });

    imgCaptcha.addEventListener('error', function () {
        divCarregando.style.display = 'none';
        divMensagem.textContent = 'Erro ao carregar imagem. Tente novamente.';
        divMensagem.className = 'mensagem erro';
    });

    btnRefresh.addEventListener('click', function () {
        carregarDesafio();
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var resposta = inputCodigo.value.trim().toUpperCase();
        if (resposta.length === 0) {
            divMensagem.textContent = 'Digite o codigo antes de verificar.';
            divMensagem.className = 'mensagem erro';
            return;
        }

        if (!desafioId) {
            divMensagem.textContent = 'Nenhum desafio carregado. Clique em Novo codigo.';
            divMensagem.className = 'mensagem erro';
            return;
        }

        tentativa++;
        var tempoMs = Date.now() - tempoInicio;

        btnVerificar.disabled = true;
        inputCodigo.disabled = true;

        var payload = {
            desafioId: desafioId,
            resposta: resposta,
            tipoUsuario: obterTipoUsuario(),
            sessaoId: sessaoId,
            tentativa: tentativa,
            sessaoExperimental: sessaoExperimental,
            tempoMs: tempoMs
        };

        fetch('/captcha/texto/api/validar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(function (resp) {
                if (!resp.ok) throw new Error('Erro na validacao');
                return resp.json();
            })
            .then(function (dados) {
                if (dados.sucesso) {
                    divMensagem.textContent = dados.mensagem || 'CAPTCHA verificado com sucesso!';
                    divMensagem.className = 'mensagem sucesso';
                } else {
                    divMensagem.textContent = dados.mensagem || 'Codigo incorreto. Tente novamente.';
                    divMensagem.className = 'mensagem erro';
                }

                setTimeout(function () {
                    carregarDesafio();
                }, 2000);
            })
            .catch(function (err) {
                divMensagem.textContent = 'Erro de comunicacao com o servidor.';
                divMensagem.className = 'mensagem erro';
                btnVerificar.disabled = false;
                inputCodigo.disabled = false;
            });
    });

    carregarDesafio();
})();
