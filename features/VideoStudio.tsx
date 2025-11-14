
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { Loader } from '../components/Loader';
import { FileUploader } from '../components/FileUploader';
import { ApiKeyDialog } from '../components/ApiKeyDialog';
import * as geminiService from '../services/geminiService';
import { blobToBase64 } from '../utils';
import { VideoIcon } from '../components/icons';

const VideoStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [sourceImage, setSourceImage] = useState<{ file: File; base64: string; } | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [apiKeySelected, setApiKeySelected] = useState(false);

  const checkApiKey = useCallback(async () => {
    if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
      setApiKeySelected(true);
    } else {
      setApiKeySelected(false);
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume success and optimistically update UI
      setApiKeySelected(true);
    }
  };

  const handleFileChange = async (file: File) => {
    const base64 = await blobToBase64(file);
    setSourceImage({ file, base64 });
  };

  const handleSubmit = async () => {
    if (!prompt.trim() && !sourceImage) {
      setError('Please provide a prompt or an image.');
      return;
    }
    if (!apiKeySelected) {
        setError('Please select an API key to generate videos.');
        return;
    }

    setIsLoading(true);
    setVideoUrl(null);
    setError(null);

    try {
      setLoadingMessage('Starting video generation... This may take a few minutes.');
      let operation = await geminiService.generateVideo(
        prompt, 
        sourceImage ? { data: sourceImage.base64, mimeType: sourceImage.file.type } : undefined
      );

      setLoadingMessage('Processing video... Hang tight!');
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await geminiService.getVideosOperation(operation);
      }
      
      const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!uri) {
        throw new Error('Video generation did not return a valid URI.');
      }
      
      setLoadingMessage('Fetching final video...');
      const videoBlob = await geminiService.fetchVideo(uri);
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      if (errorMessage.includes("Requested entity was not found")) {
          setError("API Key error. Please re-select your API key and try again.");
          setApiKeySelected(false);
      } else {
          setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <>
      <Header title="Video Studio" icon={<VideoIcon />} />
      <div className="container mx-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-brand-text mb-6">
            Create stunning videos from a text prompt or a starting image using Veo.
          </p>

          {!apiKeySelected && <ApiKeyDialog onSelectKey={handleSelectKey} />}

          <div className="space-y-4 mt-6">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A neon hologram of a cat driving at top speed"
              className="w-full h-24 p-4 bg-brand-secondary border border-white/10 rounded-lg text-brand-text placeholder-gray-500 focus:ring-2 focus:ring-brand-accent focus:outline-none"
            />
            <FileUploader
              onFileUpload={handleFileChange}
              accept={{ 'image/*': ['.jpeg', '.jpg', '.png'] }}
              title="Optional: Add a starting image"
            />
            <button onClick={handleSubmit} disabled={isLoading || !apiKeySelected} className="w-full py-3 bg-brand-accent text-white font-semibold rounded-lg hover:bg-indigo-500 disabled:bg-gray-500">
              {isLoading ? 'Generating...' : 'Generate Video'}
            </button>
          </div>

          {error && <p className="mt-4 text-center text-red-400">{error}</p>}
          {isLoading && <Loader message={loadingMessage} />}

          {videoUrl && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-center mb-4 text-brand-light">Generated Video</h2>
              <video controls src={videoUrl} className="w-full rounded-lg" />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default VideoStudio;
