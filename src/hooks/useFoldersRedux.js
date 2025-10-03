import { useCallback } from 'react';
import { useStore } from '../store/index.js';
import { useApi } from './useApi.js';

export function useFoldersRedux() {
  const { 
    folders, 
    selectedFolder, 
    loading, 
    error,
    setFolders, 
    addFolder, 
    updateFolder, 
    removeFolder, 
    setSelectedFolder,
    setLoading,
    setError
  } = useStore();
  
  const { getFolders, saveFolder: apiSaveFolder, deleteFolder: apiDeleteFolder } = useApi();

  // Load folders function
  const loadFolders = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const foldersData = await getFolders();
      setFolders(foldersData);
    } catch (error) {
      console.error('Error loading folders:', error);
      setError('Failed to load folders');
      // Don't clear folders on error to maintain UI stability
      if (forceRefresh) {
        setFolders([]);
      }
    } finally {
      setLoading(false);
    }
  }, [getFolders, setFolders, setLoading, setError]);

  // Save/Update folder function
  const saveFolder = async (folder, isUpdate = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const savedFolder = await apiSaveFolder(folder);
      
      // Update folders array
      let updatedFolders;
      if (isUpdate) {
        // Update existing folder
        updatedFolders = folders.map(f => 
          f.id === savedFolder.id ? savedFolder : f
        );
      } else {
        // Add new folder at the beginning
        updatedFolders = [savedFolder, ...folders];
      }
      setFolders(updatedFolders);

      return updatedFolders;
    } catch (error) {
      setError(error.message || `Failed to ${isUpdate ? 'update' : 'save'} folder`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Delete folder function
  const deleteFolder = async (folderId) => {
    try {
      setLoading(true);
      setError(null);
      
      await apiDeleteFolder(folderId);
      
      // Remove folder from array
      const updatedFolders = folders.filter(f => f.id !== folderId);
      setFolders(updatedFolders);

      return updatedFolders;
    } catch (error) {
      setError(error.message || 'Failed to delete folder');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    folders: folders || [],
    selectedFolder,
    loading,
    error,
    
    // Functions
    loadFolders,
    saveFolder,
    deleteFolder,
    removeFolder,
    setSelectedFolder,
    setFolders
  };
}
