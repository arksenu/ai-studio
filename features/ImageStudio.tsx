
import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Loader } from '../components/Loader';
import { FileUploader } from '../components/FileUploader';
import { generateImage, editImage, analyzeImage } from '../services/geminiService';
import type { AspectRatio } from '../types';
import { blobToBase64 } from '../utils';
import { ImageIcon } from '../components/icons';

type StudioTab = 'Generate' | 'Edit' | 'Analyze';

const aspectRatios: AspectRatio[] = ["16:9", "1:1", "9:16", "4:3", "3:4"];

const ImageStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StudioTab>('Generate');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [sourceImage, setSourceImage] = useState<{ file: File; url: string; base64: string; } | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (file: File) => {
    const url = URL.createObjectURL(file);
    const base64 = await blobToBase64(file);
    setSourceImage({ file, url, base64 });
    setResult(null); // Clear previous results
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      setError('Prompt cannot be empty.');
      return;
    }
    if ((activeTab === 'Edit' || activeTab === 'Analyze') && !sourceImage) {
      setError('Please upload an image.');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      if (activeTab === 'Generate') {
        setLoadingMessage('Generating image...');
        const base64Image = await generateImage(prompt, aspectRatio);
        setResult(`data:image/jpeg;base64,${base64Image}`);
      } else if (activeTab === 'Edit' && sourceImage) {
        setLoadingMessage('Editing image...');
        const base64Image = await editImage(prompt, sourceImage.base64, sourceImage.file.type);
        setResult(`data:image/png;base64,${base64Image}`);
      } else if (activeTab === 'Analyze' && sourceImage) {
        setLoadingMessage('Analyzing image...');
        const analysisText = await analyzeImage(prompt, sourceImage.base64, sourceImage.file.type);
        setResult(analysisText);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const TabButton: React.FC<{ tabName: StudioTab }> = ({ tabName }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-4 py-2 text-sm font-medium rounded-md ${
        activeTab === tabName ? 'bg-brand-accent text-white' : 'text-gray-300 hover:bg-brand-secondary'
      }`}
    >
      {tabName}
    </button>
  );
  
  return (
    <>
      <Header title="Image Studio" icon={<ImageIcon />} />
      <div className="container mx-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center gap-2 mb-6 p-1 bg-brand-primary rounded-lg">
            <TabButton tabName="Generate" />
            <TabButton tabName="Edit" />
            <TabButton tabName="Analyze" />
          </div>

          <div className="space-y-4">
            {(activeTab === 'Edit' || activeTab === 'Analyze') && (
              <div>
                <h3 className="text-lg font-semibold mb-2 text-brand-light">1. Upload Image</h3>
                <FileUploader
                  onFileUpload={handleFileChange}
                  accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] }}
                  title="Drag 'n' drop an image here, or click to select"
                />
              </div>
            )}
             <h3 className="text-lg font-semibold mb-2 text-brand-light">{ (activeTab === 'Edit' || activeTab === 'Analyze') ? '2. Enter Prompt' : '1. Enter Prompt'}</h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                activeTab === 'Generate' ? "A futuristic cityscape at sunset, cinematic lighting..."
                : activeTab === 'Edit' ? "Add a retro film grain effect"
                : "What is the main subject of this image?"
              }
              className="w-full h-24 p-4 bg-brand-secondary border border-white/10 rounded-lg text-brand-text placeholder-gray-500 focus:ring-2 focus:ring-brand-accent focus:outline-none"
            />
            {activeTab === 'Generate' && (
              <div>
                 <h3 className="text-lg font-semibold mb-2 text-brand-light">2. Select Aspect Ratio</h3>
                 <div className="flex gap-2 flex-wrap">
                    {aspectRatios.map(ratio => (
                      <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`px-4 py-2 text-sm rounded-md ${aspectRatio === ratio ? 'bg-brand-accent' : 'bg-brand-secondary'}`}>
                        {ratio}
                      </button>
                    ))}
                 </div>
              </div>
            )}
            <button onClick={handleSubmit} disabled={isLoading} className="w-full py-3 bg-brand-accent text-white font-semibold rounded-lg hover:bg-indigo-500 disabled:bg-gray-500">
              {isLoading ? 'Processing...' : 'Go'}
            </button>
          </div>

          {error && <p className="mt-4 text-center text-red-400">{error}</p>}
          {isLoading && <Loader message={loadingMessage} />}

          {result && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-center mb-4 text-brand-light">Result</h2>
              <div className="p-4 bg-brand-secondary rounded-lg">
                {activeTab === 'Analyze' ? (
                  <p className="text-brand-text whitespace-pre-wrap">{result}</p>
                ) : (
                  <img src={result} alt="Generated result" className="rounded-md mx-auto max-h-[70vh]" />
                )}
              </div>
            </div>
          )}
          {!result && sourceImage && activeTab !== 'Generate' && (
             <div className="mt-8">
                <h2 className="text-2xl font-bold text-center mb-4 text-brand-light">Source Image</h2>
                <div className="p-4 bg-brand-secondary rounded-lg">
                    <img src={sourceImage.url} alt="Source" className="rounded-md mx-auto max-h-[70vh]" />
                </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ImageStudio;
