const { time } = require("console");
const { channel } = require("diagnostics_channel");
const { Client, GatewayIntentBits, EmbedBuilder, InteractionCollector, Intents, interaction, ComponentType } = require("discord.js");
const fs = require("fs");
const cron = require("node-cron");
require("dotenv/config");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
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


const slayer_id = '209141852849307649';
const gang_id = 25546
const channel_id = '1069447514203361351'
const prefix = "!";

// var capsData = {};

var giUpdated = null;
var gmUpdated = null;
var startingAmount = 0;
var splitFlag = false;
var participants = [];
var gangMemberLink =
  "https://stats.olympus-entertainment.com/api/v3.0/players/?player_ids=";

// -------------- CRON JOBS ------------- //

//end of week jobs
cron.schedule("30 0 0 * * 1", () => {
  startUp();
  sleep(10000);
  archiveStats();
  recordWeekStats();
})

// //constant jobs
cron.schedule("0 */5 * * * *", () => {
  writeGangInfo();
});

cron.schedule("0 */2 * * * *", () => {
  writeCaps();
});


// ---------- MAIN FUNCTION ----------- //
client.on("messageCreate", (message) => {

  const args = message.content.slice(prefix.length).split("/ +/");
  const temp = args.shift().toLowerCase();
  const command = temp.split(" ")

  if (command[0] === "check") {
    console.log(message);
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
    if(command[1] === "roster") {
      getRoster(message);
    } else {
      gangEmbed(message);
    }
  }
  if (command[0] === "stats") {
    if(command[1] === "add" || command[1] === "remove" || command[1] === "options") {
      editTracked(message, command[1], command[2]);
    }
    else if(command[1] === "overall") {
       var playerName = "";
      for(let i = 2; i < command.length; i++) {
        playerName = `${playerName}` + `${command[i]}`;
      }
      getTotalStats(message, playerName)
    }
    else if(command[1]) {
      var playerName = "";
      for(let i = 1; i < command.length; i++) {
        playerName = `${playerName}` + `${command[i]}`;
      }
      getMemberStats(message, playerName)
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
    startCap(message);
  }
  if (command[0] === "endcap") {
    endCap(message);
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
    
  }
  // if (command[0] === "fetch"){
  //   writeGangInfo();
  //  }
  // if(command[0] === 'archive') {
  //   recordWeekStats();
  //   archiveStats();
  // }
});

//----------- GANG FUNCTION ------------ //
const gangEmbed = (message) => {
  //delete require.cache[require.resolve('./gangInfo.json')];
  //let gangInfoFile = require('./gangInfo.json');
  fs.readFile('./gangInfo.json', 'utf8', (err, gangInfoFile) => {
    if (err) {
       console.log(err);
    }
    else {
    const statsEmbed = new EmbedBuilder()
      .setTitle("Comp Or Ban")
      .setThumbnail("https://i.imgur.com/BHLmQck.jpeg")
      .setURL("https://stats.olympus-entertainment.com/#/stats/gangs/25546")
      .addFields(
        { name: "Gang Funds", value: `${formatter.format(JSON.parse(gangInfoFile).bank)}`, inline: true },
        {
          name: "War Kills",
          value: `${JSON.parse(gangInfoFile).kills}`,
          inline: true,
        },
        {
          name: "War Deaths",
          value: `${JSON.parse(gangInfoFile).deaths}`,
          inline: true,
        }
      )
      .setFooter({ text: "Last Update: " + giUpdated });
    message.channel.send({ embeds: [statsEmbed] });
  }})
};

const getRoster = (message, command) => {
  fs.readFile('./memberStats.json', 'utf8', (err, data) => {
    const members = JSON.parse(data);
    var roster = [];
    for(let i = 0; i < members.length; i++) {
      if(!members[i] || members[i] === "") { continue; }
      roster =  roster + `${members[i].name} - `;
      if(!roster[i] || roster[i] === "") {
        roster.pop(i);
      }
    }
    message.channel.send(roster);
  });
}

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
      },
      {
        name: "!stats",
        value:
          "Gives you the leaders of the current tracked stats for the week"
      },
      {
        name: "!stats [player name]",
        value:
          "Gives the named players currently tracked stats.  Make sure you spell their name right."
      }
    )
    .setFooter({
      text: "Please submit bug reports to Nman#3327 on discord, or tag @FloppaDev",
    });
  message.author.send({ embeds: [helpEmbed] });
};

