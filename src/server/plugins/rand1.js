exports.getWeather = function getWeather(city, cb) {
	console.log('plugin function called')
  cb(null, "It is probably sunny in " + city); 
}


