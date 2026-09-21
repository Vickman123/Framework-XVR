import React, { useState } from 'react';
import { Header } from './components/navigation/Header';
import { LeftSidebarNav } from './components/navigation/LeftSidebarNav';
import { MobileBottomNav } from './components/navigation/MobileBottomNav';
import { Footer } from './components/navigation/Footer';
import { MasterplanCanvas } from './components/masterplan/MasterplanCanvas';
import { LotDetailCard } from './components/lots/LotDetailCard';
import { LotsListView } from './components/lots/LotsListView';
import { PrivadasListModal } from './components/masterplan/PrivadasListModal';
import { AmenitiesCarousel } from './components/amenities/AmenitiesCarousel';
import { AmenityDetailModal } from './components/amenities/AmenityDetailModal';
import { HousingCatalog } from './components/houses/HousingCatalog';
import { HouseDetailModal } from './components/houses/HouseDetailModal';
import { RealEstate3DViewer } from './components/viewer3d/RealEstate3DViewer';
import { ARViewModal } from './components/ar/ARViewModal';
import { QRCodeModal } from './components/common/QRCodeModal';
import { FavoritesModal } from './components/common/FavoritesModal';
import { DevelopmentOverview } from './components/home/DevelopmentOverview';
import { LOTS_DATA } from './data/lotsData';
import { HOUSING_MODELS } from './data/housingModelsData';
import type {
  Lot,
  Amenity,
  Privada,
  HousingModel,
  LotStatus,
  MasterplanViewMode,
  TimeOfDay,
} from './types/realEstate';

