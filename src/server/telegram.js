//this is telegram

const TelegramBot = require('node-telegram-bot-api')
const { InlineKeyboard, ReplyKeyboard, ForceReply } = require('telegram-keyboard-wrapper')

const { translate } = require('./nlp')
const moment = require('moment')

var app = require('./application')
const { say, identify } = app

const formatters = require('./bots/formatters')

var { tokens, users, rounds, analyst_questions, reviewer_questions, reviews, scripts } = app.data


app.start(false) // no autosave for development
app.save() // reformat any json changes

var testUsers = users.filter( user => user.first_name.startsWith('tester_'))
// console.log('users:',users)
// console.log('testusers:',testUsers)

/* nlp tests */
var t = translate('dinosaur').nouns().toPlural()

console.log( t.out('text') )

var doc = translate('London is calling')
console.log( doc.sentences().toNegative().out('text'))


/* */


const config = require('./config.js')


//const survey = require('../../app/services/survey')
//const surveyElements = survey.getElements()


let questionCount = 0

// console.log('config',config)
const smelly = 'https://agario-skins.org/images/skins/custom/smelly.png'
const stinkie = 'https://stinkie.one/static/media/logo.591c1b5d.jpg'

const bot = new TelegramBot(config.telegram.botkey, { polling: true })
/*bot.setWebHook('bot2.stinkie.one', {
  certificate: '../cert/cert.pem'
}).then( () => {
	bot.getWebHookInfo().then( whInfo => console.log( 'web hook info',whInfo ) )
}).error( err => {
	console.log('error setting webhook', err )
})
*/

/* general bot reply point */
const tell = (chat_id,reply) => {
	//console.log('bot reply',chat_id,reply)
	let ret
	let parse = reply.parse ? {...reply.parse} : null // oops, bug in bot, sendMessage modifies parse 
	if (parse && reply.format) {
		ret = bot.sendMessage(chat_id,reply.text,{...reply.format,...parse})
	}
	else if (reply.parse || reply.format)
		ret = bot.sendMessage(chat_id,reply.text,reply.format || parse)
	else
		ret = bot.sendMessage(chat_id,reply.text)
	return ret
}

var leadNum = 0 // for now, need to be better about token choices
var role = 0 // bull/bear, 0->1



	/*
	if (msg.text.toString().toLowerCase().indexOf("hi") === 0) {
		bot.sendMessage(msg.chat.id,"Hello dear user")
		bot.sendMessage(msg.from.id, "Hello  " + msg.from.first_name)
		bot.sendMessage(
			msg.chat.id,
			"<b>bold</b> \n <i>italic</i> \n <em>italic with em</em> \n <a href=\"https://stinkie.one/\">inline URL</a> \n <code>inline fixed-width code</code> \n <pre>pre-formatted fixed-width code block</pre>",
			{parse_mode : "HTML"}
		)
	} 
	if (msg.text.indexOf("I'm robot") === 0) {
    bot.sendMessage(msg.chat.id, "Yes I'm robot but not in that way!");
	} 
	if (msg.text.indexOf("location") === 0) {
    bot.sendLocation(msg.chat.id,44.97108, -104.27719)
    bot.sendMessage(msg.chat.id, "Here is the point")
  } 
  */    

/* app */
bot.onText(/\/restart/, msg => tell( msg.chat.id, say('restart',{user:identify( msg )} ) ) )

bot.onText(/\/start/, msg => tell( msg.chat.id, say('start', {user: identify( msg )}) ) )

/* user */
const identifyUser = msg => {
	let user
	let msgInfo = msg.text.split(' ') // for testing, so can explicitly specify user
	//console.log('msgInfo',msgInfo)
	if (msgInfo[1]) { // testing purposes only
		user = identify( msg )
		user.mockAs = +msgInfo[1]
		user = testUsers[+msgInfo[1]]		
	} else {
		user = identify( msg )
		user.mockAs = -1
	}
	return user
}

const do_activity = msg => {
	let user = identifyUser(msg)
	tell( msg.chat.id, say('activity',{ user }))
}

bot.onText(/\/activity/i, msg => do_activity( msg ))


