'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

let endTime;
let voteStart = false;

class VoteChain extends Contract {

    // InitLedger initializes the chaincode state with a few sample voting options
    async InitLedger(ctx) {

        const votes = [
            {
                Id: "1",
                voteFlag: false,
            },
            {
                Id: "2",
                voteFlag: false,
            }
        ]

        // write to world state deterministically
        // use convetion of alphabetic order
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
        
        for (const vote of votes) {
            vote.docType = 'vote';
            await ctx.stub.putState(vote.Id, Buffer.from(stringify(sortKeysRecursive(vote))));
        }
    }

    // Unused chaincode for future uses
    // // queryVotes retrieves the vote count for a specific option
    // async queryVotes(ctx, voteId) {
    //     const voteJSON = await ctx.stub.getState(voteId);
    //     if (!voteJSON) {
    //         throw new Error("===== Vote doesn't exist =====");
    //     }

    //     let results;
    //     try {
    //         results = JSON.parse(voteJSON.toString());
    //     } catch (err) {
    //         throw new Error(`===== Failed to parse vote JSON: ${err} =====`);
    //     }
    //     return results;
    // }

    // async queryVote(ctx, voteId){
    //     console.log('============= START : queryVote ===========');
    //     console.log(`voteId: ${voteId}`);

    //     // if(votestart == false){
    //     //   	console.log("Voting has not started yet!");
    //     //     console.log('============= END : queryVote ===========');
    //     //     return JSON.stringify({"ownerId":"-2","hasVoted":false});

    //     // }

    //     // get the vote from chaincode state
    //     const voteQuery = await ctx.stub.getState(voteId); 
    //     if (!voteQuery || voteQuery.length === 0) {
    //         console.log(`${voteId} does not exist!`);            
    //         return JSON.stringify({"Id":"-1","voteFlag":false});
    //     }
    //     let vote = JSON.parse(voteQuery.toString());
    //     // console.log(vote);
    //     if(vote.voteFlag == true){
    //     console.log('============= END : queryVote ===========');
    //     return JSON.stringify(vote);
    //     }
    //     else{
    //         console.log(`Vote ${voteId} has not been cast yet.`);
    //         return JSON.stringify({"Id":"-1","voteFlag":false});   
    //         }
    // }

    // getResults returns all vote objects
    async getResults(ctx) {
        const iterator = await ctx.stub.getStateByRange("", "");
        const results = [];

        try {
            while (true) {
                const result = await iterator.next();
                if (result.done) {
                    break;
                }
                const vote = JSON.parse(result.value.value.toString());

                if (vote.voteFlag == true) {
                    //add to the results list if not already there
                    if (!(results.some(item => item.optionId == vote.Id))) {
                        let newOption = { "optionId": vote.Id, "voteCount": 1 };
                        results.push(newOption);
                    } else {
                        //if already in list, increment by 1
                        for (let i = 0; i < results.length; i++) {
                            if (vote.Id == results[i].optionId) {
                                results[i].voteCount += 1;
                            }
                        }
                    }
                }
                // results.push(vote); //remove after testing 
            }
        } catch (err) {
            throw new Error(`===== Failed to get from world state: ${err} =====`);
        } finally {
            await iterator.close();
        }

        return JSON.stringify(results);;
    }

    // AddVote adds a new vote object to the ledger
    async addVote(ctx, Id) {
        const findOption = await this.queryExists(ctx, Id);
        if (findOption) {
            throw new Error(`Option ${findOption} already exist`);
        }
        console.log('===== Attempting to add voting option =====');
        const vote = {
            Id: Id,
            voteFlag: false,
        };
        // Put Vote to the ledger
        try {
            await ctx.stub.putState(vote.Id, Buffer.from(JSON.stringify(vote)));
        } catch (err) {
            throw new Error(`===== Failed to put vote state: ${err} =====`);
        }
        
        console.log('===== Vote successfully added =====');
        return null;
    }


    async queryExists(ctx, Id) {
        const user = await ctx.stub.getState(Id);
        return user && user.length > 0;
    }

    async setEndTime(ctx, timeVal){
        console.log('===== Setting election closing time =====');
        // The EC invokes this function to set an end time for the election. 
        // It takes the election duration in minutes as an input, and adds that to 
        // the current time to define the end time. 

        // Before the election end time is specified, voting is turned off and 
        // voters cannot cast their votes, or query the ledger. 

        // After the end time is set, voters are allowed to cast their votes. However, untill 
        // the end time elapses, all query functions are blocked.

        let duration = new Date(endTime).setTime(parseInt(timeVal));
        endTime = new Date(duration);

        voteStart = true;
        
        console.log('===== Successfully set end time =====', endTime);

        return endTime.toString();
    }

    async castVote(ctx, voterId, optionId){
        console.log('======= Attempting to cast vote ======');
        // This function is invoked to change the vote object id to the option the voter chooses and the vote is cast

        // Before committing any change it checks:
        // -If the voting has  started yet
        // -If the current time is earlier than the election closing time
        
        // If no vote is owned by the voterId, the vote must have already been cast and the voter 
        // is trying to double spend. An error is returned, and the vote is not cast.
        
        // If the vote object is found, it is fetched from the chainstate. The owner id is changes
        // to the candidate id that the voter wishes to vote for, and the hasVoted field to set to true.

        let curTime = new Date();

        if(voteStart!= true){
          	console.log("Voting has not started yet.");
            return "0";
        }
        if(curTime.getTime()>endTime.getTime()){
          	console.log("Voting has ended.");
            return "1";
        }
	
      	// Finding the voteId of the vote object owned by the voter.
        let voteId = -1;
        const iterator = await ctx.stub.getStateByRange("", "");

        while(true){
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                const Key = res.value.key;
                let vote;

                try{
                    vote = JSON.parse(res.value.value.toString('utf8'));
                    if (vote.Id == voterId){
                        voteId = Key;
                        break;
                    }
                } catch (err){
                    console.log("voterId not found, maybe you have not registered.")
                    console.log(err);
                    vote = res.value.value.toString('utf8');
                }
            }
            if (res.done){
                if (voteId == -1){
                    await iterator.close();
                    console.log('Voter has already voted, exiting without casting vote.');
                    return "2";
                } 
                await iterator.close();
                break;
            }
        }

        // Get the vote from chaincode state
        const voteState = await ctx.stub.getState(voteId); 
        if (!voteState || voteState.length === 0) {
            throw new Error(`${voteId} associated with your account does not exist, you could have already voted!`);
        }
        let vote = JSON.parse(voteState.toString());
      
      	/*Set the ownerId to the option id of the voter's choice, and set 
      	hasVoted to true.*/
      
        if (vote.voteFlag != true){
            vote.Id = optionId;
            vote.voteFlag = true;
        } else {
            throw new Error('Already voted.');
        }

        await ctx.stub.putState(voteId, Buffer.from(JSON.stringify(vote)));
        console.log(`voteId ${voteId} casted successfully.`);

        return null;
    }

}

module.exports = VoteChain;