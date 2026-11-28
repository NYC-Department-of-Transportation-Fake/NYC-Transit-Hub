
package com.nyctransithub.backend.auth;

import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.FirebaseAuthException;

import org.springframework.stereotype.Service;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
@ConditionalOnProperty(
    name = "firebase.enabled",
    havingValue = "true"
)
public class FirebaseAuthService {

    private final FirebaseAuth firebaseAuth;

    public FirebaseAuthService(FirebaseApp firebaseApp) {
        this.firebaseAuth = FirebaseAuth.getInstance(firebaseApp);
    }

    public FirebaseToken verifyToken(String authorizationHeader) {

        if (authorizationHeader == null
                || !authorizationHeader.startsWith("Bearer ")) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Missing Firebase ID token"
            );
        }

        String idToken = authorizationHeader.substring(7).trim();

        if (idToken.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Empty Firebase ID token"
            );
        }

        try {
            return firebaseAuth.verifyIdToken(idToken, true);

        } catch (FirebaseAuthException e) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid, expired or revoked Firebase ID token"
            );
        }
    }

    public String getUid(String authorizationHeader) {
        return verifyToken(authorizationHeader).getUid();
    }
}
