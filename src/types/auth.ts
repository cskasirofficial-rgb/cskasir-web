export type UserRole = 
  | "ENTERPRISE" 
  | "APLIKATOR" 
  | "OWNER" 
  | "MANAGER" 
  | "SUPERVISOR" 
  | "KASIR" 
  | "PELANGGAN";

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  groupId: string;
  storeId?: string;
  createdAt: number;
  updatedAt: number;
}