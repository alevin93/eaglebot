const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const cron = require("node-cron");
require("dotenv/config");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on("ready", () => {
  console.log("FloppaBot Activated");
  startUp();
});

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

slayer_id = '209141852849307649';
var weekCounter = 0;
const prefix = "!";
var gmUpdated = null;
var lastUpdate = null;
var startingAmount = 1;
var splitFlag = false;
var participants = [];
var gangMemberLink =
  "https://stats.olympus-entertainment.com/api/v3.0/players/?player_ids=";

// -------------- CRON JOBS ------------- //

//end of week jobs
cron.schedule("30 * 0 * * 1", () => {
  archiveStats();
  recordWeekStats();
})

cron.schedule("0 */5 * * * *", () => {
  writeGangInfo();
});

cron.schedule("5 */10 * * * * ", () => {
  writeGangMemberInfo().then(() => {
    updateAllStats();
    console.log('Stats have been updated!');
  });
});

// ---------- MAIN FUNCTION ----------- //
client.on("messageCreate", (message) => {

  const args = message.content.slice(prefix.length).split("/ +/");
  const temp = args.shift().toLowerCase();
  const command = temp.split(" ")

  if (command[0] === "check") {
    archiveStats();
  }
  if (command[0] === "caps") {
    getCaps(message);
  }
  if (command[0] === "floppa") {
    floppaImg(message);
  }
  if (command[0] === "help") {
    helpMessage(message);
  }
  if (command[0] === "gang") {
    gangEmbed(message);
  }
  if (command[0] === "stats") {
    if(command[2]) {
      editTracked(message, command[1], command[2]);
    }
    else if(command[1]) {
      getMemberStats(message, command[1])
    } 
    else {
      getWeeklyStats(message);
    }
  }
  if (command[0] === "last") {
    getLastWeekStats(message);
  }
  if (command[0] === "record" || command[0] === "records") {
    getRecordStats(message);
  }
  if (command[0] === "startcap") {
    startCartel(message);
  }
  if (command[0] === "endcap") {
    endCartel(message);
  }
  // if (command[0] === "iron") {
  //   if(command[1]) {
  //     checkMemberLedger(message, command[1]);
  //   }
  //   else {
  //     checkIronLedger(message);
  //   }
  // }
  if (command[0] === "test") {
    writeGangMemberInfo();
  }
  if (command[0] === "fetch"){
    writeGangInfo();
   }
  if (command[0] === "update"){
    weekCounter++;
    updateAllStats();
  }
});

//----------- GANG FUNCTION ------------ //
const gangEmbed = (message) => {
  let gangInfoFile = require('./gangInfo.json');
  const statsEmbed = new EmbedBuilder()
    .setTitle("Comp Or Ban")
    .setThumbnail("https://i.imgur.com/BHLmQck.jpeg")
    .setURL("https://stats.olympus-entertainment.com/#/stats/gangs/25546")
    .addFields(
      { name: "Gang Funds", value: `${formatter.format(gangInfoFile.bank)}`, inline: true },
      {
        name: "War Kills",
        value: `${gangInfoFile.kills}`,
        inline: true,
      },
      {
        name: "War Deaths",
        value: `${gangInfoFile.deaths}`,
        inline: true,
      }
    )
    .setFooter({ text: "The iron mines must be protected" });
  message.channel.send({ embeds: [statsEmbed] });
};

//----------- HELP FUNCTION ------------ //
const helpMessage = (message) => {
  const helpEmbed = new EmbedBuilder()
    .setTitle("Floppa Info")
    .setDescription("FloppaBot v1, developed by Crux & Nman.")
    .setThumbnail(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Big_Floppa_and_Justin_2_%28cropped%29.jpg/1024px-Big_Floppa_and_Justin_2_%28cropped%29.jpg"
    )
    .addFields(
      { name: "!gang", value: "Returns information on the gang." },
      {
        name: "!caps",
        value:
          "Displays cartel status, which gang owns them, and what percentage they hold.",
      },
      {
        name: "!startcap",
        value:
          "Starts recording gang funds. React with the 👍 to the user who started the cap process to enter your split. ",
      },
      {
        name: "!endcap",
        value:
          "Calculates split of gang funds based on number of members who reacted to the !startcap message, automatically accounting for cartels tax.",
      }
    )
    .setFooter({
      text: "Please submit bug reports to Nman#3327 on discord, or tag @FloppaDev",
    });
  message.author.send({ embeds: [helpEmbed] });
};

