"use client";

import { useState, useCallback, useEffect } from "react";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import { AuthButton, FundModal, type FundModalProps } from "@coinbase/cdp-react";
import ImageGenerator from "./ImageGenerator";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { getBuyOptions, createBuyQuote } from "@/lib/onramp-api";

export default function SignedInScreen() {
  const { evmAddress } = useEvmAddress();
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const copyToClipboard = async () => {
    if (!evmAddress) return;

    try {
      await navigator.clipboard.writeText(evmAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  // Get the user's location (for Onramp)
  // In production, you should use IP geolocation or ask the user
  const userCountry = "US";
  const userSubdivision = "CA"; // Required for US users

  // Onramp API callback functions
  const fetchBuyQuote: FundModalProps["fetchBuyQuote"] = useCallback(async params => {
    return createBuyQuote(params);
  }, []);

  const fetchBuyOptions: FundModalProps["fetchBuyOptions"] = useCallback(async params => {
    return getBuyOptions(params);
  }, []);

  // Handle successful purchase
  const handleOnrampSuccess = useCallback(() => {
    console.log("✅ Onramp purchase successful!");
    setIsModalOpen(false);
    // Optionally refresh balance or show success notification
  }, []);

  // Add data attribute to body when FundModal is open to control CSS styling
  useEffect(() => {
    if (isModalOpen) {
      document.body.setAttribute('data-fund-modal-open', 'true');
    } else {
      document.body.removeAttribute('data-fund-modal-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.removeAttribute('data-fund-modal-open');
    };
  }, [isModalOpen]);

  return (
    <>
      <div className="header">
        <h1>Freepik × Coinbase</h1>
        <TextShimmer className="subtitle" duration={2.5}>
          AI Image Generation with Crypto Payments
        </TextShimmer>
      </div>

      <div className="wallet-info">
        <div className="wallet-section">
          <div className="wallet-address-row">
            <div className="wallet-left-section">
              <div className="modern-auth-button-small">
                <button 
                  onClick={copyToClipboard}
                  title={copied ? "Address copied!" : "Click to copy full address"}
                  type="button"
                >
                  {copied ? (
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <polyline points="20,6 9,17 4,12"/>
                    </svg>
                  ) : (
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                    </svg>
                  )}
                </button>
              </div>
              <div 
                className="wallet-address"
                title="Click to copy full address"
              >
                {copied ? "Copied!" : `${evmAddress?.slice(0, 6)}...${evmAddress?.slice(-4)}`}
              </div>
            </div>
            <div className="auth-section">
              <AuthButton />
            </div>
          </div>
          <div className="wallet-fund-button">
            <div className="modern-auth-button-small">
              <button
                onClick={() => setIsModalOpen(true)}
                type="button"
              >
                Fund your wallet
              </button>
            </div>
          </div>
        </div>
      </div>

      <ImageGenerator />

      <div className="faq">
        <h2>FAQ</h2>
        <div className="faq-item">
          <h3>What is x402?</h3>
          <p>x402 is Coinbase&apos;s payment standard that enables seamless USDC payments for API access. <a href="https://www.x402.org/" target="_blank" rel="noopener noreferrer">Learn more about x402</a>.</p>
        </div>
       
        <div className="faq-item">
          <h3>What is Freepik?</h3>
          <p>Freepik is a platform for a number of AI models, editing tools, and stock assets. <a href="https://docs.freepik.com/introduction" target="_blank" rel="noopener noreferrer"> Explore Freepik here</a>.</p>
        </div>
       
        <div className="faq-item">
          <h3>What are Smart Account Embedded Wallets?</h3>
          <p>Smart Account Embedded Wallets are built-in crypto wallets that run directly in web apps without requiring browser extensions. They provide seamless user onboarding and secure transactions powered by account abstraction. <a href="https://docs.cdp.coinbase.com/embedded-wallets/smart-accounts" target="_blank" rel="noopener noreferrer">Learn more about Embedded Wallets Smart Accounts</a>.</p>
        </div>
     
      </div>

      {/* Onramp Modal for purchasing USDC */}
      {isModalOpen && (
        <FundModal
          open={isModalOpen}
          setIsOpen={setIsModalOpen}
          country={userCountry}
          subdivision={userSubdivision}
          cryptoCurrency="usdc"
          fiatCurrency="usd"
          fetchBuyQuote={fetchBuyQuote}
          fetchBuyOptions={fetchBuyOptions}
          network="base"
          presetAmountInputs={[2, 5, 10]}
          onSuccess={handleOnrampSuccess}
        />
      )}
    </>
  );
}