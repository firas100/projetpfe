package com.example.projetpfe;


import com.example.projetpfe.Camunda.EmailWorker;
import io.camunda.zeebe.client.ZeebeClient;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling

public class ProjetpfeApplication {
	@Autowired
	private ZeebeClient zeebeClient;

	public static void main(String[] args) {

		SpringApplication.run(ProjetpfeApplication.class, args);
	}

	@PostConstruct
	public void deployProcess() {
		zeebeClient.newDeployCommand()
				.addResourceFromClasspath("getCandidat.bpmn")
				.send()
				.join();
		System.out.println("Process 'sendEmailProcess' deployed successfully.");
	}
}