// --------- POST STATS FUNCTIONS ---------//

const getWeeklyStats = (message) => {
  json = require('./weeklyLeaders.json');
  tracked = require('./trackedStats.json');
  //building fields
  fields = []
  counter = 0;
  for(let i = 0; i < tracked.length; i++) {
    if(!json[tracked[i]]) { continue; }
    fields[i] = {
      name: `${tracked[i].toUpperCase().replace('_',' ')}`,
      value: `${json[tracked[i]].name}` + '```' +  `${tracked[i] === 'bank'? formatter.format(json[tracked[i]].value) : json[tracked[i]].value}` + '```',
      inline: true
    }
  }
  const weeklyStatsEmbed = new EmbedBuilder()
    .setTitle("Daily Stats")
    .addFields(fields)
    .setColor(0x591017)
    .setFooter({
      text: `Last Update: ${lastUpdate}`,
    });
  console.log("Get Weekly Stats Run.");
  message.channel.send({ embeds: [weeklyStatsEmbed] });
};

const getLastWeekStats = (message) => {
  json = require('./lastWeekLeaders.json');
  tracked = require('./trackedStats.json');
  //building fields
  fields = []
  for(let i = 0; i < tracked.length; i++) {
    fields[i] = {
      name: `${tracked[i].toUpperCase().replace('_',' ')}`,
      value: `${json[tracked[i]].name}` + '```' +  `${tracked[i] === 'bank'? formatter.format(json[tracked[i]].value) : json[tracked[i]].value}` + '```',
      inline: true
    }
  }
  const weeklyStatsEmbed = new EmbedBuilder()
    .setTitle("Daily Stats")
    .addFields(fields)
    .setColor(0x591017)
    .setFooter({
      text: `Last Update: ${lastUpdate}`,
    });
  message.channel.send({ embeds: [weeklyStatsEmbed] });
};

const getRecordStats = (message) => {
  json = require('./weeklyLeaders.json');
  tracked = require('./trackedStats.json');
  records = require('./recordsArchive.json');
  //building fields
  fields = []
  counter = 0;
  for(let i = 0; i < tracked.length; i++) {
    if(!json[tracked[i]].holder || !json[tracked[i].value]) { continue; }
    fields[i] = {
      name: `${tracked[i].toUpperCase().replace('_',' ')}`,
      value: `${json[tracked[i]].holder}` + '```' +  `${tracked[i] === 'bank'? formatter.format(json[tracked[i]].record) : json[tracked[i]].record}` + '```',
      inline: true
    }
  }
  const weeklyStatsEmbed = new EmbedBuilder()
    .setTitle("One Week Highs")
    .addFields(fields)
    .setColor(0x591017)
    .setFooter({
      text: `Last Update: ${lastUpdate}`,
    });
  message.channel.send({ embeds: [weeklyStatsEmbed] });
};

const getMemberStats = (message, command) => {
  json = require('./memberStats.json');
  tracked = require('./trackedStats.json');
  var index = null;
  for(let i = 0; i < json.length; i++) {
    if(!json[i]) { continue; }
    if(json[i].name.toLowerCase() === command) {
      index = i;
    }
  }
  //building fields
  fields = []
  counter = 0;
  if(index === null) { message.channel.send("No player by that name found.  Make sure you have it exactly right!"); return; }
  for(let i = 0; i < tracked.length; i++) {
    if(!json[index].data) { continue; }
    fields[i] = {
      name: `${tracked[i].toUpperCase().replace('_',' ')}`,
      value: '```' + `${tracked[i] === 'bank'? formatter.format(json[index].data[tracked[i]]) : json[index].data[tracked[i]]}` + '```',
      inline: true
    }
  }
  console.log(fields);
  const weeklyStatsEmbed = new EmbedBuilder()
    .setTitle(`${json[index].name}'s Weekly Stats`)
    .addFields(fields)
    .setColor(0x591017)
    .setFooter({
      text: `Last Update: ${lastUpdate}`,
    });
  message.channel.send({ embeds: [weeklyStatsEmbed] });
}

