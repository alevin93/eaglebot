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
const gang_id = '25546'
const channel_id = '1061443428925317213'
const guild_id = '1061443428392636477'
const prefix = "!";

var capsData = [];

var giUpdated = null;
var gmUpdated = null;
var startingAmount = 1;
var splitFlag = false;
var participants = [];
var gangMemberLink =
  "https://stats.olympus-entertainment.com/api/v3.0/players/?player_ids=";

// -------------- CRON JOBS ------------- //

//end of week jobs
cron.schedule("30 * 0 * * 1", () => {
  startUp();
  sleep(10000);
  archiveStats();
  recordWeekStats();
})

//constant jobs
cron.schedule("0 */4 * * * *", () => {
  writeGangInfo();
});

cron.schedule("4 */8 * * * *", () => {
  writeGangMemberInfo();
});

cron.schedule("8 */8 * * * *", () => {
  updateAllStats();
});

// cron.schedule("*/1 * * * *", () => {
//   writeCaps();
// });


// ---------- MAIN FUNCTION ----------- //
client.on("messageCreate", (message) => {

  const args = message.content.slice(prefix.length).split("/ +/");
  const temp = args.shift().toLowerCase();
  const command = temp.split(" ")

  if (command[0] === "check") {
    checkCaps();
    //console.log(message);
  }
  // if (command[0] === "caps") {
  //   getCaps(message);
  // }
  // if (command[0] === "floppa") {
  //   floppaImg(message);
  // }
  // if (command[0] === "help") {
  //   helpMessage(message);
  // }
  // if (command[0] === "gang") {
  //   if(command[1] === "roster") {
  //     getRoster(message);
  //   } else {
  //     gangEmbed(message);
  //   }
  // }
  // if (command[0] === "stats") {
  //   if(command[1] === "add" || command[1] === "remove" || command[1] === "options") {
  //     editTracked(message, command[1], command[2]);
  //   }
  //   else if(command[1]) {
  //     var playerName = "";
  //     for(let i = 1; i < command.length; i++) {
  //       playerName = `${playerName}` + `${command[i]}`;
  //       console.log(playerName)
  //     }
  //     getMemberStats(message, playerName)
  //   } 
  //   else {
  //     getWeeklyStats(message);
  //   }
  // }
  // if (command[0] === "last") {
  //   getLastWeekStats(message);
  // }
  // if (command[0] === "record" || command[0] === "records") {
  //   getRecordStats(message);
  // }
  // if (command[0] === "startcap") {
  //   startCartel(message);
  // }
  // if (command[0] === "endcap") {
  //   endCartel(message);
  // }
  // if (command[0] === "iron") {
  //   if(command[1]) {
  //     checkMemberLedger(message, command[1]);
  //   }
  //   else {
  //     checkIronLedger(message);
  //   }
  // }
  // if (command[0] === "test") {
  //   //writeGangMemberInfo();
  //   checkCapsdata();
  // }
  // if (command[0] === "fetch"){
    
  //   writeGangInfo();
  //  }
  // if (command[0] === "update"){
  //   updateAllStats();
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
    console.log(members.length);
    var roster = [];
    for(let i = 0; i < members.length; i++) {
      if(!members[i] || members[i] === "") { continue; }
      roster =  roster + `${members[i].name} - `;
      if(!roster[i] || roster[i] === "") {
        roster.pop(i);
      }
    }
    console.log(roster);
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

// --------- POST STATS FUNCTIONS ---------//

const getWeeklyStats = (message) => {
  delete require.cache[require.resolve('./weeklyLeaders.json')];
  delete require.cache[require.resolve('./trackedStats.json')];
  json = require('./weeklyLeaders.json');
  const tracked = require('./trackedStats.json');
  fs.readFile('./weeklyLeaders.json', 'utf8', (err, tempJson) => {
    if (err) {
       console.log(err);
    }
    else {
      fs.readFile('./trackedStats.json', 'utf8', (err, tempTracked) => {
        if (err) {
           console.log(err);
        }
        else {

          const json = JSON.parse(tempJson);
          const tracked = JSON.parse(tempTracked);
  console.log(json);
  console.log(tracked);
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
    .setTitle("This Weeks Best Stats")
    .addFields(fields)
    .setColor(0x591017)
    .setFooter({
      text: `Last Update: ${gmUpdated}`,
    });
  console.log("Get Weekly Stats Run.");
  message.channel.send({ embeds: [weeklyStatsEmbed] });
        }
      })
    }
  })
};

const getLastWeekStats = (message) => {
  delete require.cache[require.resolve('./lastWeekLeaders.json')];
  delete require.cache[require.resolve('./trackedStats.json')];
  const json = require('./lastWeekLeaders.json');
  const tracked = require('./trackedStats.json');
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
      text: ``,
    });
  message.channel.send({ embeds: [weeklyStatsEmbed] });
};

