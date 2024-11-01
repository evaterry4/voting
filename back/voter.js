const exp = require('constants');
const express = require('express');
const app = express();

const { MongoClient } = require('mongodb');
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
let port = 3002;

//app is our http server
app.use(express.json());

app.listen(port, () => console.log(`listening on port ${port}`));

//CREATE, executable that is called when the root target and post method are used
app.post('/', async (request, response) => {
    //getting the value from the body of the request, feature of express
    const submittedVoter = request.body.name;
    const voterData = { "name": submittedVoter, "ballot": null };
    try {
        await client.connect();
        await client.db('voter').collection('voters')
            .insertOne(voterData)
            .then(results => response.send(results))
            .catch(error => console.error(error));
    } catch (error) {
        console.error(error);
    } finally {
        client.close();
    }
})

//read
// go to mongodb, request the data out of the collection, and send the array to apache in the frontend
// default by the browser
app.get('/', async (request, response) => {
    try {
        await client.connect();
        await client.db('voter').collection('voters')
            .find().sort({name:1})
            .toArray()
            .then(results => {
                response.send(results);
            }).catch(error => console.error(error));
    } catch (error) {
        console.error(error);
    } finally {
        client.close();
    }
})

// UPDATE, update voter record with vote
app.put('/', async (request, response) => {
    const submission = request.body.candidate;
    const voterFilter = {"name": request.body.name};

    const updateDocument = {$set: {"ballot": {"name": submission}}};
    
    try {
        await client.connect();
        await client.db('voter').collection('voters')
            .updateOne(voterFilter, updateDocument)
            .then(results => response.send(results))
            .catch(error => console.error(error));
    } catch(error){
        console.error(error);
    } finally {
        client.close();
        // open and close connection for every request
    }
})

//DELETE
app.delete('/', async (request, response) => {
    const voterFilter = {"name": request.body.name};
    try {
        await client.connect();
        console.log("Voter filter:", voterFilter);

        await client.db('voter').collection('voters')
        
        .deleteOne(voterFilter)
        .then(results=> response.send(results))
        .catch(error => console.error(error));
    } catch(error) {
        console.error(error);
    } finally {
        client.close();
    }
})