const http = require("http");
const url = require("url");
const { MongoClient } = require('mongodb');
const mongoURI = "mongodb://localhost:27017";
const client = new MongoClient(mongoURI);

const hostname = "127.0.0.1";
const port = 3008;
const server=http.createServer();

server.on('request', async (request, response) => {
    let q = url.parse(request.url, true);
    let returnCandidates = [];
    switch(q.pathname){
        case "/candidates":
            returnCandidates = await getCandidates();
            break;
        case "/candidates/ballots":
            returnCandidates = await getCandidatesWithVotes();
            break;
    }
    response.writeHead(200, {'Content-type': 'text/JSON'});
    response.end(JSON.stringify(returnCandidates));
})

server.on('error', error=>console.log(error.stack));

server.listen(port, hostname, () => console.log(`server running at http://${hostname}:${[port]}`))

// async because it connects to the mongo service and we don't want it to lock up and wait
async function getCandidates(){
    let values = [];
    const database = client.db('voter');
    const candidates = database.collection('candidates');
    const cursor = candidates.find();
    while (await cursor.hasNext()){
        values.push(await cursor.next());
    }
    return values;
}

async function getCandidatesWithVotes(){
    const votes = new Map();
    const database = client.db('voter');
    const candidates = database.collection('candidates');
    const cursorCandidates = candidates.find();

    
    while (await cursorCandidates.hasNext()) {
        const candidate = await cursorCandidates.next();
        votes.set(candidate.name, 0);
    }

    let values = [];
    
    const voters = database.collection('voters');
    const cursor = voters.find();
    while (await cursor.hasNext()){
        const voter = await cursor.next();
        let ballot = voter.ballot;

        if(ballot != null){
            let curCandidateName = ballot.name;
            const prevVotes = votes.get(curCandidateName) || 0; 
            votes.set(curCandidateName, prevVotes+1);
        }
        
    }

    for (const [key, value] of votes) {
        values.push({name: key, voteCount: value});
      }
    
    return values;
}