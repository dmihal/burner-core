const Web3 = require('web3');
const ProxyProvider = require('./ProxyProvider');
const EventEmitter = require('./lib/EventEmitter');

class BurnerCore {
  constructor({ signers=[], gateways=[], assets=[] }) {
    if (gateways.length === 0) {
      throw new Error('Must include at least 1 gateway')
    }
    this.signers = signers;
    this.signers.forEach(signer => signer.onAccountChange(() => this.events.emit('accountChange')))

    this.gateways = gateways;
    this.assets = assets;
    this.assets.forEach(asset => asset.setCore(this));

    this.providers = {};
    this.web3 = {};

    this.events = new EventEmitter();
  }

  onAccountChange(callback) {
    this.events.on('accountChange', () => callback(this.getAccounts()));
  }

  getAssets() {
    return this.assets;
  }

  getAccounts() {
    return [].concat.apply([], this.signers.map(signer => signer.getAccounts()));
  }

  signTx(txParams) {
    for (const signer of this.signers) {
      if (signer.isAvailable() && signer.hasAccount(txParams.from)) {
        return signer.signTx(txParams);
      }
    }
    throw new Error('Unable to find an appropriate signer');
  }

  handleRequest(network, payload) {
    for (const gateway of this.gateways) {
      if (gateway.isAvailable() && gateway.getNetworks().indexOf(network) !== -1) {
        return gateway.send(network, payload);
      }
    }
    throw new Error(`Could not find gateway for network ${network}`);
  }

  getProvider(network) {
    if (this.providers[network]) {
      return this.providers[network];
    }

    this.providers[network] = new ProxyProvider(network, this);
    return this.providers[network];
  }

  getWeb3(network) {
    if (this.web3[network]) {
      return this.web3[network];
    }

    this.web3[network] = new Web3(this.getProvider(network), null, {
      transactionConfirmationBlocks: 1,
    });
    return this.web3[network];
  }

  stop() {
    Object.values(this.providers).forEach(provider => provider.stop());
  }
}

module.exports = BurnerCore;