// --------- POST STATS FUNCTIONS ------------------------------------------------------------------------------------POST STATS FUNCTIONS---//

const getWeeklyStats = (message) => {
  const json = JSON.parse(fs.readFileSync('./weeklyLeaders.json', 'utf8'));
  const tracked = JSON.parse(fs.readFileSync('./trackedStats.json', 'utf8'));
  //building fields
  fields = []
  counter = 0;
  for(let i = 0; i < tracked.length; i++) {
    if(!json[tracked[i]]) { continue; }
    fields[i] = {
      name: `${tracked[i].toUpperCase().replace('_',' ')}`,
      value: `${json[tracked[i]].name}` + '```' +  `${tracked[i] === 'bank' || tracked[i] === "ticket_vals"? formatter.format(json[tracked[i]].value) : json[tracked[i]].value}` + '```',
      inline: true
    }
  }
  const weeklyStatsEmbed = new EmbedBuilder()
    .setTitle("This Weeks Best Stats")
    .addFields(fields)
    .setColor(0x591017)
    .setFooter({
      text: `Last Update: ${gmUpdated}`,
    });
  console.log("Get Weekly Stats Run.");
  message.channel.send({ embeds: [weeklyStatsEmbed] });
};

const getLastWeekStats = (message) => {
  const json = JSON.parse(fs.readFileSync('./lastWeekLeaders.json','utf8'));
  const tracked = JSON.parse(fs.readFileSync('./trackedStats.json','utf8'));
  //building fields
  fields = []
  for(let i = 0; i < tracked.length; i++) {
    if(!json[tracked[i]]) { continue; }
    fields[i] = {
      name: `${tracked[i].toUpperCase().replace('_',' ')}`,
      value: `${json[tracked[i]].name}` + '```' +  `${tracked[i] === 'bank' || tracked[i] === "ticket_vals"? formatter.format(json[tracked[i]].value) : json[tracked[i]].value}` + '```',
      inline: true
    }
  }
  const weeklyStatsEmbed = new EmbedBuilder()
    .setTitle("Last Weeks Stats")
    .addFields(fields)
    .setColor(0xfc6f03)
    .setFooter({
      text: ` `,
    });
  message.channel.send({ embeds: [weeklyStatsEmbed] });
};

const getRecordStats = (message) => {
  const json = JSON.parse(fs.readFileSync('./weeklyLeaders.json', 'utf8'));
  const tracked = JSON.parse(fs.readFileSync('./trackedStats.json'));
  
  var fields = [];

  for(let i = 0; i < tracked.length; i++) {
    if(!json[tracked[i]]) { return; }
    fields[i] = {
      name: `${tracked[i].toUpperCase().replace('_',' ')}`,
      value: `${json[tracked[i]].holder}`+'```' + `${tracked[i] === 'bank' || tracked[i] === "ticket_vals"? formatter.format(json[tracked[i]].record) : json[tracked[i]].record}` + '```',
      inline: true
    } 
  }

  const weeklyStatsEmbed = new EmbedBuilder()
    .setTitle("One Week Highs")
    .addFields(fields)
    .setColor(0x85830b)
    .setFooter({
      text: `The best of the best`,
    });
  message.channel.send({ embeds: [weeklyStatsEmbed] });
};

