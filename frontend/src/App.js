// defi-easysave/src/App.js
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import ConnectWallet from "./components/ConnectWallet";
import DepositForm from "./components/DepositForm";
import WithdrawForm from "./components/WithdrawForm";
import LockForm from "./components/LockForm";
import GoalForm from "./components/GoalForm";
import Dashboard from "./components/Dashboard";
import Learn from "./components/Learn";
import TransactionStatus from "./components/TransactionStatus";
import SocialPools from "./components/SocialPools";
import Analytics from "./components/Analytics";
import SavingsPoolABI from "./abis/SavingsPool.json";
import MockUSDCABI from "./abis/MockUSDC.json";
import MockDAIABI from "./abis/MockDAI.json";
import MockUSDTABI from "./abis/MockUSDT.json";
import "./App.css";

const App = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [savingsContract, setSavingsContract] = useState(null);
  const [tokenContracts, setTokenContracts] = useState({});
  const [balances, setBalances] = useState({ mUSDC: "0", mDAI: "0", mUSDT: "0" });
  const [interests, setInterests] = useState({ mUSDC: "0", mDAI: "0", mUSDT: "0" });
  const [lockedBalances, setLockedBalances] = useState({ mUSDC: "0", mDAI: "0", mUSDT: "0" });
  const [lockedInterests, setLockedInterests] = useState({ mUSDC: "0", mDAI: "0", mUSDT: "0" });
  const [rates, setRates] = useState({ mUSDC: "5", mDAI: "4", mUSDT: "3" });
  const [goal, setGoal] = useState({ targetAmount: "0", deadline: "0", achieved: false });
  const [txStatus, setTxStatus] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const tokens = [
    { name: "mUSDC", address: process.env.REACT_APP_MOCK_USDC_ADDRESS, abi: MockUSDCABI.abi },
    { name: "mDAI", address: process.env.REACT_APP_MOCK_DAI_ADDRESS, abi: MockDAIABI.abi },
    { name: "mUSDT", address: process.env.REACT_APP_MOCK_USDT_ADDRESS, abi: MockUSDTABI.abi },
  ];

  useEffect(() => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);
    }
  }, []);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) throw new Error("MetaMask not detected");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId !== 11155111n) throw new Error("Please switch to Sepolia network");
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      setAccount(accounts[0]);
      setSigner(signer);

      const savingsContract = new ethers.Contract(
        process.env.REACT_APP_SAVINGS_POOL_ADDRESS,
        SavingsPoolABI.abi,
        signer
      );
      setSavingsContract(savingsContract);

      const tokenContracts = {};
      tokens.forEach((token) => {
        tokenContracts[token.name] = new ethers.Contract(token.address, token.abi, signer);
      });
      setTokenContracts(tokenContracts);

      await fetchBalances();
      await fetchRates();
    } catch (error) {
      setTxStatus({ type: "error", message: `Failed to connect wallet: ${error.message}` });
    }
  };

  const fetchBalances = async () => {
  if (savingsContract && account) {
    try {
      const newBalances = {};
      const newInterests = {};
      const newLockedBalances = {};
      const newLockedInterests = {};
      for (const token of tokens) {
        console.log(`Fetching balance for ${token.name}: ${token.address}`);
        try {
          const balance = await savingsContract.getBalance(account, token.address);
          newBalances[token.name] = ethers.formatEther(balance);
        } catch (err) {
          console.error(`Error fetching balance for ${token.name}:`, err);
          newBalances[token.name] = "0";
        }
        try {
          const interest = await savingsContract.calculateInterest(account, token.address);
          newInterests[token.name] = ethers.formatEther(interest);
        } catch (err) {
          console.error(`Error fetching interest for ${token.name}:`, err);
          newInterests[token.name] = "0";
        }
        try {
          const lockedBalance = await savingsContract.getLockedBalance(account, token.address);
          newLockedBalances[token.name] = ethers.formatEther(lockedBalance);
        } catch (err) {
          console.error(`Error fetching locked balance for ${token.name}:`, err);
          newLockedBalances[token.name] = "0";
        }
        try {
          const lockedInterest = await savingsContract.calculateLockedInterest(account, token.address);
          newLockedInterests[token.name] = ethers.formatEther(lockedInterest);
        } catch (err) {
          console.error(`Error fetching locked interest for ${token.name}:`, err);
          newLockedInterests[token.name] = "0";
        }
      }
      let goalData;
      try {
        goalData = await savingsContract.userGoals(account);
      } catch (err) {
        console.error("Error fetching goal:", err);
        goalData = { targetAmount: 0, deadline: 0, achieved: false };
      }
      setBalances(newBalances);
      setInterests(newInterests);
      setLockedBalances(newLockedBalances);
      setLockedInterests(newLockedInterests);
      setGoal({
        targetAmount: ethers.formatEther(goalData.targetAmount),
        deadline: goalData.deadline.toString(),
        achieved: goalData.achieved,
      });
      setTxStatus({ type: "success", message: "Balances updated" });
    } catch (error) {
      console.error("Fetch balances error:", error);
      setTxStatus({
        type: "error",
        message: `Failed to fetch balances: ${error.reason || error.message || "Unknown error"}`,
      });
    }
  } else {
    setTxStatus({ type: "error", message: "Wallet or contract not connected" });
  }
};

  const fetchRates = async () => {
    if (savingsContract && account) {
      try {
        const newRates = {};
        for (const token of tokens) {
          const rate = await savingsContract.tokenRates(token.address);
          newRates[token.name] = rate.toString();
        }
        setRates(newRates);
      } catch (error) {
        setTxStatus({ type: "error", message: `Failed to fetch rates: ${error.reason || error.message}` });
      }
    }
  };

  const handleBatchDeposit = async (tokenName, amount) => {
    if (!savingsContract || !tokenContracts[tokenName]) return;
    try {
      setTxStatus({ type: "pending", message: `Depositing ${amount} ${tokenName}...` });
      const token = tokens.find(t => t.name === tokenName);
      const amountWei = ethers.parseEther(amount);
      const depositTx = await savingsContract.batchDeposit(token.address, amountWei, { gasLimit: 300000 });
      await depositTx.wait();
      setTxStatus({ type: "success", message: `Successfully deposited ${amount} ${tokenName}` });
      await fetchBalances();
    } catch (error) {
      setTxStatus({ type: "error", message: `Deposit failed: ${error.reason || error.message}` });
    }
  };

  const handleDeposit = async (tokenName, amount) => {
    if (!savingsContract || !tokenContracts[tokenName]) return;
    try {
      setTxStatus({ type: "pending", message: `Approving ${tokenName} transfer...` });
      const token = tokens.find(t => t.name === tokenName);
      const amountWei = ethers.parseEther(amount);
      const approveTx = await tokenContracts[tokenName].approve(savingsContract.target, amountWei, { gasLimit: 100000 });
      await approveTx.wait();
      setTxStatus({ type: "pending", message: `Depositing ${amount} ${tokenName}...` });
      const depositTx = await savingsContract.deposit(token.address, amountWei, { gasLimit: 300000 });
      await depositTx.wait();
      setTxStatus({ type: "success", message: `Successfully deposited ${amount} ${tokenName}` });
      await fetchBalances();
    } catch (error) {
      if (error.message.includes("circuit breaker")) {
        setTxStatus({ type: "error", message: "MetaMask circuit breaker triggered. Please try again later or check your RPC settings." });
      } else {
        setTxStatus({ type: "error", message: `Deposit failed: ${error.reason || error.message}` });
      }
    }
  };

  const handleWithdraw = async (tokenName, amount) => {
    if (!savingsContract) return;
    try {
      setTxStatus({ type: "pending", message: `Withdrawing ${amount} ${tokenName}...` });
      const token = tokens.find(t => t.name === tokenName);
      const amountWei = ethers.parseEther(amount);
      const withdrawTx = await savingsContract.withdraw(token.address, amountWei, { gasLimit: 300000 });
      await withdrawTx.wait();
      setTxStatus({ type: "success", message: `Successfully withdrew ${amount} ${tokenName}` });
      await fetchBalances();
    } catch (error) {
      setTxStatus({ type: "error", message: `Withdrawal failed: ${error.reason || error.message}` });
    }
  };

  const handleLockDeposit = async (tokenName, amount, lockDuration) => {
    if (!savingsContract || !tokenContracts[tokenName]) return;
    try {
      setTxStatus({ type: "pending", message: `Approving ${tokenName} transfer for lock...` });
      const token = tokens.find(t => t.name === tokenName);
      const amountWei = ethers.parseEther(amount);
      const approveTx = await tokenContracts[tokenName].approve(savingsContract.target, amountWei, { gasLimit: 100000 });
      await approveTx.wait();
      setTxStatus({ type: "pending", message: `Locking ${amount} ${tokenName}...` });
      const lockTx = await savingsContract.lockDeposit(token.address, amountWei, lockDuration * 86400, { gasLimit: 300000 });
      await lockTx.wait();
      setTxStatus({ type: "success", message: `Successfully locked ${amount} ${tokenName} for ${lockDuration} days` });
      await fetchBalances();
    } catch (error) {
      setTxStatus({ type: "error", message: `Lock deposit failed: ${error.reason || error.message}` });
    }
  };

  const handleWithdrawLocked = async (tokenName) => {
    if (!savingsContract) return;
    try {
      setTxStatus({ type: "pending", message: `Withdrawing locked ${tokenName}...` });
      const token = tokens.find(t => t.name === tokenName);
      const withdrawTx = await savingsContract.withdrawLocked(token.address, { gasLimit: 300000 });
      await withdrawTx.wait();
      setTxStatus({ type: "success", message: `Successfully withdrew locked ${tokenName}` });
      await fetchBalances();
    } catch (error) {
      setTxStatus({ type: "error", message: `Withdrawal failed: ${error.reason || error.message}` });
    }
  };

  const handleSetGoal = async (targetAmount, duration) => {
    if (!savingsContract) return;
    try {
      setTxStatus({ type: "pending", message: "Setting savings goal..." });
      const targetAmountWei = ethers.parseEther(targetAmount);
      const setGoalTx = await savingsContract.setGoal(targetAmountWei, duration * 86400, { gasLimit: 200000 });
      await setGoalTx.wait();
      setTxStatus({ type: "success", message: `Goal set: ${targetAmount} by ${new Date(Date.now() + duration * 86400000).toLocaleDateString()}` });
      await fetchBalances();
    } catch (error) {
      setTxStatus({ type: "error", message: `Goal setting failed: ${error.reason || error.message}` });
    }
  };

  const handleCreatePool = async (tokenName, targetAmount, duration) => {
    if (!savingsContract) return;
    try {
      setTxStatus({ type: "pending", message: `Creating pool with ${tokenName}...` });
      const token = tokens.find(t => t.name === tokenName);
      const targetAmountWei = ethers.parseEther(targetAmount);
      const createPoolTx = await savingsContract.createPool(token.address, targetAmountWei, duration * 86400, { gasLimit: 300000 });
      await createPoolTx.wait();
      setTxStatus({ type: "success", message: `Pool created: ${targetAmount} ${tokenName} by ${new Date(Date.now() + duration * 86400000).toLocaleDateString()}` });
    } catch (error) {
      setTxStatus({ type: "error", message: `Pool creation failed: ${error.reason || error.message}` });
    }
  };

  const handleContributeToPool = async (poolId, tokenName, amount) => {
    if (!savingsContract || !tokenContracts[tokenName]) return;
    try {
      setTxStatus({ type: "pending", message: `Contributing ${amount} ${tokenName} to pool...` });
      const token = tokens.find(t => t.name === tokenName);
      const amountWei = ethers.parseEther(amount);
      const approveTx = await tokenContracts[tokenName].approve(savingsContract.target, amountWei, { gasLimit: 100000 });
      await approveTx.wait();
      const contributeTx = await savingsContract.contributeToPool(poolId, amountWei, { gasLimit: 300000 });
      await contributeTx.wait();
      setTxStatus({ type: "success", message: `Successfully contributed ${amount} ${tokenName} to pool ${poolId}` });
    } catch (error) {
      setTxStatus({ type: "error", message: `Contribution failed: ${error.reason || error.message}` });
    }
  };

  return (
    <div className="app">
      <header>
        <h1>DeFi EasySave</h1>
        <ConnectWallet connectWallet={connectWallet} account={account} />
      </header>
      {account ? (
        <div className="tabs">
          <button onClick={() => setActiveTab("dashboard")} className={activeTab === "dashboard" ? "active" : ""}>
            Dashboard
          </button>
          <button onClick={() => setActiveTab("deposit")} className={activeTab === "deposit" ? "active" : ""}>
            Deposit
          </button>
          <button onClick={() => setActiveTab("withdraw")} className={activeTab === "withdraw" ? "active" : ""}>
            Withdraw
          </button>
          <button onClick={() => setActiveTab("lock")} className={activeTab === "lock" ? "active" : ""}>
            Lock Funds
          </button>
          <button onClick={() => setActiveTab("goal")} className={activeTab === "goal" ? "active" : ""}>
            Set Goal
          </button>
          <button onClick={() => setActiveTab("pools")} className={activeTab === "pools" ? "active" : ""}>
            Social Pools
          </button>
          <button onClick={() => setActiveTab("analytics")} className={activeTab === "analytics" ? "active" : ""}>
            Analytics
          </button>
          <button onClick={() => setActiveTab("learn")} className={activeTab === "learn" ? "active" : ""}>
            Learn
          </button>
        </div>
      ) : null}
      <main>
        {account ? (
          <>
            {activeTab === "dashboard" && (
              <Dashboard
                balances={balances}
                interests={interests}
                lockedBalances={lockedBalances}
                lockedInterests={lockedInterests}
                rates={rates}
                goal={goal}
                refreshBalances={fetchBalances}
              />
            )}
            {activeTab === "deposit" && <DepositForm handleDeposit={handleDeposit} handleBatchDeposit={handleBatchDeposit} tokens={tokens} />}
            {activeTab === "withdraw" && <WithdrawForm handleWithdraw={handleWithdraw} tokens={tokens} />}
            {activeTab === "lock" && <LockForm handleLockDeposit={handleLockDeposit} handleWithdrawLocked={handleWithdrawLocked} tokens={tokens} />}
            {activeTab === "goal" && <GoalForm handleSetGoal={handleSetGoal} />}
            {activeTab === "pools" && <SocialPools handleCreatePool={handleCreatePool} handleContributeToPool={handleContributeToPool} tokens={tokens} />}
            {activeTab === "analytics" && <Analytics account={account} />}
            {activeTab === "learn" && <Learn />}
            <TransactionStatus status={txStatus} />
          </>
        ) : (
          <p>Please connect your wallet to start saving.</p>
        )}
      </main>
    </div>
  );
};

export default App;