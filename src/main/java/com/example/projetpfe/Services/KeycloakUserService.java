package com.example.projetpfe.Services;


import jakarta.ws.rs.core.Response;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.ws.rs.core.Response;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
public class KeycloakUserService {
    @Value("${keycloak.auth-server-url}")
    private String serverUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.admin-realm}")
    private String adminRealm; // Nouveau: pour le realm admin (généralement "master")

    @Value("${keycloak.admin-client-id}")
    private String adminClientId;

    @Value("${keycloak.admin-username}")
    private String adminUsername;

    @Value("${keycloak.admin-password}")
    private String adminPassword;

    public String createUser(String username, String email, String firstName, String lastName, String password) {
        try {
            // 1. Configuration du client admin Keycloak
            Keycloak keycloakAdmin = KeycloakBuilder.builder()
                    .serverUrl(serverUrl)
                    .realm(adminRealm) // Utiliser le realm admin (master)
                    .clientId(adminClientId)
                    .username(adminUsername)
                    .password(adminPassword)
                    .build();
            RealmResource realmResource = keycloakAdmin.realm(realm);
            UsersResource usersResource = realmResource.users();

            // 2. Préparation des credentials du nouvel utilisateur
            CredentialRepresentation credential = new CredentialRepresentation();
            credential.setType(CredentialRepresentation.PASSWORD);
            credential.setValue(password);
            credential.setTemporary(false);

            // 3. Configuration du nouvel utilisateur
            UserRepresentation user = new UserRepresentation();
            user.setUsername(username);
            user.setEmail(email);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setCredentials(Collections.singletonList(credential));
            user.setEnabled(true);

            // 4. Création de l'utilisateur dans le realm cible (pfe-realm)
            Response response = usersResource.create(user);
            if (response.getStatus() != Response.Status.CREATED.getStatusCode()) {
                String errorResponse = response.readEntity(String.class);
                return "Error creating user: HTTP " + response.getStatus() + " - " + errorResponse;
            }

            // 6. Extract user ID
            String userId = response.getLocation().getPath()
                    .replaceAll(".*/([^/]+)$", "$1");

            // 7. Assign 'candidat' role
            RoleRepresentation candidatRole = realmResource.roles().get("CANDIDAT").toRepresentation();
            usersResource.get(userId).roles().realmLevel().add(Arrays.asList(candidatRole));

            return "User created successfully with ID: " + userId + " and role 'candidat'";
        } catch (Exception e) {
            return "Failed to create user: " + e.getMessage();
        }
    }

    public List<UserRepresentation> getManagers() {
        try {
            // Initialiser le client Keycloak admin
            Keycloak keycloakAdmin = KeycloakBuilder.builder()
                    .serverUrl(serverUrl)
                    .realm(adminRealm) // master
                    .clientId(adminClientId)
                    .username(adminUsername)
                    .password(adminPassword)
                    .build();

            RealmResource realmResource = keycloakAdmin.realm(realm);
            List<UserRepresentation> allUsers = realmResource.users().list();

            // Récupérer le rôle MANAGER
            RoleRepresentation managerRole = realmResource.roles().get("MANAGER").toRepresentation();

            // Filtrer les utilisateurs qui ont le rôle MANAGER
            List<UserRepresentation> managers = allUsers.stream().filter(user -> {
                List<RoleRepresentation> roles = realmResource.users().get(user.getId()).roles().realmLevel().listAll();
                return roles.stream().anyMatch(r -> r.getName().equals("MANAGER"));
            }).toList();

            return managers;

        } catch (Exception e) {
            e.printStackTrace();
            return Collections.emptyList();
        }
    }

    public UserRepresentation getUserById(String userId) {
        try {
            Keycloak keycloakAdmin = KeycloakBuilder.builder()
                    .serverUrl(serverUrl)
                    .realm(adminRealm) // généralement "master"
                    .clientId(adminClientId)
                    .username(adminUsername)
                    .password(adminPassword)
                    .build();

            RealmResource realmResource = keycloakAdmin.realm(realm);

            return realmResource.users().get(userId).toRepresentation();

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Impossible de récupérer l'utilisateur avec ID : " + userId, e);
        }
    }



}