const axios = require('axios');

module.exports = {
  config: {
    name: "jea",
    version: 1.0,
    author: "Alex",
    longDescription: "AI",
    category: "ai",
    guide: {
      en: "{p} questions",
    },
  },
  onStart: async function () {},
  onChat: async function ({ api, event, args, message }) {
    try {
      const prompt = event.body.trim();
      if (!prompt) {
        await message.reply("Hey I'm your jowa 🥰, ask me a question 😉");
        return;
      }

      // Update the API endpoint here
      const response = await axios.get(`https://ryuu-rest-apis.onrender.com/api/jea?q=${encodeURIComponent(prompt)}&id=1`);
      const answer = response.data.answer; // Adjust this if the response structure is different

      await message.reply(answer);

    } catch (error) {
      console.error("Error:", error.message);
    }
  }
};
