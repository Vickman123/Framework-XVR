import React from 'react';
import { Compass } from 'lucide-react';
import type { HousingRoom } from '../../types/realEstate';

interface RoomNavigatorProps {
  rooms: HousingRoom[];
  activeRoomId: string;
  onSelectRoom: (room: HousingRoom) => void;
}

export const RoomNavigator: React.FC<RoomNavigatorProps> = ({
  rooms,
  activeRoomId,
  onSelectRoom,
}) => {
  if (!rooms || rooms.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 bg-[#06140f]/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-emerald-800/60 shadow-xl overflow-x-auto no-scrollbar select-none max-w-full">
      <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-teal-400 mr-1 shrink-0">
        <Compass className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Puntos:</span>
      </div>

      {rooms.map((room) => {
        const isActive = room.id === activeRoomId;
        return (
          <button
            key={room.id}
            onClick={() => onSelectRoom(room)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              isActive
                ? 'bg-teal-500/25 text-teal-300 border border-teal-500/60 shadow-[0_0_10px_rgba(20,184,166,0.3)]'
                : 'text-slate-300 hover:text-white hover:bg-emerald-950/60 border border-transparent'
            }`}
          >
            {room.name}
          </button>
        );
      })}
    </div>
  );
};
