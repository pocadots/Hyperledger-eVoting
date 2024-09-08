'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

let endTime;

class VoteChain extends Contract {

    // InitLedger initializes the chaincode state with a few sample voting options
    async InitLedger(ctx) {
        // const options = [
        //     {
        //         Id: "1",
        //         Name: "George",
        //     },
        //     {
        //         Id: "2",
        //         Name: "Sample1",
        //     },
        //     {
        //         Id: "3",
        //         Name: "Sample2",
        //     },
        //     {
        //         Id: "4",
        //         Name: "Sample2",
        //     },
        // ];

        const votes = [
            {
                Id: "1",
                voteFlag: false,
            },
            {
                Id: "2",
                voteFlag: true,
            },
            {
                Id: "3",
                voteFlag: false,
            },
        ]

        // write to world state deterministically
        // use convetion of alphabetic order
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash

        // for (const option of options) {
        //     option.docType = 'option';    
        //     await ctx.stub.putState(option.Id, Buffer.from(stringify(sortKeysRecursive(option))));
        // }
        
        for (const vote of votes) {
            vote.docType = 'vote';
            await ctx.stub.putState(vote.Id, Buffer.from(stringify(sortKeysRecursive(vote))));
        }
    }

    // queryVotes retrieves the vote count for a specific option
    async queryVotes(ctx, voteId) {
        const voteJSON = await ctx.stub.getState(voteId);
        if (!voteJSON) {
            throw new Error("===== Vote doesn't exist =====");
        }

        let votes;
        try {
            votes = JSON.parse(voteJSON.toString());
        } catch (err) {
            throw new Error(`===== Failed to parse vote JSON: ${err} =====`);
        }
        return votes;
    }

    async queryVote(ctx, voteId){
        console.info('============= START : queryVote ===========');
        console.log(`voteId: ${voteId}`);

        // if(votestart == false){
        //   	console.info("Voting has not started yet!");
        //     console.info('============= END : queryVote ===========');
        //     return JSON.stringify({"ownerId":"-2","hasVoted":false});

        // }

        // get the vote from chaincode state
        const voteQuery = await ctx.stub.getState(voteId); 
        if (!voteQuery || voteQuery.length === 0) {
            console.info(`${voteId} does not exist!`);            
            return JSON.stringify({"Id":"-1","voteFlag":false});
        }
        let vote = JSON.parse(voteQuery.toString());
        // console.log(vote);
        if(vote.voteFlag == true){
        console.info('============= END : queryVote ===========');
        return JSON.stringify(vote);
        }
        else{
            console.log(`Vote ${voteId} has not been cast yet.`);
            return JSON.stringify({"Id":"-1","voteFlag":false});   
            }
    }

    // getAllVotes returns all vote objects
    async getAllVotes(ctx) {
        const iterator = await ctx.stub.getStateByRange("", "");
        const votes = [];

        try {
            while (true) {
                const result = await iterator.next();
                if (result.done) {
                    break;
                }
                const vote = JSON.parse(result.value.value.toString());
                votes.push(vote);
            }
        } catch (err) {
            throw new Error(`===== Failed to get from world state: ${err} =====`);
        } finally {
            await iterator.close();
        }

        return JSON.stringify(votes);;
    }

    // AddVote adds a new vote object to the ledger
    async AddVote(ctx, Id) {
        const findOption = await this.queryExists(ctx, Id);
        if (findOption) {
            throw new Error(`Option ${findOption} already exist`);
        }
        console.info('===== Attempting to add voting option =====')
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
        
        console.info('===== Vote successfully added =====')
        return null;
    }

    // async CreateVote(ctx, Id) {
    //     console.info('===== Attempting to create vote object for new voter')
    //     const vote = {
    //         ownerId: Id,
    //         hasVoted: false,
    //     };

    //     // const voteJSON = JSON.stringify(vote);
    //     // Put vote object to ledger
    //     try {
    //         await ctx.stub.putState(vote.ownerId, Buffer.from(JSON.stringify(vote)));
    //     } catch (err) {
    //         throw new Error(`===== Failed to put vote object state: ${err} =====`);
    //     }
    // }

    async queryExists(ctx, Id) {
        const user = await ctx.stub.getState(Id);
        return user && user.length > 0;
    }

    async setEndTime(ctx, timeVal){
        console.info('===== Setting election closing time =====');
        // The EC invokes this function to set an end time for the election. 
        // It takes the election duration in minutes as an input, and adds that to 
        // the current time to define the end time. 

        // Before the election end time is specified, voting is turned off and 
        // voters cannot cast their votes, or query the ledger. 

        // After the end time is set, voters are allowed to cast their votes. However, untill 
        // the end time elapses, all query functions are blocked.

        let curDate = new Date();

        curDate = curDate.setTime(curDate.getTime()+ parseInt(timeVal)*60*1000);
        endTime = new Date(curDate);

        // votestart = true;
        
        console.info('===== Successfully set end time =====');

        return endTime.toString();
    }

    async castVote(ctx, voterId, optionId){
        console.info('======= Attempting to cast vote ======');
        // This function is invoked to change the vote object id to the option the voter chooses and the vote is cast

        // Before committing any change it checks:
        // -If the voting has  started yet
        // -If the current time is earlier than the election closing time
        
        // If no vote is owned by the voterId, the vote must have already been cast and the voter 
        // is trying to double spend. An error is returned, and the vote is not cast.
        
        // If the vote object is found, it is fetched from the chainstate. The owner id is changes
        // to the candidate id that the voter wishes to vote for, and the hasVoted field to set to true.

        let curTime = new Date();

        // if(votestart!= true){
        //   	console.info("Voting has not started yet.");
        //     return "0";
        // }
        if(curTime.getTime()>endTime.getTime()){
          	console.info("Voting has ended.");
            return "1";
        }
	
      	// Finding the voteId of the vote object owned by the voter.
        let voteId = -1;
        // const startKey = '0';
        // const endKey = (voteId+1).toString();
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
                    console.info("voterId not found, maybe you have not registered.")
                    console.log(err);
                    vote = res.value.value.toString('utf8');
                }
            }
            if (res.done){
                if (voteId == -1){
                    await iterator.close();
                    console.info('Voter has already voted, exiting without casting vote.');
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
      
      	/*Set the ownerId to the CandidateId of the preffered candidate, and set 
      	hasVoted to true.*/
      
        if (vote.voteFlag != true){
            vote.Id = optionId;
            vote.voteFlag = true;
        } else {
            throw new Error('Already voted.');
        }

        await ctx.stub.putState(voteId, Buffer.from(JSON.stringify(vote)));
        console.info(`voteId ${voteId} casted successfully.`);

        return null;
    }

}

module.exports = VoteChain;