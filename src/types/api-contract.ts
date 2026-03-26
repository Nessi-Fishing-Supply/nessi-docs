export interface RequestField {
  name: string;
  type: string;
  required: boolean;
}

export type ApiRole = 'Owner' | 'Manager' | 'Contributor' | 'Member' | 'None';

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description?: string;
  label?: string;
  why?: string;
  auth?: string;
  role?: ApiRole;
  errorCodes?: number[];
  permissions?: { feature: string; level: string };
  requestFields?: RequestField[];
  tags?: string[];
}

export interface ApiGroup {
  name: string;
  endpoints: ApiEndpoint[];
}
