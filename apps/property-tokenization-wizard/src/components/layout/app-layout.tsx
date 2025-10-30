"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BlockchainSelector } from "./blockchain-selector";
import { useBlockchain } from "@/contexts/blockchain-context";

const navItems = [
  { label: "Tokenize", href: "#wizard" },
  { label: "Treasury", href: "#treasury" },
  { label: "Assets", href: "#assets" },
  { label: "Docs", href: "#docs" },
];

type AppLayoutProps = {
  children: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
};

export function AppLayout({ children, sidebar, footer }: AppLayoutProps) {
  const { blockchain, setBlockchain } = useBlockchain();

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.35),transparent_60%)] blur-3xl" />
        <header className="relative z-10 border-b border-[var(--color-card-border)]/40 bg-[rgba(5,5,16,0.85)]/90 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-8 lg:px-10 xl:px-20">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--accent-soft)]">
                <span className="text-3xl font-bold text-[var(--accent)]">AR</span>
              </div>
              <div>
                <p className="text-base uppercase tracking-[0.5em] text-[var(--muted)]">ASSET RAIL</p>
                <h1 className="text-4xl font-bold text-[var(--color-foreground)]">
                  Property Tokenization
                </h1>
              </div>
            </div>
            <nav className="hidden gap-8 text-base md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[var(--muted)] transition hover:text-[var(--accent)] font-medium"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="hidden items-center gap-3 md:flex">
              <BlockchainSelector 
                value={blockchain.id}
                onChange={setBlockchain}
              />
            </div>
          </div>
        </header>
      </div>
      <main className="flex w-full flex-col gap-6 px-4 py-10 md:flex-row md:items-start lg:px-10 xl:px-20">
        {sidebar ? (
          <aside className="w-full md:w-60 lg:w-64">
            <div className="space-y-4 rounded-2xl border border-[var(--color-card-border)]/50 bg-[rgba(8,10,25,0.85)] p-4 shadow-[0_15px_30px_rgba(15,118,110,0.18)] backdrop-blur-xl">
              {sidebar}
            </div>
          </aside>
        ) : null}
        <section className={cn("flex-1 space-y-8", sidebar ? "md:pl-4 lg:pl-6" : "")}>{children}</section>
      </main>
      {footer ? <footer className="mx-auto mt-12 max-w-7xl px-6 pb-12">{footer}</footer> : null}
    </div>
  );
}
