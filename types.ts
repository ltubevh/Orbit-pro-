export enum VideoType {
    QUIZ = "Quiz",
    TEACHING = "Teaching",
}

export interface UserInput {
    topic: string;
    screenSize: string;
    videoType: VideoType;
    geminiTtsDescription: string;
    toneJsDescription: string;
}

export interface VideoIdea {
    title: string;
    description: string;
}

export interface FinalAssets {
    title: string;
    description: string;
    sources: { title: string; uri: string }[];
    videoUrl?: string;
    audioUrl?: string;
    thumbnailUrls: string[];
    sourceCodeUrl: string;
}

export enum AppState {
    FORM,
    GENERATING_IDEAS,
    IDEAS_READY,
    PROCESSING_PIPELINE,
    RESULTS_READY,
}

export interface OrbitModel {
    name: string;
    description: string;
}

export type Status = 'pending' | 'active' | 'complete';

export interface PipelineStatus extends OrbitModel {
    status: Status;
}

export interface Question {
    questionText: string;
    options: { key: string; text: string }[];
    correctAnswerKey: string;
    explanation: string;
    wrongAnswerExplanations: string;
    visualSuggestion: string;
    difficulty: 'easy' | 'medium' | 'hard';
}

export interface ScoreTier {
    score: string;
    level: string;
    message: string;
    visualEffect: string;
}

export interface Storyboard {
    preparation: string;
    questions: Question[];
    results: ScoreTier[];
    challenge: {
        question: string;
        callToAction: string;
    };
    callToAction: string;
}

// Type for window.aistudio
declare global {
    // Fix: Define AIStudio interface inside global scope to resolve conflicting declarations.
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }

    interface Window {
        aistudio?: AIStudio;
        webkitAudioContext: typeof AudioContext;
    }
}
