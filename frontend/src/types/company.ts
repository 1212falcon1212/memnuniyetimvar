export interface Company {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  coverUrl: string | null;
  description: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  district: string | null;
  isVerified: boolean;
  isClaimed: boolean;
  status: "active" | "pending" | "hidden";
  avgRating: number;
  reviewCount: number;
  responseCount: number;
  responseRate: number;
  memnuniyetScore: number;
  categoryId: number | null;
}

export interface CompanyListItem {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  city: string | null;
  isVerified: boolean;
  avgRating: number;
  reviewCount: number;
  memnuniyetScore: number;
  categoryName: string | null;
}
