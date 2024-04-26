const helpers = require('@nomicfoundation/hardhat-network-helpers')
const hre = require('hardhat')

async function init() {
  // account for guided study purposes
  // const address = '0x408B64C08E31ee71e3884bC82b472c4D0868215b'
  const address = '0xeE7B892Efe8C9eaFc922DD3737eFFfC492df6eb5'

  await helpers.setBalance(address, 1000 * 1e18)

  // Get the balance of the address
  console.log(hre.ethers.provider)
  // const balance = await hre.ethers.provider.getBalance(address)
  // console.log(`Balance: ${ethers.utils.formatEther(balance)}`)
}

init()
  .then(() => {
    console.log('Initialized!')
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