const getMemberStats = (message, command) => {
  var json = JSON.parse(fs.readFileSync('./memberStats.json', 'utf8'));
  var tracked = JSON.parse(fs.readFileSync('./trackedStats.json', 'utf8'));

  var index = null;
  for(let i = 0; i < json.length; i++) {
    if(!json[i]) { continue; }
    if(json[i].name.toLowerCase().replace(/\s/g, '') === command.toLowerCase().replace(/\s/g, '')) {
      index = i;
    }
  }
  //building fields
  fields = []
  counter = 0;
  if(index === null) { message.channel.send("No player by that name found.  Make sure you have it exactly right!"); return; }
  for(let i = 0; i < tracked.length; i++) {
    if(json[index].data[tracked[i]] === null) { fields[i] = {
      name: " ",
      value: " ",
      inline: true
    } ; continue; }
    fields[i] = {
      name: `${tracked[i].toUpperCase().replace('_',' ')}`,
      value: '```' + `${tracked[i] === 'bank' || tracked[i] === "ticket_vals"? formatter.format(json[index].data[tracked[i]]) : json[index].data[tracked[i]]}` + '```',
      inline: true
    }
  }
  const weeklyStatsEmbed = new EmbedBuilder()
    .setTitle(`${json[index].name}'s Weekly Stats`)
    .addFields(fields)
    .setColor(0x0f14b8)
    .setFooter({
      text: `Last Update: ${gmUpdated}`,
    });
  message.channel.send({ embeds: [weeklyStatsEmbed] });
}

const getTotalStats = (message, command) => {
  var json = JSON.parse(fs.readFileSync('./gangMembers.json', 'utf8'));
  var tracked = JSON.parse(fs.readFileSync('./trackedStats.json', 'utf8'));
  var index = null;
  for(let i = 0; i < json.length; i++) {
    if(!json[i].name) { continue; }
    if(json[i].name.toLowerCase().replace(/\s/g, '') === command.toLowerCase().replace(/\s/g, '')) {
      index = i;
    }
  }
  //building fields
  fields = []
  counter = 0;
  if(index === null) { message.channel.send("No player by that name found.  Make sure you have it exactly right!"); return; }
  for(let i = 0; i < tracked.length; i++) {
    if(json[index][tracked[i]]) {
      fields[i] = {
        name: `${tracked[i].toUpperCase().replace('_',' ')}`,
        value: '```' + `${tracked[i] === 'bank' || tracked[i] === "ticket_vals"? formatter.format(json[index][tracked[i]]) : json[index][tracked[i]]}` + '```',
        inline: true
      }
    } 
    else if (json[index].stats[tracked[i]]) {
      fields[i] = {
        name: `${tracked[i].toUpperCase().replace('_',' ')}`,
        value: '```' + `${tracked[i] === 'bank' || tracked[i] === "ticket_vals"? formatter.format(json[index].stats[tracked[i]]) : json[index].stats[tracked[i]]}` + '```',
        inline: true
      }
      
    } else {
      fields[i] = {
        name: ' ',
        value: ' ',
        inline: true
      }
    }
  }
  const weeklyStatsEmbed = new EmbedBuilder()
    .setTitle(`${json[index].name}'s Overall Stats`)
    .addFields(fields)
    .setColor(0x0f14b8)
    .setFooter({
      text: `Last Update: ${gmUpdated}`,
    });
  message.channel.send({ embeds: [weeklyStatsEmbed] });
}

const editTracked = async (message, command, stat) => {
  if(message.author.id === '288445122947973121' || message.author.id === slayer_id) {
    let weekCounter = JSON.parse(fs.readFileSync('./weekCounter.json', 'utf8'));
    let gangMemberFile = JSON.parse(fs.readFileSync('./gangMembers.json', 'utf8'));
    var statList = [];
    for(let i = 0; i < Object.keys(gangMemberFile[0]).length; i++) {
      statList.push(`${Object.keys(gangMemberFile[0])[i]}`);
    }
    for(let i = 0; i < Object.keys(gangMemberFile[0].stats).length; i++) {
      statList.push(`${Object.keys(gangMemberFile[0].stats)[i]}`); 
    }
    if(command === 'options') {
      for(let i = 0; i < Object.keys(gangMemberFile[0]).length; i++) {
        statList.push('`' + `${Object.keys(gangMemberFile[0])[i]}` + '` - ');
      }
      for(let i = 0; i < Object.keys(gangMemberFile[0].stats).length; i++) {
        statList.push('`' + `${Object.keys(gangMemberFile[0].stats)[i]}` + '` - '); 
      }
      var optionList = '';
      for(let i = 0; i < statList.length; i++) {
        optionList = optionList + statList[i];
      }
      message.channel.send(optionList);
    }
    let tracked = JSON.parse(fs.readFileSync('./trackedStats.json', 'utf8'));
    let foundFlag = false;

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
          message.channel.send(stat + " has been removed from tracking.");
          foundFlag = true;
        }
        removeRecord(stat);
      }
      if(!foundFlag) {message.channel.send("It doesn't look like you're tracking a stat with that name");}
    }
    
    fs.writeFileSync(
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
    updateAllStats(gangMemberFile);
  }
  else {
    message.channel.send("Access denied!  Ask Slyr.");
  }
}

