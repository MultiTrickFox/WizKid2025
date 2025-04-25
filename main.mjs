//

import mongo from 'mongodb'
const mongo_client = new mongo.MongoClient(process.env.mongo_connect)
await mongo_client.connect()
const mongo_db = mongo_client.db('main')

//


