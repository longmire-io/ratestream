
//const solc = require('solc');
const fs = require('fs')
//const util = require('util')
//const debug = require('debug')

//const cronlog = debug('cron')
//const eventlog = debug('event')
const moment = require('moment')

const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const parseRange = require('parse-numeric-range').parse
const config = require('./config')
const roundsService = require('../app/services/API/rounds')
const cyclesService = require('../app/services/API/cycles')
const tokensService = require('../app/services/API/tokens')

const tokenomics = require('../app/services/tokenomics')
const statusService = require('../app/services/analystStatus')

const { getRatingAgency: RatingAgency, getAnalystRegistry: AnalystRegistry } = require('../app/services/contracts')
const utils = require('../app/services/utils') // parseB32StringtoUintArray, toHexString, bytesToHex, hexToBytes
const { bytes32FromIpfsHash, ipfsHashFromBytes32 } = require('../app/services/ipfs')


/*
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(config.sendgrid.apiKey);
const emails = [
  {
    to: 'recipient1@example.org',
    from: 'sender@example.org',
    subject: 'Hello recipient 1',
    text: 'Hello plain world!',
    html: '<p>Hello HTML world!</p>',
  },
  {
    to: 'recipient2@example.org',
    from: 'other-sender@example.org',
    subject: 'Hello recipient 2',
    text: 'Hello other plain world!',
    html: '<p>Hello other HTML world!</p>',
  },
];
*/
//sgMail.send(emails);


//console.log('config',config)

let s = '****'

const survey = require('../app/services/survey')

let pre = 0
let post = 1