const removeRecord = async (stat) => {

  let leaders = JSON.parse(fs.readFileSync('./weeklyLeaders.json', 'utf8'));
  let archive = JSON.parse(fs.readFileSync('./recordsArchive.json', 'utf8'));

  if(archive[stat]) {
    if(archive[stat].value < leaders[stat].record) {
      archive[stat].value = leaders[stat].record;
      archive[stat].name = leaders[stat].holder;
    }
  } else {
    rec = {
      'name': `${leaders[stat].name}`,
      'value': `${leaders[stat].record}`
    }
    archive[stat] = rec;
  }
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
  fs.writeFileSync(
    "recordsArchive.json",
    JSON.stringify(archive),
    "utf8");
}


// ---------- GET CAPS FUNCTION ---------- //
const getCaps = async (message) => {
  cartelInfo = JSON.parse(fs.readFileSync('./cartelInfo.json', 'utf8'));
  if(!cartelInfo[0].gang_name) { message.channel.send("Error Occurred.  API issues.  Try again later"); return;}
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
};

const writeCaps = async () => {
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
    fs.writeFile(
      "cartelInfo.json",
      JSON.stringify(cartelInfo),
      "utf8",
      function (err) {
        if (err) {
          console.log("An error occured while saving cartel info");
          return console.log(err);
        }
        console.log("cartel info updated!");
        checkCaps(cartelInfo);
      }
    );
  });
};

// const checkCaps = async (cartelInfoFile) => {
//   let cartelInfo = cartelInfoFile;
//   if(!cartelInfo) {
//     let cartelInfo = JSON.parse(fs.readFileSync('./cartelInfo.json', 'utf8'));
//   }
//   let capsData = JSON.parse(fs.readFileSync('./capsData.json', 'utf8'));

//   for(let i = 0; i < capsData.length; i++) {
//     for(let j = 0; j < cartelInfo.length; j++) {
//       if(cartelInfo[j].server === capsData[i].server && cartelInfo[j].name === capsData[i].name) {
//         if(cartelInfo[j].gang_id !== gang_id) {
//           lostCap(capsData, i, cartelInfo);
//         }
//       }
//     }
//   }
//   for(let i = 0; i < cartelInfo.length; i++) {
//     if(cartelInfo[i].gang_id === gang_id) {
//       for(let j = 0; j <= capsData.length; j++) {
//         if(cartelInfo[i].server === capsData[j].server && cartelInfo[i].name === capsData[j].name) {
//           console.log(`Holding ${capsData[j].name} cartel on server ${capsData[j].server}`)
//         } else {
//           gainedCap(cartelInfo[i].name, cartelInfo[i].server);
//         }
//       }
//     }
//   }
// }

// const gainedCap = async (name, server) => {
//   var number = null;
//   const channel = client.channels.cache.get(channel_id);
//     let capsData = JSON.parse(fs.readFileSync('./capsData.json', 'utf8'));
//     let gangInfo = JSON.parse(fs.readFileSync('./gangInfo.json'), 'utf8');

//     if(capsData[0]) { return; }  //we only need one cap data

//     number = capsData.length;
//     capsData[capsData.length] = {
//       cartel: name,
//       server: server,
//       time: currentDate(2),
//       starting: gangInfo.bank,
//       message: null,
//       users: [],
//     }
//     const embed = new EmbedBuilder()
//       .setColor('0x3b2927')
//       .setTitle('Starting Caps')
//       .setDescription('React to the message if you are involved!');
    
//     channel.send({embeds : [embed]}).then((embedMsg) => {
//       embedMsg.react("🔺");

//       capsData[number].message = embedMsg;

