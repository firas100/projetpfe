package com.example.projetpfe.Controller;

import com.example.projetpfe.Services.QuestionPreinterviewService;
import com.example.projetpfe.entity.Questionpreinterview;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/Question")
@AllArgsConstructor
@NoArgsConstructor
public class QuestionpreinterviewController {
    @Autowired
    QuestionPreinterviewService questionPreinterviewService;

    @PostMapping("/addQuestion")
    public List<Questionpreinterview> addMultipleQuestions(@RequestBody List<Questionpreinterview> questions){
        return questions.stream()
                .map(q -> questionPreinterviewService.addQuestion(q))
                .toList();
    }

    @GetMapping("/getAllQuestion")

    public List <Questionpreinterview> getQuestion(){
        return questionPreinterviewService.findQuestion();
    }
}
