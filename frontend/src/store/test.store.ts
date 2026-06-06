"use client";

import { create } from "zustand";

interface TestState {
  currentQuestion: number;

  answers: Record<string, string | string[] | number | null>;

  markedForReview: string[];

  setCurrentQuestion: (index: number) => void;

  saveAnswer: (questionId: string, answer: any) => void;

  toggleReview: (questionId: string) => void;

  resetTest: () => void;
}

export const useTestStore = create<TestState>((set) => ({
  currentQuestion: 0,

  answers: {},

  markedForReview: [],

  setCurrentQuestion: (currentQuestion) =>
    set({
      currentQuestion,
    }),

  saveAnswer: (questionId, answer) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: answer,
      },
    })),

  toggleReview: (questionId) =>
    set((state) => {
      const exists = state.markedForReview.includes(questionId);

      return {
        markedForReview: exists
          ? state.markedForReview.filter((id) => id !== questionId)
          : [...state.markedForReview, questionId],
      };
    }),

  resetTest: () =>
    set({
      currentQuestion: 0,
      answers: {},
      markedForReview: [],
    }),
}));
