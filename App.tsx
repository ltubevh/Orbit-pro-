
import React, { useState, useCallback, useEffect } from 'react';
import { AppState, UserInput, VideoIdea, FinalAssets, OrbitModel, PipelineStatus, VideoType } from './types';
import InputForm from './components/InputForm';
import IdeaModal from './components/IdeaModal';
import PipelineTracker from './components/PipelineTracker';
import ResultsDisplay from './components/ResultsDisplay';
import { LogoIcon } from './components/icons/LogoIcon';
import ChatBot from './components/ChatBot';
import LiveConversation from './components/LiveConversation';
import * as geminiService from './services/geminiService';

const ORBIT_MODELS: OrbitModel[] = [
    { name: 'Orbit Fast', description: 'Generating unique video concepts...' },
    { name: 'Orbit Rules', description: 'Architecting video structure and ensuring compliance...' },
    { name: 'Orbit Surprise', description: 'Injecting creative and engaging elements...' },
    { name: 'Orbit Workflow', description: 'Creating a second-by-second production script...' },
    { name: 'Orbit Write', description: 'Authoring detailed, human-like script and quiz content...' },
    { name: 'Orbit Audio', description: 'Generating high-fidelity voiceover...' },
    { name: 'Orbit Prompt', description: 'Compiling all data into a master prompt...' },
    { name: 'Orbit Web', description: 'Constructing the final video asset...' },
    { name: 'Orbit About', description: 'Writing SEO-friendly title and description...' },
    { name: 'Orbit Image', description: 'Designing high-impact, clickable thumbnails...' },
    { name: 'Orbit History', description: 'Archiving all project data...' },
];

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>(AppState.FORM);
    const [userInput, setUserInput] = useState<UserInput | null>(null);
    const [generatedIdeas, setGeneratedIdeas] = useState<VideoIdea[]>([]);
    const [selectedIdea, setSelectedIdea] = useState<VideoIdea | null>(null);
    const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus[]>([]);
    const [finalAssets, setFinalAssets] = useState<FinalAssets | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isApiKeySelected, setIsApiKeySelected] = useState(false);

    useEffect(() => {
        const checkKey = async () => {
            if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
                setIsApiKeySelected(true);
            }
        };
        checkKey();
    }, []);

    const handleApiKeySelect = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            setIsApiKeySelected(true);
        }
    };
    
    const resetState = useCallback(() => {
        setAppState(AppState.FORM);
        setUserInput(null);
        setGeneratedIdeas([]);
        setSelectedIdea(null);
        setPipelineStatus([]);
        setFinalAssets(null);
        setError(null);
    }, []);

    const handleFormSubmit = useCallback(async (data: UserInput) => {
        setUserInput(data);
        setAppState(AppState.GENERATING_IDEAS);
        setError(null);
        try {
            const ideas = await geminiService.generateVideoIdeas(data);
            setGeneratedIdeas(ideas);
            setAppState(AppState.IDEAS_READY);
        } catch (err) {
            console.error(err);
            setError('Failed to generate ideas. Please try again.');
            setAppState(AppState.FORM);
        }
    }, []);

    const handleIdeaConfirm = useCallback(async (idea: VideoIdea) => {
        if (!userInput) return;
        
        const videoType = userInput.videoType;

        if (videoType === VideoType.QUIZ || videoType === VideoType.TEACHING) {
             if (!isApiKeySelected && window.aistudio) {
                alert('Please select an API key to generate videos. Billing information is available at ai.google.dev/gemini-api/docs/billing');
                await handleApiKeySelect();
                // We assume success after this point to avoid race conditions.
            }
        }
       
        setSelectedIdea(idea);
        setAppState(AppState.PROCESSING_PIPELINE);
        
        const initialStatus = ORBIT_MODELS.map(model => ({ ...model, status: 'pending' as const }));
        setPipelineStatus(initialStatus);

        const runPipeline = async () => {
            let currentAssets: Partial<FinalAssets> = { title: idea.title, description: "Generating..." };
            
            for (let i = 0; i < ORBIT_MODELS.length; i++) {
                setPipelineStatus(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'active' } : s));
                await new Promise(res => setTimeout(res, 1500));

                try {
                    switch (ORBIT_MODELS[i].name) {
                        case 'Orbit Write':
                            // Simulating script generation using thinking mode
                            await geminiService.generateScript(idea.title);
                            break;
                        case 'Orbit Audio':
                             const audioData = await geminiService.generateSpeech(idea.title);
                             currentAssets = { ...currentAssets, audioUrl: audioData };
                             break;
                        case 'Orbit Web':
                            if (videoType === VideoType.QUIZ || videoType === VideoType.TEACHING) {
                                try {
                                    const videoUrl = await geminiService.generateVideo(idea.title, userInput.screenSize);
                                    currentAssets = { ...currentAssets, videoUrl };
                                } catch (e: any) {
                                     if (e.message.includes('Requested entity was not found')) {
                                        alert('API Key validation failed. Please select your API key again.');
                                        setIsApiKeySelected(false);
                                        resetState();
                                        return;
                                    }
                                    throw e;
                                }
                            }
                            break;
                        case 'Orbit About':
                            const { description, sources } = await geminiService.generateTitleDescription(idea.title);
                            currentAssets = { ...currentAssets, description, sources };
                            break;
                        case 'Orbit Image':
                            const imageUrls = await geminiService.generateThumbnails(idea.title);
                            currentAssets = { ...currentAssets, thumbnailUrls: imageUrls };
                            break;
                    }
                } catch (pipelineError) {
                    console.error(`Error in ${ORBIT_MODELS[i].name}:`, pipelineError);
                    setError(`An error occurred during the ${ORBIT_MODELS[i].name} phase. Please try again.`);
                    setAppState(AppState.FORM);
                    return;
                }

                setPipelineStatus(prev => prev.map((s, idx) => idx <= i ? { ...s, status: 'complete' } : s));
            }

            setFinalAssets(currentAssets as FinalAssets);
            setAppState(AppState.RESULTS_READY);
        };

        runPipeline();

    }, [userInput, isApiKeySelected, resetState]);

    const handleNewIdeas = useCallback(() => {
        if(userInput) {
            handleFormSubmit(userInput);
        }
    }, [userInput, handleFormSubmit]);

    const handleBackToForm = useCallback(() => {
        setGeneratedIdeas([]);
        setAppState(AppState.FORM);
    }, []);

    const renderContent = () => {
        switch (appState) {
            case AppState.FORM:
            case AppState.GENERATING_IDEAS:
                return <InputForm onSubmit={handleFormSubmit} isLoading={appState === AppState.GENERATING_IDEAS} error={error} />;
            case AppState.IDEAS_READY:
                return <IdeaModal ideas={generatedIdeas} onConfirm={handleIdeaConfirm} onNew={handleNewIdeas} onBack={handleBackToForm} />;
            case AppState.PROCESSING_PIPELINE:
                return <PipelineTracker status={pipelineStatus} />;
            case AppState.RESULTS_READY:
                return finalAssets ? <ResultsDisplay assets={finalAssets} onReset={resetState} /> : <div>Loading results...</div>;
            default:
                return <div>Something went wrong.</div>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4 font-sans relative">
            <header className="w-full max-w-6xl mx-auto flex justify-between items-center p-4">
                 <div className="flex items-center space-x-3">
                    <LogoIcon className="h-12 w-12 text-indigo-400" />
                    <h1 className="text-3xl font-bold tracking-tighter text-white">Project Orbit</h1>
                </div>
                <div className="flex items-center space-x-4">
                    <LiveConversation />
                </div>
            </header>
            
            <main className="flex-grow w-full max-w-6xl mx-auto flex items-center justify-center">
                {renderContent()}
            </main>
            
            <footer className="w-full max-w-6xl mx-auto text-center p-4 text-gray-500 text-sm">
                <p>AI-Powered Video Generation Ecosystem for YouTube Channel "Pro"</p>
                <p>Please select an API key for video generation. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-400">Billing Info</a></p>
                {!isApiKeySelected && (
                     <button onClick={handleApiKeySelect} className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white transition-colors">
                        Select API Key
                    </button>
                )}
            </footer>
            
            <ChatBot />
        </div>
    );
};

export default App;
