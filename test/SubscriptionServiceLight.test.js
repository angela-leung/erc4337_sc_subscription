require('@nomicfoundation/hardhat-toolbox')
const { expect } = require('chai')
const { ethers } = require('hardhat')
const { AbiCoder } = require('ethers')

describe('SubscriptionServiceLight', function () {
  // let SubscriptionService
  let subscriptionService
  let userWallet
  let serviceProvider
  const subscriptionFee = ethers.parseEther('0.01')
  let subscriber
  let subscriber2

  beforeEach(async function () {
    ;[serviceProvider, subscriber, subscriber2, ...others] =
      await ethers.getSigners()
    subscriptionService = await ethers.deployContract(
      'SubscriptionServiceLight',
      [subscriptionFee],
      serviceProvider
    )

    userWallet = await ethers.deployContract(
      'CredentialAccountLight',
      subscriber
    )

    await subscriptionService.waitForDeployment()
    await userWallet.waitForDeployment()

    // send 0.5 ETH to userWallet
    await subscriber.sendTransaction({
      to: userWallet.target,
      value: ethers.parseEther('0.5'),
    })
  })

  it('Should set the correct subscription fee', async function () {
    expect(await subscriptionService.subscriptionFee()).to.equal(
      subscriptionFee
    )
  })

  it('Should allow users to subscribe', async function () {
    const tx = await subscriptionService
      .connect(subscriber)
      .subscribe({ value: subscriptionFee })
    await tx.wait()
    const subscriberDetails = await subscriptionService.subscribers(
      subscriber.address
    )
    expect(subscriberDetails.isActive).to.equal(true)
  })

  it('Should not allow users to subscribe with incorrect payment', async () => {
    await expect(
      subscriptionService
        .connect(subscriber)
        .subscribe({ value: ethers.parseEther('0.5') })
    ).to.be.revertedWith('Incorrect payment')
  })

  it('Should not allow already subscribed users to subscribe again', async () => {
    await subscriptionService
      .connect(subscriber)
      .subscribe({ value: subscriptionFee })
    await expect(
      subscriptionService
        .connect(subscriber)
        .subscribe({ value: subscriptionFee })
    ).to.be.revertedWith('Already subscribed')
  })

  it('Should allow users to unsubscribe', async function () {
    await subscriptionService
      .connect(subscriber)
      .subscribe({ value: subscriptionFee })
    await subscriptionService.connect(subscriber).unsubscribe()
    const subscriberDetails = await subscriptionService.subscribers(
      subscriber.address
    )
    expect(subscriberDetails.isActive).to.equal(false)
  })

  it('Should not allow users to unsubscribe if they are not subscribed', async function () {
    await expect(
      subscriptionService.connect(subscriber).unsubscribe()
    ).to.be.revertedWith('Not subscribed')
  })

  it('Should allow the service provider to receive payment after the payment due', async function () {
    // send 0.5 ETH to userWallet
    await subscriber.sendTransaction({
      to: userWallet.target,
      value: ethers.parseEther('0.5'),
    })

    // 1. user wallet register subscription
    await userWallet
      .connect(subscriber)
      .registerSubscription(subscriptionService, {
        value: subscriptionFee,
      })

    // 2. simulate the passage of time by manipulating the Ethereum block timestamp
    await network.provider.send('evm_increaseTime', [30 * 24 * 60 * 60]) // Fast forward time by 30 days
    await network.provider.send('evm_mine') // this is necessary to actually update the block timestamp

    // 3. Service owner receive payment after the payment due
    await subscriptionService
      .connect(serviceProvider)
      .receivePayment(userWallet.target)

    const subscriptionServiceBalance = await ethers.provider.getBalance(
      subscriptionService.target
    )

    expect(Number(subscriptionServiceBalance)).to.equal(
      Number(subscriptionFee) * 2
    )
  })

  it('Should not allow the service provider to receive payment before the payment due', async function () {
    try {
      // 1. user wallet register subscription
      await userWallet
        .connect(subscriber)
        .registerSubscription(subscriptionService, {
          value: subscriptionFee,
        })

      // 2. Service owner receive payment after the payment due
      await subscriptionService
        .connect(serviceProvider)
        .receivePayment(userWallet.target)
    } catch (error) {
      expect(error.message).to.includes('Too early for payment')
    }
  })

  it('Should return correct subscription status and next payment date for all subscribers', async function () {
    //  first user register subscription
    const userWallet2 = await ethers.deployContract(
      'CredentialAccountLight',
      subscriber2
    )

    await userWallet2.waitForDeployment()

    // send 0.5 ETH to userWallet
    await subscriber2.sendTransaction({
      to: userWallet2.target,
      value: ethers.parseEther('0.5'),
    })

    await userWallet
      .connect(subscriber)
      .registerSubscription(subscriptionService, {
        value: subscriptionFee,
      })

    await userWallet2
      .connect(subscriber2)
      .registerSubscription(subscriptionService, {
        value: subscriptionFee,
      })

    // Call the getAllSubscribers function
    const [addresses, isActiveArray, nextPaymentDateArray] =
      await subscriptionService.getAllSubscribers()

    // Check the returned values
    expect(addresses[0]).to.equal(userWallet.target)
    expect(isActiveArray[0]).to.equal(true)
    expect(nextPaymentDateArray[0]).to.be.above(0)

    expect(addresses[1]).to.equal(userWallet2.target)
    expect(isActiveArray[1]).to.equal(true)
    expect(nextPaymentDateArray[1]).to.be.above(0)
  })

  it('Should return the correct payment history', async function () {
    await subscriptionService
      .connect(subscriber)
      .subscribe({ value: subscriptionFee })
    const paymentHistory = await subscriptionService.getPaymentHistory(
      subscriber.address
    )
    expect(paymentHistory.length).to.equal(1)
    expect(paymentHistory[0].amount).to.equal(subscriptionFee)
  })
})
