# Project

ERC-4337, also known as Account Abstraction, heralds a new era of possibilities within the Ethereum ecosystem. This showcase is crafted to illustrate the process of user registration and login via a username and password. More crucially, it demonstrates the ability to fund user accounts with native tokens.

These tokens can subsequently be used by users to subscribe to a variety of services. This mechanism not only streamlines the user experience but also uncovers a plethora of potential use cases. By harnessing the capabilities of ERC-4337, our goal is to cultivate a more accessible and user-centric environment in the blockchain sphere.

This repository houses ERC-4337 contracts that extend from Thirdweb's ERC-4337 `baseAccountFactory` and `Account` contract. It includes:

- Account Factory: A module for creating and managing accounts.
- Account: A module for handling individual user accounts.
- Subscription: A module for managing user subscriptions.

## Commands

Unit test

```bash
npx hardhat test
```

Prepare for deployment.

```bash
npm run build
npm run deploy
```
