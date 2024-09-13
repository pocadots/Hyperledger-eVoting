import React, { useState, useEffect } from 'react'
import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom'
import axios from 'axios';
import HomePage from './pages/HomePage';
import MainLayout from './layout/MainLayout';
import OptionsPage from './pages/OptionsPage';
import DashboardPage from './pages/DashboardPage';
import SignUpPage from './pages/SignUp';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path='/' element={<MainLayout />}>
      <Route index element={<HomePage />} />
      <Route path='/voting' element={<OptionsPage />} />
      <Route path='/dashboard' element={<DashboardPage />} />
      <Route path='/SignUp' element={<SignUpPage />} />
    </Route>
  )
);

const App = () => {
  const apiCall = () => {
    axios.get('/api').then((data) => {
      console.log(data);
    })
  }
  
  useEffect(() => {
    apiCall();
  }, []);
  return <RouterProvider router={router}/>
};

export default App

