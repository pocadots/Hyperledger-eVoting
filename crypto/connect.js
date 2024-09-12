const grpc = require('@grpc/grpc-js');
const { connect, signers } = require('@hyperledger/fabric-gateway');
const exp = require('node:constants');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { TextDecoder } = require('node:util');

const channelName = envOrDefault('CHANNEL_NAME', 'mychannel');
const chaincodeName = envOrDefault('CHAINCODE_NAME', 'basic');
const mspId = envOrDefault('MSP_ID', 'Org1MSP');

// let duration = ((parseInt(duration_d)*24*60) + (parseInt(duration_h)*60)+ (parseInt(duration_m))).toString();
let duration = (parseInt(3600)).toString();


// Path to crypto materials.
const cryptoPath = envOrDefault(
    'CRYPTO_PATH',
    path.resolve(
        __dirname,
        '..',
        '..',
        'test-network',
        'organizations',
        'peerOrganizations',
        'org1.example.com'
    )
);

// Path to user private key directory.
const keyDirectoryPath = envOrDefault(
    'KEY_DIRECTORY_PATH',
    path.resolve(
        cryptoPath,
        'users',
        'User1@org1.example.com',
        'msp',
        'keystore'
    )
);

// Path to user certificate directory.
const certDirectoryPath = envOrDefault(
    'CERT_DIRECTORY_PATH',
    path.resolve(
        cryptoPath,
        'users',
        'User1@org1.example.com',
        'msp',
        'signcerts'
    )
);

// Path to peer tls certificate.
const tlsCertPath = envOrDefault(
    'TLS_CERT_PATH',
    path.resolve(cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt')
);

// Gateway peer endpoint.
const peerEndpoint = envOrDefault('PEER_ENDPOINT', 'localhost:7051');

// Gateway peer SSL host name override.
const peerHostAlias = envOrDefault('PEER_HOST_ALIAS', 'peer0.org1.example.com');

const utf8Decoder = new TextDecoder();
// const voteId = `vote${String(Date.now())}`;

async function tryConnect() {
    displayInputParameters();

    // The gRPC client connection should be shared by all Gateway connections to this endpoint.
    const client = await newGrpcConnection();

    const gateway = connect({
        client,
        identity: await newIdentity(),
        signer: await newSigner(),
        // Default timeouts for different gRPC calls
        evaluateOptions: () => {
            return { deadline: Date.now() + 5000 }; // 5 seconds
        },
        endorseOptions: () => {
            return { deadline: Date.now() + 15000 }; // 15 seconds
        },
        submitOptions: () => {
            return { deadline: Date.now() + 5000 }; // 5 seconds
        },
        commitStatusOptions: () => {
            return { deadline: Date.now() + 60000 }; // 1 minute
        },
    });

    try {
        // Get a network instance representing the channel where the smart contract is deployed.
        const network = gateway.getNetwork(channelName);

        // Get the smart contract from the network.
        const contract = network.getContract(chaincodeName);

        // Initialize a set of asset data on the ledger using the chaincode 'InitLedger' function.
        await InitLedger(contract);

        await setEndTime(contract, duration);

    } finally {
        gateway.close();
        client.close();
    }
}



        // 

        // await getAllVotes(contract);

        // await queryVotes(contract, "2");

        // await AddVote(contract, "Bob");

        // await getAllVotes(contract);

        // await castVote(contract, "1", "3");

        // await queryVote(contract, "2");

        // await queryVote(contract, "3");

        // await queryVote(contract, "1");

        // await getAllVotes(contract);
tryConnect().catch((error) => {
    console.error('******** FAILED to run the application:', error);
    process.exitCode = 1;
});

async function newGrpcConnection() {
    const tlsRootCert = await fs.readFile(tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerHostAlias,
    });
}

async function newIdentity() {
    const certPath = await getFirstDirFileName(certDirectoryPath);
    const credentials = await fs.readFile(certPath);
    return { mspId, credentials };
}

async function getFirstDirFileName(dirPath) {
    const files = await fs.readdir(dirPath);
    const file = files[0];
    if (!file) {
        throw new Error(`No files in directory: ${dirPath}`);
    }
    return path.join(dirPath, file);
}

async function newSigner() {
    const keyPath = await getFirstDirFileName(keyDirectoryPath);
    const privateKeyPem = await fs.readFile(keyPath);
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return signers.newPrivateKeySigner(privateKey);
}

/**
 * This type of transaction would typically only be run once by an application the first time it was started after its
 * initial deployment. A new version of the chaincode deployed later would likely not need to run an "init" function.
 */
async function InitLedger(contract) {
    console.log(
        '\n--> Submit Transaction: InitLedger, function creates the initial set of votes on the ledger'
    );

    await contract.submitTransaction('InitLedger');

    console.log('*** Transaction committed successfully');
}

