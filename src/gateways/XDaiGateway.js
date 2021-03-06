const Gateway = require('./Gateway');
const Web3 = require('web3');

class xDaiGateway extends Gateway {
  isAvailable() {
    return true;
  }

  getNetworks() {
    return ['100'];
  }

  _provider(network) {
    return new Web3.providers.HttpProvider('https://dai.poa.network');
  }

  async send(network, { method, params, id }) {
    if (network !== '100') {
      throw new Error('xDai does not support this network');
    }
    const response = await this._provider(network).send(method, params);

    // Strange hack since the xdai relay seems to return a receipt for unmined txs
    if (method === 'eth_getTransactionReceipt' && response && !response.blockNumber) {
      return null;
    }

    return response;
  }
}

module.exports = xDaiGateway;
