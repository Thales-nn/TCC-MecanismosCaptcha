package captcha.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;

class CaptchaTextoServiceTest {

    private CaptchaTextoService service;

    @BeforeEach
    void setUp() throws Exception {
        service = new CaptchaTextoService();
        var comprimentoField = CaptchaTextoService.class.getDeclaredField("comprimento");
        comprimentoField.setAccessible(true);
        comprimentoField.setInt(service, 6);

        var charsetField = CaptchaTextoService.class.getDeclaredField("charset");
        charsetField.setAccessible(true);
        charsetField.set(service, "ABCDEFGHJKLMNPQRSTUVWXYZ23456789");

        var larguraField = CaptchaTextoService.class.getDeclaredField("largura");
        larguraField.setAccessible(true);
        larguraField.setInt(service, 320);

        var alturaField = CaptchaTextoService.class.getDeclaredField("altura");
        alturaField.setAccessible(true);
        alturaField.setInt(service, 100);

        var expiracaoField = CaptchaTextoService.class.getDeclaredField("expiracaoSegundos");
        expiracaoField.setAccessible(true);
        expiracaoField.setLong(service, 300);
    }

    @Test
    void gerarDesafio_retornaIdNaoNulo() {
        String id = service.gerarDesafio();
        assertNotNull(id);
        assertFalse(id.isBlank());
    }

    @Test
    void gerarDesafio_retornaIdsUnicos() {
        String id1 = service.gerarDesafio();
        String id2 = service.gerarDesafio();
        assertNotEquals(id1, id2);
    }

    @Test
    void gerarImagem_retornaPngParaDesafioValido() throws IOException {
        String id = service.gerarDesafio();
        byte[] imagem = service.gerarImagem(id);
        assertNotNull(imagem);
        assertTrue(imagem.length > 0);
        assertEquals((byte) 0x89, imagem[0]);
        assertEquals((byte) 0x50, imagem[1]);
    }

    @Test
    void gerarImagem_retornaNullParaDesafioInexistente() throws IOException {
        byte[] imagem = service.gerarImagem("id-inexistente");
        assertNull(imagem);
    }

    @Test
    void validar_respostaCorreta() {
        String id = service.gerarDesafio();
        var info = service.getInfoDesafio(id);
        assertNotNull(info);

        String id2 = service.gerarDesafio();
        byte[] imgBytes;
        try { imgBytes = service.gerarImagem(id2); } catch (IOException e) { fail(); return; }

        var resultado = service.validar(id2, "WRONG");
        assertNotNull(resultado);
    }

    @Test
    void validar_respostaIncorreta() {
        String id = service.gerarDesafio();
        var resultado = service.validar(id, "XXXXXX");
        assertFalse(resultado.sucesso());
        assertEquals("RESPOSTA_INCORRETA", resultado.motivo());
    }

    @Test
    void validar_desafioJaUsado() {
        String id = service.gerarDesafio();
        service.validar(id, "XXXXXX");
        var resultado2 = service.validar(id, "XXXXXX");
        assertFalse(resultado2.sucesso());
        assertEquals("DESAFIO_JA_USADO", resultado2.motivo());
    }

    @Test
    void validar_desafioInexistente() {
        var resultado = service.validar("inexistente", "XXXXXX");
        assertFalse(resultado.sucesso());
        assertEquals("DESAFIO_EXPIRADO", resultado.motivo());
    }

    @Test
    void validar_respostaNula() {
        String id = service.gerarDesafio();
        var resultado = service.validar(id, null);
        assertFalse(resultado.sucesso());
    }

    @Test
    void validar_desafioIdNulo() {
        var resultado = service.validar(null, "ABCDEF");
        assertFalse(resultado.sucesso());
    }

    @Test
    void getInfoDesafio_retornaInfoCorreta() {
        String id = service.gerarDesafio();
        var info = service.getInfoDesafio(id);
        assertNotNull(info);
        assertEquals(id, info.get("desafioId"));
        assertFalse((boolean) info.get("usado"));
    }

    @Test
    void getInfoDesafio_retornaNullParaInexistente() {
        var info = service.getInfoDesafio("inexistente");
        assertNull(info);
    }
}
