// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "../lib/chainlink-brownie-contracts/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract SavingsPool is ReentrancyGuard {
    using Math for uint256;

    address public immutable owner;
    mapping(address => bool) public supportedTokens;
    mapping(address => uint256) public tokenRates; // Token => APY (e.g., 5 for 5%)
    mapping(address => mapping(address => uint256)) public balances; // Token => User => Balance
    mapping(address => uint256) public depositTimestamps; // User => Timestamp
    mapping(address => mapping(address => uint256)) public lockedBalances; // Token => User => Locked Balance
    mapping(address => uint256) public lockTimestamps; // User => Unlock Timestamp
    mapping(address => Goal) public userGoals;
    mapping(uint256 => Pool) public pools;
    uint256 public poolCount;
    mapping(address => Transaction[]) public userHistory;
    AggregatorV3Interface public rateOracle;

    uint256 private constant SECONDS_PER_YEAR = 365 days;
    uint256 private constant MAX_BALANCE = 1_000_000 * 10**18; // Max 1M per token
    uint256 private constant MIN_LOCK_DURATION = 1 days;
    uint256 private constant MAX_LOCK_DURATION = 365 days;

    struct Goal {
        uint256 targetAmount;
        uint256 deadline;
        bool achieved;
    }

    struct Pool {
        uint256 totalBalance;
        uint256 targetAmount;
        uint256 deadline;
        mapping(address => uint256) contributions;
        address token;
    }

    struct Transaction {
        uint256 amount;
        uint256 timestamp;
        string action;
        address token;
    }

    event Deposited(address indexed user, address token, uint256 amount);
    event Withdrawn(address indexed user, address token, uint256 amount, uint256 interest);
    event LockedDeposited(address indexed user, address token, uint256 amount, uint256 lockDuration);
    event LockedWithdrawn(address indexed user, address token, uint256 amount, uint256 interest);
    event GoalSet(address indexed user, uint256 targetAmount, uint256 deadline);
    event PoolCreated(uint256 poolId, uint256 targetAmount, uint256 deadline, address token);
    event PoolContributed(uint256 poolId, address indexed user, uint256 amount);
    event RateUpdated(address token, uint256 newRate);

    constructor(address _rateOracle) {
        owner = msg.sender;
        rateOracle = AggregatorV3Interface(_rateOracle);
    }

    function addToken(address token, uint256 rate) external {
        require(msg.sender == owner, "Only owner");
        require(rate > 0 && rate <= 20, "Invalid rate"); // Max 20% APY
        supportedTokens[token] = true;
        tokenRates[token] = rate;
    }

    function updateRate(address token) external {
        require(supportedTokens[token], "Unsupported token");
        (, int256 rate,,,) = rateOracle.latestRoundData();
        uint256 newRate = uint256(rate) / 10**8; // Adjust based on oracle decimals
        require(newRate > 0 && newRate <= 20, "Invalid oracle rate");
        tokenRates[token] = newRate;
        emit RateUpdated(token, newRate);
    }

    function batchDeposit(address token, uint256 amount) external nonReentrant {
        require(supportedTokens[token], "Unsupported token");
        require(amount > 0, "Amount must be greater than 0");
        require(balances[token][msg.sender] + amount <= MAX_BALANCE, "Balance exceeds maximum");
        require(IERC20(token).approve(address(this), amount), "Approval failed");
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "Transfer failed");
        balances[token][msg.sender] += amount;
        depositTimestamps[msg.sender] = block.timestamp;
        userHistory[msg.sender].push(Transaction(amount, block.timestamp, "deposit", token));
        emit Deposited(msg.sender, token, amount);
    }

    function deposit(address token, uint256 amount) external nonReentrant {
        require(supportedTokens[token], "Unsupported token");
        require(amount > 0, "Amount must be greater than 0");
        require(balances[token][msg.sender] + amount <= MAX_BALANCE, "Balance exceeds maximum");
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "Transfer failed");
        balances[token][msg.sender] += amount;
        depositTimestamps[msg.sender] = block.timestamp;
        userHistory[msg.sender].push(Transaction(amount, block.timestamp, "deposit", token));
        emit Deposited(msg.sender, token, amount);
    }

    function withdraw(address token, uint256 amount) external nonReentrant {
        require(supportedTokens[token], "Unsupported token");
        require(balances[token][msg.sender] >= amount, "Insufficient balance");
        uint256 interest = calculateInterest(msg.sender, token);
        balances[token][msg.sender] -= amount;
        uint256 total = amount + interest;
        require(IERC20(token).transfer(msg.sender, total), "Transfer failed");
        depositTimestamps[msg.sender] = balances[token][msg.sender] > 0 ? block.timestamp : 0;
        userHistory[msg.sender].push(Transaction(amount, block.timestamp, "withdraw", token));
        emit Withdrawn(msg.sender, token, amount, interest);
    }

    function lockDeposit(address token, uint256 amount, uint256 lockDuration) external nonReentrant {
        require(supportedTokens[token], "Unsupported token");
        require(amount > 0, "Amount must be greater than 0");
        require(lockDuration >= MIN_LOCK_DURATION && lockDuration <= MAX_LOCK_DURATION, "Invalid lock duration");
        require(lockedBalances[token][msg.sender] + amount <= MAX_BALANCE, "Balance exceeds maximum");
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "Transfer failed");
        lockedBalances[token][msg.sender] += amount;
        lockTimestamps[msg.sender] = block.timestamp + lockDuration;
        userHistory[msg.sender].push(Transaction(amount, block.timestamp, "lockDeposit", token));
        emit LockedDeposited(msg.sender, token, amount, lockDuration);
    }

    function withdrawLocked(address token) external nonReentrant {
        require(supportedTokens[token], "Unsupported token");
        require(block.timestamp >= lockTimestamps[msg.sender], "Funds still locked");
        uint256 amount = lockedBalances[token][msg.sender];
        require(amount > 0, "No locked funds");
        uint256 interest = calculateLockedInterest(msg.sender, token);
        lockedBalances[token][msg.sender] = 0;
        uint256 total = amount + interest;
        require(IERC20(token).transfer(msg.sender, total), "Transfer failed");
        lockTimestamps[msg.sender] = 0;
        userHistory[msg.sender].push(Transaction(amount, block.timestamp, "withdrawLocked", token));
        emit LockedWithdrawn(msg.sender, token, amount, interest);
    }

    function setGoal(uint256 targetAmount, uint256 duration) external {
        require(targetAmount > 0 && targetAmount <= MAX_BALANCE, "Invalid target amount");
        require(duration >= MIN_LOCK_DURATION && duration <= MAX_LOCK_DURATION, "Invalid duration");
        userGoals[msg.sender] = Goal(targetAmount, block.timestamp + duration, false);
        userHistory[msg.sender].push(Transaction(targetAmount, block.timestamp, "setGoal", address(0)));
        emit GoalSet(msg.sender, targetAmount, block.timestamp + duration);
    }

    function createPool(address token, uint256 targetAmount, uint256 duration) external {
        require(supportedTokens[token], "Unsupported token");
        require(targetAmount > 0 && targetAmount <= MAX_BALANCE * 100, "Invalid target amount");
        require(duration >= MIN_LOCK_DURATION && duration <= MAX_LOCK_DURATION, "Invalid duration");
        poolCount++;
        pools[poolCount].targetAmount = targetAmount;
        pools[poolCount].deadline = block.timestamp + duration;
        pools[poolCount].token = token;
        emit PoolCreated(poolCount, targetAmount, block.timestamp + duration, token);
    }

    function contributeToPool(uint256 poolId, uint256 amount) external nonReentrant {
        require(poolId <= poolCount && poolId > 0, "Invalid pool ID");
        require(block.timestamp < pools[poolId].deadline, "Pool closed");
        require(supportedTokens[pools[poolId].token], "Unsupported token");
        require(amount > 0, "Amount must be greater than 0");
        require(pools[poolId].totalBalance + amount <= MAX_BALANCE * 100, "Pool exceeds maximum");
        require(IERC20(pools[poolId].token).transferFrom(msg.sender, address(this), amount), "Transfer failed");
        pools[poolId].contributions[msg.sender] += amount;
        pools[poolId].totalBalance += amount;
        userHistory[msg.sender].push(Transaction(amount, block.timestamp, "poolContribute", pools[poolId].token));
        emit PoolContributed(poolId, msg.sender, amount);
    }

    function getPoolBalance(uint256 poolId) external view returns (uint256) {
        require(poolId <= poolCount && poolId > 0, "Invalid pool ID");
        return pools[poolId].totalBalance;
    }

    function checkGoal(address user) public view returns (bool) {
        Goal memory goal = userGoals[user];
        if (goal.targetAmount == 0 || block.timestamp > goal.deadline) return false;
        uint256 totalBalance;
        for (uint256 i = 0; i < poolCount + 1; i++) {
            totalBalance += balances[pools[i].token][user] + calculateInterest(user, pools[i].token);
            totalBalance += lockedBalances[pools[i].token][user] + calculateLockedInterest(user, pools[i].token);
        }
        return totalBalance >= goal.targetAmount;
    }

    function calculateInterest(address user, address token) public view returns (uint256) {
        if (depositTimestamps[user] == 0 || balances[token][user] == 0 || block.timestamp < depositTimestamps[user]) {
            return 0;
        }
        uint256 timeElapsed = block.timestamp - depositTimestamps[user];
        if (timeElapsed > SECONDS_PER_YEAR) timeElapsed = SECONDS_PER_YEAR;
        return Math.mulDiv(balances[token][user], tokenRates[token] * timeElapsed, SECONDS_PER_YEAR * 100, Math.Rounding.Floor);
    }

    function calculateLockedInterest(address user, address token) public view returns (uint256) {
        if (lockTimestamps[user] == 0 || lockedBalances[token][user] == 0 || block.timestamp < lockTimestamps[user]) {
            return 0;
        }
        uint256 timeElapsed = block.timestamp - (lockTimestamps[user] - MIN_LOCK_DURATION);
        if (timeElapsed > SECONDS_PER_YEAR) timeElapsed = SECONDS_PER_YEAR;
        return Math.mulDiv(lockedBalances[token][user], (tokenRates[token] + 2) * timeElapsed, SECONDS_PER_YEAR * 100, Math.Rounding.Floor);
    }

    function getBalance(address user, address token) external view returns (uint256) {
        return balances[token][user] + calculateInterest(user, token);
    }

    function getLockedBalance(address user, address token) external view returns (uint256) {
        return lockedBalances[token][user] + calculateLockedInterest(user, token);
    }

    function getUserHistory(address user) external view returns (Transaction[] memory) {
        return userHistory[user];
    }
}