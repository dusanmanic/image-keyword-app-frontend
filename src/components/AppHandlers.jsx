import React from "react";
import { embedExifIntoJpegBlob } from "../utils/metadataEmbedding.js";
import localforage from "localforage";

// Cache directory handle within module scope for the session
let cachedDirHandle = null;
let cachedDirFolderId = null;

// Function to get directory handle with smart caching per folder
async function getDirectoryHandle(folderId = null) {
  if (!window.showDirectoryPicker) {
    throw new Error('FSAPI_UNAVAILABLE');
  }
  
  // First try to use cached handle from session (only if it's for the same folder)
  if (cachedDirHandle && cachedDirFolderId === folderId) {
    try {
      const perm = await cachedDirHandle.queryPermission({ mode: 'readwrite' });
      if (perm === 'granted') return cachedDirHandle;
      const req = await cachedDirHandle.requestPermission({ mode: 'readwrite' });
      if (req === 'granted') return cachedDirHandle;
    } catch {}
  }
  
  // Check if we have a recent directory selection for this specific folder
  const storageKey = folderId ? `last_directory_${folderId}` : 'last_directory_default';
  const timestampKey = folderId ? `last_directory_picked_${folderId}` : 'last_directory_picked_default';
  
  try {
    const lastPicked = await localforage.getItem(timestampKey);
    const lastDirName = await localforage.getItem(storageKey);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    if (lastPicked && lastDirName && (now - lastPicked) < oneDay) {
      // Show a message that we'll use the last directory for this folder
      console.log(`Using last selected directory for folder ${folderId || 'default'}: ${lastDirName}`);
    }
  } catch {}
  
  // Ask user to pick directory and cache it
  cachedDirHandle = await window.showDirectoryPicker();
  cachedDirFolderId = folderId; // Remember which folder this handle is for
  
  // Save directory info for this specific folder
  try {
    await localforage.setItem(storageKey, cachedDirHandle.name);
    await localforage.setItem(timestampKey, Date.now());
  } catch {}
  
  return cachedDirHandle;
}

export function useEmbedToFolder() {
  const embedOneToFolder = React.useCallback(async ({ blob, name, title, description, keywords, overwrite = true, folderId = null, retryCount = 0 }) => {
    const dir = await getDirectoryHandle(folderId);
    const isJpeg = blob && ((blob.type && /jpeg|jpg/i.test(blob.type)) || (name && /\.jpe?g$/i.test(name)));
    if (!isJpeg) {
      throw new Error('UNSUPPORTED_TYPE');
    }
    
    const base = (name || 'image').replace(/\.[^.]+$/, '');
    const ext = (name && name.match(/\.jpe?g$/i)) ? name.split('.').pop() : 'jpg';
    const fileName = `${base}.${ext.toLowerCase()}`;

    // Always try to read the original file from the directory first
    let sourceBlob;
    try {
      const existingFile = await dir.getFileHandle(fileName, { create: false });
      const originalFile = await existingFile.getFile();
      sourceBlob = originalFile;
    } catch {
      // File doesn't exist in this directory
      if (retryCount === 0) {
        // Clear cached directory and try again with new selection
        try {
          const storageKey = folderId ? `last_directory_${folderId}` : 'last_directory_default';
          const timestampKey = folderId ? `last_directory_picked_${folderId}` : 'last_directory_picked_default';
          await localforage.removeItem(storageKey);
          await localforage.removeItem(timestampKey);
        } catch {}
        
        // Clear session cache
        cachedDirHandle = null;
        cachedDirFolderId = null;
        
        // Try again with new directory selection
        return embedOneToFolder({ blob, name, title, description, keywords, overwrite, folderId, retryCount: 1 });
      } else {
        throw new Error('FILE_NOT_IN_FOLDER');
      }
    }
    
    const withExif = await embedExifIntoJpegBlob(sourceBlob, { title, description, keywords });

    let outFile = null;
    try {
      if (overwrite) {
        // Try remove existing entry silently
        const fh = await dir.getFileHandle(fileName, { create: false }).catch(() => null);
        if (fh) {
          try { await dir.removeEntry(fileName, { recursive: false }); } catch {}
        }
      }
      outFile = await dir.getFileHandle(fileName, { create: true });
    } catch (e) {
      // Fallback: try create anyway
      outFile = await dir.getFileHandle(fileName, { create: true });
    }

    const writable = await outFile.createWritable();
    await writable.write(withExif);
    await writable.close();
    return true;
  }, []);

  return { embedOneToFolder };
}


