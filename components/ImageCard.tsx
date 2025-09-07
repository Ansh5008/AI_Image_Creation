
import React from 'react';

interface ImageCardProps {
  title: string;
  imageUrl: string;
  children?: React.ReactNode;
}

export const ImageCard: React.FC<ImageCardProps> = ({ title, imageUrl, children }) => {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 flex flex-col transition-all duration-300 hover:shadow-2xl hover:shadow-purple-900/20">
      <h3 className="text-xl font-bold text-center mb-4 text-gray-300">{title}</h3>
      <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-contain"
        />
      </div>
      {children}
    </div>
  );
};
