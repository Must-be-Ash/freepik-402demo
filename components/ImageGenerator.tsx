"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import { getCurrentUser, toViemAccount } from "@coinbase/cdp-core";
import { wrapFetchWithPayment } from "x402-fetch";
import { createWalletClient, http, publicActions } from "viem";
import { base, baseSepolia } from "viem/chains";
import { FREEPIK_CONFIG } from "@/lib/config";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { ModernButton } from "@/components/ui/modern-button";

interface FreepikResponse {
  data: {
    task_id: string;
    status: string;
    generated: string[];
  };
}

export default function ImageGenerator() {
  const { evmAddress } = useEvmAddress();
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("realism");
  const [resolution, setResolution] = useState("1k");
  const [aspectRatio, setAspectRatio] = useState("square_1_1");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FreepikResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollingTaskId, setPollingTaskId] = useState<string | null>(null);

  // Poll for task completion
  useEffect(() => {
    if (!pollingTaskId || !result || result.data.generated?.length > 0) {
      return; // Don't poll if no task ID or already have results
    }

    const pollTaskStatus = async () => {
      try {
        console.log(`Polling task status for ${pollingTaskId}`);
        const response = await fetch(`/api/task-status?task_id=${pollingTaskId}`);
        
        if (!response.ok) {
          console.error(`Task status check failed: ${response.status}`);
          return;
        }

        const taskData = await response.json();
        console.log('Task status response:', taskData);

        // Update result if we got new data
        if (taskData.data && (taskData.data.status !== result.data.status || taskData.data.generated?.length > 0)) {
          console.log('Updating result with new task data:', taskData);
          setResult(taskData);
          
          // Stop polling if task is completed with images
          if (taskData.data.generated?.length > 0) {
            console.log('Task completed with images, stopping polling');
            setPollingTaskId(null);
            setIsLoading(false);
          }
        } else {
          console.log('No new data to update, continuing to poll...');
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Poll every 15 seconds
    const interval = setInterval(pollTaskStatus, 15000);

    // Initial immediate poll
    pollTaskStatus();

    // Stop polling after 5 minutes to prevent infinite polling
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setPollingTaskId(null);
      setIsLoading(false);
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [pollingTaskId, result]);

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    if (!evmAddress) {
      setError("Wallet not connected");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setPollingTaskId(null); // Reset any previous polling

    try {
      const requestBody = {
        prompt,
        model,
        resolution,
        aspect_ratio: aspectRatio,
        creative_detailing: 33,
        engine: "automatic",
        fixed_generation: false,
        filter_nsfw: true,
      };

      console.log("Making request to Freepik API with x402 payment...");
      
      // Get CDP user and convert to viem account for x402
      let fetchFunc: typeof fetch = fetch;
      try {
        const user = await getCurrentUser();
        if (user && user.evmAccounts && user.evmAccounts.length > 0) {
          // Convert CDP account to viem-compatible LocalAccount
          const viemAccount = await toViemAccount(user.evmAccounts[0]);

          // Determine which chain to use based on environment
          const network = process.env.NEXT_PUBLIC_NETWORK || 'base';
          const isTestnet = network === 'base-sepolia';
          const chain = isTestnet ? baseSepolia : base;
          const rpcUrl = isTestnet ? 'https://sepolia.base.org' : 'https://mainnet.base.org';

          // Wrap the account in a WalletClient with the appropriate chain info
          // This is required so x402 knows which network to sign transactions for
          const walletClient = createWalletClient({
            account: viemAccount,
            chain: chain,
            transport: http(rpcUrl),
          }).extend(publicActions);

          console.log("Wallet client details:", {
            address: walletClient.account?.address,
            chainId: walletClient.chain?.id,
            chainName: walletClient.chain?.name,
          });

          // Create x402-enabled fetch with payment handling
          // Increase max payment to 5 USDC to support 4k resolution pricing
          const maxPaymentAmount = BigInt(5 * 10 ** 6); // 5 USDC (5,000,000 units with 6 decimals)
          // @ts-ignore - Type mismatch between viem versions, but runtime is compatible
          fetchFunc = wrapFetchWithPayment(fetch, walletClient, maxPaymentAmount) as typeof fetch;
          console.log(`Using x402-enabled fetch with CDP wallet on ${chain.name}, max payment: 5 USDC`);
          console.log("CDP wallet address being used for payment:", viemAccount.address);
          console.log(`Network: ${chain.name} (chain ID ${chain.id})`);
        } else {
          console.warn("No CDP user or accounts available, using regular fetch (payments won't work)");
        }
      } catch (signerError) {
        console.warn("Failed to setup x402 payment, falling back to regular fetch:", signerError);
      }
      
      // Make request to our API route which proxies to Freepik (wrapFetchWithPayment handles 402 automatically)
      const response = await fetchFunc("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      // Check response - x402-fetch should handle 402 and retry automatically
      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Request failed: ${response.status} ${response.statusText}`, errorData);
        
        // If it's a 402, this means x402-fetch didn't handle it properly
        if (response.status === 402) {
          setError("Payment required but x402-fetch didn't handle it automatically. Please check your wallet setup.");
        } else {
          throw new Error(`Request failed: ${response.status} ${response.statusText}`);
        }
        return;
      }

      const data: FreepikResponse = await response.json();
      console.log("Freepik response received:", data);

      // Check for payment confirmation header
      const paymentResponseHeader = response.headers.get('X-PAYMENT-RESPONSE');
      if (paymentResponseHeader) {
        console.log('═══ PAYMENT CONFIRMED ═══');
        try {
          const decoded = JSON.parse(atob(paymentResponseHeader));
          console.log('Payment response:', decoded);
          if (decoded.transaction) {
            console.log('✅ Transaction hash:', decoded.transaction);
            console.log('View on BaseScan:', `https://basescan.org/tx/${decoded.transaction}`);
          }
        } catch (e) {
          console.error('Could not decode payment response:', e);
        }
        console.log('═══ END PAYMENT CONFIRMATION ═══');
      }

      setResult(data);

      // Start polling for completion if we got a task ID (x402 endpoint is actually async!)
      if (data.data?.task_id) {
        console.log(`✅ Task created: ${data.data.task_id}`);
        console.log(`Status: ${data.data.status}`);
        console.log('Starting to poll for completion...');
        console.log('Note: Image will also be sent to webhook when ready');
        setPollingTaskId(data.data.task_id);
      } else {
        setIsLoading(false);
      }

    } catch (err) {
      console.error("Image generation failed:", err);
      
      if (err instanceof Error) {
        if (err.message.includes("rejected") || err.message.includes("User rejected")) {
          setError("Payment was rejected. Please try again.");
        } else if (err.message.includes("Insufficient funds")) {
          setError("Insufficient USDC balance. Please add funds to your wallet.");
        } else if (err.message.includes("No Web3 wallet")) {
          setError("No wallet detected. Please refresh and try again.");
        } else {
          setError(err.message);
        }
      } else {
        setError("An unknown error occurred");
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
   

      <div className="form-group">
        <label htmlFor="model">Model</label>
        <select
          id="model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          <option value="realism">Realism - Photorealistic images</option>
          <option value="fluid">Fluid - Creative and artistic</option>
          <option value="zen">Zen - Clean and minimal</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="resolution">Resolution</label>
        <select
          id="resolution"
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
        >
          <option value="1k">1K - Fast generation</option>
          <option value="2k">2K - Balanced quality</option>
          <option value="4k">4K - High quality</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="aspectRatio">Aspect Ratio</label>
        <select
          id="aspectRatio"
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value)}
        >
          <option value="square_1_1">Square (1:1)</option>
          <option value="widescreen_16_9">Widescreen (16:9)</option>
          <option value="traditional_3_4">Portrait (3:4)</option>
          <option value="classic_4_3">Landscape (4:3)</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="prompt">Prompt</label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to generate... e.g., 'A beautiful sunset over mountains with vibrant colors'"
          rows={4}
        />
      </div>

      <div className="flex justify-center">
        <ModernButton
          variant="blue"
          onClick={generateImage}
          disabled={isLoading || !prompt.trim()}
        >
          {isLoading ? "Generating..." : "Generate Image"}
        </ModernButton>
      </div>

      {error && (
        <div className="output" style={{ color: "#ff6b6b", textAlign: "center" }}>
          <div>
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="output">
          <div className="spinner" />
          <TextShimmer className="mt-4 text-lg font-medium" duration={1.5}>
            Generating your AI image...
          </TextShimmer>
        </div>
      )}

      {result && (
        <div className="output" style={{ alignItems: "flex-start", justifyContent: "flex-start" }}>
          <div className="task-info">
            <div><strong>Task ID:</strong> {result.data.task_id}</div>
            <div><strong>Status:</strong> {result.data.status}</div>
            {result.data.generated?.length > 0 && (
              <div><strong>Generated:</strong> {result.data.generated.length} image(s)</div>
            )}
          </div>

          {result.data.generated?.length > 0 ? (
            <div>
              {result.data.generated.map((imageUrl, index) => (
                <div key={index} style={{ marginBottom: "1rem" }}>
                  <Image
                    src={imageUrl}
                    alt={`Generated image ${index + 1}`}
                    className="generated-image"
                    width={512}
                    height={512}
                    style={{ maxWidth: "100%", height: "auto" }}
                    onError={(e) => {
                      console.error(`Failed to load image ${index + 1}:`, imageUrl);
                      console.error('Image load error:', e);
                    }}
                    onLoad={() => {
                      console.log(`Successfully loaded image ${index + 1}:`, imageUrl);
                    }}
                  />
                  <div style={{ marginTop: "1rem", textAlign: "center" }}>
                    <ModernButton
                      variant="blue"
                      onClick={() => {
                        console.log('Download button clicked for image:', imageUrl);
                        // Open the image URL in a new tab
                        window.open(imageUrl, '_blank');
                      }}
                      className="text-sm px-4 py-2"
                    >
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="mr-2"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7,10 12,15 17,10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      View Full Size
                    </ModernButton>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              
              <p style={{ fontSize: "0.875rem", opacity: 0.7, marginTop: "1rem" }}>
                {pollingTaskId 
                  ? 'We\'re checking every 15 seconds for completion. This usually takes 30-60 seconds.' 
                  : 'Payment processed successfully! Starting image generation...'
                }
              </p>
             
            </div>
          )}
        </div>
      )}
    </div>
  );
}