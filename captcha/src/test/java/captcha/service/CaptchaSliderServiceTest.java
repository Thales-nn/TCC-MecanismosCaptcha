package captcha.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class CaptchaSliderServiceTest {

    private CaptchaSliderService service;

    @BeforeEach
    void setUp() throws Exception {
        service = new CaptchaSliderService();

        setField("zonaMin", 30);
        setField("zonaMax", 85);
        setField("tolerancia", 3);
        setField("armadilhaInicio", 95);
        setField("tempoMinimoMs", 2000L);
        setField("expiracaoSegundos", 300L);
    }

    private void setField(String name, Object value) throws Exception {
        var field = CaptchaSliderService.class.getDeclaredField(name);
        field.setAccessible(true);
        field.set(service, value);
    }

    @Test
    void gerarDesafio_retornaMapComCamposEsperados() {
        Map<String, Object> desafio = service.gerarDesafio();
        assertNotNull(desafio);
        assertTrue(desafio.containsKey("desafioId"));
        assertTrue(desafio.containsKey("zonaInicio"));
        assertTrue(desafio.containsKey("zonaFim"));
        assertTrue(desafio.containsKey("armadilhaInicio"));
        assertTrue(desafio.containsKey("zonaAlvoLeft"));
        assertTrue(desafio.containsKey("zonaAlvoWidth"));
    }

    @Test
    void gerarDesafio_zonaAlvoDentroLimites() {
        for (int i = 0; i < 50; i++) {
            Map<String, Object> desafio = service.gerarDesafio();
            double zonaInicio = (double) desafio.get("zonaInicio");
            double zonaFim = (double) desafio.get("zonaFim");
            assertTrue(zonaInicio >= 27.0);
            assertTrue(zonaFim <= 88.0);
            assertTrue(zonaFim > zonaInicio);
        }
    }

    @Test
    void gerarDesafio_armadilhaEm95() {
        Map<String, Object> desafio = service.gerarDesafio();
        double armInicio = (double) desafio.get("armadilhaInicio");
        assertEquals(95.0, armInicio);
    }

    @Test
    void validar_posicaoDentroZona_semEntradaZona_sucesso() {
        Map<String, Object> desafio = service.gerarDesafio();
        String id = (String) desafio.get("desafioId");
        double zonaInicio = (double) desafio.get("zonaInicio");
        double zonaFim = (double) desafio.get("zonaFim");
        double centro = (zonaInicio + zonaFim) / 2.0;

        var resultado = service.validar(id, centro);
        assertTrue(resultado.sucesso());
        assertNull(resultado.motivo());
        assertFalse(resultado.armadilhaAcionada());
    }

    @Test
    void validar_posicaoForaZona() {
        Map<String, Object> desafio = service.gerarDesafio();
        String id = (String) desafio.get("desafioId");

        var resultado = service.validar(id, 5.0);
        assertFalse(resultado.sucesso());
        assertEquals("POSICAO_FORA_ZONA", resultado.motivo());
    }

    @Test
    void validar_armadilhaAcionada() {
        Map<String, Object> desafio = service.gerarDesafio();
        String id = (String) desafio.get("desafioId");

        var resultado = service.validar(id, 97.0);
        assertFalse(resultado.sucesso());
        assertEquals("ARMADILHA_ACIONADA", resultado.motivo());
        assertTrue(resultado.armadilhaAcionada());
    }

    @Test
    void validar_tempoMinimoNaoAtingido() throws InterruptedException {
        Map<String, Object> desafio = service.gerarDesafio();
        String id = (String) desafio.get("desafioId");
        double zonaInicio = (double) desafio.get("zonaInicio");
        double zonaFim = (double) desafio.get("zonaFim");
        double centro = (zonaInicio + zonaFim) / 2.0;

        service.registrarEntradaZona(id);

        var resultado = service.validar(id, centro);
        assertFalse(resultado.sucesso());
        assertEquals("TEMPO_MINIMO_NAO_ATINGIDO", resultado.motivo());
    }

    @Test
    void validar_desafioJaUsado() {
        Map<String, Object> desafio = service.gerarDesafio();
        String id = (String) desafio.get("desafioId");
        double zonaInicio = (double) desafio.get("zonaInicio");
        double zonaFim = (double) desafio.get("zonaFim");
        double centro = (zonaInicio + zonaFim) / 2.0;

        service.validar(id, centro);
        var resultado2 = service.validar(id, centro);
        assertFalse(resultado2.sucesso());
        assertEquals("DESAFIO_JA_USADO", resultado2.motivo());
    }

    @Test
    void validar_desafioInexistente() {
        var resultado = service.validar("inexistente", 50.0);
        assertFalse(resultado.sucesso());
        assertEquals("DESAFIO_EXPIRADO", resultado.motivo());
    }

    @Test
    void validar_desafioIdNulo() {
        var resultado = service.validar(null, 50.0);
        assertFalse(resultado.sucesso());
    }

    @Test
    void registrarEntradaZona_desafioValido() {
        Map<String, Object> desafio = service.gerarDesafio();
        String id = (String) desafio.get("desafioId");
        assertTrue(service.registrarEntradaZona(id));
    }

    @Test
    void registrarEntradaZona_desafioInexistente() {
        assertFalse(service.registrarEntradaZona("inexistente"));
    }

    @Test
    void getInfoDesafio_retornaInfo() {
        Map<String, Object> desafio = service.gerarDesafio();
        String id = (String) desafio.get("desafioId");
        var info = service.getInfoDesafio(id);
        assertNotNull(info);
        assertEquals(id, info.get("desafioId"));
        assertFalse((boolean) info.get("usado"));
    }

    @Test
    void getInfoDesafio_retornaNullParaInexistente() {
        assertNull(service.getInfoDesafio("inexistente"));
    }
}
