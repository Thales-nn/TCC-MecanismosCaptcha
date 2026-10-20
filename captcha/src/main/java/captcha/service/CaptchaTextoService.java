package captcha.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CaptchaTextoService {

    @Value("${captcha.texto.comprimento:6}")
    private int comprimento;

    @Value("${captcha.texto.charset:ABCDEFGHJKLMNPQRSTUVWXYZ23456789}")
    private String charset;

    @Value("${captcha.texto.largura:320}")
    private int largura;

    @Value("${captcha.texto.altura:100}")
    private int altura;

    @Value("${captcha.texto.expiracao-segundos:300}")
    private long expiracaoSegundos;

    private final SecureRandom random = new SecureRandom();

    private record DesafioTexto(String codigo, Instant criadoEm, boolean usado) {}

    private final ConcurrentHashMap<String, DesafioTexto> desafios = new ConcurrentHashMap<>();

    public String gerarDesafio() {
        limparExpirados();
        String id = UUID.randomUUID().toString();
        String codigo = gerarCodigo();
        desafios.put(id, new DesafioTexto(codigo, Instant.now(), false));
        return id;
    }

    public byte[] gerarImagem(String desafioId) throws IOException {
        DesafioTexto desafio = desafios.get(desafioId);
        if (desafio == null || desafio.usado()) return null;
        if (Instant.now().isAfter(desafio.criadoEm().plusSeconds(expiracaoSegundos))) {
            desafios.remove(desafioId);
            return null;
        }
        return renderizarImagem(desafio.codigo());
    }

    public record ResultadoValidacao(boolean sucesso, String motivo) {}

    public ResultadoValidacao validar(String desafioId, String respostaUsuario) {
        if (desafioId == null || respostaUsuario == null) {
            return new ResultadoValidacao(false, "RESPOSTA_INCORRETA");
        }

        DesafioTexto desafio = desafios.get(desafioId);
        if (desafio == null) {
            return new ResultadoValidacao(false, "DESAFIO_EXPIRADO");
        }
        if (desafio.usado()) {
            desafios.remove(desafioId);
            return new ResultadoValidacao(false, "DESAFIO_JA_USADO");
        }
        if (Instant.now().isAfter(desafio.criadoEm().plusSeconds(expiracaoSegundos))) {
            desafios.remove(desafioId);
            return new ResultadoValidacao(false, "DESAFIO_EXPIRADO");
        }

        desafios.put(desafioId, new DesafioTexto(desafio.codigo(), desafio.criadoEm(), true));

        boolean correto = desafio.codigo().equalsIgnoreCase(respostaUsuario.trim());
        return new ResultadoValidacao(correto, correto ? null : "RESPOSTA_INCORRETA");
    }

    private String gerarCodigo() {
        StringBuilder sb = new StringBuilder(comprimento);
        for (int i = 0; i < comprimento; i++) {
            sb.append(charset.charAt(random.nextInt(charset.length())));
        }
        return sb.toString();
    }

    private byte[] renderizarImagem(String codigo) throws IOException {
        BufferedImage imagem = new BufferedImage(largura, altura, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = imagem.createGraphics();

        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

        g.setColor(new Color(240 + random.nextInt(15), 240 + random.nextInt(15), 240 + random.nextInt(15)));
        g.fillRect(0, 0, largura, altura);

        int numLinhas = 8 + random.nextInt(5);
        for (int i = 0; i < numLinhas; i++) {
            g.setColor(new Color(
                    160 + random.nextInt(80),
                    160 + random.nextInt(80),
                    160 + random.nextInt(80)));
            g.setStroke(new BasicStroke(1 + random.nextFloat() * 2));
            g.drawLine(random.nextInt(largura), random.nextInt(altura),
                    random.nextInt(largura), random.nextInt(altura));
        }

        int numPontos = 100 + random.nextInt(50);
        for (int i = 0; i < numPontos; i++) {
            g.setColor(new Color(
                    140 + random.nextInt(100),
                    140 + random.nextInt(100),
                    140 + random.nextInt(100)));
            int x = random.nextInt(largura);
            int y = random.nextInt(altura);
            int tamanho = 1 + random.nextInt(3);
            g.fillOval(x, y, tamanho, tamanho);
        }

        String[] fontes = {"Arial", "Verdana", "Tahoma", "Courier New", "Georgia"};
        int espacoChar = largura / (codigo.length() + 2);

        for (int i = 0; i < codigo.length(); i++) {
            int tamanhoFonte = 36 + random.nextInt(13);
            String nomeFonte = fontes[random.nextInt(fontes.length)];
            int estilo = random.nextBoolean() ? Font.BOLD : Font.BOLD | Font.ITALIC;
            Font fonte = new Font(nomeFonte, estilo, tamanhoFonte);
            g.setFont(fonte);

            g.setColor(new Color(
                    random.nextInt(100),
                    random.nextInt(100),
                    random.nextInt(100)));

            AffineTransform original = g.getTransform();
            double angulo = Math.toRadians(-45 + random.nextInt(91));
            int x = espacoChar * (i + 1);
            int y = altura / 2 + random.nextInt(20) - 10;
            g.rotate(angulo, x, y);
            g.drawString(String.valueOf(codigo.charAt(i)), x, y);
            g.setTransform(original);
        }

        for (int i = 0; i < 3; i++) {
            g.setColor(new Color(
                    100 + random.nextInt(100),
                    100 + random.nextInt(100),
                    100 + random.nextInt(100)));
            g.setStroke(new BasicStroke(1.5f + random.nextFloat()));
            int x1 = random.nextInt(largura / 4);
            int x2 = largura - random.nextInt(largura / 4);
            g.drawLine(x1, random.nextInt(altura), x2, random.nextInt(altura));
        }

        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(imagem, "png", baos);
        return baos.toByteArray();
    }

    private void limparExpirados() {
        Instant agora = Instant.now();
        desafios.entrySet().removeIf(e ->
                agora.isAfter(e.getValue().criadoEm().plusSeconds(expiracaoSegundos)));
    }

    public Map<String, Object> getInfoDesafio(String desafioId) {
        DesafioTexto desafio = desafios.get(desafioId);
        if (desafio == null) return null;
        return Map.of(
                "desafioId", desafioId,
                "criadoEm", desafio.criadoEm().toString(),
                "usado", desafio.usado()
        );
    }
}
