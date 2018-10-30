const Web3 = require('web3');

var Migrations = artifacts.require("./Migrations.sol");

const TruffleConfig = require('../truffle');

module.exports = function(deployer, network, addresses) {
  const config = TruffleConfig.networks[network];

  if (process.env.ACCOUNT_PASSWORD) {
    const web3 = new Web3(new Web3.providers.HttpProvider('http://' + config.host + ':' + config.port));

    console.log('>> Unlocking account ' + config.from);
    web3.personal.unlockAccount(config.from, process.env.ACCOUNT_PASSWORD, "0x00000000000000000000000000012000");
  }

  console.log('>> Deploying migration');

  deployer.deploy(Migrations);
};
