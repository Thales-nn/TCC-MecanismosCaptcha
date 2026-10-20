package captcha.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CaptchaSliderService {

    @Value("${captcha.slider.zona-min:30}")
    private int zonaMin;

    @Value("${captcha.slider.zona-max:85}")
    private int zonaMax;

    @Value("${captcha.slider.tolerancia:3}")
    private int tolerancia;

    @Value("${captcha.slider.armadilha-inicio:95}")
    private int armadilhaInicio;

    @Value("${captcha.slider.tempo-minimo-ms:2000}")
    private long tempoMinimoMs;

    @Value("${captcha.slider.expiracao-segundos:300}")
    private long expiracaoSegundos;

    private final SecureRandom random = new SecureRandom();

    private record DesafioSlider(
            double posicaoAlvo,
            double zonaInicio,
            double zonaFim,
            double armadilhaInicio,
            double armadilhaFim,
            Instant criadoEm,
            Instant entradaZona,
            boolean usado
    ) {}

    private final ConcurrentHashMap<String, DesafioSlider> desafios = new ConcurrentHashMap<>();

    public Map<String, Object> gerarDesafio() {
        limparExpirados();
        String id = UUID.randomUUID().toString();

        double posicaoAlvo = zonaMin + random.nextDouble() * (zonaMax - zonaMin);
        double inicio = posicaoAlvo - tolerancia;
        double fim = posicaoAlvo + tolerancia;
        double armInicio = armadilhaInicio;
        double armFim = 100.0;

        desafios.put(id, new DesafioSlider(
                posicaoAlvo, inicio, fim, armInicio, armFim,
                Instant.now(), null, false));

        return Map.of(
                "desafioId", id,
                "zonaInicio", inicio,
                "zonaFim", fim,
                "zonaAlvoLeft", inicio,
                "zonaAlvoWidth", fim - inicio,
                "armadilhaInicio", armInicio,
                "armadilhaFim", armFim,
                "armadilhaLargura", armFim - armInicio
        );
    }

    public boolean registrarEntradaZona(String desafioId) {
        DesafioSlider desafio = desafios.get(desafioId);
        if (desafio == null || desafio.usado()) return false;

        if (desafio.entradaZona() == null) {
            desafios.put(desafioId, new DesafioSlider(
                    desafio.posicaoAlvo(), desafio.zonaInicio(), desafio.zonaFim(),
                    desafio.armadilhaInicio(), desafio.armadilhaFim(),
                    desafio.criadoEm(), Instant.now(), false));
        }
        return true;
    }

    public record ResultadoValidacao(
            boolean sucesso,
            String motivo,
            boolean armadilhaAcionada,
            double posicaoAlvo
    ) {}

    public ResultadoValidacao validar(String desafioId, double posicaoFinal) {
        if (desafioId == null) {
            return new ResultadoValidacao(false, "DESAFIO_EXPIRADO", false, 0);
        }

        DesafioSlider desafio = desafios.get(desafioId);
        if (desafio == null) {
            return new ResultadoValidacao(false, "DESAFIO_EXPIRADO", false, 0);
        }
        if (desafio.usado()) {
            desafios.remove(desafioId);
            return new ResultadoValidacao(false, "DESAFIO_JA_USADO", false, desafio.posicaoAlvo());
        }
        if (Instant.now().isAfter(desafio.criadoEm().plusSeconds(expiracaoSegundos))) {
            desafios.remove(desafioId);
            return new ResultadoValidacao(false, "DESAFIO_EXPIRADO", false, desafio.posicaoAlvo());
        }

        desafios.put(desafioId, new DesafioSlider(
                desafio.posicaoAlvo(), desafio.zonaInicio(), desafio.zonaFim(),
                desafio.armadilhaInicio(), desafio.armadilhaFim(),
                desafio.criadoEm(), desafio.entradaZona(), true));

        boolean armadilha = posicaoFinal >= desafio.armadilhaInicio()
                && posicaoFinal <= desafio.armadilhaFim();
        if (armadilha) {
            return new ResultadoValidacao(false, "ARMADILHA_ACIONADA", true, desafio.posicaoAlvo());
        }

        if (desafio.entradaZona() != null) {
            long msNaZona = Instant.now().toEpochMilli() - desafio.entradaZona().toEpochMilli();
            if (msNaZona < tempoMinimoMs) {
                return new ResultadoValidacao(false, "TEMPO_MINIMO_NAO_ATINGIDO", false, desafio.posicaoAlvo());
            }
        }

        boolean dentroZona = posicaoFinal >= desafio.zonaInicio()
                && posicaoFinal <= desafio.zonaFim();

        if (!dentroZona) {
            return new ResultadoValidacao(false, "POSICAO_FORA_ZONA", false, desafio.posicaoAlvo());
        }

        return new ResultadoValidacao(true, null, false, desafio.posicaoAlvo());
    }

    public Map<String, Object> getInfoDesafio(String desafioId) {
        DesafioSlider desafio = desafios.get(desafioId);
        if (desafio == null) return null;
        return Map.of(
                "desafioId", desafioId,
                "posicaoAlvo", desafio.posicaoAlvo(),
                "zonaInicio", desafio.zonaInicio(),
                "zonaFim", desafio.zonaFim(),
                "armadilhaInicio", desafio.armadilhaInicio(),
                "armadilhaFim", desafio.armadilhaFim(),
                "criadoEm", desafio.criadoEm().toString(),
                "usado", desafio.usado()
        );
    }

    private void limparExpirados() {
        Instant agora = Instant.now();
        desafios.entrySet().removeIf(e ->
                agora.isAfter(e.getValue().criadoEm().plusSeconds(expiracaoSegundos)));
    }
}
