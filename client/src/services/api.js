const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('smartmedi_token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to login');
    return data;
  },

  async register(payload) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to register');
    return data;
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch user');
    return data;
  },

  async updateProfile(payload) {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile');
    return data;
  },

  async updateLanguage(language) {
    const res = await fetch(`${API_BASE}/auth/language`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ language })
    });
    return res.json();
  },

  // Medicines
  async getMedicines(patientId = null) {
    const url = patientId ? `${API_BASE}/medicines?patientId=${patientId}` : `${API_BASE}/medicines`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch medicines');
    return data;
  },

  async addMedicine(payload) {
    const res = await fetch(`${API_BASE}/medicines`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add medicine');
    return data;
  },

  async addMedicinesBatch(medicines) {
    const res = await fetch(`${API_BASE}/medicines/batch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ medicines })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to batch add medicines');
    return data;
  },

  async updateMedicine(id, payload) {
    const res = await fetch(`${API_BASE}/medicines/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update medicine');
    return data;
  },

  async deleteMedicine(id) {
    const res = await fetch(`${API_BASE}/medicines/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete medicine');
    return data;
  },

  // Doses
  async getTodayDoses(patientId = null) {
    const url = patientId ? `${API_BASE}/doses/today?patientId=${patientId}` : `${API_BASE}/doses/today`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch doses');
    return data;
  },

  async updateDoseStatus(id, status, skipped_reason = null) {
    const res = await fetch(`${API_BASE}/doses/${id}/status`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, skipped_reason })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update dose');
    return data;
  },

  async getDoseHistory(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/doses/history?${query}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async syncCheck() {
    return fetch(`${API_BASE}/doses/sync-check`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
  },

  // Inventory
  async getInventory(patientId = null) {
    const url = patientId ? `${API_BASE}/inventory?patientId=${patientId}` : `${API_BASE}/inventory`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch inventory');
    return data;
  },

  async refillStock(medicineId, payload) {
    const res = await fetch(`${API_BASE}/inventory/${medicineId}/refill`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to refill stock');
    return data;
  },

  // Analytics
  async getAdherenceAnalytics(days = 7, patientId = null) {
    let url = `${API_BASE}/analytics/adherence?days=${days}`;
    if (patientId) url += `&patientId=${patientId}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch analytics');
    return data;
  },

  // Caregiver
  async generatePairingCode() {
    const res = await fetch(`${API_BASE}/caregiver/generate-code`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate code');
    return data;
  },

  async getMyCaregivers() {
    const res = await fetch(`${API_BASE}/caregiver/my-caregivers`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async linkPatient(pairingCode) {
    const res = await fetch(`${API_BASE}/caregiver/link-patient`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ pairingCode })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to link patient');
    return data;
  },

  async getCaregiverPatients() {
    const res = await fetch(`${API_BASE}/caregiver/patients`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch patients');
    return data;
  },

  async unlinkPatient(patientId) {
    const res = await fetch(`${API_BASE}/caregiver/unlink/${patientId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Notifications
  async getNotifications(unreadOnly = false) {
    const res = await fetch(`${API_BASE}/notifications?unread=${unreadOnly}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async markNotificationRead(id) {
    return fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
  },

  async markAllNotificationsRead() {
    return fetch(`${API_BASE}/notifications/mark-all-read`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
  }
};