async function setEndTime(contract, timeVal) {
    console.log('setting end time of election');
    await contract.submitTransaction('setEndTime', timeVal);

    console.log('time set successfully');
}

/**
 * Evaluate a transaction to query ledger state.
 */
async function queryVotes(contract, optionId) {

    const resultBytes = await contract.evaluateTransaction('queryVotes', optionId);

    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    console.log('*** Votes Result:', result);
}

async function queryVote(contract, optionId) {

    const resultBytes = await contract.evaluateTransaction('queryVote', optionId);

    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    console.log('*** Votes Result:', result);
}

async function getAllVotes(contract) {

    const resultBytes = await contract.evaluateTransaction('getAllVotes');

    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    console.log('*** AllVotes Result:', result);
}

async function AddVote(contract, Name) {
    const voteId = await generateId();
    
    const response = await contract.submitTransaction('AddVote', voteId);
    
}

// Generate the option ID
async function generateId() {	
    let uId = "";
	const chars = '0123456789'; // List of digits

	for (let i = 0; i < 16; i++) {
		const randomIndex = Math.floor(Math.random() * chars.length);
		uId += chars.charAt(randomIndex);
	}

	return uId;
}

async function castVote(voteId, optionId) {

    const client = await newGrpcConnection();

    const gateway = connect({
        client,
        identity: await newIdentity(),
        signer: await newSigner(),
        // Default timeouts for different gRPC calls
        evaluateOptions: () => {
            return { deadline: Date.now() + 5000 }; // 5 seconds
        },
        endorseOptions: () => {
            return { deadline: Date.now() + 15000 }; // 15 seconds
        },
        submitOptions: () => {
            return { deadline: Date.now() + 5000 }; // 5 seconds
        },
        commitStatusOptions: () => {
            return { deadline: Date.now() + 60000 }; // 1 minute
        },
    });

    try {
        // Get a network instance representing the channel where the smart contract is deployed.
        const network = gateway.getNetwork(channelName);

        // Get the smart contract from the network.
        const contract = network.getContract(chaincodeName);

        await contract.submitTransaction('castVote', voteId, optionId);

    } finally {
        gateway.close();
        client.close();
    }    
}

/**
 * Submit a transaction synchronously, blocking until it has been committed to the ledger.
 */
// async function CreateVote(contract) {
//     console.log(
//         '\n--> Submit Transaction: createVote, creates new asset with ID, Color, Size, Owner and AppraisedValue arguments'
//     );
//     let voteId = { Id: 6 };

//     await contract.submitTransaction(
//         'CreateVote',
//         voteId,
//     );

//     console.log('*** Transaction committed successfully');
// }

/**
 * Submit transaction asynchronously, allowing the application to process the smart contract response (e.g. update a UI)
 * while waiting for the commit notification.
 */
// async function TransferVote(contract) {
//     console.log(
//         '\n--> Async Submit Transaction: TransferVote, updates existing vote owner'
//     );

//     const commit = await contract.submitTransaction('TransferVote', {
//         arguments: [voteId, 'Saptha', 'vote1'],
//     });

//     const status = await commit.getStatus();
//     if (!status.successful) {
//         throw new Error(
//             `Transaction ${
//                 status.transactionId
//             } failed to commit with status code ${String(status.code)}`
//         );
//     }

//     console.log('*** Transaction committed successfully');
// }

// async function setEndTime(contract, duration) {
//     let timeStr = await contract.submitTransaction(
//         'setEndTime',
//         duration
//     );

//     timeStr = new Date(timeStr);
//     console.log(`Setting End Time To: ${timestr}`);
//     console.log("Voting End Time set Successfully!\n");
//     // let outString = "Voting End Time Set to: " + timestr;
//     // response.render(__dirname + "/public/EC-dashboard/ec-set-time.html", { _: outString });
// }


/**
 * envOrDefault() will return the value of an environment variable, or a default value if the variable is undefined.
 */
function envOrDefault(key, defaultValue) {
    return process.env[key] || defaultValue;
}

/**
 * displayInputParameters() will print the global scope parameters used by the main driver routine.
 */
function displayInputParameters() {
    console.log(`channelName:       ${channelName}`);
    console.log(`chaincodeName:     ${chaincodeName}`);
    console.log(`mspId:             ${mspId}`);
    console.log(`cryptoPath:        ${cryptoPath}`);
    console.log(`keyDirectoryPath:  ${keyDirectoryPath}`);
    console.log(`certDirectoryPath: ${certDirectoryPath}`);
    console.log(`tlsCertPath:       ${tlsCertPath}`);
    console.log(`peerEndpoint:      ${peerEndpoint}`);
    console.log(`peerHostAlias:     ${peerHostAlias}`);
}

module.exports = { castVote };