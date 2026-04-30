import { useState, useEffect, useCallback } from 'react';
import { productApi } from '@/services/products';
import { ProductListResponse, Product, PriceOptimizationResponse, OptimizationRequest } from '@/types';

interface UseProductsParams {
  skip?: number;
  limit?: number;
  category?: string;
  search?: string;
}

export function useProducts(params: UseProductsParams = {}) {
  const [data, setData] = useState<ProductListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await productApi.getProducts(params);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [params.skip, params.limit, params.category, params.search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useProduct(id: number) {
  const [data, setData] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await productApi.getProduct(id);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [fetchData, id]);

  return { data, loading, error, refetch: fetchData };
}

export function useCategories() {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await productApi.getCategories();
      setCategories(result.categories);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { categories, loading, error, refetch: fetchData };
}

export function usePriceOptimization() {
  const [result, setResult] = useState<PriceOptimizationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const optimize = useCallback(async (request: OptimizationRequest) => {
    try {
      setLoading(true);
      setError(null);
      const response = await productApi.optimizePrices(request);
      setResult(response);
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const applyOptimizations = useCallback(async (optimizationIds?: number[]) => {
    try {
      setLoading(true);
      const response = await productApi.applyOptimizations(optimizationIds);
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, optimize, applyOptimizations };
}

export function useProductStats() {
  const [stats, setStats] = useState<{
    total_products: number;
    active_products: number;
    avg_price: number;
    avg_demand_score: number;
    low_stock_products: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await productApi.getProductStats() as {
        total_products: number;
        active_products: number;
        avg_price: number;
        avg_demand_score: number;
        low_stock_products: number;
      };
      setStats(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { stats, loading, error, refetch: fetchData };
}
