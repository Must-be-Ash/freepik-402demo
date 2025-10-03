"use client";

import { useIsInitialized, useIsSignedIn } from "@coinbase/cdp-hooks";
import SignInScreen from "./SignInScreen";
import SignedInScreen from "./SignedInScreen";

export default function ClientApp() {
  const { isInitialized } = useIsInitialized();
  const { isSignedIn } = useIsSignedIn();

  if (!isInitialized) {
    return (
      <div className="container">
        <div className="card">
          <div className="output">
            <div className="spinner" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {!isSignedIn && <SignInScreen />}
      {isSignedIn && (
        <div className="container">
          <SignedInScreen />
        </div>
      )}
    </>
  );
}