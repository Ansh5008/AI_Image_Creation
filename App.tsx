
import React, { useState, useCallback } from 'react';
import { editImageWithGemini } from './services/geminiService';
import { ImageCard } from './components/ImageCard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorAlert } from './components/ErrorAlert';
import { UploadIcon } from './components/icons';

interface ImageData {
  base64: string;
  mimeType: string;
  previewUrl: string;
}

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState<string | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file (PNG, JPEG, etc.).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        setOriginalImage({
          base64: base64Data,
          mimeType: file.type,
          previewUrl: URL.createObjectURL(file),
        });
        setEditedImage(null);
        setError(null);
        setGeneratedText(null);
      };
      reader.onerror = () => {
        setError('Failed to read the image file.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!originalImage || !prompt) {
      setError('Please upload an image and provide an editing prompt.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setEditedImage(null);
    setGeneratedText(null);

    try {
      const result = await editImageWithGemini(originalImage.base64, originalImage.mimeType, prompt);
      if (result.image) {
        setEditedImage(`data:${result.mimeType};base64,${result.image}`);
      }
      if (result.text) {
        setGeneratedText(result.text);
      }
      if (!result.image && !result.text) {
          setError('The AI did not return an image or text. Please try a different prompt.');
      }
    } catch (err) {
      setError(err instanceof Error ? `An error occurred: ${err.message}` : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, prompt]);

  const resetState = () => {
    setOriginalImage(null);
    setEditedImage(null);
    setPrompt('');
    setError(null);
    setIsLoading(false);
    setGeneratedText(null);
    // Also reset the file input value
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if(fileInput) fileInput.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            AI Photo Studio
          </h1>
          <p className="mt-2 text-lg text-gray-400">Transform your images with the power of Gemini AI.</p>
        </header>

        <main>
          {!originalImage ? (
            <div className="max-w-2xl mx-auto">
              <label htmlFor="file-upload" className="relative block w-full h-64 border-2 border-dashed border-gray-600 rounded-lg p-12 text-center cursor-pointer hover:border-purple-500 hover:bg-gray-800 transition-all duration-300">
                <div className="flex flex-col items-center justify-center h-full">
                  <UploadIcon className="w-12 h-12 text-gray-500 mb-4"/>
                  <span className="mt-2 block text-lg font-semibold text-gray-300">Upload an Image</span>
                  <span className="mt-1 block text-sm text-gray-500">Drag & drop or click to select a file</span>
                </div>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
              </label>
            </div>
          ) : (
            <div>
              <form onSubmit={handleSubmit} className="mb-8">
                <div className="mb-6">
                  <label htmlFor="prompt" className="block text-lg font-medium text-gray-300 mb-2">Editing Prompt</label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., 'Add a wizard hat to the person' or 'Change the background to a futuristic city'"
                    className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200 resize-none"
                    rows={3}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    disabled={isLoading || !prompt}
                    className="w-full sm:w-auto flex-grow px-8 py-3 text-lg font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-300 flex items-center justify-center gap-2"
                  >
                    {isLoading && <LoadingSpinner />}
                    {isLoading ? 'Generating...' : 'Apply Edit'}
                  </button>
                  <button
                    type="button"
                    onClick={resetState}
                    disabled={isLoading}
                    className="w-full sm:w-auto px-8 py-3 text-lg font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors duration-300"
                  >
                    Start Over
                  </button>
                </div>
              </form>
            </div>
          )}

          {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {originalImage && (
              <ImageCard title="Original Image" imageUrl={originalImage.previewUrl} />
            )}
            {isLoading && !editedImage && (
              <div className="flex flex-col items-center justify-center bg-gray-800/50 border border-gray-700 rounded-xl min-h-[300px] p-4">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-400">AI is working its magic...</p>
              </div>
            )}
            {editedImage && (
              <ImageCard title="Edited Image" imageUrl={editedImage}>
                {generatedText && <p className="mt-4 p-4 bg-gray-900/50 rounded-lg text-sm text-gray-300">{generatedText}</p>}
              </ImageCard>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
