import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { defineNuxtModule, addPlugin } from '@nuxt/kit'
import { MongoClient } from "mongodb";
import { Server } from "socket.io";

export interface ModuleOptions {
  mongodb: (mongoClient: MongoClient) => void,
  socket: (io: Server) => void
}

const {
  MONGODB_CONNECTION_STRING = 'mongodb://localhost:27017'
} = process.env;

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-internal-sctc',
    configKey: 'sctc'
  },
  defaults: {
    mongodb: () => { },
    socket: () => { }
  },
  async setup(options, nuxt) {
    if (!options.mongodb) {
      await nuxt.close()
      throw new Error("Please provide the mongodb function to sct config key.");
    }

    if (!options.socket) {
      await nuxt.close()
      throw new Error("Please provide the socket function to sctc config key.");
    }

    nuxt.hook('listen', (server) => {
      MongoClient.connect(MONGODB_CONNECTION_STRING)
        .then((mongoClient) => {
          options.mongodb(mongoClient)
          console.log('Connected to mongodb.')
          const io = new Server(server);
          options.socket(io)
        })
        .catch(async (err) => {
          console.log(err)
          await nuxt.close()
          throw new Error("Failed to connect to mongodb.");
        })
    })

    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
    nuxt.options.build.transpile.push(runtimeDir)
    addPlugin({
      src: resolve(runtimeDir, 'plugin'),
      mode: 'client',
    })

  }
})
