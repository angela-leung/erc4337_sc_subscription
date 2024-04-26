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

  beforeEach(async function () {
    ;[serviceProvider, subscriber] = await ethers.getSigners()

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

  it('Should register a subscription', async function () {
    await userWallet
      .connect(subscriber)
      .registerSubscription(subscriptionService, {
        value: subscriptionFee,
      })

    const subscription = await userWallet.subscriptions(subscriptionService)
    expect(subscription.isActive).to.equal(true)
  })

  it('Should not allow to register a subscription if not the owner', async function () {
    try {
      await userWallet
        .connect(serviceProvider)
        .registerSubscription(subscriptionService, {
          value: subscriptionFee,
        })

      expect.fail(
        'Expected registerSubscription to fail when called by non-owner'
      )
    } catch (error) {
      expect(error.message).to.include('Only the owner can call this function')
    }
  })

  // it('Should set the correct subscription fee', async function () {
  //   expect(await subscriptionService.subscriptionFee()).to.equal(
  //     subscriptionFee
  //   )
  // })

  // it('Should allow users to subscribe', async function () {
  //   const tx = await subscriptionService
  //     .connect(subscriber)
  //     .subscribe({ value: subscriptionFee })
  //   await tx.wait()
  //   const subscriberDetails = await subscriptionService.subscribers(
  //     subscriber.address
  //   )
  //   expect(subscriberDetails.isActive).to.equal(true)
  // })

  // it('Should not allow users to subscribe with incorrect payment', async () => {
  //   await expect(
  //     subscriptionService
  //       .connect(subscriber)
  //       .subscribe({ value: ethers.parseEther('0.5') })
  //   ).to.be.revertedWith('Incorrect payment')
  // })

  // it('Should not allow already subscribed users to subscribe again', async () => {
  //   await subscriptionService
  //     .connect(subscriber)
  //     .subscribe({ value: subscriptionFee })
  //   await expect(
  //     subscriptionService
  //       .connect(subscriber)
  //       .subscribe({ value: subscriptionFee })
  //   ).to.be.revertedWith('Already subscribed')
  // })

  // it('Should allow users to unsubscribe', async function () {
  //   await subscriptionService
  //     .connect(subscriber)
  //     .subscribe({ value: subscriptionFee })
  //   await subscriptionService.connect(subscriber).unsubscribe()
  //   const subscriberDetails = await subscriptionService.subscribers(
  //     subscriber.address
  //   )
  //   expect(subscriberDetails.isActive).to.equal(false)
  // })

  // it('Should not allow users to unsubscribe if they are not subscribed', async function () {
  //   await expect(
  //     subscriptionService.connect(subscriber).unsubscribe()
  //   ).to.be.revertedWith('Not subscribed')
  // })

  // it('Should allow the owner to receive payment', async function () {
  //   const ownerAddress = await subscriptionService.owner()
  //   const ownerSigner = ethers.getSigner(ownerAddress)

  //   await subscriptionService
  //     .connect(subscriber)
  //     .subscribe({ value: subscriptionFee })
  //   await subscriptionService
  //     .connect(ownerSigner)
  //     .receivePayment(subscriber.address)
  //   const ownerBalance = await ethers.provider.getBalance(ownerAddress)
  //   expect(ownerBalance).to.equal(subscriptionFee)
  // })

  // it('Should return the correct payment history', async function () {
  //   await subscriptionService
  //     .connect(subscriber)
  //     .subscribe({ value: subscriptionFee })
  //   const paymentHistory = await subscriptionService.getPaymentHistory(
  //     subscriber.address
  //   )
  //   expect(paymentHistory.length).to.equal(1)
  //   expect(paymentHistory[0].amount).to.equal(subscriptionFee)
  // })
})