const editTracked = (message, command, stat) => {
  if(message.author.id === '288445122947973121' || message.author.id === slayer_id) {
    const gangMemberFile = require('./gangMembers.json')
    var statList = []
    for(let i = 0; i < Object.keys(gangMemberFile[0]).length; i++) {
      statList[i] = Object.keys(gangMemberFile[0])[i]
    }
    for(let i = 0; i < Object.keys(gangMemberFile[0].stats).length; i++) {
      statList[i + Object.keys(gangMemberFile[0]).length] = Object.keys(gangMemberFile[0].stats)[i]
    }
    let tracked = require('./trackedStats.json');
    let after = require('./gangMembers.json');
    let foundFlag = false;
    let before = require(`./archive/${weekCounter-1}`);
    if(tracked.length > 24) { ( message.channel.send("Maximum amount of stats tracked! :(")) }
    if(command === 'add') {
      for(let i = 0; i < statList.length; i++) {
        if(stat.toLowerCase().replace(/[^\w\s]/gi, '') === statList[i].toLowerCase().replace(/[^\w\s]/gi, '')) {
          tracked[tracked.length] = statList[i];
          message.channel.send(stat + " is now being tracked");
          foundFlag = true;
        }
      }
      if(!foundFlag) { message.channel.send("I can't find a stat with that name, try rephrasing?"); }
    }
    if(command === 'remove') {
      for(let i = 0; i < tracked.length; i++) {
        if(tracked[i] === stat) {
          tracked.splice(i, 1);
          removeRecord(stat);
          message.channel.send(stat + " has been removed from tracking.");
          foundFlag = true;
        }
      }
      if(!foundFlag) {message.channel.send("It doesn't look like you're tracking a stat with that name");}
    }
    
    fs.writeFile(
      "trackedStats.json",
      JSON.stringify(tracked),
      "utf8",
      function (err) {
        if (err) {
          console.log("An error occured while updating tracked file");
          return console.log(err);
        }
        console.log("Tracked file updated!")
      }
    );
    console.log(tracked);
    let result = calculateStatistics(tracked, before, after);
    updateLeaders(result, tracked);
  }
}

const removeRecord = (stat) => {
  const archive = require('./recordsArchive.json');
  const leaders = require('./weeklyLeaders.json');
  console.log(archive[stat].value < leaders[stat].record);
  if(archive[stat]) {
    if(archive[stat].value < leaders[stat].record) {
      archive[stat].value = leaders[stat].record;
      archive[stat].name = leaders[stat].holder;
    }
  } else {
    rec = {
      'name': leaders[stat].name,
      'value': leaders[stat].record
    }
    archive[stat] = rec;
  }
  console.log(archive[stat]);
  delete leaders[stat];
  fs.writeFile(
    "weeklyLeaders.json",
    JSON.stringify(leaders),
    "utf8",
    function (err) {
      if (err) {
        console.log("An error occured while removing item from leaders file");
        return console.log(err);
      }
      console.log("Leaders file updated!")
    }
  );
  fs.writeFile(
    "recordsArchive.json",
    JSON.stringify(archive),
    "utf8",
    function (err) {
      if (err) {
        console.log("An error occured while saving records archive");
        return console.log(err);
      }
      console.log("Archive File updated!")
    }
  );
}


// ---------- GET CAPS FUNCTION ---------- //
const getCaps = async (message) => {
  const response = await fetch(
    "https://stats.olympus-entertainment.com/api/v3.0/cartels/",
    {
      headers: {
        accept: "application/json",
        Authorization:
          "Token g948_Qmi9EuhOzkzD6GAO_saloZ4lmcb3M3pYD6CUB4tPHCBivvDYuooVlSzbNxk",
      },
    }
  );
  const json = await response.json().then((cartelInfo) => {
    const cartelEmbed = new EmbedBuilder()
      .setTitle(":small_red_triangle: Cartel Status :small_red_triangle: ")
      .addFields(
        {
          name: "Arms :gun: ",
          value: cartelInfo[0].gang_name + " - " + cartelInfo[0].progress + "%",
        },
        {
          name: "Meth :alembic: ",
          value: cartelInfo[1].gang_name + " - " + cartelInfo[1].progress + "%",
        },
        {
          name: "Moonshine :amphora: ",
          value: cartelInfo[2].gang_name + " - " + cartelInfo[2].progress + "%",
        }
      );
    message.channel.send({ embeds: [cartelEmbed] });
  });
};

