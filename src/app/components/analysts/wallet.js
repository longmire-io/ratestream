import React, { PureComponent, Component } from 'react'
import { AnimatedView } from '../../components'
import { store } from '../../Root'
import config from '../../config/appConfig'
import { getWeb3 } from '../../services/utils'

import WalletService from '../../services/API/wallets'
import eth from '../../services/API/eth'

var web3 = getWeb3() //new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));



var accounts;
var tokenBalance;
var balanceDisplay;

const s = '** **USER** **'

class ViewWallet extends Component {

  constructor(props) {
    super(props)

      eth.getAccounts().then( accounts => {
        console.log(`${s}get accounts ${accounts}`)
        accounts = web3.eth.accounts;

        if (accounts) {

          console.log("Default account: " + web3.eth.defaultAccount);
          console.log("Using web3 version: " + web3.version.api);

          eth.getBalance( web3.eth.defaultAccount ).then( balance => console.log(`${s}balance ${balance}`) )

          WalletService.balanceOf( web3.eth.defaultAccount ).then( balance => { tokenBalance = balance.toNumber()})

        }
      }).catch( err => {
        console.log('error getting accounts')
      })

    this.state = {balanceDisplay: tokenBalance};

    //this.onItemClick = this.onItemClick.bind(this)
    // test
    WalletService.balanceOf( web3.eth.defaultAccount ).then( balance => {
      console.log(`${s}balance: ${balance}`)
    })

  }

  componentWillMount() {

    this.fetchBalance = setInterval(function() {

      eth.getAccounts().then( accounts => {
        accounts = web3.eth.accounts;

        if (accounts) {

          eth.getBalance( web3.eth.defaultAccount ).then( balance => console.log(`${s}balance ${balance}`) )

          WalletService.balanceOf( web3.eth.defaultAccount ).then( balance => { tokenBalance = balance.toNumber()})

        }
      }).catch( err => {
        console.log('error getting accounts')
      })

      this.state = ({balanceDisplay: tokenBalance});

    }, 30000);

  }



  componentDidMount() {
      this.interval = setInterval(() => this.setState({ balanceDisplay: tokenBalance}), 10000);
  }


  componentWillUnmount() {
    if ( this.interval ) clearInterval( this.interval )
    if ( this.fetchBalance ) clearInterval( this.fetchBalance )
  }


  onItemClick = () => {
    var toAddress = $("#address").val()
    var amount = +$("#amount").val()

    if (toAddress.length == 42 && toAddress[0] == '0' && (toAddress[1] == 'x' || toAddress[1] == "X") && amount > 0) {

      console.log ("valid address and amount!");

      if (amount) {

        var amountWei = web3.toWei(amount);

        if (amount <= tokenBalance) {

          WalletService.transfer(toAddress, amountWei).then( transactionResult => {
            console.log('transaction result',transactionResult)
            $("#address").val("")
            $("#amount").val("")
            this.setState({balanceDisplay: tokenBalance - amount})
            setTimeout( () => {
              WalletService.balanceOf( web3.eth.defaultAccount ).then( balance => {
                tokenBalance = balance.toNumber()
                this.setState({balanceDisplay: tokenBalance})
                console.log(`new balance ${tokenBalance}`)
              }).catch( balanceErr => console.log('error getting accounts') )
            }, 20000 )
          }).catch( transferErr => console.log('error transferring') )
        } else {
          alert("So sorry! You don't have enough LMR tokens to send! Please try transferring a different amount.");
          console.log ("Insufficient Balance");
        }
      }
    }

    else if ( toAddress.length == 42 && toAddress[0] == '0' && (toAddress[1] == 'x' || toAddress[1] == "X") && amount<=0) {
      alert("Please enter a valid amount of LMR tokens!");
      console.log ("invalid amount")
    }

    else if (!((toAddress.length == 42) && (toAddress[0] == '0') && (toAddress[1] == 'x' || toAddress[1] == "X")) && (Number(amount)>0)) {
      alert("Please enter a valid address!");
      console.log ("invalid address")
    }

    else {
      alert("Please enter a valid address AND a valid amount!");
      console.log ("invalid address && amount")
    }
  }


  render() {
    return (
      <main>
        <h1>Wallet</h1>
        <p><strong>View Balance and Send Tokens Here</strong></p>
        <p>You have <strong> {this.state.balanceDisplay} </strong> LMR in your wallet.</p>
        <div>
          <label >Send to address</label>
          <input id="address" type="text" maxLength="42" />

          <br/>
          <label >Amount</label>
          <input id="amount" type="text" maxLength="26" />
          <br/>

          <button id="button" onClick={this.onItemClick}>SEND</button>

        </div>
        <br />
        <div>
          <p>
            Please Note: You can only send up to the amount of LMR in your wallet, and you may be charged a transaction fee by the Ethereum network.
            <br/>
            Additionally, please note that valid ERC-20 addresses are 40 hex characters (0-9, A-F), prefixed with "0x".
            <br/>
            Please ensure that you ONLY send LMR tokens to a compatible ERC-20 wallet!
          </p>
        </div>

      </main>
    )
  }
}


export class Wallet extends PureComponent {

  render() {

    return(
      <ViewWallet />
    )
  }
}

export default Wallet
