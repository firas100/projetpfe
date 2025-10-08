package com.example.projetpfe.Controller;

import com.example.projetpfe.Services.NotificationService;
import com.example.projetpfe.entity.Notification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/Entretient/notifications")
public class NotificationController {
    @Autowired
    private NotificationService notificationService;

    @GetMapping("/manager/{managerId}")
    public List<Notification> getNotifications(@PathVariable String managerId) {
        return notificationService.getNotificationsByManager(managerId);
    }

    @PostMapping("/mark-read")
    public ResponseEntity<Void> markAsRead(@RequestBody MarkReadDTO dto) { // DTO with managerId
        notificationService.markAsRead(dto.getManagerId());
        return ResponseEntity.ok().build();
    }
}

// Simple DTO
class MarkReadDTO {
    private String managerId;
    // Getter/setter
    public String getManagerId() { return managerId; }
    public void setManagerId(String managerId) { this.managerId = managerId; }
}




