import { MOCK_QUESTIONS, Pool, type Question } from '@nexus/shared';

/** Source of questions. The Gemini-backed provider replaces the mock later. */
export interface ContentProvider {
  loadQuestions(): Promise<Question[]>;
}

export const mockContent: ContentProvider = {
  async loadQuestions() {
    return MOCK_QUESTIONS;
  },
};

export const pool = new Pool(MOCK_QUESTIONS);
