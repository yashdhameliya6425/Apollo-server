import mongoose from 'mongoose'
import User from './user.js'
import Blog from './blog.js'
import Test from './test.js';

const connectDB = () => {
    return mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser : true,useCreateIndex : true, useUnifiedTopology: true, useFindAndModify : false })
}

const models = {
    User,
    Blog,
    Test
}

export { connectDB }
export default models