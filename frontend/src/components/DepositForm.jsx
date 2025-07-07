// defi-easysave/src/components/DepositForm.jsx
import React, { useState } from "react";
import depositImage from "../assets/deposit.gif";

const DepositForm = ({ handleDeposit, handleBatchDeposit, tokens }) => {
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState(tokens[0].name);
  const [useBatch, setUseBatch] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (amount && Number(amount) > 0) {
      if (useBatch) {
        handleBatchDeposit(token, amount);
      } else {
        handleDeposit(token, amount);
      }
      setAmount("");
    } else {
      alert("Please enter a valid amount greater than 0.");
    }
  };

  return (
    <div className="form-container">
      <h2>Deposit</h2>
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
          <label>
            <input
              type="checkbox"
              checked={useBatch}
              onChange={(e) => setUseBatch(e.target.checked)}
            />
            Use Batch Deposit (Lower Gas)
          </label>
        </div>
        <div className="button-container">
          <button type="submit">{useBatch ? "Batch Deposit" : "Deposit"}</button>
          <img src={depositImage} alt="Deposit animation" className="button-image" />
        </div>
      </form>
    </div>
  );
};

export default DepositForm;