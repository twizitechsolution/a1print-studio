import React, { useState, useEffect, useRef } from 'react';
import { Play, X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export interface UGCVideoItem {
  id: string;
  title: string;
  influencerName: string;
  thumbnailUrl: string;
  videoUrl: string;
  active: boolean;
}

export const INITIAL_UGC_VIDEOS: UGCVideoItem[] = [
  {
    id: 'v1',
    title: '12 Month Baby Birth Frame Unboxing',
    influencerName: '@shreya_parenting',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=400&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-happy-mother-holding-her-baby-41270-large.mp4',
    active: true,
  },
  {
    id: 'v2',
    title: 'Custom Birthday Photo Collage Frame Reaction',
    influencerName: '@ankit_vlogs',
    thumbnailUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=400&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-photo-frame-41584-large.mp4',
    active: true,
  },
  {
    id: 'v3',
    title: 'Personalized Couple Anniversary Frame Delivery',
    influencerName: '@priya_diaries',
    thumbnailUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=400&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-couple-looking-at-a-photo-album-41582-large.mp4',
    active: true,
  },
  {
    id: 'v4',
    title: 'Acrylic Premium Glass Wood Frame Overview',
    influencerName: '@decor_by_megha',
    thumbnailUrl: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=400&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-opening-a-gift-box-41581-large.mp4',
    active: true,
  },
  {
    id: 'v5',
    title: 'Twin Baby Memories Frame Review',
    influencerName: '@mommy_ritika',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=400&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-mother-holding-her-newborn-baby-41269-large.mp4',
    active: true,
  },
  {
    id: 'v6',
    title: 'Marriage Anniversary Heartbeat Frame Gift',
    influencerName: '@rohit_neha_life',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=400&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-couple-looking-at-a-photo-album-41582-large.mp4',
    active: true,
  },
  {
    id: 'v7',
    title: 'Gifts for Mom & Dad Special Memory Wall',
    influencerName: '@family_first_divya',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=400&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-photo-frame-41584-large.mp4',
    active: true,
  },
  {
    id: 'v8',
    title: 'First Birthday Customized Poster Frame',
    influencerName: '@baby_aisha_mom',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=400&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-happy-mother-holding-her-baby-41270-large.mp4',
    active: true,
  },
];

interface ProductsInMotionReelProps {
  videos?: UGCVideoItem[];
}

export const ProductsInMotionReel: React.FC<ProductsInMotionReelProps> = ({
  videos = INITIAL_UGC_VIDEOS,
}) => {
  const activeVideos = videos.filter((v) => v.active);
  const [selectedVideo, setSelectedVideo] = useState<UGCVideoItem | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Manual scroll handler
  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Continuous Auto-Slide Carousel Effect (Slides every 3.5 seconds)
  useEffect(() => {
    if (isHovered || selectedVideo) return;

    const interval = setInterval(() => {
      if (carouselRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          carouselRef.current.scrollBy({ left: 180, behavior: 'smooth' });
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isHovered, selectedVideo]);

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto space-y-8 font-sans select-none">
      
      {/* Section Heading matching LovecraftbySE reference screenshot */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl sm:text-4xl font-black font-playfair tracking-tight text-[#160E4B] uppercase">
          PRODUCTS IN MOTION
        </h2>
        <p className="text-sm font-semibold text-[#F82BA9] font-jost">
          See how we bring your memories to life
        </p>
      </div>

      {/* Auto-Scrolling Circular Video Carousel Container with Left/Right Arrow Controls */}
      <div
        className="relative group/reel px-4 sm:px-8"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Left Arrow Button */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-[#160E4B] border border-gray-200 shadow-lg flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-110 cursor-pointer"
          title="Scroll Left"
        >
          <ChevronLeft className="w-6 h-6 text-[#160E4B]" />
        </button>

        {/* Scrollable Container */}
        <div
          ref={carouselRef}
          className="flex items-center justify-start gap-4 sm:gap-6 overflow-x-auto py-4 px-2 scrollbar-none scroll-smooth"
        >
          {activeVideos.map((video) => (
            <div
              key={video.id}
              onClick={() => setSelectedVideo(video)}
              className="group relative flex-col items-center shrink-0 cursor-pointer text-center space-y-2"
            >
              {/* Circular Video Thumbnail Ring */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1.5 bg-gradient-to-tr from-[#F82BA9] via-purple-600 to-pink-500 shadow-md group-hover:scale-105 transition-transform duration-300">
                <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white bg-black">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                  />
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-[#F82BA9] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </div>
                </div>
              </div>

              <span className="text-[11px] font-bold text-gray-800 block truncate max-w-[120px]">
                {video.influencerName}
              </span>
            </div>
          ))}
        </div>

        {/* Right Arrow Button */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-[#160E4B] border border-gray-200 shadow-lg flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-110 cursor-pointer"
          title="Scroll Right"
        >
          <ChevronRight className="w-6 h-6 text-[#160E4B]" />
        </button>
      </div>

      {/* UGC Video Popup Reel Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-jost animate-fadeIn">
          <div className="relative bg-black rounded-3xl overflow-hidden max-w-md w-full shadow-2xl border border-white/20">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10 text-white">
              <div>
                <h4 className="font-bold text-sm">{selectedVideo.title}</h4>
                <span className="text-xs text-pink-400 font-mono">{selectedVideo.influencerName}</span>
              </div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player */}
            <div className="w-full aspect-[9/16] bg-black">
              <video
                src={selectedVideo.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
