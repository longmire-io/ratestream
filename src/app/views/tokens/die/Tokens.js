import React, { Component } from 'react'
import TokenListView from '../tokenList'
import UserStatus from '../../components/userStatus/UserStatus'
import AnalystStat from '../analystStat'
import { AnimatedView } from '../../components'

class Tokens extends Component {
  constructor(props, { userInfos }) {
    super(props)
    userInfos = this.props
  }

  render() {
    const { userInfos, userIsConnected } = this.props;
    const { currentView } = this.props;

    const userFullName = `${userInfos.firstname} ${userInfos.lastname.toUpperCase()}`;
    console.log('props',this.props);
    return(
      <AnimatedView>
        <main className="container">
          <UserStatus user={ userInfos }/>
          <div className="pure-g">
            <div className="pure-u-1-1">
              <h1>Tokens in Play</h1>
              <h2>Current Shares listed:</h2>
              <TokenListView />
            </div>
          </div>
        </main>
      </AnimatedView>
    )
  }
}

export default Tokens