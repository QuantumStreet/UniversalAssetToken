import { useEffect, useState } from "react";

declare global {
  interface Window {
    solana?: any;
  }
}

export const usePhantomWallet = () => {
  const [isPhantomInstalled, setIsPhantomInstalled] = useState(false);
  const [walletDenied, setWalletDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [publicKey, setPublicKey] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.solana?.isPhantom) {
      setIsPhantomInstalled(true);
      
      // Check if wallet is already connected
      if (window.solana.isConnected) {
        setPublicKey(window.solana.publicKey?.toString() || null);
      }
      
      // Listen for account changes
      const handleAccountChange = (publicKey: any) => {
        if (publicKey) {
          setPublicKey(publicKey.toString());
        } else {
          setPublicKey(null);
        }
      };
      
      window.solana.on('accountChanged', handleAccountChange);
      
      return () => {
        window.solana.removeListener('accountChanged', handleAccountChange);
      };
    }
  }, []);

  const connectPhantomWallet = () => {
    setErrorMessage("");
    setWalletDenied(false);

    if (!window.solana) {
      setErrorMessage("Phantom is not installed.");
      setIsPhantomInstalled(false);
      return;
    }

    window.solana
      .connect()
      .then((resp: { publicKey: string }) => {
        setPublicKey(resp.publicKey.toString());
        setWalletDenied(false);
      })
      .catch((err: any) => {
        if (
          err?.code === 4001 ||
          err?.message?.includes("User rejected the request")
        ) {
          setErrorMessage(
            "It seems you have declined the request. Please try again."
          );
          setWalletDenied(true);
        } else {
          setErrorMessage("Unexpected wallet error. Please try again later.");
          console.error("Unexpected wallet error:", err);
        }
      });
  };

  const disconnectWallet = async () => {
    try {
      await window.solana.disconnect();
      setPublicKey(null);
    } catch (err) {
      console.error("Wallet disconnection error:", err);
    }
  };

  return {
    isPhantomInstalled,
    connectPhantomWallet,
    disconnectWallet,
    walletDenied,
    setWalletDenied,
    errorMessage,
    publicKey,
  };
};
