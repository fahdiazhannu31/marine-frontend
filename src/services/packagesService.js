import { api } from './api';

export async function fetchPackages() {
  return api.get('/api/packages');
}

export async function fetchPackageDetail(id) {
  return api.get(`/api/packages/${id}`);
}
