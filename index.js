require('dotenv').config()

const MongoClient = require('mongodb').MongoClient

MongoClient(process.env.mongo, { useUnifiedTopology: true, useNewUrlParser: true }).connect((err, DB) => {
  if (err) throw err;
  console.log("Sucessfully conected to DB!")
  const Discord = require("discord.js");
  const client = new Discord.Client({
    fetchAllMembers: true
  });

  const Database = DB.db('Main')
  const servers = Database.collection('Servers')
  const users = Database.collection('Users')
  const logs = Database.collection('Logs')

  const Shards = DB.db('Shards')

  const cooldown = new Set();

  const express = require("express")
  const app = express()
  app.listen(3001)

  const DBL = require("dblapi.js");

  const { clean, isZalgo } = require("unzalgo")
  const arrayChunks = require('array-splitter-chunks');
  const axios = require('axios')
  const urlencode = require('urlencode');
  const bodyParser = require('body-parser');
  const translate = require("googletrans").default;
  app.use(bodyParser.json());

  app.use((req, res) => {
    res.json({
      "servers": client.guilds.cache.size.toString(), "users": client.users.cache.size.toString()
    });
  });

  app.all("/", (req, res) => {
    res.send("Ping pong!")
  })

  app.all("/ping/", (req, res) => {
    res.json({ ping: `${client.ws.ping}` })
  });

  app.post("/newmessage", (req, res) => {
    res.send("recieved and processed!")
    //sendothermessage({ content: req.body.content }, req.body.authorID)
  })

  app.post("/newvote", async (req, res) => {
    if (req.headers.authorization !== "password") {
      res.status(403).send("FORBIDDEN")
      return
    }
    res.send("ok")
    let user = await client.users.fetch(req.body.user)
    systemmessage(`${user.tag} just voted for the bot on [top.gg](https://top.gg/bot/795789348846305290/)`, client.user)
  })

  let wordblacklist = ["nude", "horny", "penis"]

  setInterval(() => {
    logs.find().forEach(data => {
      let time = Date.now() - 86400000
      if (data.timestamp < time) {
        logs.deleteOne({
          timestamp: data.timestamp
        })
      }
    })
  }, 10000)

  function logaction(action, user) {
    logs.insertOne({
      id: `${user.id}`,
      action: action,
      timestamp: Date.now()
    })
  }

  function systemmessage(message, author) {
    users.findOne({ id: author.id }).then(user => {
      Shards.collection('1').find().forEach(data => {
        if (client.channels.cache.get(data.channel) == undefined) {
          servers.updateOne({
            id: data.id
          }, {
              $set: {
                verified: "false",
                agree: "false",
                connected: "0",
                shard: "1"
              }
            }, { upsert: true })
          Shards.collection('1').deleteOne({
            channel: data.channel
          })
          return
        }
        client.channels.cache.get(data.channel).send({
          embed: {
            color: 16711680,
            author: {
              name: "System Message",
              iconURL: author.avatarURL()
            },
            description: message,
            footer: {
              iconURL: client.user.avatarURL(),
              text: "Official Bot!"
            }
          }
        }).catch(error => {
          Shards.collection('1').deleteOne({
            channel: data.channel
          })
          servers.updateOne({
            id: data.id
          }, {
              $set: {
                verified: "false",
                agree: "false",
                connected: "0",
                shard: "1"
              }
            }, { upsert: true })
        })
      })
    })
  }


  function attachmentmessage(message, author) {
    client.channels.cache.get("794692648538734603").send(new Discord.MessageAttachment(message.attachments.first().url)).then(async res => {
      let attachment = res.attachments.first()
      let checkmessage = clean(message.content).toLowerCase()
      let untranslated = clean(message.content)
      let newmessage = untranslated
      if (newmessage.length > 500) {
        author.send("Hey! Your message had to many characters!")
        return
      }
      if (newmessage.includes("discord.gg")) {
        author.send("Hey! No invites in global chat!")
        return
      }
      if (cooldown.has(author.id)) {
        author.send("Hey! You are sending messages too fast!!")
        return
      }
      users.findOne({ id: author.id }).then(user => {
        if (user == null) {
          cooldown.add(author.id);
          setTimeout(() => {
            cooldown.delete(author.id)
          }, 2500)
          Shards.collection('1').find().forEach(data => {
            if (client.channels.cache.get(data.channel) == undefined) {
              servers.updateOne({
                id: data.id
              }, {
                  $set: {
                    verified: "false",
                    agree: "false",
                    connected: "0",
                    shard: "1"
                  }
                }, { upsert: true })
              Shards.collection('1').deleteOne({
                channel: data.channel
              })
              return
            }
            client.channels.cache.get(data.channel).send({
              embed: {
                color: 4964331,
                author: {
                  name: author.tag,
                  iconURL: author.avatarURL()
                },
                description: newmessage,
                image: {
                  url: attachment.url
                },
                footer: {
                  iconURL: user.rankimage,
                  text: user.rank
                }
              }
            }).catch(error => {
              Shards.collection('1').deleteOne({
                channel: data.channel
              })
              servers.updateOne({
                id: data.id
              }, {
                  $set: {
                    verified: "false",
                    agree: "false",
                    connected: "0",
                    shard: "1"
                  }
                }, { upsert: true })
            })
          })
          setTimeout(() => {
            message.delete()
          }, 150)
          users.updateOne({
            id: author.id
          }, {
              $set: {
                rank: "User",
                rankimage: "https://cdn.discordapp.com/emojis/661003964707242021.png?v=1",
                banned: "false"
              }
            }, { upsert: true })
          return
        }
        if (user.rank === "Developer") {
          Shards.collection('1').find().forEach(data => {
            if (client.channels.cache.get(data.channel) == undefined) {
              Shards.collection('1').deleteOne({
                channel: data.channel
              })
              servers.updateOne({
                id: data.id
              }, {
                  $set: {
                    verified: "false",
                    agree: "false",
                    connected: "0",
                    shard: "1"
                  }
                }, { upsert: true })
              return
            }
            client.channels.cache.get(data.channel).send({
              embed: {
                color: 4964331,
                author: {
                  name: author.tag,
                  iconURL: author.avatarURL()
                },
                description: newmessage,
                image: {
                  url: attachment.url
                },
                footer: {
                  iconURL: user.rankimage,
                  text: user.rank
                }
              }
            }).catch(error => {
              Shards.collection('1').deleteOne({
                channel: data.channel
              })
              servers.updateOne({
                id: data.id
              }, {
                  $set: {
                    verified: "false",
                    agree: "false",
                    connected: "0",
                    shard: "1"
                  }
                }, { upsert: true })
            })
          })
          setTimeout(() => {
            message.delete()
          }, 150)
          return
        }
        if (user.rank === "Chat Moderator") {
          Shards.collection('1').find().forEach(data => {
            if (client.channels.cache.get(data.channel) == undefined) {
              Shards.collection('1').deleteOne({
                channel: data.channel
              })
              servers.updateOne({
                id: data.id
              }, {
                  $set: {
                    verified: "false",
                    agree: "false",
                    connected: "0",
                    shard: "1"
                  }
                }, { upsert: true })
              return
            }
            client.channels.cache.get(data.channel).send({
              embed: {
                color: 4964331,
                author: {
                  name: author.tag,
                  iconURL: author.avatarURL()
                },
                description: newmessage,
                image: {
                  url: attachment.url
                },
                footer: {
                  iconURL: user.rankimage,
                  text: user.rank
                }
              }
            }).catch(error => {
              Shards.collection('1').deleteOne({
                channel: data.channel
              })
              servers.updateOne({
                id: data.id
              }, {
                  $set: {
                    verified: "false",
                    agree: "false",
                    connected: "0",
                    shard: "1"
                  }
                }, { upsert: true })
            })
          })
          setTimeout(() => {
            message.delete()
          }, 150)
          return
        }


        cooldown.add(author.id);
        setTimeout(() => {
          cooldown.delete(author.id)
        }, 2500)
        if (user.banned === "true") {
          author.send("Hey! You are banned from global chat! Please join our support server if you want to appeal!")
          return
        }
        Shards.collection('1').find().forEach(data => {
          if (client.channels.cache.get(data.channel) == undefined) {
            Shards.collection('1').deleteOne({
              channel: data.channel
            })
            servers.updateOne({
              id: data.id
            }, {
                $set: {
                  verified: "false",
                  agree: "false",
                  connected: "0",
                  shard: "1"
                }
              }, { upsert: true })
            return
          }
          client.channels.cache.get(data.channel).send({
            embed: {
              color: 4964331,
              author: {
                name: author.tag,
                iconURL: author.avatarURL()
              },
              description: newmessage,
              image: {
                url: attachment.url
              },
              footer: {
                iconURL: user.rankimage,
                text: user.rank
              }
            }
          }).catch(error => {
            Shards.collection('1').deleteOne({
              channel: data.channel
            })
            servers.updateOne({
              id: data.id
            }, {
                $set: {
                  verified: "false",
                  agree: "false",
                  connected: "0",
                  shard: "1"
                }
              }, { upsert: true })
          })
        })
        setTimeout(() => {
          message.delete()
        }, 150)
      })
    })
  }

  function sendothermessage(message, author) {
    let checkmessage = clean(message.content).toLowerCase()
    let newmessage = clean(message.content)
    users.findOne({ id: author }).then(user => {
      if (user == null) {
        Shards.collection('1').find().forEach(data => {
          if (client.channels.cache.get(data.channel) == undefined) {
            Shards.collection('1').deleteOne({
              channel: data.channel
            })
            servers.updateOne({
              id: data.id
            }, {
                $set: {
                  verified: "false",
                  agree: "false",
                  connected: "0",
                  shard: "1"
                }
              }, { upsert: true })
            return
          }
          client.channels.cache.get(data.channel).send({
            embed: {
              color: 4964331,
              author: {
                name: author.tag,
                iconURL: author.avatarURL
              },
              description: message.content,
              footer: {
                iconURL: "https://cdn.discordapp.com/emojis/793005530514849863.png?v=1",
                text: `${author.username}'s First Message!`
              }
            }
          }).catch(error => {
            Shards.collection('1').deleteOne({
              channel: data.channel
            })
            servers.updateOne({
              id: data.id
            }, {
                $set: {
                  verified: "false",
                  agree: "false",
                  connected: "0",
                  shard: "1"
                }
              }, { upsert: true })
          })
        })
        users.updateOne({
          id: author
        }, {
            $set: {
              rank: "User",
              rankimage: "https://cdn.discordapp.com/emojis/661003964707242021.png?v=1",
              banned: "false"
            }
          }, { upsert: true })
        return
      }
      if (user.rank === "Developer") {
        Shards.collection('1').find().forEach(data => {
          if (client.channels.cache.get(data.channel) == undefined) {
            Shards.collection('1').deleteOne({
              channel: data.channel
            })
            servers.updateOne({
              id: data.id
            }, {
                $set: {
                  verified: "false",
                  agree: "false",
                  connected: "0",
                  shard: "1"
                }
              }, { upsert: true })
            return
          }
          client.channels.cache.get(data.channel).send({
            embed: {
              color: 4964331,
              author: {
                name: author.tag,
                iconURL: author.avatarURL
              },
              description: newmessage,
              footer: {
                iconURL: user.rankimage,
                text: user.rank + " | message from partnered bot!"
              }
            }
          }).catch(error => {
            Shards.collection('1').deleteOne({
              channel: data.channel
            })
            servers.updateOne({
              id: data.id
            }, {
                $set: {
                  verified: "false",
                  agree: "false",
                  connected: "0",
                  shard: "1"
                }
              }, { upsert: true })
          })
        })
        return
      }
      if (user.rank === "Chat Moderator") {
        Shards.collection('1').find().forEach(data => {
          if (client.channels.cache.get(data.channel) == undefined) {
            Shards.collection('1').deleteOne({
              channel: data.channel
            })
            servers.updateOne({
              id: data.id
            }, {
                $set: {
                  verified: "false",
                  agree: "false",
                  connected: "0",
                  shard: "1"
                }
              }, { upsert: true })
            return
          }
          client.channels.cache.get(data.channel).send({
            embed: {
              color: 4964331,
              author: {
                name: author.tag,
                iconURL: author.avatarURL
              },
              description: newmessage,
              footer: {
                iconURL: user.rankimage,
                text: user.rank + " | message from partnered bot!"
              }
            }
          }).catch(error => {
            Shards.collection('1').deleteOne({
              channel: data.channel
            })
            servers.updateOne({
              id: data.id
            }, {
                $set: {
                  verified: "false",
                  agree: "false",
                  connected: "0",
                  shard: "1"
                }
              }, { upsert: true })
          })
        })
        return
      }
      if (user.banned === "true") {
        author.send("Hey! You are banned from global chat! Please join our support server if you want to appeal!")
        return
      }
      Shards.collection('1').find().forEach(data => {
        if (client.channels.cache.get(data.channel) == undefined) {
          Shards.collection('1').deleteOne({
            channel: data.channel
          })
          servers.updateOne({
            id: data.id
          }, {
              $set: {
                verified: "false",
                agree: "false",
                connected: "0",
                shard: "1"
              }
            }, { upsert: true })
          return
        }
        client.channels.cache.get(data.channel).send({
          embed: {
            color: 4964331,
            author: {
              name: author.tag,
              iconURL: author.avatarURL
            },
            description: message.content,
            footer: {
              iconURL: user.rankimage,
              text: user.rank + " | message from partnered bot!"
            }
          }
        }).catch(error => {
          Shards.collection('1').deleteOne({
            channel: data.channel
          })
          servers.updateOne({
            id: data.id
          }, {
              $set: {
                verified: "false",
                agree: "false",
                connected: "0",
                shard: "1"
              }
            }, { upsert: true })
        })
      })
    })
  }


  async function sendmessage(message, author) {
    let checkmessage = clean(message.content).toLowerCase()
    let untranslated = clean(message.content)
    let translated = await translate(untranslated)
    let newmessage = translated.text
    if (newmessage.length > 500) {
      author.send("Hey! Your message had to many characters!")
      return
    }
    if (newmessage.includes("discord.gg")) {
      author.send("Hey! No invites in global chat!")
      return
    }
    if (cooldown.has(author.id)) {
      author.send("Hey! You are sending messages too fast!!")
      return
    }
    users.findOne({ id: author.id }).then(user => {
      if (user == null) {
        if (newmessage.includes("http")) {
          author.send("Hey! We don't allow links in global chat!")
          return
        }
        cooldown.add(author.id);
        setTimeout(() => {
          cooldown.delete(author.id)
        }, 2500)
        Shards.collection('1').find().forEach(data => {
          if (client.channels.cache.get(data.channel) == undefined) {
            Shards.collection('1').deleteOne({
              channel: data.channel
            })
            servers.updateOne({
              id: data.id
            }, {
                $set: {
                  verified: "false",
                  agree: "false",
                  connected: "0",
                  shard: "1"
                }
              }, { upsert: true })
            return
          }
          client.channels.cache.get(data.channel).send({
            embed: {
              color: 4964331,
              author: {
                name: author.tag,
                iconURL: author.avatarURL()
              },
              description: message.content,
              footer: {
                iconURL: "https://cdn.discordapp.com/emojis/793005530514849863.png?v=1",
                text: `${message.author.username}'s First Message!`
              }
            }
          }).catch(error => {
            Shards.collection('1').deleteOne({
              channel: data.channel
            })
            servers.updateOne({
              id: data.id
            }, {
                $set: {
                  verified: "false",
                  agree: "false",
                  connected: "0",
                  shard: "1"
                }
              }, { upsert: true })
          })
        })
        users.updateOne({
          id: author.id
        }, {
            $set: {
              rank: "User",
              rankimage: "https://cdn.discordapp.com/emojis/661003964707242021.png?v=1",
              banned: "false"
            }
          }, { upsert: true })
        return
      }
      if (user.rank === "Developer") {
        Shards.collection('1').find().forEach(data => {
          if (client.channels.cache.get(data.channel) == undefined) {
            Shards.collection('1').deleteOne({
              channel: data.channel
            })
            servers.updateOne({
              id: data.id
            }, {
                $set: {
                  verified: "false",
                  agree: "false",
                  connected: "0",
                  shard: "1"
                }
              }, { upsert: true })
            return
          }
          client.channels.cache.get(data.channel).send({
            embed: {
              color: 4964331,
              author: {
                name: author.tag,
                iconURL: author.avatarURL()
              },
              description: newmessage,
              footer: {
                iconURL: user.rankimage,
                text: user.rank
              }
            }
          }).catch(error => {
            Shards.collection('1').deleteOne({
              channel: data.channel
            })
            servers.updateOne({
              id: data.id
            }, {
                $set: {
                  verified: "false",
                  agree: "false",
                  connected: "0",
                  shard: "1"
                }
              }, { upsert: true })
          })
        })
        return
      }
      if (user.rank === "Chat Moderator") {
        Shards.collection('1').find().forEach(data => {
          if (client.channels.cache.get(data.channel) == undefined) {
            Shards.collection('1').deleteOne({
              channel: data.channel
            })
            servers.updateOne({
              id: data.id
            }, {
                $set: {
                  verified: "false",
                  agree: "false",
                  connected: "0",
                  shard: "1"
                }
              }, { upsert: true })
            return
          }
          client.channels.cache.get(data.channel).send({
            embed: {
              color: 4964331,
              author: {
                name: author.tag,
                iconURL: author.avatarURL()
              },
              description: newmessage,
              footer: {
                iconURL: user.rankimage,
                text: user.rank
              }
            }
          }).catch(error => {
            Shards.collection('1').deleteOne({
              channel: data.channel
            })
            servers.updateOne({
              id: data.id
            }, {
                $set: {
                  verified: "false",
                  agree: "false",
                  connected: "0",
                  shard: "1"
                }
              }, { upsert: true })
          })
        })
        return
      }

      if (user.rank === "Verified User") {
        cooldown.add(author.id);
        setTimeout(() => {
          cooldown.delete(author.id)
        }, 1000)
        Shards.collection('1').find().forEach(data => {
          if (client.channels.cache.get(data.channel) == undefined) {
            Shards.collection('1').deleteOne({
              channel: data.channel
            })
            servers.updateOne({
              id: data.id
            }, {
                $set: {
                  verified: "false",
                  agree: "false",
                  connected: "0",
                  shard: "1"
                }
              }, { upsert: true })
            return
          }
          client.channels.cache.get(data.channel).send({
            embed: {
              color: 4964331,
              author: {
                name: author.tag,
                iconURL: author.avatarURL()
              },
              description: newmessage,
              footer: {
                iconURL: user.rankimage,
                text: user.rank
              }
            }
          }).catch(error => {
            Shards.collection('1').deleteOne({
              channel: data.channel
            })
            servers.updateOne({
              id: data.id
            }, {
                $set: {
                  verified: "false",
                  agree: "false",
                  connected: "0",
                  shard: "1"
                }
              }, { upsert: true })
          })
        })
        return
      }

      cooldown.add(author.id);
      setTimeout(() => {
        cooldown.delete(author.id)
      }, 2500)
      if (user.banned === "true") {
        author.send("Hey! You are banned from global chat! Please join our support server if you want to appeal!")
        return
      }
      if (newmessage.includes("http")) {
        author.send("Hey! We don't allow links in global chat!")
        return
      }
      Shards.collection('1').find().forEach(data => {
        if (client.channels.cache.get(data.channel) == undefined) {
          Shards.collection('1').deleteOne({
            channel: data.channel
          })
          servers.updateOne({
            id: data.id
          }, {
              $set: {
                verified: "false",
                agree: "false",
                connected: "0",
                shard: "1"
              }
            }, { upsert: true })
          return
        }
        client.channels.cache.get(data.channel).send({
          embed: {
            color: 4964331,
            author: {
              name: author.tag,
              iconURL: author.avatarURL()
            },
            description: newmessage,
            footer: {
              iconURL: user.rankimage,
              text: user.rank
            }
          }
        }).catch(error => {
          Shards.collection('1').deleteOne({
            channel: data.channel
          })
          servers.updateOne({
            id: data.id
          }, {
              $set: {
                verified: "false",
                agree: "false",
                connected: "0",
                shard: "1"
              }
            }, { upsert: true })
        })
      })
    })
  }

  client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(client.user.tag + " online in " + client.guilds.cache.size + " guilds!")
    console.log(client.user.tag + " used by " + client.users.cache.size + " users!");
    client.user.setPresence({
      status: "online", //idle, invisible, dnd
      activity: {
        name: client.users.cache.size + " users do gc!help",
        type: "WATCHING"
      }
    });
  });

  client.on("guildCreate", (guild) => {
    client.channels.cache.get('749029605092098058').send(`I joined a new server!\nServer Name: ${guild.name}\nServer ID: ${guild.id}\nServer Size: ${guild.memberCount}\nOwner: ${guild.owner}`)
    guild.owner.send(`Thanks for inviting me to ${guild.name}! I link channels from other servers on discord to your server! To connect do the command gc!connect in the channel you want the bot to connect to!`)
  })
  client.on("guildDelete", (guild) => {
    client.channels.cache.get('749029605092098058').send(`I left a server!\nServer Name:${guild.name}\nServer ID: ${guild.id}`)
    //guild.owner.send(`Why did you kick me from ${guild.name}? I cri, :( To support the developer please give some feedback in <#749382758685606028> in https://discord.gg/dSWnwb3`)
  })
  client.on("message", async (message) => {
    if (message.author.bot) {
      return
    }
    if (message.channel.type === "dm") {
      message.channel.send("Hey! Commands don't work in DMs!")
      return
    }

    if (!(message.content.startsWith("gc!"))) {
      let connected = await Shards.collection('1').findOne({ channel: message.channel.id })
      if (connected == null) return;
      if (message.attachments.first() != undefined) {
        console.log("attachment recieved!")
        servers.findOne({
          id: message.guild.id
        }).then(server => {
          if (server.agree !== "true") {
            message.channel.send("You haven't agreed to our rules, they are listed as followed:\n1.No Types Of Spamming\n2.Use Common Sense\n3.No NSFW\nDo the command gc!agree if you agree to the rules\n*they may be changed at any time without notice.")
            return
          }
          attachmentmessage(message, message.author)
          /*
          axios.post("https://blobchat.shamim97.repl.co/sendmsg", {
            message: message.content,
            author: message.author,
            guild: message.guild,
            channel: message.channel
          })
          */
        })
        return
      }
      servers.findOne({
        id: message.guild.id
      }).then(server => {
        if (server.agree !== "true") {
          message.channel.send("You haven't agreed to our rules, they are listed as followed:\n1.No Types Of Spamming\n2.Use Common Sense\n3.No NSFW\nDo the command gc!agree if you agree to the rules\n*they may be changed at any time without notice.")
          return
        }
        sendmessage(message, message.author)
        /*
        axios.post("https://blobchat.shamim97.repl.co/sendmsg", {
          message: message.content,
          author: message.author,
          guild: message.guild,
          channel: message.channel
        })
        */
        message.delete()
      })
      return
    }

    const args = message.content.slice("gc!".length).split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === "agree") {
      if (!(message.member.hasPermission('ADMINISTRATOR'))) {
        message.channel.send(`You need to have admin permissions to use ${command}!`)
        return
      }
      servers.findOne({
        id: message.guild.id
      }).then(data => {
        if (data.agree === "true") {
          message.channel.send("You already agreed to our terms of service!")
          return
        }

        servers.updateOne({
          id: message.guild.id
        }, {
            $set: {
              agree: "true"
            }
          }, { upsert: true })
        message.channel.send("Terms of service agreed!")

      })
      return
    }

    else if (command === "connect") {
      if (!(message.member.hasPermission('ADMINISTRATOR'))) {
        message.channel.send(`You need to have admin permissions to use ${command}!`)
        return
      }
      servers.findOne({
        id: message.guild.id
      }).then(data => {
        if (data == null) {
          servers.updateOne({
            id: message.guild.id
          }, {
              $set: {
                verified: "false",
                agree: "false",
                connected: "0",
                shard: "1"
              }
            }, { upsert: true }).then(smth => {
              Shards.collection('1').updateOne({
                id: message.guild.id
              }, {
                  $set: {
                    channel: message.channel.id
                  }
                }, { upsert: true })
              systemmessage(`Welcome **${message.guild.name}** to global chat!`, client.user)
              logaction(`${message.channel.id} was connected`, message.author)
              servers.updateOne({
                id: message.guild.id
              }, {
                  $set: {
                    connected: "1"
                  }
                }, { upsert: true })
            })
          return
        }
        if (data.connected === "1") {
          message.channel.send("Your server already have a channel connected! Please disconnect that channel with gc!disconnect first before connecting a new channel!")
          return
        }

        Shards.collection('1').updateOne({
          id: message.guild.id
        }, {
            $set: {
              channel: message.channel.id
            }
          }, { upsert: true })
        systemmessage(`Welcome **${message.guild.name}** to global chat!`, client.user)
        logaction(`${message.channel.id} was connected`, message.author)
        servers.updateOne({
          id: message.guild.id
        }, {
            $set: {
              connected: "1"
            }
          }, { upsert: true })


      })
      return
    }


    else if (command === "devconnect") {
      users.findOne({
        id: message.author.id
      }).then(dev => {
        if (dev.rank !== "Developer") {
          message.channel.send("Only developers can use this command!")
          return
        }
        servers.findOne({
          id: message.guild.id
        }).then(data => {
          if (data == null) {
            servers.updateOne({
              id: message.guild.id
            }, {
                $set: {
                  verified: "false",
                  agree: "false",
                  connected: "0",
                  shard: "1"
                }
              }, { upsert: true }).then(smth => {
                setTimeout(() => {
                  if (data.connected === "1") {
                    message.channel.send("Your server already have a channel connected! Please disconnect that channel with gc!disconnect first before connecting a new channel!")
                    return
                  }

                  Shards.collection('1').updateOne({
                    id: message.guild.id
                  }, {
                      $set: {
                        channel: message.channel.id
                      }
                    }, { upsert: true })
                  systemmessage(`Welcome **${message.guild.name}** to global chat!`, client.user)
                  logaction(`${message.channel.id} was connected`, message.author)
                  servers.updateOne({
                    id: message.guild.id
                  }, {
                      $set: {
                        connected: "1"
                      }
                    }, { upsert: true })
                }, 250)
              })
            return
          }

          if (data.connected === "1") {
            message.channel.send("Your server already have a channel connected! Please disconnect that channel with gc!disconnect first before connecting a new channel!")
            return
          }

          Shards.collection('1').updateOne({
            id: message.guild.id
          }, {
              $set: {
                channel: message.channel.id
              }
            }, { upsert: true })
          systemmessage(`Welcome **${message.guild.name}** to global chat!`, client.user)
          logaction(`${message.channel.id} was connected`, message.author)
          servers.updateOne({
            id: message.guild.id
          }, {
              $set: {
                connected: "1"
              }
            }, { upsert: true })

        })
      })
      return
    }

    else if (command === "devdisconnect") {
      if (!args.length) {
        users.findOne({
          id: message.author.id
        }).then(dev => {
          if (dev.rank !== "Developer") {
            message.channel.send("Only developers can use this command!")
            return
          }
          servers.findOne({
            id: message.guild.id
          }).then(data => {
            if (data == null) {
              servers.updateOne({
                id: message.guild.id
              }, {
                  $set: {
                    verified: "false",
                    agree: "false",
                    connected: "0",
                    shard: "1"
                  }
                }, { upsert: true })
              return
            }
            if (data.connected !== "1") {
              message.channel.send("Your server does not have a channel to disconnect!")
              return
            }

            Shards.collection('1').deleteOne({
              id: message.guild.id
            })
            systemmessage(`**${message.guild.name}** has disconnected from global chat! :(`, client.user)
            logaction(`${message.channel.id} was disconnected`, message.author)
            servers.updateOne({
              id: message.guild.id
            }, {
                $set: {
                  connected: "0"
                }
              }, { upsert: true })
            message.channel.send("Disconnected!")
          })
        })
        return
      }

      let channel = args[0]
      users.findOne({
        id: message.author.id
      }).then(dev => {
        if (dev.rank !== "Developer") {
          message.channel.send("Only developers can use this command!")
          return
        }

        Shards.collection('1').findOne({
          channel: channel
        }).then(data => {
          if (data == null) {
            message.channel.send("Channel not found or connected!")
            return
          }
          Shards.collection('1').deleteOne({
            channel: data.channel
          })
          systemmessage(`**${client.guilds.cache.get(data.id).name}** has disconnected from global chat! :(`, client.user)
          logaction(`${data.channel} was disconnected`, message.author)
          servers.updateOne({
            id: data.id
          }, {
              $set: {
                connected: "0"
              }
            }, { upsert: true })
          message.channel.send("Disconnected!")
        })

      })

    }

    else if (command === "disconnect") {
      if (!(message.member.hasPermission('ADMINISTRATOR'))) {
        message.channel.send(`You need to have admin permissions to use ${command}!`)
        return
      }
      servers.findOne({
        id: message.guild.id
      }).then(data => {
        if (data == null) {
          servers.updateOne({
            id: message.guild.id
          }, {
              $set: {
                verified: "false",
                agree: "false",
                connected: "0",
                shard: "1"
              }
            }, { upsert: true })
          return
        }
        if (data.connected !== "1") {
          message.channel.send("Your server does not have a channel to disconnect!")
          return
        }

        Shards.collection('1').deleteOne({
          id: message.guild.id
        })
        systemmessage(`**${message.guild.name}** has disconnected from global chat! :(`, client.user)
        logaction(`${message.channel.id} was disconnected`, message.author)
        servers.updateOne({
          id: message.guild.id
        }, {
            $set: {
              connected: "0"
            }
          }, { upsert: true })
        message.channel.send("Disconnected!")
      })
      return
    }

    else if (command === "systemmessage") {
      users.findOne({
        id: message.author.id
      }).then(data => {
        if (data.rank !== "Developer") {
          message.channel.send("Only developers can assign new mods!")
          return
        }
        systemmessage(args.slice(0).join(' '), client.user)
      })
      return
    }

    else if (command === "newdev") {
      if (message.author.id !== "747216295417872424") {
        message.channel.send("You do not have permission to set a new developer!")
        return
      }
      if (!args.length) {
        message.channel.send("Provide a user id to give developer to!")
        return
      }
      users.updateOne({
        id: args[0]
      }, {
          $set: {
            rank: "Developer",
            rankimage: "https://cdn.discordapp.com/emojis/792989145793298462.png?v=1"
          }
        }, { upsert: true })
      message.channel.send("Updated!")
      return
    }

    else if (command === "newmod") {
      if (!args.length) {
        message.channel.send("Provide a user id to give chat moderator to!")
        return
      }
      users.findOne({
        id: message.author.id
      }).then(data => {
        if (data.rank !== "Developer") {
          message.channel.send("Only developers can assign new mods!")
          return
        }

        users.updateOne({
          id: args[0]
        }, {
            $set: {
              rank: "Chat Moderator",
              rankimage: "https://cdn.discordapp.com/emojis/792989389038813195.png?v=1",
              banned: "false"
            }
          }, { upsert: true })
        message.channel.send("Updated!")

      })
      return
    }

    else if (command === "retiredmod") {
      if (!args.length) {
        message.channel.send("Provide a user id to give chat moderator to!")
        return
      }
      users.findOne({
        id: message.author.id
      }).then(data => {
        if (data.rank !== "Developer") {
          message.channel.send("Only developers can assign new mods!")
          return
        }

        users.updateOne({
          id: args[0]
        }, {
            $set: {
              rank: "Retired Chat Moderator",
              rankimage: "https://cdn.discordapp.com/emojis/792989389038813195.png?v=1"
            }
          }, { upsert: true })
        message.channel.send("Updated!")

      })
      return
    }


    else if (command === "ban") {
      if (!args.length) {
        message.channel.send("gc!ban <mention>")
        return
      }
      let mention = message.mentions.members.first()
      if (!mention) {
        users.findOne({
          id: message.author.id
        }).then(data => {
          if (data.rank === "Developer") {
            users.updateOne({
              id: args[0]
            }, {
                $set: {
                  banned: "true"
                }
              }, { upsert: true })
            message.channel.send("Updated!")
            return
          }
          if (data.rank !== "Chat Moderator") {
            message.channel.send("Only chat moderators can ban people!")
            return
          }
          users.updateOne({
            id: args[0]
          }, {
              $set: {
                banned: "true"
              }
            }, { upsert: true })
          message.channel.send("Updated!")
        })
        return
      }
      users.findOne({
        id: message.author.id
      }).then(data => {
        if (data.rank === "Developer") {
          users.updateOne({
            id: mention.id
          }, {
              $set: {
                banned: "true"
              }
            }, { upsert: true })
          message.channel.send("Updated!")
          return
        }
        if (data.rank !== "Chat Moderator") {
          message.channel.send("Only chat moderators can ban people!")
          return
        }
        users.updateOne({
          id: mention.id
        }, {
            $set: {
              banned: "true"
            }
          }, { upsert: true })
        message.channel.send("Updated!")
      })
      return
    }

    else if (command === "tagban") {
      if (!args.length) {
        message.channel.send("gc!tagban <tag>")
        return
      }
      let tag = args[0]
      let user = client.users.cache.filter(tagusers => tagusers.tag == tag).first()
      if (user == undefined) {
        message.channel.send("User not found!")
        return
      }
      users.findOne({
        id: message.author.id
      }).then(data => {
        if (data.rank === "Developer") {
          users.updateOne({
            id: user.id
          }, {
              $set: {
                banned: "true"
              }
            }, { upsert: true })
          message.channel.send("Updated!")
          return
        }
        if (data.rank !== "Chat Moderator") {
          message.channel.send("Only chat moderators can ban people!")
          return
        }
        users.updateOne({
          id: user.id
        }, {
            $set: {
              banned: "true"
            }
          }, { upsert: true })
        message.channel.send("Updated!")
      })
      return
    }

    else if (command === "tagunban") {
      if (!args.length) {
        message.channel.send("gc!tagunban <tag>")
        return
      }
      let tag = args[0]
      let user = client.users.cache.filter(tagusers => tagusers.tag == tag).first()
      if (user == undefined) {
        message.channel.send("User not found!")
        return
      }
      users.findOne({
        id: message.author.id
      }).then(data => {
        if (data.rank === "Developer") {
          users.updateOne({
            id: user.id
          }, {
              $set: {
                banned: "false"
              }
            }, { upsert: true })
          message.channel.send("Updated!")
          return
        }
        if (data.rank !== "Chat Moderator") {
          message.channel.send("Only chat moderators can unban people!")
          return
        }
        users.updateOne({
          id: user.id
        }, {
            $set: {
              banned: "false"
            }
          }, { upsert: true })
        message.channel.send("Updated!")
      })
      return
    }

    else if (command === "unban") {
      if (!args.length) {
        message.channel.send("gc!unban <mention>")
        return
      }
      let mention = message.mentions.members.first()
      if (!mention) {
        message.channel.send("Please mention the user!")
        return
      }
      users.findOne({
        id: message.author.id
      }).then(data => {
        if (data.rank === "Developer") {
          users.updateOne({
            id: mention.id
          }, {
              $set: {
                banned: "false"
              }
            }, { upsert: true })
          message.channel.send("Updated!")
          return
        }
        if (data.rank !== "Chat Moderator") {
          message.channel.send("Only chat moderators can unban people!")
          return
        }
        users.updateOne({
          id: mention.id
        }, {
            $set: {
              banned: "false"
            }
          }, { upsert: true })
        message.channel.send("Updated!")
      })
      return
    }

    else if (command === 'ping') {
      message.channel.send("Pinging ...") // Placeholder for pinging ... 
        .then((msg) => { // Resolve promise
          msg.edit("Pong: " + (Date.now() - msg.createdTimestamp) + "ms")
        });
    }

    else if (command === 'support') {
      message.channel.send("Support Server: https://discord.gg/dSWnwb3")
    }

    else if (command === 'help') {
      message.channel.send({
        embed: {
          title: "Help Commands",
          description: "Prefix: **gc!**",
          color: 4964331,
          fields: [
            {
              name: "help",
              value: "help command",
              inline: true
            },
            {
              name: "ping",
              value: "Check the bot ping!",
              inline: true
            },
            {
              name: "connect",
              value: "connect a channel to global chat",
              inline: true
            },
            {
              name: "disconnect",
              value: "disconnect a channel from global chat",
              inline: true
            },
            {
              name: "globalchatcount",
              value: "Check how many channels are connected to global chat!",
              inline: true
            }
          ]
        }
      })
    }

    else if (command === "globalchatcount") {
      Shards.collection('1').countDocuments().then(data => {
        message.channel.send(`There are currently **${data}** channels connected to global chat!`)
      })
    }

    else if (command === "channelsconnected") {
      users.findOne({
        id: message.author.id
      }).then(dev => {
        if (dev.rank !== "Developer") {
          message.channel.send("Only developers can use this command!")
          return
        }
        let connected = []
        Shards.collection('1').find().forEach(data => {
          if (client.guilds.cache.get(data.id) == undefined) {
            connected.push({
              name: "|Unknown Name|",
              value: data.channel
            });
            return
          }
          connected.push({
            name: client.guilds.cache.get(data.id).name,
            value: data.channel
          });
        })
        setTimeout(() => {
          arrayChunks(connected, 25, function(err, chunks) {
            let timeout = 0
            chunks.forEach(chunk => {
              setTimeout(() => {
                timeout++
                message.channel.send({
                  embed: {
                    title: "Channels Connected",
                    fields: chunk
                  }
                })
              }, timeout * 1000)
            })
          })
        }, 250)
      })
    }

    else if (command === "databasesize") {
      users.findOne({
        id: message.author.id
      }).then(dev => {
        if (dev.rank !== "Developer") {
          message.channel.send("Only developers can use this command!")
          return
        }
        Database.stats().then(stats => {
          Shards.stats().then(stats2 => {
            let addeddatasize = stats.dataSize + stats2.dataSize
            let datasize = addeddatasize / 1024
            message.channel.send({
              embed: {
                title: "Database Size",
                description: `${datasize}KB out of 512MB`
              }
            })
          })
        })
      })
    }

    else if (command === "currentmods") {
      users.findOne({
        id: message.author.id
      }).then(dev => {
        if (dev.rank !== "Developer") {
          message.channel.send("Only developers can use this command!")
          return
        }
        let mods = []
        users.find().forEach(data => {
          if (data.rank === "Chat Moderator") {
            mods.push({
              name: client.users.cache.get(data.id).tag,
              value: data.id
            });
          }
        })
        setTimeout(() => {
          arrayChunks(mods, 25, function(err, chunks) {
            let timeout = 0
            chunks.forEach(chunk => {
              setTimeout(() => {
                timeout++
                message.channel.send({
                  embed: {
                    title: "All Chat Moderators",
                    fields: chunk
                  }
                })
              }, timeout * 1000)
            })
          })
        }, 250)
      })
    }

    else if (command === "logs") {
      users.findOne({
        id: message.author.id
      }).then(dev => {
        if (dev.rank !== "Developer") {
          message.channel.send("Only developers can use this command!")
          return
        }
        let reslogs = []
        logs.find().forEach(data => {
          let date = new Date(data.timestamp);
          let hours = date.getHours();
          let minutes = "0" + date.getMinutes();
          let seconds = "0" + date.getSeconds();
          let formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
          reslogs.push({
            name: client.users.cache.get(data.id).tag + ` | ${data.id}`,
            value: data.action + ` at ${formattedTime}`
          });
        });
        setTimeout(() => {
          arrayChunks(reslogs, 25, function(err, chunks) {
            let timeout = 0
            chunks.forEach(chunk => {
              setTimeout(() => {
                timeout++
                message.channel.send({
                  embed: {
                    title: "Logs for the past 24 hours!",
                    description: "All logs past 24 hours are automatically deleted.",
                    fields: chunk
                  }
                })
              }, timeout * 1000)
            })
          })
        }, 250)
      })
    }

    else if (command === "invite") {
      message.channel.send("https://discord.com/api/oauth2/authorize?client_id=795789348846305290&permissions=388160&scope=bot")
    }

    else if (command === "devcommands") {
      message.channel.send("**Dev Commands**\nnewmod\nretiredmod\ndatabasesize\neval\ncurrentmods\nchannelsconnected\nlogs\ndevconnect\ndevdisconnect\nverifyuser\nunverifyuser\ntagverifyuser\ntagunverifyuser")
    }

    else if (command === "verifyuser") {
      users.findOne({
        id: message.author.id
      }).then(dev => {
        if (dev.rank !== "Developer") {
          message.channel.send("Only developers can use this command!")
          return
        }
        if (!args.length) {
          message.channel.send("gc!verifyuser <user> or gc!tagverifyuser")
          return
        }
        users.updateOne({
          id: args[0]
        }, {
            $set: {
              rank: "Verified User",
              rankimage: "https://cdn.discordapp.com/emojis/798416904632664124.png?v=1",
              banned: "false"
            }
          }, { upsert: true })
        message.channel.send("Updated!")
      })
    }

    else if (command === "tagverifyuser") {
      users.findOne({
        id: message.author.id
      }).then(dev => {
        if (dev.rank !== "Developer") {
          message.channel.send("Only developers can use this command!")
          return
        }
        if (!args.length) {
          message.channel.send("gc!verifyuser <user> or gc!tagverifyuser")
          return
        }
        let tag = args[0]
        let user = client.users.cache.filter(tagusers => tagusers.tag == tag).first()
        if (user == undefined) {
          message.channel.send("User not found!")
          return
        }
        users.updateOne({
          id: user.id
        }, {
            $set: {
              rank: "Verified User",
              rankimage: "https://cdn.discordapp.com/emojis/798416904632664124.png?v=1",
              banned: "false"
            }
          }, { upsert: true })
        message.channel.send("Updated!")
      })
    }

    else if (command === "unverifyuser") {
      users.findOne({
        id: message.author.id
      }).then(dev => {
        if (dev.rank !== "Developer") {
          message.channel.send("Only developers can use this command!")
          return
        }
        if (!args.length) {
          message.channel.send("gc!unverifyuser <user> or gc!tagunverifyuser")
          return
        }
        users.updateOne({
          id: args[0]
        }, {
            $set: {
              rank: "User",
              rankimage: "https://cdn.discordapp.com/emojis/661003964707242021.png?v=1",
              banned: "false"
            }
          }, { upsert: true })
        message.channel.send("Updated!")
      })
    }

    else if (command === "tagunverifyuser") {
      users.findOne({
        id: message.author.id
      }).then(dev => {
        if (dev.rank !== "Developer") {
          message.channel.send("Only developers can use this command!")
          return
        }
        if (!args.length) {
          message.channel.send("gc!unverifyuser <user> or gc!tagunverifyuser")
          return
        }
        let tag = args[0]
        let user = client.users.cache.filter(tagusers => tagusers.tag == tag).first()
        if (user == undefined) {
          message.channel.send("User not found!")
          return
        }
        users.updateOne({
          id: user.id
        }, {
            $set: {
              rank: "User",
              rankimage: "https://cdn.discordapp.com/emojis/661003964707242021.png?v=1",
              banned: "false"
            }
          }, { upsert: true })
        message.channel.send("Updated!")
      })
    }


    else if (command === "eval") {
      if (args[0] === "client.token") {
        axios.get("https://some-random-api.ml/bottoken").then(res => {
          message.channel.send(`||${res.data.token}.FAKE.THISISAPRANK||`).then(msg => {
            setTimeout(() => {
              msg.edit("Wait, are you trying to hack me?!").then(msg2 => {
                setTimeout(() => {
                  msg2.edit("Nice try...")
                }, 1000)
              })
            }, 1000)
          })
        })
        return
      }
      if (message.author.id !== "816041207113187348") {
        message.reply("You can't use this command!")
        return
      }
      if (!args[0]) {
        return message.reply('kod girmelisin')
      }
      const code = args.join(' ');
      function clean(text) {
        if (typeof text !== 'string')
          text = require('util').inspect(text, { depth: 0 })
        text = text
          .replace(/`/g, '`' + String.fromCharCode(8203))
          .replace(/@/g, '@' + String.fromCharCode(8203))
        return text;
      };
      const evalEmbed = new Discord.MessageEmbed().setColor('RANDOM')
      try {
        var evaled = clean(eval(code));
        if (evaled.startsWith('NDc4O')) evaled = tokenuyari;
        if (evaled.constructor.name === 'Promise') evalEmbed.setDescription(`\`\`\`\n${evaled}\n\`\`\``)
        else evalEmbed.setDescription(`\`\`\`xl\n${evaled}\n\`\`\``)
        const newEmbed = new Discord.MessageEmbed()
          .addField('📥 Input', `\`\`\`javascript\n${code}\n\`\`\``)
          .addField('📤 Output', `\`\`\`xl\n${evaled}\`\`\``)
          .setColor('RANDOM')
        message.reply(newEmbed);
      }
      catch (err) {
        evalEmbed.addField('Error', `\`\`\`xl\n${err}\n\`\`\``);
        evalEmbed.setColor('#FF0000');
        message.reply(evalEmbed);
      }
    }

  })

  client.login(process.env.TOKEN)
})
