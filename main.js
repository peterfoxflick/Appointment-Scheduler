////////////////////////////////////////////////
// This file acts as a main controller for the
// entire programs. All functions that run
// on a trigger are stored here.
///////////////////////////////////////////////



////////////////////////////////////////////////
// This will update the sheets with the new days
// appointments
///////////////////////////////////////////////
function eveningGetCourses() {
  Logger.log("Getting Sheets");
  // Initalize Sheets
  var spread = SpreadsheetApp.openById('---Spreadsheet Id---');
  var tomorrowSheet = new AptSheet(spread.getSheetByName('Tomorrow'));
  var todaySheet = new AptSheet(spread.getSheetByName('Today'));

  Logger.log("Setting dates");

  // Initialize Dates
  var now = new Date();
  var oneDay = new Date(now.getTime() + ( 1 * 1 * 24 * 60 * 60 * 1000));
  var twoDays = new Date(now.getTime() + ( 1 * 2 * 24 * 60 * 60 * 1000));
  var members = new Members();

  Logger.log("Populating appointments");

  // Populate Appointments
  var tomorrowAppt = new Appointments();
  tomorrowAppt.addFromDate(oneDay, twoDays);
  var todayAppt = new Appointments();
  todayAppt.addFromSheet(tomorrowSheet.sheet, members);

  Logger.log("Writing to sheets");

  // Write Appointments to sheets
  todaySheet.writeAppts(todayAppt);
  tomorrowSheet.writeAppts(tomorrowAppt);


  var slack = new Slack();
  slack.send("Peter Ive updated the sheet", members.find("---Name of team lead---").slackId);
}


///////////////////////////////////////////////
// Morning report
// Send everyone their appointments for the day
///////////////////////////////////////////////
function morningReport(){
  var spread = SpreadsheetApp.openById('---Spreadsheet Id---');
  var todaySheet = new AptSheet(spread.getSheetByName('Today'));
  var members = new Members();

  var todayAppt = new Appointments();
  todayAppt.addFromSheet(todaySheet.sheet, members);

  todayAppt.sendMorningReport();
}

//////////////////////////////////////////
// This will add members to appointmets
//////////////////////////////////////////
function onEdit(e){
  var range = e.range;
  var col = range.getColumn();
  var row = range.getRow();
  var sheetName = range.getSheet().getName();

  if(col == 1 && (sheetName == "Today" || sheetName == "Tomorrow")) {
    var members = new Members();
    var newMem = members.find(e.value);
    var oldMem = members.find(e.oldValue);

    var rowData = SpreadsheetApp.getActiveSheet().getRange(row, col, 1, 8).getValues()[0];

    var appt = new Appointment(rowData[6], rowData[5], null, null, rowData[2]);
    appt.remindId = rowData[7];

    // Update status on sheet based off invitation
    if(appt.changeMember(oldMem, newMem)){
      appt.updateStatus();
      var emj = appt.getEmojiStatus();
      SpreadsheetApp.getActiveSheet().getRange(row, 2).setValue(emj);
    } else {
      // If no knew memeber was added, reset to blank cell
      SpreadsheetApp.getActiveSheet().getRange(row, 2).setValue("");
    }

    // Update slack reminder
    var remindId = appt.changeReminder(newMem);
    SpreadsheetApp.getActiveSheet().getRange(row, 8).setValue(remindId);

  }
}



/////////////////////////////////////////////
// Periodical update on appointments
// This will check for appointments getting
// deleted and user status
//////////////////////////////////////////////
function updateAppointments(){
 // Initalize Sheets
  var spread = SpreadsheetApp.openById('---Spreadsheet Id---');
  var tomorrowSheet = new AptSheet(spread.getSheetByName('Tomorrow'));
  var todaySheet = new AptSheet(spread.getSheetByName('Today'));

  // Initialize Dates
  var members = new Members();


  try {
    // Populate Appointments
    var tomorrowAppt = new Appointments();
    tomorrowAppt.addFromSheet(tomorrowSheet.sheet, members);
    var todayAppt = new Appointments();
    todayAppt.addFromSheet(todaySheet.sheet, members);

    //These are now done as part of the addFromSheet function
      // Update to remove deleted appointments
      //tomorrowAppt.checkAppointments();
      //todayAppt.checkAppointments();

      // Update status on invites
      //tomorrowAppt.updateStatus();
      //todayAppt.updateStatus();

    // Write Appointments to sheets
    todaySheet.writeAppts(todayAppt);
    tomorrowSheet.writeAppts(tomorrowAppt);
  } catch (e) {
    toast('Sorry something bad happend. Please be patient as we work out the issue.');
    console.error('updateAppointments() yielded an error: ' + e);
  }
}




/////////////////////////////////////////////
// This function serve to log the Id's of
// events and is used for debuging and testing
//////////////////////////////////////////////
function getIdsOfEvents(){

  var now = new Date();
  var oneDay = new Date(now.getTime() + ( 1 * 1 * 24 * 60 * 60 * 1000));
  var twoDays = new Date(now.getTime() + ( 1 * 2 * 24 * 60 * 60 * 1000));
  var cal = CalendarApp.getCalendarById("---Calendard Id---");
    var events = cal.getEvents(now, twoDays);

    for(var i = 0; i < events.length; i++){
      Logger.log(events[i].getTitle() + " ID: " + events[i].getId() );
    }
}
