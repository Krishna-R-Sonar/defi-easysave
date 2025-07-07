// defi-easysave/src/components/LockForm.jsx
import React, { useState } from "react";
import padlockImage from "../assets/padlock.gif";

const LockForm = ({ handleLockDeposit, handleWithdrawLocked, tokens }) => {
  const [amount, setAmount] = useState("");
  const [lockDuration, setLockDuration] = useState("");
  const [token, setToken] = useState(tokens[0].name);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (amount && lockDuration && Number(lockDuration) >= 1 && Number(lockDuration) <= 365) {
      handleLockDeposit(token, amount, lockDuration);
      setAmount("");
      setLockDuration("");
    } else {
      alert("Please enter a valid amount and lock duration (1-365 days).");
    }
  };

  return (
    <div className="form-container">
      <h2>Lock Funds</h2>
      <form onSubmit={handleSubmit}>
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
        <div className="form-group">
          <label>Lock Duration (days):</label>
          <input
            type="number"
            value={lockDuration}
            onChange={(e) => setLockDuration(e.target.value)}
            placeholder="Enter duration (1-365)"
            min="1"
            max="365"
            required
          />
        </div>
        <div className="button-container">
          <button type="submit">Lock Funds</button>
          <img src={padlockImage} alt="Padlock animation" className="button-image" />
        </div>
      </form>
      <div className="form-group">
        <label>Withdraw Locked:</label>
        <select value={token} onChange={(e) => setToken(e.target.value)}>
          {tokens.map((t) => (
            <option key={t.name} value={t.name}>{t.name}</option>
          ))}
        </select>
        <button onClick={() => handleWithdrawLocked(token)} className="withdraw-locked-button">
          Withdraw Locked Funds
        </button>
      </div>
    </div>
  );
};

export default LockForm;