//       const participating = new EmbedBuilder()
//       .setColor('0x3b2927')
//       .setTitle('Starting Caps at ```' + formatter.format(gangInfo.bank) + '```')
//       .setDescription('The Following are Participants:')
//       .setFooter({
//         text: `${currentDate(2)}`
//       })

//       channel.send({ embeds: [participating]}).then( emb => {
        
//         client.on('messageReactionAdd', (reaction, user) => {
//           if(user.id === embedMsg.author) {return;}
//           if(user.username === 'FloppaBot') { return; }
//           if(capsData[number].message.id === embedMsg.id) {
//             capsData[number].users.push(user.username);



//             participating.addFields({
//               name: `${user.username}`,
//               value: " ",
//               inline: true
//             })

//             emb.edit({ embeds: [participating]});
//           }
//         })
        
//         var index = 0;
//         client.on('messageReactionRemove', (reaction, user) => {
//           var newEmb = new EmbedBuilder()
//                 .setColor('0x3b2927')
//                 .setTitle('Starting Caps')
//                 .setDescription('The Following are Participants:')
//                 .setFooter({
//                   text: `${currentDate(2)}`
//                 })
//           if(capsData[number].message.id === emb.id) {
//             for(let i = 0; i < capsData[number].users.length; i++) {
//               if(capsData[number].users[i] === user.username) {
//                 capsData[number].users.splice(i, 1);
//               } else {
//                 newEmb.addFields({
//                   name: `${capsData[number].users[i]}`,
//                   value: ""
//                 })
//               }
//             }
//           }
//           emb.edit({ embed: [newEmb]})
//         })
//       })
//     })

//     await sleep(300000);

//     capsData[number].message.delete();

//     fs.writeFile('./capsData.json', JSON.stringify(capsData), "utf8", () => {});
// }

// const lostCap = (data, index, cartelInfo) => {
//   if(!data[index]) { 
//     return;
//   }
//   const channel = client.channels.cache.get(channel_id);
//   let gangInfo = JSON.parse(fs.readFileSync('./gangInfo.json', 'utf8'));
//   let totalGained = gangInfo.bank - data[index].starting;

  

//   for(let i = 0; i < cartelInfo.length; i++) {
//     if(cartelInfo[i].gang_id === gang_id) {
//       return;
//     }
//   }

//   let fields = [];
//   for(let i = 0; i < data[index].users.length; i++) {
//     if(data[index].users[i] === 'FloppaBot') { data[index].users.pop(i); }
//     fields[i] = {
//       name: `${data[index].users[i]}`,
//       value: ' ',
//       inline: true
//     }
//   }
//   payout = ((totalGained*.9) / data[index].users.length);
//   const participating = new EmbedBuilder()
//       .setColor('0x3b2927')
//       .setTitle('Lost Caps at ```' + formatter.format(gangInfo.bank) + '```')
//       .setDescription('Total Gained: ```' + formatter.format(totalGained) + '```  Payout per person: ```' + formatter.format(payout) + '```  The Following Players Are Included: ')
//       .addFields(fields)
//       .setFooter({
//         text: `${data[index].time} to ${currentDate(2)}`
//       })
  
//   channel.send({embeds : [participating]});

//   data = [];

//   fs.writeFileSync('./capsData.json', JSON.stringify(data), 'utf8');
  
// }

