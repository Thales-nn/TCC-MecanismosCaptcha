package captcha.config;

import captcha.model.Usuario;
import captcha.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;

    @Value("${captcha.auth.usuario-padrao:admin}")
    private String usuarioPadrao;

    @Value("${captcha.auth.senha-padrao:1234}")
    private String senhaPadrao;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public DataInitializer(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public void run(String... args) {
        if (!usuarioRepository.existsByUsername(usuarioPadrao)) {
            String senhaCriptografada = encoder.encode(senhaPadrao);
            Usuario usuario = new Usuario(usuarioPadrao, senhaCriptografada);
            usuarioRepository.save(usuario);
        }
    }
}
