
const fs = require('fs')
const moment = require('moment')

const config = require('./config')

const roundsService = require('../app/services/API/rounds')
const cyclesService = require('../app/services/API/cycles')
const tokensService = require('../app/services/API/tokens')

const tokenomics = require('../app/services/tokenomics')
const statusService = require('../app/services/analystStatus')

const utils = require('../app/services/utils') // parseB32StringtoUintArray, toHexString, bytesToHex, hexToBytes

const refcode = require('../app/services/referralCode')


const ethplorer = require('../app/services/API/ethplorer')
const coinmarket = require('../app/services/API/coinmarket')


//const survey = require('../app/services/survey')

const info = require('../app/services/API/newsinfo')


let appData = require(`${config.datadir}/app.json`)
let infoData = require(`${config.datadir}/info.json`)
let scripts = require(`${config.datadir}/scripts.json`)
let questions = require(`${config.datadir}/analyst_questions.json`)
let tokenData = require(`${config.datadir}/tokens.json`)
let time = require(`${config.datadir}/time.json`)
let token_classify = require(`${config.datadir}/crypto-classify.json`)
token_classify.categories.forEach( category => console.log(category.name) )
token_classify.sectors.forEach( sector => console.log(sector.name) )

var { rounds, users } = appData
var { tokens, coinmarket_ids } = tokenData
/*
tokens.forEach( (token,tIdx) => {
	tokens[tIdx] = { id:tIdx, ...token } // = { id:tIdx, ...token } // fix tokens
	tokens[tIdx].tallies = [] // clear tallies	
})
*/

var tokens_covered = tokens.reduce( (covered,token,tIdx) => {
	token.tags = token.tags || []
	if ( token.tags.includes('top') || token.tags.includes('mover') ) 
		covered.push( tIdx )
	return covered
}, [])


console.log('<covered tokens>')
tokens_covered.forEach( id => console.log(`${id} ${tokens[id].name}`) )
//tokens_covered.forEach( id => console.log(utils.tokenSvg(tokens[id].name)+'\n'))

const question_set = [0,4,8,12,16,20,24,25,26]
const analyst_questions = question_set.map( qnum => questions[qnum] )

const question_winnings = {
	category: category => category != 0 // questions to consider
}

var testUsers = users.filter( user => user.first_name.startsWith('tester_'))

//const dialogs = require('./dialogs')
//const formatters = require('./bots/formatters')


const categories = config.review_categories

const isStr = str => str instanceof String || typeof str === "string"
const samesign = (n1,n2) => ((n1 < 0) == (n2 < 0))

const commands = [
	'review',
	'rate',
	'activity',	// includes rounds you are and have been involved in, and outcomes
	'news',
	'token <name>',
	'tokens',
	'summaries',
	'refreshInfo',
	//'refreshTokens',
	'refreshTopTokens',
	'clearRounds',
	'refreshInfo',
	'time',
	'cron'
]


var saveTimer
var cronTimer

const MINUTE =			60
const HOUR = 				MINUTE * 60
const DAY = 				HOUR * 24
const WEEK = 				DAY * 7
const FORTNIGHT = 	WEEK * 2
const MONTH = 			DAY * 28

const round_window = HOUR * 8 // 8 hours
const round_window_min = HOUR * 2 // 2 hours, minimum window left for a second lead to be added, otherwise round cancelled
const round_phase_window = MINUTE * 20 // 20 minutes per phase max

const tally_window = WEEK   // window from now to consider tallies (e.g. 1 week)


const PAYOFF_LEAD_WIN = 6
const PAYOFF_JURIST_WIN = 6


const parseHtml = { parse_mode:'HTML' } 

const dashes = '------------------------'

function* entries(obj) { // object iterator
	for (let key of Object.keys(obj)) 
		yield [key, obj[key]]
}

const fetchToken = address => new Promise( (resolve, reject) => {
	ethplorer.getTokenInfoExt(address).then( result => {
		//console.log('got result',result)
		resolve( result.data )
	}).catch( reject )
})

var nextTokenFetch = 0
var nextTokenInfoFetch = 0
var nextRoundToken = 0
var tokensToCover = []

var now = time.last_time // config.timebase //() => Math.round(+new Date() / 1000) // can fix time from here
var last_tally = now
var time_str = time => `${time}:${moment(time*1000).format('YYYY-MM-DD hh:mm:ss')}`
var time_from = time => moment(1000*time).from(1000*now)

console.log(`app-time at start ${time_str(now)}`)

const randomInt = max => Math.floor( Math.random() * Math.floor( max ) )
const randomIdx = length => randomInt( length - 1 )	// random int starting at 0 to e.g. length-1 

const round_user = ( round, user ) => round.users.find( roundUser => roundUser.uid == user.id )


const periods = [ 
	{ name:'day', value: DAY },
	{ name: 'week', value: WEEK },
	{ name: 'month', value: MONTH }
]



