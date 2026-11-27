package com.nyctransithub.backend.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.Pbkdf2PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    public record SessionStatus(boolean signedIn) {}
    public record LoginRequest(String email, String password) {}

    private final Pbkdf2PasswordEncoder encoder =
            Pbkdf2PasswordEncoder.defaultsForSpringSecurity_v5_8();
    private final String testEmail;
    private final String passwordHash;

    public AuthController(
            @Value("${TRANSIT_TEST_EMAIL:}") String email,
            @Value("${TRANSIT_TEST_PASSWORD:}") String password) {
        testEmail = email.trim();
        passwordHash = password.isEmpty() ? null : encoder.encode(password);
    }

    @GetMapping("/session")
    public SessionStatus getSessionStatus(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        boolean signedIn = session != null && session.getAttribute("userEmail") != null;
        return new SessionStatus(signedIn);
    }

    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<SessionStatus> login(
            @RequestBody LoginRequest login, HttpServletRequest request) {
        if (passwordHash == null || testEmail.isEmpty()
                || login.email() == null || login.password() == null
                || !testEmail.equalsIgnoreCase(login.email().trim())
                || !encoder.matches(login.password(), passwordHash)) {
            return ResponseEntity.status(401).body(new SessionStatus(false));
        }

        HttpSession session = request.getSession();
        request.changeSessionId();
        session.setAttribute("userEmail", testEmail);
        return ResponseEntity.ok(new SessionStatus(true));
    }
        @PostMapping(value = "/logout", consumes = MediaType.APPLICATION_JSON_VALUE)
    public SessionStatus logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return new SessionStatus(false);
    }
}