// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./CredentialAccount.sol";

contract SubscriptionService {
    struct Subscriber {
        bool isActive;
        uint256 start;
        uint256 nextPaymentDue;
    }

    struct Payment {
        uint256 amount;
        uint256 timestamp;
    }

    // Array to store all subscriber addresses
    address[] public subscriberAddresses;

    address public owner;
    uint256 public subscriptionFee;
    mapping(address => Subscriber) public subscribers;
    mapping(address => Payment[]) public paymentHistory;

    event Subscribed(address indexed subscriber);
    event Unsubscribed(address indexed subscriber);
    event PaymentReceived(address indexed subscriber, uint256 amount);

    constructor(uint256 _subscriptionFee) {
        owner = msg.sender;
        subscriptionFee = _subscriptionFee;
    }

    // Modifier to allow only the owner to call a function
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    // Subscribe function that the user's wallet contract will call
    function subscribe() external payable {
        require(msg.value == subscriptionFee, "Incorrect payment");
        require(!subscribers[msg.sender].isActive, "Already subscribed");

        // Set the subscription details
        subscribers[msg.sender] = Subscriber({
            isActive: true,
            start: block.timestamp,
            nextPaymentDue: block.timestamp + 30 days
        });

        // Record the payment
        paymentHistory[msg.sender].push(
            Payment({amount: msg.value, timestamp: block.timestamp})
        );

        subscriberAddresses.push(msg.sender);

        emit Subscribed(msg.sender);
        emit PaymentReceived(msg.sender, msg.value);
    }

    // Unsubscribe function
    function unsubscribe() external {
        require(subscribers[msg.sender].isActive, "Not subscribed");
        subscribers[msg.sender].isActive = false;
        emit Unsubscribed(msg.sender);
    }

    function receivePayment(address _subscriber) external onlyOwner {
        // Check if the subscription is active
        require(
            subscribers[_subscriber].isActive,
            "Subscription is not active"
        );

        // Convert _subscriber to a payable address
        address payable subscriberPayable = payable(_subscriber);

        // Call the paySubscription function of the CredentialAccount contract
        CredentialAccount(subscriberPayable).paySubscription(this);
    }

    // Function to get the payment history of a subscriber
    function getPaymentHistory(
        address _subscriber
    ) external view returns (Payment[] memory) {
        return paymentHistory[_subscriber];
    }

    // Add a function to get the subscription status and next payment date for all subscribers
    function getAllSubscribers()
        public
        view
        returns (address[] memory, bool[] memory, uint256[] memory)
    {
        bool[] memory isActiveArray = new bool[](subscriberAddresses.length);
        uint256[] memory nextPaymentDateArray = new uint256[](
            subscriberAddresses.length
        );

        for (uint i = 0; i < subscriberAddresses.length; i++) {
            Subscriber memory subscriber = subscribers[subscriberAddresses[i]];
            isActiveArray[i] = subscriber.isActive;
            nextPaymentDateArray[i] = subscriber.nextPaymentDue;
        }

        return (subscriberAddresses, isActiveArray, nextPaymentDateArray);
    }

    fallback() external payable {}
    receive() external payable {}
}
