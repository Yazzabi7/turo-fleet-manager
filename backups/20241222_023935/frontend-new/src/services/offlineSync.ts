import localforage from 'localforage';

// Configuration de localforage
localforage.config({
  name: 'turo-fleet-manager',
  storeName: 'fleet_manager_store'
});

// Création des stores
const vehiclesStore = localforage.createInstance({
  name: "turo-fleet-manager",
  storeName: "vehicles"
});

const pendingActionsStore = localforage.createInstance({
  name: "turo-fleet-manager",
  storeName: "pendingActions"
});

const cacheStore = localforage.createInstance({
  name: "turo-fleet-manager",
  storeName: "cache"
});

interface PendingAction {
  id: string;
  url: string;
  method: string;
  data: any;
  timestamp: number;
}

export const offlineSync = {
  // Cache API response
  async cacheApiResponse(url: string, data: any) {
    await cacheStore.setItem(url, {
      data,
      timestamp: Date.now(),
    });
  },

  // Get cached response
  async getCachedResponse(url: string) {
    return await cacheStore.getItem(url);
  },

  // Save vehicle data locally
  async saveVehicle(vehicle: any) {
    await vehiclesStore.setItem(String(vehicle.id), vehicle);
  },

  // Get all vehicles from local storage
  async getVehicles() {
    const vehicles = [];
    await vehiclesStore.iterate((value) => {
      vehicles.push(value);
    });
    return vehicles;
  },

  // Add pending action
  async addPendingAction(action: PendingAction) {
    await pendingActionsStore.setItem(action.id, action);
  },

  // Get all pending actions
  async getPendingActions() {
    const actions = [];
    await pendingActionsStore.iterate((value) => {
      actions.push(value);
    });
    return actions;
  },

  // Remove pending action
  async removePendingAction(id: string) {
    await pendingActionsStore.removeItem(id);
  },

  // Sync pending actions when online
  async syncPendingActions() {
    if (!navigator.onLine) return;

    const actions = await this.getPendingActions();
    
    for (const action of actions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(action.data),
        });

        if (response.ok) {
          await this.removePendingAction(action.id);
        }
      } catch (error) {
        console.error('Error syncing action:', error);
      }
    }
  },

  // Clear all stored data
  async clearAll() {
    await vehiclesStore.clear();
    await pendingActionsStore.clear();
    await cacheStore.clear();
  }
};

// Listen for online/offline events
window.addEventListener('online', () => {
  console.log('Back online');
  offlineSync.syncPendingActions();
});

window.addEventListener('offline', () => {
  console.log('Gone offline');
});