const getRecordStats = (message) => {
  delete require.cache[require.resolve('./weeklyLeaders.json')];
  delete require.cache[require.resolve('./trackedStats.json')];
  delete require.cache[require.resolve('./recordsArchive.json')];
  const json = require('./weeklyLeaders.json');
  const tracked = require('./trackedStats.json');
  const records = require('./recordsArchive.json');
  //building fields
  fields = []
  counter = 0;
  for(let i = 0; i < tracked.length; i++) {
    if(!json[tracked[i]].holder || !json[tracked[i]].value) { continue; }
    fields[i] = {
      name: `${tracked[i].toUpperCase().replace('_',' ')}`,
      value: `${json[tracked[i]].holder}` + '```' +  `${tracked[i] === 'bank'? formatter.format(json[tracked[i]].record) : json[tracked[i]].record}` + '```',
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
  delete require.cache[require.resolve('./memberStats.json')];
  delete require.cache[require.resolve('./trackedStats.json')];
  const json = require('./memberStats.json');
  const tracked = require('./trackedStats.json');
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
    .setColor(0x0f14b8)
    .setFooter({
      text: `Last Update: ${gmUpdated}`,
    });
  message.channel.send({ embeds: [weeklyStatsEmbed] });
}

const editTracked = async (message, command, stat) => {
  if(message.author.id === '288445122947973121' || message.author.id === slayer_id) {
    // delete require.cache[require.resolve('./weekCounter.json')];
    // delete require.cache[require.resolve('./gangMembers.json')];
    // const weekCounter = require('./weekCounter.json');
    // const gangMemberFile = require('./gangMembers.json');
    fs.readFile('./weekCounter.json', 'utf8', (err, tempWeekCounter) => {
      if (err) {
         console.log(err);
      }
      else {
        fs.readFile('./gangMembers.json', 'utf8', (err, tempGangMembers) => {
          if (err) {
             console.log(err);
          }
          else {
            gangMemberFile = JSON.parse(tempGangMembers);
            weekCounter = JSON.parse(tempWeekCounter);
    var statList = []
    for(let i = 0; i < Object.keys(gangMemberFile[0]).length; i++) {
      statList[i] = Object.keys(gangMemberFile[0])[i]
    }
    for(let i = 0; i < Object.keys(gangMemberFile[0].stats).length; i++) {
      statList[i + Object.keys(gangMemberFile[0]).length] = Object.keys(gangMemberFile[0].stats)[i]
    }
    delete require.cache[require.resolve('./trackedStats.json')];
    delete require.cache[require.resolve('./gangMembers.json')];
    //let tracked = require('./trackedStats.json');
    //let after = require('./gangMembers.json');
    fs.readFile('./trackedStats.json', 'utf8', (err, tempTracked) => {
      if (err) {
         console.log(err);
      }
      else {
        fs.readFile('./gangMembers.json', 'utf8', (err, tempGangMembers) => {
          if (err) {
             console.log(err);
          }
          else {
            var tracked = JSON.parse(tempTracked);
            var after = JSON.parse(tempGangMembers);
    let foundFlag = false;
    console.log(weekCounter);
    delete require.cache[require.resolve(`./archive/${weekCounter[0]}`)];
    before = require(`./archive/${weekCounter[0]}`);
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
    let result = calculateStatistics(tracked, before, after);
    updateLeaders(result, tracked);
          }
        })
      }
    })
  }
})
      }
    })
  }
  else {
    message.channel.send("Access denied!  Ask Slayr.");
  }
}

const removeRecord = async (stat) => {
  // delete require.cache[require.resolve('./recordsArchive.json')];
  // delete require.cache[require.resolve('./weeklyLeaders.json')];
  // const archive = require('./recordsArchive.json');
  // const leaders = require('./weeklyLeaders.json');

  fs.readFile('./weeklyLeaders.json', 'utf8', (err, tempLeaders) => {
    if (err) {
       console.log(err);
    }
    else {
      fs.readFile('./recordsArchive.json', 'utf8', (err, tempArchive) => {
        if (err) {
           console.log(err);
        }
        else {

          var leaders = JSON.parse(tempLeaders);
          var archive = JSON.parse(tempArchive);

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
      })
    }
  })
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
        console.log("cartel info updated!")
        //checkCaps(cartelInfo);
      }
    );
  });
};