const startCap = (message) => {
  let gangInfo = JSON.parse(fs.readFileSync('./gangInfo.json'), 'utf8');
  let oldCapsData = JSON.parse(fs.readFileSync('./capsData.json', 'utf8'));
  if(oldCapsData.startAmount || oldCapsData.startTime) { message.channel.send('Theres already a cap going on.  Join that one by reacting to the emote.'); return; }

  var capsData = {
    startTime: currentDate(2),
    startAmount: gangInfo.bank,
    message: null,
    participating: []
  }

  var capEmbed = new EmbedBuilder()
  .setColor(0x000000)
  .setTitle('Starting Caps at ```' + `${formatter.format(gangInfo.bank)}` + '```')
  .addFields({
    name: 'The Following Are Participants: ',
    value: ' '
  })
  .setFooter({ text: "React to this if you're joining"})

  message.channel.send({ embeds: [capEmbed]}).then(emb => {
    emb.react("🔺");

    capsData.message = emb;

    client.on('messageReactionAdd', (reaction, user) => {
      if(user.id === emb.author) {return;}
      if(user.username === 'FloppaBot') { return; }
      var fields = [];
      participants.push(user.username);
      for(let i = 0; i < participants.length; i++) {
        fields[i] = {
          name: participants[i],
          value: " ",
          inline: true
        }
      }
      var newEmb = new EmbedBuilder()
      .setColor(0x000000)
      .setTitle('Starting Caps at ```' + `${formatter.format(gangInfo.bank)}` + '```')
      .addFields({
        name: 'The Following Are Participants: ',
        value: ' '
      })
      .setFooter({ text: "React to this if you're joining"})
      .addFields(fields)

      capsData.participating.push(user.username);

      fs.writeFileSync('./capsData.json', JSON.stringify(capsData), 'utf8' );

      emb.edit({ embeds: [newEmb]});
    })
    client.on('messageReactionRemove', (reaction, user) => {
      var temp = []
      var index = null;
      var fields = [];
      if(user.id === emb.author) {return;}
      if(user.username === 'FloppaBot') { return; }
      for(let i = 0; i < participants.length; i++) {
        if(user.username === participants[i]) {
          index = i;
        } else {
          fields[i] = {
            name: participants[i],
            value: " ",
            inline: true
          }
          temp[i] = participants[i];
        }
      }
      if(index !== null) {
        participants.splice(index, 1);
      }
      capsData.participating = temp;

      var newEmb = new EmbedBuilder()
      .setColor(0x000000)
      .setTitle('Starting Caps at ```' + `${formatter.format(gangInfo.bank)}` + '```')
      .addFields({
        name: 'The Following Are Participants: ',
        value: ' '
      })
      .setFooter({ text: "React to this if you're joining"})
      .addFields(fields);

      fs.writeFileSync('./capsData.json', JSON.stringify(capsData), 'utf8');

      emb.edit({ embeds: [newEmb]});
    })
  })
}

const endCap = (message) => {
  let gangInfo = JSON.parse(fs.readFileSync('./gangInfo.json'), 'utf8');
  let capsData = JSON.parse(fs.readFileSync('./capsData.json', 'utf8'));

  var chan = null;

  if(message) { 
    chan = message.channel;
  } else {
    chan = client.channels.cache.get(channel_id);
  }

  var fields = [];
  var numberParticipants = capsData.participating.length
  console.log(message)
  if (numberParticipants === 0) { 
    numberParticipants = 1;
  }

  for(let i = 0; i < capsData.participating.length; i++) {
    fields[i] = {
      name: `${capsData.participating[i]}`,
      value: ' ',
      inline: true
    }
  }

  var newEmb = new EmbedBuilder()
    .setColor(0x000000)
    .setTitle('Ending Caps at ```' + `${formatter.format(gangInfo.bank)}` + '```')
    .addFields(
      {
        name: 'Total Gained was ```' + `${formatter.format(gangInfo.bank - capsData.startAmount)}` + '```',
        value: ' '
      },
      {
        name: 'Each players cut is ```' + `${formatter.format(((gangInfo.bank - capsData.startAmount)*0.9)/numberParticipants)}` + '```',
        value: ' '
      }
    )
    .addFields(fields);

  chan.send({ embeds: [newEmb] })

  participants = [];
  capsData = {};
  fs.writeFileSync('./capsData.json', JSON.stringify(capsData), 'utf8' )
}

const checkCaps = (cartelInfo) => {
  if(!cartelInfo || cartelInfo.error) { console.log("An error occured with Check Caps because there is no Cartel Info"); return; }
  let capsData = JSON.parse(fs.readFileSync('./capsData.json', 'utf8'));
  var cartelFlag = false;

  if(capsData.startAmount || capsData.startTime) {
    for(let i = 0; i < cartelInfo.length; i++) {
      if(cartelInfo[i].gang_id === gang_id) {
        cartelFlag = true;
      }
    }
    console.log(cartelFlag === false);
    if(cartelFlag === false) {
      endCap();
    }
  }
}

