import React, { useState } from 'react';
import { Search, Heart, User, Menu, X, TreePine } from 'lucide-react';
import { CIUDAD_MADERAS_CORREGIDORA } from '../../data/developmentData';
import { PRIVADAS_LIST } from '../../data/privadasData';
import { LOTS_DATA } from '../../data/lotsData';
import type { Lot, Privada } from '../../types/realEstate';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSelectLot: (lot: Lot) => void;
  onSelectPrivada: (privada: Privada) => void;
  favoritesCount?: number;
  onOpenFavorites?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onSelectLot,
  onSelectPrivada,
  favoritesCount = 0,
  onOpenFavorites,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filter privada or lot search
  const filteredPrivadas = searchQuery.trim()
    ? PRIVADAS_LIST.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `privada ${p.name}`.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 4)
    : [];

  const filteredLots = searchQuery.trim()
    ? LOTS_DATA.filter((l) =>
        l.number.toString().includes(searchQuery) ||
        `lote ${l.number}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.privadaName.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 4)
    : [];

  const navLinks = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'desarrollos', label: 'Desarrollos' },
    { id: 'casas', label: 'Casas' },
    { id: 'terrenos', label: 'Terrenos' },
    { id: 'amenidades', label: 'Amenidades' },
    { id: 'galeria', label: 'Galería' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#05110d]/95 backdrop-blur-md border-b border-emerald-900/40 text-slate-100 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div
          onClick={() => onTabChange('desarrollos')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-700/50 to-teal-900/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <TreePine className="w-6 h-6 text-amber-200/90" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-[0.2em] text-slate-100 uppercase">
              {CIUDAD_MADERAS_CORREGIDORA.name}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium tracking-[0.25em] text-emerald-400 uppercase">
                {CIUDAD_MADERAS_CORREGIDORA.subname}
              </span>
              <span className="hidden sm:inline text-[9px] tracking-widest text-slate-400 font-light">
                {CIUDAD_MADERAS_CORREGIDORA.slogan}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1">
          {navLinks.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`relative px-4 py-2 text-xs uppercase tracking-wider font-medium transition-colors ${
                  isActive
                    ? 'text-teal-300 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Search & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Search Bar */}
          <div className="relative">
            <div className="flex items-center bg-[#0b1c15]/90 border border-emerald-800/50 rounded-full px-3 py-1.5 w-44 sm:w-64 focus-within:w-72 focus-within:border-teal-400 transition-all shadow-inner">
              <Search className="w-3.5 h-3.5 text-emerald-400/80 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Buscar lote, privada..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                className="bg-transparent text-xs text-slate-100 placeholder-slate-400 focus:outline-none w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-slate-200 text-xs px-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Live Search Results Dropdown */}
            {isSearchOpen && (filteredPrivadas.length > 0 || filteredLots.length > 0) && (
              <div className="absolute right-0 mt-2 w-72 bg-[#091712] border border-emerald-700/50 rounded-xl shadow-2xl p-2 z-50 backdrop-blur-xl">
                {filteredLots.length > 0 && (
                  <div className="mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400/80 px-2 py-1 block">
                      Terrenos Encontrados
                    </span>
                    {filteredLots.map((lot) => (
                      <button
                        key={lot.id}
                        onClick={() => {
                          onSelectLot(lot);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-emerald-950/80 rounded-lg flex items-center justify-between text-slate-200 transition-colors"
                      >
                        <div>
                          <span className="font-semibold text-white">Lote {lot.number}</span>
                          <span className="text-[11px] text-slate-400 ml-1.5">
                            Privada {lot.privadaName}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-medium ${
                            lot.status === 'disponible'
                              ? 'bg-emerald-900/60 text-emerald-300'
                              : lot.status === 'apartado'
                              ? 'bg-amber-900/60 text-amber-300'
                              : lot.status === 'vendido'
                              ? 'bg-rose-900/60 text-rose-300'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {lot.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {filteredPrivadas.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400/80 px-2 py-1 block">
                      Privadas (Clusters)
                    </span>
                    {filteredPrivadas.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectPrivada(p);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-emerald-950/80 rounded-lg flex items-center justify-between text-slate-200 transition-colors"
                      >
                        <span className="font-medium text-white">{p.number}. {p.name}</span>
                        <span className="text-[10px] text-emerald-400">
                          {p.availableCount} disp.
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Favorites Heart */}
          <button
            onClick={onOpenFavorites}
            className="relative p-2 rounded-full bg-[#0b1c15] hover:bg-emerald-900/50 border border-emerald-800/40 text-slate-300 hover:text-rose-400 transition-colors"
            title="Favoritos"
          >
            <Heart className="w-4 h-4" />
            {favoritesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center shadow">
                {favoritesCount}
              </span>
            )}
          </button>

          {/* User Profile */}
          <button
            className="p-2 rounded-full bg-[#0b1c15] hover:bg-emerald-900/50 border border-emerald-800/40 text-slate-300 hover:text-teal-300 transition-colors"
            title="Cuenta / Inversionista"
          >
            <User className="w-4 h-4" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-[#0b1c15] border border-emerald-800/40 text-slate-200"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#071610] border-b border-emerald-800/60 px-4 py-3 space-y-1">
          {navLinks.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs uppercase tracking-wider font-medium ${
                activeTab === item.id
                  ? 'bg-emerald-900/50 text-teal-300 font-semibold'
                  : 'text-slate-300 hover:bg-emerald-950/40'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
