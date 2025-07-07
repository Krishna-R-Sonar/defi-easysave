// defi-easysave/src/components/SocialPools.jsx
import React, { useState } from "react";

const SocialPools = ({ handleCreatePool, handleContributeToPool, tokens }) => {
  const [targetAmount, setTargetAmount] = useState("");
  const [duration, setDuration] = useState("");
  const [poolId, setPoolId] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState(tokens[0].name);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (targetAmount && duration && Number(duration) >= 1 && Number(duration) <= 365) {
      handleCreatePool(token, targetAmount, duration);
      setTargetAmount("");
      setDuration("");
    } else {
      alert("Please enter a valid target amount and duration (1-365 days).");
    }
  };

  const handleContributeSubmit = (e) => {
    e.preventDefault();
    if (poolId && amount && Number(amount) > 0) {
      handleContributeToPool(poolId, token, amount);
      setPoolId("");
      setAmount("");
    } else {
      alert("Please enter a valid pool ID and amount.");
    }
  };

  return (
    <div className="form-container">
      <h2>Social Pools</h2>
      <h3>Create Pool</h3>
      <form onSubmit={handleCreateSubmit}>
        <div className="form-group">
          <label>Token:</label>
          <select value={token} onChange={(e) => setToken(e.target.value)}>
            {tokens.map((t) => (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Target Amount:</label>
          <input
            type="number"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="Enter target amount"
            min="0.01"
            step="0.01"
            required
          />
        </div>
        <div className="form-group">
          <label>Duration (days):</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Enter duration (1-365)"
            min="1"
            max="365"
            required
          />
        </div>
        <button type="submit">Create Pool</button>
      </form>
      <h3>Contribute to Pool</h3>
      <form onSubmit={handleContributeSubmit}>
        <div className="form-group">
          <label>Pool ID:</label>
          <input
            type="number"
            value={poolId}
            onChange={(e) => setPoolId(e.target.value)}
            placeholder="Enter pool ID"
            min="1"
            required
          />
        </div>
        <div className="form-group">
          <label>Token:</label>
          <select value={token} onChange={(e) => setToken(e.target.value)}>
            {tokens.map((t) => (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Amount:</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min="0.01"
            step="0.01"
            required
          />
        </div>
        <button type="submit">Contribute</button>
      </form>
    </div>
  );
};

export default SocialPools;