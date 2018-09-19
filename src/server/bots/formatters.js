
const moment = require('moment')

const { InlineKeyboard, ReplyKeyboard, ForceReply } = require('telegram-keyboard-wrapper')


const config = require('../../app/config/appConfig')

function* entries(obj) { // object iterator
	for (let key of Object.keys(obj)) 
		yield [key, obj[key]]
}


module.exports = {

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
*/
	},
	tokenQuote: quote => { // fix this to match cmc
		/*
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