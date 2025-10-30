/**
 * IPFS Upload Service
 * Handles document uploads to IPFS via Pinata or OASIS API
 */

import { API_CONFIG } from '@/lib/config';

export type UploadResult = {
  url: string;
  hash: string;
  size: number;
  fileName: string;
};

/**
 * Upload a file to IPFS via the OASIS API
 * (Same approach as nft-mint-frontend)
 */
export async function uploadFileToIPFS(
  file: File,
  oasisBaseUrl?: string,
  authToken?: string
): Promise<UploadResult> {
  try {
    console.log('📤 Uploading file to IPFS:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`);
    
    // Convert file to base64
    const base64 = await fileToBase64(file);
    
    // Use OASIS API endpoint (same as nft-mint-frontend)
    const baseUrl = oasisBaseUrl || API_CONFIG.OASIS_API;
    const endpoint = `${baseUrl}/api/pinata/upload-file`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify({
        base64,
        fileName: file.name,
        contentType: file.type || 'application/octet-stream'
      })
    });
    
    const result = await response.json();
    
    if (!response.ok || result.isError) {
      throw new Error(result.message || 'Failed to upload to IPFS');
    }
    
    const ipfsUrl = result.result;
    const ipfsHash = extractIPFSHash(ipfsUrl);
    
    console.log('✅ File uploaded to IPFS:', ipfsHash);
    
    return {
      url: ipfsUrl,
      hash: ipfsHash,
      size: file.size,
      fileName: file.name
    };
    
  } catch (error) {
    console.error('❌ IPFS upload failed:', error);
    throw new Error(`Failed to upload ${file.name}: ${(error as Error).message}`);
  }
}

/**
 * Upload multiple files to IPFS
 */
export async function uploadFilesToIPFS(
  files: File[],
  oasisBaseUrl?: string,
  authToken?: string
): Promise<UploadResult[]> {
  console.log(`📤 Uploading ${files.length} files to IPFS...`);
  
  const uploads = files.map(file => uploadFileToIPFS(file, oasisBaseUrl, authToken));
  const results = await Promise.all(uploads);
  
  console.log(`✅ All ${files.length} files uploaded successfully`);
  return results;
}

/**
 * Upload JSON metadata to IPFS
 */
export async function uploadMetadataToIPFS(
  metadata: any,
  name: string,
  oasisBaseUrl?: string,
  authToken?: string
): Promise<UploadResult> {
  try {
    console.log('📤 Uploading metadata to IPFS:', name);
    
    const baseUrl = oasisBaseUrl || API_CONFIG.OASIS_API;
    const endpoint = `${baseUrl}/api/pinata/upload-json`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify({
        content: metadata,
        name
      })
    });
    
    const result = await response.json();
    
    if (!response.ok || result.isError) {
      throw new Error(result.message || 'Failed to upload metadata to IPFS');
    }
    
    const ipfsUrl = result.result;
    const ipfsHash = extractIPFSHash(ipfsUrl);
    
    console.log('✅ Metadata uploaded to IPFS:', ipfsHash);
    
    const metadataString = JSON.stringify(metadata);
    
    return {
      url: ipfsUrl,
      hash: ipfsHash,
      size: new Blob([metadataString]).size,
      fileName: `${name}.json`
    };
    
  } catch (error) {
    console.error('❌ Metadata upload failed:', error);
    throw new Error(`Failed to upload metadata: ${(error as Error).message}`);
  }
}

/**
 * Fallback: Direct Pinata API upload (if you have Pinata API keys)
 */
export async function uploadToPinataDirect(
  file: File,
  pinataApiKey?: string,
  pinataSecretKey?: string
): Promise<UploadResult> {
  if (!pinataApiKey || !pinataSecretKey) {
    throw new Error('Pinata API credentials not configured');
  }
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const metadata = JSON.stringify({
      name: file.name,
    });
    formData.append('pinataMetadata', metadata);
    
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretKey,
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Pinata upload failed');
    }
    
    const ipfsHash = result.IpfsHash;
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    
    return {
      url: ipfsUrl,
      hash: ipfsHash,
      size: file.size,
      fileName: file.name
    };
    
  } catch (error) {
    console.error('❌ Pinata direct upload failed:', error);
    throw error;
  }
}

/**
 * Simulated IPFS upload for testing (when OASIS API unavailable)
 */
export async function uploadFileSimulated(file: File): Promise<UploadResult> {
  console.warn('⚠️ Using simulated IPFS upload - replace with real implementation!');
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  
  // Generate fake IPFS hash
  const fakeHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  const fakeUrl = `https://ipfs.io/ipfs/${fakeHash}`;
  
  console.log('✅ File "uploaded" (simulated):', fakeHash);
  
  return {
    url: fakeUrl,
    hash: fakeHash,
    size: file.size,
    fileName: file.name
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 part (remove data:image/png;base64, prefix)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });
}

function extractIPFSHash(ipfsUrl: string): string {
  // Extract hash from URLs like:
  // https://gateway.pinata.cloud/ipfs/QmXXX
  // https://ipfs.io/ipfs/QmXXX
  const match = ipfsUrl.match(/\/ipfs\/([a-zA-Z0-9]+)/);
  return match ? match[1] : ipfsUrl;
}

/**
 * Validate file type and size
 */
export function validateDocumentFile(file: File): { valid: boolean; error?: string } {
  // Check file size (max 10 MB for documents)
  const maxSize = 10 * 1024 * 1024; // 10 MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds 10 MB (${(file.size / 1024 / 1024).toFixed(2)} MB)`
    };
  }
  
  // Check file type (PDF, DOC, DOCX)
  const allowedTypes = [
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
  ];
  
  const allowedExtensions = ['.pdf', '.doc', '.docx'];
  const hasValidType = allowedTypes.includes(file.type);
  const hasValidExtension = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  
  if (!hasValidType && !hasValidExtension) {
    return {
      valid: false,
      error: 'File must be PDF, DOC, or DOCX format'
    };
  }
  
  return { valid: true };
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file size (max 25 MB for images)
  const maxSize = 25 * 1024 * 1024; // 25 MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds 25 MB (${(file.size / 1024 / 1024).toFixed(2)} MB)`
    };
  }
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  
  const hasValidType = allowedTypes.includes(file.type);
  const hasValidExtension = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  
  if (!hasValidType && !hasValidExtension) {
    return {
      valid: false,
      error: 'Image must be JPG, PNG, GIF, or WEBP format'
    };
  }
  
  return { valid: true };
}


