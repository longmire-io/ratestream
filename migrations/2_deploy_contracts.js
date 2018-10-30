var LmrToken = artifacts.require("LmrToken")
var AnalystRegistry = artifacts.require("AnalystRegistry")
var RatingAgency = artifacts.require("RatingAgency")
//var Tests = artifacts.require("test2")
//var vevaTest = artifacts.require("vevaTest")

module.exports = function( deployer ) {
	deployer.deploy( AnalystRegistry ).then( () => AnalystRegistry.deployed() )
	.then( registry => deployer.deploy( RatingAgency,registry.address, 0 ) )
	.then( () => RatingAgency.deployed() )
	//.then( ra => deployer.deploy( Tests, ra.address ) )
	//.then( () => Tests.deployed() )

	deployer.deploy( LmrToken ).then( () => LmrToken.deployed() )

	/*
	deployer.deploy(TokenERC20,10000,"MOOLAH","MOO").then( () => TokenERC20.deployed() )
  .then( () => {
		let tpromises = [1,2,3,4,5,6,7,8].map( id => TokenERC20.new(10000,"MOOLAH"+id,"MOO"+id))
		Promise.all(tpromises).then( tokens => {
  		tokens.map( token => console.log('erc address',token.address)  )
  	})
	})
	*/


			/*
		  deployer.deploy(AnalystRegistry).then( () => {
	  		deployer.then( () => {
		  		RatingAgency.new(AnalystRegistry.address).then( instance => {
		  			console.log('rating agency instance',instance.address)
						tokens.map( token => {
							console.log('erc address',token.address)
							//instance.coverToken(token.address,0) do this when understand how to make it work
						})
		  		})
	  		}
		  })
		  */
}
