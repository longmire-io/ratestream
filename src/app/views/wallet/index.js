  import React, { PureComponent } from 'react'
  import { AnimatedView } from '../../components'
  import { store } from '../../Root'
  import config from '../../config/appConfig'
  //import TestTokenERC20Contract from '../../../../build/contracts/vevaTest.json'


/*

  var address = TestTokenERC20Contract.networks["7"].address;

  var abi = TestTokenERC20Contract.abi;

  const Web3 = require('web3');

  var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

  var contract = web3.eth.contract(abi);
  var contractInstance = contract.at(address);

  console.log(address);

  var accounts;
  var vevaBalance;
  var fromWeiOne;
  var fromWeiTwo;





  web3.eth.getAccounts(

    function () {

      accounts = web3.eth.accounts;

      if (accounts) {
        web3.eth.defaultAccount = accounts[0];

        console.log("Default account: " + web3.eth.defaultAccount);
        console.log("Using web3 version: " + web3.version.api);
        console.log  (web3.eth.getBalance(web3.eth.defaultAccount));
        console.log (contractInstance.balanceOf(web3.eth.defaultAccount).toString());

        if (!contractInstance.balanceOf(web3.eth.defaultAccount).c[1]){

          var toStringNum = contractInstance.balanceOf(web3.eth.defaultAccount).toString();

          console.log ('dkhslghs;dfghsdf;lkghsdl;fkghsd;lfkghsd;fgsdfg');
          console.log (toStringNum);
          console.log (web3.fromWei(toStringNum, 'ether'));
          console.log ('dkssagjsjfdsgdsfkjghskdlfjghsfdkljghskldfgjhslfdg');

          vevaBalance = web3.fromWei(toStringNum, 'ether');

        }

        else{
          fromWeiOne = contractInstance.balanceOf(web3.eth.defaultAccount).c[0].toString();
          fromWeiTwo = contractInstance.balanceOf(web3.eth.defaultAccount).c[1].toString();

          vevaBalance = web3.fromWei(fromWeiOne+fromWeiTwo, 'ether');
        }
      }
    }
  );

*/


  export class Wallet extends PureComponent {

    render() {
      return(
        <AnimatedView>
          <main className="container">
            <div className="pure-g">
              <div className="pure-u-1-1">
                <h1>Longmire Wallet</h1>
                <p><strong>Hello!</strong> Welcome to your <span className="dog">LMR Token</span> wallet.</p>
                <p>You have in your wallet.</p>
              </div>
            </div>
            <div className="panel panel-default">



                <label >Send to address</label>
                <input id="address" type="text" />

                <br/>

                <label >Amount</label>
                <input id="amount" type="text"/>

                <br/>

                <button id="button" onClick={onItemClick}>SEND</button>

            </div>
          </main>
        </AnimatedView>
      )
    }
  }

/*

  function onItemClick() {

    var toAddress = $("#address").val();
    var amount = $("#amount").val();

    if ((toAddress.length == 42) && (toAddress[0] == '0') && (toAddress[1] == 'x' || toAddress[1] == "X") && Number(amount)>0) {

      console.log ("valid address and amount!");

      if (amount) {

        var amountWei = web3.toWei(amount);

        if (Number(amount) <= Number(vevaBalance)) {

          contractInstance.transfer(toAddress, amountWei, {from: web3.eth.defaultAccount});

          alert ("You have successfully transferred " + amount + " VEVA to " + toAddress + " !")
          console.log (toAddress, amount);
          console.log ("hurray!  You sent" + amount + " VEVA tokens to " + toAddress);
        }

        else {

        alert("So sorry! You don't have enough VEVA tokens to send! Please try transferring  a different amount.");
        console.log ("Insufficient Balance");
        }
      }
    }

    else {

      if ((toAddress.length == 42) && (toAddress[0] == '0') && (toAddress[1] == 'x' || toAddress[1] == "X") && (Number(amount)<=0)){

        alert("Please enter a valid amount of VEVA tokens!");
        console.log ("invalid amount")
      }

      else if (!((toAddress.length == 42) && (toAddress[0] == '0') && (toAddress[1] == 'x' || toAddress[1] == "X")) && (Number(amount)>0)){

          alert("Please enter a valid address!");
          console.log ("invalid address")
        }

      else {

        alert("Please enter a valid address AND a valid amount!");
        console.log ("invalid address && amount")
      }
    };
  };

*/


export default Wallet
