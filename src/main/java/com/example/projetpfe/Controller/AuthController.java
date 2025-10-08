package com.example.projetpfe.Controller;

import com.example.projetpfe.Services.KeycloakUserService;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private KeycloakUserService keycloakUserService;
    @CrossOrigin(origins = "http://localhost:4200")
    @PostMapping("/signup")
    public ResponseEntity<String> signUp(
            @RequestParam String username,
            @RequestParam String email,
            @RequestParam String firstName,
            @RequestParam String lastName,
            @RequestParam String password) {

        String result = keycloakUserService.createUser(username, email, firstName, lastName, password);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/login")
    @CrossOrigin(origins = "http://localhost:4200")
    public ResponseEntity<String> login() {
        return ResponseEntity.ok("Please use Keycloak login endpoint at: http://localhost:9090/realms/pfe-realm/protocol/openid-connect/token");
    }

    @GetMapping("/user-info")
    public ResponseEntity<String> getUserInfo() {
        // Cet endpoint nécessite un token JWT valide
        return ResponseEntity.ok("User information");
    }

    @GetMapping("/getUsers")
    public List<UserRepresentation> getuser(){
        return keycloakUserService.getManagers();
    }
}