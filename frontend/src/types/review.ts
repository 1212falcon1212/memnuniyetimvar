export interface Review {
  id: string;
  title: string;
  content: string;
  rating: number;
  slug: string;
  status: "pending" | "published" | "rejected" | "archived";
  isFeatured: boolean;
  viewCount: number;
  helpfulCount: number;
  publishedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
  company: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  images: ReviewImage[];
  tags: ReviewTag[];
  companyResponse: CompanyResponse | null;
}

export interface ReviewImage {
  id: string;
  imageUrl: string;
  thumbnailUrl: string | null;
}

export interface ReviewTag {
  id: number;
  name: string;
  slug: string;
}

export interface CompanyResponse {
  id: string;
  content: string;
  responderName: string | null;
  createdAt: string;
}
