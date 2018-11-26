///////////////////////////////////////////////
// Appointment
// Object that holds information regarding an
// appointment and some basic functions to
// interact with it.
///////////////////////////////////////////////
var Appointment = function(id, title, startTime, endTime, department){
  this.id = id;
  this.title = title;
  this.startTime =  startTime != null ? new Date(startTime) : CalendarApp.getCalendarById("---Calendar Id---").getEventById(this.id).getStartTime();
  this.endTime = endTime != null ? new Date(endTime) : CalendarApp.getCalendarById("---Calendar Id---").getEventById(this.id).getEndTime();
  this.department = department
  this.mem = null;
  this.status = null;
  this.remindId = null;

  ///////////////////////////////////////////////
  // Check Status
  // Check to see if the designated member has
  // accepted the appointment invatation
  ///////////////////////////////////////////////
  this.checkStatus = function(){
    Logger.log(this.id);
    var event = CalendarApp.getEventById(this.id);
    if(this.mem.gCalId) {
      var guest = event.getGuestByEmail(this.mem.gCalId);
      if(guest){
        this.status = guest.getGuestStatus();
      }
    }
  }

  this.addMem = function(){
    var event = CalendarApp.getCalendarById("---Calendar Id---").getEventById(this.id);
    event.addGuest(this.mem.gCalId);
  }

  this.addMem = function(mem){
    this.mem = mem;
    var event = CalendarApp.getCalendarById("---Calendar Id---").getEventById(this.id);
    event.addGuest(this.mem.gCalId);
  }

  /////////////////////////////////////////
  // Changes member on google calendar
  // and returns true is sucessfull
  /////////////////////////////////////////
  this.changeMember = function(oldMem, newMem){
    var event = CalendarApp.getCalendarById("---Calednar id---").getEventById(this.id);
    if(event){
      if(oldMem && oldMem.gCalId){
        event.removeGuest(oldMem.gCalId);
      }

      if(newMem && newMem.gCalId){
        event.addGuest(newMem.gCalId);
        this.mem = newMem;
        return true;
      }
    }
  }

  /////////////////////////////////////////
  // Check if an appointment still exists
  /////////////////////////////////////////
  this.isValid = function(){
    var event = CalendarApp.getCalendarById("---Calendar Id---").getEventById(this.id);
    if(event){
      return true;
    }
    return false;
  }

  /////////////////////////////////////////
  // Update the status of an appointments
  // invite
  /////////////////////////////////////////
  this.updateStatus = function(){
    var event = CalendarApp.getCalendarById("---Calendar Id---").getEventById(this.id);
    if(this.mem){
      var guest = event.getGuestByEmail(this.mem.gCalId);
      if(guest){
        this.status = event.getGuestByEmail(this.mem.gCalId).getGuestStatus();
      }
    }
  }

  /////////////////////////////////////////
  // Update the status of an appointments
  // invite
  /////////////////////////////////////////
  this.getEmojiStatus = function(){
    var stat = this.status;
    if(stat == "YES"){
      stat = '✔️';
    } else if (stat == "INVITED"){
      stat = '📫';
    } else if (stat == "NO"){
      stat = '❌';
    }

    return stat;

  }


  /////////////////////////////////////////
  // Changes slack reminder to be new user
  /////////////////////////////////////////
  this.changeReminder = function(newMem){
    var slack = new Slack();
    Logger.log("Change reminder called");
    Logger.log("reminder id: " + this.remindId);
      if(this.remindId){
        Logger.log("About to remove reminder");
        slack.removeReminder(this.remindId);
      }

      if(newMem && newMem.slackId){
        Logger.log("About to add new reminder");
        var id = slack.addReminder(newMem.slackId, this.startTime, this.title);
        this.remindId = id;
        return this.remindId;
      }

      return null;
    }

  /////////////////////////////////////////
  // Return the time of the appointment
  // in Hr:Min form
  /////////////////////////////////////////
  this.getTime = function(getStart){
    if(getStart){
      var min = this.startTime.getMinutes();
      if(min == "0"){
        min = "00";
      }
      return this.startTime.getHours() + ":" + min;

    } else {
      var min = this.endTime.getMinutes();
      if(min == "0"){
        min = "00";
      }
      return this.endTime.getHours() + ":" + min;
    }
  }

  /////////////////////////////////////////
  // Update the time based off the id of
  // the event
  /////////////////////////////////////////
  this.updateTime = function(){
    if(this.isValid()){
       this.startTime = CalendarApp.getCalendarById("---Calendar Id---").getEventById(this.id).getStartTime();
       this.endTime = CalendarApp.getCalendarById("---Calendar Id---").getEventById(this.id).getEndTime();

    }
  }

}


