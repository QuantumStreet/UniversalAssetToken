"use client";

import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton, WalletDisconnectButton } from '@solana/wallet-adapter-react-ui';

export function WalletButton() {
  const { wallet, connected } = useWallet();

  return (
    <div className="flex items-center gap-2">
      {connected ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg bg-green-500/20 px-3 py-2 text-green-400">
            <div className="h-2 w-2 rounded-full bg-green-400"></div>
            <span className="text-sm font-medium">
              {wallet?.adapter.name} Connected
            </span>
          </div>
          <WalletDisconnectButton className="!bg-red-500/20 !text-red-400 hover:!bg-red-500/30" />
        </div>
      ) : (
        <WalletMultiButton className="!bg-blue-500/20 !text-blue-400 hover:!bg-blue-500/30" />
      )}
    </div>
  );
}

export function WalletStatus() {
  const { wallet, connected, publicKey } = useWallet();

  if (!connected) {
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
        {wallet?.adapter.name} Connected
      </span>
      <span className="text-xs text-gray-400">
        {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}
      </span>
      <a
        href={`https://explorer.solana.com/address/${publicKey?.toBase58()}?cluster=devnet`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-400 hover:text-blue-300"
      >
        View on Explorer
      </a>
    </div>
  );
}