// -------------- FLOPPA IMG FUNCTION -------- //
const floppaImg = async (message) => {
  const response = await fetch(
    "https://api.imgur.com/3/gallery/r/bigfloppa/random",
    {
      headers: {
        Authorization: "Client-ID 56bac0eae26615e",
      },
    }
  );
  const data = await response.json().then((res) => {
    let x = Math.floor(Math.random() * (99 - 0 + 1) + 0);
    const floppaEmbed = new EmbedBuilder()
      .setTitle(res.data[x].title)
      .setURL(res.data[x].link)
      .setImage(`https://i.imgur.com/${res.data[x].id}.png`)
      .setTimestamp();
    //.setFooter(res.score + "Floppas");
    message.channel.send({ embeds: [floppaEmbed] });
  });
};

// -------------------- GANG INFO FILE WRITING ------------ //
const writeGangInfo = async () => {
  const response = await fetch(
    "https://stats.olympus-entertainment.com/api/v3.0/gangs/25546/",
    {
      headers: {
        accept: "application/json",
        Authorization:
          "Token g948_Qmi9EuhOzkzD6GAO_saloZ4lmcb3M3pYD6CUB4tPHCBivvDYuooVlSzbNxk",
      },
    }
  );
  const json = await response.json().then((gangInfo) => {
    fs.writeFile(
      "gangInfo.json",
      JSON.stringify(gangInfo),
      "utf8",
      function (err) {
        if (err) {
          console.log("An error occured while writing JSON to File");
          return console.log(err);
        }
        gangMemberLink =
          "https://stats.olympus-entertainment.com/api/v3.0/players/?player_ids=";
        console.log("gangInfo.json updated");
      }
    );
  });
};

const writeGangMemberInfo = async () => {
    const gangInfoFile = require('./gangInfo.json');
    let members = gangInfoFile.members;

    gangMemberLink = gangMemberLink + members[0].player_id;

    for (let i = 1; i < members.length; i++) {
      gangMemberLink = gangMemberLink + "%2C" + members[i].player_id;
    }

    const response = await fetch(gangMemberLink, {
      headers: {
        accept: "application/json",
        Authorization:
          "Token g948_Qmi9EuhOzkzD6GAO_saloZ4lmcb3M3pYD6CUB4tPHCBivvDYuooVlSzbNxk",
      },
    });
    const json = await response.json().then((gangMembers) => {
      if(gangMembers['errors']) { writeGangInfo().then(() => { writeGangMemberInfo();})}
      fs.writeFile(
        "gangMembers.json",
        JSON.stringify(gangMembers),
        "utf8",
        function (err) {
          if (err) {
            console.log(
              "An error occured while writing gangMembers.json to File"
            );
            return console.log(err);
          }
          console.log("gangMembers.json updated");
          lastUpdate = currentDate(2);
          gmUpdated = currentDate(2);
        }
      );
    });
};

const updateMemberStats = (results) => {
  fs.writeFile(
    "memberStats.json",
    JSON.stringify(results),
    "utf8",
    function (err) {
      if (err) {
        console.log("An error occured while writing member stats");
        return console.log(err);
      }
      console.log("Member Stats File updated!")
    }
  );
}

const archiveStats = () => {
  const gangMemberFile = require('./gangMembers.json');
  fs.writeFile(
    `./archive/${weekCounter}.json`,
    JSON.stringify(gangMemberFile),
    'utf8',
    function (err) {
      if (err) {
        console.log(
          "An Error occured while archiving documents"
        );
        return console.log(err);
      }
      console.log("Archive file updated");
    }
  )
  if(weekCounter === 52) {
    weekCounter = 1;
  } else {
    weekCounter++;
  }
};

//----------- Cartel Split Function --------//

