import React from 'react'

const Dashboard = () => {
  const handleSubmit = (event) => {
    alert("Woohoo!");
  }

  return (
    <div className="bg-gray-700 font-sans overflow-x-auto min-h-screen">
      <div id="head" className="text-center">
        <h1 align="center" >Admin Dashboard</h1>
        <br />
      </div>
      
      <div className='bg-gray-400 bg-opacity-80 mb-20 mt-10'>
      <form className='space-y-4 font-[sans-serif] max-w-md mx-auto' method='POST' action='/dashboard/addOption' id='addOption' onSubmit={handleSubmit}>

        <div>
          <legend className='mb-1 text-sm block'> Name 
          </legend>
            <input type='text' placeholder='voting option'
              class="px-4 py-1.5 text-sm rounded-md bg-white border border-gray-400 w-full outline-blue-500" />
        </div>
        <input className="w-full px-4 py-2.5 mx-auto block text-sm bg-blue-500 text-white rounded hover:bg-blue-600" id="addOption" type="submit" name="submit" value="Add option" />
      </form>
      </div>

      <div className="mt-10 space-y-4 font-[sans-serif] max-w-md mx-auto">
            <legend className='mb-1 text-sm block'>
              Define end date
            </legend>
              <input id="endDate" type="date" name="" />
        <input className='w-full px-4 py-2.5 mx-auto block text-sm bg-blue-500 text-white rounded hover:bg-blue-600' id="addDate" type="submit" name="submit" value="Submit Date" />
      </div>
    </div>
  )
}

export default Dashboard