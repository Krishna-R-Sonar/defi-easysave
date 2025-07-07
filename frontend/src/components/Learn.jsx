// defi-easysave/src/components/Learn.jsx
import React from "react";

const Learn = () => {
  return (
    <div className="learn">
      <h2>Learn About DeFi EasySave</h2>
      <p>
        DeFi EasySave is a decentralized savings platform where you can deposit multiple stablecoins to earn dynamic APY, lock funds for higher returns, set savings goals, or join social pools to save collectively. Built on Ethereum Sepolia with a blockchain-themed UI.
      </p>
      <h3>Features:</h3>
      <ul>
        <li>Deposit mUSDC, mDAI, or mUSDT with dynamic APY.</li>
        <li>Lock funds for 1-365 days to earn +2% APY.</li>
        <li>Set savings goals to track progress.</li>
        <li>Join social pools for collective savings.</li>
        <li>View transaction history and market APY comparisons.</li>
        <li>Secure with OpenZeppelin and Chainlink oracles.</li>
      </ul>
    </div>
  );
};

export default Learn;