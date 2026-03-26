export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  why?: string;
}

export interface ApiGroup {
  name: string;
  endpoints: ApiEndpoint[];
}
