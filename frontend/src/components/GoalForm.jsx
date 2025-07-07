// defi-easysave/src/components/GoalForm.jsx
import React, { useState } from "react";
import targetImage from "../assets/target.png";

const GoalForm = ({ handleSetGoal }) => {
  const [targetAmount, setTargetAmount] = useState("");
  const [duration, setDuration] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (targetAmount && duration && Number(duration) >= 1 && Number(duration) <= 365) {
      handleSetGoal(targetAmount, duration);
      setTargetAmount("");
      setDuration("");
    } else {
      alert("Please enter a valid target amount and duration (1-365 days).");
    }
  };

  return (
    <div className="form-container">
      <h2>Set Savings Goal</h2>
      <form onSubmit={handleSubmit}>
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
        <div className="button-container">
          <button type="submit">Set Goal</button>
          <img src={targetImage} alt="Target icon" className="button-image" />
        </div>
      </form>
    </div>
  );
};

export default GoalForm;