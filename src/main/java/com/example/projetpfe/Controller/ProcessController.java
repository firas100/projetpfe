package com.example.projetpfe.Controller;

import com.example.projetpfe.Camunda.EmailWorker;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import io.camunda.zeebe.client.ZeebeClient;

@RestController
@RequestMapping("/api/process")
public class ProcessController {
    @Autowired
    private EmailWorker emailWorker;

    @Autowired
    private ZeebeClient zeebeClient;

    @GetMapping("/start")
    public String triggerProcess() {
        // Démarrer une instance de processus BPMN
        zeebeClient.newCreateInstanceCommand()
                .bpmnProcessId("sendEmailProcess") // ID du processus défini dans le fichier BPMN
                .latestVersion()
                .send()
                .join();

        return "Process to send email to top candidate has been triggered.";
    }
}