// -------------- FLOPPA IMG FUNCTION ------------------------------------------------------------------------------------------------------------------------- //
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

// -------------------- GANG INFO FILE WRITING ---------------------------------------------------------------------------------------------------------- //
var gangInfoFlag = true;

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
    if(Object.keys(gangInfo).length < 5) { return; }
    fs.writeFileSync(
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
    giUpdated = currentDate(2);
    if (gangInfoFlag) {
      writeGangMemberInfo(gangInfo);
      gangInfoFlag = false;
    } else {
      gangInfoFlag = true;
    }
  });
};

var gangMemberInfoCounter = 0;

const writeGangMemberInfo = async (gangInfo) => {
    gangMemberInfoCounter++;
    let gangInfoFile = gangInfo;
    if(!gangInfoFile.members) {
      let gangInfoFilef = fs.readFileSync('./gangInfo.json', 'utf8');
    }

    

      const members = gangInfoFile.members;

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
        console.log(gangMembers);
        if(gangMembers?.message) { console.log("Limit of 250 a day reached for GangMembers Info"); return; }
        if(gangMembers?.error) { console.log("Invalid players something"); return; }
        fs.writeFileSync("./gangMembers.json", JSON.stringify(gangMembers), "utf8");
        console.log("gangMembers.json updated");
        gmUpdated = currentDate(2);
        console.log("GangMemberInfo has been run: " + gangMemberInfoCounter + " times");
        updateAllStats(gangMembers);
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
  const gangMemberFile = JSON.parse(fs.readFileSync('./gangMembers.json','utf8'));
  const weekNumber = JSON.parse(fs.readFileSync('./weekCounter.json','utf8'));
  fs.writeFileSync(
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
  console.log("weekNumber is: " + weekNumber[0]);
  const week = weekNumber[0] + 1;
  console.log("Week is now: " + week);
  fs.writeFile(
    `weekCounter.json`,
    JSON.stringify([
      week
    ]),
    'utf8',
    function (err) {
      if (err) {
        console.log(
          "An Error occured while writing week counter"
        );
        return console.log(err);
      }
      console.log("Week Counter updated to: " + weekCounter);
    }
  )
};

//----------- Cartel Split Function --------//


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

//

// ----------- STATISTICS CALCULATION FUNCTIONS ------------- //

const recordWeekStats = () => {
  var leaders = JSON.parse(fs.readFileSync('./weeklyLeaders.json','utf8'));
  const tracked = JSON.parse(fs.readFileSync('./trackedStats.json','utf8'));
  var archive = JSON.parse(fs.readFileSync('./recordsArchive.json', 'utf8'));
  fs.writeFileSync(
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
  for(let i = 0; i < tracked.length; i++) {
    if(archive[tracked[i]]) {
      if(archive[tracked[i]].value < leaders[tracked[i]].record) {
        archive[tracked[i]].value = leaders[tracked[i]].record;
        archive[tracked[i]].name = leaders[tracked[i]].holder;
      }
    } else {
      rec = {
        'name': `${leaders[tracked[i]].name}`,
        'value': `${leaders[tracked[i]].record}`
      }
      archive[tracked[i]] = rec;
    }
  }
  fs.writeFileSync(
    "recordsArchive.json",
    JSON.stringify(archive),
    "utf8");
  leaders = {};
  fs.writeFileSync('./weeklyLeaders.json', JSON.stringify(leaders),'utf8');
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
          if(output[i].data[tracked[k]] === null) {output[i].data[tracked[k]] = 0};
          if(output[j].data[tracked[k]] === null) {output[j].data[tracked[k]] = 0};
          output[i].data[tracked[k]] = output[i].data[tracked[k]] + output[j].data[tracked[k]];
        }
        delete output[j];
      }
    }
  }
  return output;
}

const updateLeaders = (stats, tracked) => {
  let leaderboard = JSON.parse(fs.readFileSync('./weeklyLeaders.json', 'utf8'));
  let archive = JSON.parse(fs.readFileSync('./recordsArchive.json', 'utf8'));

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
      }
    }
  }
  fs.writeFileSync(
    "./weeklyLeaders.json",
    JSON.stringify(leaderboard),
    'utf8' 
  );
}

