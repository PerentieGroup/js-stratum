const bitcoin = require('bitgo-utxo-lib')
const util = require('./util.js')

const scriptCompile = addrHash => bitcoin.script.compile([
    bitcoin.opcodes.OP_DUP,
    bitcoin.opcodes.OP_HASH160,
    addrHash,
    bitcoin.opcodes.OP_EQUALVERIFY,
    bitcoin.opcodes.OP_CHECKSIG
])

const scriptFoundersCompile = address => bitcoin.script.compile([
    bitcoin.opcodes.OP_HASH160,
    address,
    bitcoin.opcodes.OP_EQUAL
])

// public members
let txHash
exports.txHash = () => txHash

exports.createGeneration = (blockHeight, blockReward, transactionFees, recipients, poolAddress, poolHex, coin, masternodeReward, masternodePayee, masternodePayment) => {
    let poolAddrHash = bitcoin.address.fromBase58Check(poolAddress).hash

    let network = bitcoin.networks[coin.symbol]
    //console.log('network: ', network)
    let txb = new bitcoin.TransactionBuilder(network)

    if (coin.sapling) {
        if (coin.sapling === true || (typeof coin.sapling === 'number' && coin.sapling <= blockHeight)) {
            txb.setVersion(bitcoin.Transaction.ZCASH_SAPLING_VERSION);
        }
    }
    else if (coin.overwinter) {
        if (coin.overwinter === true || (typeof coin.overwinter === 'number' && coin.overwinter <= blockHeight)) {
            txb.setVersion(bitcoin.Transaction.ZCASH_OVERWINTER_VERSION);
        }
    }

    // input for coinbase tx
    let blockHeightSerial = (blockHeight.toString(16).length % 2 === 0 ? '' : '0') + blockHeight.toString(16)

    let height = Math.ceil((blockHeight << 1).toString(2).length / 8)
    let lengthDiff = blockHeightSerial.length / 2 - height
    for (let i = 0; i < lengthDiff; i++) {
        blockHeightSerial = `${blockHeightSerial}00`
    }

    let length = `0${height}`
    let serializedBlockHeight = new Buffer.concat([
        new Buffer(length, 'hex'),
        util.reverseBuffer(new Buffer(blockHeightSerial, 'hex')),
        new Buffer('00', 'hex') // OP_0
    ])

    txb.addInput(new Buffer('0000000000000000000000000000000000000000000000000000000000000000', 'hex'),
        4294967295,
        4294967295,
        new Buffer.concat([
            serializedBlockHeight,
            // Default VRSC
            Buffer(poolHex ? poolHex : '56525343', 'hex')
        ]))

    // calculate total taxes
    let feePercent = 0
    recipients.forEach(recipient => feePercent += recipient.percent)

             // pool t-addr
            txb.addOutput(
                scriptCompile(poolAddrHash),
               Math.abs(Math.round(blockReward * (1 - (feePercent / 100))) + transactionFees)
            )
     // pool fee recipients t-addr
	if (coin.feesRaped) {
    	recipients.forEach(recipient => {
        	txb.addOutput(scriptCompile(bitcoin.address.fromBase58Check(recipient.address).hash),
            Math.abs(Math.round(blockReward * (recipient.percent / 100)) ) - transactionFees)
    	})
	} else {
    	recipients.forEach(recipient => {
        	txb.addOutput(scriptCompile(bitcoin.address.fromBase58Check(recipient.address).hash),
            Math.abs(Math.round(blockReward * (recipient.percent / 100)) ))
    	})
	}

    let tx = txb.build()

    txHex = tx.toHex()
     //console.log('hex coinbase transaction: ' + txHex)

    // assign
    txHash = tx.getHash().toString('hex')

    // console.log(`txHex: ${txHex.toString('hex')}`)
    // console.log(`txHash: ${txHash}`)

    return txHex
}

module.exports.getFees = feeArray => {
    let fee = Number()
    feeArray.forEach(value => fee += Number(value.fee))
    return fee
}
