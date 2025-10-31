
import React, { useState } from 'react';
import { UserInput, VideoType } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';

interface InputFormProps {
    onSubmit: (data: UserInput) => void;
    isLoading: boolean;
    error: string | null;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading, error }) => {
    const [topic, setTopic] = useState('');
    const [screenSize, setScreenSize] = useState('16:9 Landscape');
    const [videoType, setVideoType] = useState<VideoType>(VideoType.QUIZ);
    const [geminiTtsDescription, setGeminiTtsDescription] = useState('Clear, engaging, international English accent');
    const [toneJsDescription, setToneJsDescription] = useState('Subtle, professional sound effects for timers and answers');
    const [topicError, setTopicError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) {
            setTopicError('Topic is a required field.');
            return;
        }
        setTopicError('');
        onSubmit({
            topic,
            screenSize,
            videoType,
            geminiTtsDescription,
            toneJsDescription,
        });
    };

    return (
        <div className="w-full max-w-2xl bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-700 pulse-glow">
            <h2 className="text-3xl font-bold text-center mb-2 text-indigo-300">Initiate Video Creation</h2>
            <p className="text-center text-gray-400 mb-8">Provide the core concept for your next video.</p>
            
            {error && <div className="bg-red-900/50 text-red-300 border border-red-700 p-3 rounded-md mb-6">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="topic" className="block text-sm font-medium text-gray-300 mb-2">Topic <span className="text-red-400">*</span></label>
                    <input
                        id="topic"
                        type="text"
                        value={topic}
                        onChange={(e) => {
                            setTopic(e.target.value);
                            if(topicError) setTopicError('');
                        }}
                        className="w-full bg-gray-900/70 border border-gray-600 rounded-md p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="e.g., 'The History of Ancient Rome'"
                    />
                    {topicError && <p className="text-red-400 text-xs mt-1">{topicError}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="screenSize" className="block text-sm font-medium text-gray-300 mb-2">Screen Size</label>
                        <input
                            id="screenSize"
                            type="text"
                            value={screenSize}
                            onChange={(e) => setScreenSize(e.target.value)}
                             className="w-full bg-gray-900/70 border border-gray-600 rounded-md p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        />
                    </div>
                    <div>
                        <label htmlFor="videoType" className="block text-sm font-medium text-gray-300 mb-2">Video Type</label>
                        <select
                            id="videoType"
                            value={videoType}
                            onChange={(e) => setVideoType(e.target.value as VideoType)}
                             className="w-full bg-gray-900/70 border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        >
                            <option value={VideoType.QUIZ}>Question Quiz</option>
                            <option value={VideoType.TEACHING}>Teaching Video</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="geminiTts" className="block text-sm font-medium text-gray-300 mb-2">Gemini TTS Voice Description</label>
                    <textarea
                        id="geminiTts"
                        rows={2}
                        value={geminiTtsDescription}
                        onChange={(e) => setGeminiTtsDescription(e.target.value)}
                         className="w-full bg-gray-900/70 border border-gray-600 rounded-md p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="Describe the desired voice style..."
                    />
                </div>

                <div>
                    <label htmlFor="toneJs" className="block text-sm font-medium text-gray-300 mb-2">Tone.js Sound Description</label>
                    <textarea
                        id="toneJs"
                        rows={2}
                        value={toneJsDescription}
                        onChange={(e) => setToneJsDescription(e.target.value)}
                         className="w-full bg-gray-900/70 border border-gray-600 rounded-md p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="Describe the desired sound effects..."
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-all duration-300 ease-in-out disabled:bg-gray-500 disabled:cursor-not-allowed group"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating Ideas...
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="h-5 w-5 mr-2 text-indigo-300 group-hover:scale-110 transition-transform" />
                            Engage Orbit Fast
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default InputForm;