const app = {
	...info,
	data: appData,
	time: () => now,
	cron: forward_seconds => { 
		now += forward_seconds 
		time.last_time = now
		fs.writeFileSync(`${config.datadir}/time.json`, JSON.stringify(time,null,2), 'utf8')
	},
	start: ( autosave = true, cb ) => {  // start app
		if (autosave) saveTimer = setInterval( ()=> {
			//let changes = module.exports.roundsAssess()
			//if (cb) cb( changes )
			console.log(`autosaving at ${time_str(now)}`)
			app.save()
		}, 600000 )
		// time
		cronTimer = setInterval( () => app.cron( 10 ), 10000 )
		tallyTimer = setInterval( () => app.ratingsUpdate(), 3600000 * 1 ) // 1 hours
		roundTimer = setInterval( () => app.roundsAssess(), 60000 * 10 ) // 10 minutes
		tokenTimer = setInterval( () => app.refreshTopTokens(), 3600000 * 12 )
		
		tokens.forEach( (token,idx) => console.log( `[${idx}] ${token.name}` ) )
		users.forEach( user => user.receive = null ) // clear out previous state (for development)
		//console.log('not covere',appData.tokens_not_covered)

		console.log(`${now}: tokens covered:${tokens_covered.length}`)
	},
	stop: () => {
		clearInterval(saveTimer)
	},
	save: () => {
		console.log(`${time_str(now)} saving app`)
		app.now = now
		fs.writeFileSync(`${config.datadir}/app.json`, JSON.stringify(appData,null,2), 'utf8')
	},

	saveInfo: () => {
		console.log(`${time_str(now)}: saving info`)
		fs.writeFileSync(`${config.datadir}/info.json`, JSON.stringify(infoData,null,2), 'utf8')
	},

	saveTokens: () => {
		console.log(`${time_str(now)}: saving tokens to ${config.datadir}/tokens.json`)
		fs.writeFileSync(`${config.datadir}/tokens.json`, JSON.stringify(tokenData,null,2), 'utf8')		
	},

	/* rounds */

	roundReviewCategories: ( round, user ) => {
		let roundUser = round.users.find( (rounduser,idx) => ( idx < 2 && rounduser.uid === user.id ) ) 
		if (!roundUser) {
			console.log('!!programmer error, reviewer user not found for round')
			return {}
		}
		let done = []
		let needed = []
		categories.forEach( category => ( roundUser.sections[category] ? done.push(category): needed.push(category) ) )
		return ({ done, needed })
	},
	roundToReview: user => { // get a round to lead

		//let user = users[ userIdx ]
		// sanity check, don't call me if you already have active round
		if ( user.active_review_round !== -1 ) {
			console.log('programmer error!!! user already has active round')
			return
		}

		const lead_round_user = { 
			uid: user.id, 
			start: now, 
			finish:now+round_window_min, 
			sections: {}, 
			payoff: 0,
			win_pctg: {
				questions: 0,
				categories: 0
			}
		}
		console.log(`round to lead for ${user.first_name}`)

		let roundIdx
		let round
		let role
		let roundCandidates = rounds.reduce( ( candidates, round, idx ) => { 
			if (
				round.users[0].uid != user.id  // user was in this round already
				&& !round.users[1].uid 
				&& round.finish >= now + round_window_min
			) 
				candidates.push( idx )
			return candidates
		}, [])
		console.log(`round candidates ${roundCandidates}`)
		if ( roundCandidates.length ) {

			roundIdx = roundCandidates[ randomIdx( roundCandidates.length ) ]
			console.log(`assigning to existing round ${roundIdx}`)
			round = rounds[ roundIdx ]
			round.users[1] = { ...lead_round_user }
			
		} else { // create round
			if (!tokensToCover.length) { // reset list of tokens to choose
				tokensToCover = [...tokens_covered]
			}
			let coverIdx = randomIdx( tokensToCover.length )
			let tokenIdx = tokensToCover[ coverIdx ]
			let token = tokens[ tokenIdx ]
			tokensToCover = tokensToCover.slice(coverIdx, coverIdx)

			console.log(`creating round with token ${token.name}`)
			roundIdx = rounds.length
			round = {
				id: roundIdx,
				token: tokenIdx,
				start: now,
				finish: now + round_window,
				status: 'active',
				question_set: question_set,
				users: [ { ...lead_round_user }, {} ] // first 2 are leads
			}
			rounds.push( round )
			console.log(`created round`,round)
		}

		user.active_review_round = round.id //{ review_state:null, round: roundIdx, media_state: null, role }
		app.save()
		return round
	},
	roundToRate: user => {
		// get least covered round

 		if (user.active_jury_round !== -1) {
 			console.log('already have active jury round')
 			return null
		}

		let roundsActive = rounds.reduce( (actives, round, idx) => {
			if (
				round.status === 'active' 
				&& round.users.findIndex( roundUser => roundUser.uid === user.id ) === -1  // user not in round already
			) actives.push(idx)
			return actives
		}, [] )
		if (!roundsActive.length ) {
			console.log('no valid rounds active')
			return null
		}

		console.log('sorting',roundsActive)
		roundsActive = roundsActive.sort( (r1,r2) => ( rounds[ r1 ].users.length - rounds[ r2 ].users.length ) )
		console.log('rounds active',roundsActive)

		// add jurist to round
		let juryRound = roundsActive[ 0 ]
		let round = rounds[juryRound]
		round.users.push({ 
			uid: user.id, 
			question: 0,
			phase: 0,
			phases: [{ // pre or post review
				start: now, 
				finish: now + round_phase_window, 	
				answers: analyst_questions.map( question => question.restrict == 'post' ? { restricted: true } : {} )
			},{
				start: now + round_phase_window,
				finish: now + 2*round_phase_window,
				answers: analyst_questions.map( question => question.restrict == "pre" ? { restricted: true }: {} )			
			}],
			sways: new Array(analyst_questions.length).fill(0)
		})
		user.active_jury_round = juryRound
		app.save()
		return round
	},
	roundsAssess: () => { // should run every 10 minutes or so, terminates and scores rounds
		console.log(`${time_str(now)} rounds assess (tally)`)
		// tally results for rounds
		let timepassed = now - last_tally
		//let timebegin = now - tally_window

		// if round finished after beginning of window, include its numbers
		/*
		let questionsByCategory = analyst_questions.reduce( ( results, question, qIdx ) => {
			if (!results[question.category]) results[question.category] = [qIdx]
			else results[question.category].push(qIdx)
			return results
		}, {})
		console.log('questions by category', questionsByCategory )
		*/

		// tally windowed_rounds
		rounds.filter( round => round.finish >= now - tally_window ).forEach( round => {
			//console.log(`${now}:run round ${round.id} ${round.finish} ${round.status}` )
			let token = tokens[round.token]
			let tally = {	 
				timestamp: now,
				round: round.id,
				answers: new Array(analyst_questions.length).fill().map( _ => ({count:0, avg:0, sway_count:0, avg_sway:0, winner:null})),
				categories: new Array(categories.length).fill().map( _ => ({count:0, avg:0, sway_count:0, avg_sway:0, winner:null }))
			}

			// go through all the valid answers
			round.users.forEach( (rounduser,uIdx) => {
				if (uIdx < 2) return // not for leads
				analyst_questions.forEach( (question,qIdx) => {
					const whoWins = ( avg, avg_sway ) => {
						if (avg_sway > question.max * 0.2) return 0
						if (avg_sway < -question.max * 0.2) return 1
						return avg > question.max * 0.5 ? 0 : 1
					}
					let answer = rounduser.phases[1].answers[ qIdx ].timestamp ? rounduser.phases[1].answers[ qIdx ] 
						: ( rounduser.phases[0].answers[ qIdx ].timestamp ? rounduser.phases[0].answers[qIdx]: null )
					if (answer) { 
						let sway = rounduser.phases[1].answers[ qIdx ].timestamp && rounduser.phases[0].answers[ qIdx ].timestamp ? 
							{ value: rounduser.phases[1].answers[ qIdx ].value - rounduser.phases[0].answers[ qIdx ].value } : null 
						let categoryIdx = categories.findIndex( category => category == question.category )
						if (categoryIdx == -1) 
							console.log(`programmer error, category "${question.category}" not found for round ${round.id} question ${qIdx}`)
						tallyCat = tally.categories[categoryIdx]
						tallyCat.avg = ( tallyCat.count * tallyCat.avg + answer.value ) / (tallyCat.count + 1)
						tallyCat.count++ 

						if (sway) {
							tallyCat.avg_sway = ( tallyCat.sway_count * tallyCat.avg_sway + sway.value ) / ( tallyCat.sway_count + 1 )
							tallyCat.sway_count++
							tallyCat.winner = whoWins( tallyCat.avg, tallyCat.avg_sway )
						}

						let tallyAnswer = tally.answers[qIdx]
						tallyAnswer.avg = ( tallyAnswer.count * tallyAnswer.avg + answer.value ) / ( tallyAnswer.count + 1 )
						tallyAnswer.count++			
						if (sway) {
							rounduser.sways[qIdx] = sway.value
							tallyAnswer.avg_sway = ( tallyAnswer.sway_count * tallyAnswer.avg_sway + sway.value ) / ( tallyAnswer.sway_count + 1 )
							tallyAnswer.sway_count++
							tallyAnswer.winner = whoWins( tallyAnswer.avg, tallyAnswer.avg_sway )
						}
					}
				})
			})
			// TODO: !! important...test this
			if ( tally.answers.filter( answer => answer.count ).length ) {// && tally.categories.filter( category => category.count ).length ) {
				if (!token.tallies) token.tallies = [tally]
				else {
					token.tallies = token.tallies.filter( tallycheck => tally.round !== tallycheck.round )
					token.tallies.push(tally) // only keep one tally per round
				}
				//console.log('tally',tally)
			}
			//console.log('done')
			// Expire reviewers and raters if due
			if (round.status == 'active') {
				
				// reviewer...if round has only one reviewer and past round_window_min, cancel it
				if ( !round.users[0].start || !round.users[1].start && (now - round.start > round_window_min) ) 
					app.roundCancel( round )
				

				// finish round if in need of finishing
				if (round.finish <= now) 
					app.roundExpire( round )
				

				if (round.status == 'active') round.users.forEach( (roundUser,uIdx) => {// not cancelled or expired, advance rater
					if (uIdx < 2) return
					let user = users[roundUser.uid]
					if (roundUser.phase == 0 && (now - roundUser.phases[0].start > round_phase_window)) {
						roundUser.phase = 1
						roundUser.question = 0
						roundUser.phases[0].finish = now
						roundUser.phases[1].start = now
						roundUser.phases[1].finish = now + round_phase_window
					} else if (roundUser.phase == 1 && (now - roundUser.phases[1].start > round_phase_window * 2 )) {
						// phase 2 timeout call rate again to start new round
						if (round.id == user.active_jury_round) user.active_jury_round = -1
						roundUser.phases[1].finish = now
						roundUser.phase = 2
						roundUser.question = -1
					}
				})
			}

		})
		
		app.save()
		app.saveTokens()

		/* from veva: get winner
        uint8 r0 = uint8(round.averages[ 0 ][ 0 ]);
        uint8 r1 = uint8(round.averages[ 1 ][ 0 ]);
        if ( r1 > r0 + 20) round.winner = 0; if ( r1 - r0 > 20 )
        else if ( r1 < r0 - 20) round.winner = 1; if (r1 - r0 < -20)
        else if ( r1 > 50 ) round.winner = 0;		if r1 > 50
        else round.winner = 1;
		*/
		

		// finalize expired rounds
		//let expireRounds = rounds.filter( round => round.status === 'active' && round.finish <= now)
		//expireRounds.forEach( app.roundExpire )

		last_tally = now
		return { /* analysts_change_stage:[], analysts_round_expired:[]   */ }
	},
	portfolio: () => {

	},
	/*
		{ 	
			'tokenid': {
				current: { day: [{count,value},...], week: [], month: [] },
				previous: { day: [], week: [], month: [] }
				timestamp: time
		}
	*/
	ratingsUpdate: (  ) => { // get best current and previous ratings for different time windows
		const blend = (aa, answer) => ({
			count: aa.count + answer.count, 
			avg: aa.count || answer.count ? ( aa.count * aa.avg + answer.count * answer.avg ) / ( aa.count + answer.count ) : 0
		})
		console.log(`${time_str(now)} ratings update`)
		let ratings = tokens.reduce( ( taccum, token, tIdx ) => {
			if (!token.tallies) return taccum
			console.log(`ratings for token ${token.name} ${tIdx}`)
			taccum[tIdx] = ['current','previous'].reduce( (cpaccum, iteration, idx) => { 	
				cpaccum[iteration] =  periods.reduce( (accum, period, pIdx )=> {
					let time = idx ? now - period.value : now
					accum[period.name] = token.tallies.filter( 
						tally => tally.timestamp < time && tally.timestamp > ( time - period.value ) 
					).reduce( (tally_accum,tally) => {
						if (tally.round == 20 ) {
							console.log('using tally',tally)
							console.log('tally accum',tally_accum)
						}

						// TODO: Fix me!  Doesn't work if questions or categories change
						let reslt = ({ 
							answers: tally.answers.map( ( answer, aIdx) => blend( tally_accum.answers[idx], answer ) ),
							//categories: tally.categories.map( ( category, cIdx) => blend( tally_accum.categories[cIdx], category ) )
							categories: categories.map( ( _, cIdx) => 
								blend( tally_accum.categories[cIdx], cIdx < tally.categories.length ? tally.categories[cIdx]: {count:0,avg:0} ) // not pretty, but needed to resolve old tallies with different categories
							)
						})
						if (tally.round == 20) console.log('returning result')
						return reslt
					},{ 
						answers: new Array(analyst_questions.length).fill().map( _ => ({ count: 0, avg: 0 })),
						categories: new Array(categories.length).fill().map( _ => ({ count: 0, avg: 0 }))
					})
					return accum
				},{})
				return cpaccum
			}, {})
			//if (token.name == 'Komodo') {
			//	console.log('token',token,'\n'+JSON.stringify(token.tallies),'\n'+JSON.stringify(token.rating))
			//}
			return taccum
		
		},{}) 

		
		for (let [key,value] of entries(ratings)) {
			tokens[key].rating = value
			tokens[key].rating.timestamp = now
		} 
		app.saveTokens()
		app.save()
		
		//console.log('result',JSON.stringify(ratings))
	},
	roundClear: ( round ) => {
		round.users.forEach( rounduser => {// remove users references
			console.log('rounduser',rounduser)
			if (rounduser.uid === undefined) return // mainly for second lead if unpopulated
			let user = users[rounduser.uid]
			if (user.active_jury_round === round.id) user.active_jury_round = -1
			rounduser.question = -1
			if (rounduser.phase < 2) {
				if (rounduser.phase == 0) {
					rounduser.phases[1].start = now
					rounduser.phases[1].finish = now
				}
				rounduser.phases[rounduser.phase].finish = now
				rounduser.phase = 2
			}
			else if (user.active_lead_round === round.id) {
				user.active_lead_round = -1
			}
		})
	},
	roundCancel: ( round ) => {
		console.log(`round ${round.id} cancel`)
		app.roundClear( round )
		round.status = 'cancelled'
	},
	roundExpire: ( round ) => {
		// compute sways and points
		console.log(`round ${round.id} expire`)
		app.roundClear( round )
		round.status = 'finished'
		app.roundWinnings( round ) // assess winnings
	},
	roundRole: ( round, user ) => ( 
		round.users[0].uid == user.id ? 'bull': 
		( round.users[1].uid == user.id ? 'bear': 'rater')
	),
	payoff: (user, award, ref) => {
		//console.log('payoff',user, award,ref)
		if (!user.payoffs) user.payoffs = []
		user.payoffs.push( { timestamp: now, award: award, ref: ref, paid: false } )
		//console.log('paid off user',user.id, award, ref)
	},
	payoffsProcess: () => {	// realize tokens from blockchain

	},
	roundWinnings: round => {
		console.log(`assessing winnings for round ${round.id}`)
		let token = tokens[round.token]
		//console.log('token tallies',token.tallies)
		let tally = token.tallies.find( tally => tally.round == round.id )
		/*token.tallies.reduceRight( (rslt, tally, tIdx, arr) => {
			//console.log('tally reduce',tally,tIdx)
			console.log(`round ${tally.round} id: ${round.id}`)
			if (tally.round !== round.id) return rslt
			console.log('got tally')
			arr.splice(0) // terminate, found
			return tally
		},{}) */
		if (!tally) return
		//console.log(`got tally for round ${round.id} and token ${round.token}:${tokens[round.token].name}`,tally)

		// award lead winner
		let counts = tally.categories.reduce( (counts, category) => {
			if (category.winner === null) return counts
			counts[category.winner]++
			return counts
		},[0,0])
		console.log('got counts',counts)
		round.winner = counts[0] === counts[1] ? null : (counts[0] > counts[1] ? 0 : 1) 
		if (round.winner !== null) {
			console.log('round winner',round.winner,' user ',round.users[round.winner].uid)
			let roundUser = round.users[round.winner]
			roundUser.payoff = PAYOFF_LEAD_WIN
			app.payoff( users[roundUser.uid], PAYOFF_LEAD_WIN, round.id )			
		}

		// award jurists
		let percentiles = []
		round.question_set.forEach( (qnum,qIdx) => { // for each question / answer
			let question = analyst_questions[qnum]
			// TODO: check for question used as assessment or disqual
			let tally_answer = tally.answers[qIdx] 
			if (tally_answer.sway_count < 3) return // no winners for this question
			let avg_sway = tally_answer.avg_sway
			console.log(`question ${qIdx}:${qnum} avg_sway ${avg_sway}`,tally_answer)
			// for each round user
			let distancesum = 0
			let roundusersdistance = round.users.filter( (_,idx) => idx > 1 ).map( (roundUser,ruIdx) => { // no leads
				let sway = roundUser.sways[qIdx]
				console.log(`round user ${ruIdx} ${roundUser.uid} sway `,sway)
				if (!samesign(sway,avg_sway)) return null
				let distance = Math.sqrt(Math.abs( sway * sway - avg_sway * avg_sway ))
				distancesum += distance
				return distance
			})
			console.log(`distancesum ${distancesum} -- roundusersdistance`,roundusersdistance)
			// calculate the percentiles
			percentiles[qIdx] = roundusersdistance.map( distance => {
				if (distance == null || distancesum == 0) return null
				return distance / distancesum
			})
		//convert to winnings 10,25,50 of PAYOFF_JURIST_WIN			
		})
		console.log(`percentiles `,percentiles)
		if (!percentiles.length) return // no valid entries
		let percentile_summaries = new Array(round.users.length-2).fill().map( (_, uIdx) => 
			percentiles.reduce( (accum, uArr, qIdx) => {
				if (uArr && uArr[uIdx]) {
					accum.value = (accum.value * accum.num_answered + uArr[uIdx]) / (accum.num_answered+1)
					accum.num_answered++
				}
				return accum
			},{num_answered:0,value:0})
		)
		let total_answered = percentile_summaries.reduce( (total,summary) => (total + summary.num_answered),0)
		let total_normalized = 0
		console.log(`answered ${total_answered} -- percentile summaries`,percentile_summaries)
		let normalized_scores = percentile_summaries.map( user_summary => {
			score = user_summary.num_answered / user_summary.value
			normalized = score / total_answered
			total_normalized += normalized
			return normalized
		})

		let winnings = normalized_scores.map ( (user_score,uIdx) => {
			let roundUser = round.users[uIdx+2]
			percentage_score = user_score / total_normalized
			let winning = PAYOFF_JURIST_WIN * percentage_score 
			roundUser.payoff = winning
			app.payoff( users[roundUser.uid], winning, round.id )		
			return winning
		})
		console.log(`winnings:`,winnings)

		// Assess winnings for jurists
			/*     
			   {
          round: 3,
          "timestamp": 1516252940,
          "answers": [
            {
              "count": 1,
              "avg": 3,
              "sway_count": 0,
              "avg_sway": 0,
              "winner": null
            },
            {
              "count": 1,
              "avg": 2,
              "sway_count": 0,
              "avg_sway": 0,
              "winner": null
            },
            {
              "count": 1,
              "avg": 2,
              "sway_count": 0,
              "avg_sway": 0,
              "winner": null
            },
            {
              "count": 1,
              "avg": 3,
              "sway_count": 0,
              "avg_sway": 0,
              "winner": null
            },
            {
              "count": 1,
              "avg": 2,
              "sway_count": 0,
              "avg_sway": 0,
              "winner": null
            },
            {
              "count": 1,
              "avg": 3,
              "sway_count": 0,
              "avg_sway": 0,
              "winner": null
            },
            {
              "count": 1,
              "avg": 3,
              "sway_count": 0,
              "avg_sway": 0,
              "winner": null
            },
            {
              "count": 1,
              "avg": 3,
              "sway_count": 0,
              "avg_sway": 0,
              "winner": null
            },
            {
              "count": 1,
              "avg": 3,
              "sway_count": 1,
              "avg_sway": 2,
              "winner": 0
            }
          ],
          "categories": [
            {
              "count": 0,
              "avg": 0,
              "sway_count": 0,
              "avg_sway": 0,
              "winner": null
            },
            {
              "count": 0,
              "avg": 0,
              "sway_count": 0,
              "avg_sway": 0,
              "winner": null
            },
            {
              "count": 1,
              "avg": 3,
              "sway_count": 0,
              "avg_sway": 0,
              "winner": null
            },
            {
              "count": 1,
              "avg": 2,
              "sway_count": 0,
              "avg_sway": 0,
              "winner": null
            },
            {
              "count": 0,
              "avg": 0,
              "sway_count": 0,
              "avg_sway": 0,
              "winner": null
            },
            {
              "count": 1,
              "avg": 2,
              "sway_count": 0,
              "avg_sway": 0,
              "winner": null
            },
            {
              "count": 1,
              "avg": 3,
              "sway_count": 0,
              "avg_sway": 0,
              "winner": null
            },
            {
              "count": 1,
              "avg": 2,
              "sway_count": 0,
              "avg_sway": 0,
              "winner": null
            },
            {
              "count": 1,
              "avg": 3,
              "sway_count": 0,
              "avg_sway": 0,
              "winner": null
            },
            {
              "count": 2,
              "avg": 3,
              "sway_count": 0,
              "avg_sway": 0,
              "winner": null
            },
            {
              "count": 1,
              "avg": 3,
              "sway_count": 1,
              "avg_sway": 2,
              "winner": 0
            }
          ]
        } */

	},
	roundsClear: () => { // clear all rounds...beware!
		appData.rounds = []
		rounds = appData.rounds
		users.forEach( user => {
			console.log('clearing for user',user)
			user.active_jury_round = -1
			user.active_review_round = -1
		})
		app.save()
	},

	/* tokens */
	getTokenId: name => ( appData.tokens.findIndex( token => token.name == name ) ),
	refreshTokenIds: () => (
		coinmarket.refreshIds( ).then( token_ids => {
			tokenData.coinmarket_ids = token_ids 
			app.saveTokens()
		}).catch( err => console.log('error fetching token ids ',err))
	),
	refreshTokenQuotes: ids => (
		coinmarket.refreshQuotes( ids ).then( token_quotes => {
			tokenData.coinmarket_quotes = token_quotes 
		}).catch( err => console.log('error fetching token quotes ',err))
	),
	refreshTokenTickers: () => {
		coinmarket.refreshTickers( {sort:'market_cap'} ).then( token_tickers => {
			tokenData.coinmarket_tickers = token_tickers 
			app.saveTokens()
		}).catch( err => console.log('error fetching token tickers ',err))
	},
	refreshTopTokens: () => {
		coinmarket.refreshTickers( {sort:'market_cap',limit:200} ).then( token_tickers => {
			//tokenData.coinmarket_tickers = token_tickers
			token_tickers.forEach( ( ticker_token, tIdx ) => {
				console.log(`${tIdx} token fetched ${ticker_token.name}`)
				var { id, quote, ...t_token } = ticker_token
				quote = { ...quote.USD, units:'USD' }
				t_token.cmc_id = id
				let token_idx = tokens.findIndex( token => token.cmc_id == ticker_token.id )
				if ( token_idx == -1 ) {
					token_idx = tokens.length
					tokens.push( { id:token_idx, ...t_token, quotes:[] } )
				} else {
					t_token.quotes = tokens[ token_idx ].quotes
				}
				let token = tokens[ token_idx ]
				token.tags = tIdx < 100 ? ['top'] : (token.quotes.reduce((mover,past_quote) => { // decipher if is a mover
					if (mover) return true
					let timedelta = +moment(quote.last_updated) - +moment(past_quote.last_updated)/1000
					return 
						timedelta >= WEEK 
						&& timedelta <= FORTNIGHT 
						&& past_quote.market_cap < quote.market_cap 
						&& (quote.market_cap - past_quote.market_cap) / quote.market_cap > 0.2  // 20% increase
					? true : false
				}, false ) ? ['mover','next'] : ['next'] )

				token.quotes.push( quote )
			}) 
			app.saveTokens()
		})
	},
	refreshTopTokensEthplorer: () => { // no longer used
		ethplorer.getTopTokens().then( tops => {
			//appData.tokens_top = tops
			let toptokens = tops.data.tokens
			//console.log('tops',toptokens )
			toptokens.forEach( toptoken => {
				let tokenFound = appData.tokens.findIndex( token => token.name === toptoken.name )
				if (tokenFound === -1) {
					let name = toptoken.name.trim()
					console.log(`${now} adding token ${name}`)
					appData.tokens.push( { address: toptoken.address, name: name, markets: [] } )
					tokenFound = appData.tokens.length - 1
				}
				//appData.tokens[ tokenFound ].markets.push( { timestamp: now, ...toptoken } )
			})
			app.save()
		}).catch( err => console.log(err) )
	},
	refreshTokensEthplorer: () => { // no longer used
		console.log(`${time_str(now)} refresh tokens`)
		doFetch = () => {
			let token = appData.tokens[nextTokenFetch]
			if (!token.markets) token.markets = []
			//console.log('fetch token with address',token.address)
			fetchToken( token.address ).then( marketData =>{
				console.log(`${now}: got token ${token.name} data`)
				token.markets.push( { timestamp: now, ...marketData } )
				//console.log(appData.tokens)
				if (++nextTokenFetch === appData.tokens.length ) {
					console.log('finish fetching tokens')
					app.save()
					nextTokenFetch = 0
				} else {
					doFetch()
				}
			})
		}
		doFetch()

	},
	stopTokens: () => {

	},

	/* users */
	identify: msg => { // who am i
		let t_user = msg.from
		let chat = msg.chat ? msg.chat.id : null

		let idx = appData.users.findIndex( user => user.t_id === t_user.id )

		if (idx !== -1) return appData.users[idx]

		// first time in, create user
		let user = { 
			id: appData.users.length,
			...refcode.getRefCodePair(),
			t_id: 					t_user.id, 
			t_chat_id: 			chat,
			first_name: 		t_user.first_name,
			last_name: 			t_user.last_name,
			username: 			t_user.username, 
			language_code: 	t_user.language_code, 
			active_jury_round:-1,
			active_review_round:-1
		}
		appData.users.push( user )
		app.save()
		return user
	},

	/* news / info */
	refreshInfo: () => {
		doFetch = () => {
			let token = tokens[nextTokenInfoFetch]
			//if (!infoData.tokens[token.name]) infoData.tokens[tokenName] = 
			console.log(`getting details for ${token.name}`)
			let tokenName = token.name.toLowerCase()
			app.coinDetails( tokenName ).then( details => {
				console.log('got token details',details)
				if (!infoData.tokens[token.name]) infoData.tokens[token.name] = { timestamp: Math.round( moment.now() / 1000 ) }
				infoData.tokens[token.name].details = details
				console.log(`check top news for ${tokenName}`)
				app.topNewsByCoin( tokenName ).then( news => {
					infoData.tokens[token.name].news = news
					// save any coins for staging if included in the article and not in the db
					news.forEach( anews => anews.coins.forEach( coin => {
						console.log('checking coverage for ',coin)
						let coinname = coin.name.toLowerCase()
						let tokenFound = tokens.findIndex( token => token.name.toLowerCase() === coinname )
						if ( tokenFound === -1 && !tokenData.tokens_not_covered[coin.name] ) {
							//console.log('adding ',coin.name)
							tokenData.tokens_not_covered[coin.name] = { name: coin.name }
						}
					}))
					if (++nextTokenInfoFetch === tokens.length ) {
						app.saveInfo()
						app.saveTokens()
						app.save()
						nextTokenInfoFetch = 0
					} else {
						doFetch()
					}					
				}).catch( err => {
					console.log('!!!!should not happen, error in getting news',err)
				})

			}).catch( err => { 
				console.log(`fail to get info`,err )
				if (++nextTokenInfoFetch === tokens.length ) {
					app.saveInfo()
					app.saveTokens()
					app.save()
					nextTokenInfoFetch = 0
				} else {
					doFetch()
				}
			})
		}
		doFetch()

	},
	roundReviews: round => {
		return categories.reduce( ( result, category, cidx ) => {
			if (
				!round.users[0].sections[category] && 
				(round.users[1].uid == undefined || !round.users[1].sections[category])
			) return result
			let reply = [
				round.users[0].sections[category] || '[-no review-]',
				round.users[1].sections[category] || '[-no review-]'
			]
			console.log('reply',reply)
			return `${result}\n\n<b>${category}</b>\n\n<i>bull:</i> ${reply[0]}\n\n<i>bear:</i> ${reply[1]}`
		},'')
	},
	userActivity: user => {
		console.log('get user activity',user.id)
		let roundsData = rounds.reduce( (output, round) => {
			console.log('round',round)
			let roundUserIdx = round.users.findIndex( rounduser => rounduser.uid == user.id )
			if (roundUserIdx == -1) return output

			console.log('get round info',round.id)
			roundUser = round.users[roundUserIdx]
			if (roundUserIdx < 2) {
				console.log('review') // ,roundUserIdx,roundUser)

				output.reviews.push({
					id: round.id,
					token: round.token,
					status: round.status,
					role: roundUserIdx,
					start: round.start,
					finish: round.finish,
					review_start: roundUser.start,
					review_finish: roundUser.finish,
					raters: round.users.length - 2,
					win_pctg:{
						answers: [],
						categories: []
					},
					winnings: 0
				})
				//console.log('review output',output)
			} else { // rating
				console.log('rating')
				output.ratings.push({
					id: round.id,
					token: round.token,
					status: round.status,
					start: round.start,
					finish: round.finish,
					phase: roundUser.phase,
					rating_start: roundUser.phases.map( phase => phase.start ),
					rating_finish: roundUser.phases.map( phase => phase.finish ),
					raters: round.users.length - 2,
					winnings: round.winnings
				})
			}
			return output
		},{reviews:[],ratings:[]})

		console.log('check winnings',user)
		let winnings = user.payoffs == undefined ? 0 : user.payoffs.reduce( (winnings,payoff) => { 
			winnings.total += payoff.award 
			if (payoff.paid) winnings.paid += payoff.award
			return winnings
		},{ total:0, paid:0 })
		console.log('done')
		return { ...roundsData, total_winnings: winnings.total, paid_winnings: winnings.paid }
		
		/*
		{ 
			reviews: [{
				id:
				role:
				start:
				finish:
				review_start:
				review_finish:
				win_pctg:{
					answers:
					categories:
				}
				winnings: 2
			},{...}],
			ratings:[
				id:
				start:
				finish:
				winnings:
			]
			
			
		}
		*/

	},
	say: (command, data = {}) => { // command processor for the app
		var retval
		let round
		let user = data.user
		let catName
		let roundUser
		let question_number
		let answer
		let question
		let phase
		let token

		//var ret = (text,format) => ({ text:text, format:format })
		console.log(`command is ${command}`,data)
		switch (command) {
			case 'commands': 
				retval = { text: dialogs['commands'].text() }
				break
			case 'activity':
				let activity = app.userActivity( user )
				console.log(`past rounds for ${user.first_name}`,activity)
				retval = { text: dialogs['user.activity'].text({ user, activity }), parse:parseHtml }
				break
			case 'account':
				break
			case 'news':
				break
			case 'news_refresh':
				app.refreshInfo()
				retval = { text: dialogs['news.refresh'].text() }
				break
			case 'ratings':
				app.ratingsUpdate()
				retval = { text: dialogs['token.ratings'].text() }
				break
			case 'summaries':
				break
			case 'cron':
				app.cron( data.delta )
				retval = { text: formatters.apptime( app.time() ) }
				break
			case 'time':
				console.log('time')
				retval = { text: formatters.apptime( app.time() ) }
				break
			case 'rate':
				console.log('rate',user)
				if (user.active_jury_round !== -1) {
					round = rounds[ user.active_jury_round ]
					console.log('got round',round)
					roundUser = round_user( round, user )
					console.log('got round user',roundUser)
					// check for timeout...if timeout phase 1 move to phase 2...if timeout phase 2 (say timed out and) get another to rate
					if (roundUser.phase == 0 && (now - roundUser.phases[0].start > round_phase_window)) {
						roundUser.phase = 1
						roundUser.phases[1].start = now
						roundUser.question = 0
					} else if (roundUser.phase == 1 && (now - roundUser.phases[1].start > round_phase_window )) {
						// phase 2 timeout call rate again to start new round
						user.active_jury_round = -1
						roundUser.phase = 2
						roundUser.question = -1
						round = app.roundToRate( user )
					}
					console.log('returning now')
					retval = round ? 
						{ text: dialogs['analysis.already'].text( { round, user }), parse:parseHtml }
						: { text: dialogs['analysis.none'].text(), status: -1 }		
				
				} else {		
					round = app.roundToRate( user )
					console.log('round to rate',round)
					retval = round ? 
						{ text: dialogs['analysis.active'].text( { round, user }), parse:parseHtml }
						: { text: dialogs['analysis.none'].text(), status: -1 }					
				}
				break

			case 'roundsClear':
				console.log('rounds clear')
				app.roundsClear()
				retval = { text: dialogs['rounds.clear'].text() }
				break
			case 'questions':
				retval = { text: formatters.analyst_questions( analyst_questions ) }
				break
			case 'question':
				round = rounds[user.active_jury_round]
				roundUser = round.users.find( roundUser => roundUser.uid == user.id )
				// put analysts in proper pre or post stage
				retval = { 
					text: dialogs['analysis.question'].text({ round, user }), 
					format: formatters.analyst_question(analyst_questions[roundUser.question],roundUser.question),
					parse:parseHtml
				}

				break
			case 'question_answer': // answered question
				question_number = data.question_number
				answer = data.answer
				round = rounds[user.active_jury_round]
				roundUser = round.users.find( roundUser => roundUser.uid == user.id )
				phase = roundUser.phases[roundUser.phase]
				phase.answers[question_number] = { value: answer, timestamp: now }
				roundUser.question = phase.answers.findIndex( (answer,idx) => 
					!answer.timestamp 	// not answered yet
					&& !answer.restricted  // question not to be given because belongs only to other phase
				)
				//console.log('next question',roundUser.question)

				if (roundUser.question == -1) { // finished phase...todo: time check for 10 minute limit
					phase.finish = now
					if (roundUser.phase == 2) {
						console.log('!! programmer error, should not be here in phase 2')
					}
					if (roundUser.phase == 1) {
						user.active_jury_round = -1
						roundUser.phases[1].finish = now
						roundUser.phase = 2
						retval = { text: dialogs['analysis.finished'].text({ round, user }), parse:parseHtml }
					} else { // move to next phase
						roundUser.phase = 1
						roundUser.question = 0
						phase = roundUser.phases[1]
						phase.start = now
						retval = { text: dialogs['analysis.finish.pre'].text( { round, user} ), parse:parseHtml, status: 1 }
					}
				} else {
					retval = {
						text: dialogs['analysis.question'].text({ round, user }),
						format: formatters.analyst_question(analyst_questions[roundUser.question],roundUser.question),
						parse:parseHtml
					}
				}
				app.save()
				break
			case 'start':
				//console.log(`got user ${idx}`,user)
				retval = { text: dialogs['welcome.new'].text({user:data.user}), format: formatters.menu() }
				break
			case 'restart':
				retval = { text: dialogs['welcome.returning'].text({user: data.user}), format: formatters.menu() }
				break
			case 'tokens':
				let tokensDisplay = data.number && data.number < tokens.length ? 
					tokens.reduce( ( accum, _, idx) => { 
						if (idx >= data.number && idx < data.number+100) 
							accum.push(idx) 
						return accum 
					},[])
					: tokens_covered
				retval = { text:dialogs['tokens'].text(), format:formatters.tokens(  tokensDisplay, tokens ) }
				break
			case 'token_ids':
				app.refreshTokenIds()
				retval = { text: 'ids refreshing' }
				break
			case 'token_quotes':
				app.refreshTokenQuotes( data.ids ) // needs ids
				retval = { text: 'quotes refreshing' }
				break
			case 'token_tickers':
				app.refreshTokenTickers()
				retval = { text: 'tickers refreshing' }
				break
			case 'tokens_refresh':
				app.refreshTokens() // can do this on regular interval
				retval = { text:dialogs['tokens.refresh'].text() }
				break
			case 'tokens_top':
				app.refreshTopTokens()
				retval = { text: dialogs['tokens.top'].text() }
				break
			case 'token':
				let tokenId = Number.isInteger(data.id) ? data.id : app.getTokenId( data.name )
				console.log(`checking token ${tokenId}`)
				if( tokenId === -1)
					retval = { text:dialogs['token.notfound'].text( {tokenName:data.name} ) } 
				else {
					token = tokens[tokenId]
					let quotes = token.quotes
					let current = quotes[quotes.length-1]
					//retval = { text: formatters.tokenMarket( current ), parse: parseHtml }
					retval = { 
						text: dialogs['token'].text( { token:token, quote: current, rating:token.rating } ),
						format: formatters.token( token, tokenId ),
						parse: parseHtml
					}
				}
				break
			case 'review':
				const fresh_round = () => {
					console.log(`finding review round for user ${user.id}`)
					round = app.roundToReview( user )
					console.log('app-round created',round)
					return ({ text: dialogs['review.started'].text( { round, user } ), parse: parseHtml })
				}
				if ( user.active_review_round !== -1 ) {
					//console.log('already review busy')
					round = rounds[ user.active_review_round ]
					roundUser = round_user(round,user) 
					if (now - roundUser.start > round_window_min) {
						user.active_review_round = -1
						retval = fresh_round()
					} // timeout 
					else 
						retval = { text: dialogs['review.already'].text( {round,user} ), parse: parseHtml } //console.log('with round',round)
				
				} else {
					retval = fresh_round()
				}
				break
			case 'review_categories': // query for categories
				round = appData.rounds[user.active_review_round]
				const { needed: needed } = app.roundReviewCategories( round, user )
				console.log('needed',needed)
				if (needed[0] === 'overview') {
					//console.log('overview needded')
					retval = { 
						text: dialogs['review.overview'].text( { round, user }), 
						parse:parseHtml
					}
					user.receive = 'review-category-0'
				} else if ( needed.length > 0 ) {
					console.log('other cats needed')
					retval = { 
						text:dialogs['review.categories.pick'].text({round,user}), 
						format: formatters.reviewer_categories( needed ), 
						parse:parseHtml
					}
				} else {
					retval = {
						text:dialogs['review.categories.finished'].text({ round, user }),
						status: -1
					}
					user.active_review_round = -1 // enable next round to review
				}
				break
			case 'review_category_request': // request to review category
				//console.log('review category request',data)
				round = appData.rounds[user.active_review_round]
				//console.log('round',round)

				catName = categories[data.category]
				//console.log('cat name',catName)
				retval = { 
					text: dialogs['review.category.request'].text( {round, user, category:catName } ),
					parse: parseHtml
				}
				user.receive = 'review-category-'+data.category
				break
			case 'review_category': // submit a category review
				user = data.user
				//console.log('review category',data)
				round = appData.rounds[user.active_review_round]
				//console.log('round',round)

				catName = categories[data.category]
				//console.log('cat name',catName)
				roundUser = round.users.find( roundUser => roundUser.uid == user.id )
				roundUser.sections[catName] = data.text
				//console.log('round is now',round)
				app.save()
				retval = { text: `review submitted for <b>${catName}</b>`, parse:parseHtml }
				break
			case 'tally':
				app.roundsAssess()
				retval = { text: 'rounds assessed' }
				break
			default: 
				console.log(`unknown command ${command}`)
		}
		console.log('retval',retval)
		return retval
	},

	runScript: name => {
		let script = scripts[name]
		console.log('running script ',script)

	},

	dialogs: {
		'commands': {
			text: () => commands.reduce( ( result, command ) => (`${result}\n/${command}`), '')
		},
		'welcome.new': {
			text: ({ user }) => `Welcome ${user.first_name}...what you can do with ratestream:`
		},
		'welcome.returning': {
			text: ({ user }) => `Welcome back ${user.first_name}`
		},
		'analysis.active': {
			text: ({ round, user }) => {
				let roundUser = round_user( round, user )
				let phase = roundUser.phases[roundUser.phase]
				return (
					`${user.first_name} now active in round with token <b>${token_name(round)}</b>`
					+ `\n\ncomplete ${moment(1000*(phase.start + round_phase_window)).from(1000*now)} to finish the '${roundUser.phase ? 'post-review':'pre-review'}' phase` 
				)
			}
		},
		'analysis.none': {
			text: () => `Sorry...no rounds to rate right now`
		},
		'analysis.start': {
			text: ({ round, user }) => `starting analysis with token ${token_name(round)}`
		},
		'analysis.already': {
			text: ({ round, user }) => {
				let roundUser = round_user( round, user )
				//console.log('round user',roundUser)
				let phase = roundUser.phases[roundUser.phase]
				//console.log('!!!times:',phase.start,round_phase_window,now,phase.start + round_phase_window - now)
				return (
					`${user.first_name} you are already rater in round with token <b>${token_name(round)}</b>`
					+ `\n\nyou are on phase ${roundUser.phase ? 'post-review':'pre-review'}...complete ${moment(1000*(phase.start + round_phase_window )).from(1000*now)}`
				)
			}
		},
		'analysis.finish.pre': {
			text: ({ round, user }) => {
				// tell round is finished
				let reviews = app.roundReviews( round )
				return (
					`\n\n<b>pre</b>-rating finished!`
					// tell reviews submitted
					+`\n\n${dashes}\nreviews:\n`
					+ app.roundReviews(round)
					// start questions
					+`\n\nnow the <b>post</b> review questions\n`
				)
			}
		},
		'analysis.reviews': {

		},
		'analysis.question':{
			text: ({ round, user}) => {
				let roundUser = round.users.find( roundUser => roundUser.uid == user.id )
				//console.log('round user question ',roundUser)
				let question = analyst_questions[roundUser.question]
				let text = isStr(question.text) ? question.text : question.text[roundUser.phase ? "post":"pre"]
				return `\n${tokens[round.token].name}\n<b>${question.category}</b>:${question.name}      <i>${roundUser.phase ? 'post-review':'pre-review'}</i>\n\n${text}`
			}
		},
		'analysis.finished':{
			text: ({ round, user }) => 'All questions answered'
		},
		'news.refresh':{
			text: () => 'refreshing news information'
		},
		'review.started': {
			text: ({round, user }) => {
				let roundUser = round_user(round,user)
				return (
					`Great ${user.first_name}....you are now Lead ${app.roundRole(round,user)} reviewer for token ${token_name(round)}.`
					+ `\n\nTo lead the round, You will need to submit reviews for \n${categories.map( category => `\n  ${category}`) }.`
					+ `\n\n<i>complete ${moment(1000*(roundUser.start + round_window_min)).from(1000*now)}</i>`
				)
			}
		},
		'review.overview': {
			text: ({ round, user }) => (
				`please submit <b>${app.roundRole(round,user)} overview</b> for <b>${token_name(round)}</b> now to get started`
			)
		},
		'review.already': {
			text: ({round, user}) => {
				let roundUser = round_user(round,user)
				console.log('!!times',roundUser.start,round_window_min, now)
				return (
					`${user.first_name}...you are already ${app.roundRole( round, user )} reviewer for ${token_name(round)}`
					+ `\n<i>complete ${moment(1000*(roundUser.start + round_window_min)).from(1000*now)}</i>`
				)
			}
		},
		'review.categories.awaiting':{
			text: () => ``
		},
		'review.categories.finished':{
			text: ({ round, user }) => `Great ${user.first_name}...all categories reviewed for ${token_name(round)}.  Good luck!`
		},
		'review.categories.pick': {
			text: ({ round, user }) => `${user.first_name} pick a category to review now`
		},
		'review.category.request': {
			text: ({round,user,category}) => (
				`please submit <b>${app.roundRole(round,user)}</b> review of <b>${category}</b> for <b>${token_name(round)}</b>`
			)
		},
		'review.warning.round.ending': {
			text: () => `warning!  round ends in... Get your reviews in...still missing`
		},
		'rounds.clear': {
			text: () => 'rounds cleared'
		},
		'rounds.tally': {
			text: () => 'rounds tallied'
		},
		'sample.summary': {
			text: () => ``
		},
		'token.notfound': {
			text: ({tokenName}) => `no token ${tokenName} in our library`
		},
		'token.ratings': {
			text: () => `got token ratings`
		},
		'token': {
			text: ( {token, quote, rating }) => {
				const chg = (curr, prev) => (!curr.count || !prev.count ? ' ' : ( curr.avg > prev.avg ? '⬆': (curr.avg < prev.avg ? '⬇': '↔' )))
				const updown = num => `${num > 0 ? '⬆':'⬇'}`
				let str = `\n\n<a href="https://coinmarketcap.com/currencies/${token.slug}/">${token.name}</a>`
				if (quote.price) {
					str += `\nprice <b>${quote.price.toFixed(4)}</b> ${quote.units} -- vol: ${utils.format(quote.volume_24h)} -- mkt cap: ${utils.format(quote.market_cap)}`
							+ `\nΔ% 24h:${utils.format(quote.percent_change_24h)}${updown(quote.percent_change_24h)} 7d:${utils.format(quote.percent_change_7d)}${updown(quote.percent_change_7d)}`
					    + `      rank:${token.cmc_rank} updated:${moment(quote.last_updated).format('DD-MMM-YY hh:ss')}\n`
					/*
          "volume_24h": 5645084065.18842,
          "percent_change_1h": 0.41041,
          "percent_change_24h": -5.12802,
          "percent_change_7d": -6.32094,
          "market_cap": 112057203667.55663,			
          "last_updated": "2018-09-06T23:14:25.000Z",	
				*/
				}
				let description = ((infoData.tokens[token.name] || {}).details || {}).description || null
				if (description){
					console.log('got description',description)
					str += `\n${description}\n`
				}
				if (rating) {
					let cats = {
						day: rating.current.day.categories.reduce( (str,cat,cidx) => (
							str + (cat.count == 0 ? '---' : cat.avg.toFixed(1)) + chg(cat,rating.previous.day.categories[cidx]) + ' '
						), ''),
						week: rating.current.week.categories.reduce( (str,cat,cidx) => (
							str + (cat.count == 0 ? '---' : cat.avg.toFixed(1)) + chg(cat,rating.previous.week.categories[cidx]) + ' '
						), ''),
						month: rating.current.month.categories.reduce( (str,cat,cidx) => (
							str + (cat.count == 0 ? '---' : cat.avg.toFixed(1)) + chg(cat,rating.previous.month.categories[cidx]) + ' '
						), '')
					}

					str += `\n...ratings / change ↔⬆⬇` // 
					 		+ `\n\n<i>categories======</i>\n${categories.reduce((str,cat) => str + cat.substr(0,4) + ' ','')}`
					 		+ `\n\n<i>day</i>\n${cats.day}`
					 		+ `\n<i>week</i>\n${cats.week}`
					 		+ `\n<i>month</i>\n${cats.month}\n\n<i>======categories</i>\n`
				}

				return `\n${str}`
			}
		},
		'tokens': {
			text: () => `Covered Tokens`
		},
		'tokens.refresh': {
			text: () => `Refreshing tokens`
		},
		'tokens.top': {
			text: () => `Refreshing and acquiring top tokens (by market cap)`
		},
		'user.activity': {
			text: ({ user, activity }) => {
				let str = `${activity.reviews.length || activity.ratings.length ? '':' no'} activity for ${user.first_name}`
				if (activity.reviews.length) {
					str += `\n\n${dashes}\n<i>------reviews------</i>\n${dashes}\n`
					str += activity.reviews.map( review => {
						let revstr = 
							`\n\n${user.active_review_round == review.id ? '*':' '}<b>${tokens[review.token].name}</b> [<i>${review.role?'bear':'bull'}</i>]`
						 	+ `\n<i>review started ${time_from(review.review_start)}--finish ${time_from(review.review_finish)}</i>`
						 	+ `\n<i>${review.raters} raters</i>`
						return revstr
					})
				} 
				if (activity.ratings.length) {
					str += `\n\n${dashes}\n<i>------ratings------</i>\n${dashes}\n`
					str += activity.ratings.map( rating => {
						console.log('rating',rating)
						let revstr = 
							`\n\n${user.active_jury_round == rating.id ? '*':' '}<b>${tokens[rating.token].name}</b>`
							+ `\n<i>round started ${time_from(rating.start)}--finish ${time_from(rating.finish)}</i>`
							+ `\n<i>${rating.raters} raters</i>`
						if (rating.phase < 2) {
							revstr += `\n<i>on ${rating.phase ? 'post-':'pre-'}ratings--started ${time_from(rating.rating_start[rating.phase])}...finish ${time_from(rating.rating_finish[rating.phase])}</i>`
						} else {
							revstr += `\n<i>finish ${time_from(rating.rating_finish[1])}</i>`
						}
						return revstr
					})
				}
				str += `\n\n${dashes}\n<i>total winnings:</i> <b>${activity.total_winnings}</b>\n<i>paid winnings:</i> <b>${activity.paid_winnings}</b>\n${dashes}\n`
				return str
			}
		}
	},

	formatters: {
		commands: cmds => {
			
		},
		menu: () => ({ 
			"reply_markup": {
				"resize_keyboard": true,
	    	"keyboard": [
	    		[ "tokens", "cmds", "news", "activity" ],
	    		[ "rate", "review", "portfolio", "settings" ]
	    	]
	   	}
		}),
		analyst_question: ( question, question_number ) => {
			let ik = []
			let row = []
			if (question.max == 2) { // yes/no
				row.push( { text: 'yes', callback_data: `question-${question_number}-0` } )
				row.push( { text: 'no', callback_data: `question-${question_number}-1` } )
			} else if (question.max == 3) {
				row.push( { text: 'yes', callback_data: `question-${question_number}-0` } )
				row.push( { text: 'no', callback_data: `question-${question_number}-2` } )
				row.push( { text: 'uncertain', callback_data: `question-${question_number}-1` } )
			} else for (let idx = 1; idx <= question.max; idx++ ) {
	 			row.push( { text: config.ratings[question.max-1][idx-1], callback_data: `question-${question_number}-${idx-1}` })
			}
			ik.push( row )
			console.log('ik',JSON.stringify(ik))
	   	return { reply_markup:{ inline_keyboard: ik } }
		},
		analyst_questions: ( questions ) => (
			questions.reduce( (str, question, num) => ( `${str}${num+1}. ${question.text}\n` ), "")
		),
		reviewer_categories: ( categories ) => {
			let ik = []
			let row = []
			categories.forEach( (category,idx) => {
				let catIdx = config.review_categories.findIndex( allcategory => allcategory == category )
				let col = { text: category, callback_data: `review-category-${catIdx}` }
				if (idx % 3 != 0) { // add column
					row.push( col )
				} else { // new row
					if (row.length) ik.push( row )
					row = [ col ]
				}
			})
			ik.push( row )
			return { reply_markup:{ inline_keyboard: ik } }		
		},
		rounds: rounds => {

		},
		apptime: seconds => ( 
			`app time is [${seconds}] ${moment(seconds*1000).format('DD-MMMM-YYYY HH:MM:SS')}`
		),
		token: ( token, id ) => {
			let ik = [[ 
				{ text: 'info detail', callback_data: `token-details-${id}`},
				{ text: 'rating detail', callback_data: `token-something`}
			]]
			return { reply_markup:{ inline_keyboard: ik } }		
		},
		tokens: (tokenIdxs, tokens) => {
			//	let msgtokens = tokens.reduce( (str,token) => `${str}[${token.name}] `, "" )
			let ik = []
			let row = []
			tokenIdxs.forEach( (idx,num) => {
				let token = tokens[ idx ]
				let col = { text: token.name, callback_data: `token-${idx}` }
				if (num % 3 != 0) { // add column
					row.push( col )
				} else { // new row
					if (row.length) ik.push( row )
					row = [ col ]
				}
			})
			ik.push( row )
			console.log(ik)
			return { reply_markup:{ inline_keyboard: ik } }
		

		},
		tokenQuote: quote => { // fix this to match cmc

			var str = ''
			for ( let [key, value] of entries(market) ) {
	   		if ( key === 'price' ) { 
	   			if (value) {
	   				str += '---------\n'
		   			for ( let [pkey, pvalue] of entries(value) ) { // value can be 'false' / no price data
		   				switch (pkey) {
		   					case 'ts': 
		   						str += ''
		   						break
		   					default: 
		   						str += `<i>${pkey}</i> <b>${pvalue}</b>\n`
		   				}
		   			}
		   			str += '---------\n'
	   			}
	   		} else {
					switch (key) {
						case 'address': 
							str += `<i>${key}</i> <a href="https://etherscan.io/address/${value}">${value}</a>\n`
	   					break
	   				default:
	   					str += `<i>${key}</i> <b>${value}</b>\n`
	   				}
	   			}
				}
			//console.log(str)
			return str
		}
	}
/*
			[
				{
					"text":"1:1 button","callback_data":"1:1 Works!"
				},
				{"text":"1:2 button","callback_data":"1:2 Works!"},
				{"text":"1:1 button","callback_data":"1:1 Works!"},
				{"text":"1:2 button","callback_data":"1:2 Works!"}
			],
			[
				{"text":"2:1 button","callback_data":"2:1 Works!"},
				{"text":"2:2 button","callback_data":"2:2 Works!"},
				{"text":"1:1 button","callback_data":"1:1 Works!"},
				{"text":"1:2 button","callback_data":"1:2 Works!"}
			]
		]
	}
}
		
		{	
			"id": 1,
      "name": "Bitcoin",
      "symbol": "BTC",
      "slug": "bitcoin",
      "circulating_supply": 17253125,
      "total_supply": 17253125,
      "max_supply": 21000000,
      "date_added": "2013-04-28T00:00:00.000Z",
      "num_market_pairs": 6037,
      "cmc_rank": 1,
      "last_updated": "2018-09-06T22:17:21.000Z",
      "quotes": [{
          "price": 6469.49532626,
          "volume_24h": 5701938887.38691,
          "percent_change_1h": -0.165422,
          "percent_change_24h": -6.91809,
          "percent_change_7d": -6.56854,
          "market_cap": 111619011550.87956,
          "last_updated": "2018-09-06T22:17:21.000Z"
        	"units": "USD"
      }]
     }
		{
			"timestamp":1534704803,
			"address":"0xf230b790e05390fc8295f4d3f60332c93bed42e2",
			"name":"Tronix",
			"decimals":"6",
			"symbol":"TRX",
			"totalSupply":"100000000000000000",
			"owner":"0x",
			"transfersCount":2812176,
			"lastUpdated":1534704049,
			"issuancesCount":0,
			"holdersCount":1086597,
			"ethTransfersCount":13,
			"price":{
				"rate":"0.0217371068",
				"diff":3.32,
				"diff7d":-4.38,
				"ts":"1534703280",
				"marketCapUsd":"1429173727.0",
				"availableSupply":"65748111645.0",
				"volume24h":"96649929.5064",
				"diff30d":-40.690993326167,
				"currency":"USD"
			},
			"countOps":2812176
		}

*/
	/* temporary code for various things */
/*
				output.ratings.push({
					id: round.id,
					token: round.token,
					status: round.status,
					start: round.start,
					finish: round.finish,
					phase: roundUser.phase,
					rating_start: roundUser.phases.map( phase => phase.start ),
					rating_finish: roundUser.phases.map( phase => phase.finish ),
					winnings: round.winnings
*/
}

app.runScript('test.user.1')
const dialogs = app.dialogs
const formatters = app.formatters

/* clean out the tallies / temp 
tokens.forEach( token => {
	if (!token.tallies) return
	var newtallies = token.tallies.reduce( (accum,tally,tIdx) => {
		if (
			tally.answers.filter( answer => answer.count ).length 
			|| tally.categories.filter( category => category.count ).length ) {
			console.log(`kept tally ${tally}`)
			accum.push( tally )
		}
		else {
			console.log(`${tIdx} remove empty tally`)
		}
		return accum
	}, [])
	console.log(`token ${token.name} new tallies ${newtallies.length}`)
	token.tallies = newtallies
})
app.saveTokens()
 --- */

const token_name = round => tokens[round.token].name

//app.saveTokens()


module.exports = app



