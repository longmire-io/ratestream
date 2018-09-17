

var nlp = require('compromise')

var t = nlp('dinosaur').nouns().toPlural()

console.log( t.out('text') )

var doc = nlp('London is calling')
console.log( doc.sentences().toNegative().out('text'))

//nlp( entireNovel ).sentences().if('the #Adjective of times').out()


