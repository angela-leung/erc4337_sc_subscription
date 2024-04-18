require('@nomicfoundation/hardhat-toolbox')
const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('CredentialAccountLight', function () {
  // let SubscriptionService
  let subscriptionService
  let userWallet
  let serviceProvider
  const subscriptionFee = ethers.parseEther('0.01')
  let subscriber // user
  let subscriber2 // user

  beforeEach(async function () {
    ;[serviceProvider, subscriber, subscriber2] = await ethers.getSigners()

    subscriptionService = await ethers.deployContract(
      'SubscriptionServiceLight',
      [subscriptionFee]
    )
    userWallet = await ethers.deployContract(
      'CredentialAccountLight',
      subscriber
    )
    await subscriptionService.waitForDeployment()
    await userWallet.waitForDeployment()
  })

  it('Should register and pay for a subscription', async function () {
    await userWallet
      .connect(subscriber)
      .registerSubscription(subscriptionService, {
        value: subscriptionFee,
      })

    const subscription = await userWallet.subscriptions(subscriptionService)
    expect(subscription.isActive).to.equal(true)
  })

  it('Should not allow users to subscribe without payment', async function () {
    try {
      await subscriptionService.connect(subscriber).subscribe({ value: 0 })
      expect.fail('Expected subscribe to fail when called without payment')
    } catch (error) {
      expect(error.message).to.include('Incorrect payment')
    }
  })

  it('Should allow users to unsubscribe', async function () {
    await userWallet
      .connect(subscriber)
      .registerSubscription(subscriptionService, {
        value: subscriptionFee,
      })

    await userWallet.connect(subscriber).unsubscribe(subscriptionService)

    const subscriberDetails = await subscriptionService.subscribers(
      userWallet.target
    )
    expect(subscriberDetails.isActive).to.equal(false)
  })

  it('Should not allow non-subscribers to unsubscribe', async function () {
    try {
      //  Create userWallet for another user not subscribe
      userWalletNoSubscribe = await ethers.deployContract(
        'CredentialAccountLight',
        subscriber2
      )
      await userWalletNoSubscribe.waitForDeployment()

      //  try unsubscribe
      await userWalletNoSubscribe
        .connect(subscriber2)
        .unsubscribe(subscriptionService)

      expect.fail('Expected unsubscribe to fail when called by non-subscriber')
    } catch (error) {
      expect(error.message).to.include('Unsubscription error')
    }
  })
})
