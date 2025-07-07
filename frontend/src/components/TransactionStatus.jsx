// defi-easysave/src/components/TransactionStatus.jsx
import React from "react";

const TransactionStatus = ({ status }) => {
  if (!status) return null;

  return (
    <div className={`transaction-status ${status.type}`}>
      {status.type === "pending" && <p>Pending: {status.message}</p>}
      {status.type === "success" && <p>Success: {status.message}</p>}
      {status.type === "error" && <p>Error: {status.message}</p>}
    </div>
  );
};

export default TransactionStatus;