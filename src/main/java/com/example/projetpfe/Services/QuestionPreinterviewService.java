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

    public Questionpreinterview updateQuestion(Integer id, Questionpreinterview updatedQuestion) {
        Questionpreinterview existing = questionPreinterviewRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        if (updatedQuestion.getQuestion() == null || updatedQuestion.getQuestion().trim().isEmpty()) {
            throw new IllegalArgumentException("Question cannot be empty");
        }

        existing.setQuestion(updatedQuestion.getQuestion());
        return questionPreinterviewRepo.save(existing);
    }

    public void deleteQuestion(Integer id) {
        if (!questionPreinterviewRepo.existsById(id)) {
            throw new RuntimeException("Question not found");
        }
        questionPreinterviewRepo.deleteById(id);
    }
}