const startCartel = async (message) => {
  let gangInfoFile = require('./gangInfo.json');
  startingAmt = gangInfoFile.bank;
  message.channel.send(
    "Starting cartels at $" + startingAmt + " react if participating."
  );
  message.react("👍");

  client.on("messageReactionAdd", (reaction, user) => {
    participants.push(`${user}`);
  });
  const filter = (reaction, user) => {
    return ["👍"].includes(reaction.emoji.name);
  };
  message
    .awaitReactions(filter, { max: 100, time: 900000 })
    .then((collected) => {
      console.log(participants);
    })
    .catch((collected) => {
      console.log("Error during caps split function");
    });
};

const endCartel = async (message) => {
  let gangInfoFile = require('./gangInfo.json');
  const endingAmt = gangInfoFile.bank;
  message.channel.send(
    "Split from cartels is $" +
      Math.round(((endingAmt - startingAmt) *.9) / (participants.length - 1)) +
      " each"
  );
  startingAmt = 1;
  participants = [];
};

// ----------- IRON CHAT COMMANDS ------------------ //

const checkIronLedger = (message) => {
  var ironLedger = require('./ironLedger.json');
  var fields = [];
  for(let i = 0; i < ironLedger.length; i++) {
    fields[i] =
      {
        name: `${ironLedger[i].name}`,
        value: `${formatter.format(ironLedger[i].total_owed)}`,
      }
  }
  const ironEmbed = new EmbedBuilder()
      .setTitle("Iron Ledger")
      .addFields(fields);
    message.channel.send({ embeds: [ironEmbed] });
}

const checkMemberLedger = (message, name) => {
  var ironLedger = require('./ironLedger.json');
  var transactions = "";
  
  for(let i = 0; i < ironLedger.length; i++) {
    if(ironLedger[i].name.toLowerCase() === name) {
      for(let j = 0; j < ironLedger[i].transactions.length; j++) {
        transactions = transactions + ironLedger[i].transactions[j] + "\n"
      }
      const ironEmbed = new EmbedBuilder()
      .setTitle(`${ironLedger[i].name}'s Ledger`)
      .addFields(
        {
          name: "Name",
          value: `${ironLedger[i].name}`
        },
        {
          name: "Total Owed",
          value: `${formatter.format(ironLedger[i].total_owed)}`
        },
        {
          name: "Transactions",
          value: `${transactions}`
        }
      )
      .setFooter({
        text: `Last Update: ${currentDate(2)}`,
      });
      message.channel.send({ embeds: [ironEmbed] });
    }
  }
  
}

// ----------- STATISTICS CALCULATION FUNCTIONS ------------- //

const recordWeekStats = () => {
  const leaders = require('./weeklyLeaders.json');
  fs.writeFile(
    "./lastWeekLeaders.json",
    JSON.stringify(leaders),
    'utf8',
    function (err) {
      if (err) {
        console.log(
          "An Error occured while writing last week's leaders file\n      "
        );
        return console.log(err);
      }
    }    
  );
}

