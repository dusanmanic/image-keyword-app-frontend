// Auth actions
export const setToken = (token) => ({
  type: 'SET_TOKEN',
  payload: token
});

export const setEmail = (email) => ({
  type: 'SET_EMAIL',
  payload: email
});

export const setAuthenticated = (isAuthenticated) => ({
  type: 'SET_AUTHENTICATED',
  payload: isAuthenticated
});

export const clearAuth = () => ({
  type: 'CLEAR_AUTH'
});

// Folders actions
export const setFolders = (folders) => ({
  type: 'SET_FOLDERS',
  payload: folders
});

export const addFolder = (folder) => ({
  type: 'ADD_FOLDER',
  payload: folder
});

export const updateFolder = (folder) => ({
  type: 'UPDATE_FOLDER',
  payload: folder
});

export const removeFolder = (folderId) => ({
  type: 'REMOVE_FOLDER',
  payload: folderId
});

export const setSelectedFolder = (folder) => ({
  type: 'SET_SELECTED_FOLDER',
  payload: folder
});

export const setFolderCounts = (counts) => ({
  type: 'SET_FOLDER_COUNTS',
  payload: counts
});

export const updateFolderCount = (folderId, count) => ({
  type: 'UPDATE_FOLDER_COUNT',
  payload: { folderId, count }
});

// UI actions
export const setLoading = (loading) => ({
  type: 'SET_LOADING',
  payload: loading
});

export const setError = (error) => ({
  type: 'SET_ERROR',
  payload: error
});

// UI global spinner
export const showSpinner = () => ({ type: 'UI_SHOW_SPINNER' });
export const hideSpinner = () => ({ type: 'UI_HIDE_SPINNER' });

// UI toast
export const showToast = (toast) => ({ type: 'UI_SHOW_TOAST', payload: toast }); // { type, message }
export const clearToast = () => ({ type: 'UI_CLEAR_TOAST' });
