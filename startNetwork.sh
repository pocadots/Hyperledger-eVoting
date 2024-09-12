# Exit on first error, print commands
set -e
set -o pipefail

# don't rewrite paths for Windows Git Bash users
# export MSYS_NO_PATHCONV=1
# CC_RUNTIME_LANGUAGE=node # chaincode runtime language is node.js
# CC_SRC_PATH=/opt/gopath/src/github.com/hypervoter/javascript

# clean the keystore
# rm -rf ./hfc-key-store
rm -rf ../wallet/*
rm -rf ../certs/*

# voters file
# echo "[]" > 'javascript/voters.json'
# echo '[{"candidateId":0,"name":"NOTA"}]' > 'javascript/candidates.json'
# launch network; create channel and join peer to channel

pushd ../test-network

./network.sh up createChannel -ca -s couchdb
./network.sh deployCC -ccn basic -ccp ../thesis/chaincode -ccl javascript
# ./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-javascript -ccl javascript


popd
echo =======Channel successfully created=======

echo =======Setup successful=======

# HLF does this automatically in the test network config in v2.5 onwards
# docker-compose -f ./docker-compose.yml up -d cli

# docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp" cli peer chaincode install -n thesis -v 1.0 -p "$CC_SRC_PATH" -l "$CC_RUNTIME_LANGUAGE"
# docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp" cli peer chaincode instantiate -o orderer.example.com:7050 -C mychannel -n thesis -l "$CC_RUNTIME_LANGUAGE" -v 1.0 -c '{"Args":[]}' -P "OR ('Org1MSP.member','Org2MSP.member')"
# sleep 10
# docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp" cli peer chaincode invoke -o orderer.example.com:7050 -C mychannel -n thesis -c '{"function":"initLedger","Args":[]}'

# ORG=${1:-Org1}

# export CORE_PEER_TLS_ENABLED=true
# export CORE_PEER_LOCALMSPID="Org1MSP"
# export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
# export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
# export CORE_PEER_ADDRESS=localhost:7051