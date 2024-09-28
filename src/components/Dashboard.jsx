import React from 'react'

const Dashboard = () => {
  // const handleSubmit = (event) => {
  //   alert("Woohoo!");
  // }

  return (
    <div className="bg-gray-700 font-sans overflow-x-auto min-h-screen">
      <div id="head" className="text-center">
        <h1 align="center" >Admin Dashboard</h1>
        <br />
      </div>

      <div className='bg-gray-400 bg-opacity-80 mb-20 mt-10'>
        <form className='space-y-4 font-[sans-serif] max-w-md mx-auto' method='POST' action='/dashboard/addOption' id='addOption'>
          <div>
            <legend className='mb-1 text-sm block'> 
              Name
            </legend>
            <input type='text' name='description' placeholder='voting option'
              class="px-4 py-1.5 text-sm rounded-md bg-white border border-gray-400 w-full outline-blue-500" required/>
          </div>
          <input className="w-full px-4 py-2.5 mx-auto block text-sm bg-blue-500 text-white rounded hover:bg-blue-600" id="addOption" type="submit" value="Add option" />
        </form>
      </div>

      <div className="bg-gray-400 bg-opacity-80 mb-20 mt-10">
        <form className='space-y-4 font-[sans-serif] max-w-md mx-auto' method='POST' action='/dashboard/addDate' id='addDate'>
          <legend className='mb-1 text-sm block'>
            Define end date
          </legend>
          <input type="date" name='duration' required />
          <input className='w-full px-4 py-2.5 mx-auto block text-sm bg-blue-500 text-white rounded hover:bg-blue-600' id="addDate" type="submit" value="Submit Date" />
        </form>
      </div>
    </div>
  )
}

export default Dashboard