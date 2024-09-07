
'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class VoteChain extends Contract {

    async InitLedger(ctx) {
        const votes = [
            {
                ID: 'vote1',
                Owner: 'Tomoko',
                hasVoted: false,
            },
            {
                ID: 'vote2',
                Owner: 'Brad',
                hasVoted: false,
            },
            {
                ID: 'vote3',
                Owner: 'Jin Soo',
                hasVoted: false,
            },
            {
                ID: 'vote4',
                Owner: 'Max',
                hasVoted: true,
            },
        ];

        for (const vote of votes) {
            vote.docType = 'vote';
            // example of how to write to world state deterministically
            // use convetion of alphabetic order
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
            await ctx.stub.putState(vote.ID, Buffer.from(stringify(sortKeysRecursive(vote))));
        }
    }

    // CreateAsset issues a new asset to the world state with given details.
    async CreateVote(ctx, id, owner, hasVoted) {
        const exists = await this.VoteExists(ctx, id);
        if (exists) {
            throw new Error(`The asset ${id} already exists`);
        }

        const vote = {
            ID: id,
            Owner: owner,
            hasVoted: hasVoted,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(vote))));
        return JSON.stringify(vote);
    }

    // ReadAsset returns the asset stored in the world state with given id.
    async ReadVote(ctx, id) {
        const voteJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!voteJSON || voteJSON.length === 0) {
            throw new Error(`The vote ${id} does not exist`);
        }
        return voteJSON.toString();
    }

    // UpdateAsset updates an existing asset in the world state with provided parameters.
    async UpdateVote(ctx, id, owner, hasVoted) {
        const exists = await this.VoteExists(ctx, id);
        if (!exists) {
            throw new Error(`The vote ${id} does not exist`);
        }

        // overwriting original asset with new asset
        const updatedVote = {
            ID: id,
            Owner: owner,
            hasVoted: hasVoted,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedVote))));
    }

    // DeleteAsset deletes an given asset from the world state.
    async DeleteVote(ctx, id) {
        const exists = await this.VoteExists(ctx, id);
        if (!exists) {
            throw new Error(`The vote ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    // AssetExists returns true when asset with given ID exists in world state.
    async VoteExists(ctx, id) {
        const voteJSON = await ctx.stub.getState(id);
        return voteJSON && voteJSON.length > 0;
    }

    // TransferAsset updates the owner field of asset with given id in the world state.
    async TransferVote(ctx, id, newOwner) {
        const voteString = await this.ReadVote(ctx, id);
        const vote = JSON.parse(voteString);
        const oldOwner = vote.Owner;
        asset.Owner = newOwner;
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(vote))));
        return oldOwner;
    }

    // GetAllAssets returns all assets found in the world state.
    async GetAllVotes(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
}

module.exports = VoteChain;
