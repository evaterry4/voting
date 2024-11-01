const endpoint = {};
endpoint['candidates'] = 'http://localhost:8080/candidates';
endpoint['candidatesWithBallots'] = 'http://localhost:8080/candidates/ballots';
endpoint['voters'] = 'http://localhost:8080/voters';

let voterPackage = {};

const viewType = {
    home: 'home',

}


function loadContent(view) {
    const contentAreas = document.getElementsByClassName('displayArea');
    for (area of contentAreas) {
        area.innerHTML = "";
    }

    switch (view) {
        case viewType['home']: {
            document.getElementById('addBtn').style.display = "block";
            document.getElementById('votersNotVoted').style.display = "block";
            document.getElementById('votersVoted').style.display = "block";
            fetchAndListCandidates();
            fetchAndListVoters();
            break;
        }
        case viewType['ballot']: {
            document.getElementById('addBtn').style.display = "none";
            document.getElementById('votersNotVoted').style.display = "none";
            document.getElementById('votersVoted').style.display = "none";
            fetchAndDrawBallot();
            break;
        }

    }
}

function deleteVoter(name) {
    console.log('trying to delete ' + name);
    const voterPackage = { "name": name };
    console.log(voterPackage);
    let deleteVoter = fetch(endpoint['voters'], {
        method: 'DELETE',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify(voterPackage)
    })
    .then(results => results.json())
    .then( (results) => {
        loadContent(viewType['home']);
    })
}

function makeAList(target, data, idField, ocfunction, deleteLink) {
    const element = document.getElementById(target);
    element.innerHTML = '';
    let list = document.createElement('ul');
    for (let i = 0; i < data.length; i++) {
        let li = document.createElement('li');
        let span = document.createElement('span');
        let keyValue = data[i][idField];
        if(ocfunction){
            span.onclick = ocfunction;
        }
        span.innerHTML = data[i].name;
        if(target == "candidateList" && data[i]["voteCount"] !== undefined){
            span.innerHTML += ", " + data[i]["voteCount"] + " votes";
        }
        span.id=keyValue;
        li.append(span);
        if(deleteLink){
            let link = document.createElement('a');
            link.innerHTML = "[ x ]";
            link.onclick = function() {deleteVoter(keyValue);}
            li.append(link);
        }

        list.appendChild(li);
    }
    element.append(list);
}

function recordNewVoter() {
    let newName = document.getElementById('userName').value;
    recordVoter(newName);
    closeSpan.onclick();
    // need to reload voter list
    fetchAndListVoters();
}

function fetchAndListCandidates() {
    // let target = 'candidates';
    // if (showVotes) {
    let target = 'candidatesWithBallots';
    // }
    let candidateNames = fetch(endpoint[target]);
    candidateNames
    .then((response) => response.json())
    .then((result) => {
        console.log(result);
        makeAList('candidateList', result, "name");
    })
    .catch((error) => {
        console.error('Error fetching candidate names:', error);
    });
    

}

function fetchAndListVoters() {
    console.log('fetching voters');
    let target = 'voters';
    let voterNames = fetch(endpoint[target]);
    voterNames
    .then((response) => response.json())
    .then((result) => {
        console.log(result);
        console.log('result');
        const votedVoters = result.filter(voter => (voter.ballot != null));
            const unvotedVoters = result.filter(voter => (voter.ballot == null));

            makeAList('completedBallots', votedVoters, "name", null, true);
            makeAList('potentialBallots', unvotedVoters, "name", function() {
                voterPackage = { "name": this.id };
                loadContent(viewType['ballot']); 
            }, true);
        
    })
    .catch((error) => {
        console.error('Error fetching voter names:', error);
    });
    

}
async function recordVoter(voter) {
    const dataToSend = {"name": voter};
    let addVoter = await fetch( endpoint['voters'],
    {
        method: 'POST',
        headers: {
            'Accept': 'application/JSON',
            'Content-type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
    })
    .then(response => response.json())
    .then( (result) => {
        // statusMessage(result);
        fetchAndListVoters();
    })
    .catch(error => console.log('error recording voter'));
}

function initPage() {
    // document.getElementById('heading').innerHTML = "Candidates";
    loadContent(viewType['home']);
    var modal = document.getElementById('myModal');
    var btn = document.getElementById('addBtn');
    var closeSpan = document.getElementsByClassName("close")[0];
    btn.onclick = function() {
        modal.style.display = "block";
    }

    closeSpan.onclick = function() {
        modal.style.display = "none";
    }

    window.onclick = function(event){
        if(event.target == modal) {
            modal.style.display = "none";
        }
    }
}

function fetchAndDrawBallot() {
    // console.log('fetching');
    let candidateNames = fetch(endpoint['candidates'])
    .then(res => res.json())
    .then(result => {
        makeAList("candidateList", result, "name", recordVoterAndVote);
    })
}
function recordVoterAndVote() {
    voterPackage.candidate = this.id;
    let updateBallot = fetch(endpoint['voters'], {
        method: 'PUT', 
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(voterPackage)
    })
    .then(response => response.json())
    .then((result) => {
        console.log('Vote recorded:', result);
        fetchAndListVoters();
        // fetchAndListCandidates(false);
        loadContent(viewType['home']); // Return to home view
    })
    .catch(error => {
        console.error('Error recording vote:', error);
    });
}
