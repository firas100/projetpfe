package com.example.projetpfe.Services;

import com.example.projetpfe.Repository.NotificationRepo;
import com.example.projetpfe.entity.Notification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {
    @Autowired
    private NotificationRepo notificationRepository;

    public Notification save(Notification notification) {
        return notificationRepository.save(notification);
    }

    public List<Notification> getNotificationsByManager(String managerId) {
        return notificationRepository.findByManagerId(managerId);
    }

    public void markAsRead(String managerId) {
        List<Notification> notifications = notificationRepository.findByManagerIdAndIsReadFalse(managerId);
        notifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notifications);
    }
}
