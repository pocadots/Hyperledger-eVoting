# cd javascript
# cd ../../test-network
pushd ../test-network
./network.sh down
popd
rm -rf api/wallet/*
