package captcha.repository;

import captcha.model.Resultado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ResultadoRepository extends JpaRepository<Resultado, Long> {

    List<Resultado> findBySessaoId(String sessaoId);

    List<Resultado> findByTipoCaptcha(String tipoCaptcha);

    List<Resultado> findByTipoUsuario(String tipoUsuario);

    List<Resultado> findByTipoCaptchaAndTipoUsuario(String tipoCaptcha, String tipoUsuario);

    List<Resultado> findBySessaoExperimental(String sessaoExperimental);

    @Query("SELECT DISTINCT r.sessaoExperimental FROM Resultado r WHERE r.sessaoExperimental IS NOT NULL")
    List<String> findDistinctSessaoExperimental();

    @Query("SELECT DISTINCT r.sessaoId FROM Resultado r")
    List<String> findDistinctSessaoId();

    @Query("SELECT r FROM Resultado r WHERE r.tipoCaptcha = :tipo AND r.sessaoExperimental = :sessao")
    List<Resultado> findByTipoCaptchaAndSessaoExperimental(
            @Param("tipo") String tipoCaptcha,
            @Param("sessao") String sessaoExperimental);

    long countByTipoCaptchaAndResultado(String tipoCaptcha, String resultado);

    long countByTipoCaptcha(String tipoCaptcha);
}
