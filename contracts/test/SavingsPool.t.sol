// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "src/SavingsPool.sol";
import "src/MockUSDC.sol";
import "src/MockDAI.sol";
import "src/MockUSDT.sol";
import "src/MockV3Aggregator.sol";

contract SavingsPoolTest is Test {
    SavingsPool savingsPool;
    MockUSDC usdc;
    MockDAI dai;
    MockUSDT usdt;
    MockV3Aggregator rateOracle;
    address user = address(0x123);
    uint256 constant INITIAL_MINT = 1000 * 10**18;
    uint256 constant MAX_BALANCE = 1_000_000 * 10**18;
    uint256 constant SECONDS_PER_YEAR = 365 days;

    function setUp() public {
        usdc = new MockUSDC();
        dai = new MockDAI();
        usdt = new MockUSDT();
        // Deploy mock aggregator with initial USDC/ETH price (0.0003 ETH per USDC, scaled to 8 decimals)
        rateOracle = new MockV3Aggregator(300000000);
        savingsPool = new SavingsPool(address(rateOracle));
        savingsPool.addToken(address(usdc), 5);
        savingsPool.addToken(address(dai), 4);
        savingsPool.addToken(address(usdt), 3);
        usdc.mint(user, INITIAL_MINT);
        dai.mint(user, INITIAL_MINT);
        usdt.mint(user, INITIAL_MINT);
        vm.startPrank(user);
        usdc.approve(address(savingsPool), type(uint256).max);
        dai.approve(address(savingsPool), type(uint256).max);
        usdt.approve(address(savingsPool), type(uint256).max);
        vm.stopPrank();
    }

    function testDeposit() public {
        vm.startPrank(user);
        uint256 amount = 100 * 10**18;
        savingsPool.deposit(address(usdc), amount);
        assertEq(savingsPool.balances(address(usdc), user), amount);
        vm.stopPrank();
    }

    function testBatchDeposit() public {
        vm.startPrank(user);
        uint256 amount = 100 * 10**18;
        savingsPool.batchDeposit(address(usdc), amount);
        assertEq(savingsPool.balances(address(usdc), user), amount);
        vm.stopPrank();
    }

    function testWithdraw() public {
        vm.startPrank(user);
        uint256 amount = 100 * 10**18;
        savingsPool.deposit(address(dai), amount);
        vm.warp(block.timestamp + SECONDS_PER_YEAR);
        savingsPool.withdraw(address(dai), amount);
        uint256 expectedInterest = (amount * 4) / 100;
        assertEq(dai.balanceOf(user), INITIAL_MINT + expectedInterest);
        vm.stopPrank();
    }

    function testLockDepositAndWithdraw() public {
        vm.startPrank(user);
        uint256 amount = 100 * 10**18;
        uint256 lockDuration = 30 days;
        savingsPool.lockDeposit(address(usdt), amount, lockDuration);
        assertEq(savingsPool.lockedBalances(address(usdt), user), amount);
        vm.warp(block.timestamp + lockDuration + 1);
        savingsPool.withdrawLocked(address(usdt));
        uint256 expectedInterest = (amount * 5) / 100; // 3% + 2% for locked
        assertEq(usdt.balanceOf(user), INITIAL_MINT + expectedInterest);
        vm.stopPrank();
    }

    function testSetGoal() public {
        vm.startPrank(user);
        uint256 target = 100 * 10**18;
        uint256 duration = 30 days;
        savingsPool.setGoal(target, duration);
        savingsPool.deposit(address(usdc), target);
        assertTrue(savingsPool.checkGoal(user));
        vm.stopPrank();
    }

    function testCreatePool() public {
        vm.startPrank(user);
        uint256 target = 1000 * 10**18;
        uint256 duration = 30 days;
        savingsPool.createPool(address(usdc), target, duration);
        savingsPool.contributeToPool(1, 100 * 10**18);
        assertEq(savingsPool.getPoolBalance(1), 100 * 10**18);
        vm.stopPrank();
    }

    function testHistory() public {
        vm.startPrank(user);
        savingsPool.deposit(address(usdc), 100 * 10**18);
        savingsPool.lockDeposit(address(dai), 50 * 10**18, 30 days);
        SavingsPool.Transaction[] memory history = savingsPool.getUserHistory(user);
        assertEq(history.length, 2);
        assertEq(history[0].action, "deposit");
        assertEq(history[1].action, "lockDeposit");
        vm.stopPrank();
    }

    function testMaxBalanceDeposit() public {
        vm.startPrank(user);
        vm.expectRevert("Balance exceeds maximum");
        savingsPool.deposit(address(usdc), MAX_BALANCE + 1);
        savingsPool.deposit(address(usdc), MAX_BALANCE);
        assertEq(savingsPool.balances(address(usdc), user), MAX_BALANCE);
        vm.stopPrank();
    }

    function testFuzzInterestOverflow(uint256 amount, uint256 time) public {
        vm.assume(amount > 0 && amount <= MAX_BALANCE);
        vm.assume(time <= SECONDS_PER_YEAR);
        vm.startPrank(user);
        savingsPool.deposit(address(dai), amount);
        vm.warp(block.timestamp + time);
        uint256 interest = savingsPool.calculateInterest(user, address(dai));
        assertLe(interest, amount * 4 / 100);
        vm.stopPrank();
    }

    function testUpdateRate() public {
        vm.startPrank(user);
        // Update mock aggregator with new USDC/ETH price (0.0004 ETH per USDC)
        rateOracle.updateAnswer(400000000);
        savingsPool.updateRate(address(usdc));
        assertEq(savingsPool.tokenRates(address(usdc)), 4); // Mock rate adjusted to 4%
        vm.stopPrank();
    }
}