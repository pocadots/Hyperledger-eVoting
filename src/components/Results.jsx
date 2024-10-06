import React, { useEffect, useState } from 'react'
import axios from 'axios';

const Results = () => {
  const [loading, setLoading] = useState(true);
  const [VoteResults, setVoteResults] = useState([]);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/results').then( 
      (response) => {
        setVoteResults(response.data);
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


    return (
        <div class="relative overflow-x-auto">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead class="text-xs text-gray-500 uppercase bg-gray-700 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" class="px-6 py-3">
                            Option
                        </th>
                        <th scope="col" class="px-6 py-3">
                            Total Votes
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {VoteResults.map((option) =>
                        <tr class="bg-gray-700 border-b dark:bg-gray-800 dark:border-gray-700">

                                <th scope="row" class="px-6 py-4 font-medium text-gray-600 whitespace-nowrap dark:text-white"> {option.optionName} </th>
                                <td class="px-6 py-4 text-gray-500" > {option.voteCount} </td>

                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Results;