package com.example.projetpfe.Services;

import com.example.projetpfe.Repository.QuestionPreinterviewRepo;
import com.example.projetpfe.entity.Questionpreinterview;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class QuestionPreinterviewService {
    @Autowired
    private QuestionPreinterviewRepo questionPreinterviewRepo;

    public Questionpreinterview addQuestion(Questionpreinterview questionpreinterview) {
        if (questionpreinterview.getQuestion() == null || questionpreinterview.getQuestion().trim().isEmpty()) {
            throw new IllegalArgumentException("Question cannot be empty");
        }
        return questionPreinterviewRepo.save(questionpreinterview);
    }

    public List<Questionpreinterview> findQuestion() {
        return questionPreinterviewRepo.findAll();
    }
}
