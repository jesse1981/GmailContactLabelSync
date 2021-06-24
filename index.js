/* GmailContactLabelSync G-apps script
   Jesse Bryant, 2021
 
   Original Author:
   GmailContactGroupLabels G-apps script
   t.hirschbuechler, 2017
   
   may appear in your gmail account activity (run by a 10.*.*.*	address, corresponding to an internal google-server)
*/  
function createNestedGmailLabel(name) {
  if (!name) return false;
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
function getAllGroups(nextPageToken) {
  var groups = [];
  var options = {}
  if (nextPageToken) options.pageToken = nextPageToken;
  var g = People.ContactGroups.list(options);
  
  if (g.contactGroups) groups = groups.concat(g.contactGroups)
  if (g.nextPageToken) groups = groups.concat(getAllGroups(g.nextPageToken))
  return groups;
}
function getAllPeople(nextPageToken) {
  var peopleList = [];
  var options = {
    personFields: "names,emailAddresses,memberships"
  }
  if (nextPageToken) options.pageToken = nextPageToken;
  var g = People.People.Connections.list('people/me',options)

  if (g.connections) peopleList = peopleList.concat(g.connections)
  if (g.nextPageToken) peopleList = peopleList.concat(getAllPeople(g.nextPageToken))
  return peopleList;
}

function applyGroupLabels()	{
  // Variables
  var threadMax = 20;
  var threadOffset = 0
  var parentLabel = "GmailContactLabel";

  var contacts = getAllGroups();
  var allPeople = getAllPeople();

  for (var l in contacts) {
    contacts[l].emails = []

    var res = contacts[l].resourceName;
    
    for (var x in allPeople) {
      for (var y in allPeople[x].memberships) {
        if (allPeople[x].memberships[y].contactGroupMembership.contactGroupResourceName == res) {
          for (var z in allPeople[x].emailAddresses) contacts[l].emails.push(allPeople[x].emailAddresses[z].value);
        }
      }
    }
  }

  while (Object.keys(contacts).length>0) {
    for (var c in contacts) {
      var label = contacts[c].formattedName;
      if (label == "Starred" || label == "My Contacts") { console.log("Skipping",label); delete contacts[c]; continue; }
      if (contacts[c].emails.length) console.log("Processing:",label)
      else { console.log("Skipping",label); delete contacts[c]; continue; }

      var gmailLabel = GmailApp.getUserLabelByName(parentLabel + "/" + label);
      var emailString = contacts[c].emails.join(' OR ');
      var searchString = '(from:(' + emailString + ') OR to:(' + emailString + ')) AND NOT label:'+parentLabel+"/"+label
      console.log(searchString)

      var threads = GmailApp.search(searchString,threadOffset,threadMax)
      for (var x in threads) threads[x].addLabel(gmailLabel);

      console.log("Processed",threads.length,"threads")
      if (threads.length < threadMax) delete contacts[c];
    }
  }
}
