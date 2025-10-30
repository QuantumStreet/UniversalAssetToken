"use client";

import React, { useState } from 'react';
import { usePhantomWallet } from '@/hooks/usePhantomWallet';
import { Button } from '@/components/ui/button';

export function WalletButton() {
  const { 
    connectPhantomWallet, 
    disconnectWallet, 
    publicKey, 
    walletDenied, 
    errorMessage,
    isPhantomInstalled 
  } = usePhantomWallet();

  if (publicKey) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg bg-green-500/20 px-3 py-2 text-green-400">
          <div className="h-2 w-2 rounded-full bg-green-400"></div>
          <span className="text-sm font-medium">
            Phantom Connected
          </span>
        </div>
        <Button 
          onClick={disconnectWallet}
          className="!bg-red-500/20 !text-red-400 hover:!bg-red-500/30"
          size="sm"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  if (!isPhantomInstalled) {
    return (
      <Button 
        onClick={() => window.open('https://phantom.app', '_blank')}
        className="!bg-blue-500/20 !text-blue-400 hover:!bg-blue-500/30"
      >
        Install Phantom
      </Button>
    );
  }

  return (
    <Button 
      onClick={connectPhantomWallet}
      className="!bg-blue-500/20 !text-blue-400 hover:!bg-blue-500/30"
    >
      Connect Phantom
    </Button>
  );
}

export function WalletStatus() {
  const { publicKey, walletDenied, errorMessage, isPhantomInstalled } = usePhantomWallet();

  if (!isPhantomInstalled) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2">
        <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
        <span className="text-sm text-yellow-400">
          Phantom wallet not detected
        </span>
      </div>
    );
  }

  if (walletDenied || errorMessage) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
        <div className="h-2 w-2 rounded-full bg-red-400"></div>
        <span className="text-sm text-red-400">
          {errorMessage || "Connection failed"}
        </span>
      </div>
    );
  }

  if (!publicKey) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2">
        <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
        <span className="text-sm text-yellow-400">
          Connect your Solana wallet to mint tokens
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2">
      <div className="h-2 w-2 rounded-full bg-green-400"></div>
      <span className="text-sm text-green-400">
        Phantom Connected
      </span>
      <span className="text-xs text-gray-400">
        {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
      </span>
      <a
        href={`https://explorer.solana.com/address/${publicKey}?cluster=devnet`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-400 hover:text-blue-300"
      >
        View on Explorer
      </a>
    </div>
  );
}
