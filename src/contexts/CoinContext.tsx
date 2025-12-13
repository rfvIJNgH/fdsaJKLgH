import React, { createContext, useContext, useState, useEffect } from "react";
import { coinService } from "../services/api";

interface CoinData {
  userId: string;
  coins: number;
  lastUpdated: string;
}

interface CoinContextType {
  coinData: CoinData | null;
  loading: boolean;
  error: string | null;
  fetchCoinData: (userId: string) => Promise<void>;
  addCoins: (userId: string, coins: number) => Promise<void>;
  deductCoins: (userId: string, coins: number) => Promise<void>;
}

const CoinContext = createContext<CoinContextType | undefined>(undefined);

export const useCoin = () => {
  const context = useContext(CoinContext);
  if (context === undefined) {
    throw new Error("useCoin must be used within a CoinProvider");
  }
  return context;
};

export const CoinProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [coinData, setCoinData] = useState<CoinData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCoinData = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await coinService.getUserCoins(userId);
      setCoinData(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch coin data");
    } finally {
      setLoading(false);
    }
  };

  const addCoins = async (userId: string, coins: number) => {
    console.log("Coins", coins);
    setLoading(true);
    setError(null);
    try {
      const res = await coinService.addCoins(userId, coins);
      setCoinData(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add coins");
    } finally {
      setLoading(false);
    }
  };

  const deductCoins = async (userId: string, coins: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await coinService.deductCoins(userId, coins);
      setCoinData(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to deduct coins");
    } finally {
      setLoading(false);
    }
  };

  const value: CoinContextType = {
    coinData,
    loading,
    error,
    fetchCoinData,
    addCoins,
    deductCoins
  };

  return <CoinContext.Provider value={value}>{children}</CoinContext.Provider>;
};