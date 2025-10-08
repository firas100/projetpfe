package com.example.projetpfe.Repository;

import com.example.projetpfe.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepo extends JpaRepository<Notification,Integer> {
    List<Notification> findByManagerIdAndIsReadFalse(String managerId);
    List<Notification> findByManagerId(String managerId); // Toutes pour un manager
}