const standardTokens = [
  { address: '0x86fa049857e0209aa7d9e616f7eb3b3b78ecfdb0', name: 'Bitcoin'          },
  { address: '0xf230b790e05390fc8295f4d3f60332c93bed42e2', name: 'Ethereum'         },
  { address: '0xd850942ef8811f2a866692a623011bde52a462c1', name: 'Bitcoin Cash'     },
  { address: '0xd26114cd6ee289accf82350c8d8487fedb8a0c07', name: 'QASH'             },
  { address: '0xb5a5f22694352c15b00323844ad545abb2b11028', name: 'Ripple'           },
  { address: '0xb8c77482e45f1f44de1745f52c74426c631bdd52', name: 'Ethereum Classic' },
  { address: '0xe0b7927c4af23765cb51314a0e0521a9645f0e2a', name: 'Litecoin'         },
  { address: '0xd4fa1460f537bb9085d22c7bccb5dd450ef28e3a', name: 'MonaCoin'         },
  { address: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', name: 'CounterParty'     },
  { address: '0x744d70fdbe2ba4cf95131626614a1763df805b9e', name: 'BitCrystals'      },
  { address: '0x168296bb09e24a88805cb9c33356536b980d3fc5', name: 'StorjCoin X'      },
  { address: '0xe94327d07fc17907b4db788e5adf2ed424addff6', name: 'PepeCash'         },
  { address: '0x5ca9a71b1d01849c0a95490cc00559717fcf0d1d', name: 'ZenCash'          },
  { address: '0xcb97e65f07da24d46bcdd078ebebd7c6e6e3d750', name: 'Nem'              },
  { address: '0xb7cb1c96db6b22b0d3d9536e0108d062bd488f74', name: 'Comsa'            },
  { address: '0x4ceda7906a5ed2179785cd3a40a69ee8bc99c466', name: 'Stellar'          }
]


let numVolunteerRepeats = 1 // controls how many total rounds get run, i.e. how hard we stress the system

var port = process.env.PORT || 9030

var apiRouter = express.Router()
var ctlRouter = express.Router()


app.use(bodyParser.urlencoded({ extended: true })); // configure app to use bodyParser()
app.use(bodyParser.json());                         // this will let us get the data from a POST

let web3 =  require('./web3') // require('./web3') //new Web3(config.ETHEREUM.ws)
utils.setWeb3( web3 )

let state = {
  timestamp: 0,
  cycles: [],
  rounds: [],
  analysts: [],
  tokens: []
}

/*
let t = [
  config.cycleTime( 0 ),
  config.cycleTime( 0 ) + config.cyclePhaseTime(2),
  config.cycleTime( 5 ) + config.cyclePhaseTime(2),

]

t.forEach( t => {
  console.log(`cycle index ${t} is ${config.cycleIdx(t)}`)
  console.log(`test cycle phase for cycle 0`,config.cyclePhase(0,t))
  console.log(`test cycle phase for cycle 1`,config.cyclePhase(1,t))
})

console.log(`cycle 2 time: ${config.cycleTime(2)}, test ${1515974400} cycle phase for cycle 2`,config.cyclePhase(2,1515974400))

const cycletest = { id: 4 }
const nextcycletest = { id: 5 }

let a = [ -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8 ]
a.forEach( phase => {
  console.log(`cycle time ${config.cycleTime(cycletest.id)} : phase time ${config.cyclePhaseTime( phase )}`)
  let timestamp = config.cycleTime(cycletest.id)+config.cyclePhaseTime( phase )
  let data = {
    cycle: cycletest.id,
    timestamp,
    timestampCycle:config.cycleIdx(timestamp),
    cycleTime: config.cycleTime( cycletest.id ),
    nextCycleTime: config.cycleTime( cycletest.id + 1),
    fracTime: config.cycleFracTime( phase ),
    expectedPhase: phase,
    phase: config.cyclePhase(cycletest.id, timestamp ),
    period: config.CYCLE_PERIOD,
    isConfirmDue: statusService.isConfirmDue(cycletest,timestamp),
    isFuture: statusService.isFuture(nextcycletest,timestamp)
  }
  console.log(`${s}`,data)
})

//console.log('survey',survey)
//console.log(survey.getElements())
console.log('survey answers',survey.generateAnswers().toString())
let sarr = survey.generateAnswers('down')
console.log('survey answers',sarr.toString())
let sb32 = utils.toHexString(sarr)
console.log('survey hex:', sb32)
console.log('survey convert to arr', utils.hexToBytes(sb32).toString())
*/

let briefs = [  // dummy briefs for testing
  'QmZsWca6dJJUC7CRX1imJnGzw1ZHMT8oEiJXF2AtrfXCpG',
  'QmZRDDRpYyjgWGQKWo736KKmhsr1So4HtMXKxvpKbr7E3Z'
]

let account
let ra
let ar
let tr
let round_analysts = []

let num_analysts = 60
let num_leads = 6

let testAnalysts = new Array(num_analysts).fill().map( ( item,idx ) =>
  ({ id: idx, email: `lmr${ (idx<10?'0':'') + idx }@longmire.io` })
)
console.log( 'test analysts',testAnalysts )

const sendError = err => {
  console.log( 'send error', err )
}
const callError = err => {
  console.log( 'call error', err )
}
const apiError = err  => {
  console.log( 'api error', err )
}
const ctlError = err => console.log( 'ctl error', err )

const toDate = timestamp => moment(timestamp*1000).format('MMMM Do YYYY, h:mm:ss a')

const timeInfo = timestamp => {
  let cycle = config.cycleIdx( timestamp )
  return { timestamp:timestamp, date:toDate( timestamp ), cycle: config.cycleIdx( timestamp ), phase: config.cyclePhase( cycle, timestamp ) }
}

//console.log('web3',web3.eth.personal);
web3.eth.getCoinbase( ( err, coinbase ) => { // setup on launch

  account = coinbase
  console.log('got coinbase ',account)
  tr = { from: account, gas: config.ETHEREUM.gas, gasPrice: config.ETHEREUM.gasPrice }

  RatingAgency().then( _ra  => {
    ra = _ra
    cyclesService.getCronInfo( false ).then( timestamp => {
      console.log(`${s}current rating agency time: ${ timestamp }:${ toDate(timestamp) }`)
      state.timestamp = timestamp
    }).catch( ctlError )
    tokensService.getTokensInfo(false).then( tokens => {
      console.log(`${s}tokens:`,tokens)
      state.tokens = tokens
      // cover any missing tokens now
      Promise.all(
        standardTokens.reduce( ( promises, token ) => {
          if ( tokens.find( coveredToken => coveredToken.address == token.address) ) return promises
          return [ ...promises, tokensService.coverToken( token.name, token.address ) ]
        }, [] )
      ).then( results => {
        console.log(`${s}tokens ready...added ${results.length} standard tokens`)
        if (results.length) tokensService.getTokensInfo(false).then( tokens => {
          state.tokens = tokens
        }).catch( ctlError )
      }).catch( ctlError )
    }).catch( ctlError )
  })
  AnalystRegistry().then( ar  => {
    ar.num_analysts().then( result => {
      let num = result.toNumber()
      console.log(`analysts: ${ num }`)
      if (num) return
      console.log(`${s}creating analysts....please wait`)
      let promises = []
      new Array(num_analysts).fill().map( (_, idx) => {
        let email = 'lmr' + (idx < 10 ? '0':'') + idx + '@longmire.io'
        let password = 'lmr'
        promises.push( ar.register(email,password,0) )
        //console.log(`email ${email}`)
      })
      Promise.all( promises ).then( results => {
        console.log(`${s}${results.length} analysts registered`)
        promises = []
        new Array(num_leads).fill().map( (_,idx) => {
          promises.push( ar.rewardPoints( idx, config.REWARD_BONUS, config.LEVELS[config.LEAD_LEVEL].points, config.LEAD_LEVEL ) )
        })
        Promise.all( promises ).then( results => {
          console.log(`${s}${results.length} leads promoted`)
          console.log(`${s}analysts ready`)
        }).catch( ctlError )
      }).catch( ctlError )
    }).catch( ctlError )
  }).catch( ctlError )
})



const getAccountBalance = (account,cb) => {
  console.log('getting eth balance');
  web3.eth.getBalance(account,(err,result)=> {
    console.log('got eth balance:',web3.fromWei(result,'ether'));
    if (cb) cb(val);
  });
}

const getBlock = () => { // delete me
  var block = 2000000;
  var getEthBlock = Promise.promisify(web3.eth.getBlock);
  getEthBlock(block).then((result)=> {
    console.log('got block '+block+':',result);
  });
}


const getBlocks = blockrange => {
  return new Promise((resolve,reject)=>{
    var rangeArr = parseRange(blockrange);
    var getBlock;
    var blocks = [];
    var blockResults = [];
    if (!rangeArr.length) {
      console.log('no blocks requested');
      reject('no blocks requested');
    }
    getBlock = Promise.promisify(web3.eth.getBlock);

    rangeArr.forEach((blocknum)=> {
      blocks.push(getBlock(blocknum).then((result)=>{
        blockResults.push(result);
      }));
    });

    Promise.all(blocks).then(()=> {
      blockResults.sort((b1,b2)=> { return(b1.number - b2.number) } );
      //console.log('got blocks',rangeArr);
      //console.log('block results',blockResults)
      resolve(blockResults);
    });

  });

}

const getAnalystCycles = analyst => new Promise ( ( resolve, reject ) => cyclesService.getCyclesInfo( analyst ).then( cycles => {
    //console.log( `${s}got cycles for analyst ${ analyst }`,cycles )
  roundsService.getAllRounds().then( rounds => {
    let cyclesInfo = statusService.cyclesByStatus( { cycles, rounds:rounds, timestamp:state.timestamp, tokens:state.tokens })
    //console.log(`cycles by status for ${analyst}`,cyclesByStatus)
    resolve( { cycles, cyclesByStatus: cyclesInfo } )
  }).catch( reject )
}).catch( reject ))



const analystUpdate = analyst => new Promise( (resolve, reject ) => {
  let s = `***${analyst}***`
  let role = analyst < 4 ? 0 : 1
  //let num_rounds = 0
  //let num_active_rounds = 0
  //roundsService.getActiveRounds( analyst ).then( activeRounds => {
  Promise.all( [ roundsService.getRoundsActive(), roundsService.getRounds() ] ).then( nums => {
    let [ num_active_rounds, num_rounds ] = nums
    const isRoundActive = idx => idx >= num_rounds - num_active_rounds
    roundsService.getAllRounds( analyst ).then( rounds => { // get all of them, we'll need them
      console.log( `${s}Analyst update began---${num_rounds} total rounds and ${num_active_rounds} active rounds`)
      //console.log(rounds)
      state.rounds = rounds
      cyclesService.getCronInfo().then( timestamp => {
        let currentCycle = config.cycleIdx( timestamp )
        //let cyclePhase = config.cyclePhase( currentCycle, timestamp )
        console.log(`${s}cycle ${currentCycle}: ${JSON.stringify(timeInfo(timestamp))}`)
        cyclesService.getCyclesInfo( analyst ).then( cycles => {
          //console.log( `${s}got cycles info`)//,cycles )
          let byStatus = statusService.cyclesByStatus( { cycles, rounds:rounds, timestamp:timestamp, tokens:state.tokens } )
          let promises = []
          byStatus.comingSignupCycles.forEach( cycle => { // volunteer for any future cycles some number of times
            let status = cycle.role[ role ]
            if ( status.num_volunteers + status.num_confirms < numVolunteerRepeats ) { // volunteer to this cycle
              console.log(`${s}volunteering to cycle ${cycle.id}`)
              promises.push(
                cyclesService.cycleSignup( cycle.id, analyst, role ).then( result => {
                  console.log(`${s}volunteered to cycle ${cycle.id}`)
                  return result
                })
              )

            }
            console.log(`${s}on cycle ${currentCycle}....volunteers for cycle ${cycle.id} ${status.num_volunteers}, timestamp ${timestamp}, phase ${config.cyclePhase(cycle.id-1,timestamp)}, confirm due ${statusService.isConfirmDue(cycle,timestamp)}`)
            if ( status.num_volunteers && statusService.isConfirmDue( cycle, timestamp ) ) {
              console.log(`${s}confirming to cycle ${cycle.id}`)
              promises.push(
                cyclesService.cycleConfirm( cycle.id, analyst, role ).then( result => {
                  console.log(`${s}confirmed to cycle ${cycle.id}`)
                  return result
                })
              )
            }
          })
          //byStatus.activeCycles.forEach( cycle => {
          //  console.log(`${s}active cycle ${cycle}`)
          //})
          rounds.forEach( ( round, idx ) => { // active rounds
            if ( !isRoundActive( idx ) ) return
            if ( !round.analysts.includes( analyst ) ) return
            let aref = round.inround_id
            console.log(`${s}round ${round.id} analyst status ${round.analyst_status} in-round ref ${aref}`)
            console.log(`${s}round ${JSON.stringify(round)}`)
            if (config.STATUSES[ round.analyst_status ] == 'pre survey due') {
              console.log(`${s}pre survey submitting on round ${round.id} for aref ${aref}`)
              let answers = survey.generateAnswers()
              let comment = `hello from analyst on pre-survey ${aref}:${analyst}`
              promises.push(
                roundsService.submitRoundSurvey( round.id, aref, answers, comment, pre ).then( result => {
                  console.log(`${s}pre-survey submitted for round ${round.id} by aref ${aref}`,JSON.stringify(answers))
                  //console.log(result)
                  return result
                })
              )
            } else if (config.STATUSES[ round.analyst_status ] == 'post survey due') {
              console.log(`${s}post survey submitting on round ${round.id} for analyst ${analyst}`)
              let answers = survey.generateAnswers('down')
              let comment = `hello from analyst on post-survey ${aref}:${analyst}`
              promises.push(
                roundsService.submitRoundSurvey( round.id, aref, answers, comment, post ).then( result => {
                  console.log(`${s}post-survey submitted for round ${round.id} by aref ${aref} ${JSON.stringify(answers)}`)
                  //console.log(result)
                  return result
                }).catch( ctlError )
              )
            } else if (config.STATUSES[ round.analyst_status ] == 'brief due') {
              console.log(`${s}brief submitting on round ${round.id} for analyst ${analyst}`)
              promises.push(
                roundsService.submitRoundBrief( round.id, aref, briefs[aref] ).then( result => {
                  console.log(`${s}brief ${briefs[aref]} submitted for round ${round.id} by aref ${aref}`)
                  return result
                }).catch( ctlError )
              )
            }
          })
          console.log(`${s}${promises.length} cycle or active round work promises`)
          Promise.all( promises ).then( result => {
            //console.log(`${s}cycle or active round work done`,result)
            cyclesService.getCyclesInfo( analyst ).then( cycles => {
              let cyclesStatus = statusService.cyclesByStatus( { cycles, rounds:rounds, timestamp:timestamp, tokens:state.tokens } )
              //console.log(`${s}resolving analystUpdate`)
              //console.log(`${s}cycles by status`,byStatus)
              resolve( { ...timeInfo(timestamp), analyst, cyclesStatus } )
            }).catch( reject )
          }).catch( reject )
        }).catch( reject )
      }).catch( ctlError )
    }).catch( ctlError )
  }).catch( ctlError )
})


//const promiseSerial = promisefuncs =>
//  promisefuncs.reduce( ( promise, promisefunc ) =>
//    promise.then( result => promisefunc.then( Array.prototype.concat.bind(result) ) ),
//    Promise.resolve([])
//  )


//const a = val => new Promise( ( resolve, reject ) => resolve(val*10) )
//const promises = [ a(3), a(6), a(8) ]
//promises.reduce((prev, cur) => prev.then(cur), Promise.resolve()).then( result => console.log(result,'resolved sequence') )

//promiseSerial( promises ).then( result => console.log('%%%%%',result) ).catch( err => console.log(err,'oops') )

// at this point in time, do all the stuff analysts are due to do
const analystsUpdate = () => new Promise( ( resolve, reject ) => {
  func = id => analystUpdate( id )
  let s = '***[au]***'
  // serial promise sequence in order of test analyst
  testAnalysts.reduce( (promise, analystInfo ) => promise.then( () => func( analystInfo.id ) ), Promise.resolve() )
  .then( result => resolve(result) ).catch( reject )
  
 // promiseSerial( testAnalysts.map( analystInfo => analystUpdate( analystInfo.id ) ) ).then( result => {
    //console.log( `${s}analysts update done`,result )
 //   resolve( result )
 // }).catch( reject )
})

ctlRouter.route( '/analystsUpdate' ).get( ( req, res ) => {
  analystsUpdate().then( result => {
    console.log(`${s}`,result)
    res.json( result )
  }).catch( ctlError )
})


/*
 *      api routes
*/

apiRouter.get('/', ( req, res ) => {
    res.json({ message: 'hooray! welcome to api!' });
})

apiRouter.route('/analystCyclesStatus/:analyst').get( ( req, res ) => {
  cyclesService.getCronInfo().then( timestamp => {
    console.log(`${s}cron`, timestamp )
    getAnalystCycles( +req.params.analyst ).then( ( { cycles, cyclesByStatus } ) => {
      console.log(`${s}`,cycles,cyclesByStatus)
      res.json( {...timeInfo( timestamp ), ...cyclesByStatus } )
    }).catch( apiError )
  }).catch( apiError )
})


apiRouter.route( '/cronInfo' ).get( (req, res ) => {
  cyclesService.getCronInfo().then( timestamp => {
    console.log(`${s}cron`, timestamp )
    res.json( timeInfo( timestamp )  )
  }).catch( apiError )
})

apiRouter.get('/round/:round/:analyst', ( req, res ) => {
  cyclesService.getCronInfo().then( timestamp => {
    roundsService.getRoundInfo( req.params.round, req.params.analyst ).then( roundInfo => {
      console.log('round info',roundInfo)
      res.json( {...timeInfo(timestamp), round:roundInfo } )
    }).catch( apiError )
  }).catch( apiError )
})


apiRouter.get('/roundsActive', ( req, res ) => {
  cyclesService.getCronInfo().then( timestamp => {
    //console.log(`${s}cron`, timestamp )
    roundsService.getActiveRounds().then( activeRounds => {
      //console.log( 'active rounds',activeRounds )
      res.json( { ...timeInfo( timestamp ), activeRounds } )
    })
  })
})

// get rounds finished
apiRouter.get('/roundsFinished', ( req, res ) => {
  cyclesService.getCronInfo().then( timestamp => {
    //console.log(`${s}cron`, timestamp )
    roundsService.getFinishedRounds().then( finishedRounds => {
      //console.log( 'finished rounds', finishedRounds )
      res.json( { ...timeInfo( timestamp ), finishedRounds } )
    })
  })
})

// get all rounds
apiRouter.get('/rounds', ( req, res ) => {
  cyclesService.getCronInfo().then( timestamp => {
    //console.log(`${s}cron`, timestamp )
    roundsService.getAllRounds().then( rounds => {
      //console.log( 'all rounds', rounds )
      res.json( { ...timeInfo( timestamp ), rounds } )
    })
  })
})

apiRouter.get('/rounds/:analyst', ( req, res ) => {
  let analyst = +req.params.analyst
  cyclesService.getCronInfo().then( timestamp => {
    //console.log(`${s}cron`, timestamp )
    roundsService.getAllRounds( analyst ).then( rounds => {
      //console.log( 'all rounds', rounds )
      res.json( { ...timeInfo( timestamp ), rounds } )
    })
  })
})

apiRouter.get('/roundSummaries/:fromDate').get( ( req, res ) => {
  res.json({ message: 'yay, rounds'})
})



apiRouter.route('/tokenRecommendations').get( ( req, res ) => {
  cyclesService.getCronInfo().then( timestamp => {
    roundsService.getRoundsSummary().then( finishedRounds => {
      let tokenHistory = tokenomics.tokenHistorySummary( finishedRounds, state.tokens, 5)
      res.json( { ...timeInfo( timestamp ), recommendations: tokenHistory } )
    }).catch( apiError )
  }).catch( apiError )
})

apiRouter.route('/tokenSummaries').get( ( req, res ) => {
  cyclesService.getCronInfo().then( timestamp => {
    roundsService.getRoundsSummary().then( finishedRounds => {
      let tokenHistory = tokenomics.tokenHistory( finishedRounds, state.tokens, 5)
      res.json( { ...timeInfo( timestamp ), tokenHistory, finishedRounds } )
    }).catch( apiError )
  }).catch( apiError )
})
/*
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x7E5BCE8eE498F6C29e4DdAd10CB816D6E2f139f7", "latest"],"id":1}' http://localhost:8545
*/
apiRouter.route('/eth').get(function(req,res){
    console.log('got get');
}).post(function(req,res) {
  console.log('got post, making proxy request',req.body);
  ethProxy.web(req, res, { target: 'http://localhost:8545' }, function(e) {
    console.log('got proxy response',e);
    res.json({message:"got it"});
  })
})



/*
 *     control routes for testing, maintenance, etc.
*/

ctlRouter.get('/', function(req, res) {
  res.json({ message: 'hooray! welcome to ctl!' });
})


ctlRouter.get('/testSendMail', (req, res) => {
  const testSend = [
    {
      to: 'reuben@veva.one',
      from: 'VEVA@veva.one',
      subject: 'test email',
      text: 'test email successful!'
    }
  ]

  sgMail.send(testSend);

  res.json ({message: "done"});

})

/*
  0x86fa049857e0209aa7d9e616f7eb3b3b78ecfdb0, //EOS
  0xf230b790e05390fc8295f4d3f60332c93bed42e2, // Tronix
  0xd850942ef8811f2a866692a623011bde52a462c1, // VeChain
  0xd26114cd6ee289accf82350c8d8487fedb8a0c07, // OMG
  0xb5a5f22694352c15b00323844ad545abb2b11028, // Icon
  0xb8c77482e45f1f44de1745f52c74426c631bdd52, // BnB
  0xe0b7927c4af23765cb51314a0e0521a9645f0e2a, // Digix
  0xd4fa1460f537bb9085d22c7bccb5dd450ef28e3a, // Populous
  0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2, // Maker
  0x744d70fdbe2ba4cf95131626614a1763df805b9e, // status
  0x168296bb09e24a88805cb9c33356536b980d3fc5, // RHOC
  0xe94327d07fc17907b4db788e5adf2ed424addff6,  // Reputation
  0x5ca9a71b1d01849c0a95490cc00559717fcf0d1d, // Aeternity
  0xcb97e65f07da24d46bcdd078ebebd7c6e6e3d750, // Byteom
  0xb7cb1c96db6b22b0d3d9536e0108d062bd488f74, // Walton
  0x4ceda7906a5ed2179785cd3a40a69ee8bc99c466 // Aeon
*/
ctlRouter.route('/tokenAdd/:name/:address').get( ( req, res ) => {
  let [ name, address ] = [ req.params.name, req.params.address ]
  tokensService.coverToken( name, address ).then( result => {
    //console.log( result )
    res.json(result)
  })
})


ctlRouter.route( '/cron/:interval' ).get( ( req, res ) => { // interval as fraction of period
  let intervalTime = config.cycleFracTime( +req.params.interval )
  console.log(`${s}interval time ${intervalTime}`)
  cyclesService.pulseCron( intervalTime ).then( result => {
    cyclesService.getCronInfo().then( timestamp => {
      console.log(`${s}cron`, result )
      res.json( { ...timeInfo( timestamp ) , result } )
    }).catch( apiError )
  }).catch( apiError )

})




ctlRouter.route('/testDoAnalyst/:analyst').get( ( req, res ) => {
  analystUpdate( +req.params.analyst ).then( result => {
    console.log(`${s}`,result)
    res.json( result )
  }).catch( ctlError )
})


/*
  * simulate a series of cycles,
  * for the test analysts, each cycle volunteer early and confirm at the right phase, submit surveys or briefs depending on role
  * totalTime is time from last cron...interval is in proportion of 28
  *  e.g. totalTime: 2419200 for 28 more days (1 standard cycle) 604800 for 7 days...7257600 -- 3 months
*/
ctlRouter.route( '/testSimRun/:totalTime/:interval' ).get( ( req, res ) => { // interval as fraction of period
  let totalTime = +req.params.totalTime
  let intervalTime = config.cycleFracTime( +req.params.interval )
  let finishTime
  let cronRunIdx = 0

  console.log(`${s}interval time: ${intervalTime}...period: ${config.CYCLE_PERIOD}`)
  const runCrons = timestamp => new Promise( ( resolve, reject ) => {
    const cron = cronTime => {
      ra.cycleRoundCanCreate( config.cycleIdx( cronTime ) ).then( canCreate => {
        console.log(`${s}${cronTime}:${toDate(cronTime)} cron with cycle ${config.cycleIdx(cronTime)} ...can create round: ${canCreate}`)
        ra.cronTo( cronTime ).then( res => {
          let cycleStart = config.cycleIdx( cronTime )
          console.log(`${s+s}${cronRunIdx}-cron ran at ${cronTime}:${toDate(cronTime)}...cycle start:${cycleStart}`)
          console.log( res )
          cronRunIdx++
          console.log(`${s}do analysts update`)
          analystsUpdate().then( result => {
            let nextTime = cronTime + intervalTime
            console.log(`${s}analysts update finished...next cron at ${nextTime}`) //,result)
            if ( nextTime <= finishTime )
              cron( nextTime ) // repeat
            else
              resolve( cronTime )

          }).catch( ctlError )


        }).catch( reject )
      }).catch( reject )
    }
    cron( timestamp )
  })


  cyclesService.getCronInfo().then( timestamp => {
    finishTime = timestamp + totalTime
    console.log(`${s}cron procedure...${totalTime} cycles ${timestamp}:${toDate(timestamp)} => ${finishTime}:${toDate(finishTime)}`)
    runCrons( timestamp + intervalTime ).then( timestamp => {
      let date = toDate( timestamp )
      console.log(`${s}${s}`)
      console.log(`${s}${s}finished ${timestamp}:${date}${s}`)
      res.json({ timestamp, date })
    })
  })
})


ctlRouter.route('/rounds').get( ( req, res ) => {
  ra.lasttime().call( tr ).then( result => {
    res.json({lasttime: result})
    console.log( result )
  }).catch( callError )
})

/* Make all test analysts available and confirmed for this cycle...do for next cycle if cycle unspecified */
ctlRouter.route( [ '/cycleGenerateAvailabilities','/cycleGenerateAvailabilities/:cycleId' ] ).get( ( req, res ) => {
  cyclesService.getCronInfo().then( timestamp => {
    let cycle = req.params.cycleId == null ? config.cycleIdx( timestamp ) + 1 : +req.params.cycleId
    ra.cycleGenerateAvailabilities( cycle ).then( result => {
      res.json( { ...timeInfo( timestamp ), targetCycle: cycle, result } )
    }).catch( ctlError )
  }).catch( ctlError )
})


ctlRouter.route( '/roundActivate/:cycle/:token' ).get( ( req, res ) => {
  ra.roundActivate( req.params.cycle, req.params.token ).then( result => {
    //let str = util.inspect( result, { depth:6 } )
    //console.log( str )
    res.json( result )
  }).catch( sendError )
})

/* full fledged tests */
ctlRouter.route( '/testWholeRound/:cycle/:token' ).get( ( req, res) => {
  let cycle = +req.params.cycle
  let token = +req.params.token
  console.log( `${s}Volunteer test users to cycle ${cycle} for token ${token}` )
  let promises = []
  testAnalysts.forEach( analyst => {
    let role = analyst.id < 4 ? 0 : 1  // first four in test analysts are leads
    promises.push(
      cyclesService.cycleSignup( cycle, analyst.id, role )
      /*.then( result => {
        console.log( `${s}got result`,result )
        return result
      }).catch( ctlError )
      */
    )
  })
  Promise.all( promises ).then( results_volunteer => {
    console.log( `${s}got volunteer results`,results_volunteer )
    //res.json( results_volunteer )

    console.log( `${s}Confirm test analysts to cycle ${cycle} for token ${token}` )
    promises = []
    testAnalysts.forEach( analyst => {
      let role = analyst.id < 4 ? 0 : 1
      promises.push(
        cyclesService.cycleConfirm( cycle, analyst.id, role )
        /*.then( result => {
          console.log( `${s}got result`,result )
          return result
        }).catch( ctlError )*/
      )
    })
    Promise.all( promises ).then( results_confirm => {
      console.log( `${s}got confirm results`, results_confirm )
      //res.json( results_confirm )
      promises = []
      ra.cycleRoundCanCreate(cycle).then( results_cancreate => {
        console.log( `${s}can create round: ${results_cancreate}`) // should be true, we just confirmed everybody
        ra.num_rounds().then( results_round => {
          let round = results_round.toNumber()
          console.log( `${s}Activating round ${round} for cycle ${cycle} with token ${token}` )
          ra.roundActivate( cycle, token ).then( results_round => {
            console.log( `${s}activated round ${round}`, results_round )
            //res.json( results_round )

            roundsService.getRoundInfo( round ).then( roundInfo => { // need num_analysts
              console.log(`${s}info for round ${round}`,roundInfo )
              promises = []
              for (let a = 0; a < roundInfo.num_analysts; a++){
                promises.push( ra.roundAnalystId( round, a ) )
              }
              Promise.all( promises ).then( results => {
                promises.forEach( (_,idx) => round_analysts.push( results[idx].toNumber() ) )
                console.log(`${s}round analysts: ${round_analysts.toString()}`)

                console.log( `${s}Submit pre-surveys for round ${round}` )
                promises = []
                round_analysts.forEach( ( round_analyst, idx ) => {
                  if ( idx < 2 ) return // no survey for leads

                  let answers = utils.toHexString( survey.generateAnswers() )
                  //let qualitatives = utils.toHexString([42]) // encoded byte, i.e. true/false
                  //let recommendation = 50
                  let comment = `hello from analyst on pre-survey ${idx}:${round_analyst}`
                  promises.push(
                    ra.roundSurveySubmit( round, idx, pre, answers, comment )
                    /*.then( result => {
                      console.log( `${s}got result`,result )
                      return result
                    }).catch( ctlError )
                    */
                  )
                })
                Promise.all( promises ).then( results_survey_submit => {
                  console.log( `${s}survey submit results`, results_survey_submit )
                  //res.json( results_survey_submit )

                  console.log( `${s}submit briefs`)

                  promises = [
                    ra.roundBriefSubmit( round, 0, bytes32FromIpfsHash(briefs[0]) ),
                    ra.roundBriefSubmit( round, 1, bytes32FromIpfsHash(briefs[1]) )
                  ]
                  Promise.all( promises ).then( results_briefs => {
                    console.log( `${s}Briefs submitted`,results_briefs )
                    // res.json( results_briefs )

                    console.log( `${s}Submit post-surveys for round ${round}` )
                    promises = []
                    round_analysts.forEach( ( round_analyst, idx ) => {
                      if ( idx < 2 ) return // no survey for leads

                      let answers = utils.toHexString( survey.generateAnswers('down') )
                      //let qualitatives = utils.toHexString([24]) // encoded byte, i.e. true/false
                      //let recommendation = 20
                      let comment = `hello from analyst on post-survey ${idx}:${round_analyst}`
                      promises.push(
                        ra.roundSurveySubmit( round, idx, post, answers, comment )
                      )
                    })
                    Promise.all( promises ).then( results_survey_submit => {
                      console.log( `${s}survey submit results`, results_survey_submit )
                      //res.json( results_survey_submit )
                      ra.roundFinish( round ).then( results_round_finish => {
                        console.log( `${s}round ${round} finished`, results_round_finish )
                        //res.json( results_round_finish )
                        roundsService.getRoundInfo( round ).then( round_info => {
                          console.log( `${s}round info+summary for ${round}`, round_info )
                          res.json( round_info )
                        }).catch( ctlError )
                      }).catch( ctlError )
                    }).catch( ctlError )
                  }).catch( ctlError )
                }).catch( ctlError )
              }).catch( ctlError )
            }).catch( ctlError )
          }).catch( ctlError )
        }).catch( ctlError )
      }).catch( ctlError )
    })

  }).catch( ctlError )


})



app.use('/api', apiRouter)
app.use('/ctl', ctlRouter)

app.listen(port, function () {
  console.log('listening on port '+port);
})
