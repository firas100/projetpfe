package com.example.projetpfe.Controller;

import com.example.projetpfe.Camunda.EmailWorker;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import io.camunda.zeebe.client.ZeebeClient;

import java.util.Map;

@RestController
@RequestMapping("/api/process")
public class ProcessController {
    @Autowired
    private EmailWorker emailWorker;

    @Autowired
    private ZeebeClient zeebeClient;

    @GetMapping("/start/{idOffre}")
    public ResponseEntity<Map<String, Object>> triggerProcess(@PathVariable Integer idOffre) {
        zeebeClient.newCreateInstanceCommand()
                .bpmnProcessId("sendEmailProcess")
                .latestVersion()
                .variables(Map.of("idOffre", idOffre))
                .send()
                .join();

        return ResponseEntity.ok(Map.of(
                "message", "Process to send email to top candidate has been triggered.",
                "idOffre", idOffre
        ));
    }

}
