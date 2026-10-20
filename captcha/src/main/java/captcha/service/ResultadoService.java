package captcha.service;

import captcha.model.Resultado;
import captcha.repository.ResultadoRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ResultadoService {

    private final ResultadoRepository repository;

    public ResultadoService(ResultadoRepository repository) {
        this.repository = repository;
    }

    public Resultado salvar(Resultado resultado) {
        return repository.save(resultado);
    }

    public List<Resultado> listarTodos() {
        return repository.findAll();
    }

    public List<Resultado> listarPorTipoCaptcha(String tipoCaptcha) {
        return repository.findByTipoCaptcha(tipoCaptcha);
    }

    public List<Resultado> listarPorTipoUsuario(String tipoUsuario) {
        return repository.findByTipoUsuario(tipoUsuario);
    }

    public List<Resultado> listarPorFiltros(String tipoCaptcha, String tipoUsuario, String sessaoExperimental) {
        List<Resultado> resultados;

        if (tipoCaptcha != null && tipoUsuario != null) {
            resultados = repository.findByTipoCaptchaAndTipoUsuario(tipoCaptcha, tipoUsuario);
        } else if (tipoCaptcha != null) {
            resultados = repository.findByTipoCaptcha(tipoCaptcha);
        } else if (tipoUsuario != null) {
            resultados = repository.findByTipoUsuario(tipoUsuario);
        } else {
            resultados = repository.findAll();
        }

        if (sessaoExperimental != null && !sessaoExperimental.isBlank()) {
            resultados = resultados.stream()
                    .filter(r -> sessaoExperimental.equals(r.getSessaoExperimental()))
                    .collect(Collectors.toList());
        }

        return resultados;
    }

    public Map<String, Object> calcularMetricas(String tipoCaptcha, String sessaoExperimental) {
        List<Resultado> resultados;
        if (sessaoExperimental != null && !sessaoExperimental.isBlank()) {
            resultados = repository.findByTipoCaptchaAndSessaoExperimental(tipoCaptcha, sessaoExperimental);
        } else {
            resultados = repository.findByTipoCaptcha(tipoCaptcha);
        }

        Map<String, Object> metricas = new LinkedHashMap<>();
        metricas.put("totalTentativas", resultados.size());

        if (resultados.isEmpty()) {
            metricas.put("taxaBloqueio", 0.0);
            metricas.put("taxaEvasao", 0.0);
            metricas.put("taxaSucessoHumano", 0.0);
            metricas.put("taxaErroHumano", 0.0);
            metricas.put("tempoMedio", 0.0);
            metricas.put("tempoMinimo", 0L);
            metricas.put("tempoMaximo", 0L);
            metricas.put("desvioPadrao", 0.0);
            return metricas;
        }

        List<Resultado> tentativasBot = resultados.stream()
                .filter(r -> r.getTipoUsuario() != null && r.getTipoUsuario().startsWith("BOT"))
                .toList();
        List<Resultado> tentativasHumano = resultados.stream()
                .filter(r -> "HUMANO".equals(r.getTipoUsuario()))
                .toList();

        long botsBloqueados = tentativasBot.stream()
                .filter(r -> !"SUCESSO".equals(r.getResultado()))
                .count();
        double taxaBloqueio = tentativasBot.isEmpty() ? 0.0 :
                (double) botsBloqueados / tentativasBot.size() * 100.0;

        long botsEvasao = tentativasBot.stream()
                .filter(r -> "SUCESSO".equals(r.getResultado()))
                .count();
        double taxaEvasao = tentativasBot.isEmpty() ? 0.0 :
                (double) botsEvasao / tentativasBot.size() * 100.0;

        long humanosSucesso = tentativasHumano.stream()
                .filter(r -> "SUCESSO".equals(r.getResultado()))
                .count();
        double taxaSucessoHumano = tentativasHumano.isEmpty() ? 0.0 :
                (double) humanosSucesso / tentativasHumano.size() * 100.0;

        long humanosErro = tentativasHumano.stream()
                .filter(r -> "ERRO".equals(r.getResultado()))
                .count();
        double taxaErroHumano = tentativasHumano.isEmpty() ? 0.0 :
                (double) humanosErro / tentativasHumano.size() * 100.0;

        List<Long> tempos = resultados.stream()
                .filter(r -> r.getTempoMs() != null && r.getTempoMs() > 0)
                .map(Resultado::getTempoMs)
                .toList();

        double tempoMedio = tempos.stream().mapToLong(Long::longValue).average().orElse(0.0);
        long tempoMinimo = tempos.stream().mapToLong(Long::longValue).min().orElse(0L);
        long tempoMaximo = tempos.stream().mapToLong(Long::longValue).max().orElse(0L);

        double desvioPadrao = 0.0;
        if (tempos.size() > 1) {
            double media = tempoMedio;
            double somaQuadrados = tempos.stream()
                    .mapToDouble(t -> Math.pow(t - media, 2))
                    .sum();
            desvioPadrao = Math.sqrt(somaQuadrados / (tempos.size() - 1));
        }

        metricas.put("taxaBloqueio", Math.round(taxaBloqueio * 100.0) / 100.0);
        metricas.put("taxaEvasao", Math.round(taxaEvasao * 100.0) / 100.0);
        metricas.put("taxaSucessoHumano", Math.round(taxaSucessoHumano * 100.0) / 100.0);
        metricas.put("taxaErroHumano", Math.round(taxaErroHumano * 100.0) / 100.0);
        metricas.put("tempoMedio", Math.round(tempoMedio * 100.0) / 100.0);
        metricas.put("tempoMinimo", tempoMinimo);
        metricas.put("tempoMaximo", tempoMaximo);
        metricas.put("desvioPadrao", Math.round(desvioPadrao * 100.0) / 100.0);

        metricas.put("totalBots", tentativasBot.size());
        metricas.put("totalHumanos", tentativasHumano.size());
        metricas.put("botsBloqueados", botsBloqueados);
        metricas.put("botsEvasao", botsEvasao);

        Map<String, Long> resultadosPorTipo = resultados.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getTipoUsuario() != null ? r.getTipoUsuario() : "DESCONHECIDO",
                        Collectors.counting()));
        metricas.put("tentativasPorTipoUsuario", resultadosPorTipo);

        Map<String, Long> resultadosPorResultado = resultados.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getResultado() != null ? r.getResultado() : "DESCONHECIDO",
                        Collectors.counting()));
        metricas.put("tentativasPorResultado", resultadosPorResultado);

        if ("CAPTCHA_DESLIZANTE".equals(tipoCaptcha)) {
            metricas.putAll(calcularMetricasSlider(resultados));
        }

        return metricas;
    }

    private Map<String, Object> calcularMetricasSlider(List<Resultado> resultados) {
        Map<String, Object> metricas = new LinkedHashMap<>();

        long armadilhasAcionadas = resultados.stream()
                .filter(r -> Boolean.TRUE.equals(r.getArmadilhaAcionada()))
                .count();
        metricas.put("armadilhasAcionadas", armadilhasAcionadas);

        double taxaArmadilha = resultados.isEmpty() ? 0.0 :
                (double) armadilhasAcionadas / resultados.size() * 100.0;
        metricas.put("taxaArmadilha", Math.round(taxaArmadilha * 100.0) / 100.0);

        List<Double> velocidades = resultados.stream()
                .filter(r -> r.getVelocidadeMedia() != null)
                .map(Resultado::getVelocidadeMedia)
                .toList();

        if (!velocidades.isEmpty()) {
            metricas.put("velocidadeMediaGeral",
                    Math.round(velocidades.stream().mapToDouble(Double::doubleValue).average().orElse(0.0) * 100.0) / 100.0);
        }

        OptionalDouble mediaDir = resultados.stream()
                .filter(r -> r.getMudancasDirecao() != null)
                .mapToInt(Resultado::getMudancasDirecao)
                .average();
        if (mediaDir.isPresent()) {
            metricas.put("mediaMudancasDirecao", Math.round(mediaDir.getAsDouble() * 100.0) / 100.0);
        }

        OptionalDouble mediaMicro = resultados.stream()
                .filter(r -> r.getMicroAjustes() != null)
                .mapToInt(Resultado::getMicroAjustes)
                .average();
        if (mediaMicro.isPresent()) {
            metricas.put("mediaMicroAjustes", Math.round(mediaMicro.getAsDouble() * 100.0) / 100.0);
        }

        return metricas;
    }

    public List<String> listarSessoesExperimentais() {
        return repository.findDistinctSessaoExperimental();
    }

    public List<String> listarSessoesId() {
        return repository.findDistinctSessaoId();
    }

    public void deletarTodos() {
        repository.deleteAll();
    }

    public List<Resultado> listarPorSessaoId(String sessaoId) {
        return repository.findBySessaoId(sessaoId);
    }
}
