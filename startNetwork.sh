# Exit on first error, print commands
set -e
set -o pipefail

# clean the keystore
rm -rf ../wallet/*
rm -rf ../certs/*

pushd ../test-network

./network.sh up createChannel -ca -s couchdb
./network.sh deployCC -ccn basic -ccp ../Hyperledger-eVoting/chaincode -ccl javascript


popd
echo =======Channel successfully created=======

echo =======Setup successful=======