const updateAllStats = (gangMembers) => {
  let weekCounter = JSON.parse(fs.readFileSync('./weekCounter.json', 'utf8'))[0];
  let before = JSON.parse(fs.readFileSync(`./archive/${weekCounter-1}.json`, "utf8"));
  let after = gangMembers;
  let tracked = JSON.parse(fs.readFileSync('trackedStats.json', "utf8"));

  result = calculateStatistics(tracked, before, after);
  updateLeaders(result, tracked);
  updateMemberStats(result);

  console.log("Stats Updated!");

}




// ----------------- SUPPLIMENTAL FUNCTIONS --------- //

const currentDate = (num) => {
  if(num === 0) {
    return Date.now();
  }
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
                  + (currentdate.getMinutes() < 10? "0" + currentdate.getMinutes() : currentdate.getMinutes());
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
  week = JSON.parse(fs.readFileSync('./weekCounter.json', 'utf8'));
  weekCounter = week[0];
  validateFiles();
  const gangMembers = JSON.parse(fs.readFileSync('./gangMembers.json', 'utf8'));
  writeGangInfo();
  writeCaps();
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const validateFiles = () => {
  var gangInfo = null;
  try {
    gangInfo = fs.readFileSync('./gangInfo.json', 'utf8')
  } catch (err) {
    console.log("No Gang Info File detected");
  }
  if(!gangInfo) {
    fs.writeFile(
      "./gangInfo.json",
      JSON.stringify({}),
      'utf8',
      function (err) {
        if (err) {
          console.log(
            "An Error occured while validating files\n      "
          );
          return console.log(err);
        }
      }    
    );
  }
  var gangMembers = null;
  try {
    gangMembers = fs.readFileSync('./gangMembers.json', 'utf8')
  } catch (err) {
    console.log("No Gang Members File detected");
  }
  if(!gangMembers) {
    fs.writeFile(
      "./gangMembers.json",
      JSON.stringify([]),
      'utf8',
      function (err) {
        if (err) {
          console.log(
            "An Error occured while validating files\n      "
          );
          return console.log(err);
        }
      }    
    );
  }
  var memberStats = null;
  try {
    memberStats = fs.readFileSync('./memberStats.json', 'utf8')
  } catch (err) {
    console.log("No member stats file detected");  
  }
  if(!memberStats) {
    fs.writeFile(
      "./memberStats.json",
      JSON.stringify([]),
      'utf8',
      function (err) {
        if (err) {
          console.log(
            "An Error occured while validating files\n      "
          );
          return console.log(err);
        }
      }    
    );
  }
  var tracked = null;
  try {
    tracked = fs.readFileSync('./trackedStats.json', 'utf8');
  } catch (err) {
    console.log("No tracked stats file detected");  
  }
  if(!tracked) {
    fs.writeFile(
      "./trackedStats.json",
      JSON.stringify(["kills","deaths","players_robbed","prison_time"]),
      'utf8',
      function (err) {
        if (err) {
          console.log(
            "An Error occured while validating files\n      "
          );
          return console.log(err);
        }
      }    
    );
  }
  var weekly = null;
  try {
    weekly = fs.readFileSync('./weeklyLeaders.json', 'utf8')
  } catch (err) {
    console.log("No weekly leader file detected");  
  }
  if(!weekly) {
    fs.writeFile(
      "./weeklyLeaders.json",
      JSON.stringify({}),
      'utf8',
      function (err) {
        if (err) {
          console.log(
            "An Error occured while validating files\n      "
          );
          return console.log(err);
        }
      }    
    );
  }

  var archive = null;
  try {
    archive = fs.readFileSync('./recordsArchive.json', 'utf8')
  } catch (err) {
    console.log("No records archive file detected");  
  }
  if(!archive) {
    fs.writeFile(
      "./recordsArchive.json",
      JSON.stringify({}),
      'utf8',
      function (err) {
        if (err) {
          console.log(
            "An Error occured while validating files\n      "
          );
          return console.log(err);
        }
      }    
    );
  }
}

client.login(process.env.TOKEN);
