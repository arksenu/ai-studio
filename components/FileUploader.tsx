
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
  accept: Record<string, string[]>;
  title: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload, accept, title }) => {
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFileName(file.name);
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
        isDragActive ? 'border-brand-accent bg-brand-accent/10' : 'border-gray-600 hover:border-gray-500'
      }`}
    >
      <input {...getInputProps()} />
      {fileName ? (
        <p className="text-brand-light">{fileName}</p>
      ) : isDragActive ? (
        <p className="text-brand-accent">{title}</p>
      ) : (
        <p className="text-gray-400">{title}</p>
      )}
    </div>
  );
};
