package captcha.model;

import jakarta.persistence.*;

@Entity
@Table(name = "resultados")
public class resultado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String tipoCaptcha;

    private Integer tentativa;

    private String resultado;

    private Long tempoMs;

    private String tipoUsuario;

    private String sessaoId;


    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }


    public String getTipoCaptcha() {
        return tipoCaptcha;
    }

    public void setTipoCaptcha(String tipoCaptcha) {
        this.tipoCaptcha = tipoCaptcha;
    }


    public Integer getTentativa() {
        return tentativa;
    }

    public void setTentativa(Integer tentativa) {
        this.tentativa = tentativa;
    }


    public String getResultado() {
        return resultado;
    }

    public void setResultado(String resultado) {
        this.resultado = resultado;
    }


    public Long getTempoMs() {
        return tempoMs;
    }

    public void setTempoMs(Long tempoMs) {
        this.tempoMs = tempoMs;
    }


    public String getTipoUsuario() {
        return tipoUsuario;
    }

    public void setTipoUsuario(String tipoUsuario) {
        this.tipoUsuario = tipoUsuario;
    }


    public String getSessaoId() {
        return sessaoId;
    }

    public void setSessaoId(String sessaoId) {
        this.sessaoId = sessaoId;
    }
}