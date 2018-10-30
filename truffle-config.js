module.exports = {
  migrations_directory: "./migrations",
  networks: {
    development: {
      host: "https://etc-geth.0xinfra.com",
      port: 8545,
      network_id: "*" // Match any network id
    }
  }
};
