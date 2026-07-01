import { Consent, QuestionnaireResponse, ResearchSubject } from '@d4l/collect-lib';
import { IterationInfo } from '../iterationCalculator';
import { AppArrayAnswerItem, AppScalarAnswerItem } from '../questionnaireTypes';

export type ResourceConsent = Consent & {
  id: string;
  type: 'Consent';
  accepted: boolean;
  date: string;
};
export type ResourceResearchSubject = ResearchSubject & { id: string; type: 'ResearchSubject' };

// Filter only our supported types
export type AppAnswerItem = AppArrayAnswerItem | AppScalarAnswerItem;
export type ResourceQuestionnaire = Omit<QuestionnaireResponse, 'answers'> & {
  answers: AppAnswerItem[];
  id: string;
  type: 'Questionnaire';
  iteration: IterationInfo;
};

export type Resource = ResourceConsent | ResourceResearchSubject | ResourceQuestionnaire;
