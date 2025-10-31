
import React, { useState } from 'react';
import { VideoIdea } from '../types';
import { CheckIcon } from './icons/CheckIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { BackIcon } from './icons/BackIcon';

interface IdeaModalProps {
    ideas: VideoIdea[];
    onConfirm: (idea: VideoIdea) => void;
    onNew: () => void;
    onBack: () => void;
}

const IdeaModal: React.FC<IdeaModalProps> = ({ ideas, onConfirm, onNew, onBack }) => {
    const [selectedIdeaIndex, setSelectedIdeaIndex] = useState<number>(0);

    const handleConfirm = () => {
        if (selectedIdeaIndex !== null) {
            onConfirm(ideas[selectedIdeaIndex]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-3xl bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8 transform transition-all duration-300 ease-out scale-95 animate-in fade-in-0 zoom-in-95">
                <h2 className="text-3xl font-bold text-center mb-2 text-indigo-300">Concepts Generated</h2>
                <p className="text-center text-gray-400 mb-8">Orbit Fast has produced these unique ideas. Please select one to proceed.</p>

                <div className="space-y-4 mb-8">
                    {ideas.map((idea, index) => (
                        <div
                            key={index}
                            onClick={() => setSelectedIdeaIndex(index)}
                            className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                                selectedIdeaIndex === index
                                    ? 'bg-indigo-900/50 border-indigo-500 ring-2 ring-indigo-500'
                                    : 'bg-gray-900/50 border-gray-700 hover:border-indigo-600'
                            }`}
                        >
                            <h3 className="font-bold text-lg text-white">{idea.title}</h3>
                            <p className="text-gray-400 mt-1">{idea.description}</p>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <button onClick={onBack} className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-gray-600 text-gray-300 font-semibold rounded-md hover:bg-gray-700 transition-colors">
                        <BackIcon className="h-5 w-5 mr-2" />
                        Back
                    </button>
                    <button onClick={onNew} className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-500 transition-colors">
                        <RefreshIcon className="h-5 w-5 mr-2" />
                        New Ideas
                    </button>
                    <button onClick={handleConfirm} disabled={selectedIdeaIndex === null} className="w-full sm:w-auto flex items-center justify-center px-10 py-3 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
                         <CheckIcon className="h-5 w-5 mr-2" />
                        Confirm Idea
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IdeaModal;
