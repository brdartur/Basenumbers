import React from 'react';
import { BADGE_LEVELS } from '../constants';

interface AchievementBadgesProps {
  score: number;
}

// SVG Components for each badge level
const BadgeIcon = ({ level, color, locked }: { level: number; color: string; locked: boolean }) => {
  const fill = color;
  const stroke = 'white';
  
  if (level === 1) { // Based
    return (
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="p-1">
        <path d="M12 2L3 7V12C3 17.52 6.92 22.74 12 24C17.08 22.74 21 17.52 21 12V7L12 2Z" fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  
  if (level === 2) { // Builder
    return (
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="p-1">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }

  if (level === 3) { // Superchain
    return (
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="p-1">
        <path d="M2 4L12 2L22 4V10C22 10 22 18 12 22C2 18 2 10 2 10V4Z" fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M9 12L12 9L15 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }

  if (level === 4) { // Legend
    return (
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="p-1">
        <path d="M6 2L3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6L18 2H6Z" fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="3" fill="white" fillOpacity="0.3"/>
      </svg>
    );
  }

  return null;
};

const AchievementBadges: React.FC<AchievementBadgesProps> = ({ score }) => {
  return (
    <div className="w-full">
      {/* 
         Use Grid Cols 4 with exact same padding (px-3) and gap (gap-3) as the Board component.
         This ensures visual vertical alignment: Badge 1 over Col 1, Badge 4 over Col 4.
      */}
      <div className="grid grid-cols-4 gap-3 px-3 w-full">
        {BADGE_LEVELS.map((badge) => {
          const unlocked = score >= badge.score;
          
          return (
            <div 
              key={badge.id} 
              className={`flex flex-col items-center justify-start transition-all duration-500 relative group
                ${unlocked ? 'opacity-100' : 'opacity-25'} 
              `}
            >
              {/* Glow Effect for unlocked */}
              {unlocked && (
                <div 
                  className="absolute top-0 left-0 w-full h-12 rounded-full blur-xl opacity-40 transition-opacity duration-700 pointer-events-none"
                  style={{ backgroundColor: badge.color }}
                />
              )}
              
              <div 
                className={`
                  relative z-10 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center
                  border-2 transition-all duration-300
                  ${unlocked ? 'shadow-[0_0_15px_rgba(0,0,0,0.5)] border-white/20' : ''}
                `}
                style={{ 
                  backgroundColor: unlocked ? `${badge.color}20` : `${badge.color}10`,
                  borderColor: unlocked ? 'rgba(255,255,255,0.2)' : `${badge.color}40`,
                }}
              >
                <BadgeIcon level={badge.id} color={badge.color} locked={!unlocked} />
              </div>
              
              <div className="text-center flex flex-col items-center mt-1 w-full">
                <span 
                  className={`text-[9px] md:text-[10px] font-bold block transition-colors duration-300 truncate w-full ${unlocked ? 'text-white' : ''}`}
                  style={{ color: !unlocked ? badge.color : undefined }}
                >
                  {badge.label}
                </span>
                
                <span className="text-[8px] md:text-[9px] text-gray-500 font-mono block leading-tight">
                  {badge.score >= 1000 ? (badge.score / 1000) + 'k' : badge.score}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AchievementBadges;
