import { useState } from "react";
import { Play, Pause, Volume2, Maximize } from "lucide-react";

interface VideoPlayerProps {
  videoUrl?: string;
  title: string;
}

export default function VideoPlayer({ videoUrl, title }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // In a real implementation, this would control actual video playback
  };

  return (
    <div className="bg-black relative">
      <div className="aspect-video bg-gray-900 flex items-center justify-center relative" data-testid="video-player-container">
        {/* Placeholder background image */}
        <img 
          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080" 
          alt={`${title} lesson`}
          className="w-full h-full object-cover" 
        />
        
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <button 
            className="bg-white bg-opacity-90 rounded-full p-4 hover:bg-opacity-100 transition-all transform hover:scale-110"
            onClick={handlePlayPause}
            data-testid="button-play-pause"
          >
            {isPlaying ? (
              <Pause className="text-pastoral-blue text-2xl ml-0" />
            ) : (
              <Play className="text-pastoral-blue text-2xl ml-1" />
            )}
          </button>
        </div>

        {/* Video Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4" data-testid="video-controls">
          <div className="flex items-center space-x-4 text-white">
            <button 
              className="hover:text-pastoral-gold transition-colors"
              onClick={handlePlayPause}
              data-testid="button-control-play"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <div className="flex-1 flex items-center space-x-2">
              <span className="text-sm" data-testid="text-current-time">0:00</span>
              <div className="flex-1 bg-gray-600 rounded-full h-1">
                <div className="bg-pastoral-gold rounded-full h-1" style={{width: "0%"}} data-testid="progress-bar"></div>
              </div>
              <span className="text-sm" data-testid="text-duration">12:34</span>
            </div>
            <button className="hover:text-pastoral-gold transition-colors" data-testid="button-volume">
              <Volume2 className="w-4 h-4" />
            </button>
            <button className="hover:text-pastoral-gold transition-colors" data-testid="button-fullscreen">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
