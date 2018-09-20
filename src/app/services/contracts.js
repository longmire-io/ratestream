const config = require( '../config/appConfig' )
const contract = require( 'truffle-contract' )
const utils = require( './utils' )

//const TokenERC20Contract = require('../../../build/contracts/TokenERC20.json')
//const TestTokenERC20Contract = require('../../../build/contracts/vevaTest.json')
const RatingAgencyContract = require('../../../build/contracts/RatingAgency.json')
const AnalystRegistryContract = require('../../../build/contracts/AnalystRegistry.json')

const LmrTokenContract = require('../../../build/contracts/LmrToken.json')
const LongmireHolder = require('../../../build/contracts/LongmireHolder.json')
const LongmireSaleContract = require('../../../build/contracts/LongmireSale.json')

module.exports = {
  // addr not set for use deployed default
  getContractInstance: ( contractDesc, addr = null ) => new Promise( ( resolve, reject ) => {
    let web3 = utils.getWeb3() 
    //console.log('web3 version',web3.version)

    const instanceContract = contract( contractDesc )
    instanceContract.setProvider( web3.currentProvider )
    instanceContract.setNetwork( config.ETHEREUM.network )
    web3.eth.getCoinbase( ( error, coinbase ) => { // Get current ethereum wallet.
      if (error) return reject( console.error(error) )

      instanceContract.defaults( typeof window == 'undefined' ? 
        { from: coinbase, gas: config.ETHEREUM.gas, gasPrice: config.ETHEREUM.gasPrice } : 
        { from:coinbase }
      )

      if ( addr ) instanceContract.at( addr ).then( instance => resolve( instance ) )
      else instanceContract.deployed().then( instance => resolve( instance ) )

    })
  }),

  //getTokenERC20: addr => module.exports.getContractInstance( TokenERC20Contract, addr ),

  //getTestTokenERC20: addr => module.exports.getContractInstance( TestTokenERC20Contract, addr ),

  getRatingAgency: addr => module.exports.getContractInstance( RatingAgencyContract, addr ), //, appConfig.RATING_AGENCY )

  getAnalystRegistry: addr => module.exports.getContractInstance( AnalystRegistryContract, addr ), //, appConfig.ANALYST_REGISTRY )

  getLmrTokenContract: addr => module.exports.getContractInstance( LmrTokenContract, addr ),

  getLongmireHolderContract: addr => module.exports.getContractInstance( LongmireHolderContract, addr ),
  
  getLongmireSaleContract: addr => module.exports.getContractInstance( LongmireSaleContract, addr ) 
}



