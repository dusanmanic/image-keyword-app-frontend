import { createStore } from 'redux';

// Initial state
const initialState = {
  // Auth
  token: '',
  email: '',
  isAuthenticated: false,
  
  // Folders
  folders: [],
  selectedFolder: null,
  
  // UI
  loading: false,
  error: null,
  uiLoading: false,
  toast: null
};

// Reducer
const reducer = (state = initialState, action) => {
  switch (action.type) {
    // Auth actions
    case 'SET_TOKEN':
      return { ...state, token: action.payload };
    case 'SET_EMAIL':
      return { ...state, email: action.payload };
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    case 'CLEAR_AUTH':
      return { ...state, token: '', email: '', isAuthenticated: false };
    
    // Folders actions
    case 'SET_FOLDERS':
      return { ...state, folders: action.payload };
    case 'ADD_FOLDER':
      return { ...state, folders: [...state.folders, action.payload] };
    case 'UPDATE_FOLDER':
      return {
        ...state,
        folders: state.folders.map(folder =>
          folder.id === action.payload.id ? action.payload : folder
        )
      };
    case 'REMOVE_FOLDER':
      return {
        ...state,
        folders: state.folders.filter(folder => folder.id !== action.payload)
      };
    case 'SET_SELECTED_FOLDER':
      return { ...state, selectedFolder: action.payload };
    
    // UI actions
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'UI_SHOW_SPINNER':
      return { ...state, uiLoading: action.payload };
    case 'UI_HIDE_SPINNER':
      return { ...state, uiLoading: false };
    case 'UI_SHOW_TOAST':
      return { ...state, toast: action.payload };
    case 'UI_CLEAR_TOAST':
      return { ...state, toast: null };
    
    default:
      return state;
  }
};

// Create store
const store = createStore(reducer);

export default store;
