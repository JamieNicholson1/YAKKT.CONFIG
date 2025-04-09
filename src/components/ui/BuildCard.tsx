import React from 'react';
import { Heart, Download } from 'lucide-react';
import { Button } from './button';

interface BuildCardProps {
  title: string;
  author: string;
  likes: number;
  selectedOptions: string[] | null | undefined;
  onLike: () => void;
  onLoad: () => void;
  authorColor?: string;
}

const BuildCard: React.FC<BuildCardProps> = ({
  title,
  author,
  likes,
  selectedOptions = [],
  onLike,
  onLoad,
  authorColor = '#000000'
}) => {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: authorColor }}
          />
          <span className="font-mono text-sm text-black">{title}</span>
          <span className="text-black ml-auto font-mono text-xs">by {author}</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {selectedOptions && selectedOptions.length > 0 ? (
            selectedOptions.map((option, index) => (
              <span
                key={`option-${index}-${option}`}
                className="bg-gray-100 px-2 py-0.5 rounded-md text-xs font-mono text-black"
              >
                {option}
              </span>
            ))
          ) : (
            <span className="text-xs font-mono text-gray-400">No options selected</span>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={onLike}
            className="flex items-center gap-1.5 text-black hover:text-red-500 transition-colors"
            aria-label="Like build"
          >
            <Heart className="w-4 h-4 stroke-[2.5px]" />
            <span className="font-mono text-xs">{likes}</span>
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={onLoad}
            className="font-mono text-xs flex items-center gap-1.5 bg-black text-white hover:bg-amber-500 hover:text-white border-black"
          >
            <Download className="w-3 h-3 stroke-[2.5px]" />
            Load
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BuildCard; 