const recordWeekStatsOLD = () => {
  console.log(weekCounter);
  var data = require(`./archive/${weekCounter-1}.json`);
  var ironLedger = require('./ironLedger');
  let skip = [2000];
  let offset = 0;
  leaders = leadersFile;
  if(weekCounter === 1) {
    let data = require(`./archive/52.json`);
  }

  json = data;

  for(let i = 0; i < gangMemberFile.length; i++) {
    
    if(skip.includes(i)) { continue; }  // If i has been added to skip array (already counted that player), skip iteration

    if(json[(i+offset)]?.player_id === gangMemberFile[i].player_id) {

      let wkills = gangMemberFile[i].kills - json[i+offset].kills;
      let wdeaths = gangMemberFile[i].deaths - json[i+offset].deaths;
      let wprison = gangMemberFile[i].stats.prison_time - json[i+offset].stats.prison_time;
      let wrobbed = gangMemberFile[i].stats.players_robbed - json[i+offset].stats.players_robbed;

      let ironSold = gangMemberFile[i].stats.iron_sold - json[i+offset].stats.iron_sold;

      for (let j = 0; j < gangMemberFile.length; j++) {
        if(gangMemberFile[j].name === gangMemberFile[i].name && gangMemberFile[j].player_id !== gangMemberFile[i].player_id) {
          wkills =  wkills + (gangMemberFile[j].kills - json[j+offset].kills);
          wdeaths = wdeaths + (gangMemberFile[j].deaths - json[j+offset].deaths);
          wprison = wprison + (gangMemberFile[j].stats.prison_time - json[j+offset].stats.prison_time);
          wrobbed = wrobbed + (gangMemberFile[j].stats.players_robbed - json[j+offset].stats.players_robbed);

          ironSold = ironSold + (gangMemberFile[j].stats.iron_sold - json[j+offset].stats.iron_sold);

          skip.push(j);
          console.log("SKIP ADDED: " + gangMemberFile[j].name);
        }
      }

      if(ironSold > 0) {
        const taxAmount = 175;
        let ironFlag = false;
        for(let j = 0; j < ironLedger.length; j++) {
          if(ironLedger[j]?.player_id === gangMemberFile[i].player_id) {
            ironFlag = true;

            ironLedger[j].value = ironSold * taxAmount; 
            ironLedger[j].iron_sold = ironSold; 
            ironLedger[j].total_owed = ironLedger[j].total_owed + (ironSold * taxAmount);
            ironLedger[j].transactions.push(`[${currentDate(1)}] Sold ${ironSold}. Tax added: ${formatter.format(ironSold * taxAmount)}.  Total: ${formatter.format(ironLedger[j].total_owed)}`)
          }
        }
        if(!ironFlag) {
          let ironFile = {
            player_id: gangMemberFile[i].player_id,
            name: gangMemberFile[i].name,
            iron_sold: ironSold,
            value: ironSold * taxAmount,
            total_owed: ironSold * taxAmount,
            transactions: [
              `[${currentDate(1)}] Sold ${ironSold}. Tax added: ${formatter.format(ironSold * taxAmount)}.  Total: ${formatter.format(ironSold * taxAmount)}`,
              ]
          }
          ironLedger[ironLedger.length] = ironFile;
        }

        console.log(ironLedger);

      }

      if(leaders.kills.value < wkills) {
        leaders.kills.name = gangMemberFile[i].name;
        leaders.kills.value = wkills
        if(leaders.kills.record < wkills) {
          leaders.kills.record = wkills;
          leaders.kills.holder = gangMemberFile[i].name;
        }
      }
      if(leaders.deaths.value < wdeaths) {
        leaders.deaths.name = gangMemberFile[i].name;
        leaders.deaths.value = wdeaths
        if(leaders.deaths.record < wdeaths) {
          leaders.deaths.record = wdeaths;
          leaders.deaths.holder = gangMemberFile[i].name;
        }
      }
      if(leaders.prison.value < wprison) {
        leaders.prison.name = gangMemberFile[i].name;
        leaders.prison.value = wprison;
        if(leaders.prison.record < wprison) {
          leaders.prison.record = wprison;
          leaders.prison.holder = gangMemberFile[i].name;
        }
      }
      if(leaders.robbed.value < (gangMemberFile[i].kills - json[i+offset].kills)) {
        leaders.robbed.name = gangMemberFile[i].name;
        leaders.robbed.value = wrobbed;
        if(leaders.robbed.record < wrobbed) {
          leaders.robbed.record = wrobbed;
          leaders.robbed.holder = gangMemberFile[i].name;
        }
      }
    } else {
      offset++;
      i--;
    }
  }
  fs.writeFile(
    `./weeklyLeaders.json`,
    JSON.stringify(leaders),
    'utf8',
    function (err) {
      if (err) {
        console.log(
          "An Error occured while writing leaders file\n      "
        );
        return console.log(err);
      }
    }
  )
  fs.writeFile(
    `./ironLedger.json`,
    JSON.stringify(ironLedger),
    'utf8',
    function (err) {
      if (err) {
        console.log(
          "An Error occured while writing iron ledger file\n      "
        );
        return console.log(err);
      }
    }
  )

  console.log("Leaders Updated!");
}

