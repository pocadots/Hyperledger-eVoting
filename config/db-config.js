const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('MongoDB connected...');
        await initializeData();
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const initializeData = async () => {
    const User = require('../models/user');
    const Option = require('../models/option');

    // Check if data already exists
    const count = await User.countDocuments().exec();
    if (count === 0) {
        // Define initial data
        const initialData = [
            {
                username: 'admin',
                password: 'admin',
                id: '0',
                organization: 'org1',
                role: 'admin'
            },
            {
                username: 'user1',
                password: 'user1',
                id: '1',
                organization: 'org1',
                role: 'user'
            },
            {
                username: 'user2',
                password: 'user2',
                id: '2',
                organization: 'org1',
                role: 'user'
            },
        ];

        for (let userData of initialData) {
            const newUser = new User(userData);
            await newUser.save();
        }
        console.log('Initial user data inserted');
    } else {
        console.log('Use data already exists');
    }

    const options = await Option.countDocuments().exec();
    if (options === 0) {
        //Define option data
        const initialOptions = [
            {
                id: '1',
                description: 'option 1'
            },
            {
                id: '2',
                description: 'option 2'
            },
            {
                id: '3',
                description: 'option 3'
            },
            {
                id: '4',
                description: 'option 4'
            }
        ];

        for (let optionsData of initialOptions) {
            const newOption = new Option(optionsData);
            await newOption.save();
        }
        console.log('Initial options data inserted');
    } else {
        console.log('Use data already exists');
    }
}

module.exports = connectDB;