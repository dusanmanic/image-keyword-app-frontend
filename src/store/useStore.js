import { useSelector, useDispatch } from 'react-redux';
import * as actions from './actions.js';

export function useStore() {
  const dispatch = useDispatch();

  // Select specific parts of state to avoid unnecessary rerenders
  const token = useSelector(state => state.token);
  const email = useSelector(state => state.email);
  const isAuthenticated = useSelector(state => state.isAuthenticated);
  const openAiApiKey = useSelector(state => state.openAiApiKey);
  const folders = useSelector(state => state.folders);
  const selectedFolder = useSelector(state => state.selectedFolder);
  const loading = useSelector(state => state.loading);
  const error = useSelector(state => state.error);
  const uiLoading = useSelector(state => state.uiLoading);
  const toast = useSelector(state => state.toast);

  return {
    // State
    token,
    email,
    isAuthenticated,
    openAiApiKey,
    folders,
    selectedFolder,
    loading,
    error,
    uiLoading,
    toast,
    
    // Actions
    setToken: (token) => dispatch(actions.setToken(token)),
    setEmail: (email) => dispatch(actions.setEmail(email)),
    setAuthenticated: (isAuthenticated) => dispatch(actions.setAuthenticated(isAuthenticated)),
    clearAuth: () => dispatch(actions.clearAuth()),
    setOpenAiApiKey: (apiKey) => dispatch(actions.setOpenAiApiKey(apiKey)),
    setFolders: (folders) => dispatch(actions.setFolders(folders)),
    addFolder: (folder) => dispatch(actions.addFolder(folder)),
    updateFolder: (folder) => dispatch(actions.updateFolder(folder)),
    removeFolder: (folderId) => dispatch(actions.removeFolder(folderId)),
    setSelectedFolder: (folder) => dispatch(actions.setSelectedFolder(folder)),
    setLoading: (loading) => dispatch(actions.setLoading(loading)),
    setError: (error) => dispatch(actions.setError(error)),
    showSpinner: () => dispatch(actions.showSpinner()),
    hideSpinner: () => dispatch(actions.hideSpinner()),
    showToast: (toast) => dispatch(actions.showToast(toast)),
    clearToast: () => dispatch(actions.clearToast())
  };
}
