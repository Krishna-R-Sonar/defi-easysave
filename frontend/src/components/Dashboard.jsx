// defi-easysave/src/components/Dashboard.jsx
import React, { useState } from "react";
import usdcImage from "../assets/usdc.png";
import daiImage from "../assets/Dai.png";
import usdtImage from "../assets/USDT.png";

const Dashboard = ({ balances, interests, lockedBalances, lockedInterests, rates, goal, refreshBalances }) => {
  const [isSpinning, setIsSpinning] = useState(false);

  const handleRefresh = async () => {
    setIsSpinning(true);
    await refreshBalances();
    setTimeout(() => setIsSpinning(false), 1000); // Spin for 1 second
  };

  const deadlineDate = goal.deadline !== "0" ? new Date(Number(goal.deadline) * 1000).toLocaleDateString() : "Not set";

  const tokenImages = {
    mUSDC: usdcImage,
    mDAI: daiImage,
    mUSDT: usdtImage,
  };

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <button onClick={handleRefresh} className="refresh-button">
        Refresh Balances
      </button>
      <div className="balance-info">
        {Object.keys(balances).map((token) => (
          <div key={token} className="token-info">
            <div className="token-header">
              <img
                src={tokenImages[token]}
                alt={`${token} logo`}
                className={`token-image ${isSpinning ? "spin-y" : ""}`}
              />
              <h3>{token}</h3>
            </div>
            <p>Balance: {balances[token]} {token}</p>
            <p>Interest Earned ({rates[token]}% APY): {interests[token]} {token}</p>
            <p>Locked Balance: {lockedBalances[token]} {token}</p>
            <p>Locked Interest ({Number(rates[token]) + 2}% APY): {lockedInterests[token]} {token}</p>
          </div>
        ))}
        <p>Savings Goal: {goal.targetAmount} by {deadlineDate}</p>
        <p>Goal Achieved: {goal.achieved ? "Yes" : "No"}</p>
      </div>
    </div>
  );
};

export default Dashboard;