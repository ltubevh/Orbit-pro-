
import React from 'react';
import { PipelineStatus, Status } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { DotIcon } from './icons/DotIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface PipelineTrackerProps {
    status: PipelineStatus[];
}

const getStatusIcon = (status: Status) => {
    switch (status) {
        case 'pending':
            return <DotIcon className="h-6 w-6 text-gray-600" />;
        case 'active':
            return <SpinnerIcon className="h-6 w-6 text-indigo-400" />;
        case 'complete':
            return <CheckCircleIcon className="h-6 w-6 text-green-400" />;
        default:
            return null;
    }
};

const getStatusTextColor = (status: Status) => {
    switch (status) {
        case 'pending':
            return 'text-gray-500';
        case 'active':
            return 'text-indigo-300';
        case 'complete':
            return 'text-green-400';
        default:
            return 'text-gray-500';
    }
}

const PipelineTracker: React.FC<PipelineTrackerProps> = ({ status }) => {
    return (
        <div className="w-full max-w-2xl bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-700">
            <h2 className="text-3xl font-bold text-center mb-2 text-indigo-300">Processing Pipeline</h2>
            <p className="text-center text-gray-400 mb-8">The Orbit ecosystem is now creating your video assets...</p>
            <div className="space-y-4">
                {status.map((model) => (
                    <div key={model.name} className={`flex items-center space-x-4 p-3 rounded-lg transition-all duration-500 ${model.status === 'active' ? 'bg-indigo-900/30' : 'bg-transparent'}`}>
                        <div className="flex-shrink-0">
                            {getStatusIcon(model.status)}
                        </div>
                        <div className="flex-grow">
                            <p className={`font-bold ${getStatusTextColor(model.status)}`}>{model.name}</p>
                            <p className="text-sm text-gray-400">{model.status === 'active' ? model.description : ''}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PipelineTracker;
