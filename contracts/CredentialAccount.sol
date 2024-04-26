// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./SubscriptionService.sol";
import "./CredentialAccountFactory.sol";
import "@thirdweb-dev/contracts/smart-wallet/non-upgradeable/Account.sol";

contract CredentialAccount is Account {
    // Event for subscription payment
    event SubscriptionPaid(
        address indexed subscriber,
        address indexed service,
        uint256 amount,
        uint256 nextPaymentDate
    );

    struct Payment {
        uint256 date;
        uint256 amount;
    }

    struct Subscription {
        bool isActive;
        Payment[] paymentHistory;
        uint256 nextPaymentDate;
        uint256 registerDate;
        uint256 fee;
    }

    mapping(address => Subscription) public subscriptions;

    constructor(
        IEntryPoint _entrypoint,
        address _factory
    ) Account(_entrypoint, _factory) {
        _disableInitializers();
    }

    modifier onlyOwner() {
        require(
            msg.sender == address(this),
            "Only the owner can call this function"
        );
        _;
    }

    modifier onlySubscriptionService(address _subscriptionService) {
        require(
            msg.sender == _subscriptionService,
            "Only the SubscriptionService can call this function"
        );
        _;
    }

    // Modifier to check if the subscription service is active
    modifier onlyActiveSubscription(SubscriptionService _subscriptionService) {
        require(
            subscriptions[address(_subscriptionService)].isActive,
            "Subscription service is not active"
        );
        _;
    }

    // Modifier to check if the payment is not early
    modifier notEarlyPayment(SubscriptionService _subscriptionService) {
        require(
            block.timestamp >=
                subscriptions[address(_subscriptionService)].nextPaymentDate,
            "Too early for payment"
        );
        _;
    }

    function register(
        string calldata username,
        string calldata metadataURI
    ) external {
        require(
            msg.sender == address(this),
            "CredentialAccount: only account itself can register"
        );
        CredentialAccountFactory(factory).onRegistered(username);
        _setupContractURI(metadataURI);
    }

    function registerSubscription(
        SubscriptionService _subscriptionService
    ) external payable onlyOwner {
        // Check that the value sent is enough to cover the subscription fee
        require(
            msg.value == _subscriptionService.subscriptionFee(),
            "Incorrect payment amount"
        );

        // Call the subscribe function of the SubscriptionService and send ether
        (bool success, ) = address(_subscriptionService).call{value: msg.value}(
            abi.encodeWithSignature("subscribe()")
        );

        // Handle the error
        require(success, "Registration error");

        // If the subscription was successful, store the subscription information
        Subscription storage newSubscription = subscriptions[
            address(_subscriptionService)
        ];
        newSubscription.isActive = true;
        newSubscription.nextPaymentDate = block.timestamp + 30 days;
        newSubscription.registerDate = block.timestamp;
        newSubscription.fee = _subscriptionService.subscriptionFee();
    }

    function paySubscription(
        SubscriptionService _subscriptionService
    )
        external
        payable
        onlySubscriptionService(address(_subscriptionService))
        onlyActiveSubscription(_subscriptionService)
        notEarlyPayment(_subscriptionService)
    {
        Subscription storage subscription = subscriptions[
            address(_subscriptionService)
        ];

        // Transfer the Ether directly to the SubscriptionService contract address
        payable(address(_subscriptionService)).transfer(subscription.fee);

        // Update the subscription information
        subscription.paymentHistory.push(
            Payment({date: block.timestamp, amount: subscription.fee})
        );
        subscription.nextPaymentDate = block.timestamp + 30 days;

        // Emit the SubscriptionPaid event
        emit SubscriptionPaid(
            msg.sender,
            address(_subscriptionService),
            subscription.fee,
            subscription.nextPaymentDate
        );
    }

    function unsubscribe(
        SubscriptionService _subscriptionService
    ) external onlyOwner {
        // Call the unsubscribe function of the SubscriptionService contract
        (bool success, ) = address(_subscriptionService).call(
            abi.encodeWithSignature("unsubscribe()")
        );

        // Handle the error
        require(success, "Unsubscription error");

        // If the unsubscription was successful, update the subscription information
        Subscription storage subscription = subscriptions[
            address(_subscriptionService)
        ];
        subscription.isActive = false;
    }
}