const checkCaps = async () => {
  fs.readFile('./cartelInfo.json', 'utf8', (err, tempCartelInfo) => {
    if (err) {
       console.log(err);
    }
    else {
      fs.readFile('./capsData.json', 'utf8', (err, tempCapsData) => {
        if (err) {
           console.log(err);
        }
        else {
          let cartelInfo = JSON.parse(tempCartelInfo);
          let capsData = JSON.parse(tempCapsData);
  for(let i = 0; i < capsData.length; i++) {
    for(let j = 0; j < cartelInfo.length; j++) {
      if(cartelInfo[j].server === capsData[i].server && cartelInfo[j].name === capsData[i].name) {
        if(cartelInfo[j].gang_id !== gang_id) {
          lostCap(capsData, i);
        }
      }
    }
  }
  for(let i = 0; i < cartelInfo.length; i++) {
    if(cartelInfo[i].gang === gang_id) {
      for(let j = 0; j < capsData.length; j++) {
        if(cartelInfo[i].server === capsData[j].server && cartelInfo[i].name === capsData[j].name) {
          console.log(`Holding ${capsData[j].name} cartel on server ${capsData[j].server}`)
        } else {
          gainedCap(cartelInfo[i].name, cartelInfo[i].server);
        }
      }
    }
  }
        }
      })
    }
  });
}