/* rounds */
const do_review = msg => {
	let user = identifyUser( msg )
	tell( msg.chat.id, say( 'review', {user} ) ).then( () => {
		let cmdResult = say( 'review_categories', {user} ) 
		tell( msg.chat.id, cmdResult ).then( () => {
			if (cmdResult.status == -1) {
				console.log('!!!starting next review',{...user})
				do_review(msg) // start next review
			}
		})
	})
}

const do_rate = msg => { // jurist start round
	let user = identifyUser( msg )
	console.log('make caomm')
	let cmdResult = say('rate',{ user })
	console.log('got command')
	tell(msg.chat.id,cmdResult).then( () => {
		if (cmdResult.status !== -1) tell( msg.chat.id, say( 'question',{ user }))
	})
}

bot.onText(/\/review/i, msg => do_review( msg ) )

bot.onText(/\/rate/i, msg => do_rate( msg ) )


/* tokens */
bot.onText(/\/tokens/i, msg => {
	let msgInfo = msg.text.split(' ')
	tell( msg.chat.id, say('tokens', msgInfo.length > 1 ? {number:+msgInfo[1]}: {} ) ) 
})

bot.onText(/\/token_ids/i, msg => tell( msg.chat.id, say('token_ids') ) )
bot.onText(/\/token_quotes/i, msg => {
	let msgInfo = msg.text.split(' ') // for testing, so can explicitly specify user
	let ids = msgInfo[1].split(',')
	tell( msg.chat.id, say('token_quotes',{ ids }) )
})

bot.onText(/\/token_tickers/i, msg => tell( msg.chat.id, say('token_tickers') ) )


bot.onText(/\/token /i, msg => {
	let msgInfo = msg.text.split(' ')
	tell( msg.chat.id, say('token', {id:+msgInfo[1]}) )
})

/* internal use, admin only */

bot.onText(/\/clearRounds/i,msg => { // beware, clears all rounds, really
	tell(msg.chat.id, say('roundsClear'))
})

bot.onText(/\/ratings/, msg => tell( msg.chat.id, say('ratings') ) )

bot.onText(/\/refreshTokens/, msg => tell( msg.chat.id, say('tokens_refresh') ) )

bot.onText(/\/refreshInfo/, msg => tell( msg.chat.id, say('news_refresh') ) )

bot.onText(/\/refreshTopTokens/, msg => tell( msg.chat.id, say( 'tokens_top') ) )

bot.onText(/\/time/, msg => tell( msg.chat.id, say('time') ) )

bot.onText(/\/cron/, msg => { // specified in hours if want to specify
	const fields = msg.text.split(' ')
	console.log('fields',fields)
	const delta = fields.length == 1 ? 3600 : +fields[1]
	//console.log('delta is',delta)
	tell( msg.chat.id, say('cron',{delta:delta}) )
})

bot.onText(/\/tally/i, msg => tell( msg.chat.id, say('tally') ) )

// fix these?
bot.onText(/\/testAddReviewers/, msg => {	
	testUsers.forEach( (user,idx) => {
		tell( msg.chat.id, say( 'review', {user} ) )
	})
})

bot.onText(/\/testAddAnalysts/, msg => {
	testUsers.forEach( (user,idx) => {
		//let user = identify( { id: user.t_id } )
		let round = app.roundToRate( user )
		if (!round) {
			bot.sendMessage(msg.chat.id,`Sorry...no rounds to analyze right now`)
		} else {
			bot.sendMessage(msg.chat.id,`${users[ userIdx ].first_name} now analyzing in round ${roundIdx} with token ${tokens[round.token].name}`)
		}	
	})
})


/* questions */

bot.onText(/\/questions/i, msg => {
	tell(msg.chat.id, say('questions') )
})

/* query callbacks for buttons */
bot.on('callback_query', query => {
	let user =  identify( query )
	let cmd
	if (user.mockAs >= 0) user = testUsers[user.mockAs]
	bot.answerCallbackQuery(query.id, { text: `Action received from ${user.first_name}!` })
	.then( () => {
		//console.log('query on callback',query)
		let q = query.data.split('-')
		switch (q[0]) {
			case 'token': 
				tell( query.message.chat.id, say('token', {id:+q[1]} ) )
				break
			case 'review':
				if (q[1] && q[1] == 'category') {
					tell(query.message.chat.id, say('review_category_request',{ user, category: +q[2]}) )
					console.log('submit category')
				}
				break
			case 'question':
				cmd = say('question_answer',{user, question_number: +q[1], answer: +q[2] })
				tell(query.message.chat.id, cmd).then( () => {
					if (cmd.status == 1) // next question
						tell(query.message.chat.id, say('question',{user} ))
				})
				break
			default:
				console.log(`unrecognized command ${q[0]}`)
		}

	})
})

