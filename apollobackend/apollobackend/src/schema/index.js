import { gql } from 'apollo-server-express';

import userSchema from './user'
import blogSchema from './blog'

const linkSchema = gql`
    scalar Date
    scalar JSON
    scalar Number

    directive @isAuth on FIELD_DEFINITION

    type Query {
        _ : Boolean
    }

    type Mutation {
        _ : Boolean
    }

    type Subscription {
        _ : Boolean
    }
`;


export default [
    linkSchema,
    userSchema,
    blogSchema,
];