package captcha.controller;

import captcha.model.Resultado;
import captcha.service.ResultadoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resultados")
public class ResultadoApiController {

    private final ResultadoService resultadoService;

    public ResultadoApiController(ResultadoService resultadoService) {
        this.resultadoService = resultadoService;
    }

    @GetMapping
    public ResponseEntity<List<Resultado>> listar(
            @RequestParam(required = false) String tipoCaptcha,
            @RequestParam(required = false) String tipoUsuario,
            @RequestParam(required = false) String sessaoExperimental,
            @RequestParam(required = false) String sessaoId) {

        if (sessaoId != null && !sessaoId.isBlank()) {
            return ResponseEntity.ok(resultadoService.listarPorSessaoId(sessaoId));
        }

        return ResponseEntity.ok(
                resultadoService.listarPorFiltros(tipoCaptcha, tipoUsuario, sessaoExperimental));
    }

    @GetMapping("/metricas")
    public ResponseEntity<Map<String, Object>> metricas(
            @RequestParam String tipoCaptcha,
            @RequestParam(required = false) String sessaoExperimental) {
        return ResponseEntity.ok(
                resultadoService.calcularMetricas(tipoCaptcha, sessaoExperimental));
    }

    @GetMapping("/sessoes-experimentais")
    public ResponseEntity<List<String>> sessoesExperimentais() {
        return ResponseEntity.ok(resultadoService.listarSessoesExperimentais());
    }

    @PostMapping
    public ResponseEntity<Resultado> salvar(@RequestBody Resultado resultado) {
        return ResponseEntity.ok(resultadoService.salvar(resultado));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, String>> deletarTodos() {
        resultadoService.deletarTodos();
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