const calculateStatistics = (tracked, before, after) => {
  var output = [];
  for(let j = 0; j < after.length; j++) {
    for(let k = 0; k < before.length; k++) {
      if(after[j].player_id === before[k].player_id) {
        output[j] = {
          'name': `${after[j].name}`,
          'player_id': `${after[j].player_id}`,
          'data': {}
        };
        for(let i = 0; i < tracked.length; i++) {
          output[j].data[tracked[i]] = 
            after[j][tracked[i]]?
            after[j][tracked[i]] - before[k][tracked[i]]:
            after[j].stats[tracked[i]] - before[k].stats[tracked[i]];
        }
      }
    }
  }
  for(let i = 0; i < output.length; i++) {
    if(!output[i]) { continue; }
    for(let j = 0; j < output.length; j++) {
      if(!output[j]) { continue; }
      if(output[i].name === output[j].name && output[i].player_id !== output[j].player_id) {
        for(let k = 0; k < tracked.length; k++) {
          output[i].data[tracked[k]] = output[i].data[tracked[k]] + output[j].data[tracked[k]];
        }
        delete output[j];
      }
    }
  }
  return output;
}

const updateLeaders = (stats, tracked) => {
  leaderboard = null;
  try {
  let leaderboard = require('./weeklyLeaders.json');
  } catch (err) { console.log(err); }
  if(!leaderboard) { leaderboard = {};}
  let archive = require('./recordsArchive.json');
  for(let i = 0; i < stats.length; i++) {
    if(!stats[i]) { continue; }
    for(let j = 0; j < tracked.length; j++) {
      if(leaderboard[tracked[j]]) {
        if(stats[i].data[tracked[j]] > leaderboard[tracked[j]].value) {
          leaderboard[tracked[j]].name = stats[i].name;
          leaderboard[tracked[j]].value = stats[i].data[tracked[j]];
          if(stats[i].data[tracked[j]] > leaderboard[tracked[j]].record) {
            leaderboard[tracked[j]].holder = stats[i].name;
            leaderboard[tracked[j]].record = stats[i].data[tracked[j]];
          }
        }
      } else {
        leaderboard[tracked[j]] = {
          "name": stats[i].name,
          "value": stats[i].data[tracked[j]],
          "record": stats[i].data[tracked[j]],
          "holder": stats[i].name
        }
      }
    }
  }
  for(var key of Object.keys(leaderboard)) {
    if(archive[key]) {
      if(leaderboard[key].record < archive[key].value) {
        leaderboard[key].holder = archive[key].name;
        leaderboard[key].record = archive[key].value;
        console.log("Finished FOR LOOP");
      }
    }
  }
  fs.writeFile(
    "./weeklyLeaders.json",
    JSON.stringify(leaderboard),
    'utf8',
    function (err) {
      if (err) {
        console.log(
          "An Error occured while writing leaders file\n      "
        );
        return console.log(err);
      }
    }    
  );
}

const updateAllStats = () => {
  console.log("Week Counter: " + weekCounter);
  const before = require(`./archive/${weekCounter - 1}.json`);
  const after = require('./gangMembers.json');
  const tracked = require('./trackedStats.json');

  result = calculateStatistics(tracked, before, after);
  updateLeaders(result, tracked);
  updateMemberStats(result);

}




// ----------------- SUPPLIMENTAL FUNCTIONS --------- //

const currentDate = (num) => {
  if(num === 2) {
    var currentdate = new Date();
        var currentHour = currentdate.getHours();
        if (currentHour === 0) {
          currentHour = 12;
        }
        else if ( currentHour > 12) {
          currentHour = currentHour - 12;
        }
        var date = (currentdate.getMonth()+1) + "/"
                  + currentdate.getDate()  + " at "
                  + currentHour + ":"  
                  + currentdate.getMinutes();
        return date;
  }
  if(num === 1) {
    var currentdate = new Date();
        var currentHour = currentdate.getHours();
        if (currentHour === 0) {
          currentHour = 12;
        }
        else if ( currentHour > 12) {
          currentHour = currentHour - 12;
        }
        var date = (currentdate.getMonth()+1) + "/"
                  + currentdate.getDate() + "/" 
                  + currentdate.getYear();
        return date;
  }
}

const startUp = async () => {
  writeGangInfo();
  await sleep(5000);
  writeGangMemberInfo();
  await sleep(5000);
  archiveStats();
  await sleep(5000);
  updateAllStats();
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

client.login(process.env.TOKEN);
