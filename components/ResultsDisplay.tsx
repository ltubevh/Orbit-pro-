
import React, { useCallback } from 'react';
import { FinalAssets } from '../types';
import { CopyIcon } from './icons/CopyIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ResetIcon } from './icons/ResetIcon';
import { LinkIcon } from './icons/LinkIcon';

interface ResultsDisplayProps {
    assets: FinalAssets;
    onReset: () => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ assets, onReset }) => {
    const handleCopy = useCallback((text: string) => {
        navigator.clipboard.writeText(text);
    }, []);

    const handleDownload = useCallback((url: string, filename: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);
    
    const handleDownloadSourceCode = useCallback(() => {
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${assets.title}</title>
    <style>
        body { font-family: sans-serif; background-color: #111; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        video { max-width: 100%; border-radius: 8px; }
    </style>
</head>
<body>
    <video controls src="${assets.videoUrl}" autoplay>
        Your browser does not support the video tag.
    </video>
</body>
</html>`;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        handleDownload(url, 'app.html');
        URL.revokeObjectURL(url);
    }, [assets, handleDownload]);


    return (
        <div className="w-full max-w-5xl bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-700 animate-in fade-in-0">
            <h2 className="text-3xl font-bold text-center mb-2 text-green-300">Production Complete</h2>
            <p className="text-center text-gray-400 mb-8">All assets for your video have been successfully generated.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Video and Audio */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xl font-semibold mb-3">Generated Video</h3>
                        {assets.videoUrl ? (
                            <video controls src={assets.videoUrl} className="w-full rounded-lg bg-black border border-gray-700"></video>
                        ) : (
                            <div className="w-full aspect-video flex items-center justify-center bg-gray-900 rounded-lg border border-gray-700">
                                <p className="text-gray-500">Video generation was not part of this workflow.</p>
                            </div>
                        )}
                    </div>
                    {assets.audioUrl && (
                         <div>
                            <h3 className="text-xl font-semibold mb-3">Generated Voiceover</h3>
                            <audio controls src={assets.audioUrl} className="w-full"></audio>
                        </div>
                    )}
                    <div>
                         <h3 className="text-xl font-semibold mb-3">Generated Thumbnails</h3>
                        <div className="grid grid-cols-3 gap-2">
                             {assets.thumbnailUrls.map((url, index) => (
                                <div key={index} className="relative group">
                                    <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-auto rounded-md aspect-video object-cover" />
                                    <button onClick={() => handleDownload(url, `thumbnail_${index + 1}.jpg`)} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <DownloadIcon className="h-6 w-6 text-white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Metadata and Actions */}
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xl font-semibold">Title & Description</h3>
                            <button onClick={() => handleCopy(`Title: ${assets.title}\n\nDescription: ${assets.description}`)} className="flex items-center text-sm text-gray-400 hover:text-white transition-colors">
                                <CopyIcon className="h-4 w-4 mr-1" />
                                Copy All
                            </button>
                        </div>
                        <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-700 space-y-4">
                            <div>
                                <h4 className="font-bold">{assets.title}</h4>
                            </div>
                            <div>
                                <p className="text-gray-300 whitespace-pre-wrap">{assets.description}</p>
                            </div>
                        </div>
                    </div>
                     {assets.sources && assets.sources.length > 0 && (
                        <div>
                            <h3 className="text-xl font-semibold mb-3 flex items-center"><LinkIcon className="h-5 w-5 mr-2" /> Grounded Sources</h3>
                            <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-700 space-y-2 max-h-40 overflow-y-auto">
                                {assets.sources.map((source, index) => (
                                    <a key={index} href={source.uri} target="_blank" rel="noopener noreferrer" className="block text-indigo-400 hover:underline truncate text-sm">
                                       {source.title}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                         <button onClick={handleDownloadSourceCode} className="w-full flex items-center justify-center py-3 px-4 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-500 transition-colors">
                            <DownloadIcon className="h-5 w-5 mr-2" />
                            Download Code
                        </button>
                        <button onClick={onReset} className="w-full flex items-center justify-center py-3 px-4 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 transition-colors">
                            <ResetIcon className="h-5 w-5 mr-2" />
                            Create New Video
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultsDisplay;
