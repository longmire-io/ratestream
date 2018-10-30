// @flow weak

const customConfig  = require('./customConfig')

const appConfig = {

  // dev mode to mock async data for instance
  DEV_MODE: true,
  DEV_MODE_ALT: false,  // make it possible to mock some data, not others

  // When you need some kind "console spam" to debug
  DEBUG_ENABLED: true,
  // fake delay to mock async
  FAKE_ASYNC_DELAY: 1000,


  APP_NAME: 'Longmire-IO',

  // connection status text references
  CONNECTION_STATUS: {
    online: 'online',
    disconnected: 'disconnected'
  },
  // eaningGraph config
  earningGraph: {
    data: {
      API: 'api/earnigGraphData'
    }
  },
  teamMates:{
    data: {
      API: 'api/teamMates'
    }
  },
  tokens:{
    data: {
      API: 'api/tokens'
    }
  },
  // userInfos config
  userInfos: {
    data: {
      API: 'api/userInfos'
    }
  },


  HELLO_WORD: '',

  CRON_INTERVAL: 2*24*60*60,


  STATUSES: [ // map array to contract
    'none',
    'pending',
    'activating',
    'active',
    'finished',
    'cancelled',
    'available',
    'confirmed',
    'assigned',
    'lead',
    'jurist',
    'brief due',
    'brief submitted',
    'pre survey due',
    'pre survey submitted',
    'post survey due',
    'post survey submitted',
    'round tallied',
    'disqualified'
  ],

  CYCLE_STATUSES: [ // note: these should be migrated to the Statuses above
    'unsubscribed',
    'lead-requested',
    'lead-assigned',
    'jurist-requested',
    'jurist-assigned'
  ],

  CYCLES_AHEAD: 4,
  CYCLE_FRACTIONS: 4,
  CYCLE_PERIOD: 86400 * 28,
  CYCLE_SCHEDULE: 7,
  CYCLE_BRIEF_DUE: 4,
  CYCLE_SURVEY_DUE: 4,
  CYCLE_RECENT: 4,  // definition of 'recent' in fraction of cycle

  ACTIVE_TIME: 86400 * 28,  //die

  SCHEDULE_TIME: 86400 * 4,  //die

  ZERO_BASE_TIME: 1514764800,

  cycleTime: function ( cycle, ms = false ) {
    return ( ms ? 1000 : 1 ) * ( this.CYCLE_PERIOD * cycle / 4 + this.ZERO_BASE_TIME )
  },

  cycleIdx: function ( _time, ms = false ) {
    if (ms) _time /= 1000
    return Math.floor( _time <= this.ZERO_BASE_TIME ? 0
      : this.CYCLE_FRACTIONS * ( _time - this.ZERO_BASE_TIME ) / this.CYCLE_PERIOD )
  },

  cycleFracTime: function ( frac ){ return this.CYCLE_PERIOD / frac }, // interval of one fraction
  cyclePhaseTime: function( phase ){ return this.CYCLE_PERIOD * phase / this.CYCLE_FRACTIONS }, // time of phase in a cycle

  // phase in cycle that timestamp is at, 0 if timestamp before cycle, CYCLE_FRACTIONS if after
  cyclePhase: function( cycle, timestamp ) { // used for triggering certain events 0 before it begins, 4 after it ends
    let timephase = timestamp - this.cycleTime( cycle )
    return timephase <= 0 ? 0 : (timephase > this.CYCLE_PERIOD ? this.CYCLE_FRACTIONS + 1: Math.ceil( this.CYCLE_FRACTIONS * timephase / this.CYCLE_PERIOD ) )
  },


  JURY_SIZE: 6,

  JURISTS_MIN: 2,

  DEFAULT_ROUND_VALUE: 100,

  isRoundLead: function( in_round_id ) { return in_round_id < 2 },

  // from analystRegistry contract =>
  REWARD_REFERRAL:                    1,

  REWARD_ROUND_TOKENS_WINNER:         2,
  REWARD_ROUND_TOKENS_LOSER:          3,
  REWARD_ROUND_TOKENS_JURY_TOP:       4,
  REWARD_ROUND_TOKENS_JURY_MIDDLE:    5,
  REWARD_ROUND_TOKENS_JURY_BOTTOM:    6,
  REWARD_REFERRAL_TOKENS:             7,

  REWARD_ROUND_POINTS_WINNER:         8,
  REWARD_ROUND_POINTS_LOSER:          9,
  REWARD_ROUND_POINTS_JURY_TOP:      10,
  REWARD_ROUND_POINTS_JURY_MIDDLE:   11,
  REWARD_ROUND_POINTS_JURY_BOTTOM:   12,
  REWARD_ROUND_POINTS_NEGATIVE:      13,

  REWARD_BONUS:                      19,
  REWARD_PROMOTION:                  20,

  //REFERRALS_DEFAULT:                 5,

    // payoffs
  WINNER_PCT:                       40,
  LOSER_PCT:                        10,
  TOP_JURISTS_X10:                  34,   // percentages * 10   ... level:0
  MIDDLE_JURISTS_X10:               17,   // level:1
  BOTTOM_JURISTS_X10:                0,    // level:2
  WINNER_POINTS:                    50,
  LOSER_POINTS:                     10,
  NEGATIVE_RATING:                -100,
  TOP_JURISTS_POINTS:               10,
  MIDDLE_JURISTS_POINTS:             4,
  BOTTOM_JURISTS_POINTS:             0,

  REFERRAL_POINTS:                   0,

  LEAD_LEVEL:                        2,
  // <== end from contract

  ROUNDS_PER_CYCLE_LEAD:             2,
  ROUNDS_PER_CYCLE_JURIST:           5,

  reward_is_tokens: function ( reward ) {
    return [
      this.REWARD_ROUND_TOKENS_WINNER,
      this.REWARD_ROUND_TOKENS_LOSER,
      this.REWARD_ROUND_TOKENS_JURY_TOP,
      this.REWARD_ROUND_TOKENS_JURY_MIDDLE,
      this.REWARD_ROUND_TOKENS_JURY_BOTTOM
    ].includes( reward.reward_type )
  },
  reward_is_reputation: function ( reward ) {
    return [
      this.REWARD_ROUND_POINTS_WINNER,
      this.REWARD_ROUND_POINTS_LOSER,
      this.REWARD_ROUND_POINTS_JURY_TOP,
      this.REWARD_ROUND_POINTS_JURY_MIDDLE,
      this.REWARD_ROUND_POINTS_JURY_BOTTOM,
      this.REWARD_ROUND_POINTS_NEGATIVE,
      this.REWARD_BONUS
    ].includes( reward.reward_type )
  },
  reward_is_promotion: function( reward ){
    return reward.reward_type === this.REWARD_PROMOTION
  },


  is_recent: function ( timestamp, now ) {
    return now - ( timestamp || this.ZERO_BASE_TIME ) <= this.CYCLE_PERIOD / this.CYCLE_RECENT
  },
  is_recent_period: function ( timestamp, now ) { // within one cycle period
    return now - ( timestamp || this.ZERO_BASE_TIME ) <= this.CYCLE_PERIOD
  },

  LEVELS: [
    { name:  'white belt', points:   0, referrals:  2, styles: 'text-white'   },
    { name: 'yellow belt', points:  10, referrals:  4, styles: 'text-yellow'  },
    { name: 'orange belt', points:  50, referrals:  6, styles: 'text-orange'  },
    { name:   'blue belt', points: 100, referrals: 10, styles: 'text-blue'    },
    { name:    'red belt', points: 200, referrals: 20, styles: 'text-red'     },
    { name:  'black belt', points: 500, referrals: 30, styles: 'text-black'   }
  ],
  level_info: function( reputation ) {
    return this.LEVELS[ this.level( reputation ) ]
  },
  level: function( reputation ) {
    return this.LEVELS.findIndex( ( _, idx, arr ) => idx === arr.length - 1 ? true : reputation < arr[ idx+1 ].points )
  },

  role_name: [ "Lead","Jurist" ],

  priority: [
    { name: "info",         value: 0 }, // values used for relativized random sort
    { name: "active_small", value: 1 },
    { name: "active_large", value: 2 },
    { name: "active-small", value: 1 },
    { name: "active-large", value: 2 }
  ],

  ETHEREUM: {
    provider: 'http://localhost:8545', // 'http://52.41.77.72:8302',
    ws: 'ws://localhost:8545',
    gas:6700000,
    gasPrice: 20*1000000000, // 20 gwei
    network: 7
  },

  ipfsRepoUpload: 'https://ipfs.io',  //'http://localhost:5001',
  ipfsRepoDownload: 'https://ipfs.io/ipfs/', //http://localhost:8080/ipfs/'

  ETHPLORER: {
    apiKey: 'sifd7328Ophmc33' //  freekey
  },

  COINMARKETCAP: {
    apiKey:  "a1c9be76-9992-46c8-9fe3-7fcb3229bcab", // (real)
    sanbox: "8eb843d6-09f8-492b-9b62-728fc9379259" 
  },


  review_roles: [
    "bull",
    "bear"
  ],

  review_categories: [
    "overview",
    "outreach",
    "team",
    "opportunity",
    "ecosystem",
    "momentum",
    "solution",
    "resources",
    "token-supply",
    "transparency",
    "summary",
    "qualification"
  ],

  ratings: [
    [],
    ["no","yes"],
    ["no","uncertain","yes"],
    [],
    ['--','-','o','+','++']  
  ],
  

  ...customConfig

}

module.exports = appConfig
