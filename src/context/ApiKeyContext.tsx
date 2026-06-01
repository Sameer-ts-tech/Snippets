import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ApiKeyContextType {
  geminiKey: string | null;
  selectedModel: string;
  saveGeminiKey: (key: string) => Promise<void>;
  deleteGeminiKey: () => Promise<void>;
  setSelectedModel: (model: string) => Promise<void>;
  isApiKeyConfigured: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

const SECURE_KEY = 'devpocket_gemini_api_key';
const MODEL_KEY = 'devpocket_selected_model';

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
  const [geminiKey, setGeminiKey] = useState<string | null>(null);
  const [selectedModel, setSelectedModelRaw] = useState<string>('gemini-2.5-flash');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const key = await SecureStore.getItemAsync(SECURE_KEY);
        setGeminiKey(key);

        const model = await AsyncStorage.getItem(MODEL_KEY);
        if (model) {
          setSelectedModelRaw(model);
        }
      } catch (e) {
        console.error('Failed to load secure API key', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredData();
  }, []);

  const saveGeminiKey = async (key: string) => {
    try {
      await SecureStore.setItemAsync(SECURE_KEY, key);
      setGeminiKey(key);
    } catch (e) {
      console.error('Failed to save secure key', e);
      throw e;
    }
  };

  const deleteGeminiKey = async () => {
    try {
      await SecureStore.deleteItemAsync(SECURE_KEY);
      setGeminiKey(null);
    } catch (e) {
      console.error('Failed to delete secure key', e);
      throw e;
    }
  };

  const setSelectedModel = async (model: string) => {
    try {
      await AsyncStorage.setItem(MODEL_KEY, model);
      setSelectedModelRaw(model);
    } catch (e) {
      console.error('Failed to save selected model', e);
    }
  };

  return (
    <ApiKeyContext.Provider
      value={{
        geminiKey,
        selectedModel,
        saveGeminiKey,
        deleteGeminiKey,
        setSelectedModel,
        isApiKeyConfigured: !!geminiKey,
      }}
    >
      {!isLoading && children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const context = useContext(ApiKeyContext);
  if (!context) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
}
