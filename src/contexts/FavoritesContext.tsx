import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useFavorites } from '@/hooks/useFavorites';

interface FavoritesContextType {
  favorites: string[];
  loading: boolean;
  isFavorite: (propertyId: string) => boolean;
  toggleFavorite: (propertyId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { favorites, loading, isFavorite, toggleFavorite, refetch } = useFavorites();

  // Memoize context value to prevent re-renders in consumers when
  // the provider re-renders but favorites haven't actually changed.
  const value = useMemo<FavoritesContextType>(
    () => ({ favorites, loading, isFavorite, toggleFavorite, refetch }),
    [favorites, loading, isFavorite, toggleFavorite, refetch]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

const FAVORITES_DEFAULTS: FavoritesContextType = {
  favorites: [],
  loading: false,
  isFavorite: () => false,
  toggleFavorite: async () => {},
  refetch: async () => {},
};

export function useFavoritesContext() {
  const context = useContext(FavoritesContext);
  // Return safe defaults instead of throwing to prevent HMR crashes
  return context ?? FAVORITES_DEFAULTS;
}
