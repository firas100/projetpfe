package com.example.projetpfe.Camunda;

import com.example.projetpfe.Services.CvService;
import io.camunda.zeebe.client.ZeebeClient;
import io.camunda.zeebe.client.api.response.ProcessInstanceEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;


import io.camunda.zeebe.spring.client.annotation.JobWorker;
import io.camunda.zeebe.client.api.response.ActivatedJob;
@Component
public class CvWorker {
    @Autowired
    private CvService cvService;
    private final ZeebeClient zeebeClient;

    public CvWorker(ZeebeClient zeebeClient) {
        this.zeebeClient = zeebeClient;
    }


    @Scheduled(fixedRate = 60000) // 300000 ms = 5 min
    public void startCvProcess() {
        zeebeClient.newCreateInstanceCommand()
                .bpmnProcessId("cv_process")
                .latestVersion()
                .send()
                .join();
        System.out.println("Processus cv_process lancé automatiquement !");
    }
}
