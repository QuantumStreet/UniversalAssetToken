"use client";

import { useCallback } from "react";
import { API_CONFIG } from "@/lib/config";

export function useContractApi() {
  const generateContract = useCallback(async (
    spec: any,
    language: 'Solidity' | 'Rust' | 'Scrypto'
  ): Promise<Blob> => {
    const jsonBlob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
    const jsonFile = new File([jsonBlob], 'contract-spec.json', { type: 'application/json' });
    
    const formData = new FormData();
    formData.append('JsonFile', jsonFile);
    formData.append('Language', language);

    const response = await fetch(`${API_CONFIG.CONTRACT_API}/api/v1/contracts/generate`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Contract generation failed: ${response.status}`);
    }

    return await response.blob();
  }, []);

  const compileContract = useCallback(async (
    contractCode: string,
    language: 'Solidity' | 'Rust' | 'Scrypto',
    filename: string
  ): Promise<Blob> => {
    const contractBlob = new Blob([contractCode], { type: 'text/plain' });
    const contractFile = new File([contractBlob], filename);
    
    const formData = new FormData();
    formData.append('Language', language);
    formData.append('Source', contractFile);

    const response = await fetch(`${API_CONFIG.CONTRACT_API}/api/v1/contracts/compile`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Compilation failed: ${response.status}`);
    }

    return await response.blob();
  }, []);

  const deployContract = useCallback(async (
    compiledBlob: Blob,
    language: 'Solidity' | 'Rust' | 'Scrypto',
    schema?: string
  ): Promise<any> => {
    const formData = new FormData();
    formData.append('Language', language);
    formData.append('CompiledContractFile', compiledBlob);
    
    if (schema) {
      const schemaBlob = new Blob([schema], { type: 'application/json' });
      formData.append('Schema', schemaBlob);
    }

    const response = await fetch(`${API_CONFIG.CONTRACT_API}/api/v1/contracts/deploy`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Deployment failed: ${response.status}`);
    }

    return await response.json();
  }, []);

  const generateWithAI = useCallback(async (
    description: string,
    blockchain: 'ethereum' | 'solana' | 'radix',
    additionalContext?: any
  ): Promise<Blob> => {
    const response = await fetch(`${API_CONFIG.AI_API}/api/v1/contracts/generate-from-description`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description,
        blockchain,
        additionalContext: additionalContext ? JSON.stringify(additionalContext) : undefined
      })
    });

    if (!response.ok) {
      throw new Error(`AI generation failed: ${response.status}`);
    }

    return await response.blob();
  }, []);

  return {
    generateContract,
    compileContract,
    deployContract,
    generateWithAI
  };
}


