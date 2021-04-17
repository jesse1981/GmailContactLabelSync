/* GmailContactLabelSync G-apps script
   Jesse Bryant, 2021
 
   Original Author:
   GmailContactGroupLabels G-apps script
   t.hirschbuechler, 2017
   
   may appear in your gmail account activity (run by a 10.*.*.*	address, corresponding to an internal google-server)
*/  
function createNestedGmailLabel(name) {
  var labels = name.split("/");
  var gmail, label = "";

  for (var i=0; i<labels.length; i++) {

      if (labels[i] !== "") {
        label = label + ((i===0) ? "" : "/") + labels[i];
        gmail = GmailApp.getUserLabelByName(label) ?
                    GmailApp.getUserLabelByName(label) : GmailApp.createLabel(label);
    }
  }

  return gmail;

}

function applyGroupLabels()	{
  // Variables
  var threadMax = 20;
  var threadOffset = 0
  var parentLabel = "GmailContactLabel"

  // Get all labels and their contacts
  var contacts = {};
  var labels = ContactsApp.getContactGroups();
  for (var l in labels) {
    label = labels[l].getName();
    console.log(label);
    let groupContacts = ContactsApp.getContactGroup(label).getContacts();
    let emails = [];
    for (var i in groupContacts) {
      if (label.indexOf("My Contacts")>-1) continue;
      try {
        let EmailField = groupContacts[i].getEmails()
        for (var j in EmailField){
          //console.log(EmailField[j].getAddress())
          emails.push(EmailField[j].getAddress());
        }
        label = label.replace("System Group: ","");
        contacts[label] = emails;
        createNestedGmailLabel(parentLabel + "/" + label);
      }
      catch (err) {
        console.log("Caught:",err)
      }
      
    }
  }

  while (true) {
    var threadAll = true;
    for (var label in contacts) {
      if (contacts[label].length) console.log("Processing:",label)
      else { console.log("Skipping"); continue; }

      var gmailLabel = GmailApp.getUserLabelByName(parentLabel + "/" + label);
      var emailString = contacts[label].join(' OR ');
      var searchString = 'from:(' + emailString + ') OR to:(' + emailString + ')'
      console.log(searchString)

      var threads = GmailApp.search(searchString,threadOffset,threadMax)
      for (var x in threads) threads[x].addLabel(gmailLabel);

      console.log("Processed",threads.length,"threads")
      if (threads.length == threadMax) threadAll = false;
    }
    if (threadAll) break;
    else threadOffset += threadMax;
  }
  
  
}// applyGroupLabel