export const App: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('desarrollos');
  const [activeSidebarView, setActiveSidebarView] = useState<string>('masterplan');

  // Masterplan Selection State (Defaulting to Lote 124 as in Image 1)
  const [selectedLot, setSelectedLot] = useState<Lot | null>(LOTS_DATA[0]);
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [selectedPrivada, setSelectedPrivada] = useState<Privada | null>(null);
  const [viewMode, setViewMode] = useState<MasterplanViewMode>('3d');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('dia');
  const [filterStatus, setFilterStatus] = useState<LotStatus | 'all'>('all');

  // Favorites State
  const [favoriteLotIds, setFavoriteLotIds] = useState<string[]>(['lote-124']);

  // 3D Viewer Full-Screen Mode (Powered by XVR)
  const [activeViewerModel, setActiveViewerModel] = useState<HousingModel | null>(null);
  const [viewerAssociatedLot, setViewerAssociatedLot] = useState<Lot | null>(null);

  // Modals State
  const [isPrivadasModalOpen, setIsPrivadasModalOpen] = useState(false);
  const [isLotsListModalOpen, setIsLotsListModalOpen] = useState(false);
  const [isAmenityModalOpen, setIsAmenityModalOpen] = useState(false);
  const [isHouseDetailModalOpen, setIsHouseDetailModalOpen] = useState(false);
  const [selectedHouseModel, setSelectedHouseModel] = useState<HousingModel | null>(null);
  const [isARModalOpen, setIsARModalOpen] = useState(false);
  const [arTargetModel, setArTargetModel] = useState<HousingModel | null>(null);
  const [arTargetLot, setArTargetLot] = useState<Lot | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);

  // Toggle favorite
  const handleToggleFavorite = (lotId: string) => {
    setFavoriteLotIds((prev) =>
      prev.includes(lotId) ? prev.filter((id) => id !== lotId) : [...prev, lotId]
    );
  };

  // Launch 3D Viewer for a Lot
  const handleViewLot3D = (lot: Lot) => {
    const matchedModel =
      HOUSING_MODELS.find((m) => m.id === lot.recommendedHouseModelId) ||
      HOUSING_MODELS[0];
    setViewerAssociatedLot(lot);
    setActiveViewerModel(matchedModel);
  };

  // Launch 3D Viewer for a Housing Model
  const handleViewModel3D = (model: HousingModel) => {
    setViewerAssociatedLot(null);
    setActiveViewerModel(model);
  };

  // Launch AR for a Lot
  const handleViewLotAR = (lot: Lot) => {
    const matchedModel =
      HOUSING_MODELS.find((m) => m.id === lot.recommendedHouseModelId) ||
      HOUSING_MODELS[0];
    setArTargetLot(lot);
    setArTargetModel(matchedModel);
    setIsARModalOpen(true);
  };

  // Launch AR for a Model
  const handleViewModelAR = (model: HousingModel) => {
    setArTargetLot(null);
    setArTargetModel(model);
    setIsARModalOpen(true);
  };

  // Select an Amenity
  const handleSelectAmenity = (amenity: Amenity) => {
    setSelectedAmenity(amenity);
    setIsAmenityModalOpen(true);
  };

  // Switch tabs
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'inicio') setActiveSidebarView('general');
    else if (tab === 'desarrollos') setActiveSidebarView('masterplan');
    else if (tab === 'casas') setActiveSidebarView('casas');
    else if (tab === 'terrenos') setIsLotsListModalOpen(true);
    else if (tab === 'amenidades') setActiveSidebarView('amenidades');
    else if (tab === 'galeria') setActiveSidebarView('galeria');
  };

  // Switch sidebar views
  const handleSidebarViewChange = (viewId: string) => {
    setActiveSidebarView(viewId);
    if (viewId === 'general') setActiveTab('inicio');
    else if (viewId === 'masterplan') setActiveTab('desarrollos');
    else if (viewId === 'terrenos') setIsLotsListModalOpen(true);
    else if (viewId === 'casas') setActiveTab('casas');
    else if (viewId === 'recorrido') {
      handleViewModel3D(HOUSING_MODELS[0]);
    }
  };

  // If XVR 3D viewer is active, render full-screen 3D viewport
  if (activeViewerModel) {
    return (
      <RealEstate3DViewer
        model={activeViewerModel}
        associatedLot={viewerAssociatedLot}
        onBack={() => {
          setActiveViewerModel(null);
          setViewerAssociatedLot(null);
        }}
        onOpenAR={handleViewModelAR}
      />
    );
  }

  const isMasterplanActive = activeTab === 'desarrollos' || activeSidebarView === 'masterplan';

  return (
    <div className="w-full min-h-screen bg-[#040e0a] text-slate-100 flex flex-col justify-between font-sans">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onSelectLot={(lot) => {
          setSelectedLot(lot);
          setActiveTab('desarrollos');
          setActiveSidebarView('masterplan');
        }}
        onSelectPrivada={(privada) => {
          setSelectedPrivada(privada);
          setActiveTab('desarrollos');
          setActiveSidebarView('masterplan');
        }}
        favoritesCount={favoriteLotIds.length}
        onOpenFavorites={() => setIsFavoritesModalOpen(true)}
      />

      {/* Main Responsive Body Area */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* Left Sidebar (Desktop/Tablet) */}
        <LeftSidebarNav
          activeView={activeSidebarView}
          onSelectView={handleSidebarViewChange}
          onOpenQRModal={() => setIsQRModalOpen(true)}
        />

        {/* Center Main Stage */}
        <main className="flex-1 flex flex-col overflow-hidden relative min-h-[500px]">
          {activeTab === 'inicio' || activeSidebarView === 'general' ? (
            /* Development Overview Landing */
            <div className="flex-1 overflow-y-auto">
              <DevelopmentOverview
                onGoToMasterplan={() => {
                  setActiveTab('desarrollos');
                  setActiveSidebarView('masterplan');
                }}
                onGoToLots={() => setIsLotsListModalOpen(true)}
                onGoToHouses={() => {
                  setActiveTab('casas');
                  setActiveSidebarView('casas');
                }}
                onSelectAmenity={handleSelectAmenity}
              />
            </div>
          ) : activeTab === 'casas' || activeSidebarView === 'casas' ? (
            /* Housing Models Catalog */
            <div className="flex-1 overflow-y-auto">
              <HousingCatalog
                onSelectModel={(model) => {
                  setSelectedHouseModel(model);
                  setIsHouseDetailModalOpen(true);
                }}
                onView3D={handleViewModel3D}
                onViewAR={handleViewModelAR}
              />
            </div>
          ) : (
            /* Interactive Masterplan (Heart of the Experience) */
            <div className="flex-1 relative flex flex-col overflow-hidden">
              <div className="flex-1 relative">
                <MasterplanCanvas
                  selectedLot={selectedLot}
                  onSelectLot={setSelectedLot}
                  onSelectAmenity={handleSelectAmenity}
                  onOpenPrivadasList={() => setIsPrivadasModalOpen(true)}
                  onOpenLotsList={() => setIsLotsListModalOpen(true)}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  timeOfDay={timeOfDay}
                  onToggleTimeOfDay={() => setTimeOfDay(timeOfDay === 'dia' ? 'noche' : 'dia')}
                  filterStatus={filterStatus}
                  onFilterStatusChange={setFilterStatus}
                  activePrivada={selectedPrivada}
                />

                {/* Right Desktop Floating Lot Inspector Card (Image 1 reference) */}
                {selectedLot && (
                  <div className="hidden lg:block absolute top-4 right-4 z-30 animate-in fade-in slide-in-from-right-4 duration-300">
                    <LotDetailCard
                      lot={selectedLot}
                      onClose={() => setSelectedLot(null)}
                      onView3D={handleViewLot3D}
                      onViewAR={handleViewLotAR}
                      isFavorite={favoriteLotIds.includes(selectedLot.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  </div>
                )}
              </div>

              {/* Bottom Amenities Carousel (Image 1 reference) */}
              <AmenitiesCarousel onSelectAmenity={handleSelectAmenity} />
            </div>
          )}
        </main>
      </div>

      {/* Mobile-First Sliding Bottom Sheet for Selected Lot */}
      {selectedLot && isMasterplanActive && (
        <div className="lg:hidden fixed bottom-14 left-0 right-0 z-40 animate-in slide-in-from-bottom duration-300">
          <LotDetailCard
            lot={selectedLot}
            onClose={() => setSelectedLot(null)}
            onView3D={handleViewLot3D}
            onViewAR={handleViewLotAR}
            isFavorite={favoriteLotIds.includes(selectedLot.id)}
            onToggleFavorite={handleToggleFavorite}
            isMobileDrawer={true}
          />
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Institutional Footer */}
      <Footer />

      {/* Modals */}
      <PrivadasListModal
        isOpen={isPrivadasModalOpen}
        onClose={() => setIsPrivadasModalOpen(false)}
        onSelectPrivada={(p) => {
          setSelectedPrivada(p);
          setActiveTab('desarrollos');
          setActiveSidebarView('masterplan');
        }}
        selectedPrivadaId={selectedPrivada?.id}
      />

      <LotsListView
        isOpen={isLotsListModalOpen}
        onClose={() => setIsLotsListModalOpen(false)}
        onSelectLot={(lot) => {
          setSelectedLot(lot);
          setActiveTab('desarrollos');
          setActiveSidebarView('masterplan');
        }}
        onView3D={handleViewLot3D}
        onViewAR={handleViewLotAR}
      />

      <AmenityDetailModal
        isOpen={isAmenityModalOpen}
        amenity={selectedAmenity}
        onClose={() => {
          setIsAmenityModalOpen(false);
          setSelectedAmenity(null);
        }}
        onLocateOnMap={(_amenity) => {
          setActiveTab('desarrollos');
          setActiveSidebarView('masterplan');
        }}
      />

      <HouseDetailModal
        isOpen={isHouseDetailModalOpen}
        model={selectedHouseModel}
        onClose={() => {
          setIsHouseDetailModalOpen(false);
          setSelectedHouseModel(null);
        }}
        onView3D={handleViewModel3D}
        onViewAR={handleViewModelAR}
      />

      <ARViewModal
        isOpen={isARModalOpen}
        onClose={() => {
          setIsARModalOpen(false);
          setArTargetModel(null);
          setArTargetLot(null);
        }}
        model={arTargetModel}
        lot={arTargetLot}
      />

      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
      />

      <FavoritesModal
        isOpen={isFavoritesModalOpen}
        onClose={() => setIsFavoritesModalOpen(false)}
        favoriteLotIds={favoriteLotIds}
        onSelectLot={(lot) => {
          setSelectedLot(lot);
          setActiveTab('desarrollos');
        }}
        onRemoveFavorite={handleToggleFavorite}
        onView3D={handleViewLot3D}
      />
    </div>
  );
};

export default App;
