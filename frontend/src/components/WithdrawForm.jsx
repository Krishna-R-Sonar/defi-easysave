// defi-easysave/src/components/WithdrawForm.jsx
import React, { useState } from "react";

const WithdrawForm = ({ handleWithdraw, tokens }) => {
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState(tokens[0].name);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (amount && Number(amount) > 0) {
      handleWithdraw(token, amount);
      setAmount("");
    } else {
      alert("Please enter a valid amount greater than 0.");
    }
  };

  return (
    <div className="form-container">
      <h2>Withdraw</h2>
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
        <button type="submit">Withdraw</button>
      </form>
    </div>
  );
};

export default WithdrawForm;