///////////////////////////////////////////////
// Member
// Basic object that holds information regarding
// employees and how to interact with them.
///////////////////////////////////////////////
var Member = function(name, department, slackId, gCalId, trelloId){
    this.name = name;
    this.department = department;
    this.slackId = slackId;
    this.trelloId = trelloId;
    this.gCalId = gCalId;

  ///////////////////////////////////////////////
  // Send Slack (text to send)
  // Send a slack message to this member
  ///////////////////////////////////////////////
  this.sendSlack = function(text){
     var slack = new Slack();
     slack.send(text, slackId);
  }

}

///////////////////////////////////////////////
// Members
// Object that holds an array of members read
// in from the sheet. The function is expecting
// a sheet called "Members" with the data as
// follows: (Name, Department, Slack ID, Google Cal Id,
// Trello ID, ISR, Email).
///////////////////////////////////////////////
var Members = function() {
  //Constructor
  this.members = [];
  this.isrs = [];
  this.isrChannel = '---Slack Id of Group Chat---'; // This is for future versions and is not currently used

  ///////////////////////////////////////////////
  // Initiate members
  // This function will pull the data off the
  // sheet with the members information
  ///////////////////////////////////////////////
  var sheet = SpreadsheetApp.getActive().getSheetByName("Members");
  var data = sheet.getRange(2, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  for(var i = 0; i < data.length; i++){
    var newMem = new Member(data[i][0],data[i][1], data[i][2], data[i][3], data[i][4]);
    this.members.push(newMem);
    if(data[i][5]){
     this.isrs.push(newMem);
    }
  }

  ///////////////////////////////////////////////
  // Find (members name to find)
  // Search through the list of members and
  // return a member if one is found with that
  // exact name
  ///////////////////////////////////////////////
  this.find = function(name){
    for(var i = 0; i < this.members.length; i++) {
       if (this.members[i].name == name) {
           return this.members[i];
       }
     }
     return null;
  }

  ///////////////////////////////////////////////
  // SlackIsr (text to send)
  // Sends a slack message to the group channel
  // with the text passed to the function
  ///////////////////////////////////////////////
  this.slackIsr = function(text){
    var slack = new Slack(text, this.isrChannel);
    slack.send();
  }

}




///////////////////////////////////////////////
// Test Members
// Make sure the data is read and send a test
// slack message
///////////////////////////////////////////////
function testMembers(){
  var members = new Members();
  members.find("---Name of test member (guinne pig)--").sendSlack("howdy, in case you wanted to know this function is working");
}
