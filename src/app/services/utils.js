

let web3 = null

module.exports = {
	parseB32StringToUintArray: ( b32, num = 32 ) => {
 		let out = []
 		let offs = b32.substr(0,2) == '0x' ? 2 : 0 // work with or without '0x'
  	for (let i=0; i<num; i++) 
  		out[i] = parseInt( b32.substr(offs+i*4,4), 16 )  // ignore '0x' 
  	return out
	},

	hexToBytes : ( hex, num = 32 ) => {
    let bytes = []
    let n = num * 2
    let offs = hex.substr(0,2) == '0x' ? 2 : 0 // work with or without '0x'
    for ( c = 0; c < n; c += 2 )
      bytes.push(parseInt(hex.substr(c+offs, 2), 16))
    return bytes
  },

  hexToBytesSigned : ( hex, num = 32 ) => (
    module.exports.hexToBytes( hex, num ).map( byte => byte & 0x80 ? (byte & 0x7f) - 0x80 : byte )
  ),

	// Convert a byte array to a hex string
	bytesToHex: bytes => {
    for (let hex = [], i = 0; i < bytes.length; i++) {
      hex.push((bytes[i] >>> 4).toString(16));
      hex.push((bytes[i] & 0xF).toString(16));
    }
    return hex.join("");
	},

	toHexString: ( byteArray, prefix = true )  => {
  	return (prefix ? '0x' : '' ) + Array.from( byteArray, byte => {
    	return ('0' + (byte & 0xFF).toString(16)).slice(-2)
  	}).join('')
	},

  getWeb3: () => web3 || window.web3,
  setWeb3: w3 => web3 = w3, // used on server side



  /**
    * Run promises from array of functions that can return promises
    * in chained manner
    *
    * @param {array} pfn_arr - promise (function) array
    * @return {Object} promise object
  */
  runPromisesInSequence: ( pfn_arr, input ) =>  
    pfn_arr.reduce(
      ( promiseChain, currentFunction ) => promiseChain.then(currentFunction),
      Promise.resolve( input )
    )
  ,
  round: (n, precision) => {
    let prec = Math.pow(10, precision)
    return Math.round(n*prec)/prec;
  },

  format: (n) => {
    let base = Math.floor(Math.log(Math.abs(n))/Math.log(1000));
    let suffix = 'kmb'[base-1];
    return suffix ? module.exports.round(n/Math.pow(1000,base),2)+suffix : ''+n
  },

  tokenSvg: name => `<text
       xml:space="preserve"
       style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:15px;font-family:Verdana;-inkscape-font-specification:'Verdana, Normal';text-align:start;text-anchor:start;opacity:1;fill:#cccccc;fill-opacity:1;stroke:none;stroke-width:12;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1;writing-mode:lr;line-height:125%;"
       x="165.71429"
       y="200.93362"
       id="text3336"
       sodipodi:linespacing="125%"><tspan
         sodipodi:role="line"
         x="165.71429"
         y="200.93362"
         id="tspan3340">${name}</tspan></text>`

}



