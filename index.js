const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const gangInfoFile = require("./gangInfo.json");
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

var startingAmount = 1;
var splitFlag = false;
var participants = [];
var gangMemberLink =
  "https://stats.olympus-entertainment.com/api/v3.0/players/?player_ids=";

//-------------- CRON JOBS ------------- //
cron.schedule("*/4 * * * *", () => {
  writeGangInfo();
});

cron.schedule("*/10 * * * * ", () => {
  writeGangMemberInfo();
});

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
});
//----------- GANG FUNCTION ------------ //
const gangEmbed = (message) => {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
  const statsEmbed = new EmbedBuilder()
    .setTitle("Comp Or Ban")
    .setThumbnail(
      "https://i.imgur.com/BHLmQck.jpeg"
    )
    .setUrl("https://stats.olympus-entertainment.com/#/stats/gangs/25546")
    .addFields(
      {
        name: "Gang Funds",
        value: formatter.format(gangInfoFile.bank),
        inline: true,
      },
      {
        name: "War Kills",
        value: gangInfoFile.kills,
        inline: true,
      },
      {
        name: "War Deaths",
        value: gangInfoFile.deaths,
        inline: true,
      }
    )
    .setFooter({ text: "The iron mines must be protected"});
    message.channel.send({ embeds: [statsEmbed] });
    //hopefully this works????

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
  });
};

const writeGangMemberInfo = async () => {
  try {
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
    });
  } catch (err) {
    console.log("Error Writing gangMembers.json:  \n    " + err);
  }
};

const archiveStats = () => {};

// ----------- IRON TAX FUNC ------------- //

client.login(process.env.TOKEN);
