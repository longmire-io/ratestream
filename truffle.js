module.exports = {
  migrations_directory: "./migrations",
  networks: { 
    development: {
      host: "localhost", //10.0.0.3", // veva.one"
      port: 8545,
      network_id: "*", // Match any network id
      //from: "0x26eae3b5e8d7c061299a6b297e839b396c44887d",
      gas: 6700000 // 4700000  add extra to bootstrap test data
    },
    development_1: {
      host: "52.41.77.72", //10.0.0.3", // veva.one"
      port: 8545,
      network_id: "*", // Match any network id
      from: "0x9F943eD85fb1B63b2a68aF79290e5023D32F5E96",
      gas: 6700000 // 4700000  add extra to bootstrap test data      
    },
    development_2: {
      host: "52.41.77.72", //10.0.0.3", // veva.one"
      port: 8302,
      network_id: "*", // Match any network id
      from: "0x9F943eD85fb1B63b2a68aF79290e5023D32F5E96",
      gas: 6700000 // 4700000  add extra to bootstrap test data      
    },
    development_3: {
      host: "52.41.77.72", //10.0.0.3", // veva.one"
      port: 8545,
      network_id: "*", // Match any network id
      from: "0x5dfe021f45f00ae83b0aa963be44a1310a782fcc",
      gas: 6700000 // 4700000  add extra to bootstrap test data      
    },
    d3local: {
      host: "localhost",
      port: 8301,
      network_id: "*", // Match any network id
      from: "0x5dfe021f45f00ae83b0aa963be44a1310a782fcc",
      gas: 6700000  //add extra to bootstrap test data      
    },
    development_8313_local: {
      host: "localhost",
      port: 8313,
      network_id: "*", // Match any network id
      from: "0x5dfe021f45f00ae83b0aa963be44a1310a782fcc",
      gas: 525252525200000  //add extra to bootstrap test data      
    },
    d3remote:{
      host: "34.217.64.52",
      port: 8301,
      network_id: "*",
      from: "0x5dfe021f45f00ae83b0aa963be44a1310a782fcc",
      gas: 6700000      
    },
    kovan:{
      host: "34.217.64.52", //http://eth-kovan.longmire.space",
      port: 8545,
      network_id: "42",
      from: "0xa00F1C31819789B7eE5ff28DAbea79b1F566B540",    
      gas: 4712388,
      gasPrice: 25000000000  
    },
    local:{
      host: "localhost",
      port: 8545,
      gas: 6000000
    },
    kovanlocal:{
      host: "localhost", //http://eth-kovan.longmire.space",
      port: 8545,
      network_id: "*",
      from: "0xa00F1C31819789B7eE5ff28DAbea79b1F566B540",
      gas: 4700000    
    },
    classic:{
      host: "54.191.97.116", //http://etc-main.longmire.space",
      port: 8545,
      network_id: "1",
      from: "0xcaa7bb3e524c0cc018adc75ef17b89b40b1a17b1",
      gas: 4700000      
    },
  }
};
// ethereum typical gas: 3141592
/*

ganache-cli -i 7 -s dog1

Available Accounts
==================
(0) 0x9f943ed85fb1b63b2a68af79290e5023d32f5e96
(1) 0x77e8f0b7d306ce5dc00347e1c6b91a6fd6f0555c
(2) 0x68c0db14ee31f6f97c326f20bfc7cdb12f13aef4
(3) 0x1702eba21dc4d62527babb1f24c04e3074fe5a32
(4) 0x102f2daffd8c56df798e3bec933dddac5234293d
(5) 0x2e225be25f2491c728ed280c69775b4dea9d7b5f
(6) 0xb5bc651bfe7e3f8c49f9e6a3d13c3b19eaadee6e
(7) 0xff12f8fba68186e5ca11aad363978b92a82f56ad
(8) 0x0df719e9c0a33d3bf5a78c69fcd0d82bfe08fa1a
(9) 0xdbbaaaa263d2d169a2318fa90a63985596d2d369

Private Keys
==================
(0) feabed97e9caf644dc9ddd3658ee7a97e81b0718e59f2e9b2fe358cdadd29d38
(1) 5e3ba346706ab2e35903e30e54fa5e427ac039cf69be08bac2da89329a2043da
(2) 1b382e63b8a3da99e6a3229c0e3e7b425fb7e5dd0025dad223808cc62b171cd3
(3) 82be2520adde0e978b6cf61d02345ffa611d89961d6e1fa1833429b956c8d1c7
(4) f689dc57739baa83fae457c55afa507122d98cd126f92ef53bfc52839331ea38
(5) 884bf4266530354e67bce9f38dca2675ccab058940df68174005bd530bd9053a
(6) 4f3c5ab7c1602cde425ea9d0b9cf32f5b0709a0281b44e5ed98cc283ab7a5e8d
(7) db251a24188cf3262ba46c213cd9c209a20e945515daba672dece746041c0781
(8) cc795917d616e3081f81472d3f70e8dab089c553f657ece621fbe415d8ae9383
(9) febe96c13696534cf00cedaa4797d232e7bcc828ab83fbb3d3298a9628df8c8a

HD Wallet
==================
Mnemonic:      noodle library tide trial funny cricket fork bonus receive away protect found
Base HD Path:  m/44'/60'/0'/0/{account_index}

*/