/* callbacks based on input text */
bot.on('message', msg => {
	let user = identify( msg )
	if (user.mockAs >= 0) user = testUsers[user.mockAs]
	if (user.receive && !msg.text.startsWith('/') && !['news','commands','tokens','activity','rate','review'].includes(msg.text)) {
		console.log('user receive',user)
		let q = user.receive.split('-')
		switch (q[0]) {
			case 'review': 
				if (q[1] == 'category') {
					let catIdx = +q[2]
					tell(msg.chat.id, say('review_category',{ user, category:catIdx, text:msg.text.toString() }) ).then( () => {
						tell( msg.chat.id, say( 'review_categories', {user} ) )
					})
				}
				break
			//case 'question':
			//	tell(msg.chat.id, say('question', { round, user }))
			//	break
		}
		user.receive = null // clear it	
	}
	else { // not sure about this yet
		let msgText = msg.text.toString().split(' ')[0].toLowerCase()
		//console.log('msg in essage',msg)
		switch (msgText) {
			case 'news':
				app.topNewsByCoin('monero').then( articles => console.log(articles) )
			case 'commands':
				tell(msg.chat.id, say('commands'))
				break
			case 'tokens':
				tell( msg.chat.id, say('tokens') )
				break
			case 'activity':
				do_activity( msg )
				break
			case 'rate':
				do_rate( msg )
				break
			case 'review':
				do_review( msg )
				break
			default:
				//console.log(`unknown msg ${msg.text}`)
		
		}
	}
	
})


/* misc examples / dumping ground */
/*
bot.onText(/\/sendpic/, msg => {

	bot.sendPhoto( msg.chat.id, smelly, {caption : "Here we go ! \nThis is just a caption "})
    
})


bot.onText(/\/stinkie/, msg => {
	bot.sendPhoto( msg.chat.id, stinkie )
})

let isRKOpen = false 

const rk = new ReplyKeyboard()
const ik = new InlineKeyboard()

rk
	.addRow( "1", "2", "3", "4", "5" )
	//.addRow("2:1 button", "2:2 button");
 
ik
	.addRow(
		{ text: "1:1 button", callback_data: "1:1 Works!" },
		{ text: "1:2 button", callback_data: "1:2 Works!" },
		{ text: "1:1 button", callback_data: "1:1 Works!" },
		{ text: "1:2 button", callback_data: "1:2 Works!" }
	)
	.addRow(
		{ text: "2:1 button", callback_data: "2:1 Works!" },
		{ text: "2:2 button", callback_data: "2:2 Works!" },
		{ text: "1:1 button", callback_data: "1:1 Works!" },
		{ text: "1:2 button", callback_data: "1:2 Works!" }
	);
//console.log('ik export',JSON.stringify(ik.export()))

function hasBotCommands(entities) {
	if (!entities || !(entities instanceof Array)) {
		return false
	}
	return entities.some(e => e.type === "bot_command")
}
*/
/*
const ikexport = {
	"reply_markup":{
		"inline_keyboard":[
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
*/
/*
bot.onText(/\/forceReply/i, msg => {
	bot.sendMessage(msg.from.id, "Hey, this is a forced-reply. Reply me.", (new ForceReply()).export())
})

bot.onText(/\/inlineKeyboard/i, msg => {
	bot.sendMessage(msg.from.id, "This is a message with an inline keyboard.", ik.export())
})

bot.on("message", msg => {
	if (!hasBotCommands(msg.entities)) {
		if ( isRKOpen ) {
			console.log('reply msg',msg)
			bot.sendMessage(msg.from.id, "Good!", rk.close())
			isRKOpen = !isRKOpen
		}

		if (!!msg.reply_to_message) {
			bot.sendMessage(msg.from.id, "Good! ForceReply works!");
		}
	}
})
*/



