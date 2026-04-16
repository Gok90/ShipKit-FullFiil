/**
 * Local API Client
 * Communicates with FastAPI backend running on localhost:8000
 */

const API_BASE = 'http://127.0.0.1:8000';

export class ShipKitAPI {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Settings
  static async getSettings() {
    return this.request('/api/settings');
  }

  static async updateSettings(settings: Record<string, any>) {
    return this.request('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Catalog
  static async getCatalog() {
    return this.request('/api/catalog');
  }

  // Inventory
  static async getInventory() {
    return this.request('/api/inventory');
  }

  static async updateInventory(inventoryId: string, stockCount: number) {
    return this.request(`/api/inventory/${inventoryId}`, {
      method: 'PUT',
      body: JSON.stringify({ stock_count: stockCount }),
    });
  }

  // Batch
  static async createBatch() {
    return this.request('/api/batch/create', { method: 'POST' });
  }

  static async getActiveBatch() {
    return this.request('/api/batch/active');
  }

  // Files
  static async uploadFiles(batchId: string, files: File[]) {
    const formData = new FormData();
    formData.append('batchId', batchId);
    files.forEach(file => formData.append('files', file));

    const response = await fetch(`${API_BASE}/api/batch/files/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }

    return await response.json();
  }

  static async getBatchFiles(batchId: string) {
    return this.request(`/api/batch/${batchId}/files`);
  }

  // Scanning
  static async scanPackage(batchId: string, trackingNumber: string, variantName?: string) {
    return this.request('/api/batch/scan', {
      method: 'POST',
      body: JSON.stringify({
        batchId,
        trackingNumber,
        variantName,
      }),
    });
  }

  // Health check
  static async health() {
    return this.request('/health');
  }
}

export default ShipKitAPI;
