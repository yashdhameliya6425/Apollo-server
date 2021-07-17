import jwt from 'jsonwebtoken';
import { UserInputError,  AuthenticationError }  from 'apollo-server-express';
import pubsub, { EVENTS } from '../subscriptions';
import joiBase from '@hapi/joi';
import joiDate from '@hapi/joi-date';

const Joi = joiBase.extend(joiDate);

const generateToken = async (user,secret, expiresIn) => {
    const { id, email } = user
    return await jwt.sign({ id, email }, secret, { expiresIn}) 
}

export default {
      Query : {
        me : (parent,args, {models, me}) => {
            if(!me){
                return null;
            }
            return new Promise((resolve,reject) => {
                models.User.findById(me.id).exec((err, res) => {
                    if(err){
                        reject(err)
                    }
                    resolve(res)
                })
            })
        },
        getUsers : (parent,args, { models }) => {
            return new Promise((resolve,reject) => {
                models.User.find({ isDeleted : false }).exec((err, res) => {
                    if(err){
                        reject(err)
                    }
                    resolve(res)
                })
        })
        },

        getAllUsers: (parent, args, {models}) => {
            return new Promise((resolve, reject) => {
                let filter = JSON.parse(args.filter);
                const sort = { [args.sort.key]: args.sort.type };
                models.User.paginate(
                    { ...filter },
                    {
                        page : args.page,
                        limit : args.limit,
                        sort : sort,
                    }
                ).then((res) => {
                    resolve({ count : res.total, data: res.docs })
                }).catch((err) => {
                    reject(err);
                })
         })   
        }
      },
      Mutation : {
        signUp: (parent, {input}, {models, me, secret}) => {
            return new Promise((resolve, reject) => {
                // const schema = Joi.object().keys({
                //     firstName: Joi.string().required(),
                //     lastName: Joi.string().required(),
                //     userName: Joi.string().required(),
                //     email: Joi.string().email().required(),
                //     password: Joi.string().min(6).required(),
                //     phone: Joi.number().required(),
                //     dob:  Joi.date().format('YYYY-MM-DD').utc().required(),
                //     gender: Joi.string().valid('male','female', 'other'),
                //     isActive: Joi.boolean().default(true)
                // })

                // const { value, error } = schema.validate(input, { abortEarly : false })
                // if(error){
                //     throw new UserInputError('Validation error: ', error.details)
                // }

                models.User.create(input, (err, res) => {
                    if(err){
                        reject(err)
                    }
                    if(res){
                        models.User.paginate({ _id : res._id }, {})
                        .then((resp) => {
                            pubsub.publish(EVENTS.USER.USER_CREATED, {
                                userChange : {keyType : 'INSERT', data : resp.docs[0]}
                            })
                            resolve(res)
                        })
                    }
                })
            })
        },

        signIn : async (parent, { email, password }, {models, secret}) => {
            const user = await models.User.findOne({email })
            if(!user){
                throw new UserInputError('No user found with this email');
            }
            // const isValid = await user.validatePassword(password);
            // if(!isValid){
            //     throw new UserInputError('Invalid Password.');
            // }
            if(!user.isActive || user.isDeleted === true){
                throw new AuthenticationError('user was deleted or deactivated.')
            }
            return {
                token : generateToken(user, secret, '8h'),
                user : user
            }
        },

        updateUser: async(parent, { input}, {models, me}) => {
            return new Promise(async (resolve,reject) => {
                const userId = me.id

                models.User.findByIdAndUpdate(userId, input, { new : true }).exec((err, res) => {
                    if(err){ 
                        reject(err)
                    }
                    models.User.paginate({ _id : res._id }, {})
                    .then((resp) => {
                        pubsub.publish(EVENTS.USER.USER_UPDATED, {
                            userChange : {keyType : 'UPDATE', data : resp.docs[0]}
                        })
                        resolve(res)
                    })
                })
            })
        },
        deleteUser : async (parent,{id}, {models}) => {
            const user =await models.User.findById(id);
            if(user){
                user.isDeleted = true
                await user.save()
                // await user.remove()
                return true
            }else{
                return false
            }
        }
    },

    Subscription: {
        userChange: {
            subscribe: () => pubsub.asyncIterator([EVENTS.USER.USER_CREATED, EVENTS.USER.USER_UPDATED, EVENTS.USER.USER_DELETED]),
        },
    },
    };