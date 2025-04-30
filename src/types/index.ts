// Common types for the application

export interface User {
  _id: string;
  username: string;
  email: string;
  profile_image?: string;
}

export interface Artwork {
  _id: string;
  name: string;
  description?: string;
  artists?: string[];
  themes?: string[];
  image_url?: string;
  artwork_url?: string;
  location: {
    coordinates: [number, number];
    city?: string;
    address?: string;
    country?: string;
  };
  interactions?: {
    likes_count: number;
    comments: Comment[];
  };
  likes?: string[];
  comments?: Comment[];
  accessibility?: {
    wheelchair_accessible?: boolean;
    audio_descriptions?: boolean;
    low_mobility_friendly?: boolean;
    child_friendly?: boolean;
  };
}

export interface Comment {
  user_id: string;
  comment_text: string;
  timestamp: Date;
}

export interface Tour {
  _id: string;
  name: string;
  description?: string;
  creator_id: string;
  artworks: string[] | Artwork[];
  created_at: Date;
  updated_at?: Date;
  is_optimized?: boolean;
  total_distance?: number;
  estimated_time?: number;
}