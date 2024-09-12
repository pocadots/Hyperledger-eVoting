import React, { useState, useEffect } from 'react'
import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom'
import axios from 'axios';
import HomePage from './pages/HomePage';
import MainLayout from './layout/MainLayout';
import OptionsPage from './pages/OptionsPage';
import DashboardPage from './pages/DashboardPage';


const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path='/' element={<MainLayout />}>
      <Route index element={<HomePage />} />
      <Route path='/voting' element={<OptionsPage />} />
      <Route path='/dashboard' element={<DashboardPage />} />
    </Route>
  )
);

const App = () => {

  // state = {
  //   fruit: [],
  // };
  // const [count, setCount] = useState(0);
  // const [array, setArray] = useState([]);
  const apiCall = () => {
    axios.get('/api').then((data) => {
      console.log(data);
      // this.setState({ fruit: response.data });
    })
  }
  
  useEffect(() => {
    apiCall();
  }, []);
  return <RouterProvider router={router}/>
};

export default App

