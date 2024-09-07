'use strict';

// Deterministic JSON.stringify()
const { Contract } = require('fabric-contract-api');
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');

class voteInit extends Contract {

    async InitLedger(ctx) {
        const votes = [
            {
                ID: '1',
                Owner: 'Tomoko',
            },
            {
                ID: '2',
                Owner: 'Brad',
            },
        ];

        for (const vote of votes) {
            vote.docType = 'vote';
            // example of how to write to world state deterministically
            // use convetion of alphabetic order
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
            await ctx.stub.putState(
                vote.ID, 
                Buffer.from(stringify(sortKeysRecursive(vote)))
            );
        }
    }

    // CreateVote issues a new vote to the world state with given details.
    async CreateVote(ctx, id, owner) {
        const exists = await this.VoteExists(ctx, id);
        if (exists) {
            throw new Error(`The vote ${id} already exists`);
        }

        const vote = {
            ID: id,
            Owner: owner,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(vote))));
        return JSON.stringify(vote);
    }

    // ReadVote returns the vote stored in the world state with given id.
    async ReadVote(ctx, id) {
        const voteJSON = await ctx.stub.getState(id); // get the vote from chaincode state
        if (!voteJSON || voteJSON.length === 0) {
            throw new Error(`The vote ${id} does not exist`);
        }
        return voteJSON.toString();
    }

    // UpdateVote updates an existing vote in the world state with provided parameters.
    async UpdateVote(ctx, id, owner) {
        const exists = await this.VoteExists(ctx, id);
        if (!exists) {
            throw new Error(`The vote ${id} does not exist`);
        }

        // overwriting original vote with new vote
        const updatedVote = {
            ID: id,
            Owner: owner,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedVote))));
    }

    // DeleteVote deletes an given vote from the world state.
    async DeleteVote(ctx, id) {
        const exists = await this.VoteExists(ctx, id);
        if (!exists) {
            throw new Error(`The vote ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    // VoteExists returns true when vote with given ID exists in world state.
    async VoteExists(ctx, id) {
        const voteJSON = await ctx.stub.getState(id);
        return voteJSON && voteJSON.length > 0;
    }

    // TransferVote updates the owner field of vote with given id in the world state.
    async TransferVote(ctx, id, newOwner) {
        const voteString = await this.ReadVote(ctx, id);
        const vote = JSON.parse(voteString);
        const oldOwner = vote.Owner;
        vote.Owner = newOwner;
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(vote))));
        return oldOwner;
    }

    // GetAllVotes returns all votes found in the world state.
    async GetAllVotes(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all votes in the chaincode namespace.
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

module.exports = voteInit;
