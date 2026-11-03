package com.gestionobra.comun;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/** Envío de correos por SMTP (Mailpit en local, Brevo en producción). */
@Service
public class CorreoService {

    private static final Logger log = LoggerFactory.getLogger(CorreoService.class);

    private final JavaMailSender enviador;
    private final String remitente;

    public CorreoService(JavaMailSender enviador, @Value("${app.mail.from}") String remitente) {
        this.enviador = enviador;
        this.remitente = remitente;
    }

    public void enviar(String destinatario, String asunto, String texto) {
        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setFrom(remitente);
        mensaje.setTo(destinatario);
        mensaje.setSubject(asunto);
        mensaje.setText(texto);
        try {
            enviador.send(mensaje);
        } catch (MailException e) {
            log.error("No se pudo enviar el correo a {}", destinatario, e);
            throw new ErrorNegocio(HttpStatus.BAD_GATEWAY,
                "No se pudo enviar el correo. Revisá la dirección e intentá de nuevo.");
        }
    }
}
