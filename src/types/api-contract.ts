export interface RequestField {
  name: string;
  type: string;
  required: boolean;
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description?: string;
  label?: string;
  why?: string;
  auth?: string;
  errorCodes?: number[];
  permissions?: { feature: string; level: string };
  requestFields?: RequestField[];
  tags?: string[];
}

export interface ApiGroup {
  name: string;
  endpoints: ApiEndpoint[];
}
