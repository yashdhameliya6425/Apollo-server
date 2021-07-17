import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const ObjectId = mongoose.Schema.Types.ObjectId;;

const testSchema = new mongoose.Schema({
    ticker : {
        type : String,
        trim : true
    },
    company: {
        type: String
    }, 
    city: {
        type: String
    },
    state: {
        type: String
    },
    country: {
        type: String
    },
    share_price: {
        type: Number
    },
    market_cap: {
        type: Number
    },
    yearHigh: {
        type: Number
    },
    yearLow: {
        type: Number
    }
}, {
    timestamps : true
})

testSchema.plugin(mongoosePaginate)

const Test = mongoose.model('test', testSchema);
export default Test;