const gainedCap = async (name, server) => {
  const channel = client.channels.cache.get(channel_id);
    //users = [];
    fs.readFile('./cartelInfo.json', 'utf8', (err, tempCartelInfo) => {
      if (err) {
         console.log(err);
      }
      else {
        fs.readFile('./cartelInfo.json', 'utf8', (err, tempCartelInfo) => {
          if (err) {
             console.log(err);
          }
          else {
    capsData[capsData.length] = {
      cartel: name,
      server: server,
      time: currentDate(0),
      message: null,
      users: [],
    }
    const embed = new EmbedBuilder()
      .setColor('0x3b2927')
      .setTitle('Starting Capture of ```' + `${name}` + '``` on server ```' + `${server}` + '```')
      .addFields({
        name: name,
        value: `Server ${server}`
      })
      .setDescription('React to the message if you are involved!');
    
    channel.send({embeds : [embed]}).then((embedMsg) => {
      embedMsg.react("🔺");

      capsData[`${name}${server}`].message = embedMsg;

      const participating = new EmbedBuilder()
      .setColor('0x3b2927')
      .setTitle('Capture of ```' + `${name}` + '``` on server ```' + `${server}` + '```')
      .addFields({
        name: " ",
        value: " "
      })
      .setDescription('The Following are Participants:')
      .setFooter({
        text: `${currentDate(2)}`
      })

      channel.send({ embeds: [participating]}).then( emb => {
        
        client.on('messageReactionAdd', (reaction, user) => {
          if(user.id === embedMsg.author) {return;}
          if(capsData[`${name}${server}`].message.id === embedMsg.id) {
            capsData[`${name}${server}`].users.push(user.username);



            participating.addFields({
              name: `${user.username}`,
              value: " ",
              inline: true
            })

            emb.edit({ embeds: [participating]})
          }
        })
      })
    })
    await sleep(5000);

    capsData[`${name}${server}`].message.delete();

    fs.writeFile('./capsData.json', JSON.stringify(capsData), "utf8", () => {});

}

const lostCap = (data, index) => {

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
        giUpdated = currentDate(2);
        gangMemberLink =
          "https://stats.olympus-entertainment.com/api/v3.0/players/?player_ids=";
        console.log("gangInfo.json updated");
      }
    );
  });
};

const writeGangMemberInfo = async () => {
    delete require.cache[require.resolve('./gangInfo.json')];
    let gangInfoFile = require('./gangInfo.json');
    
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
  delete require.cache[require.resolve('./gangMembers.json')];
  delete require.cache[require.resolve('./weekCounter.json')];
  const gangMemberFile = require('./gangMembers.json');
  const weekNumber = require('./weekCounter.json');
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

const startCartel = async (message) => {
  delete require.cache[require.resolve('./gangInfo.json')];
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
  delete require.cache[require.resolve('./gangInfo.json')];
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

//

// ----------- STATISTICS CALCULATION FUNCTIONS ------------- //

const recordWeekStats = () => {
  delete require.cache[require.resolve('./weeklyLeaders.json')];
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
    delete require.cache[require.resolve('./weeklyLeaders.json')];
    var leaderboard = require('./weeklyLeaders.json');
  } catch (err) { console.log(err); }
  if(!leaderboard) { leaderboard = {};}
  delete require.cache[require.resolve('./recordsArchive.json')];
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
  delete require.cache[require.resolve('./archive/0.json')]
  delete require.cache[require.resolve('./gangMembers.json')]
  delete require.cache[require.resolve('./trackedStats.json')]
  console.log("Week Counter: " + weekCounter);
  const before = require(`./archive/0.json`);
  const after = require('./gangMembers.json');
  const tracked = require('./trackedStats.json');

  

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
  delete require.cache[require.resolve('./weekCounter.json')]
  week = require('./weekCounter.json');
  weekCounter = week[0];
  validateFiles();
  //writeGangInfo();
  //await sleep(5000);
  //writeGangMemberInfo();
  //await sleep(10000);
  updateAllStats();
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const validateFiles = () => {
  var gangInfo = null;
  try {
    gangInfo = require('./gangInfo.json')
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
  if(require.cache[require.resolve('./gangInfo.json')]) {
    delete require.cache[require.resolve('./gangInfo.json')]
  }
  var gangMembers = null;
  try {
    gangMembers = require('./gangMembers.json')
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
  if(require.cache[require.resolve('./gangMembers.json')]) {
    delete require.cache[require.resolve('./gangMembers.json')]
  }
  var memberStats = null;
  try {
    memberStats = require('./memberStats.json')
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
  if(require.cache[require.resolve('./memberStats.json')]) {
    delete require.cache[require.resolve('./memberStats.json')]
  }
  var tracked = null;
  try {
    tracked = require('./trackedStats.json')
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
  if(require.cache[require.resolve('./trackedStats.json')]) {
    delete require.cache[require.resolve('./trackedStats.json')]
  }

  var weekly = null;
  try {
    weekly = require('./weeklyLeaders.json')
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
  if(require.cache[require.resolve('./weeklyLeaders.json')]) {
    delete require.cache[require.resolve('./weeklyLeaders.json')]
  }

  var archive = null;
  try {
    archive = require('./recordsArchive.json')
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
  if(require.cache[require.resolve('./recordsArchive.json')]) {
    delete require.cache[require.resolve('./recordsArchive.json')]
  }
}

client.login(process.env.TOKEN);
