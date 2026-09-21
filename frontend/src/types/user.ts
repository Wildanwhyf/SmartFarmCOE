export type UserStatus = "Active" | "Inactive";

export interface FarmerUser {
  id: string;
  name: string;
  email: string;
  role: "Farmer";
  status: UserStatus;
}