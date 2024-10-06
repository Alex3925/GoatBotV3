const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "spotify",
    version: "1.1.0",
    author: "AceGerome (Hiroshi API)",
    countDown: 5,
    role: 0,
    description: {
        en: "Search and play music from Spotify based on your input."
    }, 
    category: "Music", 
    guide: {
      en: "To use this command, type {pn} <song name> to search and play a track from Spotify."
    }
  },
  
  onStart: async function ({ api, event, args }) {
    try {
        const searchQuery = args.join(" ");
        if (!searchQuery) {
            return api.sendMessage("[ ❗ ] You need to specify a song to search.", event.threadID, event.messageID);
        }

        api.sendMessage("🔎 Searching for the track, please wait...", event.threadID, async (err) => {
            if (err) {
                console.error("Error sending search message:", err);
                return;
            }

            try {
                const url = "https://hiroshi-api.on" + "render.com";
                const response = await axios.get(`${url}/tiktok/spotify?search=${encodeURIComponent(searchQuery)}`);

                if (!response.data || response.data.length === 0) {
                    return api.sendMessage("❌ No tracks found. Please try again with a different song name.", event.threadID, event.messageID);
                }

                const trackData = response.data[0];
                const downloadUrl = trackData.download;

                if (!downloadUrl) {
                    return api.sendMessage("⚠️ No downloadable version found for this track.", event.threadID, event.messageID);
                }

                const trackName = trackData.name;
                const trackLink = trackData.track;
                const trackImage = trackData.image;

                api.sendMessage({
                    body: `🎵 Now playing: ${trackName}\n🔗 [Listen on Spotify](${trackLink})\n⏳ Downloading...`,
                    attachment: await this.downloadImage(trackImage)
                }, event.threadID);

                await this.downloadAndSendTrack(api, event, downloadUrl, trackName);

            } catch (error) {
                console.error("Error fetching track data:", error);
                api.sendMessage("❌ An error occurred while fetching the track. Please try again later:" + error.message, event.threadID);
            }
        });

    } catch (error) {
        console.error("Error in Spotify command:", error);
        api.sendMessage("❌ An unexpected error occurred: " + error.message, event.threadID);
    }
  },

  downloadAndSendTrack: async function (api, event, downloadUrl, trackName) {
    try {
        const downloadResponse = await axios.get(downloadUrl, { responseType: 'stream' });
        const audioPath = path.resolve(__dirname, 'tmp', 'audio.mp3');
        const writer = fs.createWriteStream(audioPath);

        downloadResponse.data.pipe(writer);

        writer.on('finish', () => {
            api.sendMessage({
                body: `🎧 Here is your track: ${trackName}`,
                attachment: fs.createReadStream(audioPath)
            }, event.threadID, () => {
                fs.unlinkSync(audioPath);
            });
        });

        writer.on('error', (error) => {
            console.error("Error writing audio file:", error);
            api.sendMessage("❌ An error occurred while downloading the track: " + error.message, event.threadID);
        });

    } catch (error) {
        console.error("Error downloading track:", error);
        api.sendMessage("❌ Failed to download the track. Please try again." + error.message, event.threadID);
    }
  },

  downloadImage: async function (imageUrl) {
    try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        const imagePath = path.resolve(__dirname, 'tmp', 'image.jpg');
        fs.writeFileSync(imagePath, buffer);
        return fs.createReadStream(imagePath);
    } catch (error) {
        console.error("Error downloading image:", error);
        return null;
    }
  }
};
