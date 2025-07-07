// defi-easysave/src/components/ConnectWallet.jsx
import React from "react";

const ConnectWallet = ({ connectWallet, account }) => {
  return (
    <div className="connect-wallet">
      {account ? (
        <p>Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
      ) : (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}
    </div>
  );
};

export default ConnectWallet;