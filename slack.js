///////////////////////////////////////////////
// Slack
// Object containing the functions to send
// slack messages and add reminders
///////////////////////////////////////////////
var Slack = function () {
    this.bot = '---Bot ID---';
    this.token = '---Slack Token---';

    ///////////////////////////////////////////////
    // Send (text to send, channel to send to)
    // Send a slack message to the intended channel
    ///////////////////////////////////////////////
    this.send = function(text, channel){
      var params = {
       'channel': channel,
       'bot': this.bot,
       'token': this.token,
       'text': text
      }

      var str = "";
      for (var key in params) {
          if (str != "") {
              str += "&";
          }
          str += key + "=" + encodeURIComponent(params[key]);
      }

      var url = 'https://slack.com/api/chat.postMessage?' + str;

      var resp = UrlFetchApp.fetch(url);
    }

    ///////////////////////////////////////////////
    // Add Reminder (Id of member to remind, Time of event, Title of event)
    // Set up a reminder for an appointment
    ///////////////////////////////////////////////
    this.addReminder = function(slackId, time, title) {
      //Check to see if the event is past
      var now = new Date();
      if(now < time){
        Logger.log("Event is in the future");
        //Grab the instructors name from the title
        var instructor =  title.substring(0, title.indexOf(":"));
        var min = time.getMinutes();
        if(min == "0"){
          min = "00";
        }
        var timeStr = time.getHours() + ":" + min;

        //Set up the remind time to be 15 min before the event
        var remindTime = new Date(time - 900000);
        min = remindTime.getMinutes();
          if(min == "0"){
            min = "00";
          }
        var remindTime = remindTime.getHours() + ":" + min;

        //If the event is tomorrow make sure to let slack know
        var tomorrow = new Date(now.getYear(), now.getMonth(), now.getDate() + 1);
        if(time > tomorrow){
          remindTime = "Tomorrow at " + remindTime;
        }


        var mesg = 'You have an appointment in 15 min at ' + timeStr + ' with ' + instructor;

        //Send Api Request
        var params = {
          'user': slackId,
          'bot': this.bot,
          'token': this.token,
          'text': mesg,
          'time': remindTime,
        }

        var str = "";
        for (var key in params) {
          if (str != "") {
            str += "&";
          }
          str += key + "=" + encodeURIComponent(params[key]);
        }

        var url = 'https://slack.com/api/reminders.add?' + str;
        Logger.log(url);
        var resp = UrlFetchApp.fetch(url);
        var data = JSON.parse(resp.getContentText());

        Logger.log(data);
        return data.reminder.id;
        } else {
        return null;
      }

    }

    ///////////////////////////////////////////////
    // Remove Reminder (Id of reminder)
    // Delete a reminder from slack
    ///////////////////////////////////////////////
    this.removeReminder = function(id){
      var params = {
           'reminder': id,
           'token': this.token,
         }

         var str = "";
          for (var key in params) {
              if (str != "") {
                  str += "&";
              }
              str += key + "=" + encodeURIComponent(params[key]);
          }

        var url = 'https://slack.com/api/reminders.delete?' + str;

        var resp = UrlFetchApp.fetch(url);
      }
}
