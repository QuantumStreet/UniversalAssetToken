"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export function WalletButton() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Check if wallet is already connected
    const checkWallet = async () => {
      const wallet = (window as any).solana;
      if (wallet?.isConnected) {
        setWalletAddress(wallet.publicKey.toBase58());
      }
    };
    
    checkWallet();
    
    // Listen for wallet changes
    const wallet = (window as any).solana;
    if (wallet) {
      wallet.on('connect', () => {
        setWalletAddress(wallet.publicKey.toBase58());
      });
      wallet.on('disconnect', () => {
        setWalletAddress(null);
      });
      wallet.on('accountChanged', (publicKey: any) => {
        if (publicKey) {
          setWalletAddress(publicKey.toBase58());
        } else {
          setWalletAddress(null);
        }
      });
    }
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const wallet = (window as any).solana;
      
      if (!wallet) {
        const shouldInstall = window.confirm(
          'No Solana wallet detected. Would you like to install Phantom wallet?'
        );
        if (shouldInstall) {
          window.open('https://phantom.app', '_blank');
        }
        return;
      }
      
      await wallet.connect();
      setWalletAddress(wallet.publicKey.toBase58());
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet: ' + (error as Error).message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const wallet = (window as any).solana;
      if (wallet) {
        await wallet.disconnect();
        setWalletAddress(null);
      }
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  if (walletAddress) {
    return (
      <div className="flex items-center gap-2">
        <div className="rounded-lg border border-green-500/30 bg-green-900/10 px-3 py-1.5">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <code className="text-xs text-[var(--color-foreground)] font-mono">
              {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
            </code>
          </div>
        </div>
        <Button
          onClick={handleDisconnect}
          variant="ghost"
          className="px-2 py-1 text-xs text-[var(--muted)] hover:text-red-400"
        >
          <LogOut className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      className={cn(
        "border border-[var(--accent)]/50 bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20",
        "px-4 py-2 text-sm rounded-lg transition-all"
      )}
    >
      {isConnecting ? (
        <>
          <Wallet className="h-4 w-4 mr-2 animate-pulse" />
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="h-4 w-4 mr-2" />
          Connect Wallet
        </>
      )}
    </Button>
  );
}

/**
 * Wallet status indicator
 */
export function WalletStatus() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<string>('Unknown');

  useEffect(() => {
    const checkWallet = () => {
      const wallet = (window as any).solana;
      if (wallet?.isConnected) {
        setWalletAddress(wallet.publicKey.toBase58());
        setWalletType(wallet.isPhantom ? 'Phantom' : wallet.isSolflare ? 'Solflare' : 'Unknown');
      }
    };
    
    checkWallet();
    
    const wallet = (window as any).solana;
    if (wallet) {
      wallet.on('connect', checkWallet);
      wallet.on('disconnect', () => {
        setWalletAddress(null);
        setWalletType('Unknown');
      });
    }
  }, []);

  if (!walletAddress) {
    return (
      <div className="rounded-xl border border-yellow-500/30 bg-yellow-900/10 p-4">
        <div className="flex items-center gap-3">
          <Wallet className="h-5 w-5 text-yellow-400" />
          <div>
            <p className="text-sm font-semibold text-[var(--color-foreground)]">
              No Wallet Connected
            </p>
            <p className="text-xs text-[var(--muted)]">
              Connect your Solana wallet to mint tokens
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-green-500/30 bg-green-900/10 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-green-500/20 p-2">
            <Wallet className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-foreground)]">
              {walletType} Connected
            </p>
            <code className="text-xs text-[var(--muted)] font-mono">
              {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
            </code>
          </div>
        </div>
        <a
          href={`https://explorer.solana.com/address/${walletAddress}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--accent)] hover:text-[var(--accent)]/80 flex items-center gap-1 text-xs"
        >
          View
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}


