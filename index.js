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
});

var gangInfoFile = require("./gangInfo.json");
var gangMemberFile = require('./gangMembers.json');
const leaders = require('./weeklyLeaders.json');

var weekCounter = 1;
var startingAmount = 1;
var splitFlag = false;
var participants = [];
var gangMemberLink =
  "https://stats.olympus-entertainment.com/api/v3.0/players/?player_ids=";

//-------------- CRON JOBS ------------- //
// cron.schedule("30 */5 * * * * *", () => {
//   archiveStats();
// })

// cron.schedule("45 */10 * * * * *", () => {
//   recordWeekStats();
// })

// cron.schedule("1 */5 * * * *", () => {
//   writeGangInfo();
// });

// cron.schedule("10 */5 * * * * ", () => {
//   writeGangMemberInfo();
// });

// ---------- MAIN FUNCTION ----------- //
client.on("messageCreate", (message) => {
  if (message.content === "!caps") {
    getCaps(message);
  }
  if (message.content === "!floppa") {
    floppaImg(message);
  }
  if (message.content === "!help") {
    helpMessage(message);
  }
  if (message.content === "!gang") {
    gangEmbed(message);
  }
  if (message.content === "!fetch"){
    writeGangMemberInfo();
  }
  if (message.content === "!record"){
    archiveStats();
  }
  if (message.content === "!stats") {
    weekCounter = 2;
    recordWeekStats();
  }
});

//----------- GANG FUNCTION ------------ //
const gangEmbed = (message) => {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
  console.log(gangInfoFile.bank)
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
    let gangInfoFile = require('./gangInfo.json');
  });
};

const writeGangMemberInfo = async () => {

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
        }
      );
      let gangMemberFile = require("./gangMembers.json");
    });
};

const archiveStats = () => {
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

// ----------- STATISTICS CALCULATION FUNCTIONS ------------- //

const recordWeekStats = () => {
  var data;
  let skip = [2000];
  let offset = 0;
  if(weekCounter === 1) {
    let data = require(`./archive/52.json"}`);
  } else {
    let data = require(`./archive/1.json`);
  }

  json = data;
  console.log(json);

  for(let i = 0; i < gangMemberFile.length; i++) {
    
    if(skip.includes(i)) { continue; }  // If i has been added to skip array (already counted that player), skip iteration

    

    if(json[i+offset].player_id === gangMemberFile[i].player_id) {

      let wkills = gangMemberFile[i].kills - json[i+offset].kills;
      let wdeaths = gangMemberFile[i].deaths - json[i+offset].deaths;
      let wprison = gangMemberFile[i].stats.prison_time - json[i+offset].stats.prison_time;
      let wrobbed = gangMemberFile[i].stats.players_robbed - json[i+offset].stats.players_robbed;

      for (let j = 0; j < gangMembers.length; j++) {
        if(gangMemberFile[j].name === gangMemberFile[i].name && gangMemberFile[j].player_id !== gangMemberFile[i].player_id) {
          let wkills =  wkills + (gangMemberFile[j].kills - json[j+offset].kills);
          let wdeaths = wdeaths + (gangMemberFile[j].deaths - json[j+offset].deaths);
          let wprison = wprison + (gangMemberFile[j].stats.prison_time - json[j+offset].stats.prison_time);
          let wrobbed = wrobbed + (gangMemberFile[j].stats.players_robbed - json[j+offset].stats.players_robbed);

          skip.push(j);
        }
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
  console.log("Leaders Updated!");
}


client.login(process.env.TOKEN);
