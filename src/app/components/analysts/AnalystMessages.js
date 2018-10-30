/*
    AnalystMessages takes the current state and generates a list display of messages based on the state
*/



// ignore everything below right now, just placeholders

/* eslint-disable */
import React from 'react'
import PropTypes from 'prop-types'
import Moment from 'react-moment'
import { Glyphicon, Panel } from 'react-bootstrap'
import { Link } from 'react-router-dom'

import { generateMessages, generateMockMessages } from '../../services/messages'

import config from '../../config/appConfig'

/*
var glyphStyle = {
  fontSize: "80px",
  marginTop: "0px",
  marginBottom: "-20px"
};

var spanStyle = {
  display: "flex",
  alignItems: "center",
  paddingRight: "30px"
};

var cardStyle = {
  maxWidth: "100%",
  boxShadow: "0 4px 8px 0 rgba(0,0,0,0.2)",
  transition: "0.3s"
  //width: 100%;
};
*/
/*
var cardStyle:hover = {
      boxShadow: "0 8px 16px 0 rgba(0,0,0,0.2)"
  };
  */
/*
var cardFlex = {
  maxHeight: "40%",
  display:"flex",
  flexDirection: "row",
  justifyContent: "space-between"

};

var infoRow = {
  width: "60%",
  display:"flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "center"
};

var buttonFlex = {
  color: "blue",
  display: "flex",
  justifyContent: "flex-end"
};
*/

//var preKey = ("2018-03-27T14:06-0500");
//var dateKey = ("2018-03-28T19:06-0500");
/*"2019-05-19T12:59-0500"*/


/*
.card {

    box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
    transition: 0.3s;
    width: 100%;

}

.card:hover {
    box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2);
}
*/


const base_message = {
  link: data => '',
  /*glyph: 'star-empty',*/
  heading: data => <div>base heading</div>,
  body: data => <div>base body</div>,
  footer: data =>
    <div>
      <small>Last updated 3 mins ago</small>
      <button className="btn btn-secondary float-right btn-sm">show(url)</button>
    </div>,
    glyph: data => <div><Glyphicon glyph="star-empty"></Glyphicon></div>,

  time: 0
}


