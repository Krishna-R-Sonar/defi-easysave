// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "src/SavingsPool.sol";
import "src/MockUSDC.sol";
import "src/MockDAI.sol";
import "src/MockUSDT.sol";
import "src/MockV3Aggregator.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();
        MockUSDC usdc = new MockUSDC();
        MockDAI dai = new MockDAI();
        MockUSDT usdt = new MockUSDT();
        // Deploy mock aggregator with initial USDC/ETH price (0.0003 ETH per USDC, scaled to 8 decimals)
        MockV3Aggregator rateOracle = new MockV3Aggregator(300000000);
        SavingsPool savingsPool = new SavingsPool(address(rateOracle));
        savingsPool.addToken(address(usdc), 5); // 5% APY for mUSDC
        savingsPool.addToken(address(dai), 4); // 4% APY for mDAI
        savingsPool.addToken(address(usdt), 3); // 3% APY for mUSDT
        vm.stopBroadcast();
        console.log("MockUSDC deployed at:", address(usdc));
        console.log("MockDAI deployed at:", address(dai));
        console.log("MockUSDT deployed at:", address(usdt));
        console.log("MockV3Aggregator deployed at:", address(rateOracle));
        console.log("SavingsPool deployed at:", address(savingsPool));
    }
}