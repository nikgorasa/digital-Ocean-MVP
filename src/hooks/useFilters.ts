"use client";

import { useState, useCallback, useMemo } from "react";
import {
  HotelFilters,
  FlightFilters,
  DEFAULT_HOTEL_FILTERS,
  DEFAULT_FLIGHT_FILTERS,
} from "@/lib/ai/filters/types";

interface UseFiltersReturn<T> {
  filters: T;
  setFilters: React.Dispatch<React.SetStateAction<T>>;
  updateFilter: <K extends keyof T>(key: K, value: T[K]) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
}

export function useHotelFilters(): UseFiltersReturn<HotelFilters> {
  const [filters, setFilters] = useState<HotelFilters>({ ...DEFAULT_HOTEL_FILTERS });

  const updateFilter = useCallback(<K extends keyof HotelFilters>(key: K, value: HotelFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_HOTEL_FILTERS });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.starRating.length > 0 ||
      filters.amenities.length > 0 ||
      filters.propertyType.length > 0 ||
      filters.freeCancellation ||
      filters.mealPlan.length > 0 ||
      filters.priceRange[0] > 0 ||
      filters.priceRange[1] < 100000
    );
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.starRating.length > 0) count++;
    if (filters.amenities.length > 0) count++;
    if (filters.propertyType.length > 0) count++;
    if (filters.freeCancellation) count++;
    if (filters.mealPlan.length > 0) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 100000) count++;
    return count;
  }, [filters]);

  return { filters, setFilters, updateFilter, resetFilters, hasActiveFilters, activeFilterCount };
}

export function useFlightFilters(): UseFiltersReturn<FlightFilters> {
  const [filters, setFilters] = useState<FlightFilters>({ ...DEFAULT_FLIGHT_FILTERS });

  const updateFilter = useCallback(<K extends keyof FlightFilters>(key: K, value: FlightFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FLIGHT_FILTERS });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.stops.length > 0 ||
      filters.airlines.length > 0 ||
      filters.departureTime.length > 0 ||
      filters.maxDuration < 24 ||
      filters.priceRange[0] > 0 ||
      filters.priceRange[1] < 100000
    );
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.stops.length > 0) count++;
    if (filters.airlines.length > 0) count++;
    if (filters.departureTime.length > 0) count++;
    if (filters.maxDuration < 24) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 100000) count++;
    return count;
  }, [filters]);

  return { filters, setFilters, updateFilter, resetFilters, hasActiveFilters, activeFilterCount };
}
