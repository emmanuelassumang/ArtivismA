import { NextPage } from 'next';

// Extend the Next.js PageProps to work with our file-based routing
declare module 'next' {
  export interface PageProps {
    params?: {
      [key: string]: string;
    };
    searchParams?: {
      [key: string]: string | string[] | undefined;
    };
  }
}

// Provide better types for dynamic routes
declare module 'next/navigation' {
  export interface DynamicRouteParams {
    id?: string;
    userId?: string;
    artworkId?: string;
    [key: string]: string | undefined;
  }
}