const message_templates = {

  new_round_scheduling: {
    link: data => 'scheduling',
    heading: data => <div>Upcoming rounds available</div>,
    body: data =>
      <div>We have scheduled {data.signupCycles} new round periods! Please make sure your availability is updated in your profile.</div>,
    footer: data => <div>Scheduling</div>,
    glyph: data => <div className="messageGlyph"><Glyphicon glyph="calendar"></Glyphicon></div>
  },

  round_activated: {
    link: data => `round/${data.round}`,
    heading: data => <div>Active Round</div>,
    body: data =>
      <div>
        <div>You are <span className="text-purple">{config.role_name[data.role]}</span> for <Link to={`/token/${data.tokenId}`}>{data.tokenName}</Link> round that began <Moment from={data.now}>{data.start}</Moment>.</div>
        <div>{ data.role ? "Survey" : "Brief" } is due for this round <Moment from={data.now}>{data.due}</Moment></div>
      </div>,
    footer: data => <div>{ data.role ? "Survey" : "Brief" } is due <Moment from={data.now}>{data.due}</Moment>.</div>,
    glyph: data => <div className="messageGlyph"><Glyphicon glyph="ok-circle"></Glyphicon></div>
  },

  round_finished: {
    link: data => `round/${data.round}`,
    heading: data => <div>Round Finished</div>,
    body: data => <div>Analysis round for <Link to={`/token/${data.tokenId}`}>{data.tokenName}</Link> (ended <Moment from={data.now}>{data.start}</Moment>) has finished. Thank you for participating!</div>,
    footer: data => <div>Round Info</div>,
    glyph: data => <div className="messageGlyph"><Glyphicon glyph="education"></Glyphicon></div>
  },

  round_scheduled: {
    link: data => 'scheduling',
    heading: data => <div>Round Scheduled</div>,
    body: data => <div>A new round has been scheduled to begin <Moment from={data.now}>{data.due}</Moment>. It's worth {data.roundValue} LMR token--interested?</div>,
    footer: data => <div>Round Schedule</div>,
    glyph: data => <div className="messageGlyph"><Glyphicon glyph="time"></Glyphicon></div>
  },


  payment: {
    link: data => 'status',
    heading: data => <div>New Payment Available!</div>,
    body: data => <div>Nice work! You have earned a new payment of {data.tokens} LMR! Your new balance is {data.balance} LMR.</div>,
    footer: data => <div>View Balance</div>,
    glyph: data => <div className="messageGlyph"><Glyphicon glyph="usd"></Glyphicon></div>
  },

  reputation_score: {
    link: data => 'status',
    heading: data => <div>New Rep Points!</div>,
    body: data => <div>Well done! You have earned {data.new_points} new reputation points! You now have {data.reputation} points.</div>,
    footer: data => <div>See in Profile</div>,
    glyph: data => <div className="messageGlyph"><Glyphicon glyph="thumbs-up"></Glyphicon></div>
  },

  new_level: {
    link: data => 'status',
    heading: data => <div>New Level!</div>,
    body: data => <div>All right! You have earned sufficient reputation points to move from&nbsp;
        <span className={`${config.LEVELS[data.previous_level].styles}`}>{config.LEVELS[data.previous_level].name}</span> to&nbsp;
        <span className={`${config.LEVELS[data.new_level].styles}`}>{config.LEVELS[data.new_level].name}!</span>
      </div>,
    footer: data => <div>See in Profile</div>,
    glyph: data => <div className="messageGlyph"><Glyphicon glyph="knight"></Glyphicon></div>
  },

  additional_referrals: {
    link: data => 'status',
    heading: data => <div>New Referrals!</div>,
    body: data => <div>You have earned enough rep points to get {data.newRefsAvail} additional referrals, giving you a total of {data.referrals}.</div>,
    footer: data => <div>View in Profile</div>,
    glyph: data => <div className="messageGlyph"><Glyphicon glyph="plus-sign"></Glyphicon></div>
  },


  token_added: {
    link: data => `token/${data.id}`,
    heading: data => <div>New Token Added!</div>,
    body: data => <div>{ data.name } was added to system! Check the token details for more information.</div>,
    footer: data => <div>Token Details</div>,
    glyph: data => <div className="messageGlyph"><Glyphicon glyph="plus"></Glyphicon></div>
  },

  rounds_in_progress:{
    link: data => `round/${data.round}`,
    heading: data => <div>Round In Progress</div>,
    body: data => <div>A round for <Link to={`/token/${data.tokenId}`}>{data.tokenName}</Link> (began <Moment from={data.now}>{data.start}</Moment>) is in progress.  You are a <span className="text-purple">{config.role_name[data.role]}</span>, and it's worth {data.roundValue} LMR token. </div>,
    footer: data => <div>View Round Info</div>,
    glyph: data => <div className="messageGlyph"><Glyphicon glyph="star-empty"></Glyphicon></div>
  },

  sponsored_analyst_joins: {
    link: data => 'status',
    heading: data => <div>New Sponsored Analyst!</div>,
    body: data => <div>Hurray! One of your referrals (Analyst #{data.analyst}) has joined. Thank you for participating in the Longmire ecosystem! You have earned an additional {data.reputation_points} rep points.</div>,
    footer: data => <div>See on Status Page</div>,
    glyph: data => <div className="messageGlyph"><Glyphicon glyph="heart"></Glyphicon></div>
  },

  new_ratings: {
    link: data => 'tokens',
    heading: data => <div>New Ratings!</div>,
    body: data => <div>New token rating data has been added for rounds {data.rounds}! Check out the tokens page for more information or to browse.</div>,
    footer: data => <div>See Latest Ratings</div>,
    glyph: data => <div className="messageGlyph"><Glyphicon glyph="th-list"></Glyphicon></div>
  },

  make_referral: {
    link: data => 'status',
    heading: data => <div>Reminder: You have unused referrals!</div>,
    body: data => <div>You have {data.unused_refs} unused referrals. Your referrals help keep the Longmire system healthy and secure—and you get a cut of their winnings! </div>,
    footer: data => <div>Go to Status Page</div>,
    glyph: data => <div className="messageGlyph"><Glyphicon glyph="user"></Glyphicon></div>
  },

  jurist_round_starting: {
    link: data => 'scheduling',
    heading: data => <div>Round Starting!</div>,
    body: data => <div>You are a confirmed JURIST for the {data.token} round, which is starting now!</div>,
    footer: data => <div>Round Info</div>,
    glyph: data => <div className="messageGlyph"><Glyphicon glyph="bullhorn"></Glyphicon></div>
  },

  brief_posted: {
    link: data => 'admin/cycles',
    heading: data => <div>New Brief Posted!</div>,
    body: data => <div>A lead analyst in the {data.token} round has posted a new brief. You can access it until it closes <Moment from={data.now}>{data.due}</Moment>.</div>,
    footer: data => <div>View Now</div>,
    glyph: data => <div className="messageGlyph"><Glyphicon glyph="edit"></Glyphicon></div>
  },

  pre_survey_due: {
    link: data => 'admin/cycles',
    heading: data => <div>Pre-Survey Due</div>,
    body: data => <div>Reminder: Please take the pre-survey for the {data.round} round--it's due <Moment from={data.now}>{data.due}</Moment>.</div>,
    footer: data => <div>Take it Now</div>,
    glyph: data => <div className="messageGlyph"><Glyphicon glyph="list-alt"></Glyphicon></div>
  },

  post_survey_due:{
    link: data => 'admin/cycles',
    heading: data => <div>Post-Survey Due!</div>,
    body: data => <div>Reminder: Please take the post-survey for round #{data.round}--it is due <Moment from={data.now}>{data.due}</Moment>.</div>,
    footer: data => <div>Take it Now</div>,
    glyph: data => <div className="messageGlyph"><Glyphicon glyph="list-alt"></Glyphicon></div>
  },

  /* Round Confirmation */
  lead_confirmation: {
    link: data => 'admin/cycles',
    heading: data => <div>You are confirmed as a lead!</div>,
    body: data => <div>You are a LEAD for an upcoming round, which is confirmed and will be starting soon!</div>,
    footer: data => <div>See Rounds</div>,
    glyph: data => <div className="messageGlyph"><Glyphicon glyph="check"></Glyphicon></div>
  },

  round_starting: {
    link: data => 'admin/cycles',
    heading: data => <div>Round Starting!</div>,
    body: data => <div>Reminder! You are slated to participate in a round starting <Moment from={data.now}>{data.starting}</Moment>!</div>,
    footer: data => <div>Round Information</div>,
    glyph: data => <div className="messageGlyph"><Glyphicon glyph="bell"></Glyphicon></div>
  },

  briefs_due: {
    link: data => 'admin/cycles',
    heading: data => <div>Reminder: Brief Due!</div>,
    body: data => <div>Your LEAD brief for the {data.round} round is due <Moment from={data.now}>{data.due}</Moment>. Please remember to upload!</div>
    ,
    footer: data => <div>Upload Now</div>,
    glyph: data => <div className="messageGlyph"><Glyphicon glyph="paperclip"></Glyphicon></div>
  },

  rebuttal_due: {
    link: data => 'admin/cycles',
    heading: data => <div>Rebuttal Due!</div>,
    body: data => <div>Your LEAD rebuttal for the {data.round} round is due <Moment from={data.now}>{data.due}</Moment>. Please remember to upload!</div>,
    footer: data => <div>View Opposing Brief</div>,
    glyph: data => <div className="messageGlyph"><Glyphicon glyph="paperclip"></Glyphicon></div>
  },

  round_confirmed: {
    link: data => 'admin/cycles',
    heading: data => <div>Round confirmed!</div>,
    body: data => <div>One of your requested rounds has been confirmed and will be starting <Moment from={data.now}>{data.start}</Moment>!</div>,
    footer: data => <div>View Round Schedule</div>,
    glyph: data => <div className="messageGlyph"><Glyphicon glyph="ok-sign"></Glyphicon></div>
  }

}

export const AnalystMessages = ( props ) => {

  let generatedMessages = generateMessages( props ).sort( ( msg1, msg2 ) => ( msg2.priority - msg1.priority ) )

  //console.log('generated messages',generatedMessages)

  return generatedMessages.map( (message,idx) => {
    let msg = message_templates[message.type]
    return (
      <div className="row" key={idx} >
        <div className="col-md-10">
          <Panel className={`panel-${config.priority[message.priority].name} card card-style`}>

            <Panel.Heading className="card-title">{ msg.heading( message )}
              {/*<Link to={ msg.link( message ) }>{ message.type }</Link>*/}
            </Panel.Heading>

            <Panel.Body className="cardFlex">
              <div className="card-text glyphStyle">
                { msg.glyph( message ) }
              </div>
              <div className="card-text large infoRow">
                { msg.body( message ) }
              </div>
            </Panel.Body>

            <div className="meta">
              <Link to={ msg.link(message) }>
                <div className="card-footer buttonFlex">
                  { msg.footer( message ) }
                </div>
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    )
  })
}

AnalystMessages.propTypes = {
  user: PropTypes.object.isRequired
}

AnalystMessages.defaultProps = {}

export default AnalystMessages
