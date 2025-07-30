import { useState, useEffect } from 'react';

interface UserPreferences {
  name: string;
  email: string;
  phone: string;
}

const STORAGE_KEY = 'veld-dienst-user-preferences';

const defaultPreferences: UserPreferences = {
  name: '',
  email: '',
  phone: ''
};

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as UserPreferences;
        setPreferences({
          name: parsed.name || '',
          email: parsed.email || '',
          phone: parsed.phone || ''
        });
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = (newPreferences: Partial<UserPreferences>) => {
    try {
      const updated = { ...preferences, ...newPreferences };
      setPreferences(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  };

  // Clear all preferences
  const clearPreferences = () => {
    try {
      setPreferences(defaultPreferences);
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing user preferences:', error);
    }
  };

  return {
    preferences,
    savePreferences,
    clearPreferences,
    isLoaded
  };
};