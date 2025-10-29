package com.example.projetpfe.Services;


import jakarta.ws.rs.core.Response;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.RoleScopeResource;
import org.keycloak.admin.client.resource.RolesResource;
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
    private String adminRealm;

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
                    .realm(adminRealm)
                    .clientId(adminClientId)
                    .username(adminUsername)
                    .password(adminPassword)
                    .build();
            RealmResource realmResource = keycloakAdmin.realm(realm);
            UsersResource usersResource = realmResource.users();

            CredentialRepresentation credential = new CredentialRepresentation();
            credential.setType(CredentialRepresentation.PASSWORD);
            credential.setValue(password);
            credential.setTemporary(false);

            UserRepresentation user = new UserRepresentation();
            user.setUsername(username);
            user.setEmail(email);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setCredentials(Collections.singletonList(credential));
            user.setEnabled(true);

            Response response = usersResource.create(user);
            if (response.getStatus() != Response.Status.CREATED.getStatusCode()) {
                String errorResponse = response.readEntity(String.class);
                return "Error creating user: HTTP " + response.getStatus() + " - " + errorResponse;
            }

            String userId = response.getLocation().getPath()
                    .replaceAll(".*/([^/]+)$", "$1");

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

            RoleRepresentation managerRole = realmResource.roles().get("MANAGER").toRepresentation();

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
    public String createManagerUser(String username, String email, String firstName, String lastName, String password) {
        String userId = createBaseUser(username, email, firstName, lastName, password);
        if (userId == null) {
            return "Failed to create manager user: Check logs for details";
        }

        try {
            Keycloak keycloakAdmin = KeycloakBuilder.builder()
                    .serverUrl(serverUrl)
                    .realm(adminRealm)
                    .clientId(adminClientId)
                    .username(adminUsername)
                    .password(adminPassword)
                    .build();
            RealmResource realmResource = keycloakAdmin.realm(realm);
            UsersResource usersResource = realmResource.users();

            // Assigner le rôle "MANAGER"
            RoleRepresentation managerRole = realmResource.roles().get("MANAGER").toRepresentation();
            usersResource.get(userId).roles().realmLevel().add(Arrays.asList(managerRole));

            return "Manager user created successfully with ID: " + userId + " and role 'MANAGER'";
        } catch (Exception e) {
            // Optionnel : Supprimer l'utilisateur en cas d'erreur
            // realmResource.users().get(userId).remove();
            return "Failed to assign MANAGER role: " + e.getMessage();
        }
    }
    private String createBaseUser(String username, String email, String firstName, String lastName, String password) {
        try {
            Keycloak keycloakAdmin = KeycloakBuilder.builder()
                    .serverUrl(serverUrl)
                    .realm(adminRealm)
                    .clientId(adminClientId)
                    .username(adminUsername)
                    .password(adminPassword)
                    .build();
            RealmResource realmResource = keycloakAdmin.realm(realm);
            UsersResource usersResource = realmResource.users();

            CredentialRepresentation credential = new CredentialRepresentation();
            credential.setType(CredentialRepresentation.PASSWORD);
            credential.setValue(password);
            credential.setTemporary(false);

            UserRepresentation user = new UserRepresentation();
            user.setUsername(username);
            user.setEmail(email);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setCredentials(Collections.singletonList(credential));
            user.setEnabled(true);

            Response response = usersResource.create(user);
            if (response.getStatus() != Response.Status.CREATED.getStatusCode()) {
                String errorResponse = response.readEntity(String.class);
                return null;  // Erreur : retourne null
            }

            // Extraction de l'ID depuis l'URL de la réponse
            String location = response.getLocation().toString();
            String userId = location.substring(location.lastIndexOf("/") + 1);
            return userId;
        } catch (Exception e) {
            return null;  // Erreur : retourne null
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

    public String sendResetPasswordEmail(String email) {
        try {
            // Connexion admin à Keycloak
            Keycloak keycloakAdmin = KeycloakBuilder.builder()
                    .serverUrl(serverUrl)
                    .realm(adminRealm)
                    .clientId(adminClientId)
                    .username(adminUsername)
                    .password(adminPassword)
                    .build();

            RealmResource realmResource = keycloakAdmin.realm(realm);

            // Récupère tous les utilisateurs et cherche par email (insensible à la casse)
            List<UserRepresentation> allUsers = realmResource.users().list();
            UserRepresentation user = allUsers.stream()
                    .filter(u -> email.equalsIgnoreCase(u.getEmail()))
                    .findFirst()
                    .orElse(null);

            if (user == null) {
                return "Aucun utilisateur trouvé avec cet email.";
            }

            String userId = user.getId();

            // Envoi de l'email de réinitialisation
            realmResource.users()
                    .get(userId)
                    .executeActionsEmail(List.of("UPDATE_PASSWORD"));

            return "Email de réinitialisation envoyé à : " + email;

        } catch (Exception e) {
            e.printStackTrace();
            return "Erreur lors de l'envoi de l'email : " + e.getMessage();
        }
    }



}