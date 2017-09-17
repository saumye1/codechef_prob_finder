var request     = require('request');
var html2json   = require('html2json').html2json;
var rp          = require('request-promise');
var Promise     = require('bluebird');
var constants   = require('./constants');

var userHandles = process.argv;
userHandles.splice(0, 2);

if (Array.isArray(userHandles) && userHandles.length < 2){
    console.log(constants.invalidCommand.PARAMETER_MISSING);
    process.exit(0);
}
if (userHandles.length > 10){
    console.log(constants.invalidCommand.TOO_MANY_HANDLES);
    process.exit(0);
}

Promise.coroutine(function *(){
    var profileLinks = [];
    profileLinks = getAllProfileLinksFromHandles(userHandles);
    var profileInfo = [];
    var profilesCount = profileLinks.length;
    for (var i = 0 ; i < profilesCount ; i ++){
        var url = profileLinks[i];
        var options = {
            uri : url,
            method : 'GET'
        };
        var profileInfoUser = yield requestCodechefForProfiles(options);
        profileInfo.push(profileInfoUser);
    }
    for (var i = 0 ; i < profileInfo.length ; i ++){
        profileInfo[i] = profileInfo[i].toString();
        var idxProblemsSection = profileInfo[i].indexOf("Problems Solved") + "Problems Solved</h3>".length;
        var endingProblemSection = findNextClosingDivTag(profileInfo[i], idxProblemsSection);
        if (idxProblemsSection < 0 || endingProblemSection < 0){
            yield new Promise((resolve, reject) => {
                reject(new Error(constants.profile.NO_DATA_FOUND));
            })
        }
        var requiredSectionLen = endingProblemSection + "</div>".length - idxProblemsSection;
        profileInfo[i] = profileInfo[i].substr(idxProblemsSection, requiredSectionLen);
    }
    var parsedProfiles = [];
    for (var i = 0 ; i < profileInfo.length ; i ++){
        parsedProfiles.push(html2json(profileInfo[i]));
    }
    
    var questionCodesOfUsers = extractQuestionCodes(parsedProfiles);

    //at this point the questions by firdt user and second user are in questionCodesOfUsers
    for (var i = 0 ; i < questionCodesOfUsers.length ; i ++){
        if (i == 0){
            console.log("Number of Problems done by you :", questionCodesOfUsers[i].length);
        }
        else{
            console.log("Number of Problems done by other(s) :", questionCodesOfUsers[i].length);
        }
    }
    var questionsByYou = {};
    var questionsByYouArr = questionCodesOfUsers[0];
    var questionsByYouArrLen = questionsByYouArr.length;
    for (var i = 0 ; i < questionsByYouArrLen ; i ++){
        questionsByYou[questionsByYouArr[i]] = i;
    }

    var toDoQuestions = [];    
    for (var i = 1 ; i < questionCodesOfUsers.length ; i ++){
        var questionsByOthersArr = questionCodesOfUsers[i];
        var questionsByOthersArrLen = questionsByOthersArr.length;
        for (var j = 0 ; j < questionsByOthersArrLen ; j ++){
            if (!questionsByYou.hasOwnProperty(questionsByOthersArr[j]) && toDoQuestions.indexOf(questionsByOthersArr[j]) == -1 ){
                toDoQuestions.push(questionsByOthersArr[j]);
            }
        }
    }
    console.log("Total questions that other(s) have done but you haven't : ", toDoQuestions.length);
    if (toDoQuestions.length > 0){
        console.log("Following are the links to the problems that you can do :::::");
        for (var i = 0 ; i < toDoQuestions.length ; i ++){
            console.log(makeProblemLink(toDoQuestions[i]));
        }
    }
})()
.catch(err => {
    console.log(">>>>>>> Error:", (err && err.message) ? err.message : err);
})

function requestCodechefForProfiles(options){
    return new Promise((resolve, reject) => {
        rp(options).then(result => {
            resolve(result);
        }).catch(err => {
            reject(new Error(constants.invalidCommand.HANDLE_NOT_FOUND));
        })
    })
}

function extractQuestionCodes(parsedProfiles){
    var questionCodesOfUsers = [];
    for (var i = 0 ; i < parsedProfiles.length ; i ++){
        questionCodesOfUsers.push([]);
    }
    
    for (var i = 0 ; i < parsedProfiles.length ; i ++){
        if (parsedProfiles[i].child && parsedProfiles[i].child.length > 1 && parsedProfiles[i].child[1]){
            var questions = parsedProfiles[i].child[1].child;
            var questionsLen = questions.length;
            for (var j = 0 ; j < questionsLen ; j ++){
                if (questions[j].child){
                    for (var k = 0 ; k < questions[j].child.length ; k ++){
                        if (questions[j].child[k].child){
                            var quesCodes = questions[j].child[k].child;
                            for (var l = 0 ; l < quesCodes.length ; l ++){
                                if (quesCodes[l].node && quesCodes[l].attr){
                                    var quesCode = quesCodes[l].child[0].text;
                                    if (i < questionCodesOfUsers.length){
                                        questionCodesOfUsers[i].push(quesCode);                                    
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return questionCodesOfUsers;
}

function findNextClosingDivTag(htmlDoc, idx){
    var htmlDocLen = htmlDoc.length;
    for (var i = idx ; i < htmlDocLen ; i ++){
        if (htmlDoc.substr(i, "</div>".length) == "</div>"){
            return i;
        }
    }
    return -1;
}

function getAllProfileLinksFromHandles(userHandles){
    if (!Array.isArray(userHandles) || userHandles.length == 0){
        return [];
    }
    var links = [];
    var userHandlesLen = userHandles.length;
    for (var i = 0 ; i < userHandlesLen ; i ++){
        links.push(makeProfileAccessLink(userHandles[i]));
    }
    return links;
}

function makeProfileAccessLink(codechefHandle){
    return 'https://www.codechef.com/users/' + codechefHandle.trim();
}

function makeProblemLink(toDoQuestion){
    return "https://www.codechef.com/problems/" + toDoQuestion;
}