var Appointments = function(){
  this.appts = [];

  //Add Appointments from specific time range
  this.addFromDate = function(startTime, endTime){
    var cal = CalendarApp.getCalendarById("---Calendar Id---");
    var events = cal.getEvents(startTime, endTime);

    for(var i = 0; i < events.length; i++){
      var event = events[i];
      var desc = event.getDescription();
      var index = desc.indexOf("College:");
      var department = "Unknown";
      if(index > 0){
        var endIndex = desc.substring(index).indexOf("\n");
        department = desc.substring(index + 9,endIndex + index);
      }
      var newAppt = new Appointment(event.getId(), event.getTitle(), event.getStartTime(), event.getEndTime(), department);
      this.appts.push(newAppt);
    }
   }

   //Add appointments from sheet
   this.addFromSheet = function(sheet, members){
     // Subtract 1 row because you dont load in the header row
     if(sheet.getLastRow() > 1){
       Logger.log("Has Enough Rows");
       var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
       for(var i = 0; i < data.length; i++){
        var event = CalendarApp.getCalendarById("---Calendar Id---").getEventById(data[i][6]);
        if(event){
          Logger.log(i + " " + event.getTitle());
          var newAppt = new Appointment(data[i][6], event.getTitle(), event.getStartTime(), event.getEndTime(), data[i][2]);
          //add member
          var mem = members.find(data[i][0]);
          newAppt.mem = mem;

          //Add slack reminder
          newAppt.remindId = data[i][7];

          //Update status
          newAppt.updateStatus();

          this.appts.push(newAppt);
        }
       }
     } else {
       Logger.log("Sheet is too short to add");
     }
   }

  ///////////////////////////////////////////
  // Check if appoinments are still valid
  // or if they have been canceled
  ///////////////////////////////////////////
  this.checkAppointments = function(){
    // Get list of active appointments
    var activeAppts = this.appts.filter(function(appt) {
       return appt.isValid();
    });

    // Set appts to list of active appointments
    this.appts = activeAppts;
  }


  /////////////////////////////////////////
  // Update the status of appointments
  // invites
  /////////////////////////////////////////
  this.updateStatus = function(){
    for(var i = 0; i < this.appts.length; i++){
      this.appts[i].updateStatus();
    }
  }

  this.sendMorningReport = function(){
    var messages = [];

    for(var i = 0; i < this.appts.length; i++){
      var appt = this.appts[i];

      if(appt.mem){
        var index = -1;

        for(var j = 0; j < messages.length; j++){
          if(messages[j].slackId == appt.mem.slackId){
            index = j;
            break;
          }
        }

        if(index == -1){
           var slackId = appt.mem.slackId;
           var text = "Your appointment(s) for the day: \n";

           text += appt.getTime();

           text += " with " + appt.title.substring(0, appt.title.indexOf(":")) + "\n";

           var mes = new Message(slackId, text);
           messages.push(mes)
        } else {
          var text = appt.startTime.getHours() + ":" + appt.startTime.getMinutes();
          text += " with " + appt.title.substring(0, appt.title.indexOf(":")) + "\n";
          messages[index].append(text);

        }
      }
    }

    for(var i = 0; i < messages.length; i++){
      messages[i].send();
    }
  }


  //Member Functions
  this.log = function(){
    for(var i = 0; i < this.appts.length; i++){
      Logger.log(this.appts[i].title);
    }
  }



}

function testRows(){

 var spread = SpreadsheetApp.openById('---Spreadsheet Id---');
 var sheets = spread.getSheets();

 for(var i = 0; i < sheets.length; i++){
   Logger.log(sheets[i].getLastRow() + " " + sheets[i].getName());

 }



}

function testAppointments(){
  var now = new Date();
  var oneDay = new Date(now.getTime() + ( 1 * 1 * 24 * 60 * 60 * 1000));
  var twoDays = new Date(now.getTime() + ( 1 * 2 * 24 * 60 * 60 * 1000));
  var members = new Members();
  var appts = new Appointments();
  //appts.addFromDate(oneDay, twoDays);
  var sheet = SpreadsheetApp.openById('---Spreadsheet Id---').getSheetByName("Today");
  appts.addFromSheet(sheet, members);
  appts.log();

  var id = appts.appts[0].changeReminder(members.find("--Test members name---"));
  Logger.log(id);
}
