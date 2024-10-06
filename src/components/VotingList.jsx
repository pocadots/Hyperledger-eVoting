import React, { useEffect, useState } from 'react'
import axios from 'axios';

const VotingList = () => {
  const [loading, setLoading] = useState(true);
  const [VoteOptions, setVoteOptions] = useState([]);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/voting').then( 
      (response) => {
        setVoteOptions(response.data);
      },
      (error) => {
        const _content =
          (error.response && error.response.data) ||
          error.message ||
          error.toString();
        setContent(_content);
      });
    setLoading(false);
  }, []);

  function vote() {
    alert('You have successfully voted! ');
  };


  return (
    <div className='bg-gray-700 min-h-screen flex flex-col'>
      <h1 className='text-3xl text-white mb-8 content-' align="center">Hyperledger Voting</h1>
      {/* <h3 className='text-white' align="center"><p>Voting Dates: <span id="dates"></span></p></h3> */}
      <br />
      {loading && <div>Loading</div>}
      {!loading && (
        <div className='w-full p-8 rounded-2xl bg-gray-300 shadow bg-opacity-80'>
          <form id='voting-form' action='/voting/submit' className='w-full mt-5 mb-5 rounded space-y-4 font-[sans-serif] max-w-md mx-auto' method='POST'>
            <div id="option" className="">
              {VoteOptions.map((option) =>
                <p>
                  <span className='flex items-center mr-80'> {option.description} </span>
                  <input className='flex justify-end w-4 h-4' type='radio' name='optionId' value={option.id} required />
                </p>
              )}
            </div>
            <div id="vote">
              <p className='mt-20 mb-5 '>Please select one of the options and click the vote button.</p>
              <button type='submit' className="w-2/5 p-3 bg-teal-700 text-white rounded text-lg cursor-pointer" onClick={vote}>
                Vote
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default VotingList;