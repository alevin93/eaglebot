const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');

require('dotenv/config');


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
})

client.on('ready', () => {
    console.log('FloppaBot Activated');
})

// ---------- MAIN FUNCTION ----------- //
client.on('messageCreate', message => {
    if (message.content === '!caps') {
        getCaps(message);
    }
    if (message.content === '!floppa') {
        floppaImg(message);
    }
    if (message.content === '!help') {
        helpMessage(message);
    }
})

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
    .setFooter(
        {
            text: 
            "Please submit bug reports to Nman#3327 on discord, or tag @FloppaDev"
        }
    );
    message.author.send({ embeds: [helpEmbed]});
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
        message.channel.send({ embeds: [cartelEmbed]})
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
    message.channel.send({ embeds: [floppaEmbed]});
    });
  };

client.login(process.env.TOKEN)