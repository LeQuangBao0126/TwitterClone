import 'dotenv/config'
import express from 'express'
import usersRouter from './routes/users.routes'
import databaseService from '~/services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediasRouter from './routes/medias.routes'
import staticRouter from './routes/statics.routes'
import { initFolder } from './utils/file'
import { UPLOAD_VIDEO_DIR } from './constants/dir'
import cors from 'cors'
import { envConfig } from '~/constants/config'
import tweetRouter from './routes/tweets.routes'
import bookmartRouter from './routes/bookmarks.routes'

import searchRouter from './routes/search.route'
import { createServer } from 'http'
import '~/utils/s3'

import conversationRoutes from './routes/conversations.routes'
import { initialSocket } from '~/utils/socket'
import swaggerUi from 'swagger-ui-express'
import fs from 'fs'
import YAML from 'yaml'

const app = express()
const port = envConfig.APP_PORT

const httpServer = createServer(app)

// Tạo folder upload
initFolder()
//  gen swagger endpoint load file vào
const file = fs.readFileSync('./twitter-swagger.yaml', 'utf8')
const swaggerDocument = YAML.parse(file)

//

// const options: swaggerJsdoc.Options = {
//   definition: {
//     openapi: '3.0.0',
//     info: {
//       title: 'Hello World',
//       version: '1.0.0'
//     }
//   },
//   apis: ['./src/routes/*.routes.ts'] // files containing annotations as above
// }
//const openapiSpecification = swaggerJsdoc(options)

databaseService
  .connect()
  .then((_) => databaseService.indexUsers())
  .then((_) => {
    app.use(
      cors({
        origin: '*'
      })
    )
    app.use(express.json())
    app.get('/hc', (req, res) => {
      return res.json('Server is ready')
    })
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
    app.use('/users', usersRouter)
    app.use('/medias', mediasRouter)
    app.use('/tweets', tweetRouter)
    app.use('/bookmarks', bookmartRouter)
    app.use('/search', searchRouter)
    app.use('/conversations', conversationRoutes)
    //app.use('/statics', express.static(UPLOAD_IMAGE_DIR))
    app.use('/static', staticRouter)
    app.use('/static/video', express.static(UPLOAD_VIDEO_DIR))

    app.use(defaultErrorHandler)
    //web socket
    initialSocket(httpServer)
    httpServer.listen(envConfig.APP_PORT, () => {
      console.log(`App running in host ${envConfig.APP_HOST} :::: port ${port}`)
    })
  })
  .catch((err) => {
    console.log(err)
  })

//w6XihFfjoVhuxJhV database pass dbname twitter-dev
//mongodb+srv://quangbao01268183903:w6XihFfjoVhuxJhV@twitter-dev.eyatwzk.mongodb.net/
