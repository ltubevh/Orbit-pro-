
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

// Fix: Define AIStudio interface to resolve conflicting global declarations.
export interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
}

// Type for window.aistudio
declare global {
    interface Window {
        aistudio?: AIStudio;
        webkitAudioContext: typeof AudioContext;
    }
}
