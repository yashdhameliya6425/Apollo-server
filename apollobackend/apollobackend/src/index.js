import express from 'express';
import { ApolloServer, AuthenticationError }  from 'apollo-server-express';
import 'dotenv/config';
import models,{ connectDB } from './models';
import schema from './schema';
import resolvers from './resolvers';
import schemaDirectives from './directives'
import http from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import axios from 'axios';
import rateLimit from 'axios-rate-limit';
import cron from 'node-cron'
import helmet from 'helmet'
import moment from 'moment'

let ObjectId = mongoose.Types.ObjectId

const app = express();
const port = process.env.PORT || 3000;

// app.use(helmet());
app.use(helmet({ contentSecurityPolicy: (process.env.NODE_ENV === 'production') ? undefined : false }));
app.use(express.json());
app.use(express.urlencoded({ extended : true }));

// const apiRequest = async (endpoint) => {
// //    return await rateLimit(axios.get(`https://financialmodelingprep.com/api/v3/${endpoint}`, {
// //     params:{
// //         apikey : 'd75982e66edf07c9e6cb369b60ae0d72'
// //     }
// // }), {
// //     maxRequests: 2, perMilliseconds: 1000, maxRPS: 2
// // })

// return await axios.get(`https://financialmodelingprep.com/api/v3/${endpoint}`, {
//     params:{
//         apikey : 'd75982e66edf07c9e6cb369b60ae0d72'
//     }
// })
// }

// const getSymbolList = async () => {
//     return await apiRequest(`financial-statement-symbol-lists/`)
// }

// const getProfile = async (symbol) => {
//     return await apiRequest(`profile/${symbol}`)
// }

// const getQuote = async (symbol) => {
//     return await apiRequest(`quote/${symbol}`)
// }

// cron.schedule('*/10 * * * * *', () => {
//     let input = {};
//     console.log("fetching records");
//     getSymbolList().then(symbols => {
//         symbols.data.forEach(symbol => {
//             getProfile(symbol).then(resProfile => {
//                 console.log("res", resProfile);
//                 // resProfile.data.forEach(item => {
//                 //     input.ticker = item.symbol
//                 //     input.company = item.companyName
//                 //     input.city = item.city
//                 //     input.state = item.state
//                 //     input.country =  item.country
//                 // })
//             }).catch()

//             // getQuote(symbol).then(resQuote => {
//             //     // resQuote.data.forEach(item => {
//             //     //     input.share_price = item.price
//             //     //     input.market_cap = item.marketCap
//             //     //     input.yearHigh = item.yearHigh
//             //     //     input.yearLow = item.yearLow
//             //     // })
//             // }).catch()
//         })
//     }).catch()
// })


ObjectId.prototype.valueOf = function() {
    return this.toString();
};

const getMe = async (req) => {
    const token = req.headers['x-token'];
    if(token){
        try{
            const me = await jwt.verify(token, process.env.SECRET)
            return await models.User.findById(me.id)
        }catch(e) {
            throw new AuthenticationError('Session Invalid or expired.')
        }
    }
}

const server = new ApolloServer({
    typeDefs : schema,
    resolvers,
    schemaDirectives,
    formatError : error => {
        const message = error.message
        .replace('SequelizeValidationError: ', '')
        .replace('Validation error: ', '')
  
      return { ...error, message };
    },
    formatResponse : response => response,
    context : async ({req, res}) => {
        if(req){
            const me = await getMe(req)
            return {
                models,
                me,
                secret: process.env.SECRET
            }
        }
    }
})

server.applyMiddleware({ app, path : '/graphql' });
const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer)

connectDB().then( async () => {
    httpServer.listen({ port }, () => {
        console.log(`Apollo Server on http://localhost:${port}/graphql`);
    })
} )