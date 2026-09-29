package captcha.controller;

import captcha.model.resultado;
import captcha.repository.ResultadoRepository;

import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/resultados")
public class ResultadoController {

    private final ResultadoRepository repository;

    public ResultadoController(
            ResultadoRepository repository) {

        this.repository = repository;
    }

    @GetMapping
    public List<resultado> listar(
            @RequestParam(required = false)
            String sessaoId) {

        if (sessaoId != null && !sessaoId.isEmpty()) {

            return repository.findBySessaoId(sessaoId);
        }

        return repository.findAll();
    }

    @PostMapping
    public resultado salvar(
            @RequestBody resultado resultado) {

        return repository.save(resultado);
    }

    // =========================================================
    // ENDPOINT AGRUPADO — métricas por tipoCaptcha e tipoUsuario
    // =========================================================

    @GetMapping("/agrupados")
    public Map<String, Object> agrupados() {

        List<resultado> todos = repository.findAll();

        // Agrupar por tipoCaptcha + tipoUsuario
        Map<String, Map<String, Long>> contagem = new HashMap<>();

        // Estrutura: { CAPTCHA_TEXTO: { HUMANO: {total, sucessos, erros, somaTempo}, ... } }
        Map<String, Map<String, int[]>> contadores = new HashMap<>();

        for (resultado r : todos) {

            String tipoCaptcha =
                    r.getTipoCaptcha() != null
                            ? r.getTipoCaptcha()
                            : "INDEFINIDO";

            String tipoUsuario =
                    r.getTipoUsuario() != null
                            ? r.getTipoUsuario()
                            : "INDEFINIDO";

            contadores
                    .computeIfAbsent(tipoCaptcha, k -> new HashMap<>())
                    .computeIfAbsent(tipoUsuario, k -> new int[4]); // [total, sucessos, erros, somaTempo]

            int[] c = contadores.get(tipoCaptcha).get(tipoUsuario);
            c[0]++; // total
            c[2]++; // erros (default)

            long tempo =
                    r.getTempoMs() != null
                            ? r.getTempoMs()
                            : 0L;
            c[3] += (int) tempo;

            if ("SUCESSO".equalsIgnoreCase(r.getResultado())) {
                c[1]++; // sucessos
                c[2]--; // corrige erro
            }
        }

        // Montar resposta
        Map<String, Object> resposta = new HashMap<>();

        // Lista de grupos
        List<Map<String, Object>> grupos = new java.util.ArrayList<>();

        for (Map.Entry<String, Map<String, int[]>> entryCaptcha :
                contadores.entrySet()) {

            for (Map.Entry<String, int[]> entryUsuario :
                    entryCaptcha.getValue().entrySet()) {

                int[] c = entryUsuario.getValue();

                Map<String, Object> grupo = new HashMap<>();
                grupo.put("tipoCaptcha", entryCaptcha.getKey());
                grupo.put("tipoUsuario", entryUsuario.getKey());
                grupo.put("total", c[0]);
                grupo.put("sucessos", c[1]);
                grupo.put("erros", c[2]);
                grupo.put("tempoMedio", c[0] > 0 ? (double) c[3] / c[0] : 0);

                grupos.add(grupo);
            }
        }

        resposta.put("grupos", grupos);
        resposta.put("totalRegistros", todos.size());

        return resposta;
    }

    @DeleteMapping
    public void deletarTodos() {
        repository.deleteAll();
    }
}