import { events } from '../core/EventBus';

export type EquipmentStatus = 'DISPONIBLE' | 'EN_MOSTRADOR' | 'EN_MANOS' | 'MANTENIMIENTO' | 'PRESTADO';

export interface EquipmentItem {
  id: string;
  name: string;
  tag: string;
  slotNumber: number; // 1 to 5 en Carro 01
  status: EquipmentStatus;
  batteryLevel: number;
  chargerOk: boolean;
  hasPhysicalDamage: boolean;
  notes: string;
}

export class InventoryManager {
  private static instance: InventoryManager;
  
  private items: Map<string, EquipmentItem> = new Map();

  private constructor() {
    this.initializeInventory();
  }

  public static getInstance(): InventoryManager {
    if (!InventoryManager.instance) {
      InventoryManager.instance = new InventoryManager();
    }
    return InventoryManager.instance;
  }

  private initializeInventory(): void {
    // Inventario inicial estipulado en las especificaciones del proyecto
    const initialData: EquipmentItem[] = [
      {
        id: 'laptop_01',
        name: 'Laptop 01',
        tag: 'PC-PUMA-01',
        slotNumber: 1,
        status: 'EN_MOSTRADOR',
        batteryLevel: 100,
        chargerOk: true,
        hasPhysicalDamage: false,
        notes: 'Ubicada en zona de mostrador para pruebas'
      },
      {
        id: 'laptop_02',
        name: 'Laptop 02',
        tag: 'PC-PUMA-02',
        slotNumber: 2,
        status: 'DISPONIBLE',
        batteryLevel: 98,
        chargerOk: true,
        hasPhysicalDamage: false,
        notes: 'Resguardada en Bahía 02 lista para préstamo'
      },
      {
        id: 'laptop_03',
        name: 'Laptop 03',
        tag: 'PC-PUMA-03',
        slotNumber: 3,
        status: 'MANTENIMIENTO',
        batteryLevel: 45,
        chargerOk: true,
        hasPhysicalDamage: true,
        notes: 'En revisión de bisagra y actualización de software'
      },
      {
        id: 'laptop_04',
        name: 'Laptop 04',
        tag: 'PC-PUMA-04',
        slotNumber: 4,
        status: 'DISPONIBLE',
        batteryLevel: 100,
        chargerOk: true,
        hasPhysicalDamage: false,
        notes: 'Resguardada en Bahía 04 lista para préstamo'
      },
      {
        id: 'laptop_05',
        name: 'Laptop 05',
        tag: 'PC-PUMA-05',
        slotNumber: 5,
        status: 'DISPONIBLE',
        batteryLevel: 95,
        chargerOk: true,
        hasPhysicalDamage: false,
        notes: 'Resguardada en Bahía 05 lista para préstamo'
      }
    ];

    for (const item of initialData) {
      this.items.set(item.id, item);
    }
  }

  public getAllItems(): EquipmentItem[] {
    return Array.from(this.items.values());
  }

  public getItem(id: string): EquipmentItem | undefined {
    return this.items.get(id);
  }

  public updateStatus(id: string, newStatus: EquipmentStatus): void {
    const item = this.items.get(id);
    if (item && item.status !== newStatus) {
      item.status = newStatus;
      events.emit('INVENTORY_UPDATED', { item, allItems: this.getAllItems() });
    }
  }
}

export const inventory = InventoryManager.getInstance();
