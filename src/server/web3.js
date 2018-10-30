const config = require('../app/config/appConfig')
const Web3 = require('web3')
//console.log('provider',config.ETHEREUM.provider)
let web3 = new Web3(new Web3.providers.HttpProvider(config.ETHEREUM.provider))//config.ETHEREUM.ws)
//console.log('web3 version',web3.version)

module.exports = web3
