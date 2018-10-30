import React, { Component } from 'react'
import { Panel } from 'react-bootstrap'
import { Link } from 'react-router-dom'

import moment from 'moment'
import config from '../../config/appConfig'

const isRoundAward = ( reward => 
  reward.reward_type >= config.REWARD_ROUND_TOKENS_WINNER && reward.reward_type <= config.REWARD_ROUND_TOKENS_JURY_BOTTOM 
)

const toDate = timestamp => moment(timestamp*1000).format('MM/DD/YY')

class AnalystRounds extends Component {
  //constructor(props, { user }) {
  constructor(props) {
    super(props)
  }

  render() {
    const { analystRounds, analystPayouts, tokens } = this.props
    return (
      <Panel className="panel-info card card-style">

        <Panel.Heading className="card-title"><i className="fa fa-recycle"/>&nbsp;Rounds Involvement</Panel.Heading>

        <Panel.Body className="card-text">
          { analystRounds.map( ( round, idx ) => {
            let roundReward = analystPayouts.find( reward => ( isRoundAward( reward ) && reward.ref == round.id ))
            if (!roundReward) return ''
            console.log('tokens',tokens)
            console.log('round',round)
            let token = tokens.find( token => round.covered_token == token.id )
            return <div className="row" key={idx}>
              <div className="col-md-3"><Link to={'/token/'+token.id}>{token.name}</Link></div>
              <div className="col-md-3">{toDate(config.cycleTime(round.cycle))}</div>
              <div className="col-md-6">{roundReward.value}&nbsp;LMR Tokens</div>
            </div>
          }
          )}
        </Panel.Body>

      </Panel>
 
    )
  }
}
export default AnalystRounds
