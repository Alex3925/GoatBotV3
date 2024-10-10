const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "manhwa",
    aliases: ["manhwa"],
    version: "1.0",
    author: "Alex Jhon Ponce",
    countDown: 5,
    role: 0,
    longDescription: {
      vi: "",
      en: "Read Manhwa",
    },
    category: "box chat",
    guide: {
      vi: "",
      en: "{pn}",
    },
  },
  onStart: async function ({ api, commandName, event }) {
    return api.sendMessage('Search Manhwa\n--------------------------\n(Reply to this message)', event.threadID, (err, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName,
        author: event.senderID,
        messageID: info.messageID,
        type: 'search',
        pagetype: false,
        page: 1,
        searchStatus: true
      });
    }, event.messageID);
  },

  onReply: async function ({ Reply, api, event, args }) {
    try {
      const { commandName, author, messageID, type } = Reply;
      if (event.senderID != author) return;
      if (type == 'search') {
        let _page = Reply.page;
        if (Reply.pagetype == true) {
          if (args[0].toLowerCase() === 'page' && args[1] > 0) {
            _page = args[1];
          } else if (args[0].toLowerCase() === 'select' && args[1] > 0) {
            const itemIndex = args[1] - 1;
            const selectedItem = Reply.currentPageData[itemIndex];
            if (selectedItem) {
              api.setMessageReaction("", event.messageID, () => {}, true);
              const getInfo = await axios.get(`https://shiro.kuuhaku.space/manhwas/${selectedItem.id}`);
              const manhwaInfo = getInfo.data;
              const _info = `Title: ${manhwaInfo.title}\n\nDescription: ${manhwaInfo.description}\n\nCategories: ${manhwaInfo.categories.join(', ')}\nStatus: ${manhwaInfo.status}\nChapters: ${manhwaInfo.chapters.length}\n\n(Reply to this message the chapter you want to read. Ex: Read/Chapter 2/Done)`;
              const stream = await global.utils.getStreamFromURL(manhwaInfo.image);
              return api.sendMessage({ body: _info, attachment: stream }, event.threadID, (err, info) => {
                api.setMessageReaction("", event.messageID, () => {}, true);
                global.GoatBot.onReply.set(info.messageID, {
                  commandName,
                  author: author,
                  messageID: info.messageID,
                  type: 'read',
                  manhwaInfo,
                  option: false
                });
              }, event.messageID);
            } else {
              return api.sendMessage('Invalid item number', event.threadID, event.messageID);
            }
          } else if (args[0].toLowerCase() == 'done') {
            return api.unsendMessage(messageID) && api.setMessageReaction("", event.messageID, () => {}, true);
          } else {
            return api.sendMessage('Invalid input! Ex: Page 2/Select 2/Done', event.threadID, event.messageID);
          }
        }
        let resultString = [];
        let data = resultString;
        if (Reply.searchStatus == true) {
          search = event.body;
          const category = search.replace(/[\/\\:]/g, '');
          api.setMessageReaction("", event.messageID, () => {}, true);
          const result = await axios.get(`https://shiro.kuuhaku.space/manhwas?category=${category}`);
          const manhwaSearch = result.data;
          if (!manhwaSearch.length) return api.sendMessage('No results found!', event.threadID, () => { api.setMessageReaction("", event.messageID, () => {}, true); }, event.messageID);
          manhwaSearch.forEach(item => {
            resultString.push({ id: item.id, description: `Title: ${item.title}\nDescription: ${item.description}\nCategories: ${item.categories.join(', ')}\nStatus: ${item.status}\nChapters: ${item.chapters.length}\n\n` });
          });
        } else {
          resultString = Reply.resultString;
          data = Reply.resultString;
        }

        const pageSize = 5;
        const totalPages = Math.ceil(data.length / pageSize);
        let _data = '';
        let currentPageData;

                if (_page < 1 || _page > totalPages) {
          return api.sendMessage('Invalid page number!', event.threadID, event.messageID);
        }

        currentPageData = data.slice((_page - 1) * pageSize, _page * pageSize);

        _data = currentPageData.map((item, index) => {
          return `${index + 1}. ${item.description}`;
        }).join('\n');

        _data += `\n\nPage ${_page} of ${totalPages}\nType 'page <number>' to navigate or 'select <number>' to choose a manhwa`;

        api.sendMessage(_data, event.threadID, (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            author: author,
            messageID: info.messageID,
            type: 'search',
            pagetype: true,
            page: _page,
            resultString: data,
            currentPageData
          });
        }, event.messageID);
      }
    } catch (e) {
      console.error(e);
    }
  }
};
